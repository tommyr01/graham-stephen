// Application configuration and environment variables

export const config = {
  // Application Info
  app: {
    name: 'Graham Stephens Build',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    poolSize: parseInt(process.env.SUPABASE_DB_POOL_SIZE || '10'),
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
    nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    tokenExpiration: '7d',
    refreshTokenExpiration: '30d',
  },

  // LinkedIn API Configuration
  linkedin: {
    rapidApiKey: process.env.RAPIDAPI_KEY || '',
    rapidApiHost: process.env.RAPIDAPI_HOST || 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com',
    requestTimeout: 30000, // 30 seconds
    maxComments: 500,
    maxPosts: 50,
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    skipSuccessfulRequests: false,
  },

  // Cache Configuration
  cache: {
    defaultTtlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '360'), // 6 hours
    profileCacheTtlMinutes: parseInt(process.env.PROFILE_CACHE_TTL_MINUTES || '1440'), // 24 hours
    postsCacheTtlMinutes: parseInt(process.env.POSTS_CACHE_TTL_MINUTES || '360'), // 6 hours
  },

  // Security Configuration
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    headersEnabled: process.env.SECURITY_HEADERS_ENABLED === 'true',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
  },

  // Feature Flags
  features: {
    monitoringEnabled: process.env.MONITORING_ENABLED === 'true',
    analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true',
    skipRateLimiting: process.env.SKIP_RATE_LIMITING === 'true',
    mockLinkedInApi: process.env.MOCK_LINKEDIN_API === 'true',
    debugEnabled: process.env.DEBUG_ENABLED === 'true',
  },

  // Relevance Scoring Configuration
  scoring: {
    defaultWeights: {
      boostTermWeight: 3.0,
      downTermWeight: -2.0,
      businessRelevanceWeight: 1.5,
      promotionalPenalty: -0.5,
      personalPenalty: -1.0,
      engagementBonus: 0.5,
      profileCompleteness: 0.5,
    },
    confidenceThresholds: {
      high: 0.8,
      medium: 0.6,
      low: 0.4,
    },
  },
} as const;

// Validation function to ensure required environment variables are set
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required environment variables
  const required = {
    'SUPABASE_URL': config.database.url,
    'SUPABASE_SERVICE_ROLE_KEY': config.database.serviceRoleKey,
    'RAPIDAPI_KEY': config.linkedin.rapidApiKey,
    'JWT_SECRET': config.auth.jwtSecret,
    'NEXTAUTH_SECRET': config.auth.nextAuthSecret,
  };

  Object.entries(required).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Validate URLs
  if (config.database.url && !config.database.url.startsWith('https://')) {
    errors.push('SUPABASE_URL must be a valid HTTPS URL');
  }

  // Validate secrets are secure (basic check)
  const secrets = [config.auth.jwtSecret, config.auth.nextAuthSecret];
  secrets.forEach((secret, index) => {
    if (secret && secret.length < 32) {
      const names = ['JWT_SECRET', 'NEXTAUTH_SECRET'];
      errors.push(`${names[index]} should be at least 32 characters long for security`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get configuration with environment-specific overrides
export function getEnvironmentConfig() {
  const baseConfig = { ...config };
  
  if (baseConfig.app.environment === 'production') {
    // Production-specific overrides
    baseConfig.logging.level = 'warn';
    baseConfig.features.debugEnabled = false;
    baseConfig.features.skipRateLimiting = false;
  } else if (baseConfig.app.environment === 'development') {
    // Development-specific overrides
    baseConfig.logging.verboseLogging = true;
    baseConfig.features.debugEnabled = true;
  }
  
  return baseConfig;
}

// Export commonly used config values for convenience
export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production';
export const isDebugging = config.features.debugEnabled && isDevelopment;