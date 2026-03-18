import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { messageController } from '../controllers/messageController';
import { whatsappService } from '../services/whatsappService';
import { prisma } from '../database/prisma';

const createResponse = () => {
  const payload: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      payload.status = code;
      return this;
    },
    json(body: unknown) {
      payload.body = body;
      return this;
    }
  } as unknown as Response;

  return { res, payload };
};

test('sendMessage logs outbound with app context and provider message id', async () => {
  const originalSend = whatsappService.sendMessage;
  const originalCreate = prisma.messageLog.create;

  let createdData: unknown;
  (whatsappService as unknown as { sendMessage: (mobile: string, message: string) => Promise<unknown> }).sendMessage = async () => ({ messages: [{ id: 'wamid.abc' }] });
  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async (args: any) => {
    createdData = args.data;
    return { id: 1 } as never;
  };

  const req = {
    body: { mobile: '+1 (202) 555-0199', message: 'hello' },
    appContext: { id: 10, name: 'CRM', keyword: 'CRM', rateLimitRpm: 50 }
  } as unknown as Request;

  const { res, payload } = createResponse();
  await messageController.sendMessage(req, res);

  assert.equal(payload.status, 200);
  assert.deepEqual(createdData, {
    mobile: '12025550199',
    message: 'hello',
    direction: 'outgoing',
    app: 'CRM',
    status: 'sent',
    providerMessageId: 'wamid.abc'
  });

  (whatsappService as unknown as { sendMessage: typeof originalSend }).sendMessage = originalSend;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
});

test('sendMessage rejects malformed payload', async () => {
  const req = { body: { mobile: '', message: '' } } as unknown as Request;
  const { res, payload } = createResponse();

  await messageController.sendMessage(req, res);

  assert.equal(payload.status, 400);
  assert.equal((payload.body as { error: string }).error, 'Invalid request body');
});


test('sendMessage supports outbound location payloads', async () => {
  const originalSendLocation = whatsappService.sendLocation;
  const originalCreate = prisma.messageLog.create;

  let createdData: any;
  (whatsappService as unknown as { sendLocation: (...args: any[]) => Promise<unknown> }).sendLocation = async () => ({ messages: [{ id: 'wamid.location' }] });
  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async (args: any) => {
    createdData = args.data;
    return { id: 1 } as never;
  };

  const req = {
    body: {
      type: 'location',
      mobile: '+1 (202) 555-0199',
      latitude: 37.422,
      longitude: -122.084,
      name: 'Googleplex',
      address: '1600 Amphitheatre Parkway'
    },
    appContext: { id: 10, name: 'CRM', keyword: 'CRM', rateLimitRpm: 50 }
  } as unknown as Request;

  const { res, payload } = createResponse();
  await messageController.sendMessage(req, res);

  assert.equal(payload.status, 200);
  assert.equal(createdData.mobile, '12025550199');
  assert.equal(createdData.providerMessageId, 'wamid.location');
  assert.match(createdData.message, /"type":"location"/);

  (whatsappService as unknown as { sendLocation: typeof originalSendLocation }).sendLocation = originalSendLocation;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
});
