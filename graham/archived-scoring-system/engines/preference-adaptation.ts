import { 
  UserPreferenceProfile,
  EnhancedUserFeedback,
  RelevanceScore,
  AnalysisSnapshot 
} from './types';
import {
  getUserPreferenceProfile,
  createOrUpdateUserPreferences,
  createAnalysisSnapshot,
  getCachedFeedbackData,
  setCachedFeedbackData
} from './feedback-database';
import { learningPipeline } from './learning-pipeline';

/**
 * User Preference Tracking and Adaptation Service
 * Handles real-time preference learning and scoring adaptation
 */
export class PreferenceAdaptationService {
  private static instance: PreferenceAdaptationService;
  private adaptationCache: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): PreferenceAdaptationService {
    if (!PreferenceAdaptationService.instance) {
      PreferenceAdaptationService.instance = new PreferenceAdaptationService();
    }
    return PreferenceAdaptationService.instance;
  }

  /**
   * Adapt relevance scoring based on user preferences
   */
  async adaptRelevanceScore(
    userId: string,
    originalScore: number,
    scoringFactors: any,
    analysisContext: {
      commenterData?: any;
      contentAnalysis?: any;
      profileAnalysis?: any;
      boostTerms?: string[];
      downTerms?: string[];
    }
  ): Promise<{
    adaptedScore: number;
    personalizedFactors: any;
    adaptationReason: string[];
    confidence: number;
  }> {
    try {
      // Get user preferences
      const userProfile = await this.getUserPreferencesWithCache(userId);
      
      if (!userProfile || userProfile.learningConfidence < 0.1) {
        // Not enough learning data, return original score
        return {
          adaptedScore: originalScore,
          personalizedFactors: scoringFactors,
          adaptationReason: ['Insufficient learning data for personalization'],
          confidence: 0.1,
        };
      }

      // Apply preference-based adaptations
      const adaptations = await this.calculateAdaptations(
        userProfile,
        originalScore,
        scoringFactors,
        analysisContext
      );

      // Calculate final adapted score
      const adaptedScore = this.applyAdaptations(originalScore, adaptations);

      return {
        adaptedScore: Math.max(0, Math.min(10, adaptedScore)),
        personalizedFactors: this.updateScoringFactors(scoringFactors, adaptations),
        adaptationReason: adaptations.reasons,
        confidence: userProfile.learningConfidence,
      };

    } catch (error) {
      console.error('Error adapting relevance score:', error);
      return {
        adaptedScore: originalScore,
        personalizedFactors: scoringFactors,
        adaptationReason: ['Error in adaptation process'],
        confidence: 0,
      };
    }
  }

  /**
   * Track implicit feedback signals for continuous learning
   */
  async trackImplicitFeedback(
    userId: string,
    interactionData: {
      commenterId: string;
      sessionId: string;
      analysisId: string;
      timeSpent: number; // seconds
      actions: string[]; // ['viewed_profile', 'exported_data', 'added_to_list']
      scrollDepth: number; // 0-1
      clickedFactors?: string[];
      revisited?: boolean;
    }
  ): Promise<void> {
    try {
      // Calculate implicit feedback score based on engagement
      const implicitScore = this.calculateImplicitScore(interactionData);
      
      if (implicitScore.isSignificant) {
        // Create implicit feedback record
        const { createEnhancedFeedback } = await import('./feedback-database');
        
        await createEnhancedFeedback({
          userId,
          sessionId: interactionData.sessionId,
          commenterId: interactionData.commenterId,
          analysisId: interactionData.analysisId,
          feedbackType: 'implicit',
          confidenceScore: implicitScore.confidence,
          isRelevant: implicitScore.isPositive,
          learningWeight: implicitScore.weight,
          userContext: {
            interactionData,
            calculatedScore: implicitScore,
          },
        });

        // Update user preferences incrementally if this is a strong signal
        if (implicitScore.confidence > 0.7) {
          await this.incrementalPreferenceUpdate(userId, interactionData, implicitScore);
        }
      }

    } catch (error) {
      console.error('Error tracking implicit feedback:', error);
    }
  }

  /**
   * Provide real-time scoring recommendations based on user preferences
   */
  async getPersonalizedScoringRecommendations(
    userId: string,
    prospectData: {
      industry?: string;
      role?: string;
      company?: string;
      contentTopics?: string[];
      seniority?: string;
      experience?: number;
    }
  ): Promise<{
    recommendedScore: number;
    reasoning: string[];
    confidence: number;
    alternatives: Array<{
      score: number;
      scenario: string;
      probability: number;
    }>;
  }> {
    const userProfile = await this.getUserPreferencesWithCache(userId);
    
    if (!userProfile) {
      return {
        recommendedScore: 5,
        reasoning: ['No personalization data available'],
        confidence: 0,
        alternatives: [],
      };
    }

    const recommendations = await this.calculatePersonalizedRecommendations(
      userProfile,
      prospectData
    );

    return recommendations;
  }

  /**
   * Analyze user feedback patterns to detect preference changes
   */
  async analyzePreferenceEvolution(
    userId: string,
    timeframe: {
      startDate: string;
      endDate: string;
    }
  ): Promise<{
    significantChanges: Array<{
      factor: string;
      oldValue: number;
      newValue: number;
      changeSignificance: number;
      detectedAt: string;
    }>;
    trendAnalysis: {
      stabilityScore: number;
      learningVelocity: number;
      preferenceMaturity: number;
    };
    recommendations: string[];
  }> {
    const userProfile = await getUserPreferenceProfile(userId);
    const { getEnhancedFeedbackByUser } = await import('./feedback-database');
    
    const feedbackHistory = await getEnhancedFeedbackByUser(userId, {
      limit: 1000,
    });

    const filteredFeedback = feedbackHistory.filter(fb => {
      const feedbackDate = new Date(fb.submittedAt);
      return feedbackDate >= new Date(timeframe.startDate) &&
             feedbackDate <= new Date(timeframe.endDate);
    });

    const evolution = await this.analyzePreferenceChanges(
      userProfile,
      filteredFeedback
    );

    return evolution;
  }

  /**
   * Preload user preferences into cache for faster adaptation
   */
  async preloadUserPreferences(userId: string): Promise<void> {
    const cacheKey = `user_preferences_${userId}`;
    
    // Check if already cached
    const cached = await getCachedFeedbackData(cacheKey);
    if (cached) {
      this.adaptationCache.set(userId, cached);
      return;
    }

    // Load from database
    const userProfile = await getUserPreferenceProfile(userId);
    if (userProfile) {
      // Cache for 1 hour
      await setCachedFeedbackData(cacheKey, userProfile, 'user_preferences', 60);
      this.adaptationCache.set(userId, userProfile);
    }
  }

  /**
   * Get prediction accuracy for user's personalized scores
   */
  async getPredictionAccuracy(
    userId: string,
    validationSet?: EnhancedUserFeedback[]
  ): Promise<{
    overallAccuracy: number;
    accuracyByFactor: { [factor: string]: number };
    confidenceCalibration: number;
    recommendedActions: string[];
  }> {
    const userProfile = await this.getUserPreferencesWithCache(userId);
    const { getEnhancedFeedbackByUser } = await import('./feedback-database');
    
    const testFeedback = validationSet || await getEnhancedFeedbackByUser(userId, {
      feedbackStatus: 'processed',
      limit: 100,
    });

    const accuracyMetrics = await this.calculatePredictionAccuracy(
      userProfile,
      testFeedback
    );

    return accuracyMetrics;
  }

  // Private helper methods

  private async getUserPreferencesWithCache(userId: string): Promise<UserPreferenceProfile | null> {
    // Check memory cache first
    if (this.adaptationCache.has(userId)) {
      const cached = this.adaptationCache.get(userId);
      // Check if cache is still valid (5 minutes)
      if (cached.cachedAt && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
        return cached.profile;
      }
    }

    // Check distributed cache
    const cacheKey = `user_preferences_${userId}`;
    const cachedProfile = await getCachedFeedbackData(cacheKey);
    
    if (cachedProfile) {
      this.adaptationCache.set(userId, {
        profile: cachedProfile,
        cachedAt: Date.now(),
      });
      return cachedProfile;
    }

    // Load from database
    const userProfile = await getUserPreferenceProfile(userId);
    if (userProfile) {
      // Cache for 1 hour
      await setCachedFeedbackData(cacheKey, userProfile, 'user_preferences', 60);
      this.adaptationCache.set(userId, {
        profile: userProfile,
        cachedAt: Date.now(),
      });
    }

    return userProfile;
  }

  private async calculateAdaptations(
    userProfile: UserPreferenceProfile,
    originalScore: number,
    scoringFactors: any,
    analysisContext: any
  ): Promise<{
    industryAdjustment: number;
    roleAdjustment: number;
    contentAdjustment: number;
    patternAdjustment: number;
    reasons: string[];
    confidence: number;
  }> {
    const adaptations = {
      industryAdjustment: 0,
      roleAdjustment: 0,
      contentAdjustment: 0,
      patternAdjustment: 0,
      reasons: [] as string[],
      confidence: userProfile.learningConfidence,
    };

    // Industry-based adjustments
    if (analysisContext.commenterData?.industry && userProfile.industryWeights) {
      const industry = analysisContext.commenterData.industry;
      const industryPref = userProfile.industryWeights[industry];
      
      if (industryPref && industryPref.sampleSize >= 3) {
        const adjustment = (industryPref.weight - 0.5) * 2; // Convert 0-1 to -1 to 1
        adaptations.industryAdjustment = adjustment * industryPref.confidence;
        adaptations.reasons.push(`Industry preference (${industry}): ${adjustment > 0 ? 'positive' : 'negative'} bias`);
      }
    }

    // Role-based adjustments
    if (analysisContext.commenterData?.role && userProfile.rolePreferences) {
      const role = analysisContext.commenterData.role;
      const rolePref = userProfile.rolePreferences[role];
      
      if (rolePref && rolePref.totalSamples >= 3) {
        const adjustment = (rolePref.positiveRate - 0.5) * 2; // Convert to -1 to 1
        adaptations.roleAdjustment = adjustment * Math.min(1, rolePref.totalSamples / 10);
        adaptations.reasons.push(`Role preference (${role}): ${adjustment > 0 ? 'positive' : 'negative'} history`);
      }
    }

    // Content-based adjustments
    if (analysisContext.contentAnalysis?.topics && userProfile.contentPreferences) {
      let contentAdjustment = 0;
      let matchingTopics = 0;

      analysisContext.contentAnalysis.topics.forEach((topic: string) => {
        const topicPref = userProfile.contentPreferences[topic];
        if (topicPref !== undefined) {
          contentAdjustment += topicPref;
          matchingTopics++;
        }
      });

      if (matchingTopics > 0) {
        adaptations.contentAdjustment = contentAdjustment / matchingTopics;
        adaptations.reasons.push(`Content preferences: ${adaptations.contentAdjustment > 0 ? 'positive' : 'negative'} match`);
      }
    }

    // Success pattern adjustments
    if (userProfile.successPatterns.keyIndicators) {
      const patternMatches = this.countPatternMatches(
        userProfile.successPatterns.keyIndicators,
        analysisContext
      );
      
      if (patternMatches > 0) {
        adaptations.patternAdjustment = Math.min(1, patternMatches * 0.3);
        adaptations.reasons.push(`Success patterns: ${patternMatches} positive indicators found`);
      }
    }

    // Failure pattern penalties
    if (userProfile.failurePatterns.warningSignals) {
      const warningMatches = this.countPatternMatches(
        userProfile.failurePatterns.warningSignals,
        analysisContext
      );
      
      if (warningMatches > 0) {
        adaptations.patternAdjustment -= Math.min(1, warningMatches * 0.5);
        adaptations.reasons.push(`Warning patterns: ${warningMatches} negative indicators found`);
      }
    }

    return adaptations;
  }

  private countPatternMatches(patterns: string[], analysisContext: any): number {
    let matches = 0;
    
    patterns.forEach(pattern => {
      // Simple pattern matching - in production this would be more sophisticated
      if (analysisContext.commenterData?.industry?.toLowerCase().includes(pattern.toLowerCase()) ||
          analysisContext.commenterData?.role?.toLowerCase().includes(pattern.toLowerCase()) ||
          analysisContext.contentAnalysis?.topics?.some((topic: string) => 
            topic.toLowerCase().includes(pattern.toLowerCase())
          )) {
        matches++;
      }
    });

    return matches;
  }

  private applyAdaptations(originalScore: number, adaptations: any): number {
    const totalAdjustment = 
      adaptations.industryAdjustment +
      adaptations.roleAdjustment +
      adaptations.contentAdjustment +
      adaptations.patternAdjustment;

    // Apply adjustment with confidence weighting
    const weightedAdjustment = totalAdjustment * adaptations.confidence;
    
    // Scale adjustment to be reasonable (max ±3 points)
    const scaledAdjustment = Math.max(-3, Math.min(3, weightedAdjustment * 3));
    
    return originalScore + scaledAdjustment;
  }

  private updateScoringFactors(originalFactors: any, adaptations: any): any {
    const updatedFactors = { ...originalFactors };

    // Update factor contributions based on adaptations
    if (adaptations.industryAdjustment !== 0) {
      updatedFactors.industry = {
        ...updatedFactors.industry,
        personalizedWeight: (updatedFactors.industry?.weight || 1) + adaptations.industryAdjustment,
        adaptationReason: 'User industry preference',
      };
    }

    if (adaptations.roleAdjustment !== 0) {
      updatedFactors.role = {
        ...updatedFactors.role,
        personalizedWeight: (updatedFactors.role?.weight || 1) + adaptations.roleAdjustment,
        adaptationReason: 'User role preference',
      };
    }

    if (adaptations.contentAdjustment !== 0) {
      updatedFactors.content = {
        ...updatedFactors.content,
        personalizedWeight: (updatedFactors.content?.weight || 1) + adaptations.contentAdjustment,
        adaptationReason: 'User content preference',
      };
    }

    return updatedFactors;
  }

  private calculateImplicitScore(interactionData: any): {
    isSignificant: boolean;
    isPositive: boolean;
    confidence: number;
    weight: number;
  } {
    let score = 0;
    let signals = 0;

    // Time spent signal (positive if > 30 seconds)
    if (interactionData.timeSpent > 30) {
      score += Math.min(1, interactionData.timeSpent / 120); // Max benefit at 2 minutes
      signals++;
    } else if (interactionData.timeSpent < 5) {
      score -= 0.5; // Penalty for very short time
      signals++;
    }

    // Action signals
    const positiveActions = ['viewed_profile', 'exported_data', 'added_to_list', 'contacted'];
    const negativeActions = ['closed_immediately', 'skipped'];

    interactionData.actions.forEach((action: string) => {
      if (positiveActions.includes(action)) {
        score += 0.3;
        signals++;
      } else if (negativeActions.includes(action)) {
        score -= 0.3;
        signals++;
      }
    });

    // Scroll depth signal
    if (interactionData.scrollDepth > 0.8) {
      score += 0.2;
      signals++;
    } else if (interactionData.scrollDepth < 0.2) {
      score -= 0.2;
      signals++;
    }

    // Revisited signal (strong positive)
    if (interactionData.revisited) {
      score += 0.5;
      signals++;
    }

    const avgScore = signals > 0 ? score / signals : 0;
    const confidence = Math.min(1, signals / 5); // Confidence increases with more signals

    return {
      isSignificant: Math.abs(avgScore) > 0.2 && confidence > 0.3,
      isPositive: avgScore > 0,
      confidence,
      weight: Math.abs(avgScore),
    };
  }

  private async incrementalPreferenceUpdate(
    userId: string,
    interactionData: any,
    implicitScore: any
  ): Promise<void> {
    // For strong implicit signals, update preferences incrementally
    // This is a simplified version - production would be more sophisticated
    
    const userProfile = await this.getUserPreferencesWithCache(userId);
    if (!userProfile) return;

    const updates: Partial<UserPreferenceProfile> = {};
    let hasUpdates = false;

    // Update content preferences based on interaction
    if (interactionData.clickedFactors) {
      const contentPrefs = { ...userProfile.contentPreferences };
      
      interactionData.clickedFactors.forEach((factor: string) => {
        const currentPref = contentPrefs[factor] || 0;
        const adjustment = implicitScore.isPositive ? 0.1 : -0.1;
        contentPrefs[factor] = Math.max(-1, Math.min(1, currentPref + adjustment));
      });

      updates.contentPreferences = contentPrefs;
      hasUpdates = true;
    }

    if (hasUpdates) {
      await createOrUpdateUserPreferences(userId, userProfile.teamId, updates);
      // Invalidate cache
      this.adaptationCache.delete(userId);
    }
  }

  private async calculatePersonalizedRecommendations(
    userProfile: UserPreferenceProfile,
    prospectData: any
  ): Promise<any> {
    const recommendations = {
      recommendedScore: 5,
      reasoning: [] as string[],
      confidence: userProfile.learningConfidence,
      alternatives: [] as any[],
    };

    let adjustments = 0;
    let factorCount = 0;

    // Industry-based recommendation
    if (prospectData.industry && userProfile.industryWeights[prospectData.industry]) {
      const industryPref = userProfile.industryWeights[prospectData.industry];
      const adjustment = (industryPref.weight - 0.5) * 2;
      adjustments += adjustment * industryPref.confidence;
      factorCount++;
      
      recommendations.reasoning.push(
        `Industry (${prospectData.industry}): ${adjustment > 0 ? 'Favorable' : 'Unfavorable'} based on ${industryPref.sampleSize} past interactions`
      );
    }

    // Role-based recommendation
    if (prospectData.role && userProfile.rolePreferences[prospectData.role]) {
      const rolePref = userProfile.rolePreferences[prospectData.role];
      const adjustment = (rolePref.positiveRate - 0.5) * 2;
      adjustments += adjustment * Math.min(1, rolePref.totalSamples / 10);
      factorCount++;

      recommendations.reasoning.push(
        `Role (${prospectData.role}): ${rolePref.positiveRate * 100}% positive rate from ${rolePref.totalSamples} samples`
      );
    }

    // Apply adjustments
    const avgAdjustment = factorCount > 0 ? adjustments / factorCount : 0;
    recommendations.recommendedScore = Math.max(1, Math.min(10, 5 + avgAdjustment * 3));

    // Generate alternative scenarios
    if (userProfile.successPatterns.optimalScoreRange) {
      const [minOptimal, maxOptimal] = userProfile.successPatterns.optimalScoreRange;
      
      recommendations.alternatives = [
        {
          score: minOptimal,
          scenario: 'Conservative estimate based on your success patterns',
          probability: 0.7,
        },
        {
          score: maxOptimal,
          scenario: 'Optimistic estimate if all factors align',
          probability: 0.3,
        },
      ];
    }

    return recommendations;
  }

  private async analyzePreferenceChanges(
    userProfile: UserPreferenceProfile | null,
    feedbackHistory: EnhancedUserFeedback[]
  ): Promise<any> {
    const analysis = {
      significantChanges: [] as any[],
      trendAnalysis: {
        stabilityScore: 0,
        learningVelocity: 0,
        preferenceMaturity: 0,
      },
      recommendations: [] as string[],
    };

    if (!userProfile || feedbackHistory.length < 10) {
      analysis.recommendations.push('Need more feedback data to analyze preference evolution');
      return analysis;
    }

    // Analyze accuracy trend stability
    if (userProfile.accuracyTrend.length >= 5) {
      const recentTrend = userProfile.accuracyTrend.slice(-5);
      const variance = this.calculateVariance(recentTrend.map(t => t.accuracy));
      analysis.trendAnalysis.stabilityScore = Math.max(0, 100 - variance);
    }

    // Calculate learning velocity (how quickly preferences are changing)
    const recentFeedback = feedbackHistory.slice(0, 20);
    const olderFeedback = feedbackHistory.slice(-20);
    
    if (recentFeedback.length > 5 && olderFeedback.length > 5) {
      const recentRatings = recentFeedback
        .filter(fb => fb.overallRating)
        .map(fb => fb.overallRating!);
      const olderRatings = olderFeedback
        .filter(fb => fb.overallRating)
        .map(fb => fb.overallRating!);

      if (recentRatings.length > 0 && olderRatings.length > 0) {
        const recentAvg = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
        const olderAvg = olderRatings.reduce((a, b) => a + b, 0) / olderRatings.length;
        
        analysis.trendAnalysis.learningVelocity = Math.abs(recentAvg - olderAvg);
      }
    }

    // Preference maturity (stability of preferences over time)
    analysis.trendAnalysis.preferenceMaturity = Math.min(100, 
      userProfile.totalFeedbackCount * 2 + userProfile.learningConfidence * 30
    );

    // Generate recommendations
    if (analysis.trendAnalysis.stabilityScore < 60) {
      analysis.recommendations.push('Preferences are still evolving - continue providing feedback for better accuracy');
    }

    if (analysis.trendAnalysis.learningVelocity > 2) {
      analysis.recommendations.push('Recent feedback shows changing preferences - algorithm will adapt accordingly');
    }

    if (analysis.trendAnalysis.preferenceMaturity > 80) {
      analysis.recommendations.push('Preferences are well-established - algorithm should be quite accurate');
    }

    return analysis;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private async calculatePredictionAccuracy(
    userProfile: UserPreferenceProfile | null,
    testFeedback: EnhancedUserFeedback[]
  ): Promise<any> {
    if (!userProfile || testFeedback.length === 0) {
      return {
        overallAccuracy: 0,
        accuracyByFactor: {},
        confidenceCalibration: 0,
        recommendedActions: ['Need more feedback data for accuracy calculation'],
      };
    }

    let correctPredictions = 0;
    const factorAccuracy: { [factor: string]: { correct: number; total: number } } = {};

    testFeedback.forEach(feedback => {
      const originalScore = feedback.analysisContext?.originalScore || 0;
      const userRating = feedback.overallRating || (feedback.isRelevant ? 8 : 3);
      
      // Consider prediction accurate if within 2 points
      const isAccurate = Math.abs(originalScore - userRating) <= 2;
      if (isAccurate) correctPredictions++;

      // Track accuracy by factor
      if (feedback.analysisContext?.scoringFactors) {
        Object.keys(feedback.analysisContext.scoringFactors).forEach(factor => {
          if (!factorAccuracy[factor]) {
            factorAccuracy[factor] = { correct: 0, total: 0 };
          }
          factorAccuracy[factor].total++;
          if (isAccurate) {
            factorAccuracy[factor].correct++;
          }
        });
      }
    });

    const overallAccuracy = (correctPredictions / testFeedback.length) * 100;
    
    const accuracyByFactor: { [factor: string]: number } = {};
    Object.entries(factorAccuracy).forEach(([factor, data]) => {
      accuracyByFactor[factor] = (data.correct / data.total) * 100;
    });

    // Calculate confidence calibration (how well confidence scores match actual accuracy)
    const highConfidenceFeedback = testFeedback.filter(fb => 
      (fb.confidenceScore || 0) > 0.7
    );
    const highConfidenceAccuracy = highConfidenceFeedback.length > 0 
      ? highConfidenceFeedback.filter(fb => {
          const originalScore = fb.analysisContext?.originalScore || 0;
          const userRating = fb.overallRating || (fb.isRelevant ? 8 : 3);
          return Math.abs(originalScore - userRating) <= 2;
        }).length / highConfidenceFeedback.length * 100
      : 0;

    const confidenceCalibration = Math.abs(highConfidenceAccuracy - 70); // 70% expected for high confidence

    // Generate recommendations
    const recommendedActions = [];
    if (overallAccuracy < 70) {
      recommendedActions.push('Continue providing feedback to improve prediction accuracy');
    }
    if (confidenceCalibration > 20) {
      recommendedActions.push('Confidence scores need calibration - review feedback patterns');
    }
    
    const worstFactor = Object.entries(accuracyByFactor)
      .sort(([, a], [, b]) => a - b)[0];
    if (worstFactor && worstFactor[1] < 60) {
      recommendedActions.push(`Focus on improving ${worstFactor[0]} predictions`);
    }

    return {
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      accuracyByFactor,
      confidenceCalibration: Math.round(confidenceCalibration * 100) / 100,
      recommendedActions,
    };
  }
}

// Export singleton instance
export const preferenceAdaptation = PreferenceAdaptationService.getInstance();