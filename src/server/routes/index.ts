import { Hono } from 'hono';
import { healthRouter } from './health.js';

// Composed API router: mounts only the routers that exist in this scaffold
const app = new Hono();

app.route('/api', healthRouter);

export default app;
