/**
 * Types for the embedding service.
 *
 * The embedding service supports multiple providers (Voyage AI, OpenAI, Gemini)
 * with a priority-based selection system.
 */

export type EmbeddingProviderName = 'voyageai' | 'openai' | 'gemini';

export type EmbeddingStatus = 'active' | 'migration_required' | 'unconfigured';

/**
 * Provider-specific configuration details.
 */
export interface ProviderDetails {
  readonly name: EmbeddingProviderName;
  readonly model: string;
  readonly dimensions: number;
  readonly apiEndpoint: string;
}

/**
 * Defines the provider details for each supported embedding provider.
 */
export const PROVIDER_DETAILS: Record<EmbeddingProviderName, ProviderDetails> = {
  voyageai: {
    name: 'voyageai',
    model: 'voyage-3-large',
    dimensions: 1024,
    apiEndpoint: 'https://api.voyageai.com/v1/embeddings',
  },
  openai: {
    name: 'openai',
    model: 'text-embedding-3-large',
    dimensions: 1024, // Reduced from 3072 for pgvector HNSW compatibility
    apiEndpoint: 'https://api.openai.com/v1/embeddings',
  },
  gemini: {
    name: 'gemini',
    model: 'gemini-embedding-001',
    dimensions: 1024, // Reduced from 3072 for pgvector HNSW compatibility
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
};

/**
 * Priority order for provider selection when EMBEDDING_PROVIDER is not set.
 */
export const PROVIDER_PRIORITY: EmbeddingProviderName[] = ['voyageai', 'openai', 'gemini'];

/**
 * Interface for embedding provider implementations.
 */
export interface EmbeddingProvider {
  readonly name: EmbeddingProviderName;
  readonly model: string;
  readonly dimensions: number;

  /**
   * Generate embeddings for a batch of texts.
   *
   * @param texts Array of texts to embed
   * @returns Array of embedding vectors (one per input text)
   * @throws EmbeddingError on failure
   */
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Result of a single embedding operation.
 */
export interface EmbeddingResult {
  embedding: number[];
  provider: EmbeddingProviderName;
  model: string;
}

/**
 * Configuration loaded from database for tracking active embedding setup.
 */
export interface EmbeddingConfig {
  provider: EmbeddingProviderName;
  model: string;
  dimensions: number;
  status: EmbeddingStatus;
}

/**
 * Options for batch embedding operations.
 */
export interface BatchOptions {
  /** Maximum concurrent API requests (default: 10) */
  maxConcurrent?: number;
  /** Timeout per request in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/**
 * Maximum allowed text length for embedding (approximately 8000 tokens).
 * 4 characters per token average, so ~32KB.
 */
export const MAX_EMBEDDING_TEXT_LENGTH = 32000;

/**
 * Default maximum concurrent embedding requests.
 */
export const DEFAULT_MAX_CONCURRENT = 10;

/**
 * Default timeout per embedding request in milliseconds.
 */
export const DEFAULT_TIMEOUT_MS = 30000;
