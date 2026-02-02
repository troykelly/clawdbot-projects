-- Issue #214: Audit logging for all mutations

-- Create actor type enum
DO $$ BEGIN
  CREATE TYPE audit_actor_type AS ENUM ('agent', 'human', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create action type enum
DO $$ BEGIN
  CREATE TYPE audit_action_type AS ENUM ('create', 'update', 'delete', 'auth', 'webhook');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT new_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  actor_type audit_actor_type NOT NULL DEFAULT 'system',
  actor_id text,                    -- Agent name, user email, or null for system
  action audit_action_type NOT NULL,
  entity_type text NOT NULL,        -- 'work_item', 'memory', 'contact', etc.
  entity_id uuid,                   -- May be null for some events (e.g., failed auth)
  changes jsonb,                    -- What changed (old/new values)
  metadata jsonb,                   -- Request ID, IP, user agent, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_type_idx ON audit_log(actor_type);
CREATE INDEX IF NOT EXISTS audit_log_actor_id_idx ON audit_log(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_entity_type_idx ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS audit_log_entity_id_idx ON audit_log(entity_id) WHERE entity_id IS NOT NULL;

-- Combined index for entity lookups
CREATE INDEX IF NOT EXISTS audit_log_entity_lookup_idx ON audit_log(entity_type, entity_id);

-- Partition hint for future: consider partitioning by month if this table grows large

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_actor_type audit_actor_type,
  p_actor_id text,
  p_action audit_action_type,
  p_entity_type text,
  p_entity_id uuid,
  p_changes jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, changes, metadata)
  VALUES (p_actor_type, p_actor_id, p_action, p_entity_type, p_entity_id, p_changes, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Trigger function for automatic work_item audit logging
CREATE OR REPLACE FUNCTION audit_work_item_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_action audit_action_type;
  v_changes jsonb;
  v_entity_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_id := NEW.id;
    v_changes := jsonb_build_object('new', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_entity_id := NEW.id;
    v_changes := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_id := OLD.id;
    v_changes := jsonb_build_object('old', row_to_json(OLD));
  END IF;

  -- Insert audit log entry (default to system actor - API layer can update with actual actor)
  INSERT INTO audit_log (actor_type, action, entity_type, entity_id, changes)
  VALUES ('system', v_action, 'work_item', v_entity_id, v_changes);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for work_item
DROP TRIGGER IF EXISTS audit_work_item_insert ON work_item;
DROP TRIGGER IF EXISTS audit_work_item_update ON work_item;
DROP TRIGGER IF EXISTS audit_work_item_delete ON work_item;

CREATE TRIGGER audit_work_item_insert
  AFTER INSERT ON work_item
  FOR EACH ROW
  EXECUTE FUNCTION audit_work_item_changes();

CREATE TRIGGER audit_work_item_update
  AFTER UPDATE ON work_item
  FOR EACH ROW
  EXECUTE FUNCTION audit_work_item_changes();

CREATE TRIGGER audit_work_item_delete
  AFTER DELETE ON work_item
  FOR EACH ROW
  EXECUTE FUNCTION audit_work_item_changes();

-- Trigger function for automatic contact audit logging
CREATE OR REPLACE FUNCTION audit_contact_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_action audit_action_type;
  v_changes jsonb;
  v_entity_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_id := NEW.id;
    v_changes := jsonb_build_object('new', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_entity_id := NEW.id;
    v_changes := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_id := OLD.id;
    v_changes := jsonb_build_object('old', row_to_json(OLD));
  END IF;

  INSERT INTO audit_log (actor_type, action, entity_type, entity_id, changes)
  VALUES ('system', v_action, 'contact', v_entity_id, v_changes);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for contact
DROP TRIGGER IF EXISTS audit_contact_insert ON contact;
DROP TRIGGER IF EXISTS audit_contact_update ON contact;
DROP TRIGGER IF EXISTS audit_contact_delete ON contact;

CREATE TRIGGER audit_contact_insert
  AFTER INSERT ON contact
  FOR EACH ROW
  EXECUTE FUNCTION audit_contact_changes();

CREATE TRIGGER audit_contact_update
  AFTER UPDATE ON contact
  FOR EACH ROW
  EXECUTE FUNCTION audit_contact_changes();

CREATE TRIGGER audit_contact_delete
  AFTER DELETE ON contact
  FOR EACH ROW
  EXECUTE FUNCTION audit_contact_changes();

-- Trigger function for automatic memory audit logging
CREATE OR REPLACE FUNCTION audit_memory_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_action audit_action_type;
  v_changes jsonb;
  v_entity_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_id := NEW.id;
    v_changes := jsonb_build_object('new', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_entity_id := NEW.id;
    v_changes := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_id := OLD.id;
    v_changes := jsonb_build_object('old', row_to_json(OLD));
  END IF;

  INSERT INTO audit_log (actor_type, action, entity_type, entity_id, changes)
  VALUES ('system', v_action, 'memory', v_entity_id, v_changes);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for memory
DROP TRIGGER IF EXISTS audit_memory_insert ON memory;
DROP TRIGGER IF EXISTS audit_memory_update ON memory;
DROP TRIGGER IF EXISTS audit_memory_delete ON memory;

CREATE TRIGGER audit_memory_insert
  AFTER INSERT ON memory
  FOR EACH ROW
  EXECUTE FUNCTION audit_memory_changes();

CREATE TRIGGER audit_memory_update
  AFTER UPDATE ON memory
  FOR EACH ROW
  EXECUTE FUNCTION audit_memory_changes();

CREATE TRIGGER audit_memory_delete
  AFTER DELETE ON memory
  FOR EACH ROW
  EXECUTE FUNCTION audit_memory_changes();

-- Comments
COMMENT ON TABLE audit_log IS 'Audit trail for all entity mutations';
COMMENT ON COLUMN audit_log.actor_type IS 'Type of actor: agent, human, or system';
COMMENT ON COLUMN audit_log.actor_id IS 'Identifier for the actor (agent name, user email, etc.)';
COMMENT ON COLUMN audit_log.action IS 'Type of action performed';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN audit_log.entity_id IS 'UUID of the affected entity';
COMMENT ON COLUMN audit_log.changes IS 'JSON object with old/new values';
COMMENT ON COLUMN audit_log.metadata IS 'Additional context (request ID, IP, etc.)';
