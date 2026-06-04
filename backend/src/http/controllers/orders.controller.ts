import { Router } from 'express';
import { z } from 'zod';
import { OrdersService } from '../../domain/orders/service';
import { requireAuth, allowRoles } from '../middleware/authz';

export function OrdersController(service: OrdersService) {
  const r = Router();

  r.post('/orders', requireAuth, async (req, res) => {
    try {
      const order = await service.createOrder(req.body, (req.user as any).id);
      res.status(201).json(order);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  r.get('/orders/:id', requireAuth, async (req, res) => {
    try {
      const order = await (service as any).repo.findById(req.params.id, true);
      if (!order) return res.status(404).json({ error: 'Not found' });
      const role = (req.user as any).role;
      const uid = (req.user as any).id;
      if (role !== 'admin' && order.buyerId !== uid && order.sellerId !== uid) return res.status(403).json({ error: 'Forbidden' });
      res.json(order);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  r.get('/orders', requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        q: z.string().optional(),
        status: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20)
      });
      const { q, status, page, pageSize } = schema.parse(req.query);
      const role = (req.user as any).role as 'buyer' | 'seller' | 'admin';
      const uid = (req.user as any).id as string;
      const result = await (service as any).repo.listByUser(uid, role, q, status, page, pageSize);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  r.post('/orders/:id/status', requireAuth, allowRoles(['seller', 'admin']), async (req, res) => {
    try {
      const role = (req.user as any).role as 'seller' | 'admin';
      const updated = await service.updateOrderStatus(req.params.id, req.body, (req.user as any).id, role);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  r.post('/payments/checkout', requireAuth, async (req, res) => {
    try {
      const result = await service.createCheckout(req.body, (req.user as any).id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  r.post('/payments/webhook/paymongo', async (req, res) => {
    try {
      const result = await service.handleWebhook(req.headers as any, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  return r;
}
