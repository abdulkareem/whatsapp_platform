import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { appController } from '../controllers/appController';
import { appService } from '../services/appService';
import { env } from '../config/env';

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
    },
    send(body?: unknown) {
      payload.body = body;
      return this;
    }
  } as unknown as Response;

  return { res, payload };
};

test('create rejects endpoint matching platform webhook URL', async () => {
  const originalBaseUrl = env.WEBHOOK_BASE_URL;
  (env as { WEBHOOK_BASE_URL?: string }).WEBHOOK_BASE_URL = 'https://mycrowb-production.up.railway.app';

  const req = {
    body: {
      name: 'Orders',
      keyword: 'ORDER',
      endpoint: 'https://mycrowb-production.up.railway.app/webhook'
    }
  } as unknown as Request;

  const { res, payload } = createResponse();
  await appController.create(req, res);

  assert.equal(payload.status, 400);
  assert.equal((payload.body as { error: string }).error, 'endpoint cannot be the platform webhook URL');

  (env as { WEBHOOK_BASE_URL?: string }).WEBHOOK_BASE_URL = originalBaseUrl;
});

test('updateConfig forwards endpoint/name/keyword updates to service', async () => {
  const originalUpdate = appService.updateAppConfig;

  let captured: unknown;
  (appService as unknown as { updateAppConfig: (...args: any[]) => Promise<unknown> }).updateAppConfig = async (_id: number, config: unknown) => {
    captured = config;
    return { id: 9 };
  };

  const req = {
    params: { id: '9' },
    body: {
      endpoint: ' https://partner.example.com/inbound ',
      name: ' Partner Orders ',
      keyword: ' partner '
    }
  } as unknown as Request;

  const { res, payload } = createResponse();
  await appController.updateConfig(req, res);

  assert.equal(payload.status, 200);
  assert.deepEqual(captured, {
    rateLimitRpm: undefined,
    sessionEnabled: undefined,
    sessionTimeoutMinutes: undefined,
    keywordRequired: undefined,
    defaultApp: undefined,
    fallbackMessage: undefined,
    endpoint: 'https://partner.example.com/inbound',
    name: 'Partner Orders',
    keyword: 'partner'
  });

  (appService as unknown as { updateAppConfig: typeof originalUpdate }).updateAppConfig = originalUpdate;
});
