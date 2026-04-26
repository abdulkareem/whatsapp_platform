import { prisma } from '../database/prisma';
import { normalizePhone } from '../utils/phoneFormatter';
import { whatsappService } from './whatsappService';

const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_LIMIT = 500;

interface SponsoredAudienceInput {
  sourceKeywords: string[];
  lookbackDays?: number;
  limit?: number;
  excludeMobiles?: string[];
}

interface SponsoredSendInput extends SponsoredAudienceInput {
  message: string;
  sponsorLabel: string;
  sentByAppKeyword?: string;
}

const toKeyword = (value: string) => value.trim().toUpperCase();

const normalizeKeywordList = (keywords: string[]) =>
  Array.from(new Set(keywords.map(toKeyword).filter(Boolean)));

const clampLimit = (limit?: number) => {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(limit, 10_000));
};

const resolveAudience = async ({ sourceKeywords, lookbackDays, limit, excludeMobiles = [] }: SponsoredAudienceInput) => {
  const keywords = normalizeKeywordList(sourceKeywords);
  if (!keywords.length) {
    return [] as string[];
  }

  const lookbackWindow = Math.max(1, lookbackDays ?? DEFAULT_LOOKBACK_DAYS);
  const queryLimit = clampLimit(limit);
  const since = new Date(Date.now() - lookbackWindow * 24 * 60 * 60 * 1000);
  const blockedSet = new Set(excludeMobiles.map((mobile) => normalizePhone(mobile)));
  const optedOutContacts = await prisma.contact.findMany({
    where: { optOutStatus: true },
    select: { mobile: true }
  });
  const optedOutSet = new Set(optedOutContacts.map((contact) => normalizePhone(contact.mobile)));

  const interactions = await prisma.messageLog.findMany({
    where: {
      app: { in: keywords },
      direction: 'incoming',
      createdAt: { gte: since }
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['mobile'],
    select: { mobile: true },
    take: queryLimit * 2
  });

  const eligible = interactions
    .map((entry) => normalizePhone(entry.mobile))
    .filter((mobile) => !blockedSet.has(mobile))
    .filter((mobile) => !optedOutSet.has(mobile))
    .filter((mobile, index, arr) => arr.indexOf(mobile) === index)
    .slice(0, queryLimit);

  return eligible;
};

export const sponsoredBroadcastService = {
  async previewAudience(input: SponsoredAudienceInput) {
    const mobiles = await resolveAudience(input);

    return {
      audienceCount: mobiles.length,
      sample: mobiles.slice(0, 10).map((mobile) => `${mobile.slice(0, 3)}***${mobile.slice(-2)}`)
    };
  },

  async sendSponsoredBlast(input: SponsoredSendInput) {
    const mobiles = await resolveAudience(input);

    await Promise.all(
      mobiles.map(async (mobile) => {
        await whatsappService.sendMessage(mobile, input.message);
        await prisma.messageLog.create({
          data: {
            mobile,
            message: input.message,
            direction: 'outgoing',
            app: input.sentByAppKeyword ?? 'SPONSORED',
            status: 'sent',
            metadata: {
              type: 'sponsored_broadcast',
              sponsorLabel: input.sponsorLabel,
              sourceKeywords: normalizeKeywordList(input.sourceKeywords)
            }
          }
        });
      })
    );

    return {
      sent: mobiles.length,
      audienceCount: mobiles.length,
      compliance: {
        optInRequired: true,
        reminder: 'Only send sponsored blasts to users with valid WhatsApp opt-in consent.'
      }
    };
  }
};
