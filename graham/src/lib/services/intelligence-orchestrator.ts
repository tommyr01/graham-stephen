/**
 * Intelligence Orchestrator - Main service that coordinates all intelligence components
 * 
 * This service orchestrates pattern discovery, validation, learning, and provides
 * a unified interface for the intelligence system.
 */

import { supabase } from '@/lib/supabase';
import PatternDiscoveryEngine from './pattern-discovery-engine';
import UserIntelligenceProfileService from './user-intelligence-profile-service';
import PatternValidationSystem from './pattern-validation-system';
import LearningDataProcessor from './learning-data-processor';
import type { 
  PatternDiscoveryResult,
  UserIntelligenceProfile,
  ValidationExperiment,
  LearningInsight,
  ProcessingResult
} from '@/lib/types/intelligence';

interface OrchestrationConfig {
  enable_auto_discovery: boolean;
  enable_auto_validation: boolean;
  enable_real_time_learning: boolean;
  batch_processing_interval_minutes: number;
  pattern_discovery_interval_hours: number;
  validation_check_interval_hours: number;
}

interface SystemStatus {
  last_batch_processing: Date | null;
  last_pattern_discovery: Date | null;
  last_validation_check: Date | null;
  processing_queue_size: number;
  active_experiments: number;
  system_health: 'healthy' | 'degraded' | 'error';
}

const DEFAULT_CONFIG: OrchestrationConfig = {
  enable_auto_discovery: true,
  enable_auto_validation: true,
  enable_real_time_learning: true,
  batch_processing_interval_minutes: 30,
  pattern_discovery_interval_hours: 6,
  validation_check_interval_hours: 12
};

export class IntelligenceOrchestrator {
  private config: OrchestrationConfig;
  private patternEngine: PatternDiscoveryEngine;
  private profileService: UserIntelligenceProfileService;
  private validationSystem: PatternValidationSystem;
  private dataProcessor: LearningDataProcessor;

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.patternEngine = new PatternDiscoveryEngine();
    this.profileService = new UserIntelligenceProfileService();
    this.validationSystem = new PatternValidationSystem();
    this.dataProcessor = new LearningDataProcessor();
  }

  /**
   * Run complete intelligence system orchestration
   */
  async runOrchestration(): Promise<{
    batch_processing: ProcessingResult;
    pattern_discovery: PatternDiscoveryResult[];
    validation_updates: string[];
    system_status: SystemStatus;
  }> {
    console.log('Starting intelligence system orchestration');
    
    try {
      const startTime = Date.now();

      // Run batch processing first
      const batchResult = await this.runBatchProcessing();
      
      // Run pattern discovery if enabled and due
      let discoveredPatterns: PatternDiscoveryResult[] = [];
      if (this.config.enable_auto_discovery && await this.isPatternDiscoveryDue()) {
        discoveredPatterns = await this.runPatternDiscovery();
      }

      // Check and update experiment validations
      let validationUpdates: string[] = [];
      if (this.config.enable_auto_validation && await this.isValidationCheckDue()) {
        validationUpdates = await this.runValidationChecks();
      }

      // Update system status
      const systemStatus = await this.getSystemStatus();
      
      const totalTime = Date.now() - startTime;
      console.log(`Intelligence orchestration completed in ${totalTime}ms`);

      return {
        batch_processing: batchResult,
        pattern_discovery: discoveredPatterns,
        validation_updates: validationUpdates,
        system_status: systemStatus
      };
    } catch (error) {
      console.error('Error in intelligence orchestration:', error);
      throw error;
    }
  }

  /**
   * Process real-time feedback for immediate learning
   */
  async processRealtimeFeedback(
    userId: string,
    feedbackType: string,
    feedbackData: any,
    sessionId?: string
  ): Promise<{
    processing_result: ProcessingResult;
    profile_updated: boolean;
    insights_generated: LearningInsight[];
  }> {
    try {
      console.log(`Processing real-time feedback for user ${userId}`);

      // Process the feedback through the data processor
      await this.dataProcessor.processFeedbackForSystemImprovement(
        feedbackType as any,
        feedbackData,
        userId,
        sessionId
      );

      // Check if we should update user profile immediately
      let profileUpdated = false;
      if (this.shouldTriggerImmediateProfileUpdate(feedbackType, feedbackData)) {
        await this.profileService.refreshProfileFromBehavior(userId);
        profileUpdated = true;
      }

      // Generate immediate insights
      const insights = await this.profileService.getLearningInsights(userId);

      return {
        processing_result: { success: true },
        profile_updated: profileUpdated,
        insights_generated: insights.slice(0, 3) // Return top 3 insights
      };
    } catch (error) {
      console.error('Error processing real-time feedback:', error);
      return {
        processing_result: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        },
        profile_updated: false,
        insights_generated: []
      };
    }
  }

  /**
   * Initialize intelligence system for a new user
   */
  async initializeUserIntelligence(userId: string): Promise<UserIntelligenceProfile> {
    console.log(`Initializing intelligence system for user ${userId}`);
    
    try {
      // Initialize user profile
      const profile = await this.profileService.initializeProfile(userId);

      // Create initial feedback interaction for user onboarding
      await supabase
        .from('feedback_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'preference_update',
          feedback_data: {
            onboarding: true,
            initialization_timestamp: new Date().toISOString()
          },
          collection_method: 'automatic',
          learning_value: 0.1,
          processed: false
        });

      console.log(`Intelligence system initialized for user ${userId}`);
      return profile;
    } catch (error) {
      console.error('Error initializing user intelligence:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive intelligence summary for a user
   */
  async getUserIntelligenceSummary(userId: string): Promise<{
    profile: UserIntelligenceProfile;
    insights: LearningInsight[];
    active_patterns: any[];
    recommendations: string[];
    performance_metrics: any;
  }> {
    try {
      // Get user profile
      const profile = await this.profileService.getProfile(userId);

      // Get user insights
      const insights = await this.profileService.getLearningInsights(userId);

      // Get patterns that apply to this user
      const { data: activePatterns } = await supabase
        .from('discovered_patterns')
        .select('*')
        .eq('validation_status', 'validated')
        .or(`applies_to_users.cs.{${userId}},applies_to_users.eq.{}`)
        .order('confidence_score', { ascending: false })
        .limit(10);

      // Get behavior summary for recommendations
      const behaviorSummary = await this.profileService.getBehaviorSummary(userId, 30);

      // Generate recommendations
      const recommendations = this.generateUserRecommendations(profile, behaviorSummary, insights);

      return {
        profile,
        insights: insights.slice(0, 5),
        active_patterns: activePatterns || [],
        recommendations,
        performance_metrics: {
          contact_rate: behaviorSummary.contact_rate,
          efficiency_score: this.calculateEfficiencyScore(behaviorSummary),
          learning_progress: profile.learning_confidence,
          session_consistency: this.calculateSessionConsistency(behaviorSummary)
        }
      };
    } catch (error) {
      console.error('Error getting user intelligence summary:', error);
      throw error;
    }
  }

  /**
   * Start pattern validation for qualifying patterns
   */
  async startPatternValidations(): Promise<ValidationExperiment[]> {
    try {
      // Get patterns ready for validation
      const { data: candidatePatterns } = await supabase
        .from('discovered_patterns')
        .select('*')
        .eq('validation_status', 'discovered')
        .gte('confidence_score', 0.7)
        .gte('supporting_sessions', 10)
        .order('confidence_score', { ascending: false })
        .limit(3); // Validate max 3 patterns at once

      const startedExperiments: ValidationExperiment[] = [];

      for (const pattern of candidatePatterns || []) {
        try {
          const experiment = await this.validationSystem.startPatternValidation(pattern.id);
          startedExperiments.push(experiment);
          
          console.log(`Started validation for pattern: ${pattern.pattern_name}`);
        } catch (error) {
          console.error(`Failed to start validation for pattern ${pattern.id}:`, error);
        }
      }

      return startedExperiments;
    } catch (error) {
      console.error('Error starting pattern validations:', error);
      return [];
    }
  }

  /**
   * Get system health and status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      // Get last batch processing time
      const { data: lastBatch } = await supabase
        .from('feedback_interactions')
        .select('updated_at')
        .eq('processed', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Get last pattern discovery
      const { data: lastPattern } = await supabase
        .from('discovered_patterns')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get processing queue size
      const { count: queueSize } = await supabase
        .from('feedback_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      // Get active experiments
      const activeExperiments = await this.validationSystem.getActiveExperiments();

      // Determine system health
      const queueBacklog = queueSize || 0;
      const systemHealth: SystemStatus['system_health'] = 
        queueBacklog > 1000 ? 'error' :
        queueBacklog > 500 ? 'degraded' : 'healthy';

      return {
        last_batch_processing: lastBatch ? new Date(lastBatch.updated_at) : null,
        last_pattern_discovery: lastPattern ? new Date(lastPattern.created_at) : null,
        last_validation_check: new Date(), // Would track this separately in production
        processing_queue_size: queueBacklog,
        active_experiments: activeExperiments.length,
        system_health: systemHealth
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        last_batch_processing: null,
        last_pattern_discovery: null,
        last_validation_check: null,
        processing_queue_size: 0,
        active_experiments: 0,
        system_health: 'error'
      };
    }
  }

  // Private helper methods

  private async runBatchProcessing(): Promise<ProcessingResult> {
    try {
      return await this.dataProcessor.processBatch();
    } catch (error) {
      console.error('Error in batch processing:', error);
      return { success: false, message: 'Batch processing failed' };
    }
  }

  private async runPatternDiscovery(): Promise<PatternDiscoveryResult[]> {
    try {
      const patterns = await this.patternEngine.discoverPatterns();
      
      // Save discovered patterns
      for (const pattern of patterns) {
        await supabase
          .from('discovered_patterns')
          .insert({
            pattern_type: pattern.pattern_type,
            pattern_name: pattern.pattern_name,
            pattern_description: pattern.pattern_description,
            pattern_data: pattern.pattern_data,
            trigger_conditions: pattern.trigger_conditions,
            expected_outcome: pattern.expected_outcome,
            confidence_score: pattern.confidence_score,
            supporting_sessions: pattern.supporting_sessions,
            discovery_method: pattern.discovery_method,
            discovery_agent: 'intelligence_orchestrator',
            applies_to_users: pattern.applies_to_users || [],
            applies_to_industries: pattern.applies_to_industries || [],
            applies_to_roles: pattern.applies_to_roles || []
          });
      }

      return patterns;
    } catch (error) {
      console.error('Error in pattern discovery:', error);
      return [];
    }
  }

  private async runValidationChecks(): Promise<string[]> {
    try {
      const activeExperiments = await this.validationSystem.getActiveExperiments();
      const updates: string[] = [];

      for (const experiment of activeExperiments) {
        try {
          const result = await this.validationSystem.updateExperimentMetrics(experiment.id);
          updates.push(`Updated experiment ${experiment.id}: ${result.status}`);
        } catch (error) {
          console.error(`Error updating experiment ${experiment.id}:`, error);
        }
      }

      return updates;
    } catch (error) {
      console.error('Error in validation checks:', error);
      return [];
    }
  }

  private async isPatternDiscoveryDue(): Promise<boolean> {
    const { data: lastPattern } = await supabase
      .from('discovered_patterns')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastPattern) return true;

    const hoursSinceLastDiscovery = 
      (Date.now() - new Date(lastPattern.created_at).getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastDiscovery >= this.config.pattern_discovery_interval_hours;
  }

  private async isValidationCheckDue(): Promise<boolean> {
    // For simplicity, always return true - in production would track last check time
    return true;
  }

  private shouldTriggerImmediateProfileUpdate(feedbackType: string, feedbackData: any): boolean {
    return feedbackType === 'pattern_correction' || 
           feedbackType === 'outcome_report' ||
           (feedbackType === 'explicit_rating' && feedbackData.learning_value > 0.8);
  }

  private generateUserRecommendations(
    profile: UserIntelligenceProfile,
    behavior: any,
    insights: LearningInsight[]
  ): string[] {
    const recommendations: string[] = [];

    // Learning confidence recommendations
    if (profile.learning_confidence < 0.3) {
      recommendations.push('Complete more research sessions to help the system learn your preferences');
    }

    // Contact rate recommendations
    if (behavior.contact_rate < 0.2) {
      recommendations.push('Consider reviewing your successful contact patterns and adjusting search criteria');
    }

    // Industry focus recommendations
    if (profile.industry_focus.length === 0) {
      recommendations.push('Focus on specific industries to get more targeted recommendations');
    }

    // Activity recommendations
    if (profile.total_research_sessions < 20) {
      recommendations.push('Continue using the research features to unlock advanced insights');
    }

    // Timing recommendations
    if (behavior.most_active_hours.length > 0) {
      recommendations.push(`Your most productive research times are ${behavior.most_active_hours.join(', ')}:00`);
    }

    return recommendations.slice(0, 5);
  }

  private calculateEfficiencyScore(behavior: any): number {
    // Calculate efficiency based on contact rate and session metrics
    const contactRate = behavior.contact_rate || 0;
    const sessionConsistency = behavior.total_sessions > 0 ? 1 : 0;
    const feedbackEngagement = behavior.feedback_frequency || 0;
    
    return Math.min(1, (contactRate * 0.6 + sessionConsistency * 0.2 + feedbackEngagement * 0.2));
  }

  private calculateSessionConsistency(behavior: any): number {
    // Mock calculation - in production would analyze session timing patterns
    return behavior.total_sessions > 10 ? 0.8 : behavior.total_sessions / 10 * 0.8;
  }
}

export default IntelligenceOrchestrator;