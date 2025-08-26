import { supabase, TABLES } from './supabase';
import {
  EnhancedUserFeedback,
  UserPreferenceProfile,
  TeamLearningProfile,
  LearningPipelineRun,
  AnalysisSnapshot,
  OutcomeTracking,
  DataPrivacyControls,
  FeedbackProcessingCache,
  FeedbackType,
  FeedbackStatus,
  LearningStage
} from './types';

/**
 * Enhanced User Feedback Operations
 */
export async function createEnhancedFeedback(feedbackData: {
  userId: string;
  teamId?: string;
  sessionId?: string;
  commenterId?: string;
  analysisId?: string;
  feedbackType: FeedbackType;
  overallRating?: number;
  isRelevant?: boolean;
  confidenceScore?: number;
  factorRatings?: any;
  correctionFlags?: string[];
  feedbackText?: string;
  improvementSuggestions?: string;
  additionalNotes?: string;
  outcomeData?: any;
  successIndicators?: any;
  analysisContext?: any;
  userContext?: any;
  sourceIp?: string;
  userAgent?: string;
  deviceInfo?: any;
  expiresAt?: string;
}): Promise<EnhancedUserFeedback> {
  // Set expiration based on data retention preferences
  let expirationDate = feedbackData.expiresAt;
  if (!expirationDate) {
    const privacyControls = await getDataPrivacyControls(feedbackData.userId);
    const retentionDays = privacyControls?.dataRetentionPreference || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);
    expirationDate = expiresAt.toISOString();
  }

  const { data, error } = await supabase
    .from(TABLES.USER_FEEDBACK_ENHANCED)
    .insert({
      user_id: feedbackData.userId,
      team_id: feedbackData.teamId,
      session_id: feedbackData.sessionId,
      commenter_id: feedbackData.commenterId,
      analysis_id: feedbackData.analysisId,
      feedback_type: feedbackData.feedbackType,
      overall_rating: feedbackData.overallRating,
      is_relevant: feedbackData.isRelevant,
      confidence_score: feedbackData.confidenceScore,
      factor_ratings: feedbackData.factorRatings || {},
      correction_flags: feedbackData.correctionFlags || [],
      feedback_text: feedbackData.feedbackText,
      improvement_suggestions: feedbackData.improvementSuggestions,
      additional_notes: feedbackData.additionalNotes,
      outcome_data: feedbackData.outcomeData || {},
      success_indicators: feedbackData.successIndicators || {},
      analysis_context: feedbackData.analysisContext || {},
      user_context: feedbackData.userContext || {},
      source_ip: feedbackData.sourceIp,
      user_agent: feedbackData.userAgent,
      device_info: feedbackData.deviceInfo,
      expires_at: expirationDate,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create enhanced feedback: ${error.message}`);
  }

  return mapEnhancedFeedbackFromDb(data);
}

export async function getEnhancedFeedbackByUser(
  userId: string,
  filters?: {
    feedbackType?: FeedbackType;
    feedbackStatus?: FeedbackStatus;
    sessionId?: string;
    commenterId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<EnhancedUserFeedback[]> {
  let query = supabase
    .from(TABLES.USER_FEEDBACK_ENHANCED)
    .select('*')
    .eq('user_id', userId);

  if (filters?.feedbackType) {
    query = query.eq('feedback_type', filters.feedbackType);
  }
  if (filters?.feedbackStatus) {
    query = query.eq('feedback_status', filters.feedbackStatus);
  }
  if (filters?.sessionId) {
    query = query.eq('session_id', filters.sessionId);
  }
  if (filters?.commenterId) {
    query = query.eq('commenter_id', filters.commenterId);
  }

  query = query.order('submitted_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get enhanced feedback: ${error.message}`);
  }

  return data.map(mapEnhancedFeedbackFromDb);
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  processingError?: string
): Promise<EnhancedUserFeedback> {
  const updateData: any = {
    feedback_status: status,
    processing_attempts: supabase.rpc('increment_processing_attempts', { feedback_id: feedbackId }),
  };

  if (status === 'processed' || status === 'incorporated') {
    updateData.last_processed_at = new Date().toISOString();
  }

  if (processingError) {
    updateData.processing_error = processingError;
  }

  const { data, error } = await supabase
    .from(TABLES.USER_FEEDBACK_ENHANCED)
    .update(updateData)
    .eq('id', feedbackId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update feedback status: ${error.message}`);
  }

  return mapEnhancedFeedbackFromDb(data);
}

/**
 * User Preference Profile Operations
 */
export async function createOrUpdateUserPreferences(
  userId: string,
  teamId: string | undefined,
  preferences: Partial<UserPreferenceProfile>
): Promise<UserPreferenceProfile> {
  const existingProfile = await getUserPreferenceProfile(userId, teamId);

  if (existingProfile) {
    return updateUserPreferences(existingProfile.id, preferences);
  }

  const { data, error } = await supabase
    .from(TABLES.USER_PREFERENCE_PROFILES)
    .insert({
      user_id: userId,
      team_id: teamId,
      industry_weights: preferences.industryWeights || {},
      role_preferences: preferences.rolePreferences || {},
      company_size_preferences: preferences.companySizePreferences || {},
      content_preferences: preferences.contentPreferences || {},
      communication_style_weights: preferences.communicationStyleWeights || {},
      timing_preferences: preferences.timingPreferences || {},
      success_patterns: preferences.successPatterns || {},
      failure_patterns: preferences.failurePatterns || {},
      total_feedback_count: preferences.totalFeedbackCount || 0,
      learning_confidence: preferences.learningConfidence || 0.0,
      model_version: preferences.modelVersion || '1.0',
      accuracy_trend: preferences.accuracyTrend || [],
      recent_performance: preferences.recentPerformance,
      improvement_rate: preferences.improvementRate,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user preference profile: ${error.message}`);
  }

  return mapUserPreferenceProfileFromDb(data);
}

export async function getUserPreferenceProfile(
  userId: string,
  teamId?: string
): Promise<UserPreferenceProfile | null> {
  let query = supabase
    .from(TABLES.USER_PREFERENCE_PROFILES)
    .select('*')
    .eq('user_id', userId);

  if (teamId) {
    query = query.eq('team_id', teamId);
  } else {
    query = query.is('team_id', null);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get user preference profile: ${error.message}`);
  }

  return mapUserPreferenceProfileFromDb(data);
}

export async function updateUserPreferences(
  profileId: string,
  updates: Partial<UserPreferenceProfile>
): Promise<UserPreferenceProfile> {
  const updateData: any = {};

  if (updates.industryWeights) updateData.industry_weights = updates.industryWeights;
  if (updates.rolePreferences) updateData.role_preferences = updates.rolePreferences;
  if (updates.companySizePreferences) updateData.company_size_preferences = updates.companySizePreferences;
  if (updates.contentPreferences) updateData.content_preferences = updates.contentPreferences;
  if (updates.communicationStyleWeights) updateData.communication_style_weights = updates.communicationStyleWeights;
  if (updates.timingPreferences) updateData.timing_preferences = updates.timingPreferences;
  if (updates.successPatterns) updateData.success_patterns = updates.successPatterns;
  if (updates.failurePatterns) updateData.failure_patterns = updates.failurePatterns;
  if (updates.totalFeedbackCount !== undefined) updateData.total_feedback_count = updates.totalFeedbackCount;
  if (updates.learningConfidence !== undefined) updateData.learning_confidence = updates.learningConfidence;
  if (updates.modelVersion) updateData.model_version = updates.modelVersion;
  if (updates.accuracyTrend) updateData.accuracy_trend = updates.accuracyTrend;
  if (updates.recentPerformance !== undefined) updateData.recent_performance = updates.recentPerformance;
  if (updates.improvementRate !== undefined) updateData.improvement_rate = updates.improvementRate;

  if (Object.keys(updateData).length > 0) {
    updateData.last_significant_update = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(TABLES.USER_PREFERENCE_PROFILES)
    .update(updateData)
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user preferences: ${error.message}`);
  }

  return mapUserPreferenceProfileFromDb(data);
}

/**
 * Team Learning Profile Operations
 */
export async function createOrUpdateTeamLearningProfile(
  teamId: string,
  profileData: Partial<TeamLearningProfile>
): Promise<TeamLearningProfile> {
  const existingProfile = await getTeamLearningProfile(teamId);

  if (existingProfile) {
    return updateTeamLearningProfile(existingProfile.id, profileData);
  }

  const { data, error } = await supabase
    .from(TABLES.TEAM_LEARNING_PROFILES)
    .insert({
      team_id: teamId,
      organization_id: profileData.organizationId,
      team_name: profileData.teamName,
      team_type: profileData.teamType,
      team_size: profileData.teamSize || 0,
      active_members: profileData.activeMembers || 0,
      collective_preferences: profileData.collectivePreferences || {},
      consensus_patterns: profileData.consensusPatterns || {},
      diverse_perspectives: profileData.diversePerspectives || {},
      team_accuracy: profileData.teamAccuracy,
      individual_vs_team_benefit: profileData.individualVsTeamBenefit,
      knowledge_transfer_rate: profileData.knowledgeTransferRate,
      outlier_detection: profileData.outlierDetection || {},
      quality_scores: profileData.qualityScores || {},
      feedback_distribution: profileData.feedbackDistribution || {},
      expertise_areas: profileData.expertiseAreas || {},
      model_version: profileData.modelVersion || '1.0',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create team learning profile: ${error.message}`);
  }

  return mapTeamLearningProfileFromDb(data);
}

export async function getTeamLearningProfile(teamId: string): Promise<TeamLearningProfile | null> {
  const { data, error } = await supabase
    .from(TABLES.TEAM_LEARNING_PROFILES)
    .select('*')
    .eq('team_id', teamId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get team learning profile: ${error.message}`);
  }

  return mapTeamLearningProfileFromDb(data);
}

export async function updateTeamLearningProfile(
  profileId: string,
  updates: Partial<TeamLearningProfile>
): Promise<TeamLearningProfile> {
  const updateData: any = {};

  if (updates.teamName) updateData.team_name = updates.teamName;
  if (updates.teamType) updateData.team_type = updates.teamType;
  if (updates.teamSize !== undefined) updateData.team_size = updates.teamSize;
  if (updates.activeMembers !== undefined) updateData.active_members = updates.activeMembers;
  if (updates.collectivePreferences) updateData.collective_preferences = updates.collectivePreferences;
  if (updates.consensusPatterns) updateData.consensus_patterns = updates.consensusPatterns;
  if (updates.diversePerspectives) updateData.diverse_perspectives = updates.diversePerspectives;
  if (updates.teamAccuracy !== undefined) updateData.team_accuracy = updates.teamAccuracy;
  if (updates.individualVsTeamBenefit !== undefined) updateData.individual_vs_team_benefit = updates.individualVsTeamBenefit;
  if (updates.knowledgeTransferRate !== undefined) updateData.knowledge_transfer_rate = updates.knowledgeTransferRate;
  if (updates.outlierDetection) updateData.outlier_detection = updates.outlierDetection;
  if (updates.qualityScores) updateData.quality_scores = updates.qualityScores;
  if (updates.feedbackDistribution) updateData.feedback_distribution = updates.feedbackDistribution;
  if (updates.expertiseAreas) updateData.expertise_areas = updates.expertiseAreas;
  if (updates.modelVersion) updateData.model_version = updates.modelVersion;

  if (Object.keys(updateData).length > 0) {
    updateData.last_aggregation = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(TABLES.TEAM_LEARNING_PROFILES)
    .update(updateData)
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update team learning profile: ${error.message}`);
  }

  return mapTeamLearningProfileFromDb(data);
}

/**
 * Learning Pipeline Operations
 */
export async function createLearningPipelineRun(runData: {
  runType: 'individual' | 'team' | 'global';
  userId?: string;
  teamId?: string;
  feedbackIds: string[];
  stage?: LearningStage;
}): Promise<LearningPipelineRun> {
  const { data, error } = await supabase
    .from(TABLES.LEARNING_PIPELINE_RUNS)
    .insert({
      run_type: runData.runType,
      user_id: runData.userId,
      team_id: runData.teamId,
      stage: runData.stage || 'collecting',
      feedback_count: runData.feedbackIds.length,
      feedback_ids: runData.feedbackIds,
      model_changes: {},
      validation_results: {},
      error_log: [],
      is_successful: false,
      requires_manual_review: false,
      auto_rollback_enabled: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create learning pipeline run: ${error.message}`);
  }

  return mapLearningPipelineRunFromDb(data);
}

export async function updateLearningPipelineRun(
  runId: string,
  updates: Partial<LearningPipelineRun>
): Promise<LearningPipelineRun> {
  const updateData: any = {};

  if (updates.stage) updateData.stage = updates.stage;
  if (updates.newPatternsDiscovered !== undefined) updateData.new_patterns_discovered = updates.newPatternsDiscovered;
  if (updates.patternsUpdated !== undefined) updateData.patterns_updated = updates.patternsUpdated;
  if (updates.modelChanges) updateData.model_changes = updates.modelChanges;
  if (updates.previousAccuracy !== undefined) updateData.previous_accuracy = updates.previousAccuracy;
  if (updates.predictedAccuracy !== undefined) updateData.predicted_accuracy = updates.predictedAccuracy;
  if (updates.actualAccuracy !== undefined) updateData.actual_accuracy = updates.actualAccuracy;
  if (updates.validationResults) updateData.validation_results = updates.validationResults;
  if (updates.rollbackData) updateData.rollback_data = updates.rollbackData;
  if (updates.processingDuration !== undefined) updateData.processing_duration = `${updates.processingDuration} seconds`;
  if (updates.resourcesUsed) updateData.resources_used = updates.resourcesUsed;
  if (updates.errorLog) updateData.error_log = updates.errorLog;
  if (updates.completedAt) updateData.completed_at = updates.completedAt;
  if (updates.deployedAt) updateData.deployed_at = updates.deployedAt;
  if (updates.nextScheduledRun) updateData.next_scheduled_run = updates.nextScheduledRun;
  if (updates.isSuccessful !== undefined) updateData.is_successful = updates.isSuccessful;
  if (updates.requiresManualReview !== undefined) updateData.requires_manual_review = updates.requiresManualReview;

  const { data, error } = await supabase
    .from(TABLES.LEARNING_PIPELINE_RUNS)
    .update(updateData)
    .eq('id', runId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update learning pipeline run: ${error.message}`);
  }

  return mapLearningPipelineRunFromDb(data);
}

/**
 * Analysis Snapshot Operations
 */
export async function createAnalysisSnapshot(snapshotData: {
  analysisId: string;
  sessionId: string;
  commenterId: string;
  userId: string;
  originalScore: number;
  scoringFactors: any;
  boostTermsUsed: string[];
  downTermsUsed: string[];
  modelVersion: string;
  userPreferencesSnapshot?: any;
  teamPreferencesSnapshot?: any;
  algorithmVersion: string;
  contentAnalysis: any;
  profileAnalysis: any;
  timingAnalysis: any;
  analysisDuration?: number;
  confidenceMetrics: any;
}): Promise<AnalysisSnapshot> {
  const { data, error } = await supabase
    .from(TABLES.ANALYSIS_SNAPSHOTS)
    .insert({
      analysis_id: snapshotData.analysisId,
      session_id: snapshotData.sessionId,
      commenter_id: snapshotData.commenterId,
      user_id: snapshotData.userId,
      original_score: snapshotData.originalScore,
      scoring_factors: snapshotData.scoringFactors,
      boost_terms_used: snapshotData.boostTermsUsed,
      down_terms_used: snapshotData.downTermsUsed,
      model_version: snapshotData.modelVersion,
      user_preferences_snapshot: snapshotData.userPreferencesSnapshot,
      team_preferences_snapshot: snapshotData.teamPreferencesSnapshot,
      algorithm_version: snapshotData.algorithmVersion,
      content_analysis: snapshotData.contentAnalysis,
      profile_analysis: snapshotData.profileAnalysis,
      timing_analysis: snapshotData.timingAnalysis,
      analysis_duration: snapshotData.analysisDuration ? `${snapshotData.analysisDuration} milliseconds` : null,
      confidence_metrics: snapshotData.confidenceMetrics,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create analysis snapshot: ${error.message}`);
  }

  return mapAnalysisSnapshotFromDb(data);
}

export async function getAnalysisSnapshot(analysisId: string): Promise<AnalysisSnapshot | null> {
  const { data, error } = await supabase
    .from(TABLES.ANALYSIS_SNAPSHOTS)
    .select('*')
    .eq('analysis_id', analysisId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get analysis snapshot: ${error.message}`);
  }

  return mapAnalysisSnapshotFromDb(data);
}

/**
 * Outcome Tracking Operations
 */
export async function createOrUpdateOutcomeTracking(
  feedbackId: string,
  outcomeData: Partial<OutcomeTracking>
): Promise<OutcomeTracking> {
  const existing = await getOutcomeTrackingByFeedback(feedbackId);

  if (existing) {
    return updateOutcomeTracking(existing.id, outcomeData);
  }

  const { data, error } = await supabase
    .from(TABLES.OUTCOME_TRACKING)
    .insert({
      feedback_id: feedbackId,
      commenter_id: outcomeData.commenterId!,
      user_id: outcomeData.userId!,
      contacted: outcomeData.contacted || false,
      contact_method: outcomeData.contactMethod,
      initial_response: outcomeData.initialResponse || false,
      response_time: outcomeData.responseTime ? `${outcomeData.responseTime} hours` : null,
      response_quality: outcomeData.responseQuality,
      meeting_requested: outcomeData.meetingRequested || false,
      meeting_scheduled: outcomeData.meetingScheduled || false,
      meeting_completed: outcomeData.meetingCompleted || false,
      meeting_outcome: outcomeData.meetingOutcome,
      opportunity_created: outcomeData.opportunityCreated || false,
      opportunity_value: outcomeData.opportunityValue,
      deal_closed: outcomeData.dealClosed || false,
      close_date: outcomeData.closeDate,
      actual_deal_value: outcomeData.actualDealValue,
      original_prediction_accuracy: outcomeData.originalPredictionAccuracy,
      factors_most_predictive: outcomeData.factorsMostPredictive || [],
      factors_least_predictive: outcomeData.factorsLeastPredictive || [],
      unexpected_outcomes: outcomeData.unexpectedOutcomes,
      improvement_suggestions: outcomeData.improvementSuggestions,
      contact_date: outcomeData.contactDate,
      first_response_date: outcomeData.firstResponseDate,
      last_interaction_date: outcomeData.lastInteractionDate,
      outcome_recorded_date: outcomeData.outcomeRecordedDate || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create outcome tracking: ${error.message}`);
  }

  return mapOutcomeTrackingFromDb(data);
}

export async function getOutcomeTrackingByFeedback(feedbackId: string): Promise<OutcomeTracking | null> {
  const { data, error } = await supabase
    .from(TABLES.OUTCOME_TRACKING)
    .select('*')
    .eq('feedback_id', feedbackId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get outcome tracking: ${error.message}`);
  }

  return mapOutcomeTrackingFromDb(data);
}

export async function updateOutcomeTracking(
  outcomeId: string,
  updates: Partial<OutcomeTracking>
): Promise<OutcomeTracking> {
  const updateData: any = {};

  if (updates.contacted !== undefined) updateData.contacted = updates.contacted;
  if (updates.contactMethod) updateData.contact_method = updates.contactMethod;
  if (updates.initialResponse !== undefined) updateData.initial_response = updates.initialResponse;
  if (updates.responseTime !== undefined) updateData.response_time = updates.responseTime ? `${updates.responseTime} hours` : null;
  if (updates.responseQuality !== undefined) updateData.response_quality = updates.responseQuality;
  if (updates.meetingRequested !== undefined) updateData.meeting_requested = updates.meetingRequested;
  if (updates.meetingScheduled !== undefined) updateData.meeting_scheduled = updates.meetingScheduled;
  if (updates.meetingCompleted !== undefined) updateData.meeting_completed = updates.meetingCompleted;
  if (updates.meetingOutcome) updateData.meeting_outcome = updates.meetingOutcome;
  if (updates.opportunityCreated !== undefined) updateData.opportunity_created = updates.opportunityCreated;
  if (updates.opportunityValue !== undefined) updateData.opportunity_value = updates.opportunityValue;
  if (updates.dealClosed !== undefined) updateData.deal_closed = updates.dealClosed;
  if (updates.closeDate) updateData.close_date = updates.closeDate;
  if (updates.actualDealValue !== undefined) updateData.actual_deal_value = updates.actualDealValue;
  if (updates.originalPredictionAccuracy !== undefined) updateData.original_prediction_accuracy = updates.originalPredictionAccuracy;
  if (updates.factorsMostPredictive) updateData.factors_most_predictive = updates.factorsMostPredictive;
  if (updates.factorsLeastPredictive) updateData.factors_least_predictive = updates.factorsLeastPredictive;
  if (updates.unexpectedOutcomes) updateData.unexpected_outcomes = updates.unexpectedOutcomes;
  if (updates.improvementSuggestions) updateData.improvement_suggestions = updates.improvementSuggestions;
  if (updates.contactDate) updateData.contact_date = updates.contactDate;
  if (updates.firstResponseDate) updateData.first_response_date = updates.firstResponseDate;
  if (updates.lastInteractionDate) updateData.last_interaction_date = updates.lastInteractionDate;

  const { data, error } = await supabase
    .from(TABLES.OUTCOME_TRACKING)
    .update(updateData)
    .eq('id', outcomeId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update outcome tracking: ${error.message}`);
  }

  return mapOutcomeTrackingFromDb(data);
}

/**
 * Data Privacy Controls Operations
 */
export async function createOrUpdateDataPrivacyControls(
  userId: string,
  controlsData: Partial<DataPrivacyControls>
): Promise<DataPrivacyControls> {
  const existing = await getDataPrivacyControls(userId);

  if (existing) {
    return updateDataPrivacyControls(existing.id, controlsData);
  }

  const { data, error } = await supabase
    .from(TABLES.DATA_PRIVACY_CONTROLS)
    .insert({
      user_id: userId,
      team_id: controlsData.teamId,
      learning_consent_given: controlsData.learningConsentGiven !== undefined ? controlsData.learningConsentGiven : true,
      team_sharing_enabled: controlsData.teamSharingEnabled !== undefined ? controlsData.teamSharingEnabled : true,
      outcome_tracking_enabled: controlsData.outcomeTrackingEnabled !== undefined ? controlsData.outcomeTrackingEnabled : true,
      data_retention_preference: controlsData.dataRetentionPreference || 365,
      anonymize_in_team_learning: controlsData.anonymizeInTeamLearning || false,
      exclude_from_global_learning: controlsData.excludeFromGlobalLearning || false,
      feedback_visibility: controlsData.feedbackVisibility || 'team',
      data_export_requested: false,
      data_deletion_requested: false,
      gdpr_compliance_verified: controlsData.gdprComplianceVerified || false,
      privacy_policy_version: controlsData.privacyPolicyVersion,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create data privacy controls: ${error.message}`);
  }

  return mapDataPrivacyControlsFromDb(data);
}

export async function getDataPrivacyControls(userId: string): Promise<DataPrivacyControls | null> {
  const { data, error } = await supabase
    .from(TABLES.DATA_PRIVACY_CONTROLS)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get data privacy controls: ${error.message}`);
  }

  return mapDataPrivacyControlsFromDb(data);
}

export async function updateDataPrivacyControls(
  controlsId: string,
  updates: Partial<DataPrivacyControls>
): Promise<DataPrivacyControls> {
  const updateData: any = {};

  if (updates.learningConsentGiven !== undefined) {
    updateData.learning_consent_given = updates.learningConsentGiven;
    updateData.consent_updated_at = new Date().toISOString();
  }
  if (updates.teamSharingEnabled !== undefined) updateData.team_sharing_enabled = updates.teamSharingEnabled;
  if (updates.outcomeTrackingEnabled !== undefined) updateData.outcome_tracking_enabled = updates.outcomeTrackingEnabled;
  if (updates.dataRetentionPreference !== undefined) updateData.data_retention_preference = updates.dataRetentionPreference;
  if (updates.anonymizeInTeamLearning !== undefined) updateData.anonymize_in_team_learning = updates.anonymizeInTeamLearning;
  if (updates.excludeFromGlobalLearning !== undefined) updateData.exclude_from_global_learning = updates.excludeFromGlobalLearning;
  if (updates.feedbackVisibility) updateData.feedback_visibility = updates.feedbackVisibility;
  if (updates.dataExportRequested !== undefined) updateData.data_export_requested = updates.dataExportRequested;
  if (updates.dataExportCompletedAt) updateData.data_export_completed_at = updates.dataExportCompletedAt;
  if (updates.dataDeletionRequested !== undefined) updateData.data_deletion_requested = updates.dataDeletionRequested;
  if (updates.dataDeletionScheduledAt) updateData.data_deletion_scheduled_at = updates.dataDeletionScheduledAt;
  if (updates.privacyPolicyVersion) updateData.privacy_policy_version = updates.privacyPolicyVersion;
  if (updates.gdprComplianceVerified !== undefined) updateData.gdpr_compliance_verified = updates.gdprComplianceVerified;

  const { data, error } = await supabase
    .from(TABLES.DATA_PRIVACY_CONTROLS)
    .update(updateData)
    .eq('id', controlsId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update data privacy controls: ${error.message}`);
  }

  return mapDataPrivacyControlsFromDb(data);
}

/**
 * Feedback Processing Cache Operations
 */
export async function getCachedFeedbackData(cacheKey: string): Promise<any | null> {
  const { data, error } = await supabase
    .from(TABLES.FEEDBACK_PROCESSING_CACHE)
    .select('cached_data, expires_at, invalidated')
    .eq('cache_key', cacheKey)
    .eq('invalidated', false)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get cached feedback data: ${error.message}`);
  }

  // Check if cache has expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    // Cache has expired, mark as invalidated
    await invalidateFeedbackCache(cacheKey, 'expired');
    return null;
  }

  // Update access frequency
  await supabase
    .from(TABLES.FEEDBACK_PROCESSING_CACHE)
    .update({ 
      access_frequency: supabase.rpc('increment_cache_access', { cache_key: cacheKey }),
      last_accessed: new Date().toISOString()
    })
    .eq('cache_key', cacheKey);

  return data.cached_data;
}

export async function setCachedFeedbackData(
  cacheKey: string,
  data: any,
  cacheType: string,
  expirationMinutes: number = 60,
  computationCost?: number,
  dependencies?: string[]
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

  const { error } = await supabase
    .from(TABLES.FEEDBACK_PROCESSING_CACHE)
    .upsert({
      cache_key: cacheKey,
      cache_type: cacheType,
      cached_data: data,
      data_version: '1.0',
      dependencies: dependencies || [],
      computation_cost: computationCost || 1,
      access_frequency: 1,
      expires_at: expiresAt.toISOString(),
      invalidated: false,
    });

  if (error) {
    throw new Error(`Failed to set cached feedback data: ${error.message}`);
  }
}

export async function invalidateFeedbackCache(
  cacheKey: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLES.FEEDBACK_PROCESSING_CACHE)
    .update({
      invalidated: true,
      invalidation_reason: reason,
    })
    .eq('cache_key', cacheKey);

  if (error) {
    throw new Error(`Failed to invalidate feedback cache: ${error.message}`);
  }
}

/**
 * Utility Functions for Data Mapping
 */
function mapEnhancedFeedbackFromDb(data: any): EnhancedUserFeedback {
  return {
    id: data.id,
    userId: data.user_id,
    teamId: data.team_id,
    sessionId: data.session_id,
    commenterId: data.commenter_id,
    analysisId: data.analysis_id,
    feedbackType: data.feedback_type,
    feedbackStatus: data.feedback_status,
    priority: data.priority,
    overallRating: data.overall_rating,
    isRelevant: data.is_relevant,
    confidenceScore: data.confidence_score,
    factorRatings: data.factor_ratings,
    correctionFlags: data.correction_flags,
    feedbackText: data.feedback_text,
    improvementSuggestions: data.improvement_suggestions,
    additionalNotes: data.additional_notes,
    outcomeData: data.outcome_data,
    successIndicators: data.success_indicators,
    analysisContext: data.analysis_context,
    userContext: data.user_context,
    processingAttempts: data.processing_attempts,
    lastProcessedAt: data.last_processed_at,
    processingError: data.processing_error,
    learningWeight: data.learning_weight,
    sourceIp: data.source_ip,
    userAgent: data.user_agent,
    deviceInfo: data.device_info,
    submittedAt: data.submitted_at,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapUserPreferenceProfileFromDb(data: any): UserPreferenceProfile {
  return {
    id: data.id,
    userId: data.user_id,
    teamId: data.team_id,
    industryWeights: data.industry_weights,
    rolePreferences: data.role_preferences,
    companySizePreferences: data.company_size_preferences,
    contentPreferences: data.content_preferences,
    communicationStyleWeights: data.communication_style_weights,
    timingPreferences: data.timing_preferences,
    successPatterns: data.success_patterns,
    failurePatterns: data.failure_patterns,
    totalFeedbackCount: data.total_feedback_count,
    lastSignificantUpdate: data.last_significant_update,
    learningConfidence: data.learning_confidence,
    modelVersion: data.model_version,
    accuracyTrend: data.accuracy_trend,
    recentPerformance: data.recent_performance,
    improvementRate: data.improvement_rate,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapTeamLearningProfileFromDb(data: any): TeamLearningProfile {
  return {
    id: data.id,
    teamId: data.team_id,
    organizationId: data.organization_id,
    teamName: data.team_name,
    teamType: data.team_type,
    teamSize: data.team_size,
    activeMembers: data.active_members,
    collectivePreferences: data.collective_preferences,
    consensusPatterns: data.consensus_patterns,
    diversePerspectives: data.diverse_perspectives,
    teamAccuracy: data.team_accuracy,
    individualVsTeamBenefit: data.individual_vs_team_benefit,
    knowledgeTransferRate: data.knowledge_transfer_rate,
    outlierDetection: data.outlier_detection,
    qualityScores: data.quality_scores,
    feedbackDistribution: data.feedback_distribution,
    expertiseAreas: data.expertise_areas,
    lastAggregation: data.last_aggregation,
    modelVersion: data.model_version,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapLearningPipelineRunFromDb(data: any): LearningPipelineRun {
  return {
    id: data.id,
    runType: data.run_type,
    stage: data.stage,
    userId: data.user_id,
    teamId: data.team_id,
    feedbackCount: data.feedback_count,
    feedbackIds: data.feedback_ids,
    newPatternsDiscovered: data.new_patterns_discovered,
    patternsUpdated: data.patterns_updated,
    modelChanges: data.model_changes,
    previousAccuracy: data.previous_accuracy,
    predictedAccuracy: data.predicted_accuracy,
    actualAccuracy: data.actual_accuracy,
    validationResults: data.validation_results,
    rollbackData: data.rollback_data,
    processingDuration: data.processing_duration ? parseInt(data.processing_duration.replace(' seconds', '')) : undefined,
    resourcesUsed: data.resources_used,
    errorLog: data.error_log,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    deployedAt: data.deployed_at,
    nextScheduledRun: data.next_scheduled_run,
    isSuccessful: data.is_successful,
    requiresManualReview: data.requires_manual_review,
    autoRollbackEnabled: data.auto_rollback_enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapAnalysisSnapshotFromDb(data: any): AnalysisSnapshot {
  return {
    id: data.id,
    analysisId: data.analysis_id,
    sessionId: data.session_id,
    commenterId: data.commenter_id,
    userId: data.user_id,
    originalScore: data.original_score,
    scoringFactors: data.scoring_factors,
    boostTermsUsed: data.boost_terms_used,
    downTermsUsed: data.down_terms_used,
    modelVersion: data.model_version,
    userPreferencesSnapshot: data.user_preferences_snapshot,
    teamPreferencesSnapshot: data.team_preferences_snapshot,
    algorithmVersion: data.algorithm_version,
    contentAnalysis: data.content_analysis,
    profileAnalysis: data.profile_analysis,
    timingAnalysis: data.timing_analysis,
    analysisDuration: data.analysis_duration ? parseInt(data.analysis_duration.replace(' milliseconds', '')) : undefined,
    confidenceMetrics: data.confidence_metrics,
    createdAt: data.created_at,
  };
}

function mapOutcomeTrackingFromDb(data: any): OutcomeTracking {
  return {
    id: data.id,
    feedbackId: data.feedback_id,
    commenterId: data.commenter_id,
    userId: data.user_id,
    contacted: data.contacted,
    contactMethod: data.contact_method,
    initialResponse: data.initial_response,
    responseTime: data.response_time ? parseInt(data.response_time.replace(' hours', '')) : undefined,
    responseQuality: data.response_quality,
    meetingRequested: data.meeting_requested,
    meetingScheduled: data.meeting_scheduled,
    meetingCompleted: data.meeting_completed,
    meetingOutcome: data.meeting_outcome,
    opportunityCreated: data.opportunity_created,
    opportunityValue: data.opportunity_value,
    dealClosed: data.deal_closed,
    closeDate: data.close_date,
    actualDealValue: data.actual_deal_value,
    originalPredictionAccuracy: data.original_prediction_accuracy,
    factorsMostPredictive: data.factors_most_predictive,
    factorsLeastPredictive: data.factors_least_predictive,
    unexpectedOutcomes: data.unexpected_outcomes,
    improvementSuggestions: data.improvement_suggestions,
    contactDate: data.contact_date,
    firstResponseDate: data.first_response_date,
    lastInteractionDate: data.last_interaction_date,
    outcomeRecordedDate: data.outcome_recorded_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapDataPrivacyControlsFromDb(data: any): DataPrivacyControls {
  return {
    id: data.id,
    userId: data.user_id,
    teamId: data.team_id,
    learningConsentGiven: data.learning_consent_given,
    teamSharingEnabled: data.team_sharing_enabled,
    outcomeTrackingEnabled: data.outcome_tracking_enabled,
    dataRetentionPreference: data.data_retention_preference,
    anonymizeInTeamLearning: data.anonymize_in_team_learning,
    excludeFromGlobalLearning: data.exclude_from_global_learning,
    feedbackVisibility: data.feedback_visibility,
    dataExportRequested: data.data_export_requested,
    dataExportCompletedAt: data.data_export_completed_at,
    dataDeletionRequested: data.data_deletion_requested,
    dataDeletionScheduledAt: data.data_deletion_scheduled_at,
    consentUpdatedAt: data.consent_updated_at,
    privacyPolicyVersion: data.privacy_policy_version,
    gdprComplianceVerified: data.gdpr_compliance_verified,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Analytics and Reporting Functions
 */
export async function getUserFeedbackAnalytics(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalFeedback: number;
  feedbackByType: { [key: string]: number };
  averageRating: number;
  recentAccuracy?: number;
  feedbackTrend: Array<{ date: string; count: number }>;
}> {
  let query = supabase
    .from(TABLES.USER_FEEDBACK_ENHANCED)
    .select('feedback_type, overall_rating, is_relevant, submitted_at')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('submitted_at', startDate);
  }
  if (endDate) {
    query = query.lte('submitted_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get user feedback analytics: ${error.message}`);
  }

  // Calculate metrics
  const totalFeedback = data.length;
  const feedbackByType: { [key: string]: number } = {};
  let totalRating = 0;
  let ratingCount = 0;

  data.forEach((feedback: any) => {
    // Count by type
    feedbackByType[feedback.feedback_type] = (feedbackByType[feedback.feedback_type] || 0) + 1;
    
    // Calculate average rating
    if (feedback.overall_rating) {
      totalRating += feedback.overall_rating;
      ratingCount++;
    }
  });

  const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Get user preference profile for recent accuracy
  const userProfile = await getUserPreferenceProfile(userId);
  const recentAccuracy = userProfile?.recentPerformance;

  // Generate trend data (simplified - group by date)
  const feedbackByDate: { [date: string]: number } = {};
  data.forEach((feedback: any) => {
    const date = feedback.submitted_at.split('T')[0];
    feedbackByDate[date] = (feedbackByDate[date] || 0) + 1;
  });

  const feedbackTrend = Object.entries(feedbackByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalFeedback,
    feedbackByType,
    averageRating,
    recentAccuracy,
    feedbackTrend,
  };
}

export async function getTeamFeedbackAnalytics(teamId: string): Promise<{
  totalMembers: number;
  activeFeedbackProviders: number;
  teamAccuracy?: number;
  totalFeedback: number;
  collaborationScore: number;
}> {
  // Get team profile
  const teamProfile = await getTeamLearningProfile(teamId);
  
  // Get feedback from all team members
  const { data: feedbackData, error } = await supabase
    .from(TABLES.USER_FEEDBACK_ENHANCED)
    .select('user_id, submitted_at')
    .eq('team_id', teamId)
    .gte('submitted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

  if (error) {
    throw new Error(`Failed to get team feedback analytics: ${error.message}`);
  }

  // Count unique active users
  const activeUsers = new Set(feedbackData.map((fb: any) => fb.user_id));

  // Calculate collaboration score based on feedback distribution evenness
  const userFeedbackCounts: { [userId: string]: number } = {};
  feedbackData.forEach((fb: any) => {
    userFeedbackCounts[fb.user_id] = (userFeedbackCounts[fb.user_id] || 0) + 1;
  });

  const feedbackCounts = Object.values(userFeedbackCounts);
  const avgFeedbackPerUser = feedbackCounts.length > 0 ? feedbackCounts.reduce((a, b) => a + b, 0) / feedbackCounts.length : 0;
  const variance = feedbackCounts.length > 0 
    ? feedbackCounts.reduce((acc, count) => acc + Math.pow(count - avgFeedbackPerUser, 2), 0) / feedbackCounts.length 
    : 0;
  const collaborationScore = avgFeedbackPerUser > 0 ? Math.max(0, 100 - (variance / avgFeedbackPerUser) * 10) : 0;

  return {
    totalMembers: teamProfile?.teamSize || 0,
    activeFeedbackProviders: activeUsers.size,
    teamAccuracy: teamProfile?.teamAccuracy,
    totalFeedback: feedbackData.length,
    collaborationScore: Math.round(collaborationScore),
  };
}