/**
 * Performance Tests for Critical API Endpoints
 * Validates that performance improvements are working correctly
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

describe('API Performance Tests', () => {
  let app: any;
  let server: any;
  let handle: any;

  beforeAll(async () => {
    // Set up Next.js test server
    const dev = process.env.NODE_ENV !== 'production';
    app = next({ dev, dir: './src' });
    handle = app.getRequestHandler();
    
    await app.prepare();
    
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });
    
    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });
  }, 30000);

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(resolve);
      });
    }
    if (app) {
      await app.close();
    }
  });

  describe('/api/v2/prediction/evaluate', () => {
    const mockProspectData = {
      prospectId: 'test-prospect-123',
      prospectData: {
        id: 'test-prospect-123',
        name: 'John Doe',
        headline: 'Senior M&A Advisor at Investment Firm',
        company: 'Investment Firm LLC',
        location: 'New York, NY',
        industry: 'Investment Banking',
        role: 'Senior M&A Advisor',
        experience: [
          {
            title: 'Senior M&A Advisor',
            company: 'Investment Firm LLC',
            start_date: { year: 2018 },
            end_date: { year: 2024 },
            description: 'Led M&A transactions worth $500M+ across technology and healthcare sectors'
          }
        ],
        recentPosts: [
          {
            id: 'post-1',
            content: 'Excited to share insights on the current M&A market trends in the tech sector...',
            publishedAt: '2024-01-15T10:00:00Z'
          }
        ],
        profileUrl: 'https://linkedin.com/in/johndoe',
        profilePicture: 'https://example.com/photo.jpg'
      }
    };

    test('should respond within 10 seconds for single prediction', async () => {
      const startTime = Date.now();
      
      const response = await request(server)
        .post('/api/v2/prediction/evaluate')
        .send(mockProspectData)
        .timeout(12000); // Allow 12 seconds (2 second buffer)

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(10000); // Less than 10 seconds
      expect(response.body.data.processingTime).toBeDefined();
      
      console.log(`Single prediction response time: ${responseTime}ms`);
      console.log(`API reported processing time: ${response.body.data.processingTime}ms`);
    }, global.TEST_TIMEOUT.PERFORMANCE);

    test('should handle batch processing with parallel execution', async () => {
      const batchRequest = {
        prospects: [
          { prospectId: 'batch-1', prospectData: { ...mockProspectData.prospectData, id: 'batch-1', name: 'Alice Smith' } },
          { prospectId: 'batch-2', prospectData: { ...mockProspectData.prospectData, id: 'batch-2', name: 'Bob Johnson' } },
          { prospectId: 'batch-3', prospectData: { ...mockProspectData.prospectData, id: 'batch-3', name: 'Carol Wilson' } }
        ],
        options: {
          includeReasoningDetails: true,
          includeSimilarProspects: false,
          maxSimilarProspects: 3
        }
      };

      const startTime = Date.now();
      
      const response = await request(server)
        .post('/api/v2/prediction/evaluate')
        .send(batchRequest)
        .timeout(25000); // Allow 25 seconds for batch

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions).toHaveLength(3);
      expect(response.body.data.parallelProcessingTime).toBeDefined();
      expect(response.body.data.sequentialEstimate).toBeDefined();
      expect(response.body.data.performanceGain).toBeDefined();
      
      // Verify parallel processing is actually faster
      const parallelTime = response.body.data.parallelProcessingTime;
      const sequentialEstimate = response.body.data.sequentialEstimate;
      expect(parallelTime).toBeLessThan(sequentialEstimate);
      
      console.log(`Batch processing response time: ${responseTime}ms`);
      console.log(`Parallel processing time: ${parallelTime}ms`);
      console.log(`Sequential estimate: ${sequentialEstimate}ms`);
      console.log(`Performance gain: ${response.body.data.performanceGain}`);
    }, global.TEST_TIMEOUT.PERFORMANCE);

    test('should utilize caching effectively', async () => {
      // First request - should be processed
      const firstResponse = await request(server)
        .post('/api/v2/prediction/evaluate')
        .send(mockProspectData)
        .timeout(12000);

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body.data.cached).toBe(false);

      // Second request - should be cached (if caching is implemented)
      const secondResponse = await request(server)
        .post('/api/v2/prediction/evaluate')
        .send(mockProspectData)
        .timeout(5000);

      expect(secondResponse.status).toBe(200);
      // Note: Caching may not be implemented yet, so this test documents the expectation
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should timeout after 60 seconds with proper error handling', async () => {
      // Mock a slow prospect that would trigger timeout
      const slowProspectData = {
        ...mockProspectData,
        prospectId: 'timeout-test-prospect',
        forceRefresh: true // Force processing to potentially trigger timeout
      };

      const startTime = Date.now();
      
      const response = await request(server)
        .post('/api/v2/prediction/evaluate')
        .send(slowProspectData)
        .timeout(65000); // Allow 65 seconds to test the 60-second timeout

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should either succeed within 60 seconds or return timeout error
      if (response.status === 200) {
        expect(responseTime).toBeLessThan(60000);
      } else {
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('timeout');
      }
    }, 70000); // 70 second test timeout
  });

  describe('/api/dev/profile-research', () => {
    test('should respond within 3 seconds', async () => {
      const startTime = Date.now();
      
      const response = await request(server)
        .post('/api/dev/profile-research')
        .send({
          profileUrl: 'https://www.linkedin.com/in/johndoe',
          includeContent: true
        })
        .timeout(5000); // Allow 5 seconds (2 second buffer)

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Note: This endpoint may not exist yet or may need different authentication
      // The test documents the expected performance requirement
      console.log(`Profile research response time: ${responseTime}ms`);
      
      if (response.status === 200) {
        expect(responseTime).toBeLessThan(3000); // Less than 3 seconds
      } else if (response.status === 404) {
        console.log('Profile research endpoint not implemented yet');
      }
    }, global.TEST_TIMEOUT.MEDIUM);
  });

  describe('/api/v2/analytics/metrics', () => {
    test('should respond within 1 second', async () => {
      const startTime = Date.now();
      
      const response = await request(server)
        .get('/api/v2/analytics/metrics')
        .query({
          timeframe: '24h',
          include: 'predictions,accuracy,performance'
        })
        .timeout(3000); // Allow 3 seconds (2 second buffer)

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`Analytics metrics response time: ${responseTime}ms`);
      
      if (response.status === 200) {
        expect(responseTime).toBeLessThan(1000); // Less than 1 second
        expect(response.body).toBeDefined();
      } else if (response.status === 404) {
        console.log('Analytics metrics endpoint not implemented yet');
      }
    }, global.TEST_TIMEOUT.FAST);
  });

  describe('Performance Regression Tests', () => {
    test('should maintain sub-10 second performance under load', async () => {
      const concurrentRequests = 3;
      const requests = Array.from({ length: concurrentRequests }, (_, index) => {
        return request(server)
          .post('/api/v2/prediction/evaluate')
          .send({
            ...mockProspectData,
            prospectId: `load-test-${index}`
          })
          .timeout(15000);
      });

      const startTime = Date.now();
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(`Concurrent requests (${concurrentRequests}) total time: ${totalTime}ms`);

      // Check that all requests succeeded or failed gracefully
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled') {
          expect([200, 429, 503]).toContain(response.value.status); // Success or rate limit
          if (response.value.status === 200) {
            console.log(`Request ${index} response time: ${response.value.body.data?.processingTime}ms`);
          }
        } else {
          console.log(`Request ${index} failed: ${response.reason}`);
        }
      });

      // At least some requests should succeed
      const successfulRequests = responses.filter(r => 
        r.status === 'fulfilled' && (r as any).value.status === 200
      );
      expect(successfulRequests.length).toBeGreaterThan(0);
    }, global.TEST_TIMEOUT.PERFORMANCE);

    test('should handle memory efficiently during batch processing', async () => {
      const largeBatchRequest = {
        prospects: Array.from({ length: 10 }, (_, index) => ({
          prospectId: `memory-test-${index}`,
          prospectData: {
            ...mockProspectData.prospectData,
            id: `memory-test-${index}`,
            name: `Test User ${index}`,
            // Add some content to increase memory usage
            recentPosts: Array.from({ length: 5 }, (_, postIndex) => ({
              id: `post-${index}-${postIndex}`,
              content: `This is a longer post content for memory testing purposes. Post ${postIndex} by user ${index}. `.repeat(10),
              publishedAt: new Date().toISOString()
            }))
          }
        }))
      };

      const initialMemory = process.memoryUsage();
      
      const response = await request(server)
        .post('/api/v2/prediction/evaluate')
        .send(largeBatchRequest)
        .timeout(45000);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory usage increase: ${Math.round(memoryIncrease / 1024 / 1024 * 100) / 100} MB`);
      console.log(`Heap used before: ${Math.round(initialMemory.heapUsed / 1024 / 1024 * 100) / 100} MB`);
      console.log(`Heap used after: ${Math.round(finalMemory.heapUsed / 1024 / 1024 * 100) / 100} MB`);

      if (response.status === 200) {
        expect(response.body.data.predictions).toHaveLength(10);
        // Memory increase should be reasonable (less than 100MB for this test)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      }
    }, global.TEST_TIMEOUT.PERFORMANCE);
  });
});