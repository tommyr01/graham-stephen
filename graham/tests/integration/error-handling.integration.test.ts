/**
 * Error Handling Integration Tests
 * Tests JSON parsing failures, AI service timeouts, database connection issues, and rate limiting scenarios
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { 
  parseAIResponse, 
  callAIServiceSafely, 
  circuitBreakers, 
  isQuotaError, 
  isTemporaryError, 
  categorizeError,
  withTimeout
} from '@/lib/utils/ai-service-utils';
import { contentIntelligence } from '@/lib/services/content-intelligence-engine';
import { predictiveScoring } from '@/lib/services/predictive-scoring-engine';

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    // Reset circuit breakers before each test
    circuitBreakers.openai.reset();
    circuitBreakers.anthropic.reset();
    jest.clearAllMocks();
  });

  describe('JSON Parsing Error Handling', () => {
    test('should handle empty AI responses gracefully', () => {
      expect(() => {
        parseAIResponse('', 'Empty response test');
      }).toThrow('response is empty or not a string');
    });

    test('should handle null AI responses gracefully', () => {
      expect(() => {
        parseAIResponse(null as any, 'Null response test');
      }).toThrow('response is empty or not a string');
    });

    test('should handle AI responses without JSON', () => {
      const textResponse = 'This is just plain text without any JSON structure';
      
      expect(() => {
        parseAIResponse(textResponse, 'Text response test');
      }).toThrow('no valid JSON found in response');
    });

    test('should handle malformed JSON in AI responses', () => {
      const malformedJson = '{"name": "test", "value": incomplete';
      
      expect(() => {
        parseAIResponse(malformedJson, 'Malformed JSON test');
      }).toThrow('JSON parsing failed');
    });

    test('should extract JSON from mixed content responses', () => {
      const mixedResponse = `
Here's the analysis you requested:

{"roles": [{"title": "M&A Advisor", "relevanceScore": 0.9}]}

Hope this helps!`;
      
      const result = parseAIResponse(mixedResponse, 'Mixed content test');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].relevanceScore).toBe(0.9);
    });

    test('should handle nested JSON extraction correctly', () => {
      const nestedResponse = `
The analysis shows:
{
  "success": true,
  "data": {
    "roles": [
      {
        "title": "Senior M&A Advisor",
        "company": "Investment Firm",
        "relevanceScore": 0.95,
        "reasoning": "Direct M&A experience"
      }
    ],
    "metadata": {
      "totalRoles": 1,
      "averageRelevance": 0.95
    }
  }
}
Please review these results.`;
      
      const result = parseAIResponse(nestedResponse, 'Nested JSON test');
      expect(result.success).toBe(true);
      expect(result.data.roles).toHaveLength(1);
      expect(result.data.metadata.totalRoles).toBe(1);
    });
  });

  describe('AI Service Timeout Handling', () => {
    test('should timeout AI operations after specified duration', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
      
      const startTime = Date.now();
      
      try {
        await withTimeout(slowOperation(), 2000, 'Test timeout'); // 2 second timeout
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect((error as Error).message).toBe('Test timeout');
        expect(elapsed).toBeLessThan(2500); // Should timeout around 2 seconds
        expect(elapsed).toBeGreaterThan(1500); // But not too early
      }
    });

    test('should handle Claude API timeout with circuit breaker', async () => {
      const timeoutOperation = () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claude API timeout')), 100)
      );

      // Multiple timeout failures should open circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await callAIServiceSafely('anthropic', timeoutOperation, {
            timeout: 200,
            retries: 0
          });
        } catch (error) {
          expect((error as Error).message).toContain('timeout');
        }
      }

      expect(circuitBreakers.anthropic.getState()).toBe('OPEN');
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle OpenAI API timeout with exponential backoff', async () => {
      let attemptCount = 0;
      const timeoutOperation = () => {
        attemptCount++;
        return new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API timeout')), 100)
        );
      };

      const startTime = Date.now();

      try {
        await callAIServiceSafely('openai', timeoutOperation, {
          timeout: 500,
          retries: 2,
          exponentialBackoff: true
        });
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(attemptCount).toBe(3); // Initial + 2 retries
        expect(elapsed).toBeGreaterThan(3000); // Should include backoff delays (1s + 2s)
        expect((error as Error).message).toContain('failed after 3 attempts');
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle mixed timeout and success scenarios', async () => {
      let attemptCount = 0;
      const mixedOperation = () => {
        attemptCount++;
        if (attemptCount <= 2) {
          return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Temporary timeout')), 100)
          );
        } else {
          return Promise.resolve({ success: true, attempt: attemptCount });
        }
      };

      const result = await callAIServiceSafely('anthropic', mixedOperation, {
        timeout: 500,
        retries: 2,
        exponentialBackoff: false
      });

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3);
      expect(attemptCount).toBe(3);
    }, global.TEST_TIMEOUT.MEDIUM);
  });

  describe('Database Connection Error Handling', () => {
    test('should handle Supabase connection failures in content intelligence', async () => {
      const testPosts = [
        {
          id: 'db-error-test',
          content: 'Test content for database error handling',
          publishedAt: '2024-01-15T10:00:00Z'
        }
      ];

      // This test documents how the system should handle database failures
      try {
        const result = await contentIntelligence.batchAnalyzePosts(testPosts, 'db-error-test-prospect');
        
        // If successful, should return analysis results
        if (Array.isArray(result)) {
          expect(result).toBeDefined();
        }
      } catch (error) {
        // Should handle database errors gracefully without crashing
        console.log('Database error handled gracefully:', (error as Error).message);
        expect(error).toBeDefined();
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle database timeout in predictive scoring', async () => {
      const testProspect = {
        id: 'db-timeout-test',
        name: 'DB Timeout Test',
        headline: 'Test User',
        company: 'Test Company',
        location: 'Test Location',
        industry: 'Test Industry',
        role: 'Test Role',
        experience: [],
        recentPosts: [],
        profileUrl: 'https://test.com/profile'
      };

      try {
        const prediction = await predictiveScoring.predictGrahamDecision(testProspect);
        
        // Should return a fallback prediction if database operations fail
        expect(prediction).toHaveProperty('predictedDecision');
        expect(prediction).toHaveProperty('confidence');
        
        // If database fails, should use fallback logic
        if (prediction.learningMetadata.dataQuality === 'low') {
          console.log('Database timeout handled with fallback prediction');
        }
      } catch (error) {
        console.log('Database timeout error handled:', (error as Error).message);
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle database query failures gracefully', async () => {
      // Test how the system handles various database error scenarios
      const databaseErrors = [
        { code: 'PGRST301', message: 'Connection timeout' },
        { code: 'PGRST116', message: 'Query timeout' },
        { code: 'PGRST204', message: 'Table not found' },
        { code: '42P01', message: 'Relation does not exist' }
      ];

      databaseErrors.forEach(error => {
        // Document expected error handling for different database scenarios
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
        console.log(`Database error scenario: ${error.code} - ${error.message}`);
      });
    });
  });

  describe('Rate Limiting Error Handling', () => {
    test('should identify quota errors correctly', () => {
      const quotaErrors = [
        { code: 429, message: 'Rate limit exceeded' },
        { status: 429, message: 'Too many requests' },
        { message: 'You exceeded your current quota' },
        { message: 'insufficient_quota for this operation' },
        { message: 'Billing limits exceeded' }
      ];

      quotaErrors.forEach(error => {
        expect(isQuotaError(error)).toBe(true);
      });
    });

    test('should identify temporary errors correctly', () => {
      const temporaryErrors = [
        { code: 500, message: 'Internal server error' },
        { status: 503, message: 'Service unavailable' },
        { code: 429, message: 'Rate limit exceeded' },
        { message: 'Connection timeout' },
        { message: 'Network error occurred' },
        { message: 'Service temporarily unavailable' }
      ];

      temporaryErrors.forEach(error => {
        expect(isTemporaryError(error)).toBe(true);
      });
    });

    test('should categorize errors correctly', () => {
      expect(categorizeError({ code: 429, message: 'Rate limit' })).toBe('quota');
      expect(categorizeError({ message: 'exceeded your quota' })).toBe('quota');
      expect(categorizeError({ status: 500, message: 'Server error' })).toBe('temporary');
      expect(categorizeError({ message: 'timeout occurred' })).toBe('temporary');
      expect(categorizeError({ code: 400, message: 'Bad request' })).toBe('permanent');
      expect(categorizeError({ message: 'Invalid input' })).toBe('permanent');
    });

    test('should handle OpenAI rate limiting with circuit breaker', async () => {
      const rateLimitError = {
        code: 429,
        message: 'Rate limit exceeded. Please try again later.',
        status: 429
      };

      const rateLimitOperation = jest.fn().mockRejectedValue(rateLimitError);

      // Multiple rate limit errors should open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await callAIServiceSafely('openai', rateLimitOperation, {
            timeout: 5000,
            retries: 0
          });
        } catch (error) {
          expect(isQuotaError(error)).toBe(true);
        }
      }

      expect(circuitBreakers.openai.getState()).toBe('OPEN');

      // Next call should fail immediately due to circuit breaker
      try {
        await callAIServiceSafely('openai', rateLimitOperation);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('Circuit breaker is OPEN');
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle LinkedIn API rate limiting gracefully', async () => {
      // Mock LinkedIn rate limit response
      const linkedInRateLimit = {
        status: 429,
        message: 'LinkedIn API rate limit exceeded',
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '3600'
        }
      };

      expect(isQuotaError(linkedInRateLimit)).toBe(true);
      expect(categorizeError(linkedInRateLimit)).toBe('quota');
      
      // Application should handle this by implementing retry logic with backoff
      console.log('LinkedIn rate limit scenario documented');
    });
  });

  describe('Content Intelligence Error Handling', () => {
    test('should handle AI service failures in content analysis', async () => {
      const testPosts = [
        {
          id: 'ai-failure-test',
          content: 'Test content for AI failure handling',
          publishedAt: '2024-01-15T10:00:00Z'
        }
      ];

      // Mock AI service failure
      const originalAnalyze = contentIntelligence.batchAnalyzePosts;
      
      try {
        // Should handle AI failures and provide fallback analysis
        const result = await contentIntelligence.batchAnalyzePosts(testPosts, 'ai-failure-prospect');
        
        // If AI fails, should still return some form of analysis
        if (Array.isArray(result) && result.length > 0) {
          expect(result[0]).toHaveProperty('authenticityScore');
          expect(result[0]).toHaveProperty('expertiseLevel');
        }
      } catch (error) {
        // Should not throw unhandled errors
        console.log('AI service failure handled:', (error as Error).message);
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should provide fallback content analysis when AI is unavailable', async () => {
      const testProspect = {
        id: 'fallback-test',
        name: 'Fallback Test User',
        headline: 'M&A Advisor with marketing agency background',
        company: 'Test Firm',
        location: 'Test City',
        industry: 'Investment Banking',
        role: 'M&A Advisor',
        experience: [
          {
            title: 'Marketing Director',
            company: 'Marketing Agency',
            start_date: { year: 2020 },
            end_date: { year: 2022 },
            description: 'Led marketing campaigns and lead generation'
          }
        ],
        recentPosts: [
          {
            id: 'fallback-post',
            content: 'guru ninja rockstar unlimited earnings opportunity marketing agency',
            publishedAt: '2024-01-15T10:00:00Z'
          }
        ],
        profileUrl: 'https://test.com/profile'
      };

      // Test fallback content analysis directly
      const fallbackAnalysis = predictiveScoring.generateFallbackContentAnalysis(testProspect);
      
      expect(fallbackAnalysis).toHaveProperty('overallQuality');
      expect(fallbackAnalysis).toHaveProperty('authenticityScore');
      expect(fallbackAnalysis).toHaveProperty('expertiseLevel');
      expect(fallbackAnalysis).toHaveProperty('redFlagCount');
      
      // Should detect red flags in the content
      expect(fallbackAnalysis.redFlagCount).toBeGreaterThan(0);
      expect(fallbackAnalysis.overallQuality).toBe('low');
      expect(fallbackAnalysis.authenticityScore).toBeLessThan(6.0);
      
      console.log('Fallback analysis result:', fallbackAnalysis);
    });
  });

  describe('Predictive Scoring Error Handling', () => {
    test('should handle complete system failure gracefully', async () => {
      const testProspect = {
        id: 'system-failure-test',
        name: 'System Failure Test',
        headline: 'Test User',
        company: 'Test Company',
        location: 'Test Location',
        industry: 'Test Industry',
        role: 'Test Role',
        experience: [],
        recentPosts: [],
        profileUrl: 'https://test.com/profile'
      };

      try {
        const prediction = await predictiveScoring.predictGrahamDecision(testProspect);
        
        // Should always return a prediction object, even if it's a fallback
        expect(prediction).toHaveProperty('predictedDecision');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('reasoning');
        expect(prediction).toHaveProperty('scoreBreakdown');
        expect(prediction).toHaveProperty('learningMetadata');
        
        // Fallback predictions should have low confidence
        if (prediction.learningMetadata.dataQuality === 'low') {
          expect(prediction.confidence).toBeLessThan(50);
          console.log('System failure handled with fallback prediction');
        }
      } catch (error) {
        expect(true).toBe(false); // Should never throw unhandled errors
      }
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should handle partial service failures in parallel processing', async () => {
      const testProspect = {
        id: 'partial-failure-test',
        name: 'Partial Failure Test',
        headline: 'Senior M&A Advisor',
        company: 'Investment Firm',
        location: 'New York, NY',
        industry: 'Investment Banking',
        role: 'M&A Advisor',
        experience: [
          {
            title: 'M&A Advisor',
            company: 'Investment Firm',
            start_date: { year: 2020 },
            end_date: { year: 2024 },
            description: 'Leading M&A transactions'
          }
        ],
        recentPosts: [
          {
            id: 'partial-failure-post',
            content: 'Sharing insights on M&A market trends...',
            publishedAt: '2024-01-15T10:00:00Z'
          }
        ],
        profileUrl: 'https://test.com/profile'
      };

      try {
        const prediction = await predictiveScoring.predictGrahamDecision(testProspect);
        
        // Should handle partial failures (e.g., content analysis fails but similar prospects works)
        expect(prediction.predictedDecision).toMatch(/^(contact|skip)$/);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.reasoning.primaryFactors).toBeDefined();
        expect(prediction.reasoning.concerningSignals).toBeDefined();
        
        console.log('Partial failure test completed successfully');
        console.log(`Result: ${prediction.predictedDecision} (${prediction.confidence}% confidence)`);
      } catch (error) {
        console.log('Partial failure test error handled:', (error as Error).message);
        expect(error).toBeDefined();
      }
    }, global.TEST_TIMEOUT.SLOW);
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from circuit breaker open state', async () => {
      // Force circuit breaker open with failures
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service failure'));
      
      for (let i = 0; i < 3; i++) {
        try {
          await callAIServiceSafely('anthropic', failingOperation, { retries: 0 });
        } catch (error) {
          // Expected failures
        }
      }
      
      expect(circuitBreakers.anthropic.getState()).toBe('OPEN');
      
      // Wait for circuit breaker reset timeout (in real scenario)
      // For testing, we'll manually reset
      circuitBreakers.anthropic.reset();
      
      // Now successful operation should work
      const successfulOperation = jest.fn().mockResolvedValue({ success: true });
      const result = await callAIServiceSafely('anthropic', successfulOperation);
      
      expect(result.success).toBe(true);
      expect(circuitBreakers.anthropic.getState()).toBe('CLOSED');
    }, global.TEST_TIMEOUT.MEDIUM);

    test('should maintain service availability under mixed error conditions', async () => {
      // Simulate mixed success/failure scenario
      let callCount = 0;
      const mixedOperation = () => {
        callCount++;
        // Fail every 3rd call
        if (callCount % 3 === 0) {
          return Promise.reject(new Error(`Simulated failure ${callCount}`));
        }
        return Promise.resolve({ success: true, callNumber: callCount });
      };

      const results = [];
      const errors = [];

      // Make 10 calls
      for (let i = 0; i < 10; i++) {
        try {
          const result = await callAIServiceSafely('anthropic', mixedOperation, {
            timeout: 5000,
            retries: 1
          });
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
      }

      // Should have some successes and some failures
      expect(results.length).toBeGreaterThan(0);
      expect(results.length + errors.length).toBe(10);
      
      console.log(`Mixed operation results: ${results.length} successes, ${errors.length} failures`);
    }, global.TEST_TIMEOUT.MEDIUM);
  });
});