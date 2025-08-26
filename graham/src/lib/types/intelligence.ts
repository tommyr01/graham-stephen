/**
 * Type definitions for the Pattern Discovery and Intelligence System
 */

// Core Intelligence Types
export interface UserIntelligenceProfile {
  id: string;
  user_id: string;
  
  // Industry and role preferences learned from behavior
  industry_focus: string[];
  role_preferences: string[];
  company_size_preference: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null;
  location_preferences: string[];
  seniority_preferences: ('junior' | 'mid' | 'senior' | 'executive' | 'founder')[];
  
  // Behavioral patterns discovered through usage
  engagement_patterns: Record<string, any>;
  success_patterns: Record<string, any>;
  search_patterns: Record<string, any>;
  timing_patterns: Record<string, any>;
  
  // Learning system metadata
  learning_confidence: number; // 0-1 scale
  total_research_sessions: number;
  successful_contacts: number;
  feedback_interactions: number;
  
  // Pattern freshness and updates
  last_pattern_update: Date;
  last_successful_contact: Date | null;
  pattern_version: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface ResearchSessionIntelligence {
  id: string;
  session_id: string;
  user_id: string;
  
  // Profile being researched
  linkedin_profile_url: string;
  profile_data: Record<string, any> | null;
  
  // Research context and intent
  research_context: Record<string, any>;
  initial_prediction: Record<string, any>;
  research_source: string | null;
  research_goal: string | null;
  
  // Behavioral tracking data
  session_duration: number;
  profile_view_time: number;
  sections_viewed: string[];
  sections_expanded: string[];
  scroll_behavior: Record<string, any>;
  click_patterns: Record<string, any>;
  copy_actions: string[];
  
  // External actions during session
  search_queries: string[];
  external_links_visited: string[];
  notes_taken: string | null;
  tags_applied: string[];
  
  // Session outcome and feedback
  session_outcome: 'contacted' | 'skipped' | 'saved_for_later' | 'needs_more_info' | 'flagged_inappropriate' | null;
  confidence_level: number | null;
  relevance_rating: number | null;
  reasoning: string | null;
  follow_up_notes: string | null;
  contact_method: string | null;
  
  // Learning metadata
  feedback_quality_score: number | null;
  pattern_contribution: Record<string, any>;
  anomaly_detected: boolean;
  
  created_at: Date;
  updated_at: Date;
}

export interface FeedbackInteraction {
  id: string;
  session_id: string | null;
  user_id: string;
  
  // Type of feedback interaction
  interaction_type: 'explicit_rating' | 'implicit_behavior' | 'contextual_action' | 'outcome_report' | 'pattern_correction' | 'preference_update';
  
  // The actual feedback data (flexible JSON structure)
  feedback_data: Record<string, any>;
  
  // Context about when/how feedback was collected
  feedback_timestamp: Date;
  context_data: Record<string, any>;
  collection_method: string | null;
  ui_component: string | null;
  
  // Learning system processing
  processed: boolean;
  processing_results: Record<string, any>;
  learning_value: number;
  confidence_impact: number;
  
  // Validation and quality
  validated: boolean;
  validation_method: string | null;
  validation_results: Record<string, any>;
  
  created_at: Date;
}

export interface DiscoveredPattern {
  id: string;
  
  // Pattern classification
  pattern_type: 'user_preference' | 'industry_signal' | 'timing_pattern' | 'success_indicator' | 'engagement_signal' | 'quality_indicator' | 'context_pattern';
  pattern_name: string;
  pattern_description: string | null;
  
  // Pattern data and rules
  pattern_data: Record<string, any>;
  trigger_conditions: Record<string, any>;
  expected_outcome: string | null;
  
  // Pattern performance metrics
  confidence_score: number;
  supporting_sessions: number;
  contradicting_sessions: number;
  accuracy_rate: number;
  
  // Pattern scope and applicability
  applies_to_users: string[];
  applies_to_industries: string[];
  applies_to_roles: string[];
  
  // Discovery and validation metadata
  discovery_method: string;
  discovery_agent: string | null;
  discovered_at: Date;
  
  validation_status: PatternValidationStatus;
  
  // Impact and effectiveness
  impact_score: number;
  usage_count: number;
  last_used: Date | null;
  
  // Pattern evolution
  parent_pattern_id: string | null;
  version: number;
  
  created_at: Date;
  last_validated: Date;
  updated_at: Date;
}

export type PatternValidationStatus = 'discovered' | 'testing' | 'validated' | 'deprecated' | 'archived';

// Pattern Discovery Types
export interface PatternDiscoveryResult {
  pattern_type: DiscoveredPattern['pattern_type'];
  pattern_name: string;
  pattern_description: string;
  pattern_data: Record<string, any>;
  trigger_conditions: Record<string, any>;
  expected_outcome: string;
  confidence_score: number;
  supporting_sessions: number;
  discovery_method: string;
  applies_to_users?: string[];
  applies_to_industries?: string[];
  applies_to_roles?: string[];
}

export interface UserBehaviorData {
  sessions: ResearchSessionIntelligence[];
  feedback_interactions: FeedbackInteraction[];
  time_period: {
    start_date: Date;
    end_date: Date;
  };
}

export interface IndustryPattern {
  industry: string;
  success_rate: number;
  average_engagement: number;
  common_roles: string[];
  optimal_timing: number[];
}

export interface TimingPattern {
  optimal_hours: number[];
  optimal_days: string[];
  session_duration_sweet_spot: number;
  frequency_pattern: string;
}

export interface SuccessIndicator {
  indicator_type: string;
  indicator_value: any;
  correlation_strength: number;
  success_lift: number;
}

export interface EngagementSignal {
  signal_type: string;
  engagement_threshold: number;
  predictive_value: number;
  behavioral_markers: string[];
}

export interface QualityIndicator {
  quality_metric: string;
  threshold_value: any;
  accuracy_improvement: number;
  profile_characteristics: Record<string, any>;
}

export interface ContextPattern {
  context_type: string;
  context_values: string[];
  success_rate: number;
  optimal_conditions: Record<string, any>;
}

// User Intelligence Profile Service Types
export interface PatternUpdateRequest {
  userId: string;
  behaviorAnalysis: UserBehaviorAnalysis;
  sessionData: ResearchSessionIntelligence[];
  feedbackData: FeedbackInteraction[];
  timestamp: Date;
}

export interface UserBehaviorAnalysis {
  total_sessions: number;
  successful_sessions: number;
  average_session_duration: number;
  contact_rate: number;
  feedback_frequency: number;
  most_active_hours: number[];
  preferred_industries: string[];
  success_indicators: Record<string, any>;
}

export interface PreferenceUpdate {
  industry_focus?: string[];
  role_preferences?: string[];
  company_size_preference?: UserIntelligenceProfile['company_size_preference'];
  location_preferences?: string[];
  seniority_preferences?: UserIntelligenceProfile['seniority_preferences'][];
}

export interface LearningInsight {
  type: 'improvement_opportunity' | 'efficiency_improvement' | 'pattern_recognition' | 'recommendation' | 'pattern_correction';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestion: string | null;
  user_id?: string;
  created_at: Date;
}

// Pattern Validation System Types
export interface ValidationExperiment {
  id: string;
  pattern_id: string;
  experiment_name: string;
  hypothesis: string;
  
  control_group: ExperimentGroup;
  treatment_group: ExperimentGroup;
  
  metrics_to_track: string[];
  start_date: Date;
  end_date: Date;
  status: 'planning' | 'running' | 'completed' | 'cancelled';
  
  config: ValidationConfig;
  baseline_metrics: ValidationMetrics | null;
  current_metrics: ValidationMetrics | null;
  statistical_significance: Record<string, any> | null;
  
  created_at: Date;
}

export interface ValidationConfig {
  min_users_per_group: number;
  experiment_duration_days: number;
  significance_threshold: number;
  min_effect_size: number;
  power: number;
  early_stopping: boolean;
}

export interface ValidationMetrics {
  contact_rate: number;
  session_duration: number;
  user_satisfaction: number;
  efficiency_score: number;
  retention_rate: number;
}

export interface ExperimentResult {
  experiment_id: string;
  status: 'running' | 'completed';
  control_metrics: ValidationMetrics;
  treatment_metrics: ValidationMetrics;
  statistical_result: Record<string, any>;
  recommendation: string;
  days_remaining?: number;
  final_decision?: 'validated' | 'rejected';
  conclusion_reason?: string;
}

// Learning Data Processor Types
export interface ProcessingResult {
  success: boolean;
  message?: string;
  processing_time?: number;
  interactions_processed?: number;
  profiles_updated?: number;
  patterns_discovered?: number;
  insights_generated?: number;
  learning_value?: number;
  pattern_updates?: string[];
}

export interface DataProcessingConfig {
  batch_size: number;
  processing_interval_minutes: number;
  max_processing_time_minutes: number;
  enable_real_time: boolean;
  enable_pattern_discovery: boolean;
}

// Research Quality Metrics
export interface ResearchQualityMetrics {
  id: string;
  user_id: string | null; // null for global metrics
  
  // Time period for these metrics
  time_period_start: Date;
  time_period_end: Date;
  metric_type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  // Research activity metrics
  total_research_sessions: number;
  total_profiles_researched: number;
  unique_profiles_researched: number;
  average_session_duration: number; // minutes
  
  // Outcome metrics
  successful_contacts: number;
  contact_success_rate: number;
  positive_outcomes: number;
  outcome_success_rate: number;
  
  // Efficiency metrics
  time_saved_estimate: number; // minutes
  research_efficiency_score: number;
  prediction_accuracy: number;
  relevance_accuracy: number;
  
  // User satisfaction metrics
  user_satisfaction_score: number;
  feedback_sentiment_score: number;
  feature_usage_score: number;
  
  // Learning system metrics
  patterns_discovered: number;
  patterns_validated: number;
  model_improvements: number;
  personalization_effectiveness: number;
  
  // Quality trends
  quality_trend: 'improving' | 'stable' | 'declining' | 'unknown';
  top_improvement_areas: string[];
  confidence_trend: number;
  
  calculated_at: Date;
  created_at: Date;
}

// Agent Improvements
export interface AgentImprovement {
  id: string;
  
  // Agent and improvement details
  agent_name: string;
  agent_version: string;
  improvement_type: 'algorithm_update' | 'new_pattern' | 'parameter_tuning' | 'bug_fix' | 'feature_enhancement' | 'performance_optimization';
  
  improvement_name: string;
  description: string;
  technical_details: Record<string, any>;
  
  // Scope and impact
  affected_users: string[];
  affected_components: string[];
  performance_impact: Record<string, any>;
  expected_benefits: string[];
  
  // Rollout status and control
  rollout_status: 'planned' | 'testing' | 'partial' | 'full' | 'rollback' | 'archived';
  rollout_percentage: number;
  test_group_size: number | null;
  
  // Success metrics and validation
  success_metrics: Record<string, any>;
  validation_results: Record<string, any>;
  user_feedback_score: number | null;
  performance_delta: number | null;
  
  // Lifecycle management
  implemented_at: Date;
  validated_at: Date | null;
  deployed_at: Date | null;
  deprecated_at: Date | null;
  
  created_by: string;
  approval_required: boolean;
  approved_by: string | null;
  approved_at: Date | null;
  
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard and Analytics Types
export interface AnalyticsDashboard {
  user_intelligence: {
    total_profiles: number;
    active_learners: number;
    avg_confidence: number;
    top_industries: string[];
  };
  pattern_discovery: {
    total_patterns: number;
    validated_patterns: number;
    testing_patterns: number;
    top_performing_patterns: DiscoveredPattern[];
  };
  system_performance: {
    processing_rate: number;
    avg_response_time: number;
    accuracy_improvements: number;
    user_satisfaction: number;
  };
  recent_insights: LearningInsight[];
}

export interface UserDashboard {
  profile_summary: UserIntelligenceProfile;
  recent_insights: LearningInsight[];
  performance_metrics: {
    contact_rate: number;
    efficiency_score: number;
    learning_progress: number;
  };
  recommendations: string[];
}