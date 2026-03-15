import axios from 'axios';
import { prisma } from '../database/prisma';
import { appService } from './appService';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { whatsappService } from './whatsappService';

type RouteStatus = 'routed' | 'unrouted' | 'inactive' | 'fallback_sent';

interface RouteResult {
  status: RouteStatus;
  routedAppId?: number;
  routedKeyword?: string;
  routedRateLimitRpm?: number;
}

interface RoutingOptions {
  messageId?: string;
  beforeForward?: (appId: number, rateLimitRpm: number) => Promise<void>;
}

export const messageRouterService = {
  normalizeKeyword(token: string): string {
    return token.replace(/[^A-Z0-9_]/gi, '').toUpperCase();
  },

  extractKeyword(message: string): string {
    const firstToken = message.trim().split(/\s+/)[0] ?? '';
    return this.normalizeKeyword(firstToken);
  },

  extractCommand(message: string): string {
    const [, ...rest] = message.trim().split(/\s+/);
    return rest.join(' ').trim();
  },

  async findActiveSession(mobile: string) {
    return prisma.conversation.findFirst({
      where: {
        mobile,
        sessionExpiresAt: { gt: new Date() },
        app: { isActive: true }
      },
      include: { app: true },
      orderBy: { updatedAt: 'desc' }
    });
  },

  async createOrRefreshSession(mobile: string, appId: number, message: string, sessionTimeoutMinutes: number) {
    const sessionExpiresAt = new Date(Date.now() + sessionTimeoutMinutes * 60_000);

    await prisma.conversation.upsert({
      where: { mobile_appId: { mobile, appId } },
      update: { lastMessage: message, sessionExpiresAt },
      create: { mobile, appId, lastMessage: message, sessionExpiresAt }
    });
  },

  async resolveRouteApp(mobile: string, message: string) {
    const keyword = this.extractKeyword(message);
    const command = this.extractCommand(message);

    const activeSession = await this.findActiveSession(mobile);
    if (activeSession?.app.sessionEnabled) {
      return {
        keyword,
        command,
        app: activeSession.app,
        via: 'session' as const
      };
    }

    const matchedApp = await appService.findByKeyword(keyword);
    if (matchedApp) {
      return {
        keyword,
        command,
        app: matchedApp,
        via: 'keyword' as const
      };
    }

    const defaultApp = await appService.findDefaultApp();
    if (defaultApp && !defaultApp.keywordRequired) {
      return {
        keyword,
        command,
        app: defaultApp,
        via: 'default' as const
      };
    }

    return {
      keyword,
      command,
      app: null,
      via: 'unrouted' as const
    };
  },

  async routeIncomingMessage(mobile: string, message: string, options: RoutingOptions = {}): Promise<RouteResult> {
    const startedAt = Date.now();
    const resolution = await this.resolveRouteApp(mobile, message);
    const app = resolution.app;

    const status: RouteStatus = !app
      ? 'unrouted'
      : app.isActive
      ? 'routed'
      : 'inactive';

    await prisma.messageLog.create({
      data: {
        mobile,
        message,
        direction: 'incoming',
        app: app?.keyword ?? 'UNROUTED',
        status
      }
    });

    if (!app) {
      const fallbackSource = await prisma.app.findFirst({
        where: {
          isActive: true,
          fallbackMessage: { not: null }
        },
        orderBy: [{ defaultApp: 'desc' }, { updatedAt: 'desc' }]
      });
      const fallbackMessage = fallbackSource?.fallbackMessage ?? 'No routing keyword was matched. Please send a supported keyword to continue.';
      await whatsappService.sendMessage(mobile, fallbackMessage);

      logger.warn('No app matched and no default app configured', {
        mobile,
        keyword: resolution.keyword,
        messageId: options.messageId
      });

      return { status: 'fallback_sent' };
    }

    if (!app.isActive) {
      logger.warn('Matched app is inactive; inbound message not forwarded', {
        mobile,
        keyword: resolution.keyword,
        app: app.keyword,
        messageId: options.messageId
      });

      if (app.fallbackMessage) {
        await whatsappService.sendMessage(mobile, app.fallbackMessage);
      }

      return { status: 'inactive' };
    }

    if (options.beforeForward) {
      await options.beforeForward(app.id, app.rateLimitRpm);
    }

    const effectiveTimeout = app.sessionTimeoutMinutes || env.SESSION_TIMEOUT_MINUTES;
    if (app.sessionEnabled) {
      await this.createOrRefreshSession(mobile, app.id, message, effectiveTimeout);
    }

    const payload = {
      mobile,
      message,
      keyword: resolution.keyword,
      command: resolution.command,
      messageId: options.messageId,
      routeMode: resolution.via,
      trigger: {
        keyword: resolution.keyword,
        command: resolution.command,
        fullText: message
      }
    };

    await axios.post(app.endpoint, payload, { timeout: 8000 });

    logger.info('Message forwarded to app endpoint', {
      app: app.keyword,
      appId: app.id,
      mobile,
      routeMode: resolution.via,
      latencyMs: Date.now() - startedAt
    });

    return {
      status: 'routed',
      routedAppId: app.id,
      routedKeyword: app.keyword,
      routedRateLimitRpm: app.rateLimitRpm
    };
  }
};
