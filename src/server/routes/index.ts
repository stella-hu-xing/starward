import { Hono } from 'hono';
import { healthRouter } from './health.js';
import { notesRouter } from './notes.js';

// Composed API router: mounts only the routers that exist in this scaffold
const app = new Hono();

app.route('/api', healthRouter);
app.route('/api/notes', notesRouter);

export default app;
