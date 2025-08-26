/**
 * Global test setup and configuration
 */

import { jest } from '@jest/globals';

// Set test timeout globally
jest.setTimeout(60000); // 60 seconds

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-anthropic-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
process.env.RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'test-rapidapi-key';

// Mock environment variables for Supabase (using test values)
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-supabase-key';

// Global test utilities
global.TEST_TIMEOUT = {
  FAST: 5000,      // 5 seconds for fast operations
  MEDIUM: 15000,   // 15 seconds for medium operations
  SLOW: 30000,     // 30 seconds for slow operations
  PERFORMANCE: 60000 // 60 seconds for performance tests
};

// Mock console methods to reduce noise in tests (but allow error tracking)
const originalError = console.error;
const originalWarn = console.warn;

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore error logging for failed tests
afterEach(() => {
  const state = expect.getState();
  if (state.currentTestName && state.suppressedErrors) {
    // Re-enable error logging for failed tests
    console.error = originalError;
    console.warn = originalWarn;
  }
});

// Reset console mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});