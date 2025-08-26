import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing env.SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Public client for anonymous access (uses anon key)
export const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

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
  AGENT_IMPROVEMENTS: 'agent_improvements'
} as const;