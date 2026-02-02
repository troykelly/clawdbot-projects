import { describe, expect, it } from 'vitest'
import {
  register,
  plugin,
  createMemoryRecallTool,
  createMemoryStoreTool,
  createMemoryForgetTool,
  MemoryRecallParamsSchema,
  MemoryStoreParamsSchema,
  MemoryForgetParamsSchema,
  MemoryCategory,
} from '../src/index.js'

describe('Plugin Entry Point', () => {
  describe('exports', () => {
    it('should export register function', () => {
      expect(typeof register).toBe('function')
    })

    it('should export plugin object', () => {
      expect(plugin).toBeDefined()
      expect(typeof plugin).toBe('object')
    })
  })

  describe('plugin object', () => {
    it('should have id property', () => {
      expect(plugin.id).toBe('openclaw-projects')
    })

    it('should have name property', () => {
      expect(plugin.name).toBe('OpenClaw Projects Plugin')
    })

    it('should have kind property set to memory', () => {
      expect(plugin.kind).toBe('memory')
    })

    it('should have register method', () => {
      expect(typeof plugin.register).toBe('function')
    })
  })

  describe('register function', () => {
    it('should be callable with context', () => {
      const mockContext = {
        config: { apiUrl: 'http://example.com', apiKey: 'test-key' },
        logger: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {} },
      }
      // Should not throw
      expect(() => register(mockContext)).not.toThrow()
    })

    it('should return plugin instance', () => {
      const mockContext = {
        config: { apiUrl: 'http://example.com', apiKey: 'test-key' },
        logger: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, namespace: 'test' },
      }
      const result = register(mockContext)
      expect(result).toBeDefined()
    })

    it('should return instance with memoryRecall tool', () => {
      const mockContext = {
        config: { apiUrl: 'http://example.com', apiKey: 'test-key' },
        logger: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, namespace: 'test' },
      }
      const result = register(mockContext)
      expect(result.tools).toBeDefined()
      expect(result.tools.memoryRecall).toBeDefined()
      expect(result.tools.memoryRecall.name).toBe('memory_recall')
    })

    it('should return instance with memoryStore tool', () => {
      const mockContext = {
        config: { apiUrl: 'http://example.com', apiKey: 'test-key' },
        logger: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, namespace: 'test' },
      }
      const result = register(mockContext)
      expect(result.tools).toBeDefined()
      expect(result.tools.memoryStore).toBeDefined()
      expect(result.tools.memoryStore.name).toBe('memory_store')
    })

    it('should return instance with memoryForget tool', () => {
      const mockContext = {
        config: { apiUrl: 'http://example.com', apiKey: 'test-key' },
        logger: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, namespace: 'test' },
      }
      const result = register(mockContext)
      expect(result.tools).toBeDefined()
      expect(result.tools.memoryForget).toBeDefined()
      expect(result.tools.memoryForget.name).toBe('memory_forget')
    })
  })

  describe('tool exports', () => {
    it('should export createMemoryRecallTool', () => {
      expect(typeof createMemoryRecallTool).toBe('function')
    })

    it('should export createMemoryStoreTool', () => {
      expect(typeof createMemoryStoreTool).toBe('function')
    })

    it('should export createMemoryForgetTool', () => {
      expect(typeof createMemoryForgetTool).toBe('function')
    })

    it('should export MemoryRecallParamsSchema', () => {
      expect(MemoryRecallParamsSchema).toBeDefined()
    })

    it('should export MemoryStoreParamsSchema', () => {
      expect(MemoryStoreParamsSchema).toBeDefined()
    })

    it('should export MemoryForgetParamsSchema', () => {
      expect(MemoryForgetParamsSchema).toBeDefined()
    })

    it('should export MemoryCategory enum', () => {
      expect(MemoryCategory).toBeDefined()
    })
  })
})
