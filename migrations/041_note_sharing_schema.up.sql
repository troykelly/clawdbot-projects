-- Migration 041: Note Sharing and Permissions Schema
-- Part of Epic #337, Issue #341
-- Creates sharing system for notes and notebooks

-- ============================================================================
-- NOTE_SHARE TABLE
-- ============================================================================
-- Direct note sharing with users or via share links

CREATE TABLE IF NOT EXISTS note_share (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  note_id uuid NOT NULL REFERENCES note(id) ON DELETE CASCADE,

  -- Share target (one of these should be set)
  shared_with_email text,        -- Specific user
  share_link_token text UNIQUE,  -- Public link token

  -- Permissions
  permission text NOT NULL DEFAULT 'read'
    CHECK (permission IN ('read', 'read_write')),

  -- Access controls
  is_single_view boolean DEFAULT false,  -- Link dies after first view
  view_count integer DEFAULT 0,
  max_views integer,                     -- Optional view limit
  expires_at timestamptz,                -- Optional expiration

  -- Metadata
  created_by_email text NOT NULL,
  note_title_snapshot text,  -- Title at time of share for display

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,

  -- Ensure at least one target is set
  CONSTRAINT note_share_target_check CHECK (
    shared_with_email IS NOT NULL OR share_link_token IS NOT NULL
  )
);

COMMENT ON TABLE note_share IS 'Shares granting access to individual notes';
COMMENT ON COLUMN note_share.share_link_token IS 'URL-safe token for anonymous access';
COMMENT ON COLUMN note_share.is_single_view IS 'When true, link is invalidated after first view';
COMMENT ON COLUMN note_share.note_title_snapshot IS 'Cached title at share creation for display';

-- ============================================================================
-- NOTEBOOK_SHARE TABLE
-- ============================================================================
-- Notebook-level sharing (inherited by all notes in notebook)

CREATE TABLE IF NOT EXISTS notebook_share (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  notebook_id uuid NOT NULL REFERENCES notebook(id) ON DELETE CASCADE,

  -- Share target
  shared_with_email text,
  share_link_token text UNIQUE,

  -- Permissions (applied to all notes in notebook)
  permission text NOT NULL DEFAULT 'read'
    CHECK (permission IN ('read', 'read_write')),

  -- Access controls
  expires_at timestamptz,

  -- Metadata
  created_by_email text NOT NULL,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,

  -- Ensure at least one target is set
  CONSTRAINT notebook_share_target_check CHECK (
    shared_with_email IS NOT NULL OR share_link_token IS NOT NULL
  )
);

COMMENT ON TABLE notebook_share IS 'Shares granting access to all notes in a notebook';

-- ============================================================================
-- NOTE_COLLABORATOR TABLE
-- ============================================================================
-- Active collaborators for presence and real-time features

CREATE TABLE IF NOT EXISTS note_collaborator (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  note_id uuid NOT NULL REFERENCES note(id) ON DELETE CASCADE,
  user_email text NOT NULL,

  -- Presence
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  cursor_position jsonb,  -- For collaborative editing: {"line": 10, "column": 5}

  UNIQUE(note_id, user_email)
);

COMMENT ON TABLE note_collaborator IS 'Tracks active collaborators for presence features';
COMMENT ON COLUMN note_collaborator.cursor_position IS 'JSON with line/column for cursor display';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- note_share indexes
CREATE INDEX IF NOT EXISTS idx_note_share_note_id ON note_share(note_id);
CREATE INDEX IF NOT EXISTS idx_note_share_shared_with_email ON note_share(shared_with_email)
  WHERE shared_with_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_note_share_token ON note_share(share_link_token)
  WHERE share_link_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_note_share_expires_at ON note_share(expires_at)
  WHERE expires_at IS NOT NULL;

-- notebook_share indexes
CREATE INDEX IF NOT EXISTS idx_notebook_share_notebook_id ON notebook_share(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_share_shared_with_email ON notebook_share(shared_with_email)
  WHERE shared_with_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notebook_share_token ON notebook_share(share_link_token)
  WHERE share_link_token IS NOT NULL;

-- note_collaborator indexes
CREATE INDEX IF NOT EXISTS idx_note_collaborator_note ON note_collaborator(note_id);
CREATE INDEX IF NOT EXISTS idx_note_collaborator_user ON note_collaborator(user_email);
-- Note: Stale collaborator cleanup uses last_seen_at column - index on that for cleanup queries
CREATE INDEX IF NOT EXISTS idx_note_collaborator_last_seen ON note_collaborator(last_seen_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user has access to note with specified permission
CREATE OR REPLACE FUNCTION user_can_access_note(
  p_note_id uuid,
  p_user_email text,
  p_required_permission text DEFAULT 'read'
) RETURNS boolean AS $$
DECLARE
  v_note RECORD;
  v_has_access boolean := false;
BEGIN
  -- Get the note
  SELECT n.user_email, n.visibility, n.notebook_id, n.deleted_at
  INTO v_note
  FROM note n
  WHERE n.id = p_note_id;

  -- Note doesn't exist or is deleted
  IF v_note IS NULL OR v_note.deleted_at IS NOT NULL THEN
    RETURN false;
  END IF;

  -- Owner always has full access
  IF v_note.user_email = p_user_email THEN
    RETURN true;
  END IF;

  -- Public notes allow read access to everyone
  IF v_note.visibility = 'public' AND p_required_permission = 'read' THEN
    RETURN true;
  END IF;

  -- Check direct note share
  SELECT EXISTS (
    SELECT 1 FROM note_share ns
    WHERE ns.note_id = p_note_id
      AND ns.shared_with_email = p_user_email
      AND (ns.expires_at IS NULL OR ns.expires_at > NOW())
      AND (
        p_required_permission = 'read'
        OR ns.permission = 'read_write'
      )
  ) INTO v_has_access;

  IF v_has_access THEN
    RETURN true;
  END IF;

  -- Check notebook-level share (if note is in a notebook)
  IF v_note.notebook_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM notebook_share nbs
      WHERE nbs.notebook_id = v_note.notebook_id
        AND nbs.shared_with_email = p_user_email
        AND (nbs.expires_at IS NULL OR nbs.expires_at > NOW())
        AND (
          p_required_permission = 'read'
          OR nbs.permission = 'read_write'
        )
    ) INTO v_has_access;
  END IF;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_can_access_note IS 'Check if user has specified permission on note via ownership, direct share, or notebook share';

-- Check if agent can access note (for OpenClaw plugin)
CREATE OR REPLACE FUNCTION agent_can_access_note(
  p_note_id uuid
) RETURNS boolean AS $$
DECLARE
  v_visibility text;
  v_hide_from_agents boolean;
  v_deleted_at timestamptz;
BEGIN
  SELECT visibility, hide_from_agents, deleted_at
  INTO v_visibility, v_hide_from_agents, v_deleted_at
  FROM note
  WHERE id = p_note_id;

  -- Note doesn't exist or is deleted
  IF v_visibility IS NULL OR v_deleted_at IS NOT NULL THEN
    RETURN false;
  END IF;

  -- Private notes are never accessible to agents
  IF v_visibility = 'private' THEN
    RETURN false;
  END IF;

  -- Explicit agent exclusion
  IF v_hide_from_agents THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION agent_can_access_note IS 'Check if OpenClaw agent can access note based on visibility and hide_from_agents flag';

-- Validate and consume share link token
CREATE OR REPLACE FUNCTION validate_share_link(
  p_token text,
  p_increment_view boolean DEFAULT true
) RETURNS TABLE (
  note_id uuid,
  permission text,
  is_valid boolean,
  error_message text
) AS $$
DECLARE
  v_share RECORD;
BEGIN
  -- Find the share
  SELECT ns.note_id, ns.permission, ns.is_single_view, ns.view_count,
         ns.max_views, ns.expires_at
  INTO v_share
  FROM note_share ns
  WHERE ns.share_link_token = p_token;

  IF v_share IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'Invalid or expired link'::text;
    RETURN;
  END IF;

  -- Check expiration
  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < NOW() THEN
    RETURN QUERY SELECT v_share.note_id, NULL::text, false, 'Link has expired'::text;
    RETURN;
  END IF;

  -- Check single view
  IF v_share.is_single_view AND v_share.view_count > 0 THEN
    RETURN QUERY SELECT v_share.note_id, NULL::text, false,
      'This link can only be viewed once'::text;
    RETURN;
  END IF;

  -- Check max views
  IF v_share.max_views IS NOT NULL AND v_share.view_count >= v_share.max_views THEN
    RETURN QUERY SELECT v_share.note_id, NULL::text, false,
      'Maximum views reached for this link'::text;
    RETURN;
  END IF;

  -- Increment view count and update last accessed
  IF p_increment_view THEN
    UPDATE note_share
    SET view_count = view_count + 1,
        last_accessed_at = NOW()
    WHERE share_link_token = p_token;
  END IF;

  RETURN QUERY SELECT v_share.note_id, v_share.permission, true, NULL::text;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_share_link IS 'Validate share token, check limits, optionally increment view count';

-- Generate secure share token using multiple UUIDs for sufficient entropy
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS text AS $$
BEGIN
  -- Combine two UUIDv4s (256 bits total) and remove hyphens for a compact URL-safe token
  RETURN replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_share_token IS 'Generate cryptographically secure URL-safe share token';

-- Cleanup expired and stale data
CREATE OR REPLACE FUNCTION cleanup_expired_shares() RETURNS integer AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  -- Delete expired share links (keep user shares for audit)
  DELETE FROM note_share
  WHERE share_link_token IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  DELETE FROM notebook_share
  WHERE share_link_token IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at < NOW() - INTERVAL '7 days';

  -- Delete stale collaborator presence (older than 1 hour)
  DELETE FROM note_collaborator
  WHERE last_seen_at < NOW() - INTERVAL '1 hour';

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_shares IS 'Remove expired link shares (7+ days old) and stale collaborator presence';
