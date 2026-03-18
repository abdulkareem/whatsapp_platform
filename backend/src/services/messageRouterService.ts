import axios from 'axios';
import { prisma } from '../database/prisma';
import { appService } from './appService';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { whatsappService } from './whatsappService';
import type { InboundLocationPayload } from '../queue/messageQueue';

type RouteStatus = 'routed' | 'unrouted' | 'inactive' | 'fallback_sent';

interface RouteResult {
  status: RouteStatus;
  routedAppId?: number;
  routedKeyword?: string;
  routedRateLimitRpm?: number;
}

interface RoutingOptions {
  messageId?: string;
  messageType?: string;
  location?: InboundLocationPayload;
  beforeForward?: (appId: number, rateLimitRpm: number) => Promise<void>;
}

const fallbackLocationErrorMessage = 'Unable to process location. Please resend.';


const getRoutingText = (message: string | undefined, location?: InboundLocationPayload) => {
  if (message?.trim()) {
    return message.trim();
  }

  if (location?.name?.trim()) {
    return location.name.trim();
  }

  if (location?.address?.trim()) {
    return location.address.trim();
  }

  return '';
};

const handleDownstreamResponse = async (mobile: string, responseData: unknown) => {
  logger.info('Response received from downstream app', { mobile, response: responseData });

  if (!responseData || typeof responseData !== 'object') {
    return;
  }

  const responseRecord = responseData as Record<string, unknown>;
  const responseType = responseRecord.type;

  if (responseType === 'location') {
    const rawLatitude = typeof responseRecord.latitude === 'string' ? Number(responseRecord.latitude) : responseRecord.latitude;
    const rawLongitude = typeof responseRecord.longitude === 'string' ? Number(responseRecord.longitude) : responseRecord.longitude;

    if (!Number.isFinite(rawLatitude) || !Number.isFinite(rawLongitude)) {
      logger.error('Downstream app returned malformed location response', { mobile, response: responseData });
      return;
    }

    await whatsappService.sendLocation(mobile, {
      latitude: rawLatitude as number,
      longitude: rawLongitude as number,
      name: typeof responseRecord.name === 'string' ? responseRecord.name : undefined,
      address: typeof responseRecord.address === 'string' ? responseRecord.address : undefined
    });
    return;
  }

  if (responseType === 'text' && typeof responseRecord.message === 'string' && responseRecord.message.trim()) {
    await whatsappService.sendMessage(mobile, responseRecord.message);
  }
};

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
    const routingText = getRoutingText(message, options.location);

    if (options.messageType === 'location' && !options.location) {
      logger.error('Inbound location payload missing coordinates', { mobile, messageId: options.messageId });
      await whatsappService.sendMessage(mobile, fallbackLocationErrorMessage);
      return { status: 'fallback_sent' };
    }

    const startedAt = Date.now();
    const resolution = await this.resolveRouteApp(mobile, routingText);
    const app = resolution.app;

    const status: RouteStatus = !app
      ? 'unrouted'
      : app.isActive
      ? 'routed'
      : 'inactive';

    await prisma.messageLog.create({
      data: {
        mobile,
        message: message || routingText || '[location]',
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
      await whatsappService.sendMessage(mobile, options.messageType === 'location' ? fallbackLocationErrorMessage : fallbackMessage);

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
      await this.createOrRefreshSession(mobile, app.id, routingText || '[location]', effectiveTimeout);
    }

    const payload = {
      mobile,
      message,
      type: options.messageType ?? 'text',
      keyword: resolution.keyword,
      command: resolution.command,
      messageId: options.messageId,
      routeMode: resolution.via,
      trigger: {
        keyword: resolution.keyword,
        command: resolution.command,
        fullText: routingText
      },
      ...(options.location
        ? {
            location: {
              type: 'location',
              latitude: options.location.latitude,
              longitude: options.location.longitude,
              name: options.location.name,
              address: options.location.address,
              user: mobile
            }
          }
        : {})
    };

    const downstreamResponse = await axios.post(app.endpoint, payload, { timeout: 8000 });

    logger.info('Message forwarded to app endpoint', {
      app: app.keyword,
      appId: app.id,
      mobile,
      routeMode: resolution.via,
      messageType: options.messageType ?? 'text',
      locationLatitude: options.location?.latitude,
      locationLongitude: options.location?.longitude,
      latencyMs: Date.now() - startedAt
    });

    await handleDownstreamResponse(mobile, downstreamResponse.data);

    return {
      status: 'routed',
      routedAppId: app.id,
      routedKeyword: app.keyword,
      routedRateLimitRpm: app.rateLimitRpm
    };
  }
};
