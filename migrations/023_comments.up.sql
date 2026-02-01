-- Migration 023: Comments and presence for multi-user collaboration (issue #182)

-- Comments table for work items
CREATE TABLE IF NOT EXISTS work_item_comment (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  work_item_id uuid NOT NULL REFERENCES work_item(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES work_item_comment(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  content text NOT NULL,
  mentions text[] NOT NULL DEFAULT '{}',
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS work_item_comment_work_item_id_idx ON work_item_comment(work_item_id);
CREATE INDEX IF NOT EXISTS work_item_comment_parent_id_idx ON work_item_comment(parent_id);
CREATE INDEX IF NOT EXISTS work_item_comment_user_email_idx ON work_item_comment(user_email);
CREATE INDEX IF NOT EXISTS work_item_comment_created_at_idx ON work_item_comment(created_at DESC);

-- Comment reactions table
CREATE TABLE IF NOT EXISTS work_item_comment_reaction (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  comment_id uuid NOT NULL REFERENCES work_item_comment(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  emoji text NOT NULL CHECK (length(emoji) <= 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_email, emoji)
);

CREATE INDEX IF NOT EXISTS work_item_comment_reaction_comment_id_idx ON work_item_comment_reaction(comment_id);

-- User presence table (ephemeral, but stored in DB for simplicity)
CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  user_email text NOT NULL,
  work_item_id uuid REFERENCES work_item(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  cursor_position jsonb,
  UNIQUE(user_email, work_item_id)
);

CREATE INDEX IF NOT EXISTS user_presence_work_item_id_idx ON user_presence(work_item_id);
CREATE INDEX IF NOT EXISTS user_presence_user_email_idx ON user_presence(user_email);
CREATE INDEX IF NOT EXISTS user_presence_last_seen_idx ON user_presence(last_seen_at);

-- Trigger to update updated_at for comments
CREATE OR REPLACE FUNCTION update_work_item_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_item_comment_updated_at
  BEFORE UPDATE ON work_item_comment
  FOR EACH ROW
  EXECUTE FUNCTION update_work_item_comment_updated_at();

COMMENT ON TABLE work_item_comment IS 'Comments on work items for collaboration';
COMMENT ON TABLE work_item_comment_reaction IS 'Emoji reactions to comments';
COMMENT ON TABLE user_presence IS 'Tracks which users are currently viewing work items';
