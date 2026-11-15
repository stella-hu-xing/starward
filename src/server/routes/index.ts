import { Router } from 'hono';
import { healthRouter } from './health';
import { notesRouter } from './notes';
import { inboxRouter } from './inbox';
import { exportRouter } from './export';
import { authRouter } from './auth';
import { mcpRouter } from './mcp';

const app = new Router();

app.route('/api', healthRouter);
app.route('/api/notes', notesRouter);
app.route('/api/notes/:id', notesRouter.get);
app.route('/api/inbox', inboxRouter);
app.route('/api/export', exportRouter);
app.route('/api/auth/login', authRouter.post);
app.route('/mcp', mcpRouter);

export default app;