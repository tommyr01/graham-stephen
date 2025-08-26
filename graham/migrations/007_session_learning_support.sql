-- Migration: Session Learning Support
-- Description: Adds support for session state persistence in feedback_interactions
-- Version: 7.0.0
-- Date: 2025-08-22

BEGIN;

-- Update feedback_interactions table to support session state persistence
ALTER TABLE feedback_interactions
DROP CONSTRAINT IF EXISTS feedback_interactions_interaction_type_check;

ALTER TABLE feedback_interactions
ADD CONSTRAINT feedback_interactions_interaction_type_check
CHECK (interaction_type IN (
    'explicit_rating',          -- User explicitly rated something
    'implicit_behavior',        -- Behavior that implies feedback (time spent, clicks, etc.)
    'contextual_action',        -- Actions that provide context (save, contact, skip)
    'outcome_report',           -- Reporting results of contact attempts
    'pattern_correction',       -- User correcting system predictions
    'preference_update',        -- User updating their preferences
    'session_state_persistence' -- Session learning state persistence (Integration #4)
));

-- Add index for session state queries
CREATE INDEX IF NOT EXISTS idx_feedback_interactions_session_state 
ON feedback_interactions(user_id, interaction_type) 
WHERE interaction_type = 'session_state_persistence';

COMMIT;