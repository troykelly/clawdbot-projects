-- Initial migration: verify Postgres 18 features work
-- This is a smoke-test migration to confirm the harness works

CREATE TABLE _migration_smoke_test (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO _migration_smoke_test DEFAULT VALUES;
