import { Pool, PoolConfig } from 'pg';

export function createPool(config?: PoolConfig): Pool {
  return new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'clawdbot',
    password: process.env.PGPASSWORD || 'clawdbot',
    database: process.env.PGDATABASE || 'clawdbot',
    ...config,
  });
}
