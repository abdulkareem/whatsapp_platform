import { Request, Response } from 'express';
import { appService } from '../services/appService';
import { getFailedQueueJobs, getQueueStats } from '../queue/messageWorker';

const validatePositiveInteger = (value: unknown) => Number.isInteger(value) && Number(value) > 0;

export const appController = {
  async list(req: Request, res: Response) {
    const apps = await appService.listApps();
    return res.status(200).json(apps);
  },

  async create(req: Request, res: Response) {
    const {
      name,
      keyword,
      endpoint,
      rateLimitRpm,
      sessionEnabled,
      sessionTimeoutMinutes,
      keywordRequired,
      defaultApp,
      fallbackMessage
    } = req.body as {
      name?: string;
      keyword?: string;
      endpoint?: string;
      rateLimitRpm?: number;
      sessionEnabled?: boolean;
      sessionTimeoutMinutes?: number;
      keywordRequired?: boolean;
      defaultApp?: boolean;
      fallbackMessage?: string;
    };

    const normalizedName = name?.trim();
    const normalizedKeyword = keyword?.trim();
    const normalizedEndpoint = endpoint?.trim();

    if (!normalizedName || !normalizedKeyword || !normalizedEndpoint) {
      return res.status(400).json({ error: 'name, keyword and endpoint are required' });
    }

    if (rateLimitRpm !== undefined && !validatePositiveInteger(rateLimitRpm)) {
      return res.status(400).json({ error: 'rateLimitRpm must be a positive integer' });
    }

    if (sessionTimeoutMinutes !== undefined && !validatePositiveInteger(sessionTimeoutMinutes)) {
      return res.status(400).json({ error: 'sessionTimeoutMinutes must be a positive integer' });
    }

    const app = await appService.createApp(normalizedName, normalizedKeyword, normalizedEndpoint, {
      rateLimitRpm,
      sessionEnabled,
      sessionTimeoutMinutes,
      keywordRequired,
      defaultApp,
      fallbackMessage: fallbackMessage?.trim() || null
    });

    return res.status(201).json(app);
  },

  async updateConfig(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id param must be a positive integer' });
    }

    const updates = req.body as {
      rateLimitRpm?: number;
      sessionEnabled?: boolean;
      sessionTimeoutMinutes?: number;
      keywordRequired?: boolean;
      defaultApp?: boolean;
      fallbackMessage?: string | null;
      endpoint?: string;
      name?: string;
      keyword?: string;
    };

    if (updates.rateLimitRpm !== undefined && !validatePositiveInteger(updates.rateLimitRpm)) {
      return res.status(400).json({ error: 'rateLimitRpm must be a positive integer' });
    }

    if (updates.sessionTimeoutMinutes !== undefined && !validatePositiveInteger(updates.sessionTimeoutMinutes)) {
      return res.status(400).json({ error: 'sessionTimeoutMinutes must be a positive integer' });
    }

    const app = await appService.updateAppConfig(id, {
      rateLimitRpm: updates.rateLimitRpm,
      sessionEnabled: updates.sessionEnabled,
      sessionTimeoutMinutes: updates.sessionTimeoutMinutes,
      keywordRequired: updates.keywordRequired,
      defaultApp: updates.defaultApp,
      fallbackMessage: updates.fallbackMessage === undefined ? undefined : updates.fallbackMessage?.trim() || null
    });

    return res.status(200).json(app);
  },

  async queueStats(_req: Request, res: Response) {
    const stats = await getQueueStats();
    return res.status(200).json(stats);
  },

  async failedQueueJobs(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 50;
    const failed = await getFailedQueueJobs(limit);
    return res.status(200).json(failed);
  },

  async updateStatus(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { isActive } = req.body as { isActive?: boolean };

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id param must be a positive integer' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const app = await appService.updateStatus(id, isActive);
    return res.status(200).json(app);
  },

  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id param must be a positive integer' });
    }

    await appService.deleteApp(id);
    return res.status(204).send();
  },

  async rotateApiKey(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id param must be a positive integer' });
    }

    const app = await appService.rotateApiKey(id);
    return res.status(200).json(app);
  }
};
