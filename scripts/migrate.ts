import { initDb } from '../src/server/db';

await initDb();
console.log('Migration complete');