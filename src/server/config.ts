import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');

export interface Config {
  port: number;
  appBaseUrl: string;
  dataDir: string;
  dbPath: string;
  ownerEmail: string;
  authMode: 'passkey' | 'password_totp';
  timezone: string;
  openRouterApiKey: string;
}

export const config: Config = {
  port: Number(process.env.PORT) || 3000,
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  dataDir: process.env.DATA_DIR || join(root, 'data'),
  dbPath:
    process.env.DB_PATH ||
    join(process.env.DATA_DIR || join(root, 'data'), 'hub.db'),
  ownerEmail: process.env.OWNER_EMAIL || 'stella@stellahu.me',
  authMode: ((process.env.AUTH_MODE as Config['authMode']) ||
    'password_totp') as Config['authMode'],
  timezone: process.env.TIMEZONE || 'Australia/Melbourne',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || ''
};