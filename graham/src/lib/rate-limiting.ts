import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './database';
import { extractTokenFromRequest, verifyToken } from './auth';
import { APIError } from './types';

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  identifier: string;
}

// Default rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  
  // LinkedIn API endpoints (external API has its own limits)
  linkedin: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // Conservative limit
  },
  
  // Analysis endpoints
  analysis: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  },
  
  // General API endpoints
  general: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 200,
  },
  
  // Feedback endpoints
  feedback: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },
} as const;

// Generate identifier for rate limiting
function generateRateLimitIdentifier(request: NextRequest): string {
  // Try to get user ID from JWT token first
  try {
    const token = extractTokenFromRequest(request);
    if (token) {
      const payload = verifyToken(token);
      return `user_${payload.userId}`;
    }
  } catch (error) {
    // Token invalid or not present, fall back to IP
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') ||
             'unknown';
             
  return `ip_${ip}`;
}

// Apply rate limiting
export async function applyRateLimit(
  request: NextRequest,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const identifier = config.keyGenerator ? 
    config.keyGenerator(request) : 
    generateRateLimitIdentifier(request);

  const windowMinutes = Math.ceil(config.windowMs / (1000 * 60));
  
  const result = await checkRateLimit(
    identifier,
    endpoint,
    config.maxRequests,
    windowMinutes
  );

  return {
    allowed: result.allowed,
    limit: config.maxRequests,
    remaining: result.remainingRequests,
    resetTime: result.resetTime,
    identifier,
  };
}

// Middleware function for rate limiting
export async function rateLimitMiddleware(
  request: NextRequest,
  endpoint: string,
  configName: keyof typeof RATE_LIMIT_CONFIGS = 'general'
): Promise<NextResponse | null> {
  try {
    const config = RATE_LIMIT_CONFIGS[configName];
    const result = await applyRateLimit(request, endpoint, config);

    // Add rate limit headers to all responses
    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.getTime().toString(),
      'X-RateLimit-Window': config.windowMs.toString(),
    };

    if (!result.allowed) {
      // Rate limit exceeded
      const rateLimitError: APIError = {
        error: 'Rate Limit Exceeded',
        message: `Too many requests. Try again after ${result.resetTime.toISOString()}`,
        statusCode: 429,
        details: {
          limit: result.limit,
          remaining: 0,
          resetTime: result.resetTime.toISOString(),
          retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
        },
      };

      return NextResponse.json(rateLimitError, {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString(),
        },
      });
    }

    // Rate limit passed, return null to continue processing
    return null;
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block requests if rate limiting fails
    return null;
  }
}

// Higher-order function to wrap API routes with rate limiting
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  configName: keyof typeof RATE_LIMIT_CONFIGS = 'general'
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, endpoint, configName);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Rate limit passed, proceed with original handler
    return handler(request, context);
  };
}

// Specific rate limiting functions for different endpoint types
export const withAuthRateLimit = (handler: any) => withRateLimit(handler, 'auth');
export const withLinkedInRateLimit = (handler: any) => withRateLimit(handler, 'linkedin');
export const withAnalysisRateLimit = (handler: any) => withRateLimit(handler, 'analysis');
export const withFeedbackRateLimit = (handler: any) => withRateLimit(handler, 'feedback');

// Clean up expired rate limit records (should be run periodically)
export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    // This function would typically be called by a cron job or background process
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Remove records older than 24 hours

    // The cleanup is handled by the database function clean_old_rate_limits()
    // which is called by the database periodically
    console.log('Rate limit cleanup would be performed here');
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}