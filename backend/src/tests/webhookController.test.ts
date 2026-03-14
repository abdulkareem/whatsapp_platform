import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';
import { messageRouterService } from '../services/messageRouterService';

const createResponse = () => {
  const payload: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      payload.status = code;
      return this;
    },
    send(body: unknown) {
      payload.body = body;
      return this;
    },
    sendStatus(code: number) {
      payload.status = code;
      return this;
    }
  } as unknown as Response;

  return { res, payload };
};

test('receiveWebhook parses provider payload and routes each inbound message', async () => {
  const originalRoute = messageRouterService.routeIncomingMessage;
  const routed: Array<{ mobile: string; message: string }> = [];

  (messageRouterService as unknown as { routeIncomingMessage: (mobile: string, message: string) => Promise<void> }).routeIncomingMessage = async (mobile: string, message: string) => {
    routed.push({ mobile, message });
  };

  const req = {
    body: {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { from: '12025550199', text: { body: 'ORDER create invoice' }, id: 'mid1', type: 'text' },
                  { from: '12025550200', text: { body: 'HELP reset pin' }, id: 'mid2', type: 'text' }
                ]
              }
            }
          ]
        }
      ]
    }
  } as Request;

  const { res, payload } = createResponse();
  await webhookController.receiveWebhook(req, res);

  assert.equal(payload.status, 200);
  assert.deepEqual(routed, [
    { mobile: '12025550199', message: 'ORDER create invoice' },
    { mobile: '12025550200', message: 'HELP reset pin' }
  ]);

  (messageRouterService as unknown as { routeIncomingMessage: typeof originalRoute }).routeIncomingMessage = originalRoute;
});
