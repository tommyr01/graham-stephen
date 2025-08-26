-- Migration: Comprehensive Feedback Loop System Schema
-- Description: Creates tables and structures for the user feedback loop feature
-- including user preferences, team learning, outcome tracking, and privacy controls
-- Version: 1.0.0
-- Date: 2025-01-14

BEGIN;

-- Create enums for feedback types and statuses
CREATE TYPE feedback_type AS ENUM ('binary', 'detailed', 'outcome', 'bulk', 'implicit');
CREATE TYPE feedback_status AS ENUM ('pending', 'processed', 'incorporated', 'rejected');
CREATE TYPE learning_stage AS ENUM ('collecting', 'processing', 'validating', 'deploying', 'monitoring');
CREATE TYPE preference_weight AS ENUM ('low', 'medium', 'high', 'critical');

-- Enhanced user feedback table to support comprehensive feedback collection
DROP TABLE IF EXISTS user_feedback_enhanced CASCADE;
CREATE TABLE user_feedback_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID, -- For team-based learning (nullable for individual users)
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    commenter_id UUID REFERENCES commenters(id) ON DELETE CASCADE,
    analysis_id UUID, -- Links to specific analysis run
    
    -- Feedback metadata
    feedback_type feedback_type NOT NULL DEFAULT 'binary',
    feedback_status feedback_status DEFAULT 'pending',
    priority INTEGER DEFAULT 0, -- For processing priority
    
    -- Core feedback data
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
    is_relevant BOOLEAN,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Factor-specific ratings (detailed feedback)
    factor_ratings JSONB DEFAULT '{}', -- {"contentRelevance": 5, "professionalFit": 3, etc.}
    correction_flags JSONB DEFAULT '[]', -- ["industry_classification", "seniority_level"]
    
    -- Text feedback
    feedback_text TEXT,
    improvement_suggestions TEXT,
    additional_notes TEXT,
    
    -- Outcome-based tracking
    outcome_data JSONB DEFAULT '{}', -- Contact results, meeting outcomes, etc.
    success_indicators JSONB DEFAULT '{}', -- Conversation quality, opportunity creation
    
    -- Context preservation for learning
    analysis_context JSONB DEFAULT '{}', -- Original analysis data and scoring factors
    user_context JSONB DEFAULT '{}', -- User state, preferences at time of feedback
    
    -- Processing and learning integration
    processing_attempts INTEGER DEFAULT 0,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    learning_weight DECIMAL(5,2) DEFAULT 1.0, -- Weight in learning algorithm
    
    -- Metadata
    source_ip INET, -- For rate limiting and abuse detection
    user_agent TEXT, -- For context
    device_info JSONB, -- Device and browser information
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- For data retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating_or_relevance CHECK (overall_rating IS NOT NULL OR is_relevant IS NOT NULL),
    CONSTRAINT valid_outcome_feedback CHECK (
        feedback_type != 'outcome' OR outcome_data IS NOT NULL
    )
);

-- User preference profiles for personalized learning
CREATE TABLE user_preference_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID, -- For team-based learning
    
    -- Industry and role preferences (learned from feedback)
    industry_weights JSONB DEFAULT '{}', -- {"SaaS": {"weight": 0.85, "confidence": 0.9, "sample_size": 23}}
    role_preferences JSONB DEFAULT '{}', -- {"C-Level": {"positive_rate": 0.9, "total_samples": 15}}
    company_size_preferences JSONB DEFAULT '{}',
    
    -- Content and communication style preferences
    content_preferences JSONB DEFAULT '{}', -- {"technical_posts": +0.3, "thought_leadership": +0.5}
    communication_style_weights JSONB DEFAULT '{}',
    timing_preferences JSONB DEFAULT '{}',
    
    -- Learned patterns and success indicators
    success_patterns JSONB DEFAULT '{}', -- Characteristics of successful prospects
    failure_patterns JSONB DEFAULT '{}', -- Patterns to avoid
    
    -- Preference metadata
    total_feedback_count INTEGER DEFAULT 0,
    last_significant_update TIMESTAMP WITH TIME ZONE,
    learning_confidence DECIMAL(3,2) DEFAULT 0.0, -- Overall confidence in learned preferences
    model_version VARCHAR(50) DEFAULT '1.0', -- For model versioning
    
    -- Performance tracking
    accuracy_trend JSONB DEFAULT '[]', -- Historical accuracy measurements
    recent_performance DECIMAL(5,2), -- Recent scoring accuracy percentage
    improvement_rate DECIMAL(5,2), -- Rate of improvement over time
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, team_id)
);

-- Team learning aggregation for organization-wide intelligence
CREATE TABLE team_learning_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    organization_id UUID, -- For multi-team organizations
    
    -- Team metadata
    team_name VARCHAR(255),
    team_type VARCHAR(100), -- sales, marketing, recruiting, etc.
    team_size INTEGER DEFAULT 0,
    active_members INTEGER DEFAULT 0,
    
    -- Aggregated learning data
    collective_preferences JSONB DEFAULT '{}', -- Merged preferences from all team members
    consensus_patterns JSONB DEFAULT '{}', -- Patterns agreed upon by majority
    diverse_perspectives JSONB DEFAULT '{}', -- Areas where team members differ
    
    -- Performance metrics
    team_accuracy DECIMAL(5,2), -- Overall team scoring accuracy
    individual_vs_team_benefit DECIMAL(5,2), -- Benefit of team learning vs individual
    knowledge_transfer_rate DECIMAL(3,2), -- How quickly new members benefit
    
    -- Learning quality assurance
    outlier_detection JSONB DEFAULT '{}', -- Detection of inconsistent feedback
    quality_scores JSONB DEFAULT '{}', -- Quality assessment of team feedback
    
    -- Collaboration metrics
    feedback_distribution JSONB DEFAULT '{}', -- Who provides how much feedback
    expertise_areas JSONB DEFAULT '{}', -- Team members' areas of expertise
    
    -- Timestamps and versioning
    last_aggregation TIMESTAMP WITH TIME ZONE,
    model_version VARCHAR(50) DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(team_id)
);

-- Learning pipeline tracking and management
CREATE TABLE learning_pipeline_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_type VARCHAR(100) NOT NULL, -- 'individual', 'team', 'global'
    stage learning_stage DEFAULT 'collecting',
    
    -- Target identification
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For individual learning
    team_id UUID, -- For team learning
    
    -- Processing data
    feedback_count INTEGER DEFAULT 0,
    feedback_ids UUID[] DEFAULT '{}', -- Array of processed feedback IDs
    new_patterns_discovered INTEGER DEFAULT 0,
    patterns_updated INTEGER DEFAULT 0,
    
    -- Model updates
    model_changes JSONB DEFAULT '{}', -- Changes made to scoring models
    previous_accuracy DECIMAL(5,2),
    predicted_accuracy DECIMAL(5,2),
    actual_accuracy DECIMAL(5,2), -- Measured after deployment
    
    -- Performance and validation
    validation_results JSONB DEFAULT '{}', -- A/B testing and validation outcomes
    rollback_data JSONB DEFAULT '{}', -- Data needed for rollback if needed
    
    -- Processing metadata
    processing_duration INTERVAL,
    resources_used JSONB DEFAULT '{}', -- CPU, memory usage during processing
    error_log JSONB DEFAULT '[]', -- Any errors encountered during processing
    
    -- Status and timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_run TIMESTAMP WITH TIME ZONE,
    
    -- Flags
    is_successful BOOLEAN DEFAULT FALSE,
    requires_manual_review BOOLEAN DEFAULT FALSE,
    auto_rollback_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis context preservation for learning
CREATE TABLE analysis_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    commenter_id UUID REFERENCES commenters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analysis data at time of scoring
    original_score DECIMAL(5,2) NOT NULL,
    scoring_factors JSONB NOT NULL, -- Complete factor breakdown
    boost_terms_used TEXT[],
    down_terms_used TEXT[],
    model_version VARCHAR(50),
    
    -- Context data
    user_preferences_snapshot JSONB, -- User preferences at time of analysis
    team_preferences_snapshot JSONB, -- Team preferences used
    algorithm_version VARCHAR(50),
    
    -- Content analysis results
    content_analysis JSONB, -- Complete content analysis results
    profile_analysis JSONB, -- Profile analysis results
    timing_analysis JSONB, -- Timing and engagement analysis
    
    -- Metadata
    analysis_duration INTERVAL,
    confidence_metrics JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(analysis_id)
);

-- Outcome tracking for validation of predictions
CREATE TABLE outcome_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES user_feedback_enhanced(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES commenters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact and outreach results
    contacted BOOLEAN DEFAULT FALSE,
    contact_method VARCHAR(50), -- email, linkedin, phone, etc.
    initial_response BOOLEAN DEFAULT FALSE,
    response_time INTERVAL, -- Time to first response
    response_quality INTEGER CHECK (response_quality >= 1 AND response_quality <= 5),
    
    -- Meeting and engagement outcomes
    meeting_requested BOOLEAN DEFAULT FALSE,
    meeting_scheduled BOOLEAN DEFAULT FALSE,
    meeting_completed BOOLEAN DEFAULT FALSE,
    meeting_outcome VARCHAR(100), -- qualified, not_qualified, follow_up, etc.
    
    -- Business outcomes
    opportunity_created BOOLEAN DEFAULT FALSE,
    opportunity_value DECIMAL(10,2), -- Potential deal value
    deal_closed BOOLEAN DEFAULT FALSE,
    close_date DATE,
    actual_deal_value DECIMAL(10,2),
    
    -- Retrospective assessment
    original_prediction_accuracy INTEGER CHECK (original_prediction_accuracy >= 1 AND original_prediction_accuracy <= 10),
    factors_most_predictive JSONB DEFAULT '{}', -- Which factors were most accurate
    factors_least_predictive JSONB DEFAULT '{}', -- Which factors were misleading
    
    -- Learning insights
    unexpected_outcomes TEXT, -- What surprised the user
    improvement_suggestions TEXT, -- How to improve predictions
    
    -- Timeline tracking
    contact_date DATE,
    first_response_date DATE,
    last_interaction_date DATE,
    outcome_recorded_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy and data rights management
CREATE TABLE data_privacy_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID, -- For team-level privacy controls
    
    -- Consent and permissions
    learning_consent_given BOOLEAN DEFAULT TRUE,
    team_sharing_enabled BOOLEAN DEFAULT TRUE,
    outcome_tracking_enabled BOOLEAN DEFAULT TRUE,
    data_retention_preference INTEGER DEFAULT 365, -- Days to retain feedback data
    
    -- Privacy settings
    anonymize_in_team_learning BOOLEAN DEFAULT FALSE,
    exclude_from_global_learning BOOLEAN DEFAULT FALSE,
    feedback_visibility VARCHAR(50) DEFAULT 'team', -- 'private', 'team', 'organization'
    
    -- Data control requests
    data_export_requested BOOLEAN DEFAULT FALSE,
    data_export_completed_at TIMESTAMP WITH TIME ZONE,
    data_deletion_requested BOOLEAN DEFAULT FALSE,
    data_deletion_scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    consent_updated_at TIMESTAMP WITH TIME ZONE,
    privacy_policy_version VARCHAR(20),
    gdpr_compliance_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Performance monitoring and caching
CREATE TABLE feedback_processing_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(512) NOT NULL,
    cache_type VARCHAR(100) NOT NULL, -- 'user_preferences', 'team_patterns', 'model_predictions'
    
    -- Cached data
    cached_data JSONB NOT NULL,
    data_version VARCHAR(50),
    dependencies UUID[], -- IDs this cache depends on
    
    -- Cache metadata
    computation_cost INTEGER, -- Relative cost to recompute
    access_frequency INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Expiration and invalidation
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invalidated BOOLEAN DEFAULT FALSE,
    invalidation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(cache_key)
);

-- Create comprehensive indexes for performance optimization
CREATE INDEX idx_user_feedback_enhanced_user_id ON user_feedback_enhanced(user_id);
CREATE INDEX idx_user_feedback_enhanced_team_id ON user_feedback_enhanced(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_user_feedback_enhanced_session_id ON user_feedback_enhanced(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_user_feedback_enhanced_commenter_id ON user_feedback_enhanced(commenter_id) WHERE commenter_id IS NOT NULL;
CREATE INDEX idx_user_feedback_enhanced_type_status ON user_feedback_enhanced(feedback_type, feedback_status);
CREATE INDEX idx_user_feedback_enhanced_submitted_at ON user_feedback_enhanced(submitted_at DESC);
CREATE INDEX idx_user_feedback_enhanced_processing ON user_feedback_enhanced(feedback_status, processing_attempts) WHERE feedback_status = 'pending';

CREATE INDEX idx_user_preference_profiles_user_id ON user_preference_profiles(user_id);
CREATE INDEX idx_user_preference_profiles_team_id ON user_preference_profiles(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_user_preference_profiles_updated_at ON user_preference_profiles(updated_at DESC);

CREATE INDEX idx_team_learning_profiles_team_id ON team_learning_profiles(team_id);
CREATE INDEX idx_team_learning_profiles_org_id ON team_learning_profiles(organization_id) WHERE organization_id IS NOT NULL;

CREATE INDEX idx_learning_pipeline_runs_user_id ON learning_pipeline_runs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_learning_pipeline_runs_team_id ON learning_pipeline_runs(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_learning_pipeline_runs_stage ON learning_pipeline_runs(stage);
CREATE INDEX idx_learning_pipeline_runs_next_run ON learning_pipeline_runs(next_scheduled_run) WHERE next_scheduled_run IS NOT NULL;

CREATE INDEX idx_analysis_snapshots_analysis_id ON analysis_snapshots(analysis_id);
CREATE INDEX idx_analysis_snapshots_commenter_id ON analysis_snapshots(commenter_id);
CREATE INDEX idx_analysis_snapshots_user_id ON analysis_snapshots(user_id);
CREATE INDEX idx_analysis_snapshots_created_at ON analysis_snapshots(created_at DESC);

CREATE INDEX idx_outcome_tracking_feedback_id ON outcome_tracking(feedback_id);
CREATE INDEX idx_outcome_tracking_commenter_id ON outcome_tracking(commenter_id);
CREATE INDEX idx_outcome_tracking_user_id ON outcome_tracking(user_id);
CREATE INDEX idx_outcome_tracking_business_outcomes ON outcome_tracking(opportunity_created, deal_closed);

CREATE INDEX idx_data_privacy_controls_user_id ON data_privacy_controls(user_id);
CREATE INDEX idx_data_privacy_controls_team_id ON data_privacy_controls(team_id) WHERE team_id IS NOT NULL;

CREATE INDEX idx_feedback_cache_key ON feedback_processing_cache(cache_key);
CREATE INDEX idx_feedback_cache_type ON feedback_processing_cache(cache_type);
CREATE INDEX idx_feedback_cache_expires_at ON feedback_processing_cache(expires_at);
CREATE INDEX idx_feedback_cache_invalidated ON feedback_processing_cache(invalidated) WHERE invalidated = FALSE;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_user_feedback_enhanced_updated_at BEFORE UPDATE ON user_feedback_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preference_profiles_updated_at BEFORE UPDATE ON user_preference_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_learning_profiles_updated_at BEFORE UPDATE ON team_learning_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_pipeline_runs_updated_at BEFORE UPDATE ON learning_pipeline_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outcome_tracking_updated_at BEFORE UPDATE ON outcome_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_privacy_controls_updated_at BEFORE UPDATE ON data_privacy_controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for all new tables
ALTER TABLE user_feedback_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_privacy_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_processing_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
-- User feedback enhanced - users can only see their own feedback
CREATE POLICY "Users can manage own enhanced feedback" ON user_feedback_enhanced FOR ALL 
    USING (auth.uid()::text = user_id::text);

-- User preference profiles - users can only see their own profiles
CREATE POLICY "Users can manage own preference profiles" ON user_preference_profiles FOR ALL 
    USING (auth.uid()::text = user_id::text);

-- Team learning profiles - users can see their team's profiles
CREATE POLICY "Users can view team learning profiles" ON team_learning_profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_preference_profiles WHERE user_preference_profiles.user_id::text = auth.uid()::text AND user_preference_profiles.team_id = team_learning_profiles.team_id));

-- Analysis snapshots - users can see snapshots for their analyses
CREATE POLICY "Users can view own analysis snapshots" ON analysis_snapshots FOR ALL 
    USING (auth.uid()::text = user_id::text);

-- Outcome tracking - users can manage their own outcome tracking
CREATE POLICY "Users can manage own outcome tracking" ON outcome_tracking FOR ALL 
    USING (auth.uid()::text = user_id::text);

-- Data privacy controls - users can only manage their own privacy settings
CREATE POLICY "Users can manage own privacy controls" ON data_privacy_controls FOR ALL 
    USING (auth.uid()::text = user_id::text);

-- Feedback processing cache - restrict access to authenticated users only
CREATE POLICY "Authenticated users can access processing cache" ON feedback_processing_cache FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Add constraints to maintain data integrity
ALTER TABLE user_feedback_enhanced 
    ADD CONSTRAINT valid_confidence_score CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

ALTER TABLE user_preference_profiles 
    ADD CONSTRAINT valid_learning_confidence CHECK (learning_confidence >= 0 AND learning_confidence <= 1);

-- Create utility functions for feedback processing
CREATE OR REPLACE FUNCTION get_user_learning_readiness(p_user_id UUID)
RETURNS TABLE (
    feedback_count INTEGER,
    recent_feedback_count INTEGER,
    learning_confidence DECIMAL,
    ready_for_update BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(upp.total_feedback_count, 0) as feedback_count,
        (SELECT COUNT(*)::INTEGER 
         FROM user_feedback_enhanced ufe 
         WHERE ufe.user_id = p_user_id 
         AND ufe.submitted_at > NOW() - INTERVAL '30 days') as recent_feedback_count,
        COALESCE(upp.learning_confidence, 0.0) as learning_confidence,
        CASE 
            WHEN COALESCE(upp.total_feedback_count, 0) >= 5 
            AND (SELECT COUNT(*) FROM user_feedback_enhanced WHERE user_id = p_user_id AND feedback_status = 'pending') >= 3
            THEN TRUE 
            ELSE FALSE 
        END as ready_for_update
    FROM user_preference_profiles upp
    WHERE upp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired feedback data based on user preferences
    DELETE FROM user_feedback_enhanced ufe
    WHERE ufe.expires_at < NOW()
    AND EXISTS (
        SELECT 1 FROM data_privacy_controls dpc 
        WHERE dpc.user_id = ufe.user_id 
        AND ufe.submitted_at < NOW() - (dpc.data_retention_preference || ' days')::INTERVAL
    );
    
    -- Clean up expired cache entries
    DELETE FROM feedback_processing_cache 
    WHERE expires_at < NOW() OR invalidated = TRUE;
    
    -- Clean up old learning pipeline runs (keep last 100 per user/team)
    DELETE FROM learning_pipeline_runs 
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY COALESCE(user_id::text, team_id::text, 'global') ORDER BY created_at DESC) as rn
            FROM learning_pipeline_runs
        ) ranked WHERE rn > 100
    );
END;
$$ LANGUAGE plpgsql;

COMMIT;