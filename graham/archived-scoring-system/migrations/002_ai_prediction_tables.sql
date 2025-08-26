-- Migration: AI Prediction System Tables
-- Description: Creates tables needed for the AI prediction system performance optimization
-- Version: 2.0.0
-- Date: 2025-01-19

BEGIN;

-- Training decisions for pattern matching
CREATE TABLE IF NOT EXISTS training_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id VARCHAR(255) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('contact', 'skip')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    voice_transcription TEXT,
    prospect_snapshot JSONB NOT NULL, -- Complete prospect data at time of decision
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add index for fast pattern matching
    INDEX idx_training_decisions_decision (decision),
    INDEX idx_training_decisions_confidence (confidence),
    INDEX idx_training_decisions_created_at (created_at DESC)
);

-- Decision patterns for predictive scoring
CREATE TABLE IF NOT EXISTS decision_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_type VARCHAR(100) NOT NULL, -- 'content_quality', 'experience_match', 'industry_relevance', etc.
    trigger_conditions JSONB NOT NULL, -- Conditions that trigger this pattern
    expected_outcome VARCHAR(20) NOT NULL CHECK (expected_outcome IN ('contact', 'skip')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    sample_size INTEGER DEFAULT 1,
    success_rate DECIMAL(3,2), -- Historical accuracy of this pattern
    last_validated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add indexes for efficient pattern matching
    INDEX idx_decision_patterns_type (pattern_type),
    INDEX idx_decision_patterns_confidence (confidence),
    INDEX idx_decision_patterns_outcome (expected_outcome)
);

-- Prediction results for caching and performance tracking
CREATE TABLE IF NOT EXISTS prediction_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id VARCHAR(255) NOT NULL,
    predicted_decision VARCHAR(20) NOT NULL CHECK (predicted_decision IN ('contact', 'skip')),
    confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    reasoning JSONB NOT NULL, -- Complete reasoning breakdown
    matched_patterns UUID[] DEFAULT '{}', -- Array of pattern IDs that matched
    similar_prospects JSONB DEFAULT '[]', -- Similar prospects found
    model_version VARCHAR(50) DEFAULT 'v2.0',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Track actual outcomes for model improvement
    actual_decision VARCHAR(20) CHECK (actual_decision IN ('contact', 'skip')),
    actual_outcome JSONB, -- Contact results, meeting outcomes, etc.
    outcome_recorded_at TIMESTAMP WITH TIME ZONE,
    
    -- Add indexes for fast cache lookups
    INDEX idx_prediction_results_prospect_id (prospect_id),
    INDEX idx_prediction_results_created_at (created_at DESC),
    INDEX idx_prediction_results_actual_decision (actual_decision) WHERE actual_decision IS NOT NULL,
    
    -- Unique constraint to prevent duplicate predictions for same prospect
    UNIQUE(prospect_id, created_at::date) -- One prediction per prospect per day
);

-- Content analysis cache for content intelligence results
CREATE TABLE IF NOT EXISTS content_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id VARCHAR(255),
    prospect_id VARCHAR(255),
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of content for deduplication
    
    -- Analysis scores
    authenticity_score DECIMAL(3,1) NOT NULL CHECK (authenticity_score >= 1 AND authenticity_score <= 10),
    expertise_level DECIMAL(3,1) NOT NULL CHECK (expertise_level >= 1 AND expertise_level <= 10),
    specificity_score DECIMAL(3,1) NOT NULL CHECK (specificity_score >= 1 AND specificity_score <= 10),
    professionalism_score DECIMAL(3,1) NOT NULL CHECK (professionalism_score >= 1 AND professionalism_score <= 10),
    
    red_flags TEXT[] DEFAULT '{}',
    reasoning TEXT,
    ai_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic'
    model_version VARCHAR(100) NOT NULL,
    processing_time_ms INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add indexes for efficient cache lookups
    INDEX idx_content_analysis_content_hash (content_hash),
    INDEX idx_content_analysis_prospect_id (prospect_id),
    INDEX idx_content_analysis_ai_provider (ai_provider),
    INDEX idx_content_analysis_expires_at (expires_at),
    
    -- Unique constraint on content hash + AI provider
    UNIQUE(content_hash, ai_provider)
);

-- Prospect content summary for aggregated content intelligence
CREATE TABLE IF NOT EXISTS prospect_content_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id VARCHAR(255) NOT NULL,
    
    -- Aggregated scores
    avg_authenticity_score DECIMAL(3,1) NOT NULL,
    avg_expertise_level DECIMAL(3,1) NOT NULL,
    avg_specificity_score DECIMAL(3,1) NOT NULL,
    avg_professionalism_score DECIMAL(3,1) NOT NULL,
    
    -- Content statistics
    total_posts_analyzed INTEGER NOT NULL DEFAULT 0,
    ai_generated_posts INTEGER NOT NULL DEFAULT 0,
    high_expertise_posts INTEGER NOT NULL DEFAULT 0, -- Posts with expertise >= 8
    red_flag_count INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    last_analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_version VARCHAR(50) DEFAULT 'v2.0',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add indexes
    INDEX idx_prospect_content_summary_prospect_id (prospect_id),
    INDEX idx_prospect_content_summary_expires_at (expires_at),
    INDEX idx_prospect_content_summary_last_analysis (last_analysis_date DESC),
    
    -- One summary per prospect
    UNIQUE(prospect_id)
);

-- Enable RLS on new tables
ALTER TABLE training_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_content_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated access
CREATE POLICY "Authenticated users can access training decisions" ON training_decisions FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access decision patterns" ON decision_patterns FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage prediction results" ON prediction_results FOR ALL
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access content analysis" ON content_analysis FOR ALL
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access prospect content summary" ON prospect_content_summary FOR ALL
    USING (auth.uid() IS NOT NULL);

-- Create updated_at triggers
CREATE TRIGGER update_training_decisions_updated_at BEFORE UPDATE ON training_decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_patterns_updated_at BEFORE UPDATE ON decision_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_content_summary_updated_at BEFORE UPDATE ON prospect_content_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_prediction_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean expired content analysis
    DELETE FROM content_analysis WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean expired prospect summaries  
    DELETE FROM prospect_content_summary WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;