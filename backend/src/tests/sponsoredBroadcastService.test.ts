import test from 'node:test';
import assert from 'node:assert/strict';
import { sponsoredBroadcastService } from '../services/sponsoredBroadcastService';
import { prisma } from '../database/prisma';
import { whatsappService } from '../services/whatsappService';

test('previewAudience returns deduplicated masked sample', async () => {
  const originalFindMany = prisma.messageLog.findMany;
  const originalContactFindMany = prisma.contact.findMany;

  (prisma.messageLog as unknown as { findMany: (args: any) => Promise<Array<{ mobile: string }>> }).findMany = async () => ([
    { mobile: '+1 (202) 555-0100' },
    { mobile: '12025550100' },
    { mobile: '12025550101' }
  ]);
  (prisma.contact as unknown as { findMany: (args: any) => Promise<Array<{ mobile: string }>> }).findMany = async () => [];

  const result = await sponsoredBroadcastService.previewAudience({
    sourceKeywords: ['pizza', 'Pizza'],
    limit: 10
  });

  assert.equal(result.audienceCount, 2);
  assert.deepEqual(result.sample, ['120***00', '120***01']);

  (prisma.messageLog as unknown as { findMany: typeof originalFindMany }).findMany = originalFindMany;
  (prisma.contact as unknown as { findMany: typeof originalContactFindMany }).findMany = originalContactFindMany;
});

test('sendSponsoredBlast sends message and logs metadata', async () => {
  const originalFindMany = prisma.messageLog.findMany;
  const originalContactFindMany = prisma.contact.findMany;
  const originalCreate = prisma.messageLog.create;
  const originalSend = whatsappService.sendMessage;

  const sentMobiles: string[] = [];
  const createdMetadata: unknown[] = [];

  (prisma.messageLog as unknown as { findMany: (args: any) => Promise<Array<{ mobile: string }>> }).findMany = async () => ([
    { mobile: '12025550111' },
    { mobile: '12025550112' }
  ]);
  (prisma.contact as unknown as { findMany: (args: any) => Promise<Array<{ mobile: string }>> }).findMany = async () => [];

  (whatsappService as unknown as { sendMessage: (mobile: string, message: string) => Promise<unknown> }).sendMessage = async (mobile: string) => {
    sentMobiles.push(mobile);
    return { messages: [{ id: `wamid.${mobile}` }] };
  };

  (prisma.messageLog as unknown as { create: (args: any) => Promise<unknown> }).create = async (args: any) => {
    createdMetadata.push(args.data.metadata);
    return { id: 1 };
  };

  const result = await sponsoredBroadcastService.sendSponsoredBlast({
    sourceKeywords: ['grocery'],
    message: 'Weekly special!',
    sponsorLabel: 'Mario Grocery',
    sentByAppKeyword: 'MARKET'
  });

  assert.equal(result.sent, 2);
  assert.deepEqual(sentMobiles, ['12025550111', '12025550112']);
  assert.deepEqual(createdMetadata, [
    { type: 'sponsored_broadcast', sponsorLabel: 'Mario Grocery', sourceKeywords: ['GROCERY'] },
    { type: 'sponsored_broadcast', sponsorLabel: 'Mario Grocery', sourceKeywords: ['GROCERY'] }
  ]);

  (prisma.messageLog as unknown as { findMany: typeof originalFindMany }).findMany = originalFindMany;
  (prisma.contact as unknown as { findMany: typeof originalContactFindMany }).findMany = originalContactFindMany;
  (prisma.messageLog as unknown as { create: typeof originalCreate }).create = originalCreate;
  (whatsappService as unknown as { sendMessage: typeof originalSend }).sendMessage = originalSend;
});
