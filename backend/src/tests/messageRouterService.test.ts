import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { messageRouterService } from '../services/messageRouterService';
import { appService } from '../services/appService';
import { prisma } from '../database/prisma';
import { whatsappService } from '../services/whatsappService';

test('keyword extraction sanitizes first token and keeps remaining command', () => {
  assert.equal(messageRouterService.extractKeyword('  #order!!  open ticket now  '), 'ORDER');
  assert.equal(messageRouterService.extractCommand('  #order!!  open ticket now  '), 'open ticket now');
});

test('routeIncomingMessage marks unrouted without forwarding', async () => {
  const originalResolve = messageRouterService.resolveRouteApp;
  const originalFindFallback = prisma.app.findFirst;
  const originalCreate = prisma.messageLog.create;
  const originalPost = axios.post;
  const originalSend = whatsappService.sendMessage;

  let status: string | undefined;
  let forwarded = false;

  (messageRouterService as unknown as { resolveRouteApp: (...args: any[]) => Promise<any> }).resolveRouteApp = async () => ({
    keyword: 'UNKNOWN',
    command: 'please help',
    app: null,
    via: 'unrouted'
  });
  (prisma.app as unknown as { findFirst: (args: any) => Promise<unknown> }).findFirst = async () => null;
  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async (args: any) => {
    status = args.data.status;
    return { id: 1 } as never;
  };
  (axios as unknown as { post: (...args: any[]) => Promise<unknown> }).post = async () => {
    forwarded = true;
    return { data: {} };
  };
  (whatsappService as unknown as { sendMessage: (...args: any[]) => Promise<unknown> }).sendMessage = async () => ({ ok: true });

  await messageRouterService.routeIncomingMessage('12025550199', 'UNKNOWN please help');

  assert.equal(status, 'unrouted');
  assert.equal(forwarded, false);

  (messageRouterService as unknown as { resolveRouteApp: typeof originalResolve }).resolveRouteApp = originalResolve;
  (prisma.app as unknown as { findFirst: typeof originalFindFallback }).findFirst = originalFindFallback;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
  (axios as unknown as { post: typeof originalPost }).post = originalPost;
  (whatsappService as unknown as { sendMessage: typeof originalSend }).sendMessage = originalSend;
});

test('routeIncomingMessage forwards payload for active app', async () => {
  const originalResolve = messageRouterService.resolveRouteApp;
  const originalFindFallback = prisma.app.findFirst;
  const originalCreate = prisma.messageLog.create;
  const originalUpsert = prisma.conversation.upsert;
  const originalPost = axios.post;

  let status: string | undefined;
  let postedPayload: any;

  (messageRouterService as unknown as { resolveRouteApp: (...args: any[]) => Promise<any> }).resolveRouteApp = async () => ({
    keyword: 'ORDER',
    command: 'create shipment',
    app: {
      id: 3,
      keyword: 'ORDER',
      endpoint: 'https://partner.app/inbound',
      rateLimitRpm: 100,
      isActive: true,
      sessionEnabled: true,
      sessionTimeoutMinutes: 15
    },
    via: 'keyword'
  });

  (prisma.app as unknown as { findFirst: (args: any) => Promise<unknown> }).findFirst = async () => null;
  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async (args: any) => {
    status = args.data.status;
    return { id: 1 } as never;
  };
  (prisma.conversation as unknown as { upsert: (args: any) => Promise<unknown> }).upsert = async () => ({ id: 1 });
  (axios as unknown as { post: (...args: any[]) => Promise<unknown> }).post = async (_url: string, payload: unknown) => {
    postedPayload = payload;
    return { data: { ok: true } };
  };

  await messageRouterService.routeIncomingMessage('12025550199', 'order create shipment');

  assert.equal(status, 'routed');
  assert.equal(postedPayload.routeMode, 'keyword');
  assert.equal(postedPayload.keyword, 'ORDER');

  (messageRouterService as unknown as { resolveRouteApp: typeof originalResolve }).resolveRouteApp = originalResolve;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
  (prisma.conversation as unknown as { upsert: typeof originalUpsert }).upsert = originalUpsert;
  (axios as unknown as { post: typeof originalPost }).post = originalPost;
});


test('routeIncomingMessage forwards structured location payload for active app', async () => {
  const originalResolve = messageRouterService.resolveRouteApp;
  const originalFindFallback = prisma.app.findFirst;
  const originalCreate = prisma.messageLog.create;
  const originalUpsert = prisma.conversation.upsert;
  const originalPost = axios.post;

  let postedPayload: any;

  (messageRouterService as unknown as { resolveRouteApp: (...args: any[]) => Promise<any> }).resolveRouteApp = async () => ({
    keyword: 'ORDER',
    command: '',
    app: {
      id: 3,
      keyword: 'ORDER',
      endpoint: 'https://partner.app/inbound',
      rateLimitRpm: 100,
      isActive: true,
      sessionEnabled: true,
      sessionTimeoutMinutes: 15
    },
    via: 'session'
  });

  (prisma.app as unknown as { findFirst: (args: any) => Promise<unknown> }).findFirst = async () => null;
  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async () => ({ id: 1 } as never);
  (prisma.conversation as unknown as { upsert: (args: any) => Promise<unknown> }).upsert = async () => ({ id: 1 });
  (axios as unknown as { post: (...args: any[]) => Promise<unknown> }).post = async (_url: string, payload: unknown) => {
    postedPayload = payload;
    return { data: { ok: true } };
  };

  await messageRouterService.routeIncomingMessage('12025550199', '', {
    messageType: 'location',
    location: {
      latitude: 37.422,
      longitude: -122.084,
      name: 'Googleplex',
      address: '1600 Amphitheatre Parkway'
    }
  });

  assert.equal(postedPayload.type, 'location');
  assert.deepEqual(postedPayload.location, {
    type: 'location',
    latitude: 37.422,
    longitude: -122.084,
    name: 'Googleplex',
    address: '1600 Amphitheatre Parkway',
    user: '12025550199'
  });

  (messageRouterService as unknown as { resolveRouteApp: typeof originalResolve }).resolveRouteApp = originalResolve;
  (prisma.app as unknown as { findFirst: typeof originalFindFallback }).findFirst = originalFindFallback;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
  (prisma.conversation as unknown as { upsert: typeof originalUpsert }).upsert = originalUpsert;
  (axios as unknown as { post: typeof originalPost }).post = originalPost;
});
