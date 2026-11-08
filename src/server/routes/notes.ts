import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { config } from '../config';

export const notesRouter = new Hono();

const NoteSchema = z.object({
  body: z.string().min(1),
  source: z.enum(['text', 'voice']).optional(),
  timezone: z.string().optional()
});

notesRouter.get('/', (c) => {
  return c.json({
    notes: [],
    total: 0,
    message: 'Notes list endpoint - implementation in progress'
  });
});

notesRouter.post('/', zValidator('json', NoteSchema), (c) => {
  const body = c.req.valid('json');
  return c.json({
    id: crypto.randomUUID(),
    body: body.body,
    source: body.source || 'text',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    timezone: body.timezone || config.timezone,
    tags: [],
    message: 'Note created - tags not yet suggested'
  });
});

notesRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    id,
    message: 'Note detail endpoint - implementation in progress'
  });
});

notesRouter.patch('/:id', zValidator('json', z.object({ body: z.string().optional() })), (c) => {
  const id = c.req.param('id');
  return c.json({
    id,
    updated_at: new Date().toISOString(),
    message: 'Note update endpoint - implementation in progress'
  });
});

notesRouter.delete('/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    id,
    message: 'Note deleted (soft)',
    deleted_at: new Date().toISOString()
  });
});

export default notesRouter;