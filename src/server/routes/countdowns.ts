import { Hono } from 'hono';

export const countdownsRouter = new Hono();

countdownsRouter.get('/', (c) => {
  return c.json({
    countdowns: [],
    message: 'Countdowns list endpoint - implementation in progress'
  });
});

countdownsRouter.post('/', (c) => {
  return c.json({
    id: crypto.randomUUID(),
    message: 'Countdown created - implementation in progress'
  });
});

export default countdownsRouter;