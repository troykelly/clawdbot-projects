import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite/Vitest default cache/temp directories live under node_modules, which can
  // be read-only in some devcontainer/mounted setups. Keep cache local to the repo.
  cacheDir: '.vite',

  test: {
    globals: true,
    testTimeout: 30000,

    // Tests share one local Postgres database with per-test TRUNCATE cleanup.
    // Parallelism is disabled to avoid migration race conditions. If migrating
    // to per-file temp databases, this could be re-enabled.
    fileParallelism: false,
  },
});
