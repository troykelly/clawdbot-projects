-- Migration 024: Email & Calendar Sync - Rollback

DROP TRIGGER IF EXISTS calendar_event_updated_at ON calendar_event;
DROP FUNCTION IF EXISTS update_calendar_event_updated_at();

DROP TRIGGER IF EXISTS oauth_connection_updated_at ON oauth_connection;
DROP FUNCTION IF EXISTS update_oauth_connection_updated_at();

DROP TABLE IF EXISTS calendar_event;

-- Remove columns from external_message
ALTER TABLE external_message
  DROP COLUMN IF EXISTS subject,
  DROP COLUMN IF EXISTS from_address,
  DROP COLUMN IF EXISTS to_addresses,
  DROP COLUMN IF EXISTS cc_addresses,
  DROP COLUMN IF EXISTS attachments;

-- Remove columns from external_thread
DROP INDEX IF EXISTS external_thread_sync_provider_idx;
ALTER TABLE external_thread
  DROP COLUMN IF EXISTS sync_provider,
  DROP COLUMN IF EXISTS last_synced_at,
  DROP COLUMN IF EXISTS sync_cursor;

DROP TABLE IF EXISTS oauth_connection;

DROP TYPE IF EXISTS oauth_provider;
