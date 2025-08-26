-- Migration: Voice Feedback System Enhancement
-- Description: Adds voice recording and transcription capabilities to the feedback system
-- Version: 6.0.0
-- Date: 2025-08-19

BEGIN;

-- Add voice-specific columns to feedback_interactions table
ALTER TABLE feedback_interactions 
ADD COLUMN IF NOT EXISTS voice_transcript TEXT,
ADD COLUMN IF NOT EXISTS voice_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS voice_language VARCHAR(10) DEFAULT 'en-US',
ADD COLUMN IF NOT EXISTS voice_recording_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS voice_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS audio_data_url TEXT,
ADD COLUMN IF NOT EXISTS audio_blob_id UUID,
ADD COLUMN IF NOT EXISTS speech_recognition_used BOOLEAN DEFAULT FALSE;

-- Create voice_recordings table for storing audio data separately
CREATE TABLE IF NOT EXISTS voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_interaction_id UUID NOT NULL REFERENCES feedback_interactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Audio file information
    audio_blob BYTEA, -- Store small audio files directly
    audio_file_path TEXT, -- Path for larger files stored on disk/cloud
    audio_format VARCHAR(20) DEFAULT 'audio/wav',
    audio_size_bytes INTEGER,
    audio_duration_ms INTEGER,
    
    -- Recording metadata
    sample_rate INTEGER DEFAULT 44100,
    channels INTEGER DEFAULT 1,
    bit_depth INTEGER DEFAULT 16,
    recording_quality TEXT CHECK (recording_quality IN ('low', 'medium', 'high', 'lossless')),
    
    -- Processing information
    transcription_service VARCHAR(50) DEFAULT 'web_speech_api',
    transcription_confidence DECIMAL(3,2),
    transcription_language VARCHAR(10) DEFAULT 'en-US',
    original_transcript TEXT,
    edited_transcript TEXT,
    
    -- Voice analysis data
    voice_analysis JSONB DEFAULT '{}', -- For future voice analytics
    speaking_rate DECIMAL(5,2), -- Words per minute
    pause_analysis JSONB DEFAULT '{}', -- Analysis of pauses and speech patterns
    sentiment_analysis JSONB DEFAULT '{}', -- Voice sentiment if analyzed
    
    -- Storage and processing flags
    is_processed BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    needs_cleanup BOOLEAN DEFAULT FALSE,
    privacy_compliant BOOLEAN DEFAULT TRUE, -- Ensures GDPR/privacy compliance
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Create voice_transcription_jobs table for async processing
CREATE TABLE IF NOT EXISTS voice_transcription_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_recording_id UUID NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Job details
    job_status TEXT DEFAULT 'pending' CHECK (job_status IN (
        'pending',      -- Waiting to be processed
        'processing',   -- Currently being transcribed
        'completed',    -- Successfully transcribed
        'failed',       -- Transcription failed
        'cancelled',    -- Job was cancelled
        'retrying'      -- Retrying after failure
    )),
    
    -- Service configuration
    transcription_service VARCHAR(50) NOT NULL,
    service_config JSONB DEFAULT '{}',
    language_code VARCHAR(10) DEFAULT 'en-US',
    
    -- Job results
    transcription_result TEXT,
    confidence_score DECIMAL(3,2),
    processing_error TEXT,
    service_response JSONB DEFAULT '{}',
    
    -- Timing and attempts
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_feedback_analytics table for voice-specific metrics
CREATE TABLE IF NOT EXISTS voice_feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for global metrics
    
    -- Time period for metrics
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type TEXT DEFAULT 'weekly' CHECK (metric_type IN ('daily', 'weekly', 'monthly')),
    
    -- Voice usage metrics
    total_voice_feedbacks INTEGER DEFAULT 0,
    total_recording_time_minutes DECIMAL(8,2) DEFAULT 0,
    average_recording_duration DECIMAL(6,2) DEFAULT 0,
    successful_transcriptions INTEGER DEFAULT 0,
    failed_transcriptions INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_transcription_confidence DECIMAL(3,2) DEFAULT 0,
    transcriptions_edited INTEGER DEFAULT 0,
    edit_percentage DECIMAL(4,3) DEFAULT 0,
    voice_vs_text_preference DECIMAL(4,3) DEFAULT 0, -- 0 = text, 1 = voice
    
    -- Language and accessibility
    languages_used TEXT[] DEFAULT '{}',
    primary_language VARCHAR(10) DEFAULT 'en-US',
    accessibility_usage BOOLEAN DEFAULT FALSE,
    
    -- User experience metrics
    user_satisfaction_voice DECIMAL(3,2), -- Voice-specific satisfaction
    completion_rate DECIMAL(4,3) DEFAULT 0, -- Percentage of started recordings completed
    retry_rate DECIMAL(4,3) DEFAULT 0, -- Percentage requiring retries
    
    -- System performance
    average_processing_time_ms INTEGER DEFAULT 0,
    transcription_accuracy_estimate DECIMAL(4,3) DEFAULT 0,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_feedback_interactions_voice_transcript 
    ON feedback_interactions(voice_transcript) 
    WHERE voice_transcript IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_interactions_voice_language 
    ON feedback_interactions(voice_language) 
    WHERE voice_language IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_interactions_speech_recognition 
    ON feedback_interactions(speech_recognition_used) 
    WHERE speech_recognition_used = TRUE;

CREATE INDEX IF NOT EXISTS idx_voice_recordings_feedback_id 
    ON voice_recordings(feedback_interaction_id);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_id 
    ON voice_recordings(user_id);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_processing 
    ON voice_recordings(is_processed) 
    WHERE is_processed = FALSE;

CREATE INDEX IF NOT EXISTS idx_voice_recordings_cleanup 
    ON voice_recordings(needs_cleanup) 
    WHERE needs_cleanup = TRUE;

CREATE INDEX IF NOT EXISTS idx_voice_recordings_created 
    ON voice_recordings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_transcription_jobs_status 
    ON voice_transcription_jobs(job_status);

CREATE INDEX IF NOT EXISTS idx_voice_transcription_jobs_recording 
    ON voice_transcription_jobs(voice_recording_id);

CREATE INDEX IF NOT EXISTS idx_voice_transcription_jobs_pending 
    ON voice_transcription_jobs(created_at) 
    WHERE job_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_voice_feedback_analytics_user 
    ON voice_feedback_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_voice_feedback_analytics_period 
    ON voice_feedback_analytics(time_period_start, time_period_end);

-- Add triggers for updated_at columns
CREATE TRIGGER update_voice_recordings_updated_at 
    BEFORE UPDATE ON voice_recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_transcription_jobs_updated_at 
    BEFORE UPDATE ON voice_transcription_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enhanced utility functions for voice feedback

-- Function to record voice feedback interaction
CREATE OR REPLACE FUNCTION record_voice_feedback_interaction(
    p_session_id UUID,
    p_user_id UUID,
    p_voice_transcript TEXT,
    p_voice_confidence DECIMAL DEFAULT NULL,
    p_voice_language VARCHAR DEFAULT 'en-US',
    p_recording_duration INTEGER DEFAULT 0,
    p_context_data JSONB DEFAULT '{}'::JSONB,
    p_audio_blob BYTEA DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
    voice_recording_id UUID;
BEGIN
    -- Create the feedback interaction
    INSERT INTO feedback_interactions (
        session_id,
        user_id,
        interaction_type,
        feedback_data,
        voice_transcript,
        voice_confidence,
        voice_language,
        voice_recording_duration,
        speech_recognition_used,
        context_data,
        collection_method,
        ui_component,
        learning_value
    ) VALUES (
        p_session_id,
        p_user_id,
        'explicit_rating',
        jsonb_build_object(
            'voice_feedback', TRUE,
            'transcript_length', LENGTH(p_voice_transcript),
            'recording_duration', p_recording_duration,
            'language', p_voice_language
        ),
        p_voice_transcript,
        p_voice_confidence,
        p_voice_language,
        p_recording_duration,
        TRUE,
        p_context_data,
        'voluntary',
        'voice_feedback_component',
        CASE 
            WHEN p_voice_confidence > 0.8 THEN 0.9
            WHEN p_voice_confidence > 0.6 THEN 0.7
            ELSE 0.5
        END
    ) RETURNING id INTO interaction_id;
    
    -- Store audio data if provided
    IF p_audio_blob IS NOT NULL THEN
        INSERT INTO voice_recordings (
            feedback_interaction_id,
            user_id,
            audio_blob,
            audio_format,
            audio_size_bytes,
            audio_duration_ms,
            transcription_confidence,
            transcription_language,
            original_transcript,
            is_processed
        ) VALUES (
            interaction_id,
            p_user_id,
            p_audio_blob,
            'audio/wav',
            LENGTH(p_audio_blob),
            p_recording_duration * 1000, -- Convert seconds to milliseconds
            p_voice_confidence,
            p_voice_language,
            p_voice_transcript,
            TRUE
        ) RETURNING id INTO voice_recording_id;
    END IF;
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to queue transcription job for async processing
CREATE OR REPLACE FUNCTION queue_voice_transcription(
    p_voice_recording_id UUID,
    p_transcription_service VARCHAR DEFAULT 'web_speech_api',
    p_language_code VARCHAR DEFAULT 'en-US',
    p_service_config JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    job_id UUID;
    recording_user_id UUID;
BEGIN
    -- Get user_id from voice recording
    SELECT user_id INTO recording_user_id 
    FROM voice_recordings 
    WHERE id = p_voice_recording_id;
    
    IF recording_user_id IS NULL THEN
        RAISE EXCEPTION 'Voice recording not found: %', p_voice_recording_id;
    END IF;
    
    INSERT INTO voice_transcription_jobs (
        voice_recording_id,
        user_id,
        transcription_service,
        service_config,
        language_code,
        job_status
    ) VALUES (
        p_voice_recording_id,
        recording_user_id,
        p_transcription_service,
        p_service_config,
        p_language_code,
        'pending'
    ) RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate voice feedback analytics
CREATE OR REPLACE FUNCTION calculate_voice_analytics(
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '1 week',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    analytics_result JSONB;
    user_filter TEXT;
BEGIN
    -- Build user filter
    user_filter := CASE 
        WHEN p_user_id IS NOT NULL THEN 'fi.user_id = $3 AND '
        ELSE ''
    END;
    
    -- Calculate analytics
    EXECUTE format('
        SELECT jsonb_build_object(
            ''total_voice_feedbacks'', COUNT(*),
            ''total_recording_time_minutes'', ROUND(SUM(fi.voice_recording_duration) / 60.0, 2),
            ''average_recording_duration'', ROUND(AVG(fi.voice_recording_duration), 2),
            ''successful_transcriptions'', COUNT(*) FILTER (WHERE fi.voice_transcript IS NOT NULL),
            ''average_confidence'', ROUND(AVG(fi.voice_confidence), 2),
            ''languages_used'', ARRAY_AGG(DISTINCT fi.voice_language) FILTER (WHERE fi.voice_language IS NOT NULL),
            ''transcriptions_edited'', COUNT(*) FILTER (WHERE fi.voice_edited = TRUE),
            ''voice_vs_text_ratio'', ROUND(
                COUNT(*) FILTER (WHERE fi.voice_transcript IS NOT NULL)::DECIMAL / 
                NULLIF(COUNT(*), 0), 3
            )
        )
        FROM feedback_interactions fi
        WHERE %s fi.feedback_timestamp BETWEEN $1 AND $2
        AND fi.speech_recognition_used = TRUE
    ', user_filter)
    INTO analytics_result
    USING p_start_date, p_end_date, p_user_id;
    
    RETURN analytics_result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old voice data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_voice_data(
    p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Archive old voice recordings
    UPDATE voice_recordings 
    SET is_archived = TRUE, archived_at = NOW()
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    AND is_archived = FALSE;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleanup_count := cleanup_count + temp_count;
    
    -- Delete audio blobs for very old recordings (keep transcripts)
    UPDATE voice_recordings 
    SET audio_blob = NULL, needs_cleanup = FALSE
    WHERE created_at < NOW() - ((p_retention_days * 2) || ' days')::INTERVAL
    AND audio_blob IS NOT NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleanup_count := cleanup_count + temp_count;
    
    -- Clean up old transcription jobs
    DELETE FROM voice_transcription_jobs
    WHERE completed_at < NOW() - (p_retention_days || ' days')::INTERVAL
    AND job_status IN ('completed', 'failed', 'cancelled');
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleanup_count := cleanup_count + temp_count;
    
    -- Clean up old analytics
    DELETE FROM voice_feedback_analytics
    WHERE time_period_end < NOW() - ((p_retention_days * 3) || ' days')::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleanup_count := cleanup_count + temp_count;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get voice feedback statistics for a user
CREATE OR REPLACE FUNCTION get_user_voice_stats(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'total_voice_feedbacks', COUNT(*),
            'total_recording_minutes', ROUND(SUM(voice_recording_duration) / 60.0, 2),
            'average_confidence', ROUND(AVG(voice_confidence), 2),
            'preferred_language', MODE() WITHIN GROUP (ORDER BY voice_language),
            'voice_usage_trend', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_trunc('day', feedback_timestamp),
                        'count', count(*)
                    ) ORDER BY date_trunc('day', feedback_timestamp)
                )
                FROM feedback_interactions 
                WHERE user_id = p_user_id 
                AND speech_recognition_used = TRUE
                AND feedback_timestamp > NOW() - INTERVAL '30 days'
                GROUP BY date_trunc('day', feedback_timestamp)
            ),
            'quality_improvement', (
                SELECT AVG(voice_confidence) - LAG(AVG(voice_confidence)) 
                OVER (ORDER BY date_trunc('week', feedback_timestamp))
                FROM feedback_interactions 
                WHERE user_id = p_user_id 
                AND speech_recognition_used = TRUE
                AND feedback_timestamp > NOW() - INTERVAL '8 weeks'
                GROUP BY date_trunc('week', feedback_timestamp)
                ORDER BY date_trunc('week', feedback_timestamp) DESC
                LIMIT 1
            )
        )
        FROM feedback_interactions
        WHERE user_id = p_user_id
        AND speech_recognition_used = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Update the existing cleanup function to include voice data
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
    
    -- Clean up voice data (GDPR compliance)
    SELECT cleanup_voice_data() INTO temp_count;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;