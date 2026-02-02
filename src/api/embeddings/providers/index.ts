/**
 * Provider factory for embedding providers.
 */

import { type EmbeddingProvider, type EmbeddingProviderName } from '../types.js';
import { VoyageAIProvider } from './voyageai.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';

/**
 * Create an embedding provider instance by name.
 *
 * @param name The provider name
 * @returns The provider instance
 */
export function createProvider(name: EmbeddingProviderName): EmbeddingProvider {
  switch (name) {
    case 'voyageai':
      return new VoyageAIProvider();
    case 'openai':
      return new OpenAIProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unknown embedding provider: ${name}`);
  }
}

export { VoyageAIProvider } from './voyageai.js';
export { OpenAIProvider } from './openai.js';
export { GeminiProvider } from './gemini.js';
