/**
 * Performance Validation Unit Tests
 * Tests core performance utilities and optimizations
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Performance Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Parallel Processing Utilities', () => {
    test('should execute promises in parallel', async () => {
      const startTime = Date.now();
      
      // Create mock async operations that take 100ms each
      const createAsyncOperation = (id: number, delay: number = 100) => {
        return () => new Promise(resolve => 
          setTimeout(() => resolve(`Operation ${id} complete`), delay)
        );
      };
      
      const operations = [
        createAsyncOperation(1),
        createAsyncOperation(2),
        createAsyncOperation(3)
      ];
      
      // Execute in parallel using Promise.allSettled (like the predictive scoring engine)
      const results = await Promise.allSettled(
        operations.map(op => op())
      );
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete in ~100ms (parallel) not ~300ms (sequential)
      expect(totalTime).toBeLessThan(200);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
    });

    test('should handle mixed success/failure in parallel processing', async () => {
      const operations = [
        () => Promise.resolve('Success 1'),
        () => Promise.reject(new Error('Failed 2')),
        () => Promise.resolve('Success 3'),
        () => Promise.reject(new Error('Failed 4'))
      ];
      
      const results = await Promise.allSettled(
        operations.map(op => op())
      );
      
      expect(results).toHaveLength(4);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      expect(successCount).toBe(2);
      expect(failureCount).toBe(2);
    });
  });

  describe('Timeout and Circuit Breaker Logic', () => {
    test('should timeout operations correctly', async () => {
      const timeoutPromise = <T>(promise: Promise<T>, ms: number) => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), ms)
          )
        ]);
      };
      
      const slowOperation = new Promise(resolve => 
        setTimeout(() => resolve('Too slow'), 2000)
      );
      
      const startTime = Date.now();
      
      try {
        await timeoutPromise(slowOperation, 500);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect((error as Error).message).toBe('Timeout');
        expect(elapsed).toBeLessThan(600); // Should timeout around 500ms
      }
    });

    test('should implement exponential backoff correctly', async () => {
      const backoffDelays: number[] = [];
      
      const calculateBackoff = (attempt: number, baseDelay: number = 1000) => {
        return Math.min(baseDelay * Math.pow(2, attempt), 10000);
      };
      
      // Test first few backoff delays
      for (let attempt = 0; attempt < 5; attempt++) {
        const delay = calculateBackoff(attempt);
        backoffDelays.push(delay);
      }
      
      expect(backoffDelays[0]).toBe(1000);  // 1s
      expect(backoffDelays[1]).toBe(2000);  // 2s  
      expect(backoffDelays[2]).toBe(4000);  // 4s
      expect(backoffDelays[3]).toBe(8000);  // 8s
      expect(backoffDelays[4]).toBe(10000); // 10s (capped)
    });
  });

  describe('Memory and Performance Optimization', () => {
    test('should handle large data structures efficiently', () => {
      const startMemory = process.memoryUsage().heapUsed;
      
      // Create a large but efficiently structured dataset
      const largeDataset = Array.from({ length: 10000 }, (_, index) => ({
        id: `item-${index}`,
        data: `Content for item ${index}`,
        metadata: {
          created: new Date(),
          processed: false
        }
      }));
      
      // Process the dataset (simulate batch operations)
      const processed = largeDataset
        .filter(item => item.id.length > 5)
        .map(item => ({
          ...item,
          metadata: { ...item.metadata, processed: true }
        }))
        .slice(0, 1000); // Limit results
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      
      expect(processed).toHaveLength(1000);
      expect(processed[0].metadata.processed).toBe(true);
      
      // Memory increase should be reasonable (less than 50MB for this test)
      const memoryIncreasesMB = memoryIncrease / (1024 * 1024);
      expect(memoryIncreasesMB).toBeLessThan(50);
      
      console.log(`Memory increase: ${memoryIncreasesMB.toFixed(2)} MB`);
    });

    test('should efficiently process text content', () => {
      const startTime = Date.now();
      
      // Simulate content analysis on large text
      const largeText = 'M&A transaction analysis with extensive detail. '.repeat(1000);
      const keywords = [
        'M&A', 'transaction', 'analysis', 'merger', 'acquisition',
        'due diligence', 'valuation', 'investment', 'banking'
      ];
      
      // Process text efficiently (simulate content intelligence)
      const wordCount = largeText.split(/\s+/).length;
      const keywordMatches = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = largeText.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      
      const processingTime = Date.now() - startTime;
      
      expect(wordCount).toBeGreaterThan(5000);
      expect(keywordMatches).toBeGreaterThan(1000);
      expect(processingTime).toBeLessThan(100); // Should process quickly
      
      console.log(`Text processing time: ${processingTime}ms`);
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors without performance degradation', async () => {
      const errorOperations = Array.from({ length: 100 }, (_, index) => {
        return () => {
          if (index % 3 === 0) {
            return Promise.reject(new Error(`Error ${index}`));
          }
          return Promise.resolve(`Success ${index}`);
        };
      });
      
      const startTime = Date.now();
      
      const results = await Promise.allSettled(
        errorOperations.map(op => op())
      );
      
      const processingTime = Date.now() - startTime;
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;
      
      expect(results).toHaveLength(100);
      expect(successCount).toBeGreaterThan(60); // ~67% should succeed
      expect(successCount).toBeLessThan(70);
      expect(errorCount).toBeGreaterThan(30);   // ~33% should fail
      expect(errorCount).toBeLessThan(40);
      expect(processingTime).toBeLessThan(100); // Should handle errors quickly
    });

    test('should implement graceful degradation', async () => {
      const services = ['primary', 'secondary', 'fallback'];
      
      const callService = async (serviceName: string) => {
        // Simulate service availability
        if (serviceName === 'primary') {
          throw new Error('Primary service unavailable');
        }
        if (serviceName === 'secondary') {
          throw new Error('Secondary service timeout');
        }
        return `Fallback service response`;
      };
      
      let result;
      let error;
      
      // Try services in order until one works
      for (const service of services) {
        try {
          result = await callService(service);
          break;
        } catch (err) {
          error = err;
          continue;
        }
      }
      
      expect(result).toBe('Fallback service response');
      expect(error).toBeDefined(); // Should have the last error
    });
  });

  describe('Caching and Optimization Logic', () => {
    test('should implement simple caching mechanism', () => {
      const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
      
      const getCached = (key: string) => {
        const cached = cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.timestamp + cached.ttl) {
          cache.delete(key);
          return null;
        }
        
        return cached.data;
      };
      
      const setCached = (key: string, data: any, ttlMs: number = 60000) => {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: ttlMs
        });
      };
      
      // Test caching
      setCached('test-key', 'test-value', 1000); // 1 second TTL
      
      expect(getCached('test-key')).toBe('test-value');
      expect(getCached('non-existent')).toBe(null);
      
      // Test TTL expiration (we can't wait 1 second, so we'll simulate)
      const expiredCache = cache.get('test-key');
      if (expiredCache) {
        expiredCache.timestamp = Date.now() - 2000; // Make it expired
        cache.set('test-key', expiredCache);
      }
      
      expect(getCached('test-key')).toBe(null);
    });

    test('should demonstrate batch processing efficiency', async () => {
      // Simulate processing items in batches vs individually
      const items = Array.from({ length: 100 }, (_, i) => i);
      
      const processSingle = async (item: number) => {
        // Simulate small async delay
        await new Promise(resolve => setTimeout(resolve, 1));
        return item * 2;
      };
      
      const processBatch = async (items: number[]) => {
        // Simulate batch processing with less overhead
        await new Promise(resolve => setTimeout(resolve, Math.ceil(items.length / 10)));
        return items.map(item => item * 2);
      };
      
      // Individual processing
      const singleStart = Date.now();
      const singleResults = [];
      for (const item of items) {
        const result = await processSingle(item);
        singleResults.push(result);
      }
      const singleTime = Date.now() - singleStart;
      
      // Batch processing
      const batchStart = Date.now();
      const batchResults = await processBatch(items);
      const batchTime = Date.now() - batchStart;
      
      expect(singleResults).toEqual(batchResults);
      expect(batchTime).toBeLessThan(singleTime / 2); // Batch should be much faster
      
      console.log(`Single processing: ${singleTime}ms, Batch processing: ${batchTime}ms`);
    });
  });
});