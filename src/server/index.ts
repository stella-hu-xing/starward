import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { logger } from 'hono/logger';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';

const app = new Hono();

// Global middleware
app.use('*', logger());

// Health endpoint (no auth required)
app.route('/api', healthRouter);
// Serve static frontend from dist/web
app.use(
  serveStatic({
    root: './dist/web',
    rewriteRequestPath: (path) => (path === '/' ? '/index.html' : path)
  })
);

export { app };

export default {
  port: config.port,
  fetch: app.fetch
};
