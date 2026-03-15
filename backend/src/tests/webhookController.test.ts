import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';
import { messageQueue } from '../queue/messageQueue';

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

test('receiveWebhook parses provider payload and enqueues each inbound message', async () => {
  const originalEnqueue = messageQueue.enqueue;
  const enqueued: Array<{ mobile: string; message: string }> = [];

  (messageQueue as unknown as { enqueue: (payload: { mobile: string; message: string }) => unknown }).enqueue = (payload) => {
    enqueued.push(payload);
    return { id: 1 };
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
  assert.deepEqual(enqueued, [
    { mobile: '12025550199', message: 'ORDER create invoice', messageId: 'mid1' },
    { mobile: '12025550200', message: 'HELP reset pin', messageId: 'mid2' }
  ]);

  (messageQueue as unknown as { enqueue: typeof originalEnqueue }).enqueue = originalEnqueue;
});
