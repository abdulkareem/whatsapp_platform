import axios from 'axios';
import { prisma } from '../database/prisma';
import { appService } from './appService';
import { logger } from '../config/logger';

type RouteStatus = 'routed' | 'unrouted' | 'inactive';

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

  async routeIncomingMessage(mobile: string, message: string): Promise<void> {
    const keyword = this.extractKeyword(message);
    const command = this.extractCommand(message);
    const app = await appService.findByKeyword(keyword);

    const status: RouteStatus = !app ? 'unrouted' : app.isActive ? 'routed' : 'inactive';

    logger.info('Routing inbound message', {
      mobile,
      keyword,
      command: command || null,
      matchedApp: app?.keyword ?? null,
      appActive: app?.isActive ?? false,
      status
    });

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
      logger.warn('No app matched for inbound keyword', { mobile, keyword });
      return;
    }

    if (!app.isActive) {
      logger.warn('Matched app is inactive; inbound message not forwarded', {
        mobile,
        keyword,
        app: app.keyword
      });
      return;
    }

    await prisma.conversation.upsert({
      where: { mobile_appId: { mobile, appId: app.id } },
      update: { lastMessage: message },
      create: { mobile, appId: app.id, lastMessage: message }
    });

    await axios.post(
      app.endpoint,
      {
        mobile,
        message,
        keyword,
        command,
        trigger: {
          keyword,
          command,
          fullText: message
        }
      },
      { timeout: 8000 }
    );

    logger.info('Message forwarded to app endpoint', {
      app: app.keyword,
      appId: app.id,
      mobile,
      keyword,
      command: command || null
    });
  }
};
