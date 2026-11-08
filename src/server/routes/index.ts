import { Router } from 'hono';
import { healthRouter } from './health';
import { notesRouter } from './notes';
import { eventsRouter } from './events';
import { countdownsRouter } from './countdowns';
import { inboxRouter } from './inbox';
import { exportRouter } from './export';
import { authRouter } from './auth';
import { syncRouter } from './sync';
import { mcpRouter } from './mcp';

const app = new Router();

app.route('/api', healthRouter);
app.route('/api/notes', notesRouter);
app.route('/api/notes/:id', notesRouter.get);
app.route('/api/events', eventsRouter);
app.route('/api/countdowns', countdownsRouter);
app.route('/api/inbox', inboxRouter);
app.route('/api/export', exportRouter);
app.route('/api/auth/login', authRouter.post);
app.route('/api/auth/google/start', authRouter.get);
app.route('/api/auth/google/callback', authRouter.get);
app.route('/api/sync/gcal', syncRouter.post);
app.route('/api/sync/gmail', syncRouter.post);
app.route('/mcp', mcpRouter);

export default app;