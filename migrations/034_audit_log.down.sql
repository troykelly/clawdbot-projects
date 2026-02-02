-- Issue #214: Rollback audit logging

-- Drop triggers
DROP TRIGGER IF EXISTS audit_memory_delete ON memory;
DROP TRIGGER IF EXISTS audit_memory_update ON memory;
DROP TRIGGER IF EXISTS audit_memory_insert ON memory;

DROP TRIGGER IF EXISTS audit_contact_delete ON contact;
DROP TRIGGER IF EXISTS audit_contact_update ON contact;
DROP TRIGGER IF EXISTS audit_contact_insert ON contact;

DROP TRIGGER IF EXISTS audit_work_item_delete ON work_item;
DROP TRIGGER IF EXISTS audit_work_item_update ON work_item;
DROP TRIGGER IF EXISTS audit_work_item_insert ON work_item;

-- Drop trigger functions
DROP FUNCTION IF EXISTS audit_memory_changes();
DROP FUNCTION IF EXISTS audit_contact_changes();
DROP FUNCTION IF EXISTS audit_work_item_changes();

-- Drop helper function
DROP FUNCTION IF EXISTS create_audit_log(audit_actor_type, text, audit_action_type, text, uuid, jsonb, jsonb);

-- Drop indexes
DROP INDEX IF EXISTS audit_log_entity_lookup_idx;
DROP INDEX IF EXISTS audit_log_entity_id_idx;
DROP INDEX IF EXISTS audit_log_entity_type_idx;
DROP INDEX IF EXISTS audit_log_action_idx;
DROP INDEX IF EXISTS audit_log_actor_id_idx;
DROP INDEX IF EXISTS audit_log_actor_type_idx;
DROP INDEX IF EXISTS audit_log_timestamp_idx;

-- Drop table
DROP TABLE IF EXISTS audit_log;

-- Drop enums
DROP TYPE IF EXISTS audit_action_type;
DROP TYPE IF EXISTS audit_actor_type;
