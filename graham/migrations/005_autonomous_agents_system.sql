-- Migration: Autonomous Agents System Tables
-- This migration creates all the tables needed for the autonomous AI agents and analytics system

-- Agent Discovery Sessions Table
CREATE TABLE IF NOT EXISTS agent_discovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    patterns_discovered INTEGER DEFAULT 0,
    patterns_validated INTEGER DEFAULT 0,
    processing_time_ms BIGINT DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Enhancement Sessions Table
CREATE TABLE IF NOT EXISTS agent_enhancement_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    sessions_analyzed INTEGER DEFAULT 0,
    improvements_identified INTEGER DEFAULT 0,
    quality_improvements_applied INTEGER DEFAULT 0,
    confidence_boost_achieved DECIMAL(3,2) DEFAULT 0,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Personalization Sessions Table
CREATE TABLE IF NOT EXISTS agent_personalization_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    users_processed INTEGER DEFAULT 0,
    personalizations_created INTEGER DEFAULT 0,
    personalizations_applied INTEGER DEFAULT 0,
    adaptation_improvements INTEGER DEFAULT 0,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Monitoring Sessions Table
CREATE TABLE IF NOT EXISTS agent_monitoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    metrics_analyzed INTEGER DEFAULT 0,
    anomalies_detected INTEGER DEFAULT 0,
    corrective_actions_taken INTEGER DEFAULT 0,
    performance_score DECIMAL(3,2) DEFAULT 0,
    system_health_score DECIMAL(3,2) DEFAULT 0,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Improvement Sessions Table
CREATE TABLE IF NOT EXISTS agent_improvement_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    opportunities_identified INTEGER DEFAULT 0,
    improvements_suggested INTEGER DEFAULT 0,
    improvements_implemented INTEGER DEFAULT 0,
    innovation_experiments_started INTEGER DEFAULT 0,
    coordinated_agent_actions INTEGER DEFAULT 0,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orchestration Sessions Table
CREATE TABLE IF NOT EXISTS orchestration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    orchestrator_version VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    agents_executed TEXT[] DEFAULT '{}',
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    total_improvements INTEGER DEFAULT 0,
    total_insights INTEGER DEFAULT 0,
    orchestration_efficiency DECIMAL(3,2) DEFAULT 0,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Improvements Table (for tracking individual improvements)
CREATE TABLE IF NOT EXISTS agent_improvements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    improvement_type VARCHAR(100) NOT NULL,
    improvement_name VARCHAR(255) NOT NULL,
    description TEXT,
    technical_details JSONB,
    affected_users TEXT[] DEFAULT '{}',
    affected_components TEXT[] DEFAULT '{}',
    performance_impact JSONB,
    expected_benefits TEXT[] DEFAULT '{}',
    rollout_status VARCHAR(50) DEFAULT 'planned',
    rollout_percentage INTEGER DEFAULT 0,
    test_group_size INTEGER,
    success_metrics JSONB,
    validation_results JSONB,
    user_feedback_score DECIMAL(3,2),
    performance_delta DECIMAL(5,4),
    implemented_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    deprecated_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100),
    approval_required BOOLEAN DEFAULT false,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Corrective Actions Table
CREATE TABLE IF NOT EXISTS agent_corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id VARCHAR(255) UNIQUE NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    description TEXT,
    target_components TEXT[] DEFAULT '{}',
    expected_impact JSONB,
    risk_assessment VARCHAR(50),
    implementation_time_estimate INTEGER,
    success_probability DECIMAL(3,2),
    applied_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'planned',
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Failures Table (for tracking and learning from failures)
CREATE TABLE IF NOT EXISTS agent_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    error_message TEXT,
    error_stack TEXT,
    error_context JSONB,
    recovery_attempted BOOLEAN DEFAULT false,
    recovery_successful BOOLEAN DEFAULT false,
    recovery_method TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    orchestration_session VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Personalization Profiles Table
CREATE TABLE IF NOT EXISTS user_personalization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL,
    personalization_confidence DECIMAL(3,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User Personalization Rules Table
CREATE TABLE IF NOT EXISTS user_personalization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_type VARCHAR(100) NOT NULL,
    rule_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    impact_score DECIMAL(3,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_from_sessions INTEGER,
    last_validation TIMESTAMP WITH TIME ZONE,
    effectiveness_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Innovation Experiments Table
CREATE TABLE IF NOT EXISTS innovation_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id VARCHAR(255) UNIQUE NOT NULL,
    experiment_name VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    target_metrics TEXT[] DEFAULT '{}',
    experimental_approach TEXT,
    success_criteria JSONB,
    risk_mitigation TEXT[] DEFAULT '{}',
    duration_days INTEGER,
    resource_requirements JSONB,
    expected_learning TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'planned',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    results JSONB,
    success_rate DECIMAL(3,2),
    learnings_captured TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Insights Table (enhanced version)
CREATE TABLE IF NOT EXISTS learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    confidence DECIMAL(3,2) NOT NULL,
    actionable BOOLEAN DEFAULT false,
    suggestion TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_source VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100),
    impact_score DECIMAL(3,2),
    implementation_effort VARCHAR(50),
    validation_status VARCHAR(50) DEFAULT 'pending',
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP WITH TIME ZONE,
    effectiveness_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research Quality Metrics Table (enhanced version)
CREATE TABLE IF NOT EXISTS research_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly
    
    -- Research activity metrics
    total_research_sessions INTEGER DEFAULT 0,
    total_profiles_researched INTEGER DEFAULT 0,
    unique_profiles_researched INTEGER DEFAULT 0,
    average_session_duration DECIMAL(8,2) DEFAULT 0, -- minutes
    
    -- Outcome metrics
    successful_contacts INTEGER DEFAULT 0,
    contact_success_rate DECIMAL(5,4) DEFAULT 0,
    positive_outcomes INTEGER DEFAULT 0,
    outcome_success_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Efficiency metrics
    time_saved_estimate DECIMAL(8,2) DEFAULT 0, -- minutes
    research_efficiency_score DECIMAL(5,4) DEFAULT 0,
    prediction_accuracy DECIMAL(5,4) DEFAULT 0,
    relevance_accuracy DECIMAL(5,4) DEFAULT 0,
    
    -- User satisfaction metrics
    user_satisfaction_score DECIMAL(5,4) DEFAULT 0,
    feedback_sentiment_score DECIMAL(5,4) DEFAULT 0,
    feature_usage_score DECIMAL(5,4) DEFAULT 0,
    
    -- Learning system metrics
    patterns_discovered INTEGER DEFAULT 0,
    patterns_validated INTEGER DEFAULT 0,
    model_improvements INTEGER DEFAULT 0,
    personalization_effectiveness DECIMAL(5,4) DEFAULT 0,
    
    -- Quality trends
    quality_trend VARCHAR(50) DEFAULT 'unknown',
    top_improvement_areas TEXT[] DEFAULT '{}',
    confidence_trend DECIMAL(5,4) DEFAULT 0,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, time_period_start, metric_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_discovery_sessions_agent_name ON agent_discovery_sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_discovery_sessions_started_at ON agent_discovery_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_enhancement_sessions_agent_name ON agent_enhancement_sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_enhancement_sessions_started_at ON agent_enhancement_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_personalization_sessions_agent_name ON agent_personalization_sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_personalization_sessions_started_at ON agent_personalization_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_monitoring_sessions_agent_name ON agent_monitoring_sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_monitoring_sessions_started_at ON agent_monitoring_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_improvement_sessions_agent_name ON agent_improvement_sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_improvement_sessions_started_at ON agent_improvement_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_orchestration_sessions_started_at ON orchestration_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_orchestration_sessions_orchestrator_version ON orchestration_sessions(orchestrator_version);

CREATE INDEX IF NOT EXISTS idx_agent_improvements_agent_name ON agent_improvements(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_improvements_rollout_status ON agent_improvements(rollout_status);
CREATE INDEX IF NOT EXISTS idx_agent_improvements_created_at ON agent_improvements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_corrective_actions_agent_name ON agent_corrective_actions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_corrective_actions_status ON agent_corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_corrective_actions_applied_at ON agent_corrective_actions(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_failures_agent_name ON agent_failures(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_failures_timestamp ON agent_failures(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_personalization_profiles_user_id ON user_personalization_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personalization_profiles_last_updated ON user_personalization_profiles(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_user_personalization_rules_user_id ON user_personalization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personalization_rules_rule_type ON user_personalization_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_user_personalization_rules_is_active ON user_personalization_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_innovation_experiments_status ON innovation_experiments(status);
CREATE INDEX IF NOT EXISTS idx_innovation_experiments_started_at ON innovation_experiments(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights(type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_user_id ON learning_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_insights_agent_source ON learning_insights(agent_source);
CREATE INDEX IF NOT EXISTS idx_learning_insights_priority ON learning_insights(priority);
CREATE INDEX IF NOT EXISTS idx_learning_insights_created_at ON learning_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_quality_metrics_user_id ON research_quality_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_research_quality_metrics_time_period ON research_quality_metrics(time_period_start DESC);
CREATE INDEX IF NOT EXISTS idx_research_quality_metrics_metric_type ON research_quality_metrics(metric_type);

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_agent_discovery_sessions_updated_at BEFORE UPDATE ON agent_discovery_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_enhancement_sessions_updated_at BEFORE UPDATE ON agent_enhancement_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_personalization_sessions_updated_at BEFORE UPDATE ON agent_personalization_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_monitoring_sessions_updated_at BEFORE UPDATE ON agent_monitoring_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_improvement_sessions_updated_at BEFORE UPDATE ON agent_improvement_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orchestration_sessions_updated_at BEFORE UPDATE ON orchestration_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_improvements_updated_at BEFORE UPDATE ON agent_improvements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_corrective_actions_updated_at BEFORE UPDATE ON agent_corrective_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_personalization_rules_updated_at BEFORE UPDATE ON user_personalization_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_innovation_experiments_updated_at BEFORE UPDATE ON innovation_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_insights_updated_at BEFORE UPDATE ON learning_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO learning_insights (type, title, description, confidence, actionable, suggestion, priority, category, impact_score, implementation_effort)
VALUES 
    ('improvement_opportunity', 'Pattern Discovery Rate Increasing', 'The system is discovering 23% more patterns this week compared to last week.', 0.92, true, 'Consider increasing pattern validation frequency to maintain quality', 'high', 'performance', 0.85, 'medium'),
    ('efficiency_improvement', 'User Satisfaction Stable', 'User satisfaction remains consistently high with minor variations.', 0.87, false, 'Monitor user feedback trends and maintain current service quality', 'medium', 'user_experience', 0.65, 'low'),
    ('pattern_recognition', 'New Industry Patterns Detected', 'Discovered emerging patterns in technology sector user preferences.', 0.78, true, 'Validate new industry patterns and consider specialized recommendations', 'high', 'business_intelligence', 0.92, 'high');

-- Add some sample quality metrics
INSERT INTO research_quality_metrics (
    user_id, time_period_start, time_period_end, metric_type,
    total_research_sessions, contact_success_rate, research_efficiency_score,
    user_satisfaction_score, patterns_discovered, quality_trend
) VALUES (
    NULL, -- Global metrics
    NOW() - INTERVAL '1 day',
    NOW(),
    'daily',
    150,
    0.34,
    0.78,
    0.82,
    12,
    'improving'
);

COMMENT ON TABLE agent_discovery_sessions IS 'Records of autonomous pattern discovery agent runs';
COMMENT ON TABLE agent_enhancement_sessions IS 'Records of research enhancement agent runs';
COMMENT ON TABLE agent_personalization_sessions IS 'Records of personalization agent runs';
COMMENT ON TABLE agent_monitoring_sessions IS 'Records of quality monitoring agent runs';
COMMENT ON TABLE agent_improvement_sessions IS 'Records of proactive improvement agent runs';
COMMENT ON TABLE orchestration_sessions IS 'Records of agent orchestration sessions';
COMMENT ON TABLE agent_improvements IS 'Individual improvements implemented by agents';
COMMENT ON TABLE agent_corrective_actions IS 'Corrective actions taken by quality monitoring';
COMMENT ON TABLE agent_failures IS 'Agent failures for debugging and improvement';
COMMENT ON TABLE user_personalization_profiles IS 'User-specific personalization data';
COMMENT ON TABLE user_personalization_rules IS 'Active personalization rules per user';
COMMENT ON TABLE innovation_experiments IS 'Innovation experiments for breakthrough improvements';
COMMENT ON TABLE learning_insights IS 'System-generated insights and recommendations';
COMMENT ON TABLE research_quality_metrics IS 'Research quality and performance metrics';