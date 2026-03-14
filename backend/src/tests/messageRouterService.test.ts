import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { messageRouterService } from '../services/messageRouterService';
import { appService } from '../services/appService';
import { prisma } from '../database/prisma';

test('keyword extraction sanitizes first token and keeps remaining command', () => {
  const keyword = messageRouterService.extractKeyword('  #order!!  open ticket now  ');
  const command = messageRouterService.extractCommand('  #order!!  open ticket now  ');

  assert.equal(keyword, 'ORDER');
  assert.equal(command, 'open ticket now');
});

test('routeIncomingMessage marks unrouted without forwarding', async () => {
  const originalFindByKeyword = appService.findByKeyword;
  const originalCreate = prisma.messageLog.create;
  const originalPost = axios.post;

  let status: string | undefined;
  let forwarded = false;

  (appService as unknown as { findByKeyword: (keyword: string) => Promise<unknown> }).findByKeyword = async () => null;
  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async (args: any) => {
    status = args.data.status;
    return { id: 1 } as never;
  };
  (axios as unknown as { post: (...args: any[]) => Promise<unknown> }).post = async () => {
    forwarded = true;
    return { data: {} };
  };

  await messageRouterService.routeIncomingMessage('12025550199', 'UNKNOWN please help');

  assert.equal(status, 'unrouted');
  assert.equal(forwarded, false);

  (appService as unknown as { findByKeyword: typeof originalFindByKeyword }).findByKeyword = originalFindByKeyword;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
  (axios as unknown as { post: typeof originalPost }).post = originalPost;
});

test('routeIncomingMessage does not forward inactive app', async () => {
  const originalFindByKeyword = appService.findByKeyword;
  const originalCreate = prisma.messageLog.create;
  const originalPost = axios.post;

  let status: string | undefined;
  let forwarded = false;

  (appService as unknown as { findByKeyword: (keyword: string) => Promise<unknown> }).findByKeyword = async () => ({
    id: 2,
    name: 'Helpdesk',
    keyword: 'HELP',
    endpoint: 'https://example.com/webhook',
    apiKey: 'x',
    rateLimitRpm: 100,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async (args: any) => {
    status = args.data.status;
    return { id: 1 } as never;
  };
  (axios as unknown as { post: (...args: any[]) => Promise<unknown> }).post = async () => {
    forwarded = true;
    return { data: {} };
  };

  await messageRouterService.routeIncomingMessage('12025550199', 'help reset');

  assert.equal(status, 'inactive');
  assert.equal(forwarded, false);

  (appService as unknown as { findByKeyword: typeof originalFindByKeyword }).findByKeyword = originalFindByKeyword;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
  (axios as unknown as { post: typeof originalPost }).post = originalPost;
});

test('routeIncomingMessage forwards payload for active app (mock outbound HTTP)', async () => {
  const originalFindByKeyword = appService.findByKeyword;
  const originalCreate = prisma.messageLog.create;
  const originalUpsert = prisma.conversation.upsert;
  const originalPost = axios.post;

  let status: string | undefined;
  let postedPayload: unknown;

  (appService as unknown as { findByKeyword: (keyword: string) => Promise<unknown> }).findByKeyword = async () => ({
    id: 3,
    name: 'Orders',
    keyword: 'ORDER',
    endpoint: 'https://partner.app/inbound',
    apiKey: 'k',
    rateLimitRpm: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

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
  assert.deepEqual(postedPayload, {
    mobile: '12025550199',
    message: 'order create shipment',
    keyword: 'ORDER',
    command: 'create shipment',
    trigger: {
      keyword: 'ORDER',
      command: 'create shipment',
      fullText: 'order create shipment'
    }
  });

  (appService as unknown as { findByKeyword: typeof originalFindByKeyword }).findByKeyword = originalFindByKeyword;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
  (prisma.conversation as unknown as { upsert: typeof originalUpsert }).upsert = originalUpsert;
  (axios as unknown as { post: typeof originalPost }).post = originalPost;
});
