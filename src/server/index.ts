import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { config } from './config';
import { healthRouter } from './routes/health';
import { notesRouter } from './routes/notes';
import { eventsRouter } from './routes/events';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: config.appBaseUrl,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);

// Health endpoint (no auth required)
app.route('/api', healthRouter);

// CRUD routes
app.route('/api/notes', notesRouter);
app.route('/api/events', eventsRouter);
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
