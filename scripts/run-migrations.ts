import { runMigrate } from '../tests/helpers/migrate.js';

async function main() {
  const direction = (process.argv[2] || 'up') as 'up' | 'down';
  const result = await runMigrate(direction);
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
