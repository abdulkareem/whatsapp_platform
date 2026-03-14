import { messageRouterService } from '../services/messageRouterService';

export const messageRouter = {
  route: messageRouterService.routeIncomingMessage.bind(messageRouterService)
};
