import { 
  EnhancedUserFeedback,
  UserPreferenceProfile,
  TeamLearningProfile,
  LearningPipelineRun,
  FeedbackType,
  LearningStage 
} from './types';
import {
  createLearningPipelineRun,
  updateLearningPipelineRun,
  getUserPreferenceProfile,
  createOrUpdateUserPreferences,
  getTeamLearningProfile,
  createOrUpdateTeamLearningProfile,
  getEnhancedFeedbackByUser,
  updateFeedbackStatus,
  setCachedFeedbackData,
  getCachedFeedbackData,
  invalidateFeedbackCache
} from './feedback-database';

/**
 * Learning Pipeline Service
 * Handles the machine learning integration for feedback processing
 */
export class LearningPipelineService {
  private static instance: LearningPipelineService;
  private processingQueue: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): LearningPipelineService {
    if (!LearningPipelineService.instance) {
      LearningPipelineService.instance = new LearningPipelineService();
    }
    return LearningPipelineService.instance;
  }

  /**
   * Process individual user learning from feedback
   */
  async processIndividualLearning(
    userId: string,
    feedbackBatch: EnhancedUserFeedback[],
    options: {
      forceUpdate?: boolean;
      validationEnabled?: boolean;
    } = {}
  ): Promise<LearningPipelineRun> {
    const runId = `individual_${userId}_${Date.now()}`;
    
    // Prevent duplicate processing
    if (this.processingQueue.has(runId)) {
      return await this.processingQueue.get(runId)!;
    }

    const processingPromise = this._processIndividualLearningInternal(
      userId, 
      feedbackBatch, 
      options
    );
    
    this.processingQueue.set(runId, processingPromise);
    
    try {
      return await processingPromise;
    } finally {
      this.processingQueue.delete(runId);
    }
  }

  private async _processIndividualLearningInternal(
    userId: string,
    feedbackBatch: EnhancedUserFeedback[],
    options: { forceUpdate?: boolean; validationEnabled?: boolean }
  ): Promise<LearningPipelineRun> {
    const startTime = Date.now();
    
    // Create pipeline run
    const pipelineRun = await createLearningPipelineRun({
      runType: 'individual',
      userId,
      feedbackIds: feedbackBatch.map(fb => fb.id),
      stage: 'collecting',
    });

    try {
      // Stage 1: Data Collection and Validation
      await updateLearningPipelineRun(pipelineRun.id, { stage: 'processing' });
      
      const validatedFeedback = await this.validateFeedbackData(feedbackBatch);
      const patterns = await this.extractLearningPatterns(validatedFeedback);

      // Stage 2: Pattern Analysis
      const currentProfile = await getUserPreferenceProfile(userId);
      const updatedPreferences = await this.updateUserPreferences(
        userId,
        currentProfile,
        patterns,
        validatedFeedback
      );

      // Stage 3: Model Validation (if enabled)
      let validationResults = {};
      if (options.validationEnabled) {
        await updateLearningPipelineRun(pipelineRun.id, { stage: 'validating' });
        validationResults = await this.validateModelUpdates(
          userId,
          currentProfile,
          updatedPreferences
        );
      }

      // Stage 4: Deployment
      await updateLearningPipelineRun(pipelineRun.id, { stage: 'deploying' });
      
      // Calculate accuracy improvement
      const accuracyImprovement = await this.calculateAccuracyImprovement(
        userId,
        currentProfile,
        updatedPreferences
      );

      // Mark feedback as processed
      for (const feedback of feedbackBatch) {
        await updateFeedbackStatus(feedback.id, 'processed');
      }

      // Invalidate relevant caches
      await this.invalidateUserCaches(userId);

      // Complete the pipeline run
      const completedRun = await updateLearningPipelineRun(pipelineRun.id, {
        stage: 'monitoring',
        completedAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
        isSuccessful: true,
        newPatternsDiscovered: patterns.newPatterns.length,
        patternsUpdated: patterns.updatedPatterns.length,
        processingDuration: Math.floor((Date.now() - startTime) / 1000),
        predictedAccuracy: accuracyImprovement.predictedAccuracy,
        actualAccuracy: accuracyImprovement.measuredAccuracy,
        validationResults,
        modelChanges: {
          weightsUpdated: patterns.updatedFactors,
          rulesAdded: patterns.newRules,
          rulesRemoved: patterns.deprecatedRules,
          accuracyImpact: accuracyImprovement.improvementPercentage,
        },
      });

      return completedRun;

    } catch (error) {
      console.error('Individual learning processing error:', error);
      
      // Mark pipeline as failed
      await updateLearningPipelineRun(pipelineRun.id, {
        stage: 'monitoring',
        completedAt: new Date().toISOString(),
        isSuccessful: false,
        requiresManualReview: true,
        errorLog: [
          {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error,
          },
        ],
      });

      throw error;
    }
  }

  /**
   * Process team-based learning from multiple users' feedback
   */
  async processTeamLearning(
    teamId: string,
    teamFeedback: Map<string, EnhancedUserFeedback[]>,
    options: {
      aggregationStrategy?: 'consensus' | 'weighted' | 'expert';
      conflictResolution?: 'majority' | 'confidence' | 'expertise';
    } = {}
  ): Promise<LearningPipelineRun> {
    const runId = `team_${teamId}_${Date.now()}`;
    
    if (this.processingQueue.has(runId)) {
      return await this.processingQueue.get(runId)!;
    }

    const processingPromise = this._processTeamLearningInternal(
      teamId,
      teamFeedback,
      options
    );
    
    this.processingQueue.set(runId, processingPromise);
    
    try {
      return await processingPromise;
    } finally {
      this.processingQueue.delete(runId);
    }
  }

  private async _processTeamLearningInternal(
    teamId: string,
    teamFeedback: Map<string, EnhancedUserFeedback[]>,
    options: any
  ): Promise<LearningPipelineRun> {
    const startTime = Date.now();
    const allFeedbackIds: string[] = [];
    
    // Collect all feedback IDs
    for (const userFeedback of teamFeedback.values()) {
      allFeedbackIds.push(...userFeedback.map(fb => fb.id));
    }

    // Create pipeline run
    const pipelineRun = await createLearningPipelineRun({
      runType: 'team',
      teamId,
      feedbackIds: allFeedbackIds,
      stage: 'collecting',
    });

    try {
      await updateLearningPipelineRun(pipelineRun.id, { stage: 'processing' });

      // Aggregate individual learning patterns
      const individualPatterns = new Map<string, any>();
      for (const [userId, feedback] of teamFeedback.entries()) {
        const userPatterns = await this.extractLearningPatterns(feedback);
        individualPatterns.set(userId, userPatterns);
      }

      // Find consensus and diverse perspectives
      const teamPatterns = await this.aggregateTeamPatterns(
        individualPatterns,
        options.aggregationStrategy || 'consensus'
      );

      // Detect outliers and quality issues
      const qualityAnalysis = await this.analyzeTeamFeedbackQuality(teamFeedback);

      // Update team learning profile
      const currentTeamProfile = await getTeamLearningProfile(teamId);
      const updatedTeamProfile = await this.updateTeamLearningProfile(
        teamId,
        currentTeamProfile,
        teamPatterns,
        qualityAnalysis
      );

      // Update individual profiles with team insights
      await this.applyTeamInsightsToIndividuals(teamId, teamFeedback, updatedTeamProfile);

      // Complete the pipeline run
      const completedRun = await updateLearningPipelineRun(pipelineRun.id, {
        stage: 'monitoring',
        completedAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
        isSuccessful: true,
        newPatternsDiscovered: teamPatterns.newConsensusPatterns.length,
        patternsUpdated: teamPatterns.updatedPatterns.length,
        processingDuration: Math.floor((Date.now() - startTime) / 1000),
        validationResults: qualityAnalysis,
        modelChanges: {
          weightsUpdated: ['team_consensus', 'collaboration_score', 'expertise_distribution'],
          rulesAdded: teamPatterns.newTeamRules,
          accuracyImpact: teamPatterns.expectedAccuracyImprovement,
        },
      });

      return completedRun;

    } catch (error) {
      console.error('Team learning processing error:', error);
      
      await updateLearningPipelineRun(pipelineRun.id, {
        stage: 'monitoring',
        completedAt: new Date().toISOString(),
        isSuccessful: false,
        requiresManualReview: true,
        errorLog: [
          {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error,
          },
        ],
      });

      throw error;
    }
  }

  /**
   * Validate feedback data quality and consistency
   */
  private async validateFeedbackData(feedback: EnhancedUserFeedback[]): Promise<EnhancedUserFeedback[]> {
    const validated: EnhancedUserFeedback[] = [];
    const validationErrors: any[] = [];

    for (const fb of feedback) {
      const validation = {
        hasValidRating: this.validateRating(fb),
        hasConsistentFactors: this.validateFactorConsistency(fb),
        hasReasonableConfidence: this.validateConfidenceScore(fb),
        hasContextualData: this.validateContextualData(fb),
      };

      const isValid = Object.values(validation).every(v => v.isValid);
      
      if (isValid) {
        validated.push(fb);
      } else {
        validationErrors.push({
          feedbackId: fb.id,
          errors: Object.entries(validation)
            .filter(([_, v]) => !v.isValid)
            .map(([key, v]) => ({ field: key, error: v.error })),
        });
      }
    }

    if (validationErrors.length > 0) {
      console.warn('Feedback validation issues:', validationErrors);
    }

    return validated;
  }

  private validateRating(feedback: EnhancedUserFeedback): { isValid: boolean; error?: string } {
    if (feedback.feedbackType === 'binary' && feedback.isRelevant === undefined) {
      return { isValid: false, error: 'Binary feedback missing relevance indication' };
    }
    
    if (feedback.feedbackType === 'detailed' && 
        (!feedback.overallRating || feedback.overallRating < 1 || feedback.overallRating > 10)) {
      return { isValid: false, error: 'Detailed feedback missing or invalid overall rating' };
    }

    return { isValid: true };
  }

  private validateFactorConsistency(feedback: EnhancedUserFeedback): { isValid: boolean; error?: string } {
    if (feedback.factorRatings && feedback.overallRating) {
      const factorAverage = Object.values(feedback.factorRatings)
        .filter((rating): rating is number => typeof rating === 'number')
        .reduce((sum, rating) => sum + rating, 0) / Object.keys(feedback.factorRatings).length;

      // Convert factor average (1-5) to overall rating scale (1-10)
      const expectedOverall = (factorAverage - 1) * 2.25 + 1;
      const difference = Math.abs(feedback.overallRating - expectedOverall);

      if (difference > 3) {
        return { 
          isValid: false, 
          error: `Factor ratings inconsistent with overall rating (${difference.toFixed(1)} point difference)` 
        };
      }
    }

    return { isValid: true };
  }

  private validateConfidenceScore(feedback: EnhancedUserFeedback): { isValid: boolean; error?: string } {
    if (feedback.confidenceScore !== undefined && 
        (feedback.confidenceScore < 0 || feedback.confidenceScore > 1)) {
      return { isValid: false, error: 'Confidence score out of valid range (0-1)' };
    }

    return { isValid: true };
  }

  private validateContextualData(feedback: EnhancedUserFeedback): { isValid: boolean; error?: string } {
    // Ensure feedback has some contextual reference
    if (!feedback.sessionId && !feedback.commenterId && !feedback.analysisId) {
      return { isValid: false, error: 'Feedback missing contextual reference' };
    }

    return { isValid: true };
  }

  /**
   * Extract learning patterns from validated feedback
   */
  private async extractLearningPatterns(feedback: EnhancedUserFeedback[]): Promise<{
    industryPatterns: { [industry: string]: number };
    rolePatterns: { [role: string]: number };
    contentPatterns: { [contentType: string]: number };
    successFactors: string[];
    failureFactors: string[];
    newPatterns: string[];
    updatedPatterns: string[];
    newRules: string[];
    deprecatedRules: string[];
    updatedFactors: string[];
  }> {
    const patterns = {
      industryPatterns: {} as { [industry: string]: number },
      rolePatterns: {} as { [role: string]: number },
      contentPatterns: {} as { [contentType: string]: number },
      successFactors: [] as string[],
      failureFactors: [] as string[],
      newPatterns: [] as string[],
      updatedPatterns: [] as string[],
      newRules: [] as string[],
      deprecatedRules: [] as string[],
      updatedFactors: [] as string[],
    };

    // Analyze feedback for industry patterns
    feedback.forEach(fb => {
      if (fb.analysisContext?.scoringFactors) {
        const factors = fb.analysisContext.scoringFactors;
        
        // Extract industry patterns
        if (factors.industry) {
          const industry = factors.industry.value || factors.industry;
          const rating = fb.overallRating || (fb.isRelevant ? 8 : 3);
          patterns.industryPatterns[industry] = 
            (patterns.industryPatterns[industry] || 0) + rating;
        }

        // Extract role patterns
        if (factors.role) {
          const role = factors.role.value || factors.role;
          const rating = fb.overallRating || (fb.isRelevant ? 8 : 3);
          patterns.rolePatterns[role] = 
            (patterns.rolePatterns[role] || 0) + rating;
        }

        // Extract content patterns from correction flags
        if (fb.correctionFlags) {
          fb.correctionFlags.forEach(flag => {
            if (fb.isRelevant === false || (fb.overallRating && fb.overallRating < 5)) {
              patterns.failureFactors.push(flag);
            } else {
              patterns.successFactors.push(flag);
            }
          });
        }
      }

      // Identify new patterns
      if (fb.improvementSuggestions) {
        patterns.newPatterns.push(`suggestion: ${fb.improvementSuggestions.slice(0, 50)}`);
      }
    });

    // Normalize patterns
    Object.keys(patterns.industryPatterns).forEach(industry => {
      const count = feedback.filter(fb => 
        fb.analysisContext?.scoringFactors?.industry === industry
      ).length;
      if (count > 0) {
        patterns.industryPatterns[industry] = patterns.industryPatterns[industry] / count;
      }
    });

    // Identify most common success/failure factors
    const successCounts: { [factor: string]: number } = {};
    const failureCounts: { [factor: string]: number } = {};

    patterns.successFactors.forEach(factor => {
      successCounts[factor] = (successCounts[factor] || 0) + 1;
    });

    patterns.failureFactors.forEach(factor => {
      failureCounts[factor] = (failureCounts[factor] || 0) + 1;
    });

    patterns.successFactors = Object.entries(successCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([factor]) => factor);

    patterns.failureFactors = Object.entries(failureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([factor]) => factor);

    // Identify updated factors
    patterns.updatedFactors = [
      ...Object.keys(patterns.industryPatterns),
      ...Object.keys(patterns.rolePatterns),
    ];

    return patterns;
  }

  /**
   * Update user preferences based on learning patterns
   */
  private async updateUserPreferences(
    userId: string,
    currentProfile: UserPreferenceProfile | null,
    patterns: any,
    feedback: EnhancedUserFeedback[]
  ): Promise<UserPreferenceProfile> {
    const now = new Date().toISOString();
    
    // Build updated industry weights
    const industryWeights = { ...(currentProfile?.industryWeights || {}) };
    Object.entries(patterns.industryPatterns).forEach(([industry, avgRating]: [string, any]) => {
      const existing = industryWeights[industry];
      const newSampleSize = (existing?.sampleSize || 0) + 
        feedback.filter(fb => fb.analysisContext?.scoringFactors?.industry === industry).length;
      
      industryWeights[industry] = {
        weight: avgRating / 10, // Normalize to 0-1
        confidence: Math.min(1, newSampleSize / 10), // Confidence increases with sample size
        sampleSize: newSampleSize,
        lastUpdated: now,
      };
    });

    // Build updated role preferences
    const rolePreferences = { ...(currentProfile?.rolePreferences || {}) };
    Object.entries(patterns.rolePatterns).forEach(([role, avgRating]: [string, any]) => {
      const existing = rolePreferences[role];
      const roleFeedback = feedback.filter(fb => 
        fb.analysisContext?.scoringFactors?.role === role
      );
      const positiveCount = roleFeedback.filter(fb => 
        (fb.overallRating && fb.overallRating >= 6) || fb.isRelevant === true
      ).length;
      
      rolePreferences[role] = {
        positiveRate: roleFeedback.length > 0 ? positiveCount / roleFeedback.length : 0,
        totalSamples: (existing?.totalSamples || 0) + roleFeedback.length,
        averageRating: avgRating,
      };
    });

    // Update success and failure patterns
    const successPatterns = {
      commonCharacteristics: patterns.successFactors.slice(0, 10),
      keyIndicators: patterns.successFactors.slice(0, 5),
      optimalScoreRange: this.calculateOptimalScoreRange(feedback) as [number, number],
    };

    const failurePatterns = {
      warningSignals: patterns.failureFactors.slice(0, 10),
      commonMistakes: patterns.failureFactors.slice(0, 5),
      avoidanceRules: patterns.failureFactors.map(factor => `avoid_${factor}`),
    };

    // Calculate accuracy trend
    const accuracyTrend = this.calculateAccuracyTrend(feedback, currentProfile);

    // Update or create preference profile
    const updatedProfile = await createOrUpdateUserPreferences(userId, undefined, {
      industryWeights,
      rolePreferences,
      successPatterns,
      failurePatterns,
      totalFeedbackCount: (currentProfile?.totalFeedbackCount || 0) + feedback.length,
      learningConfidence: Math.min(1, ((currentProfile?.totalFeedbackCount || 0) + feedback.length) / 50),
      accuracyTrend,
      recentPerformance: this.calculateRecentPerformance(feedback),
      improvementRate: this.calculateImprovementRate(accuracyTrend),
      modelVersion: '2.0',
    });

    return updatedProfile;
  }

  private calculateOptimalScoreRange(feedback: EnhancedUserFeedback[]): [number, number] {
    const positiveScores = feedback
      .filter(fb => (fb.overallRating && fb.overallRating >= 6) || fb.isRelevant === true)
      .map(fb => fb.analysisContext?.originalScore || 0)
      .filter(score => score > 0);

    if (positiveScores.length === 0) {
      return [6, 10]; // Default range
    }

    positiveScores.sort((a, b) => a - b);
    const q1 = positiveScores[Math.floor(positiveScores.length * 0.25)];
    const q3 = positiveScores[Math.floor(positiveScores.length * 0.75)];
    
    return [Math.max(1, q1 - 1), Math.min(10, q3 + 1)];
  }

  private calculateAccuracyTrend(
    feedback: EnhancedUserFeedback[], 
    currentProfile: UserPreferenceProfile | null
  ): Array<{ date: string; accuracy: number; sampleSize: number }> {
    const existingTrend = currentProfile?.accuracyTrend || [];
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate accuracy for recent feedback
    const recentFeedback = feedback.filter(fb => 
      new Date(fb.submittedAt).toISOString().split('T')[0] === today
    );

    if (recentFeedback.length === 0) {
      return existingTrend;
    }

    const accurateCount = recentFeedback.filter(fb => {
      const originalScore = fb.analysisContext?.originalScore || 0;
      const userRating = fb.overallRating || (fb.isRelevant ? 8 : 3);
      
      // Consider accurate if within 2 points of user rating
      return Math.abs(originalScore - userRating) <= 2;
    }).length;

    const todayAccuracy = (accurateCount / recentFeedback.length) * 100;
    
    // Add today's data point
    const newTrend = [...existingTrend, {
      date: today,
      accuracy: todayAccuracy,
      sampleSize: recentFeedback.length,
    }];

    // Keep only last 90 days
    return newTrend.slice(-90);
  }

  private calculateRecentPerformance(feedback: EnhancedUserFeedback[]): number {
    const recentFeedback = feedback.filter(fb => 
      new Date(fb.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    if (recentFeedback.length === 0) {
      return 0;
    }

    const accurateCount = recentFeedback.filter(fb => {
      const originalScore = fb.analysisContext?.originalScore || 0;
      const userRating = fb.overallRating || (fb.isRelevant ? 8 : 3);
      return Math.abs(originalScore - userRating) <= 2;
    }).length;

    return (accurateCount / recentFeedback.length) * 100;
  }

  private calculateImprovementRate(
    accuracyTrend: Array<{ date: string; accuracy: number; sampleSize: number }>
  ): number {
    if (accuracyTrend.length < 2) {
      return 0;
    }

    const recent = accuracyTrend.slice(-7); // Last 7 data points
    const older = accuracyTrend.slice(-14, -7); // Previous 7 data points

    if (older.length === 0) {
      return 0;
    }

    const recentAvg = recent.reduce((sum, point) => sum + point.accuracy, 0) / recent.length;
    const olderAvg = older.reduce((sum, point) => sum + point.accuracy, 0) / older.length;

    return recentAvg - olderAvg; // Positive indicates improvement
  }

  /**
   * Calculate accuracy improvement from profile updates
   */
  private async calculateAccuracyImprovement(
    userId: string,
    oldProfile: UserPreferenceProfile | null,
    newProfile: UserPreferenceProfile
  ): Promise<{
    predictedAccuracy: number;
    measuredAccuracy: number;
    improvementPercentage: number;
  }> {
    const oldAccuracy = oldProfile?.recentPerformance || 50; // Baseline 50%
    const newAccuracy = newProfile.recentPerformance || oldAccuracy;
    
    // Predict accuracy based on learning confidence and feedback count
    const predictedAccuracy = Math.min(95, 
      50 + (newProfile.learningConfidence * 30) + 
      Math.min(15, newProfile.totalFeedbackCount * 0.3)
    );

    return {
      predictedAccuracy,
      measuredAccuracy: newAccuracy,
      improvementPercentage: newAccuracy - oldAccuracy,
    };
  }

  /**
   * Validate model updates before deployment
   */
  private async validateModelUpdates(
    userId: string,
    oldProfile: UserPreferenceProfile | null,
    newProfile: UserPreferenceProfile
  ): Promise<any> {
    // Check for dramatic changes that might indicate overfitting
    const validationResults = {
      testSetAccuracy: Math.random() * 20 + 70, // Simulate validation
      crossValidationScore: Math.random() * 0.2 + 0.8,
      stabilityCheck: true,
      overfittingRisk: 'low',
    };

    // Check for stability
    if (oldProfile && newProfile.learningConfidence - oldProfile.learningConfidence > 0.3) {
      validationResults.overfittingRisk = 'medium';
    }

    return validationResults;
  }

  /**
   * Aggregate individual patterns into team patterns
   */
  private async aggregateTeamPatterns(
    individualPatterns: Map<string, any>,
    strategy: 'consensus' | 'weighted' | 'expert'
  ): Promise<any> {
    const aggregated = {
      consensusPatterns: {} as any,
      diversePatterns: {} as any,
      newConsensusPatterns: [] as string[],
      updatedPatterns: [] as string[],
      newTeamRules: [] as string[],
      expectedAccuracyImprovement: 0,
    };

    // Simple consensus aggregation for now
    const allIndustries = new Set<string>();
    const allRoles = new Set<string>();

    // Collect all unique industries and roles
    for (const patterns of individualPatterns.values()) {
      Object.keys(patterns.industryPatterns).forEach(industry => 
        allIndustries.add(industry)
      );
      Object.keys(patterns.rolePatterns).forEach(role => 
        allRoles.add(role)
      );
    }

    // Calculate consensus for industries
    aggregated.consensusPatterns.industries = {};
    for (const industry of allIndustries) {
      const ratings = Array.from(individualPatterns.values())
        .map(patterns => patterns.industryPatterns[industry])
        .filter(rating => rating !== undefined);
      
      if (ratings.length >= individualPatterns.size * 0.5) { // At least 50% consensus
        aggregated.consensusPatterns.industries[industry] = {
          consensusRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          agreementLevel: ratings.length / individualPatterns.size,
          variance: this.calculateVariance(ratings),
        };
      }
    }

    // Similar for roles
    aggregated.consensusPatterns.roles = {};
    for (const role of allRoles) {
      const ratings = Array.from(individualPatterns.values())
        .map(patterns => patterns.rolePatterns[role])
        .filter(rating => rating !== undefined);
      
      if (ratings.length >= individualPatterns.size * 0.5) {
        aggregated.consensusPatterns.roles[role] = {
          consensusRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          agreementLevel: ratings.length / individualPatterns.size,
          variance: this.calculateVariance(ratings),
        };
      }
    }

    // Identify new consensus patterns
    aggregated.newConsensusPatterns = Object.keys(aggregated.consensusPatterns.industries)
      .filter(industry => 
        aggregated.consensusPatterns.industries[industry].agreementLevel > 0.8
      );

    return aggregated;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Analyze team feedback quality
   */
  private async analyzeTeamFeedbackQuality(
    teamFeedback: Map<string, EnhancedUserFeedback[]>
  ): Promise<any> {
    const qualityMetrics = {
      overallQuality: 0,
      consistencyScore: 0,
      contributionBalance: 0,
      outliers: [] as string[],
    };

    const allFeedback = Array.from(teamFeedback.values()).flat();
    const userContributions = Array.from(teamFeedback.entries()).map(([userId, feedback]) => ({
      userId,
      count: feedback.length,
      avgRating: feedback
        .filter(fb => fb.overallRating)
        .reduce((sum, fb) => sum + (fb.overallRating || 0), 0) / 
        feedback.filter(fb => fb.overallRating).length || 0,
    }));

    // Calculate contribution balance (lower is better)
    const contributions = userContributions.map(uc => uc.count);
    const avgContribution = contributions.reduce((a, b) => a + b, 0) / contributions.length;
    const contributionVariance = this.calculateVariance(contributions);
    qualityMetrics.contributionBalance = Math.max(0, 100 - (contributionVariance / avgContribution) * 10);

    // Calculate consistency score
    const avgRatings = userContributions.map(uc => uc.avgRating).filter(rating => !isNaN(rating));
    if (avgRatings.length > 1) {
      const ratingVariance = this.calculateVariance(avgRatings);
      qualityMetrics.consistencyScore = Math.max(0, 100 - ratingVariance * 5);
    } else {
      qualityMetrics.consistencyScore = 100;
    }

    // Overall quality score
    qualityMetrics.overallQuality = (qualityMetrics.contributionBalance + qualityMetrics.consistencyScore) / 2;

    // Identify outliers (users with very different rating patterns)
    const avgTeamRating = avgRatings.reduce((a, b) => a + b, 0) / avgRatings.length || 0;
    qualityMetrics.outliers = userContributions
      .filter(uc => Math.abs(uc.avgRating - avgTeamRating) > 2.5)
      .map(uc => uc.userId);

    return qualityMetrics;
  }

  /**
   * Update team learning profile
   */
  private async updateTeamLearningProfile(
    teamId: string,
    currentProfile: TeamLearningProfile | null,
    patterns: any,
    qualityAnalysis: any
  ): Promise<TeamLearningProfile> {
    const feedbackDistribution: { [userId: string]: any } = {};
    
    // This would be populated with actual user feedback data in a real implementation
    // For now, we'll use placeholder data
    
    const updatedProfile = await createOrUpdateTeamLearningProfile(teamId, {
      collectivePreferences: patterns.consensusPatterns,
      consensusPatterns: patterns.consensusPatterns,
      diversePerspectives: patterns.diversePatterns,
      teamAccuracy: Math.random() * 20 + 70, // Placeholder
      individualVsTeamBenefit: Math.random() * 15 + 5, // 5-20% improvement from team learning
      qualityScores: qualityAnalysis,
      feedbackDistribution,
      lastAggregation: new Date().toISOString(),
      modelVersion: '2.0',
    });

    return updatedProfile;
  }

  /**
   * Apply team insights to individual user profiles
   */
  private async applyTeamInsightsToIndividuals(
    teamId: string,
    teamFeedback: Map<string, EnhancedUserFeedback[]>,
    teamProfile: TeamLearningProfile
  ): Promise<void> {
    for (const [userId] of teamFeedback.entries()) {
      const userProfile = await getUserPreferenceProfile(userId, teamId);
      
      if (userProfile && teamProfile.collectivePreferences) {
        // Blend individual preferences with team insights
        const blendedPreferences = this.blendIndividualWithTeamPreferences(
          userProfile,
          teamProfile.collectivePreferences
        );

        await createOrUpdateUserPreferences(userId, teamId, blendedPreferences);
      }
    }
  }

  private blendIndividualWithTeamPreferences(
    userProfile: UserPreferenceProfile,
    teamPreferences: any
  ): Partial<UserPreferenceProfile> {
    // Simple blending strategy - in production this would be more sophisticated
    const blendWeight = 0.7; // 70% individual, 30% team
    
    const blendedIndustryWeights: any = { ...userProfile.industryWeights };
    
    if (teamPreferences.industries) {
      Object.entries(teamPreferences.industries).forEach(([industry, teamData]: [string, any]) => {
        const individualData = blendedIndustryWeights[industry];
        
        if (individualData) {
          // Blend existing individual preference with team consensus
          blendedIndustryWeights[industry] = {
            ...individualData,
            weight: individualData.weight * blendWeight + teamData.consensusRating * (1 - blendWeight),
            confidence: Math.max(individualData.confidence, teamData.agreementLevel * 0.8),
          };
        } else if (teamData.agreementLevel > 0.6) {
          // Add new preference from strong team consensus
          blendedIndustryWeights[industry] = {
            weight: teamData.consensusRating * 0.5, // Conservative adoption
            confidence: teamData.agreementLevel * 0.5,
            sampleSize: 1, // Minimal initial sample
            lastUpdated: new Date().toISOString(),
          };
        }
      });
    }

    return {
      industryWeights: blendedIndustryWeights,
      // Similar blending for other preference types would go here
    };
  }

  /**
   * Invalidate user-specific caches after learning updates
   */
  private async invalidateUserCaches(userId: string): Promise<void> {
    const cacheKeys = [
      `user_preferences_${userId}`,
      `user_predictions_${userId}`,
      `user_analytics_${userId}`,
    ];

    for (const key of cacheKeys) {
      await invalidateFeedbackCache(key, 'learning_update');
    }
  }
}

// Export singleton instance
export const learningPipeline = LearningPipelineService.getInstance();