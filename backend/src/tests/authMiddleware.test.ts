import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { appService } from '../services/appService';

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

test('authMiddleware accepts APP_API_KEY header and sets appContext', async () => {
  const original = appService.findByApiKey;
  (appService as unknown as { findByApiKey: (apiKey: string) => Promise<unknown> }).findByApiKey = async (apiKey: string) => {
    assert.equal(apiKey, 'key-123');
    return {
      id: 42,
      name: 'Orders App',
      keyword: 'ORDER',
      endpoint: 'https://example.com',
      apiKey,
      rateLimitRpm: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  const req = {
    header(name: string) {
      return name === 'APP_API_KEY' ? 'key-123' : undefined;
    }
  } as unknown as Request;

  const { res, payload } = createResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(payload.status, undefined);
  assert.deepEqual(req.appContext, {
    id: 42,
    name: 'Orders App',
    keyword: 'ORDER',
    rateLimitRpm: 100
  });

  (appService as unknown as { findByApiKey: typeof original }).findByApiKey = original;
});

test('authMiddleware fails when key is missing', async () => {
  const req = {
    header() {
      return undefined;
    }
  } as unknown as Request;

  const { res, payload } = createResponse();

  await authMiddleware(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(payload.status, 401);
  assert.deepEqual(payload.body, {
    error: 'APP API key is required via X-APP-KEY, APP_API_KEY, X-API-KEY, or Authorization: Bearer <APP_API_KEY>'
  });
});
