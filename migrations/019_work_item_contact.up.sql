-- Issue #118: Contact-WorkItem linking with relationship types

-- Create relationship type enum
DO $$ BEGIN
  CREATE TYPE contact_relationship_type AS ENUM (
    'owner',
    'assignee',
    'stakeholder',
    'reviewer'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create junction table for contact-work item relationships
CREATE TABLE IF NOT EXISTS work_item_contact (
  work_item_id uuid NOT NULL REFERENCES work_item(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contact(id) ON DELETE CASCADE,
  relationship contact_relationship_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (work_item_id, contact_id)
);

-- Index for efficient lookups by contact
CREATE INDEX IF NOT EXISTS idx_work_item_contact_contact_id
  ON work_item_contact(contact_id);

-- Index for filtering by relationship type
CREATE INDEX IF NOT EXISTS idx_work_item_contact_relationship
  ON work_item_contact(relationship);
