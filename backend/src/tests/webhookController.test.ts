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

test('receiveWebhook extracts contact wa_id fallback and interactive message text', async () => {
  const originalEnqueue = messageQueue.enqueue;
  const enqueued: Array<{ mobile: string; message: string; messageId?: string }> = [];

  (messageQueue as unknown as { enqueue: (payload: { mobile: string; message: string; messageId?: string }) => unknown }).enqueue = (
    payload
  ) => {
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
                contacts: [{ wa_id: '12025550300' }],
                messages: [
                  {
                    id: 'mid3',
                    type: 'interactive',
                    interactive: {
                      button_reply: {
                        title: 'Confirm order'
                      }
                    }
                  }
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
  assert.deepEqual(enqueued, [{ mobile: '12025550300', message: 'Confirm order', messageId: 'mid3' }]);

  (messageQueue as unknown as { enqueue: typeof originalEnqueue }).enqueue = originalEnqueue;
});


test('receiveWebhook extracts quick-reply payload when button text is missing', async () => {
  const originalEnqueue = messageQueue.enqueue;
  const enqueued: Array<{ mobile: string; message: string; messageId?: string }> = [];

  (messageQueue as unknown as { enqueue: (payload: { mobile: string; message: string; messageId?: string }) => unknown }).enqueue = (
    payload
  ) => {
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
                  {
                    id: 'mid4',
                    type: 'button',
                    from: '12025550400',
                    button: {
                      payload: 'Yes, continue'
                    }
                  }
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
  assert.deepEqual(enqueued, [{ mobile: '12025550400', message: 'Yes, continue', messageId: 'mid4' }]);

  (messageQueue as unknown as { enqueue: typeof originalEnqueue }).enqueue = originalEnqueue;
});

test('receiveWebhook extracts nfm reply payload text', async () => {
  const originalEnqueue = messageQueue.enqueue;
  const enqueued: Array<{ mobile: string; message: string; messageId?: string }> = [];

  (messageQueue as unknown as { enqueue: (payload: { mobile: string; message: string; messageId?: string }) => unknown }).enqueue = (
    payload
  ) => {
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
                  {
                    id: 'mid5',
                    type: 'interactive',
                    from: '12025550500',
                    interactive: {
                      nfm_reply: {
                        body: '{\"flow_token\":\"abc123\"}'
                      }
                    }
                  }
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
  assert.deepEqual(enqueued, [{ mobile: '12025550500', message: '{\"flow_token\":\"abc123\"}', messageId: 'mid5' }]);

  (messageQueue as unknown as { enqueue: typeof originalEnqueue }).enqueue = originalEnqueue;
});


test('receiveWebhook ignores status-only events without throwing', async () => {
  const originalEnqueue = messageQueue.enqueue;
  let enqueueCalls = 0;

  (messageQueue as unknown as { enqueue: (payload: { mobile: string; message: string; messageId?: string }) => unknown }).enqueue = () => {
    enqueueCalls += 1;
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
                statuses: [{ id: 'wamid.status.1', status: 'delivered' }]
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
  assert.equal(enqueueCalls, 0);

  (messageQueue as unknown as { enqueue: typeof originalEnqueue }).enqueue = originalEnqueue;
});
