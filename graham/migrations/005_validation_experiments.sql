-- Migration: Pattern Validation Experiments Table
-- Description: Creates table for A/B testing pattern effectiveness
-- Version: 5.0.0
-- Date: 2025-08-19

BEGIN;

-- Pattern Validation Experiments (for A/B testing patterns)
CREATE TABLE IF NOT EXISTS pattern_validation_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID NOT NULL REFERENCES discovered_patterns(id) ON DELETE CASCADE,
    
    experiment_name TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    
    -- Experiment groups
    control_group JSONB NOT NULL, -- { id, name, users[], pattern_enabled: false }
    treatment_group JSONB NOT NULL, -- { id, name, users[], pattern_enabled: true }
    
    -- Experiment configuration
    metrics_to_track TEXT[] DEFAULT '{}',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'running', 'completed', 'cancelled')),
    
    config JSONB DEFAULT '{}', -- ValidationConfig object
    
    -- Results tracking
    baseline_metrics JSONB DEFAULT NULL,
    current_metrics JSONB DEFAULT NULL,
    statistical_significance JSONB DEFAULT NULL,
    
    -- Experiment conclusion
    conclusion TEXT DEFAULT NULL,
    final_result TEXT DEFAULT NULL CHECK (final_result IS NULL OR final_result IN ('validated', 'rejected')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_pattern_validation_experiments_pattern_id ON pattern_validation_experiments(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_validation_experiments_status ON pattern_validation_experiments(status);
CREATE INDEX IF NOT EXISTS idx_pattern_validation_experiments_dates ON pattern_validation_experiments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pattern_validation_experiments_created ON pattern_validation_experiments(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_pattern_validation_experiments_updated_at 
    BEFORE UPDATE ON pattern_validation_experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;