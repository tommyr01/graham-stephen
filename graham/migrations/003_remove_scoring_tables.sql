-- Migration: Remove Lead Scoring System Tables
-- Description: Removes all tables related to the AI prediction and feedback scoring system
-- Version: 3.0.0
-- Date: 2025-08-19

BEGIN;

-- Drop prediction/scoring tables
DROP TABLE IF EXISTS prediction_results CASCADE;
DROP TABLE IF EXISTS decision_patterns CASCADE;
DROP TABLE IF EXISTS training_decisions CASCADE;
DROP TABLE IF EXISTS content_analysis CASCADE;
DROP TABLE IF EXISTS prospect_content_summary CASCADE;

-- Drop feedback loop tables
DROP TABLE IF EXISTS user_feedback_enhanced CASCADE;
DROP TABLE IF EXISTS team_learning_patterns CASCADE;
DROP TABLE IF EXISTS user_preference_profiles CASCADE;
DROP TABLE IF EXISTS learning_pipeline_jobs CASCADE;
DROP TABLE IF EXISTS outcome_tracking CASCADE;
DROP TABLE IF EXISTS model_performance_metrics CASCADE;
DROP TABLE IF EXISTS batch_feedback_sessions CASCADE;
DROP TABLE IF EXISTS user_privacy_settings CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS feedback_type CASCADE;
DROP TYPE IF EXISTS feedback_status CASCADE;
DROP TYPE IF EXISTS learning_stage CASCADE;
DROP TYPE IF EXISTS preference_weight CASCADE;

-- Drop cache cleanup function
DROP FUNCTION IF EXISTS clean_expired_prediction_cache();

-- Drop triggers and functions related to scoring
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

COMMIT;