-- Rollback: Remove embedding support from work_item_memory

-- Drop trigger
DROP TRIGGER IF EXISTS tr_embedding_config_updated ON embedding_config;
DROP FUNCTION IF EXISTS update_embedding_config_timestamp();

-- Drop indexes
DROP INDEX IF EXISTS idx_memory_embedding_status;
DROP INDEX IF EXISTS idx_memory_embedding;

-- Remove embedding columns from work_item_memory
ALTER TABLE work_item_memory
  DROP COLUMN IF EXISTS embedding,
  DROP COLUMN IF EXISTS embedding_model,
  DROP COLUMN IF EXISTS embedding_provider,
  DROP COLUMN IF EXISTS embedding_status;

-- Drop embedding config table
DROP TABLE IF EXISTS embedding_config;
