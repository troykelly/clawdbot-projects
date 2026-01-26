import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const migrationsPath = resolve(projectRoot, 'migrations');

const DATABASE_URL = 'postgres://clawdbot:clawdbot@localhost:5432/clawdbot?sslmode=disable';

function runMigrate(direction: 'up' | 'down', steps?: number): string {
  const args = ['-path', migrationsPath, '-database', DATABASE_URL, direction];
  if (steps !== undefined) {
    args.push(String(steps));
  }

  try {
    return execFileSync('migrate', args, { encoding: 'utf-8', cwd: projectRoot });
  } catch (error: unknown) {
    const e = error as { stderr?: string; stdout?: string };
    throw new Error(`Migration failed: ${e.stderr || e.stdout}`);
  }
}

describe('Migrations', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'clawdbot',
      password: 'clawdbot',
      database: 'clawdbot',
    });

    // Reset migrations before tests
    try {
      runMigrate('down', 1);
    } catch {
      // Ignore if no migrations to rollback
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('applies migration and creates smoke test table', async () => {
    runMigrate('up');

    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = '_migration_smoke_test'
      ) as exists
    `);
    expect(result.rows[0].exists).toBe(true);
  });

  it('smoke test table has UUIDv7 row', async () => {
    const result = await pool.query('SELECT id FROM _migration_smoke_test');
    expect(result.rows.length).toBe(1);

    const uuid = result.rows[0].id;
    // UUIDv7 format check
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('rolls back migration and removes table', async () => {
    runMigrate('down', 1);

    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = '_migration_smoke_test'
      ) as exists
    `);
    expect(result.rows[0].exists).toBe(false);
  });
});
