import { Request, Response } from 'express';
import { workflowService } from '../services/workflowService';

export const workflowController = {
  async create(req: Request, res: Response) {
    const workflow = await workflowService.create(req.body);
    res.status(201).json(workflow);
  },

  async listByTenant(req: Request, res: Response) {
    const tenantId = Number(req.params.tenantId);
    const workflows = await workflowService.listByTenant(tenantId);
    res.json(workflows);
  }
};
