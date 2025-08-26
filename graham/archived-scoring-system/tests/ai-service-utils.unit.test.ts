/**
 * Unit Tests for AI Service Utils
 * Tests circuit breakers, timeouts, retries, and error categorization
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  CircuitBreaker,
  withTimeout,
  retryWithBackoff,
  parseAIResponse,
  isQuotaError,
  isTemporaryError,
  categorizeError,
  callAIServiceSafely,
  circuitBreakers
} from '@/lib/utils/ai-service-utils';

describe('AI Service Utils Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset circuit breakers
    circuitBreakers.openai.reset();
    circuitBreakers.anthropic.reset();
  });

  describe('CircuitBreaker', () => {
    test('should initialize in CLOSED state', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 60000,
        monitoringWindow: 300000
      });

      expect(breaker.getState()).toBe('CLOSED');
    });

    test('should remain CLOSED on successful operations', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 60000,
        monitoringWindow: 300000
      });

      const successOperation = jest.fn().mockResolvedValue('success');
      
      const result = await breaker.call(successOperation);
      
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });

    test('should open after reaching failure threshold', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 60000,
        monitoringWindow: 300000
      });

      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      // First failure
      try {
        await breaker.call(failingOperation);
      } catch (error) {
        expect(breaker.getState()).toBe('CLOSED');
      }
      
      // Second failure - should open circuit
      try {
        await breaker.call(failingOperation);
      } catch (error) {
        expect(breaker.getState()).toBe('OPEN');
      }
    });

    test('should reject immediately when OPEN', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 60000,
        monitoringWindow: 300000
      });

      // Force circuit open
      const failingOperation = jest.fn().mockRejectedValue(new Error('Initial failure'));
      try {
        await breaker.call(failingOperation);
      } catch (error) {
        expect(breaker.getState()).toBe('OPEN');
      }
      
      // Next call should fail immediately
      const nextOperation = jest.fn().mockResolvedValue('should not execute');
      
      try {
        await breaker.call(nextOperation);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('Circuit breaker is OPEN');
        expect(nextOperation).not.toHaveBeenCalled();
      }
    });

    test('should transition to HALF_OPEN after reset timeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100, // 100ms for testing
        monitoringWindow: 300000
      });

      // Force circuit open
      const failingOperation = jest.fn().mockRejectedValue(new Error('Force open'));
      try {
        await breaker.call(failingOperation);
      } catch (error) {
        expect(breaker.getState()).toBe('OPEN');
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Next operation should transition to HALF_OPEN
      const testOperation = jest.fn().mockResolvedValue('success');
      const result = await breaker.call(testOperation);
      
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED'); // Successful operation closes it
    });

    test('should reset manually', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 60000,
        monitoringWindow: 300000
      });

      // Force failures to open circuit
      const failingOp = jest.fn().mockRejectedValue(new Error('Fail'));
      breaker.call(failingOp).catch(() => {});
      
      expect(breaker.getState()).toBe('OPEN');
      
      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('withTimeout', () => {
    test('should resolve before timeout', async () => {
      const quickOperation = Promise.resolve('completed');
      
      const result = await withTimeout(quickOperation, 1000);
      expect(result).toBe('completed');
    });

    test('should timeout slow operations', async () => {
      const slowOperation = new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        await withTimeout(slowOperation, 500, 'Custom timeout message');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('Custom timeout message');
      }
    });

    test('should use default timeout message', async () => {
      const slowOperation = new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        await withTimeout(slowOperation, 500);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('Operation timed out');
      }
    });
  });

  describe('retryWithBackoff', () => {
    test('should succeed on first attempt', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(successOperation, {
        retries: 2,
        timeout: 5000,
        exponentialBackoff: true
      });
      
      expect(result).toBe('success');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });

    test('should retry on failures and eventually succeed', async () => {
      const eventualSuccessOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('third time success');
      
      const result = await retryWithBackoff(eventualSuccessOperation, {
        retries: 2,
        timeout: 5000,
        exponentialBackoff: false // Disable for faster testing
      });
      
      expect(result).toBe('third time success');
      expect(eventualSuccessOperation).toHaveBeenCalledTimes(3);
    });

    test('should fail after exhausting all retries', async () => {
      const alwaysFailOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      try {
        await retryWithBackoff(alwaysFailOperation, {
          retries: 2,
          timeout: 1000,
          exponentialBackoff: false
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('failed after 3 attempts');
        expect(alwaysFailOperation).toHaveBeenCalledTimes(3);
      }
    });

    test('should apply exponential backoff delays', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Fail'));
      const startTime = Date.now();
      
      try {
        await retryWithBackoff(failingOperation, {
          retries: 2,
          timeout: 5000,
          exponentialBackoff: true
        });
      } catch (error) {
        const elapsed = Date.now() - startTime;
        // Should include backoff delays: 1s + 2s = 3s minimum
        expect(elapsed).toBeGreaterThan(2500);
      }
    }, 10000);

    test('should handle timeout on individual attempts', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        await retryWithBackoff(slowOperation, {
          retries: 1,
          timeout: 500,
          exponentialBackoff: false
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('timeout');
      }
    });
  });

  describe('parseAIResponse', () => {
    test('should parse valid JSON responses', () => {
      const validJson = '{"status": "success", "data": {"value": 42}}';
      const result = parseAIResponse(validJson);
      
      expect(result.status).toBe('success');
      expect(result.data.value).toBe(42);
    });

    test('should extract JSON from mixed content', () => {
      const mixedContent = `
        Here's your analysis:
        {"analysis": {"score": 0.85, "confidence": "high"}}
        Let me know if you need more details!
      `;
      
      const result = parseAIResponse(mixedContent);
      expect(result.analysis.score).toBe(0.85);
      expect(result.analysis.confidence).toBe('high');
    });

    test('should throw on empty or null responses', () => {
      expect(() => parseAIResponse('')).toThrow('response is empty');
      expect(() => parseAIResponse(null as any)).toThrow('response is empty');
      expect(() => parseAIResponse(undefined as any)).toThrow('response is empty');
    });

    test('should throw on responses without JSON', () => {
      const textOnly = 'This is just plain text without any JSON structure';
      expect(() => parseAIResponse(textOnly)).toThrow('no valid JSON found');
    });

    test('should throw on malformed JSON', () => {
      const malformedJson = '{"incomplete": json';
      expect(() => parseAIResponse(malformedJson)).toThrow('JSON parsing failed');
    });

    test('should include context in error messages', () => {
      const context = 'Experience analysis response';
      expect(() => parseAIResponse('invalid', context)).toThrow(context);
    });
  });

  describe('Error Classification', () => {
    test('should identify quota errors correctly', () => {
      const quotaErrors = [
        { code: 429 },
        { status: 429 },
        { message: 'quota exceeded' },
        { message: 'rate limit exceeded' },
        { message: 'insufficient_quota detected' },
        { message: 'billing limits reached' }
      ];

      quotaErrors.forEach(error => {
        expect(isQuotaError(error)).toBe(true);
      });

      const nonQuotaErrors = [
        { code: 500 },
        { message: 'server error' },
        { code: 400, message: 'bad request' }
      ];

      nonQuotaErrors.forEach(error => {
        expect(isQuotaError(error)).toBe(false);
      });
    });

    test('should identify temporary errors correctly', () => {
      const temporaryErrors = [
        { code: 500 },
        { code: 503 },
        { code: 429 },
        { status: 502 },
        { message: 'timeout occurred' },
        { message: 'network error' },
        { message: 'connection failed' },
        { message: 'temporarily unavailable' }
      ];

      temporaryErrors.forEach(error => {
        expect(isTemporaryError(error)).toBe(true);
      });

      const permanentErrors = [
        { code: 400 },
        { code: 401 },
        { code: 403 },
        { message: 'invalid request' }
      ];

      permanentErrors.forEach(error => {
        expect(isTemporaryError(error)).toBe(false);
      });
    });

    test('should categorize errors correctly', () => {
      expect(categorizeError({ code: 429 })).toBe('quota');
      expect(categorizeError({ message: 'quota exceeded' })).toBe('quota');
      expect(categorizeError({ status: 500 })).toBe('temporary');
      expect(categorizeError({ message: 'timeout' })).toBe('temporary');
      expect(categorizeError({ code: 400 })).toBe('permanent');
      expect(categorizeError({ message: 'invalid input' })).toBe('permanent');
    });
  });

  describe('callAIServiceSafely', () => {
    test('should successfully call operation with circuit breaker', async () => {
      const successOperation = jest.fn().mockResolvedValue({ data: 'success' });
      
      const result = await callAIServiceSafely('openai', successOperation, {
        timeout: 5000,
        retries: 1
      });
      
      expect(result.data).toBe('success');
      expect(circuitBreakers.openai.getState()).toBe('CLOSED');
    });

    test('should handle failures and open circuit breaker', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service error'));
      
      // Cause multiple failures to open circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await callAIServiceSafely('anthropic', failingOperation, {
            timeout: 1000,
            retries: 0
          });
        } catch (error) {
          // Expected failures
        }
      }
      
      expect(circuitBreakers.anthropic.getState()).toBe('OPEN');
      
      // Next call should fail immediately
      try {
        await callAIServiceSafely('anthropic', failingOperation);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('Circuit breaker is OPEN');
      }
    });

    test('should handle mixed service types correctly', async () => {
      const openaiOp = jest.fn().mockResolvedValue('openai success');
      const anthropicOp = jest.fn().mockResolvedValue('anthropic success');
      
      const openaiResult = await callAIServiceSafely('openai', openaiOp);
      const anthropicResult = await callAIServiceSafely('anthropic', anthropicOp);
      
      expect(openaiResult).toBe('openai success');
      expect(anthropicResult).toBe('anthropic success');
      expect(circuitBreakers.openai.getState()).toBe('CLOSED');
      expect(circuitBreakers.anthropic.getState()).toBe('CLOSED');
    });

    test('should apply timeout and retry settings', async () => {
      const eventualSuccessOp = jest.fn()
        .mockRejectedValueOnce(new Error('First fail'))
        .mockResolvedValue('eventual success');
      
      const startTime = Date.now();
      
      const result = await callAIServiceSafely('openai', eventualSuccessOp, {
        timeout: 2000,
        retries: 1,
        exponentialBackoff: false
      });
      
      const elapsed = Date.now() - startTime;
      
      expect(result).toBe('eventual success');
      expect(eventualSuccessOp).toHaveBeenCalledTimes(2);
      expect(elapsed).toBeGreaterThan(1000); // Should include retry delay
    });

    test('should handle circuit breaker with retry logic', async () => {
      // Reset to ensure clean state
      circuitBreakers.openai.reset();
      
      const partiallyFailingOp = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue('recovery success');
      
      const result = await callAIServiceSafely('openai', partiallyFailingOp, {
        retries: 1,
        exponentialBackoff: false
      });
      
      expect(result).toBe('recovery success');
      expect(circuitBreakers.openai.getState()).toBe('CLOSED');
    });
  });
});