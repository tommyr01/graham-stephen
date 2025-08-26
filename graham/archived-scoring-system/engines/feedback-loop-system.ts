/**
 * User Feedback Loop System Integration
 * Main orchestration service for the complete feedback loop feature
 */

import { EnhancedUserFeedback, FeedbackType } from './types';
import { learningPipeline } from './learning-pipeline';
import { preferenceAdaptation } from './preference-adaptation';
import { teamLearning } from './team-learning';
import { performanceOptimization } from './performance-optimization';
import { createEnhancedFeedback, createOrUpdateDataPrivacyControls } from './feedback-database';

/**
 * Main Feedback Loop System Service
 * Orchestrates all feedback loop components
 */
export class FeedbackLoopSystemService {
  private static instance: FeedbackLoopSystemService;

  private constructor() {}

  static getInstance(): FeedbackLoopSystemService {
    if (!FeedbackLoopSystemService.instance) {
      FeedbackLoopSystemService.instance = new FeedbackLoopSystemService();
    }
    return FeedbackLoopSystemService.instance;
  }

  /**
   * Initialize user for feedback loop system
   */
  async initializeUser(userId: string, teamId?: string): Promise<void> {
    try {
      // Create default privacy controls
      await createOrUpdateDataPrivacyControls(userId, {
        learningConsentGiven: true,
        teamSharingEnabled: true,
        outcomeTrackingEnabled: true,
        dataRetentionPreference: 365,
      });

      // Warm caches for better performance
      await performanceOptimization.warmCaches(userId, teamId);

      // Precompute user preferences
      await performanceOptimization.precomputeUserPreferences(userId);

    } catch (error) {
      console.error('Error initializing user for feedback loop:', error);
    }
  }

  /**
   * Process feedback with complete workflow
   */
  async processFeedbackComplete(
    userId: string,
    feedbackData: Partial<EnhancedUserFeedback>,
    options: {
      enableLearning?: boolean;
      enableTeamLearning?: boolean;
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<{
    feedback: EnhancedUserFeedback;
    learningTriggered: boolean;
    teamLearningTriggered: boolean;
    processingTime: number;
  }> {
    const startTime = Date.now();
    const { enableLearning = true, enableTeamLearning = true, priority = 'normal' } = options;

    try {
      // Create feedback record
      const feedback = await createEnhancedFeedback({
        userId,
        teamId: feedbackData.teamId,
        sessionId: feedbackData.sessionId,
        commenterId: feedbackData.commenterId,
        analysisId: feedbackData.analysisId,
        feedbackType: feedbackData.feedbackType || 'binary',
        overallRating: feedbackData.overallRating,
        isRelevant: feedbackData.isRelevant,
        confidenceScore: feedbackData.confidenceScore,
        factorRatings: feedbackData.factorRatings,
        correctionFlags: feedbackData.correctionFlags,
        feedbackText: feedbackData.feedbackText,
        improvementSuggestions: feedbackData.improvementSuggestions,
        outcomeData: feedbackData.outcomeData,
        successIndicators: feedbackData.successIndicators,
        analysisContext: feedbackData.analysisContext,
        userContext: feedbackData.userContext,
      });

      let learningTriggered = false;
      let teamLearningTriggered = false;

      // Process with performance optimization
      const processingResult = await performanceOptimization.processFeedbackOptimized(
        userId,
        feedback,
        { priority }
      );

      // Trigger individual learning if enabled and conditions met
      if (enableLearning && this.shouldTriggerLearning(feedback)) {
        learningPipeline.processIndividualLearning(userId, [feedback], {
          forceUpdate: priority === 'high',
        });
        learningTriggered = true;
      }

      // Trigger team learning if enabled and conditions met
      if (enableTeamLearning && feedbackData.teamId && this.shouldTriggerTeamLearning(feedback)) {
        this.triggerTeamLearning(feedbackData.teamId);
        teamLearningTriggered = true;
      }

      return {
        feedback,
        learningTriggered,
        teamLearningTriggered,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Error in complete feedback processing:', error);
      throw error;
    }
  }

  /**
   * Get personalized scoring with all adaptations
   */
  async getPersonalizedScoring(
    userId: string,
    originalScore: number,
    scoringFactors: any,
    analysisContext: any
  ): Promise<{
    adaptedScore: number;
    adaptationDetails: any;
    teamInfluence?: any;
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Get individual adaptation
      const individualAdaptation = await performanceOptimization.adaptScoringRealTime(
        userId,
        originalScore,
        scoringFactors,
        analysisContext
      );

      // Get team influence if applicable
      let teamInfluence;
      const userProfile = await preferenceAdaptation.getUserPreferencesWithCache?.(userId);
      if (userProfile?.teamId) {
        // This would integrate team learning influences
        teamInfluence = await this.getTeamScoringInfluence(userProfile.teamId, scoringFactors);
      }

      return {
        adaptedScore: individualAdaptation.adaptedScore,
        adaptationDetails: {
          individual: {
            adjustment: individualAdaptation.adaptedScore - originalScore,
            reasons: individualAdaptation.adaptationReason,
            confidence: 0.8, // Placeholder
          },
          team: teamInfluence,
        },
        teamInfluence,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Error in personalized scoring:', error);
      return {
        adaptedScore: originalScore,
        adaptationDetails: { error: error instanceof Error ? error.message : 'Unknown error' },
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get comprehensive user learning status
   */
  async getUserLearningStatus(userId: string): Promise<{
    learningReadiness: any;
    accuracyMetrics: any;
    teamStatus?: any;
    recommendations: string[];
  }> {
    try {
      // Get prediction accuracy
      const accuracyMetrics = await preferenceAdaptation.getPredictionAccuracy(userId);

      // Get preference evolution
      const evolution = await preferenceAdaptation.analyzePreferenceEvolution(userId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });

      // Get team status if applicable
      let teamStatus;
      const userProfile = await preferenceAdaptation.getUserPreferencesWithCache?.(userId);
      if (userProfile?.teamId) {
        teamStatus = await teamLearning.calculateCollaborationEffectiveness(userProfile.teamId);
      }

      // Generate recommendations
      const recommendations = this.generateLearningRecommendations({
        accuracy: accuracyMetrics,
        evolution,
        teamStatus,
      });

      return {
        learningReadiness: {
          ready: accuracyMetrics.overallAccuracy < 80 || evolution.trendAnalysis.stabilityScore < 70,
          confidence: evolution.trendAnalysis.preferenceMaturity / 100,
          nextUpdate: this.estimateNextUpdate(evolution),
        },
        accuracyMetrics,
        teamStatus,
        recommendations,
      };

    } catch (error) {
      console.error('Error getting user learning status:', error);
      return {
        learningReadiness: { ready: false, confidence: 0 },
        accuracyMetrics: { overallAccuracy: 0 },
        recommendations: ['Error retrieving learning status'],
      };
    }
  }

  // Private helper methods

  private shouldTriggerLearning(feedback: EnhancedUserFeedback): boolean {
    // Trigger learning for detailed feedback or after every 5th feedback
    return feedback.feedbackType === 'detailed' || 
           feedback.feedbackType === 'outcome' ||
           Math.random() < 0.2; // 20% chance for other feedback types
  }

  private shouldTriggerTeamLearning(feedback: EnhancedUserFeedback): boolean {
    // Trigger team learning less frequently
    return feedback.feedbackType === 'detailed' && Math.random() < 0.1; // 10% chance
  }

  private async triggerTeamLearning(teamId: string): Promise<void> {
    // Asynchronously trigger team learning
    setTimeout(async () => {
      try {
        await teamLearning.aggregateTeamLearning(teamId);
      } catch (error) {
        console.error('Error in team learning aggregation:', error);
      }
    }, 1000);
  }

  private async getTeamScoringInfluence(teamId: string, scoringFactors: any): Promise<any> {
    try {
      const teamProfile = await teamLearning.getTeamLearningProfile?.(teamId);
      if (!teamProfile) return null;

      // Calculate team influence on scoring
      return {
        industryBias: this.calculateTeamIndustryBias(teamProfile, scoringFactors),
        consensusAdjustment: this.calculateConsensusAdjustment(teamProfile),
        diversityBonus: this.calculateDiversityBonus(teamProfile),
      };
    } catch (error) {
      console.error('Error getting team scoring influence:', error);
      return null;
    }
  }

  private calculateTeamIndustryBias(teamProfile: any, scoringFactors: any): number {
    // Placeholder implementation
    return 0;
  }

  private calculateConsensusAdjustment(teamProfile: any): number {
    // Placeholder implementation
    return 0;
  }

  private calculateDiversityBonus(teamProfile: any): number {
    // Placeholder implementation
    return 0;
  }

  private generateLearningRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    if (data.accuracy.overallAccuracy < 70) {
      recommendations.push('Continue providing feedback to improve accuracy');
    }

    if (data.evolution.trendAnalysis.stabilityScore < 60) {
      recommendations.push('Preferences are still evolving - maintain consistent feedback');
    }

    if (data.teamStatus && data.teamStatus.overallScore < 60) {
      recommendations.push('Consider more active team collaboration');
    }

    if (recommendations.length === 0) {
      recommendations.push('Learning system is performing well - maintain current feedback patterns');
    }

    return recommendations;
  }

  private estimateNextUpdate(evolution: any): string {
    // Estimate when next learning update should occur
    const velocity = evolution.trendAnalysis.learningVelocity || 0;
    
    if (velocity > 2) {
      return 'within 1-2 days'; // High velocity
    } else if (velocity > 0.5) {
      return 'within 1 week'; // Medium velocity
    } else {
      return 'within 2-4 weeks'; // Low velocity
    }
  }
}

// Export singleton instance and convenience functions
export const feedbackLoopSystem = FeedbackLoopSystemService.getInstance();

// Convenience functions for easy integration
export async function initializeUserFeedbackLoop(userId: string, teamId?: string): Promise<void> {
  return feedbackLoopSystem.initializeUser(userId, teamId);
}

export async function submitFeedbackComplete(
  userId: string,
  feedbackData: Partial<EnhancedUserFeedback>,
  options?: any
): Promise<any> {
  return feedbackLoopSystem.processFeedbackComplete(userId, feedbackData, options);
}

export async function getPersonalizedScore(
  userId: string,
  originalScore: number,
  scoringFactors: any,
  analysisContext: any
): Promise<any> {
  return feedbackLoopSystem.getPersonalizedScoring(userId, originalScore, scoringFactors, analysisContext);
}

export async function getUserLearningInsights(userId: string): Promise<any> {
  return feedbackLoopSystem.getUserLearningStatus(userId);
}