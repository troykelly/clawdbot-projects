-- Migration 055: Skill Store schema fixes (Issue #827)
-- Part of Epic #794
-- Fixes: TTL soft-delete, skill_id CHECK, gen_random_uuid → new_uuid,
--        search trigger optimization, index idempotency

-- ============================================================================
-- 1. TTL CLEANUP: soft-delete instead of hard DELETE
-- ============================================================================
-- The original cleanup_expired function hard-deletes items, bypassing the
-- soft-delete/30-day-purge lifecycle used elsewhere. Fix to soft-delete.

CREATE OR REPLACE FUNCTION skill_store_cleanup_expired()
RETURNS integer AS $$
DECLARE
  v_total_updated integer := 0;
  v_batch_updated integer;
BEGIN
  LOOP
    UPDATE skill_store_item
    SET deleted_at = now()
    WHERE id IN (
      SELECT id FROM skill_store_item
      WHERE expires_at IS NOT NULL
        AND expires_at < now()
        AND pinned = false
        AND deleted_at IS NULL
      LIMIT 1000
    );
    GET DIAGNOSTICS v_batch_updated = ROW_COUNT;
    v_total_updated := v_total_updated + v_batch_updated;

    -- Stop after 5000 rows or when no more expired items
    EXIT WHEN v_batch_updated = 0 OR v_total_updated >= 5000;
  END LOOP;

  RETURN v_total_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION skill_store_cleanup_expired IS 'Soft-delete expired skill store items (max 5000 per invocation, Issue #827)';

-- ============================================================================
-- 2. ADD CHECK CONSTRAINT on skill_id across all 3 tables
-- ============================================================================
-- skill_id allows empty strings despite documented format [a-zA-Z0-9_-]+

ALTER TABLE skill_store_item
  DROP CONSTRAINT IF EXISTS skill_store_item_skill_id_format;
ALTER TABLE skill_store_item
  ADD CONSTRAINT skill_store_item_skill_id_format
  CHECK (skill_id ~ '^[a-zA-Z0-9_-]+$');

ALTER TABLE skill_store_schedule
  DROP CONSTRAINT IF EXISTS skill_store_schedule_skill_id_format;
ALTER TABLE skill_store_schedule
  ADD CONSTRAINT skill_store_schedule_skill_id_format
  CHECK (skill_id ~ '^[a-zA-Z0-9_-]+$');

ALTER TABLE skill_store_activity
  DROP CONSTRAINT IF EXISTS skill_store_activity_skill_id_format;
ALTER TABLE skill_store_activity
  ADD CONSTRAINT skill_store_activity_skill_id_format
  CHECK (skill_id ~ '^[a-zA-Z0-9_-]+$');

-- ============================================================================
-- 3. FIX gen_random_uuid() → new_uuid() in skill_store_activity
-- ============================================================================
-- Migration 052 used gen_random_uuid() (UUIDv4) instead of project convention
-- new_uuid() (UUIDv7). Fix the default for new rows.

ALTER TABLE skill_store_activity
  ALTER COLUMN id SET DEFAULT new_uuid();

-- ============================================================================
-- 4. OPTIMIZE search vector trigger to fire only on content changes
-- ============================================================================
-- The original trigger fires on every UPDATE, even for status changes or
-- tag updates. Restrict to INSERT and UPDATE OF title, summary, content.

DROP TRIGGER IF EXISTS skill_store_item_search_vector_trigger ON skill_store_item;

CREATE TRIGGER skill_store_item_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, summary, content ON skill_store_item
  FOR EACH ROW EXECUTE FUNCTION skill_store_item_search_vector_update();

-- ============================================================================
-- 5. ADD IF NOT EXISTS to indexes that were missing it in migration 050
-- ============================================================================
-- These are no-ops if the indexes already exist (from migration 050),
-- but make the schema more robust for partial re-runs.
-- (Index creation is idempotent with IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS idx_skill_store_item_skill_collection
  ON skill_store_item (skill_id, collection);
CREATE INDEX IF NOT EXISTS idx_skill_store_item_status
  ON skill_store_item (status);
CREATE INDEX IF NOT EXISTS idx_skill_store_item_tags
  ON skill_store_item USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_skill_store_item_created_at
  ON skill_store_item (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_store_item_search_vector
  ON skill_store_item USING gin (search_vector);
