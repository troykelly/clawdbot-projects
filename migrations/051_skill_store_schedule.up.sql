-- Migration 051: Skill Store Schedule Schema
-- Part of Epic #794, Issue #796
-- Creates recurring skill processing schedules that trigger webhooks via pgcron

-- ============================================================================
-- SKILL_STORE_SCHEDULE TABLE
-- ============================================================================
-- Recurring cron schedules that fire webhooks to OpenClaw for periodic
-- skill processing (e.g., newsletter generation, data aggregation)

CREATE TABLE IF NOT EXISTS skill_store_schedule (
  id uuid PRIMARY KEY DEFAULT new_uuid(),

  -- Scope
  skill_id text NOT NULL,
  collection text,  -- optional: scope schedule to a specific collection

  -- Schedule definition
  cron_expression text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',  -- IANA timezone name (e.g., 'America/New_York')

  -- Webhook configuration
  webhook_url text NOT NULL,
  webhook_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_template jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- State
  enabled boolean NOT NULL DEFAULT true,
  max_retries integer NOT NULL DEFAULT 5,
  last_run_status text CHECK (last_run_status IN ('success', 'failed', 'skipped')),
  last_run_at timestamptz,
  next_run_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Prevent duplicate schedules for the same skill + collection + cron
CREATE UNIQUE INDEX idx_skill_store_schedule_unique
  ON skill_store_schedule (skill_id, collection, cron_expression)
  WHERE collection IS NOT NULL;

CREATE UNIQUE INDEX idx_skill_store_schedule_unique_no_collection
  ON skill_store_schedule (skill_id, cron_expression)
  WHERE collection IS NULL;

-- Validate cron expression frequency: reject expressions firing more than every 5 minutes.
-- This validates common patterns: */N or N in the minute field where N < 5.
-- More complex patterns pass but are handled at application layer.
CREATE OR REPLACE FUNCTION validate_cron_frequency()
RETURNS trigger AS $$
DECLARE
  minute_part text;
BEGIN
  -- Extract minute field (first part of cron expression)
  minute_part := split_part(NEW.cron_expression, ' ', 1);

  -- Reject */N where N < 5 (fires too frequently)
  IF minute_part ~ '^\*/[0-4]$' THEN
    RAISE EXCEPTION 'Cron expression fires more frequently than every 5 minutes: %', NEW.cron_expression
      USING ERRCODE = 'check_violation';
  END IF;

  -- Reject bare * in minute field with * in hour field (every minute)
  IF minute_part = '*' AND split_part(NEW.cron_expression, ' ', 2) = '*' THEN
    RAISE EXCEPTION 'Cron expression fires every minute (too frequent): %', NEW.cron_expression
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skill_store_schedule_cron_frequency_check
  BEFORE INSERT OR UPDATE ON skill_store_schedule
  FOR EACH ROW EXECUTE FUNCTION validate_cron_frequency();

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_skill_store_schedule_skill_id
  ON skill_store_schedule (skill_id);

CREATE INDEX idx_skill_store_schedule_enabled
  ON skill_store_schedule (enabled)
  WHERE enabled = true;

CREATE INDEX idx_skill_store_schedule_next_run
  ON skill_store_schedule (next_run_at)
  WHERE enabled = true AND next_run_at IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_skill_store_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skill_store_schedule_updated_at_trigger
  BEFORE UPDATE ON skill_store_schedule
  FOR EACH ROW EXECUTE FUNCTION update_skill_store_schedule_updated_at();

-- ============================================================================
-- JOB ENQUEUE FUNCTION
-- ============================================================================

-- Finds due schedules and enqueues internal_job entries.
-- Called by pgcron every minute.
CREATE OR REPLACE FUNCTION enqueue_skill_store_scheduled_jobs()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer := 0;
  v_schedule RECORD;
  v_minute_bucket text;
  v_idem_key text;
BEGIN
  FOR v_schedule IN
    SELECT id, skill_id, collection, webhook_url, webhook_headers,
           payload_template, max_retries, last_run_at, last_run_status
    FROM skill_store_schedule
    WHERE enabled = true
      AND (
        next_run_at IS NULL
        OR next_run_at <= now()
      )
      -- Overlap prevention: skip if previous run still in progress
      -- (last_run_status IS NULL means never run OR currently running)
      AND NOT (
        last_run_status IS NULL
        AND last_run_at IS NOT NULL
        AND last_run_at > now() - interval '1 hour'
      )
  LOOP
    -- Use minute-granularity idempotency key to prevent duplicate jobs
    v_minute_bucket := to_char(now(), 'YYYY-MM-DD-HH24-MI');
    v_idem_key := 'skill_schedule:' || v_schedule.id::text || ':' || v_minute_bucket;

    PERFORM internal_job_enqueue(
      'skill_store.scheduled_process',
      now(),
      jsonb_build_object(
        'schedule_id', v_schedule.id::text,
        'skill_id', v_schedule.skill_id,
        'collection', v_schedule.collection,
        'webhook_url', v_schedule.webhook_url,
        'webhook_headers', v_schedule.webhook_headers,
        'payload_template', v_schedule.payload_template,
        'max_retries', v_schedule.max_retries,
        'triggered_at', now()::text
      ),
      v_idem_key
    );

    -- Mark schedule as running (null status = in progress)
    UPDATE skill_store_schedule
    SET last_run_at = now(),
        last_run_status = NULL
    WHERE id = v_schedule.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION enqueue_skill_store_scheduled_jobs IS 'Finds due skill store schedules and enqueues processing jobs with idempotency';

-- Register pgcron job (idempotent)
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'skill_store_schedule_enqueue') THEN
    PERFORM cron.schedule(
      'skill_store_schedule_enqueue',
      '*/1 * * * *',
      $cmd$SELECT enqueue_skill_store_scheduled_jobs();$cmd$
    );
  END IF;
END $do$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE skill_store_schedule IS 'Recurring cron schedules for skill processing via webhooks';
COMMENT ON COLUMN skill_store_schedule.cron_expression IS 'Standard 5-field cron expression (min hour dom month dow)';
COMMENT ON COLUMN skill_store_schedule.timezone IS 'IANA timezone for cron evaluation (e.g., America/New_York)';
COMMENT ON COLUMN skill_store_schedule.webhook_url IS 'URL to call when schedule fires';
COMMENT ON COLUMN skill_store_schedule.payload_template IS 'Template merged with runtime data (skill_id, collection, schedule_id, triggered_at)';
COMMENT ON COLUMN skill_store_schedule.max_retries IS 'Max consecutive failures before auto-disabling schedule';
COMMENT ON COLUMN skill_store_schedule.last_run_status IS 'NULL = never run or currently running, success/failed/skipped';
