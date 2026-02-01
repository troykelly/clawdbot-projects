-- Migration 024: Email & Calendar Sync (issue #184)

-- OAuth provider enum
DO $$ BEGIN
  CREATE TYPE oauth_provider AS ENUM ('google', 'microsoft');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- OAuth connections table for storing tokens
CREATE TABLE IF NOT EXISTS oauth_connection (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  user_email text NOT NULL,
  provider oauth_provider NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz,
  token_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_email, provider)
);

CREATE INDEX IF NOT EXISTS oauth_connection_user_email_idx ON oauth_connection(user_email);
CREATE INDEX IF NOT EXISTS oauth_connection_provider_idx ON oauth_connection(provider);
CREATE INDEX IF NOT EXISTS oauth_connection_expires_at_idx ON oauth_connection(expires_at);

-- Extend external_thread with sync metadata
ALTER TABLE external_thread
  ADD COLUMN IF NOT EXISTS sync_provider oauth_provider,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_cursor text;

CREATE INDEX IF NOT EXISTS external_thread_sync_provider_idx ON external_thread(sync_provider);

-- Extend external_message with email-specific fields
ALTER TABLE external_message
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS from_address text,
  ADD COLUMN IF NOT EXISTS to_addresses text[],
  ADD COLUMN IF NOT EXISTS cc_addresses text[],
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_event (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  user_email text NOT NULL,
  provider oauth_provider NOT NULL,
  external_event_id text NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  work_item_id uuid REFERENCES work_item(id) ON DELETE SET NULL,
  event_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS calendar_event_user_email_idx ON calendar_event(user_email);
CREATE INDEX IF NOT EXISTS calendar_event_provider_idx ON calendar_event(provider);
CREATE INDEX IF NOT EXISTS calendar_event_start_time_idx ON calendar_event(start_time);
CREATE INDEX IF NOT EXISTS calendar_event_end_time_idx ON calendar_event(end_time);
CREATE INDEX IF NOT EXISTS calendar_event_work_item_id_idx ON calendar_event(work_item_id);

-- Trigger to update updated_at for oauth_connection
CREATE OR REPLACE FUNCTION update_oauth_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oauth_connection_updated_at
  BEFORE UPDATE ON oauth_connection
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_connection_updated_at();

-- Trigger to update updated_at for calendar_event
CREATE OR REPLACE FUNCTION update_calendar_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_event_updated_at
  BEFORE UPDATE ON calendar_event
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_updated_at();

COMMENT ON TABLE oauth_connection IS 'Stores OAuth tokens for email and calendar integrations';
COMMENT ON TABLE calendar_event IS 'Synchronized calendar events from external providers';
COMMENT ON COLUMN external_thread.sync_provider IS 'OAuth provider used to sync this thread';
COMMENT ON COLUMN external_thread.last_synced_at IS 'Last successful sync timestamp';
COMMENT ON COLUMN external_thread.sync_cursor IS 'Provider-specific sync cursor for incremental sync';
