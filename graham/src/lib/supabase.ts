import { createClient } from '@supabase/supabase-js';

// Create placeholder client that will throw meaningful errors at runtime if actually used
const createPlaceholderClient = () => {
  return new Proxy({}, {
    get: () => {
      throw new Error('Supabase client not properly initialized. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.');
    }
  }) as any;
};

// Function to create the real Supabase client
const createRealSupabaseClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Function to create the real public Supabase client
const createRealSupabasePublicClient = () => {
  if (!process.env.SUPABASE_URL) {
    throw new Error('Missing required environment variable: SUPABASE_URL');
  }
  
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || '',
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    }
  );
};

// Check if we're in build time - during build, Next.js may not have all env vars
const isBuildTime = !process.env.SUPABASE_URL || process.env.NODE_ENV === undefined;

// Export clients - use placeholders during build, real clients at runtime
export const supabase = isBuildTime 
  ? createPlaceholderClient()
  : createRealSupabaseClient();

export const supabasePublic = isBuildTime 
  ? createPlaceholderClient()
  : createRealSupabasePublicClient();

// Helper function to ensure clients are available at runtime
export const getSupabaseClient = () => {
  if (isBuildTime) {
    return createRealSupabaseClient();
  }
  return supabase;
};

export const getSupabasePublicClient = () => {
  if (isBuildTime) {
    return createRealSupabasePublicClient();
  }
  return supabasePublic;
};

// Database table names
export const TABLES = {
  USERS: 'users',
  RESEARCH_SESSIONS: 'research_sessions',
  COMMENTERS: 'commenters',
  USER_FEEDBACK: 'user_feedback',
  API_RATE_LIMITS: 'api_rate_limits',
  LINKEDIN_CACHE: 'linkedin_cache',
  // Enhanced feedback loop tables
  USER_FEEDBACK_ENHANCED: 'user_feedback_enhanced',
  USER_PREFERENCE_PROFILES: 'user_preference_profiles',
  TEAM_LEARNING_PROFILES: 'team_learning_profiles',
  LEARNING_PIPELINE_RUNS: 'learning_pipeline_runs',
  ANALYSIS_SNAPSHOTS: 'analysis_snapshots',
  OUTCOME_TRACKING: 'outcome_tracking',
  DATA_PRIVACY_CONTROLS: 'data_privacy_controls',
  FEEDBACK_PROCESSING_CACHE: 'feedback_processing_cache',
  // AI Prediction System tables
  TRAINING_DECISIONS: 'training_decisions',
  DECISION_PATTERNS: 'decision_patterns',
  PREDICTION_RESULTS: 'prediction_results',
  CONTENT_ANALYSIS: 'content_analysis',
  PROSPECT_CONTENT_SUMMARY: 'prospect_content_summary',
  // Intelligence System tables
  USER_INTELLIGENCE_PROFILES: 'user_intelligence_profiles',
  RESEARCH_SESSION_INTELLIGENCE: 'research_session_intelligence',
  FEEDBACK_INTERACTIONS: 'feedback_interactions',
  DISCOVERED_PATTERNS: 'discovered_patterns',
  RESEARCH_QUALITY_METRICS: 'research_quality_metrics',
  AGENT_IMPROVEMENTS: 'agent_improvements',
  // Orchestration tables
  ORCHESTRATION_SESSIONS: 'orchestration_sessions',
  AGENT_FAILURES: 'agent_failures'
} as const;