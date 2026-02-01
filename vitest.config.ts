import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,

    // Tests share one local Postgres database with per-test TRUNCATE cleanup.
    // Parallelism is disabled to avoid migration race conditions. If migrating
    // to per-file temp databases, this could be re-enabled.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
