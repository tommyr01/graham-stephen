-- =============================================================================
-- GRAHAM STEPHENS VOICE FEEDBACK SYSTEM - DATABASE MIGRATIONS
-- =============================================================================
-- This file contains all database migrations for the intelligent voice feedback system
-- Execute this in Supabase SQL editor to create all required tables

-- Migration 004: Enhanced User Feedback Table
-- Drop and recreate with enhanced structure
DROP TABLE IF EXISTS enhanced_user_feedback CASCADE;
CREATE TABLE enhanced_user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    team_id UUID,
    session_id UUID,
    commenter_id TEXT,
    analysis_id TEXT,
    
    -- Feedback metadata
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('binary', 'detailed', 'outcome', 'bulk', 'implicit', 'voice')),
    feedback_status TEXT NOT NULL DEFAULT 'pending' CHECK (feedback_status IN ('pending', 'processed', 'incorporated', 'rejected')),
    priority INTEGER NOT NULL DEFAULT 1,
    
    -- Core feedback data
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 10),
    is_relevant BOOLEAN,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    
    -- Factor-specific ratings for detailed feedback (JSON)
    factor_ratings JSONB,
    correction_flags TEXT[],
    
    -- Text feedback
    feedback_text TEXT,
    improvement_suggestions TEXT,
    additional_notes TEXT,
    
    -- Voice feedback specific fields
    voice_transcription TEXT,
    voice_duration_seconds INTEGER,
    voice_confidence DECIMAL(3,2),
    voice_key_points TEXT[],
    voice_sentiment TEXT CHECK (voice_sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    
    -- Outcome-based tracking (JSON)
    outcome_data JSONB,
    success_indicators JSONB,
    
    -- Context preservation (JSON)
    analysis_context JSONB,
    user_context JSONB,
    
    -- Processing metadata
    processing_attempts INTEGER NOT NULL DEFAULT 0,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    learning_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    
    -- Device and source info
    source_ip INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for enhanced_user_feedback
CREATE INDEX idx_enhanced_user_feedback_user_id ON enhanced_user_feedback(user_id);
CREATE INDEX idx_enhanced_user_feedback_session_id ON enhanced_user_feedback(session_id);
CREATE INDEX idx_enhanced_user_feedback_commenter_id ON enhanced_user_feedback(commenter_id);
CREATE INDEX idx_enhanced_user_feedback_feedback_type ON enhanced_user_feedback(feedback_type);
CREATE INDEX idx_enhanced_user_feedback_feedback_status ON enhanced_user_feedback(feedback_status);
CREATE INDEX idx_enhanced_user_feedback_created_at ON enhanced_user_feedback(created_at);
CREATE INDEX idx_enhanced_user_feedback_voice ON enhanced_user_feedback(feedback_type) WHERE feedback_type = 'voice';

-- Migration 005: User Preference Profiles
DROP TABLE IF EXISTS user_preference_profiles CASCADE;
CREATE TABLE user_preference_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    team_id UUID,
    
    -- Learned preferences from feedback (JSON)
    industry_weights JSONB NOT NULL DEFAULT '{}',
    role_preferences JSONB NOT NULL DEFAULT '{}',
    company_size_preferences JSONB NOT NULL DEFAULT '{}',
    
    -- Content and style preferences (JSON)
    content_preferences JSONB NOT NULL DEFAULT '{}',
    communication_style_weights JSONB NOT NULL DEFAULT '{}',
    timing_preferences JSONB NOT NULL DEFAULT '{}',
    
    -- Success and failure patterns (JSON)
    success_patterns JSONB NOT NULL DEFAULT '{}',
    failure_patterns JSONB NOT NULL DEFAULT '{}',
    
    -- Profile metadata
    total_feedback_count INTEGER NOT NULL DEFAULT 0,
    last_significant_update TIMESTAMP WITH TIME ZONE,
    learning_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_version TEXT NOT NULL DEFAULT 'v1.0',
    
    -- Performance tracking (JSON)
    accuracy_trend JSONB NOT NULL DEFAULT '[]',
    recent_performance DECIMAL(3,2),
    improvement_rate DECIMAL(3,2),
    
    -- Voice learning specific
    voice_feedback_count INTEGER NOT NULL DEFAULT 0,
    voice_patterns JSONB NOT NULL DEFAULT '{}',
    voice_keywords JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for user_preference_profiles
CREATE INDEX idx_user_preference_profiles_user_id ON user_preference_profiles(user_id);
CREATE INDEX idx_user_preference_profiles_team_id ON user_preference_profiles(team_id);
CREATE INDEX idx_user_preference_profiles_updated_at ON user_preference_profiles(updated_at);

-- Migration 006: Learning Pipeline Runs
DROP TABLE IF EXISTS learning_pipeline_runs CASCADE;
CREATE TABLE learning_pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type TEXT NOT NULL CHECK (run_type IN ('individual', 'team', 'global')),
    stage TEXT NOT NULL CHECK (stage IN ('collecting', 'processing', 'validating', 'deploying', 'monitoring')),
    
    -- Target identification
    user_id UUID,
    team_id UUID,
    
    -- Processing data
    feedback_count INTEGER NOT NULL DEFAULT 0,
    feedback_ids UUID[],
    new_patterns_discovered INTEGER NOT NULL DEFAULT 0,
    patterns_updated INTEGER NOT NULL DEFAULT 0,
    
    -- Model updates (JSON)
    model_changes JSONB NOT NULL DEFAULT '{}',
    previous_accuracy DECIMAL(4,3),
    predicted_accuracy DECIMAL(4,3),
    actual_accuracy DECIMAL(4,3),
    
    -- Performance and validation (JSON)
    validation_results JSONB NOT NULL DEFAULT '{}',
    rollback_data JSONB,
    
    -- Processing metadata
    processing_duration INTEGER, -- seconds
    resources_used JSONB,
    error_log JSONB NOT NULL DEFAULT '[]',
    
    -- Voice learning specific
    voice_feedback_processed INTEGER NOT NULL DEFAULT 0,
    voice_patterns_learned JSONB NOT NULL DEFAULT '{}',
    transcription_quality_score DECIMAL(3,2),
    
    -- Status and timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_run TIMESTAMP WITH TIME ZONE,
    
    -- Flags
    is_successful BOOLEAN NOT NULL DEFAULT FALSE,
    requires_manual_review BOOLEAN NOT NULL DEFAULT FALSE,
    auto_rollback_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for learning_pipeline_runs
CREATE INDEX idx_learning_pipeline_runs_user_id ON learning_pipeline_runs(user_id);
CREATE INDEX idx_learning_pipeline_runs_team_id ON learning_pipeline_runs(team_id);
CREATE INDEX idx_learning_pipeline_runs_run_type ON learning_pipeline_runs(run_type);
CREATE INDEX idx_learning_pipeline_runs_stage ON learning_pipeline_runs(stage);
CREATE INDEX idx_learning_pipeline_runs_created_at ON learning_pipeline_runs(created_at);
CREATE INDEX idx_learning_pipeline_runs_voice ON learning_pipeline_runs(voice_feedback_processed) WHERE voice_feedback_processed > 0;

-- Voice Feedback Analytics View
CREATE OR REPLACE VIEW voice_feedback_analytics AS
SELECT 
    uf.user_id,
    COUNT(*) as total_voice_feedback,
    AVG(uf.voice_duration_seconds) as avg_duration,
    AVG(uf.voice_confidence) as avg_confidence,
    COUNT(CASE WHEN uf.voice_sentiment = 'positive' THEN 1 END) as positive_count,
    COUNT(CASE WHEN uf.voice_sentiment = 'negative' THEN 1 END) as negative_count,
    COUNT(CASE WHEN uf.voice_sentiment = 'neutral' THEN 1 END) as neutral_count,
    ARRAY_AGG(DISTINCT unnest(uf.voice_key_points)) FILTER (WHERE uf.voice_key_points IS NOT NULL) as common_key_points,
    DATE_TRUNC('day', uf.created_at) as feedback_date,
    COUNT(*) OVER (PARTITION BY uf.user_id ORDER BY DATE_TRUNC('day', uf.created_at)) as cumulative_feedback
FROM enhanced_user_feedback uf
WHERE uf.feedback_type = 'voice'
    AND uf.created_at >= NOW() - INTERVAL '30 days'
GROUP BY uf.user_id, DATE_TRUNC('day', uf.created_at)
ORDER BY uf.user_id, feedback_date DESC;

-- Learning Progress View
CREATE OR REPLACE VIEW user_learning_progress AS
SELECT 
    upp.user_id,
    upp.total_feedback_count,
    upp.voice_feedback_count,
    upp.learning_confidence,
    upp.recent_performance,
    COALESCE(
        (upp.accuracy_trend->-1->>'accuracy')::decimal, 
        0.0
    ) as latest_accuracy,
    CASE 
        WHEN upp.total_feedback_count >= 10 THEN 'ready'
        WHEN upp.total_feedback_count >= 5 THEN 'developing'
        ELSE 'learning'
    END as learning_stage,
    upp.updated_at as last_update
FROM user_preference_profiles upp
ORDER BY upp.updated_at DESC;

-- Update triggers for automatic timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enhanced_user_feedback_updated_at 
    BEFORE UPDATE ON enhanced_user_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preference_profiles_updated_at 
    BEFORE UPDATE ON user_preference_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_pipeline_runs_updated_at 
    BEFORE UPDATE ON learning_pipeline_runs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VOICE FEEDBACK INTELLIGENT LEARNING FUNCTIONS
-- =============================================================================

-- Function to process voice feedback and extract insights
CREATE OR REPLACE FUNCTION process_voice_feedback(
    feedback_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    feedback_record enhanced_user_feedback%ROWTYPE;
    user_profile user_preference_profiles%ROWTYPE;
    processing_result JSONB;
BEGIN
    -- Get feedback record
    SELECT * INTO feedback_record FROM enhanced_user_feedback WHERE id = feedback_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Feedback not found');
    END IF;
    
    -- Get or create user profile
    SELECT * INTO user_profile FROM user_preference_profiles WHERE user_id = feedback_record.user_id;
    
    IF NOT FOUND THEN
        INSERT INTO user_preference_profiles (user_id) VALUES (feedback_record.user_id);
        SELECT * INTO user_profile FROM user_preference_profiles WHERE user_id = feedback_record.user_id;
    END IF;
    
    -- Update voice feedback count
    UPDATE user_preference_profiles 
    SET 
        voice_feedback_count = voice_feedback_count + 1,
        total_feedback_count = total_feedback_count + 1
    WHERE user_id = feedback_record.user_id;
    
    -- Mark feedback as processed
    UPDATE enhanced_user_feedback 
    SET 
        feedback_status = 'processed',
        last_processed_at = NOW(),
        processing_attempts = processing_attempts + 1
    WHERE id = feedback_id;
    
    processing_result := jsonb_build_object(
        'status', 'success',
        'feedback_id', feedback_id,
        'user_id', feedback_record.user_id,
        'processed_at', NOW()
    );
    
    RETURN processing_result;
END;
$$;

-- Function to get user learning statistics
CREATE OR REPLACE FUNCTION get_user_learning_stats(
    p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    total_feedback INTEGER;
    voice_feedback INTEGER;
    recent_feedback INTEGER;
    learning_confidence DECIMAL;
BEGIN
    SELECT 
        COALESCE(upp.total_feedback_count, 0),
        COALESCE(upp.voice_feedback_count, 0),
        COALESCE(upp.learning_confidence, 0.0)
    INTO total_feedback, voice_feedback, learning_confidence
    FROM user_preference_profiles upp
    WHERE upp.user_id = p_user_id;
    
    -- Count recent feedback (last 7 days)
    SELECT COUNT(*)
    INTO recent_feedback
    FROM enhanced_user_feedback
    WHERE user_id = p_user_id
        AND created_at >= NOW() - INTERVAL '7 days';
    
    result := jsonb_build_object(
        'user_id', p_user_id,
        'total_feedback', COALESCE(total_feedback, 0),
        'voice_feedback', COALESCE(voice_feedback, 0),
        'recent_feedback', recent_feedback,
        'learning_confidence', COALESCE(learning_confidence, 0.0),
        'learning_stage', CASE 
            WHEN COALESCE(total_feedback, 0) >= 10 THEN 'ready'
            WHEN COALESCE(total_feedback, 0) >= 5 THEN 'developing'
            ELSE 'learning'
        END
    );
    
    RETURN result;
END;
$$;

-- =============================================================================
-- INITIAL DATA AND SETUP
-- =============================================================================

-- Insert default user preference profile for the demo user
INSERT INTO user_preference_profiles (
    user_id,
    industry_weights,
    voice_patterns,
    model_version
) VALUES (
    gen_random_uuid(),
    '{"technology": {"weight": 0.8, "confidence": 0.7, "sampleSize": 5}}',
    '{"positive_phrases": ["great fit", "perfect match", "definitely contact"], "negative_phrases": ["not relevant", "skip this", "wrong industry"]}',
    'v1.0'
) ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- PERMISSIONS AND SECURITY
-- =============================================================================

-- Enable Row Level Security
ALTER TABLE enhanced_user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - you may want to customize based on your auth system)
CREATE POLICY "Users can manage their own feedback" ON enhanced_user_feedback
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own preferences" ON user_preference_profiles
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own pipeline runs" ON learning_pipeline_runs
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Grant necessary permissions
GRANT ALL ON enhanced_user_feedback TO authenticated;
GRANT ALL ON user_preference_profiles TO authenticated;
GRANT SELECT ON learning_pipeline_runs TO authenticated;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '🎉 VOICE FEEDBACK SYSTEM MIGRATIONS COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ Tables created: enhanced_user_feedback, user_preference_profiles, learning_pipeline_runs';
    RAISE NOTICE '✅ Views created: voice_feedback_analytics, user_learning_progress';
    RAISE NOTICE '✅ Functions created: process_voice_feedback, get_user_learning_stats';
    RAISE NOTICE '✅ Indexes and triggers configured for optimal performance';
    RAISE NOTICE '🚀 Ready for voice feedback system deployment!';
END $$;