-- Migration: Add embedding support to work_item_memory
-- Required extension: pgvector (enabled in 007_required_extensions)
-- All providers use 1024 dimensions for pgvector HNSW compatibility

-- Track active embedding configuration (singleton row)
CREATE TABLE IF NOT EXISTS embedding_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'migration_required', 'unconfigured')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add embedding columns to work_item_memory
-- Using 1024 dimensions (pgvector HNSW index max is 2000)
-- All providers request 1024-dimension outputs
ALTER TABLE work_item_memory
  ADD COLUMN IF NOT EXISTS embedding vector(1024),
  ADD COLUMN IF NOT EXISTS embedding_model TEXT,
  ADD COLUMN IF NOT EXISTS embedding_provider TEXT,
  ADD COLUMN IF NOT EXISTS embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('complete', 'pending', 'failed'));

-- Create HNSW index for fast similarity search
-- Using cosine distance for semantic similarity
-- m=16, ef_construction=64 provides good recall/speed balance
CREATE INDEX IF NOT EXISTS idx_memory_embedding
  ON work_item_memory
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for finding memories by embedding status (for backfill operations)
CREATE INDEX IF NOT EXISTS idx_memory_embedding_status
  ON work_item_memory(embedding_status)
  WHERE embedding_status != 'complete';

-- Update trigger for embedding_config
CREATE OR REPLACE FUNCTION update_embedding_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_embedding_config_updated ON embedding_config;
CREATE TRIGGER tr_embedding_config_updated
  BEFORE UPDATE ON embedding_config
  FOR EACH ROW
  EXECUTE FUNCTION update_embedding_config_timestamp();
