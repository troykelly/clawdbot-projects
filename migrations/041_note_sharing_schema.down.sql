-- Migration 041: Note Sharing and Permissions Schema (DOWN)
-- Part of Epic #337, Issue #341
-- Reverses all changes from the up migration

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_expired_shares();
DROP FUNCTION IF EXISTS generate_share_token();
DROP FUNCTION IF EXISTS validate_share_link(text, boolean);
DROP FUNCTION IF EXISTS agent_can_access_note(uuid);
DROP FUNCTION IF EXISTS user_can_access_note(uuid, text, text);

-- Drop indexes
DROP INDEX IF EXISTS idx_note_collaborator_last_seen;
DROP INDEX IF EXISTS idx_note_collaborator_user;
DROP INDEX IF EXISTS idx_note_collaborator_note;
DROP INDEX IF EXISTS idx_notebook_share_token;
DROP INDEX IF EXISTS idx_notebook_share_shared_with_email;
DROP INDEX IF EXISTS idx_notebook_share_notebook_id;
DROP INDEX IF EXISTS idx_note_share_expires_at;
DROP INDEX IF EXISTS idx_note_share_token;
DROP INDEX IF EXISTS idx_note_share_shared_with_email;
DROP INDEX IF EXISTS idx_note_share_note_id;

-- Drop tables
DROP TABLE IF EXISTS note_collaborator;
DROP TABLE IF EXISTS notebook_share;
DROP TABLE IF EXISTS note_share;
