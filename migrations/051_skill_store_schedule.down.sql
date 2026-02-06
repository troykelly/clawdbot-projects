-- Migration 051: Skill Store Schedule Schema (Rollback)
-- Part of Epic #794, Issue #796
-- WARNING: This will permanently delete all skill store schedules

-- Remove pgcron job
DO $do$
BEGIN
  PERFORM cron.unschedule('skill_store_schedule_enqueue');
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;

-- Remove table first (cascades triggers)
DROP TABLE IF EXISTS skill_store_schedule;

-- Remove functions (safe now that dependent triggers/table are gone)
DROP FUNCTION IF EXISTS enqueue_skill_store_scheduled_jobs();
DROP FUNCTION IF EXISTS update_skill_store_schedule_updated_at();
DROP FUNCTION IF EXISTS validate_cron_frequency();
