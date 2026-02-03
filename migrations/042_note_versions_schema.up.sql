-- Migration 042: Note Versions Schema for History Tracking
-- Part of Epic #337, Issue #342
-- Creates version history system for notes

-- ============================================================================
-- NOTE_VERSION TABLE
-- ============================================================================
-- Stores snapshots of note content at each version

CREATE TABLE IF NOT EXISTS note_version (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  note_id uuid NOT NULL REFERENCES note(id) ON DELETE CASCADE,

  -- Version info
  version_number integer NOT NULL,

  -- Snapshot of content at this version
  title text NOT NULL,
  content text NOT NULL,
  summary text,

  -- Change tracking
  changed_by_email text NOT NULL,
  change_type text NOT NULL DEFAULT 'edit'
    CHECK (change_type IN ('create', 'edit', 'restore', 'auto_save')),
  change_summary text,  -- Optional description of changes

  -- Content diff (optional, for efficient storage)
  diff_from_previous jsonb,  -- JSON patch from previous version

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(note_id, version_number)
);

COMMENT ON TABLE note_version IS 'Stores historical versions of note content for history tracking';
COMMENT ON COLUMN note_version.version_number IS 'Sequential version number within each note (1, 2, 3...)';
COMMENT ON COLUMN note_version.change_type IS 'Type of change: create, edit, restore (from old version), auto_save';
COMMENT ON COLUMN note_version.diff_from_previous IS 'Optional JSON patch for storage optimization';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_note_version_note_id ON note_version(note_id);
CREATE INDEX IF NOT EXISTS idx_note_version_created_at ON note_version(created_at DESC);

-- ============================================================================
-- AUTO-VERSIONING TRIGGER
-- ============================================================================

-- Creates a version snapshot before content changes
CREATE OR REPLACE FUNCTION create_note_version()
RETURNS trigger AS $$
DECLARE
  v_next_version integer;
  v_user_email text;
BEGIN
  -- Only create version if content or title actually changed
  IF OLD.content IS DISTINCT FROM NEW.content
     OR OLD.title IS DISTINCT FROM NEW.title THEN

    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next_version
    FROM note_version
    WHERE note_id = NEW.id;

    -- Get current user from session setting (or default to system)
    v_user_email := COALESCE(
      NULLIF(current_setting('app.current_user_email', true), ''),
      'system'
    );

    -- Insert version with OLD content (before the change)
    INSERT INTO note_version (
      note_id,
      version_number,
      title,
      content,
      summary,
      changed_by_email,
      change_type
    ) VALUES (
      NEW.id,
      v_next_version,
      OLD.title,
      OLD.content,
      OLD.summary,
      v_user_email,
      'edit'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS note_version_trigger ON note;
CREATE TRIGGER note_version_trigger
  BEFORE UPDATE ON note
  FOR EACH ROW EXECUTE FUNCTION create_note_version();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get a specific version of a note
CREATE OR REPLACE FUNCTION get_note_version(
  p_note_id uuid,
  p_version_number integer
) RETURNS TABLE (
  version_number integer,
  title text,
  content text,
  summary text,
  changed_by_email text,
  change_type text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nv.version_number,
    nv.title,
    nv.content,
    nv.summary,
    nv.changed_by_email,
    nv.change_type,
    nv.created_at
  FROM note_version nv
  WHERE nv.note_id = p_note_id
    AND nv.version_number = p_version_number;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_note_version IS 'Retrieve a specific historical version of a note';

-- Get total version count for a note
CREATE OR REPLACE FUNCTION get_note_version_count(
  p_note_id uuid
) RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM note_version
  WHERE note_id = p_note_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_note_version_count IS 'Get the number of historical versions for a note';

-- Restore note to a previous version
CREATE OR REPLACE FUNCTION restore_note_version(
  p_note_id uuid,
  p_version_number integer,
  p_user_email text DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  v_version RECORD;
  v_user text;
BEGIN
  -- Get the version to restore
  SELECT title, content, summary
  INTO v_version
  FROM note_version
  WHERE note_id = p_note_id AND version_number = p_version_number;

  IF v_version IS NULL THEN
    RETURN false;
  END IF;

  -- Set user for version tracking
  v_user := COALESCE(p_user_email, current_setting('app.current_user_email', true), 'system');
  PERFORM set_config('app.current_user_email', v_user, true);

  -- Update note with old version content
  -- This will trigger create_note_version to save current state
  UPDATE note
  SET title = v_version.title,
      content = v_version.content,
      summary = v_version.summary
  WHERE id = p_note_id;

  -- Update the newly created version's change_type to 'restore'
  UPDATE note_version
  SET change_type = 'restore',
      change_summary = 'Restored from version ' || p_version_number
  WHERE note_id = p_note_id
    AND version_number = (SELECT MAX(version_number) FROM note_version WHERE note_id = p_note_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION restore_note_version IS 'Restore a note to a previous version, creating a new version entry';
