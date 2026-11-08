import { config } from '../config';

export async function initDb() {
  console.log(`Database initialized at ${config.dbPath}`);
  console.log('Migrations will be applied here when implemented');
  return { initialized: true };
}