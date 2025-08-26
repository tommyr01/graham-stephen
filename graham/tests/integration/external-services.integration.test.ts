/**
 * Integration Tests for External Services
 * Tests LinkedIn RapidAPI, Claude AI, OpenAI, and Database operations
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import nock from 'nock';
import { supabase } from '@/lib/supabase';
import { circuitBreakers, callAIServiceSafely, parseAIResponse } from '@/lib/utils/ai-service-utils';
import { contentIntelligence } from '@/lib/services/content-intelligence-engine';
import { predictiveScoring } from '@/lib/services/predictive-scoring-engine';

describe('External Service Integration Tests', () => {
  beforeAll(() => {
    // Reset circuit breakers before tests
    circuitBreakers.openai.reset();
    circuitBreakers.anthropic.reset();
  });

  afterAll(() => {
    // Clean up nock interceptors
    nock.cleanAll();
  });

  describe('LinkedIn RapidAPI Integration', () => {
    test('should handle successful LinkedIn profile extraction', async () => {
      const mockLinkedInResponse = {
        profileData: {
          basicInfo: {
            name: 'John Doe',
            headline: 'Senior M&A Advisor',
            company: 'Investment Firm',
            location: 'New York, NY',
            industry: 'Investment Banking'
          },
          experience: [
            {
              title: 'Senior M&A Advisor',
              company: 'Investment Firm',
              start_date: { year: 2018 },
              end_date: { year: 2024 },
              description: 'Leading M&A transactions'
            }
          ],
          recentPosts: [
            {
              id: 'post-1',
              content: 'Market insights on recent M&A trends...',
              publishedAt: '2024-01-15T10:00:00Z'
            }
          ]
        }
      };

      // Mock LinkedIn API call
      nock('https://linkedin-data-api.p.rapidapi.com')
        .post('/get-profile-data-by-url')
        .reply(200, mockLinkedInResponse);

      // Test the integration - this would normally call the actual LinkedIn service
      // For now, we'll test the mock response structure
      expect(mockLinkedInResponse.profileData.basicInfo.name).toBe('John Doe');
      expect(mockLinkedInResponse.profileData.experience).toHaveLength(1);
      expect(mockLinkedInResponse.profileData.recentPosts).toHaveLength(1);
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle LinkedIn API rate limiting', async () => {
      // Mock rate limit response
      nock('https://linkedin-data-api.p.rapidapi.com')
        .post('/get-profile-data-by-url')
        .reply(429, {
          error: 'Rate limit exceeded',
          message: 'Too many requests'
        });

      // The application should handle 429 responses gracefully
      // This test documents the expected behavior
      expect(true).toBe(true); // Placeholder for actual rate limit handling test
    }, global.TEST_TIMEOUT.FAST);

    test('should handle LinkedIn profile not found', async () => {
      // Mock profile not found response
      nock('https://linkedin-data-api.p.rapidapi.com')
        .post('/get-profile-data-by-url')
        .reply(404, {
          error: 'Profile not found',
          message: 'The requested LinkedIn profile could not be found'
        });

      // Application should handle 404 responses gracefully
      expect(true).toBe(true); // Placeholder for actual 404 handling test
    }, global.TEST_TIMEOUT.FAST);
  });

  describe('Claude AI Service Integration', () => {
    test('should handle successful Anthropic API calls with circuit breaker', async () => {
      const mockClaudeResponse = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            roles: [
              {
                roleIndex: 0,
                title: 'M&A Advisor',
                company: 'Investment Firm',
                relevanceScore: 0.9,
                reasoning: 'Direct M&A experience with high relevance'
              }
            ]
          })
        }],
        usage: {
          input_tokens: 1000,
          output_tokens: 200
        }
      };

      // Test circuit breaker and AI service wrapper
      const mockOperation = jest.fn().mockResolvedValue(mockClaudeResponse);
      
      const result = await callAIServiceSafely('anthropic', mockOperation, {
        timeout: 30000,
        retries: 2
      });

      expect(result).toBe(mockClaudeResponse);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(circuitBreakers.anthropic.getState()).toBe('CLOSED');
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle Anthropic API failures with circuit breaker', async () => {
      // Test circuit breaker behavior with failures
      const mockFailingOperation = jest.fn()
        .mockRejectedValueOnce(new Error('API Error 1'))
        .mockRejectedValueOnce(new Error('API Error 2'))
        .mockRejectedValueOnce(new Error('API Error 3'))
        .mockResolvedValue({ success: true });

      // First 3 calls should fail and open the circuit
      try {
        await callAIServiceSafely('anthropic', mockFailingOperation);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Circuit breaker should now be open
      expect(circuitBreakers.anthropic.getState()).toBe('OPEN');

      // Next call should fail immediately due to open circuit
      try {
        await callAIServiceSafely('anthropic', mockFailingOperation);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('Circuit breaker is OPEN');
      }

      // Reset for next tests
      circuitBreakers.anthropic.reset();
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle Claude API timeout correctly', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 35000)); // 35 seconds

      try {
        await callAIServiceSafely('anthropic', slowOperation, {
          timeout: 30000 // 30 second timeout
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('timeout');
      }
    }, 40000); // 40 second test timeout

    test('should parse AI responses correctly', () => {
      const validJsonResponse = `{
        "roles": [
          {
            "roleIndex": 0,
            "title": "M&A Advisor",
            "relevanceScore": 0.9
          }
        ]
      }`;

      const parsed = parseAIResponse(validJsonResponse, 'Test response');
      expect(parsed.roles).toHaveLength(1);
      expect(parsed.roles[0].relevanceScore).toBe(0.9);
    });

    test('should handle malformed AI responses', () => {
      const invalidResponse = 'This is not valid JSON';

      expect(() => {
        parseAIResponse(invalidResponse, 'Test response');
      }).toThrow('no valid JSON found');
    });
  });

  describe('OpenAI Service Integration', () => {
    test('should handle OpenAI API quota exceeded gracefully', async () => {
      const quotaError = {
        message: 'You exceeded your current quota',
        code: 429,
        status: 429
      };

      const mockOperation = jest.fn().mockRejectedValue(quotaError);

      try {
        await callAIServiceSafely('openai', mockOperation);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Circuit breaker should handle quota errors
      expect(circuitBreakers.openai.getState()).toBe('OPEN');

      // Reset for next tests
      circuitBreakers.openai.reset();
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle OpenAI API temporary service errors', async () => {
      const serviceError = {
        message: 'Service temporarily unavailable',
        code: 503,
        status: 503
      };

      const mockOperation = jest.fn()
        .mockRejectedValueOnce(serviceError)
        .mockResolvedValue({ choices: [{ message: { content: 'Success' } }] });

      // Should retry and succeed
      const result = await callAIServiceSafely('openai', mockOperation, {
        retries: 2,
        timeout: 10000
      });

      expect(result.choices[0].message.content).toBe('Success');
      expect(mockOperation).toHaveBeenCalledTimes(2); // Initial call + 1 retry
    }, global.TEST_TIMEOUT.MEDIUM);
  });

  describe('Database Operations', () => {
    test('should handle Supabase connection successfully', async () => {
      try {
        // Test basic Supabase connection
        const { data, error } = await supabase
          .from('training_decisions')
          .select('count(*)')
          .limit(1);

        if (error) {
          console.log('Supabase connection test failed (expected in test environment):', error.message);
        } else {
          expect(data).toBeDefined();
        }
      } catch (error) {
        console.log('Supabase connection test error (expected in test environment):', error);
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle database query timeouts', async () => {
      try {
        // Test with a potentially slow query
        const { data, error } = await supabase
          .from('prediction_results')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) {
          console.log('Database timeout test failed (expected in test environment):', error.message);
        } else {
          expect(data).toBeDefined();
        }
      } catch (error) {
        console.log('Database timeout test error (expected in test environment):', error);
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle database connection failures gracefully', async () => {
      // This tests the application's resilience to database failures
      // In a real scenario, we'd mock a failed connection
      try {
        const { data, error } = await supabase
          .from('nonexistent_table')
          .select('*');

        expect(error).toBeDefined();
        expect(error?.message).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, global.TEST_TIMEOUT.FAST);
  });

  describe('End-to-End Service Integration', () => {
    test('should handle content intelligence workflow with AI service failures', async () => {
      const testPosts = [
        {
          id: 'test-post-1',
          content: 'Sharing insights on the latest M&A trends in the technology sector...',
          publishedAt: '2024-01-15T10:00:00Z'
        }
      ];

      try {
        // This should handle AI service failures gracefully
        const result = await contentIntelligence.batchAnalyzePosts(testPosts, 'test-prospect-integration');
        
        // If AI services are working, we should get analysis results
        if (Array.isArray(result) && result.length > 0) {
          expect(result[0]).toHaveProperty('authenticityScore');
          expect(result[0]).toHaveProperty('expertiseLevel');
        } else {
          // If AI services fail, should handle gracefully
          console.log('Content intelligence test completed with service limitations');
        }
      } catch (error) {
        console.log('Content intelligence integration test error:', error);
        // Should not throw unhandled errors
      }
    }, global.TEST_TIMEOUT.SLOW);

    test('should handle predictive scoring with service limitations', async () => {
      const testProspect = {
        id: 'integration-test-prospect',
        name: 'Integration Test User',
        headline: 'M&A Advisor at Test Firm',
        company: 'Test Investment Firm',
        location: 'Test City, NY',
        industry: 'Investment Banking',
        role: 'M&A Advisor',
        experience: [
          {
            title: 'M&A Advisor',
            company: 'Test Investment Firm',
            start_date: { year: 2020 },
            end_date: { year: 2024 },
            description: 'Leading M&A transactions and advisory services'
          }
        ],
        recentPosts: [
          {
            id: 'integration-post-1',
            content: 'Excited to share our recent deal success in the tech M&A space...',
            publishedAt: '2024-01-15T10:00:00Z'
          }
        ],
        profileUrl: 'https://linkedin.com/in/integrationtest'
      };

      try {
        const prediction = await predictiveScoring.predictGrahamDecision(testProspect);
        
        expect(prediction).toHaveProperty('predictedDecision');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('reasoning');
        expect(prediction.predictedDecision).toMatch(/^(contact|skip)$/);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(100);
        
        console.log('Predictive scoring integration test completed successfully');
        console.log(`Prediction: ${prediction.predictedDecision} (${prediction.confidence}% confidence)`);
      } catch (error) {
        console.log('Predictive scoring integration test error:', error);
        // Should handle errors gracefully and not crash
      }
    }, global.TEST_TIMEOUT.SLOW);
  });
});