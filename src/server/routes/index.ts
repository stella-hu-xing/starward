import { Hono } from 'hono';
import { healthRouter } from './health.js';
import { notesRouter } from './notes.js';

// Composed API router: mounts only the routers that exist in this scaffold.
// Legacy inbox/export/auth/mcp route mounts were removed on 2026-11-15;
// those routers were never implemented here.
const app = new Hono();

app.route('/api', healthRouter);
app.route('/api/notes', notesRouter);

export default app;