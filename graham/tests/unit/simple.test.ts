/**
 * Simple test to check Jest setup
 */

import { describe, test, expect } from '@jest/globals';

describe('Simple Jest Setup Test', () => {
  test('should add two numbers correctly', () => {
    const result = 2 + 3;
    expect(result).toBe(5);
  });

  test('should handle string operations', () => {
    const str = 'Hello, ' + 'World!';
    expect(str).toBe('Hello, World!');
  });
});