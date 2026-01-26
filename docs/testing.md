# Testing Guide

## Prerequisites

- Docker (for running Postgres 18)
- Node.js 20+
- pnpm
- [golang-migrate](https://github.com/golang-migrate/migrate) CLI

### Installing golang-migrate

```bash
# Linux
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.3/migrate.linux-amd64.tar.gz | tar xz
sudo mv migrate /usr/local/bin/

# macOS
brew install golang-migrate
```

## Quick Start

```bash
# 1. Start Postgres
pnpm db:up

# 2. Run tests
pnpm test

# 3. Stop Postgres when done
pnpm db:down
```

## Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch
```

## Database Management

### Start/Stop Postgres

```bash
pnpm db:up    # Start Postgres 18 container
pnpm db:down  # Stop and remove container
```

### Migrations

```bash
# Apply all migrations
DATABASE_URL="postgres://clawdbot:clawdbot@localhost:5432/clawdbot?sslmode=disable" pnpm migrate:up

# Rollback last migration
DATABASE_URL="postgres://clawdbot:clawdbot@localhost:5432/clawdbot?sslmode=disable" pnpm migrate:down
```

### Creating New Migrations

Create paired up/down SQL files in `migrations/`:

```
migrations/
  001_init.up.sql
  001_init.down.sql
  002_add_users.up.sql
  002_add_users.down.sql
```

Naming convention: `NNN_description.{up,down}.sql`

## Rollback Strategy

Each migration has a corresponding `down.sql` that reverses its changes:

- `up.sql` - applies the migration (CREATE TABLE, ADD COLUMN, etc.)
- `down.sql` - reverses it (DROP TABLE, DROP COLUMN, etc.)

To rollback:

```bash
# Rollback one migration
migrate -path migrations -database "$DATABASE_URL" down 1

# Rollback all migrations
migrate -path migrations -database "$DATABASE_URL" down
```

## Test Database

Tests run against a local Postgres 18 container with these defaults:

| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 5432 |
| User | clawdbot |
| Password | clawdbot |
| Database | clawdbot |

Override via environment variables: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
