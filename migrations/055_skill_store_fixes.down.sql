-- Migration 055: Rollback Skill Store schema fixes (Issue #827)

-- Restore original search vector trigger (fires on all updates)
DROP TRIGGER IF EXISTS skill_store_item_search_vector_trigger ON skill_store_item;

CREATE TRIGGER skill_store_item_search_vector_trigger
  BEFORE INSERT OR UPDATE ON skill_store_item
  FOR EACH ROW EXECUTE FUNCTION skill_store_item_search_vector_update();

-- Restore gen_random_uuid() default on skill_store_activity
ALTER TABLE skill_store_activity
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Remove skill_id format constraints
ALTER TABLE skill_store_activity
  DROP CONSTRAINT IF EXISTS skill_store_activity_skill_id_format;
ALTER TABLE skill_store_schedule
  DROP CONSTRAINT IF EXISTS skill_store_schedule_skill_id_format;
ALTER TABLE skill_store_item
  DROP CONSTRAINT IF EXISTS skill_store_item_skill_id_format;

-- Restore original hard-delete cleanup function
CREATE OR REPLACE FUNCTION skill_store_cleanup_expired()
RETURNS integer AS $$
DECLARE
  v_total_deleted integer := 0;
  v_batch_deleted integer;
BEGIN
  LOOP
    DELETE FROM skill_store_item
    WHERE id IN (
      SELECT id FROM skill_store_item
      WHERE expires_at IS NOT NULL
        AND expires_at < now()
        AND pinned = false
        AND deleted_at IS NULL
      LIMIT 1000
    );
    GET DIAGNOSTICS v_batch_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_batch_deleted;

    EXIT WHEN v_batch_deleted = 0 OR v_total_deleted >= 5000;
  END LOOP;

  RETURN v_total_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION skill_store_cleanup_expired IS 'Batched cleanup of expired skill store items (max 5000 per invocation)';
