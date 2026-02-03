# Embedding Service Design

## Overview

openclaw-projects needs to generate embeddings for semantic search across memories, contacts, and work items. This design adds a pluggable embedding service supporting multiple providers.

## Problem Statement

Issue #200 assumed agents would provide embeddings. They won't. This service must generate embeddings using external APIs (Voyage AI, OpenAI, Gemini).

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider support | Voyage AI, OpenAI, Gemini | Anthropic recommends Voyage; OpenAI/Gemini widely used |
| Priority order | Voyage → OpenAI → Gemini | Voyage best for Claude ecosystem; explicit override via env var |
| Default models | voyage-3-large, text-embedding-3-large, gemini-embedding-004 | Best quality from each provider |
| Embedding timing | Synchronous | Agents can handle ~500ms latency; simpler than async |
| Dimension handling | Fixed per provider, migration on switch | pgvector performs best with fixed dimensions |
| Error handling | Retry with backoff, warn caller | Don't fail requests; degrade gracefully |
| Backfill strategy | Lazy on search + admin bulk endpoint | Balances cost with functionality |

## Environment Configuration

### Provider Selection

```bash
# Explicit provider override (optional)
EMBEDDING_PROVIDER=voyageai|openai|gemini

# If not set, uses first configured in priority order:
# 1. Voyage AI  2. OpenAI  3. Gemini
```

### API Keys (each supports three-tier loading)

```bash
# Voyage AI (Priority 1)
VOYAGERAI_API_KEY=pa-...
VOYAGERAI_API_KEY_FILE=/path/to/key
VOYAGERAI_API_KEY_COMMAND=op read 'op://vault/voyageai/key'

# OpenAI (Priority 2)
OPENAI_API_KEY=sk-...
OPENAI_API_KEY_FILE=/path/to/key
OPENAI_API_KEY_COMMAND=op read 'op://vault/openai/key'

# Gemini (Priority 3)
GEMINI_API_KEY=...
GEMINI_API_KEY_FILE=/path/to/key
GEMINI_API_KEY_COMMAND=op read 'op://vault/gemini/key'
```

### Provider Details

| Provider | Default Model | Dimensions | API Endpoint |
|----------|---------------|------------|--------------|
| Voyage AI | voyage-3-large | 1024 | https://api.voyageai.com/v1/embeddings |
| OpenAI | text-embedding-3-large | 3072 | https://api.openai.com/v1/embeddings |
| Gemini | gemini-embedding-004 | 768 | https://generativelanguage.googleapis.com/v1beta/models |

## Database Schema

### New Migration

```sql
-- Track active embedding configuration (singleton)
CREATE TABLE embedding_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add embedding columns to work_item_memory
-- Note: vector dimension set based on configured provider at migration time
ALTER TABLE work_item_memory
  ADD COLUMN embedding vector(1024),      -- Voyage default; adjusted per provider
  ADD COLUMN embedding_model TEXT,
  ADD COLUMN embedding_provider TEXT;

-- HNSW index for fast similarity search
CREATE INDEX idx_memory_embedding ON work_item_memory
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Dimension Mismatch Handling

On startup:
1. Read `embedding_config` from DB
2. Compare with current env var configuration
3. If provider changed: log warning, set `embedding_status: 'migration_required'`
4. Health endpoint reports embedding config and status

## Service Architecture

### Provider Interface

```typescript
interface EmbeddingProvider {
  readonly name: 'voyageai' | 'openai' | 'gemini';
  readonly model: string;
  readonly dimensions: number;

  embed(texts: string[]): Promise<number[][]>;
}
```

### Embedding Service

```typescript
interface EmbeddingService {
  isConfigured(): boolean;
  getProvider(): EmbeddingProvider | null;
  getConfig(): EmbeddingConfig | null;

  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[], options?: BatchOptions): Promise<EmbeddingResult[]>;
}

interface EmbeddingResult {
  embedding: number[];
  provider: string;
  model: string;
}

interface EmbeddingConfig {
  provider: string;
  model: string;
  dimensions: number;
  status: 'active' | 'migration_required' | 'unconfigured';
}
```

### Error Handling

```typescript
type EmbeddingErrorType = 'rate_limit' | 'auth' | 'network' | 'invalid_input';

interface EmbeddingError {
  type: EmbeddingErrorType;
  retryable: boolean;
  retryAfterMs?: number;
  message: string;
}

// Retry strategy by error type:
// - rate_limit: exponential backoff (1s, 2s, 4s), max 3 retries
// - network: immediate retry once, then fail
// - auth: no retry, fail immediately (misconfiguration)
// - invalid_input: no retry, fail immediately (bad data)
```

## API Endpoints

### Memory Creation with Embedding

```
POST /api/memories
Content-Type: application/json

{
  "title": "User preference",
  "content": "Prefers dark mode and minimal notifications",
  "memory_type": "preference",
  "work_item_id": "uuid-optional"
}

Response 201:
{
  "id": "uuid",
  "title": "User preference",
  "content": "...",
  "embedding_status": "complete" | "pending" | "failed",
  "embedding_provider": "voyageai",
  "embedding_model": "voyage-3-large"
}
```

### Semantic Search

```
GET /api/memories/search?q=notification+settings&limit=10

Response 200:
{
  "results": [
    {
      "id": "uuid",
      "title": "User preference",
      "content": "...",
      "similarity": 0.89,
      "search_type": "semantic"
    }
  ],
  "search_type": "semantic" | "text",
  "query_embedding_provider": "voyageai"
}
```

If embedding fails for query, falls back to ILIKE text search with `search_type: "text"`.

### Bulk Embedding (Admin)

```
POST /api/admin/embeddings/backfill
Authorization: Bearer <secret>

{
  "entity_type": "memory",
  "batch_size": 100,
  "force": false  // re-embed even if embedding exists
}

Response 202:
{
  "job_id": "uuid",
  "status": "started",
  "total_records": 1500,
  "estimated_batches": 15
}
```

### Provider Migration (Admin)

```
POST /api/admin/embeddings/migrate
Authorization: Bearer <secret>

{
  "new_provider": "openai",
  "confirm": true
}

Response 200:
{
  "status": "migration_started",
  "old_provider": "voyageai",
  "new_provider": "openai",
  "old_dimensions": 1024,
  "new_dimensions": 3072,
  "records_to_reembed": 1500
}
```

This will:
1. Create new embedding column with correct dimensions (keep old)
2. Update `embedding_config` with new provider, status='migrating'
3. Trigger background re-embedding of all records
4. Once complete, drop old column and update status='active'

Note: During migration, searches use old embeddings until new ones ready.

## Health Check Integration

```
GET /health/ready

Response 200:
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "embeddings": {
      "status": "configured",
      "provider": "voyageai",
      "model": "voyage-3-large",
      "dimensions": 1024,
      "config_match": true
    }
  }
}
```

## Testing Strategy

### Unit Tests (No API Keys)
- Provider selection logic
- Error handling and retry logic
- Configuration loading
- Dimension validation

### Integration Tests (Real APIs)
- Actual embedding generation
- Semantic search accuracy
- Batch operations
- Error scenarios (rate limits via small delays)

### CI Configuration

Add GitHub Secrets:
- `VOYAGERAI_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Update `.github/workflows/ci.yml`:
```yaml
- name: Install deps + run tests
  env:
    VOYAGERAI_API_KEY: ${{ secrets.VOYAGERAI_API_KEY }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: |
    docker compose ... exec -T \
      -e VOYAGERAI_API_KEY \
      -e OPENAI_API_KEY \
      -e GEMINI_API_KEY \
      workspace bash -lc "pnpm -s test"
```

## File Structure

```
src/
  api/
    embeddings/
      providers/
        voyageai.ts      # Voyage AI provider implementation
        openai.ts        # OpenAI provider implementation
        gemini.ts        # Gemini provider implementation
        index.ts         # Provider factory
      service.ts         # EmbeddingService implementation
      config.ts          # Configuration loading (mirrors auth/secret.ts pattern)
      types.ts           # TypeScript interfaces
      errors.ts          # Error types and retry logic
    routes/
      memories.ts        # Updated with embedding integration
      admin/
        embeddings.ts    # Admin endpoints for backfill/migrate
migrations/
  0XX_add_embeddings.sql
tests/
  embeddings/
    providers.test.ts
    service.test.ts
    integration.test.ts
```

## Implementation Order

1. **Config & Types** - `config.ts`, `types.ts`, `errors.ts`
2. **Provider Implementations** - Start with Voyage AI, then OpenAI, Gemini
3. **Service Layer** - `service.ts` with retry logic
4. **Database Migration** - Schema changes
5. **Memory API Integration** - Update existing routes
6. **Search Endpoint** - Semantic search with fallback
7. **Admin Endpoints** - Backfill and migration
8. **Health Check** - Embedding status reporting
9. **Tests** - Unit and integration

## Related Issues

- #200 - Add pgvector embedding column and semantic memory search API (this design)
- #205 - Implement memory and entity relationship discovery (uses embeddings)
- #216 - Unified search across all entities (extends embedding to other entities)

## Security Considerations

### API Key Protection
- Never log API keys in error messages or stack traces
- Sanitize all error responses before returning to clients
- Use structured logging with explicit field allowlists

### Admin Endpoint Protection
- Migration endpoint requires `confirm: true` AND valid admin secret
- Consider adding request signing or nonce to prevent replay attacks
- Log all admin actions to audit trail

### Input Validation
- Max text length: 8000 tokens (~32KB) per embedding request
- Reject oversized content with 400 error before calling provider
- Sanitize text (strip control characters, normalize unicode)

## Production Considerations

### Timeouts
- API call timeout: 30 seconds
- Bulk operation timeout: 5 minutes per batch
- Health check embedding test: 5 seconds

### Concurrency Control
- Max concurrent embedding requests: 10 (configurable)
- Bulk backfill respects rate limits with adaptive delays
- Queue requests when limit reached (don't fail)

### Cost Control
- Log embedding API calls with token counts
- Health endpoint reports daily/monthly embedding counts
- Future: configurable daily limit with alerts

### Deduplication (Future Enhancement)
- Hash content before embedding
- Check for existing embedding with same hash
- Skip API call if found (return cached)
- Note: Not in initial implementation; add if costs become concern

### Migration Safety
- Migration creates new column alongside old (not drop-replace)
- Old column retained until re-embedding complete
- Rollback possible by pointing back to old column
- Final cleanup removes old column after verification

### Metrics to Track
- `embedding_requests_total` (by provider, status)
- `embedding_latency_seconds` (histogram)
- `search_fallback_to_text_total` (when embeddings fail)
- `embedding_backfill_progress` (for bulk operations)

### Index Maintenance
- HNSW indexes are self-maintaining
- Monitor index size via `pg_relation_size`
- Consider `REINDEX CONCURRENTLY` if performance degrades

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Which providers? | Voyage AI, OpenAI, Gemini (priority order) |
| Sync or async embedding? | Synchronous for simplicity |
| How to handle dimension mismatch? | Warn at startup, require explicit migration |
| Backfill strategy? | Lazy on search + admin bulk endpoint |
| Testing without API keys? | Use real APIs with secrets in CI |
| Input length limits? | 8000 tokens max, validate before API call |
| Timeouts? | 30s for single requests, 5min for bulk batches |
| Concurrency? | Max 10 concurrent, queue overflow |
