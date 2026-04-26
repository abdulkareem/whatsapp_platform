import { Request, Response } from 'express';
import { broadcastService } from '../services/broadcastService';
import { sponsoredBroadcastService } from '../services/sponsoredBroadcastService';

export const broadcastController = {
  async create(req: Request, res: Response) {
    const { mobiles, message } = req.body as { mobiles?: string[]; message?: string };

    if (!mobiles?.length || !message) {
      return res.status(400).json({ error: 'mobiles array and message are required' });
    }

    const result = await broadcastService.enqueueBroadcast(mobiles, message, req.appContext?.keyword);
    return res.status(202).json(result);
  },

  async previewSponsored(req: Request, res: Response) {
    const { sourceKeywords, lookbackDays, limit, excludeMobiles } = req.body as {
      sourceKeywords?: string[];
      lookbackDays?: number;
      limit?: number;
      excludeMobiles?: string[];
    };

    if (!sourceKeywords?.length) {
      return res.status(400).json({ error: 'sourceKeywords array is required' });
    }

    const result = await sponsoredBroadcastService.previewAudience({
      sourceKeywords,
      lookbackDays,
      limit,
      excludeMobiles
    });

    return res.status(200).json(result);
  },

  async createSponsored(req: Request, res: Response) {
    const { sourceKeywords, lookbackDays, limit, excludeMobiles, message, sponsorLabel } = req.body as {
      sourceKeywords?: string[];
      lookbackDays?: number;
      limit?: number;
      excludeMobiles?: string[];
      message?: string;
      sponsorLabel?: string;
    };

    if (!sourceKeywords?.length || !message || !sponsorLabel) {
      return res.status(400).json({
        error: 'sourceKeywords array, message, and sponsorLabel are required'
      });
    }

    const result = await sponsoredBroadcastService.sendSponsoredBlast({
      sourceKeywords,
      lookbackDays,
      limit,
      excludeMobiles,
      message,
      sponsorLabel,
      sentByAppKeyword: req.appContext?.keyword
    });

    return res.status(202).json(result);
  }
};
