-- Rollback file attachment tables
-- Part of Issue #215

DROP TABLE IF EXISTS memory_attachment;
DROP TABLE IF EXISTS message_attachment;
DROP TABLE IF EXISTS work_item_attachment;
DROP TABLE IF EXISTS file_attachment;
