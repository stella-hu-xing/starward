import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

export const healthRouter = new Hono();

healthRouter.get('/health', zValidator('query', z.object({}).optional()), (c) => {
  return c.json({
    status: 'ok',
    service: 'starward',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

export default healthRouter;