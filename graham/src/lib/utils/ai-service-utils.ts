/**
 * AI Service Utilities - Timeout controls, Circuit breakers, and Error handling
 * Performance optimization utilities for AI API calls
 */

import { setTimeout as setTimeoutPromise } from 'timers/promises';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before attempting to close circuit
  monitoringWindow: number; // Time window in ms for tracking failures
}

export interface AICallOptions {
  timeout?: number; // Timeout in ms (default 30 seconds)
  retries?: number; // Number of retries (default 2)
  exponentialBackoff?: boolean; // Use exponential backoff (default true)
}

export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Add timeout to any promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: AICallOptions = {}
): Promise<T> {
  const { retries = 2, exponentialBackoff = true, timeout = 30000 } = options;
  
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout to each attempt
      const result = await withTimeout(
        operation(),
        timeout,
        `AI service timeout after ${timeout}ms (attempt ${attempt + 1})`
      );
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Calculate delay for exponential backoff
      const baseDelay = 1000; // 1 second
      const delay = exponentialBackoff 
        ? baseDelay * Math.pow(2, attempt)
        : baseDelay;
        
      console.warn(`AI service call failed (attempt ${attempt + 1}/${retries + 1}):`, error);
      console.log(`Retrying in ${delay}ms...`);
      
      await setTimeoutPromise(delay);
    }
  }
  
  throw new Error(`AI service failed after ${retries + 1} attempts. Last error: ${lastError.message}`);
}

// Circuit breakers for different AI services
export const circuitBreakers = {
  openai: new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    monitoringWindow: 300000 // 5 minutes
  }),
  
  anthropic: new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    monitoringWindow: 300000 // 5 minutes
  })
};

/**
 * Wrapper for AI API calls with full protection
 */
export async function callAIServiceSafely<T>(
  serviceName: 'openai' | 'anthropic',
  operation: () => Promise<T>,
  options: AICallOptions = {}
): Promise<T> {
  const circuitBreaker = circuitBreakers[serviceName];
  
  return circuitBreaker.call(async () => {
    return retryWithBackoff(operation, options);
  });
}

/**
 * Parse JSON response safely with better error messages
 */
export function parseAIResponse(response: string, context: string = 'AI response'): any {
  if (!response || typeof response !== 'string') {
    throw new Error(`Invalid ${context}: response is empty or not a string`);
  }

  // Try to extract JSON from response (handle cases where AI adds extra text)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Invalid ${context}: no valid JSON found in response. Response: ${response.substring(0, 200)}...`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Invalid ${context}: JSON parsing failed. Error: ${error}. JSON: ${jsonMatch[0].substring(0, 200)}...`);
  }
}

/**
 * Check if error indicates quota/rate limit issues
 */
export function isQuotaError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.status;
  
  return (
    errorCode === 429 ||
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('insufficient_quota') ||
    errorMessage.includes('billing')
  );
}

/**
 * Check if error indicates temporary service issues
 */
export function isTemporaryError(error: any): boolean {
  const errorCode = error?.code || error?.status;
  const errorMessage = error?.message?.toLowerCase() || '';
  
  return (
    errorCode >= 500 ||
    errorCode === 429 ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('temporarily unavailable')
  );
}

/**
 * Get error category for proper handling
 */
export function categorizeError(error: any): 'quota' | 'temporary' | 'permanent' {
  if (isQuotaError(error)) {
    return 'quota';
  }
  
  if (isTemporaryError(error)) {
    return 'temporary';
  }
  
  return 'permanent';
}

// Updated model configurations with latest versions
export const AI_MODELS = {
  CLAUDE: {
    LATEST: 'claude-3-5-sonnet-20241022', // Current latest model
    HAIKU: 'claude-3-haiku-20240307',
    OPUS: 'claude-3-opus-20240229'
  },
  OPENAI: {
    GPT4: 'gpt-4o',
    GPT4_TURBO: 'gpt-4-turbo',
    GPT35_TURBO: 'gpt-3.5-turbo'
  }
} as const;

// Default AI service options
export const DEFAULT_AI_OPTIONS: AICallOptions = {
  timeout: 30000, // 30 seconds
  retries: 2,
  exponentialBackoff: true
};