-- Migration 042: Note Versions Schema (DOWN)
-- Part of Epic #337, Issue #342
-- Reverses all changes from the up migration

-- Drop functions
DROP FUNCTION IF EXISTS restore_note_version(uuid, integer, text);
DROP FUNCTION IF EXISTS get_note_version_count(uuid);
DROP FUNCTION IF EXISTS get_note_version(uuid, integer);

-- Drop trigger and function
DROP TRIGGER IF EXISTS note_version_trigger ON note;
DROP FUNCTION IF EXISTS create_note_version();

-- Drop indexes
DROP INDEX IF EXISTS idx_note_version_created_at;
DROP INDEX IF EXISTS idx_note_version_note_id;

-- Drop table
DROP TABLE IF EXISTS note_version;
