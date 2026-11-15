import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');

export interface Config {
  port: number;
  dataDir: string;
  dbPath: string;
  timezone: string;
}

export const config: Config = {
  port: Number(process.env.PORT) || 3000,
  dataDir: process.env.DATA_DIR || join(root, 'data'),
  dbPath:
    process.env.DB_PATH ||
    join(process.env.DATA_DIR || join(root, 'data'), 'starward.db'),
  timezone: process.env.TIMEZONE || 'Australia/Melbourne'
};