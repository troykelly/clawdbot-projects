-- File attachment table for S3-compatible storage
-- Part of Issue #215

-- Create file_attachment table
CREATE TABLE IF NOT EXISTS file_attachment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key text NOT NULL UNIQUE,
    original_filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    checksum_sha256 text,
    uploaded_by text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for listing by uploaded_by
CREATE INDEX IF NOT EXISTS idx_file_attachment_uploaded_by
    ON file_attachment(uploaded_by)
    WHERE uploaded_by IS NOT NULL;

-- Index for listing by created_at
CREATE INDEX IF NOT EXISTS idx_file_attachment_created_at
    ON file_attachment(created_at DESC);

-- Junction table for work_item attachments
CREATE TABLE IF NOT EXISTS work_item_attachment (
    work_item_id uuid NOT NULL REFERENCES work_item(id) ON DELETE CASCADE,
    file_attachment_id uuid NOT NULL REFERENCES file_attachment(id) ON DELETE CASCADE,
    attached_at timestamptz DEFAULT now() NOT NULL,
    attached_by text,
    PRIMARY KEY (work_item_id, file_attachment_id)
);

-- Index for finding attachments by work_item
CREATE INDEX IF NOT EXISTS idx_work_item_attachment_work_item
    ON work_item_attachment(work_item_id);

-- Index for finding work_items by attachment
CREATE INDEX IF NOT EXISTS idx_work_item_attachment_file
    ON work_item_attachment(file_attachment_id);

-- Junction table for external_message attachments
CREATE TABLE IF NOT EXISTS message_attachment (
    external_message_id uuid NOT NULL REFERENCES external_message(id) ON DELETE CASCADE,
    file_attachment_id uuid NOT NULL REFERENCES file_attachment(id) ON DELETE CASCADE,
    attached_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (external_message_id, file_attachment_id)
);

-- Index for finding attachments by message
CREATE INDEX IF NOT EXISTS idx_message_attachment_message
    ON message_attachment(external_message_id);

-- Index for finding messages by attachment
CREATE INDEX IF NOT EXISTS idx_message_attachment_file
    ON message_attachment(file_attachment_id);

-- Junction table for memory attachments
CREATE TABLE IF NOT EXISTS memory_attachment (
    memory_id uuid NOT NULL REFERENCES work_item_memory(id) ON DELETE CASCADE,
    file_attachment_id uuid NOT NULL REFERENCES file_attachment(id) ON DELETE CASCADE,
    attached_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (memory_id, file_attachment_id)
);

-- Index for finding attachments by memory
CREATE INDEX IF NOT EXISTS idx_memory_attachment_memory
    ON memory_attachment(memory_id);

-- Index for finding memories by attachment
CREATE INDEX IF NOT EXISTS idx_memory_attachment_file
    ON memory_attachment(file_attachment_id);

COMMENT ON TABLE file_attachment IS 'Metadata for files stored in S3-compatible storage';
COMMENT ON TABLE work_item_attachment IS 'Links files to work items';
COMMENT ON TABLE message_attachment IS 'Links files to external messages';
COMMENT ON TABLE memory_attachment IS 'Links files to memories';
