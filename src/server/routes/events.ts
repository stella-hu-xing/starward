import { Hono } from 'hono';

export const eventsRouter = new Hono();

eventsRouter.get('/', (c) => {
  return c.json({
    events: [],
    message: 'Events list endpoint - implementation in progress'
  });
});

eventsRouter.post('/', (c) => {
  return c.json({
    id: crypto.randomUUID(),
    message: 'Event created - implementation in progress'
  });
});

eventsRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    id,
    message: 'Event detail endpoint - implementation in progress'
  });
});

export default eventsRouter;