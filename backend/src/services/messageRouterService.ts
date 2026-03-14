import axios from 'axios';
import { prisma } from '../database/prisma';
import { appService } from './appService';
import { logger } from '../config/logger';

export const messageRouterService = {
  extractKeyword(message: string): string {
    return message.trim().split(/\s+/)[0]?.toUpperCase() ?? '';
  },

  extractCommand(message: string): string {
    const [, ...rest] = message.trim().split(/\s+/);
    return rest.join(' ').trim();
  },

  async routeIncomingMessage(mobile: string, message: string): Promise<void> {
    const keyword = this.extractKeyword(message);
    const command = this.extractCommand(message);
    const app = await appService.findByKeyword(keyword);

    await prisma.messageLog.create({
      data: {
        mobile,
        message,
        direction: 'incoming',
        app: app?.keyword ?? 'UNROUTED',
        status: app ? 'routed' : 'unrouted'
      }
    });

    if (!app || !app.isActive) {
      logger.warn('No active app matched for message', { mobile, keyword });
      return;
    }

    await prisma.conversation.upsert({
      where: { mobile_appId: { mobile, appId: app.id } },
      update: { lastMessage: message },
      create: { mobile, appId: app.id, lastMessage: message }
    });

    await axios.post(app.endpoint, {
      mobile,
      message,
      keyword,
      command,
      trigger: {
        keyword,
        command,
        fullText: message
      }
    }, { timeout: 8000 });
    logger.info('Message forwarded to app endpoint', { app: app.keyword, mobile, endpoint: app.endpoint });
  }
};
