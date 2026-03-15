import { Request, Response } from 'express';
import { tenantService } from '../services/tenantService';

export const tenantController = {
  async create(req: Request, res: Response) {
    const tenant = await tenantService.create(req.body);
    res.status(201).json(tenant);
  },

  async list(_req: Request, res: Response) {
    const tenants = await tenantService.list();
    res.json(tenants);
  }
};
