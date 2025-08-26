-- Migration: Intelligence & Learning System
-- Description: Creates tables for the AI-powered feedback and learning system
-- Version: 4.0.0
-- Date: 2025-08-19

BEGIN;

-- User Intelligence Profiles (tracks individual user patterns and preferences)
CREATE TABLE IF NOT EXISTS user_intelligence_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Industry and role preferences learned from behavior
    industry_focus TEXT[] DEFAULT '{}',
    role_preferences TEXT[] DEFAULT '{}',
    company_size_preference TEXT, -- 'startup', 'small', 'medium', 'large', 'enterprise'
    location_preferences TEXT[] DEFAULT '{}',
    seniority_preferences TEXT[] DEFAULT '{}', -- 'junior', 'mid', 'senior', 'executive', 'founder'
    
    -- Behavioral patterns discovered through usage
    engagement_patterns JSONB DEFAULT '{}', -- Time spent patterns, interaction preferences
    success_patterns JSONB DEFAULT '{}',    -- What types of profiles lead to successful contacts
    search_patterns JSONB DEFAULT '{}',     -- Common search queries and filters
    timing_patterns JSONB DEFAULT '{}',     -- When they research, how often, session lengths
    
    -- Learning system metadata
    learning_confidence DECIMAL(3,2) DEFAULT 0.0, -- How confident we are in these patterns (0-1)
    total_research_sessions INTEGER DEFAULT 0,
    successful_contacts INTEGER DEFAULT 0,
    feedback_interactions INTEGER DEFAULT 0,
    
    -- Pattern freshness and updates
    last_pattern_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_successful_contact TIMESTAMP WITH TIME ZONE,
    pattern_version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one profile per user
    UNIQUE(user_id)
);

-- Research Session Intelligence (captures detailed data for each research session)
CREATE TABLE IF NOT EXISTS research_session_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile being researched
    linkedin_profile_url TEXT NOT NULL,
    profile_data JSONB, -- Cached profile data at time of research
    
    -- Research context and intent
    research_context JSONB DEFAULT '{}', -- Why they're researching (campaign, list building, etc.)
    initial_prediction JSONB DEFAULT '{}', -- System's initial relevance assessment
    research_source TEXT, -- How they found this profile
    research_goal TEXT, -- What they hope to accomplish
    
    -- Behavioral tracking data
    session_duration INTEGER DEFAULT 0, -- Total seconds spent in session
    profile_view_time INTEGER DEFAULT 0, -- Seconds spent viewing main profile
    sections_viewed TEXT[] DEFAULT '{}', -- Which profile sections they looked at
    sections_expanded TEXT[] DEFAULT '{}', -- Which sections they expanded/clicked
    scroll_behavior JSONB DEFAULT '{}', -- Scroll patterns, pauses, focus areas
    click_patterns JSONB DEFAULT '{}', -- What they clicked, in what order
    copy_actions TEXT[] DEFAULT '{}', -- What information they copied
    
    -- External actions during session
    search_queries TEXT[] DEFAULT '{}', -- Any searches they made during session
    external_links_visited TEXT[] DEFAULT '{}', -- Links they clicked to external sites
    notes_taken TEXT, -- Any notes they made
    tags_applied TEXT[] DEFAULT '{}', -- Tags they applied to this profile
    
    -- Session outcome and feedback
    session_outcome TEXT CHECK (session_outcome IN ('contacted', 'skipped', 'saved_for_later', 'needs_more_info', 'flagged_inappropriate', 'unknown')),
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
    relevance_rating INTEGER CHECK (relevance_rating BETWEEN 1 AND 10),
    reasoning TEXT, -- Why they made their decision
    follow_up_notes TEXT,
    contact_method TEXT, -- How they contacted (email, linkedin, phone, etc.)
    
    -- Learning metadata
    feedback_quality_score DECIMAL(3,2), -- How valuable this session is for learning
    pattern_contribution JSONB DEFAULT '{}', -- Which patterns this session reinforced/challenged
    anomaly_detected BOOLEAN DEFAULT FALSE, -- If this session was unusual for the user
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback Interactions (captures all explicit and implicit feedback)
CREATE TABLE IF NOT EXISTS feedback_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES research_session_intelligence(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type of feedback interaction
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'explicit_rating',      -- User explicitly rated something
        'implicit_behavior',    -- Behavior that implies feedback (time spent, clicks, etc.)
        'contextual_action',    -- Actions that provide context (save, contact, skip)
        'outcome_report',       -- Reporting results of contact attempts
        'pattern_correction',   -- User correcting system predictions
        'preference_update'     -- User updating their preferences
    )),
    
    -- The actual feedback data (flexible JSON structure)
    feedback_data JSONB NOT NULL,
    
    -- Context about when/how feedback was collected
    feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context_data JSONB DEFAULT '{}', -- Additional context about the interaction
    collection_method TEXT, -- 'automatic', 'prompted', 'voluntary'
    ui_component TEXT, -- Which UI component collected this feedback
    
    -- Learning system processing
    processed BOOLEAN DEFAULT FALSE,
    processing_results JSONB DEFAULT '{}', -- What the system learned from this feedback
    learning_value DECIMAL(3,2) DEFAULT 0.0, -- How valuable this feedback is (0-1)
    confidence_impact DECIMAL(3,2) DEFAULT 0.0, -- How much this improved confidence
    
    -- Validation and quality
    validated BOOLEAN DEFAULT FALSE,
    validation_method TEXT, -- How this feedback was validated
    validation_results JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discovered Patterns (machine learning discovered patterns and insights)
CREATE TABLE IF NOT EXISTS discovered_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern classification
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'user_preference',      -- Individual user preference pattern
        'industry_signal',      -- Industry-specific success indicators
        'timing_pattern',       -- Time-based behavioral patterns
        'success_indicator',    -- Patterns that predict successful contacts
        'engagement_signal',    -- Patterns that predict high engagement
        'quality_indicator',    -- Patterns that indicate profile quality
        'context_pattern'       -- Contextual patterns based on research goals
    )),
    
    pattern_name TEXT NOT NULL, -- Human-readable pattern name
    pattern_description TEXT, -- What this pattern represents
    
    -- Pattern data and rules
    pattern_data JSONB NOT NULL, -- The actual pattern rules and conditions
    trigger_conditions JSONB DEFAULT '{}', -- When this pattern applies
    expected_outcome TEXT, -- What this pattern predicts
    
    -- Pattern performance metrics
    confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.0, -- Statistical confidence (0-1)
    supporting_sessions INTEGER DEFAULT 1, -- Number of sessions supporting this pattern
    contradicting_sessions INTEGER DEFAULT 0, -- Number of sessions contradicting it
    accuracy_rate DECIMAL(4,3) DEFAULT 0.0, -- How often this pattern is correct
    
    -- Pattern scope and applicability
    applies_to_users UUID[] DEFAULT '{}', -- Specific users (empty for global patterns)
    applies_to_industries TEXT[] DEFAULT '{}', -- Specific industries (empty for all)
    applies_to_roles TEXT[] DEFAULT '{}', -- Specific roles (empty for all)
    
    -- Discovery and validation metadata
    discovery_method TEXT NOT NULL, -- Which algorithm discovered this
    discovery_agent TEXT, -- Which agent discovered it
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    validation_status TEXT DEFAULT 'discovered' CHECK (validation_status IN (
        'discovered',    -- Just discovered, not yet tested
        'testing',      -- Currently being A/B tested
        'validated',    -- Proven to improve outcomes
        'deprecated',   -- No longer useful
        'archived'      -- Kept for historical reference
    )),
    
    -- Impact and effectiveness
    impact_score DECIMAL(4,3) DEFAULT 0.0, -- How much this pattern improves predictions (0-1)
    usage_count INTEGER DEFAULT 0, -- How many times this pattern has been applied
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Pattern evolution
    parent_pattern_id UUID REFERENCES discovered_patterns(id), -- If this evolved from another pattern
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research Quality Metrics (tracks system improvement over time)
CREATE TABLE IF NOT EXISTS research_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for global metrics
    
    -- Time period for these metrics
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type TEXT DEFAULT 'weekly' CHECK (metric_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    
    -- Research activity metrics
    total_research_sessions INTEGER DEFAULT 0,
    total_profiles_researched INTEGER DEFAULT 0,
    unique_profiles_researched INTEGER DEFAULT 0,
    average_session_duration DECIMAL(6,2), -- Average minutes per session
    
    -- Outcome metrics
    successful_contacts INTEGER DEFAULT 0,
    contact_success_rate DECIMAL(4,3), -- Percentage of researched profiles that were contacted
    positive_outcomes INTEGER DEFAULT 0, -- Contacts that led to positive responses
    outcome_success_rate DECIMAL(4,3), -- Percentage of contacts with positive outcomes
    
    -- Efficiency metrics
    time_saved_estimate INTEGER DEFAULT 0, -- Estimated minutes saved vs manual research
    research_efficiency_score DECIMAL(4,3), -- Overall efficiency rating (0-1)
    prediction_accuracy DECIMAL(4,3), -- How often system predictions matched user decisions
    relevance_accuracy DECIMAL(4,3), -- How often relevance scores matched user ratings
    
    -- User satisfaction metrics
    user_satisfaction_score DECIMAL(3,2), -- Average user satisfaction (1-5)
    feedback_sentiment_score DECIMAL(3,2), -- Sentiment analysis of feedback (-1 to 1)
    feature_usage_score DECIMAL(3,2), -- How much user engages with features (0-1)
    
    -- Learning system metrics
    patterns_discovered INTEGER DEFAULT 0, -- New patterns discovered this period
    patterns_validated INTEGER DEFAULT 0, -- Patterns proven effective this period
    model_improvements INTEGER DEFAULT 0, -- Number of model updates deployed
    personalization_effectiveness DECIMAL(4,3), -- Improvement from personalization vs baseline
    
    -- Quality trends
    quality_trend TEXT CHECK (quality_trend IN ('improving', 'stable', 'declining', 'unknown')),
    top_improvement_areas TEXT[] DEFAULT '{}', -- Areas identified for improvement
    confidence_trend DECIMAL(3,2), -- Change in confidence over time (-1 to 1)
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Improvement Logs (tracks autonomous system improvements)
CREATE TABLE IF NOT EXISTS agent_improvements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent and improvement details
    agent_name TEXT NOT NULL, -- Which agent made this improvement
    agent_version TEXT DEFAULT '1.0',
    improvement_type TEXT NOT NULL CHECK (improvement_type IN (
        'algorithm_update',     -- Updated algorithm or model
        'new_pattern',         -- Discovered new useful pattern
        'parameter_tuning',    -- Optimized parameters
        'bug_fix',            -- Fixed issue or bug
        'feature_enhancement', -- Improved existing feature
        'performance_optimization' -- Improved speed/efficiency
    )),
    
    improvement_name TEXT NOT NULL,
    description TEXT NOT NULL,
    technical_details JSONB DEFAULT '{}', -- Technical implementation details
    
    -- Scope and impact
    affected_users UUID[] DEFAULT '{}', -- Specific users affected (empty for global)
    affected_components TEXT[] DEFAULT '{}', -- Which system components were changed
    performance_impact JSONB DEFAULT '{}', -- Before/after performance metrics
    expected_benefits TEXT[] DEFAULT '{}', -- Expected benefits from this improvement
    
    -- Rollout status and control
    rollout_status TEXT DEFAULT 'testing' CHECK (rollout_status IN (
        'planned',      -- Improvement is planned but not implemented
        'testing',      -- Currently being tested with subset of users
        'partial',      -- Rolled out to portion of users
        'full',        -- Deployed to all users
        'rollback',    -- Rolled back due to issues
        'archived'     -- Archived/deprecated improvement
    )),
    
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    test_group_size INTEGER, -- Number of users in test group
    
    -- Success metrics and validation
    success_metrics JSONB DEFAULT '{}', -- Metrics to measure success
    validation_results JSONB DEFAULT '{}', -- Results of A/B testing or validation
    user_feedback_score DECIMAL(3,2), -- User satisfaction with this improvement
    performance_delta DECIMAL(6,4), -- Quantified performance improvement
    
    -- Lifecycle management
    implemented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    deprecated_at TIMESTAMP WITH TIME ZONE,
    
    created_by TEXT DEFAULT 'system',
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_user_intelligence_profiles_user_id ON user_intelligence_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intelligence_profiles_last_update ON user_intelligence_profiles(last_pattern_update DESC);

CREATE INDEX IF NOT EXISTS idx_research_session_intelligence_session_id ON research_session_intelligence(session_id);
CREATE INDEX IF NOT EXISTS idx_research_session_intelligence_user_id ON research_session_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_research_session_intelligence_outcome ON research_session_intelligence(session_outcome) WHERE session_outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_research_session_intelligence_created_at ON research_session_intelligence(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_interactions_user_id ON feedback_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interactions_session_id ON feedback_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interactions_type ON feedback_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_feedback_interactions_processed ON feedback_interactions(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_feedback_interactions_timestamp ON feedback_interactions(feedback_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_discovered_patterns_type ON discovered_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_discovered_patterns_status ON discovered_patterns(validation_status);
CREATE INDEX IF NOT EXISTS idx_discovered_patterns_confidence ON discovered_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_patterns_users ON discovered_patterns USING GIN(applies_to_users) WHERE cardinality(applies_to_users) > 0;
CREATE INDEX IF NOT EXISTS idx_discovered_patterns_last_used ON discovered_patterns(last_used DESC) WHERE last_used IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_research_quality_metrics_user_id ON research_quality_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_research_quality_metrics_period ON research_quality_metrics(time_period_start, time_period_end);
CREATE INDEX IF NOT EXISTS idx_research_quality_metrics_type ON research_quality_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_agent_improvements_agent ON agent_improvements(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_improvements_status ON agent_improvements(rollout_status);
CREATE INDEX IF NOT EXISTS idx_agent_improvements_type ON agent_improvements(improvement_type);
CREATE INDEX IF NOT EXISTS idx_agent_improvements_created ON agent_improvements(created_at DESC);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_intelligence_profiles_updated_at 
    BEFORE UPDATE ON user_intelligence_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_session_intelligence_updated_at 
    BEFORE UPDATE ON research_session_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discovered_patterns_updated_at 
    BEFORE UPDATE ON discovered_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_improvements_updated_at 
    BEFORE UPDATE ON agent_improvements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Utility functions for the intelligence system

-- Function to initialize a user intelligence profile
CREATE OR REPLACE FUNCTION initialize_user_intelligence_profile(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    INSERT INTO user_intelligence_profiles (user_id)
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO profile_id;
    
    -- If no profile was inserted (already exists), get the existing ID
    IF profile_id IS NULL THEN
        SELECT id INTO profile_id 
        FROM user_intelligence_profiles 
        WHERE user_id = target_user_id;
    END IF;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record a feedback interaction
CREATE OR REPLACE FUNCTION record_feedback_interaction(
    p_session_id UUID,
    p_user_id UUID,
    p_interaction_type TEXT,
    p_feedback_data JSONB,
    p_context_data JSONB DEFAULT '{}'::JSONB,
    p_collection_method TEXT DEFAULT 'automatic'
)
RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
BEGIN
    INSERT INTO feedback_interactions (
        session_id,
        user_id,
        interaction_type,
        feedback_data,
        context_data,
        collection_method,
        learning_value
    ) VALUES (
        p_session_id,
        p_user_id,
        p_interaction_type,
        p_feedback_data,
        p_context_data,
        p_collection_method,
        -- Calculate initial learning value based on interaction type
        CASE p_interaction_type
            WHEN 'explicit_rating' THEN 0.8
            WHEN 'outcome_report' THEN 0.9
            WHEN 'pattern_correction' THEN 1.0
            WHEN 'preference_update' THEN 0.7
            ELSE 0.3
        END
    ) RETURNING id INTO interaction_id;
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_intelligence_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old feedback interactions (keep last 2 years)
    DELETE FROM feedback_interactions 
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND processed = TRUE;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old research quality metrics (keep last 3 years)
    DELETE FROM research_quality_metrics 
    WHERE time_period_end < NOW() - INTERVAL '3 years';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Archive old deprecated patterns
    UPDATE discovered_patterns 
    SET validation_status = 'archived'
    WHERE validation_status = 'deprecated' 
    AND updated_at < NOW() - INTERVAL '6 months';
    
    -- Clean up old agent improvement logs (keep last 1 year)
    DELETE FROM agent_improvements 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND rollout_status IN ('archived', 'rollback');
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;