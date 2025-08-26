import { 
  EnhancedUserFeedback,
  UserPreferenceProfile,
  FeedbackProcessingCache 
} from './types';
import {
  getCachedFeedbackData,
  setCachedFeedbackData,
  invalidateFeedbackCache
} from './feedback-database';

/**
 * Performance Optimization Service
 * Handles caching, batching, and real-time processing optimizations
 */
export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private processingQueue: Map<string, any[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private memoryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  // Configuration
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT_MS = 5000; // 5 seconds
  private readonly MEMORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    this.startCacheCleanup();
  }

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  /**
   * Optimized feedback processing with batching and caching
   */
  async processFeedbackOptimized(
    userId: string,
    feedback: EnhancedUserFeedback,
    options: {
      enableBatching?: boolean;
      enableCaching?: boolean;
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<{ processed: boolean; batchId?: string; cached?: boolean }> {
    const {
      enableBatching = true,
      enableCaching = true,
      priority = 'normal'
    } = options;

    // Check if we can serve from cache for similar feedback
    if (enableCaching) {
      const cachedResult = await this.getCachedProcessingResult(feedback);
      if (cachedResult) {
        return { processed: true, cached: true };
      }
    }

    if (enableBatching && priority !== 'high') {
      // Add to batch processing queue
      const batchId = await this.addToBatchQueue(userId, feedback);
      return { processed: false, batchId };
    } else {
      // Process immediately for high priority or when batching is disabled
      const result = await this.processImmediately(feedback);
      
      if (enableCaching) {
        await this.cacheProcessingResult(feedback, result);
      }
      
      return { processed: true };
    }
  }

  /**
   * Precompute and cache user preferences for faster adaptation
   */
  async precomputeUserPreferences(userId: string): Promise<void> {
    const cacheKey = `user_preferences_computed_${userId}`;
    
    // Check if already cached
    const cached = this.getFromMemoryCache(cacheKey);
    if (cached) return;

    try {
      const { getUserPreferenceProfile, getEnhancedFeedbackByUser } = await import('./feedback-database');
      
      const [userProfile, recentFeedback] = await Promise.all([
        getUserPreferenceProfile(userId),
        getEnhancedFeedbackByUser(userId, { limit: 50 })
      ]);

      if (userProfile) {
        // Precompute scoring adjustments for common scenarios
        const precomputedAdjustments = await this.precomputeScoringAdjustments(
          userProfile,
          recentFeedback
        );

        // Cache for 15 minutes
        this.setMemoryCache(cacheKey, precomputedAdjustments, 15 * 60 * 1000);
        
        // Also cache in distributed storage for 1 hour
        await setCachedFeedbackData(
          cacheKey,
          precomputedAdjustments,
          'user_preferences_computed',
          60
        );
      }
    } catch (error) {
      console.error('Error precomputing user preferences:', error);
    }
  }

  /**
   * Get precomputed user preferences for fast adaptation
   */
  async getPrecomputedPreferences(userId: string): Promise<any | null> {
    const cacheKey = `user_preferences_computed_${userId}`;
    
    // Try memory cache first
    const memoryResult = this.getFromMemoryCache(cacheKey);
    if (memoryResult) return memoryResult;

    // Try distributed cache
    const distributedResult = await getCachedFeedbackData(cacheKey);
    if (distributedResult) {
      // Populate memory cache for next time
      this.setMemoryCache(cacheKey, distributedResult, this.MEMORY_CACHE_TTL_MS);
      return distributedResult;
    }

    // Not cached, trigger precomputation
    this.precomputeUserPreferences(userId); // Fire and forget
    return null;
  }

  /**
   * Optimized real-time scoring adaptation
   */
  async adaptScoringRealTime(
    userId: string,
    originalScore: number,
    scoringFactors: any,
    analysisContext: any
  ): Promise<{
    adaptedScore: number;
    processingTime: number;
    cacheHit: boolean;
    adaptationReason: string[];
  }> {
    const startTime = Date.now();
    
    // Generate cache key based on user and scoring context
    const contextHash = this.generateContextHash(userId, scoringFactors, analysisContext);
    const cacheKey = `scoring_adaptation_${userId}_${contextHash}`;
    
    // Try to get from cache first
    const cached = this.getFromMemoryCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        processingTime: Date.now() - startTime,
        cacheHit: true,
      };
    }

    // Get precomputed preferences
    const precomputed = await this.getPrecomputedPreferences(userId);
    
    let adaptedScore = originalScore;
    let adaptationReason: string[] = [];

    if (precomputed) {
      // Use precomputed adjustments for fast adaptation
      const adaptation = this.applyPrecomputedAdjustments(
        originalScore,
        scoringFactors,
        analysisContext,
        precomputed
      );
      
      adaptedScore = adaptation.score;
      adaptationReason = adaptation.reasons;
    } else {
      // Fallback to basic adaptation if no precomputed data
      const { preferenceAdaptation } = await import('./preference-adaptation');
      const result = await preferenceAdaptation.adaptRelevanceScore(
        userId,
        originalScore,
        scoringFactors,
        analysisContext
      );
      
      adaptedScore = result.adaptedScore;
      adaptationReason = result.adaptationReason;
    }

    const result = {
      adaptedScore,
      adaptationReason,
      processingTime: Date.now() - startTime,
      cacheHit: false,
    };

    // Cache result for 5 minutes
    this.setMemoryCache(cacheKey, {
      adaptedScore: result.adaptedScore,
      adaptationReason: result.adaptationReason,
    }, 5 * 60 * 1000);

    return result;
  }

  /**
   * Batch process multiple feedback items for efficiency
   */
  async processFeedbackBatch(
    userId: string,
    feedbackBatch: EnhancedUserFeedback[]
  ): Promise<{
    processed: number;
    failed: number;
    processingTime: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Process in parallel batches for better performance
      const batchSize = Math.min(this.BATCH_SIZE, 5); // Max 5 parallel
      
      for (let i = 0; i < feedbackBatch.length; i += batchSize) {
        const batch = feedbackBatch.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(feedback => this.processIndividualFeedback(feedback))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            processed++;
          } else {
            failed++;
            errors.push(`Feedback ${i + index}: ${result.reason}`);
          }
        });
      }

      // Update user preferences after batch processing
      if (processed > 0) {
        await this.invalidateUserCaches(userId);
        // Trigger precomputation for next requests
        this.precomputeUserPreferences(userId);
      }

    } catch (error) {
      console.error('Error in batch processing:', error);
      errors.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      processed,
      failed,
      processingTime: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Smart cache warming for frequently accessed data
   */
  async warmCaches(userId: string, teamId?: string): Promise<void> {
    const warmingTasks = [
      // User preferences
      this.precomputeUserPreferences(userId),
      
      // Recent feedback analytics
      this.precomputeFeedbackAnalytics(userId),
      
      // Team data if applicable
      teamId ? this.precomputeTeamData(teamId) : Promise.resolve(),
    ];

    try {
      await Promise.allSettled(warmingTasks);
    } catch (error) {
      console.error('Error warming caches:', error);
    }
  }

  /**
   * Adaptive rate limiting based on user behavior
   */
  async checkAdaptiveRateLimit(
    userId: string,
    endpoint: string,
    baseLimit: number = 100
  ): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: Date;
    reason?: string;
  }> {
    // Get user's recent activity pattern
    const activityPattern = await this.getUserActivityPattern(userId);
    
    // Adjust limits based on user behavior
    let adjustedLimit = baseLimit;
    
    if (activityPattern.averageAccuracy > 85) {
      adjustedLimit = Math.floor(baseLimit * 1.5); // Increase for accurate users
    } else if (activityPattern.averageAccuracy < 50) {
      adjustedLimit = Math.floor(baseLimit * 0.7); // Decrease for inaccurate users
    }

    if (activityPattern.feedbackQuality > 0.8) {
      adjustedLimit = Math.floor(adjustedLimit * 1.2); // Bonus for quality feedback
    }

    // Check rate limit with adjusted limit
    const { checkRateLimit } = await import('./database');
    const result = await checkRateLimit(userId, endpoint, adjustedLimit, 60);

    return {
      allowed: result.allowed,
      limit: adjustedLimit,
      remaining: result.remainingRequests,
      resetTime: result.resetTime,
      reason: adjustedLimit !== baseLimit 
        ? `Limit adjusted based on user behavior (accuracy: ${activityPattern.averageAccuracy}%, quality: ${Math.round(activityPattern.feedbackQuality * 100)}%)`
        : undefined,
    };
  }

  /**
   * Optimize database queries with intelligent caching
   */
  async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number; // TTL in minutes
      memoryCache?: boolean;
      distributedCache?: boolean;
      computationCost?: number;
    } = {}
  ): Promise<{ data: T; cached: boolean; source: 'memory' | 'distributed' | 'database' }> {
    const {
      ttl = 30,
      memoryCache = true,
      distributedCache = true,
      computationCost = 1
    } = options;

    // Try memory cache first
    if (memoryCache) {
      const memoryResult = this.getFromMemoryCache(queryKey);
      if (memoryResult) {
        return { data: memoryResult, cached: true, source: 'memory' };
      }
    }

    // Try distributed cache
    if (distributedCache) {
      const distributedResult = await getCachedFeedbackData(queryKey);
      if (distributedResult) {
        // Populate memory cache
        if (memoryCache) {
          this.setMemoryCache(queryKey, distributedResult, ttl * 60 * 1000);
        }
        return { data: distributedResult, cached: true, source: 'distributed' };
      }
    }

    // Execute query
    const result = await queryFn();

    // Cache the result
    if (distributedCache) {
      await setCachedFeedbackData(queryKey, result, 'query_result', ttl, computationCost);
    }
    
    if (memoryCache) {
      this.setMemoryCache(queryKey, result, ttl * 60 * 1000);
    }

    return { data: result, cached: false, source: 'database' };
  }

  // Private helper methods

  private async addToBatchQueue(userId: string, feedback: EnhancedUserFeedback): Promise<string> {
    const batchId = `batch_${userId}_${Date.now()}`;
    
    if (!this.processingQueue.has(userId)) {
      this.processingQueue.set(userId, []);
    }

    const queue = this.processingQueue.get(userId)!;
    queue.push(feedback);

    // Start or reset batch timer
    if (this.batchTimers.has(userId)) {
      clearTimeout(this.batchTimers.get(userId)!);
    }

    const timer = setTimeout(async () => {
      await this.processBatch(userId);
    }, this.BATCH_TIMEOUT_MS);

    this.batchTimers.set(userId, timer);

    // Process immediately if batch is full
    if (queue.length >= this.BATCH_SIZE) {
      clearTimeout(timer);
      this.batchTimers.delete(userId);
      await this.processBatch(userId);
    }

    return batchId;
  }

  private async processBatch(userId: string): Promise<void> {
    const queue = this.processingQueue.get(userId);
    if (!queue || queue.length === 0) return;

    // Clear the queue
    this.processingQueue.set(userId, []);
    this.batchTimers.delete(userId);

    // Process the batch
    await this.processFeedbackBatch(userId, queue);
  }

  private async processImmediately(feedback: EnhancedUserFeedback): Promise<any> {
    // Simulate immediate processing
    const { learningPipeline } = await import('./learning-pipeline');
    return await learningPipeline.processIndividualLearning(feedback.userId, [feedback]);
  }

  private async processIndividualFeedback(feedback: EnhancedUserFeedback): Promise<void> {
    // Simulate processing individual feedback
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
  }

  private async getCachedProcessingResult(feedback: EnhancedUserFeedback): Promise<any | null> {
    const cacheKey = this.generateFeedbackCacheKey(feedback);
    return this.getFromMemoryCache(cacheKey) || await getCachedFeedbackData(cacheKey);
  }

  private async cacheProcessingResult(feedback: EnhancedUserFeedback, result: any): Promise<void> {
    const cacheKey = this.generateFeedbackCacheKey(feedback);
    this.setMemoryCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes
    await setCachedFeedbackData(cacheKey, result, 'feedback_processing', 30);
  }

  private generateFeedbackCacheKey(feedback: EnhancedUserFeedback): string {
    const contextString = JSON.stringify({
      type: feedback.feedbackType,
      rating: feedback.overallRating,
      relevant: feedback.isRelevant,
      factors: feedback.factorRatings,
    });
    return `feedback_processing_${this.hashString(contextString)}`;
  }

  private generateContextHash(userId: string, scoringFactors: any, analysisContext: any): string {
    const contextString = JSON.stringify({
      factors: scoringFactors,
      context: analysisContext,
    });
    return this.hashString(contextString);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async precomputeScoringAdjustments(
    userProfile: UserPreferenceProfile,
    recentFeedback: EnhancedUserFeedback[]
  ): Promise<any> {
    // Precompute common scoring adjustments
    const adjustments = {
      industryAdjustments: {} as { [industry: string]: number },
      roleAdjustments: {} as { [role: string]: number },
      contentAdjustments: {} as { [content: string]: number },
      overallBias: 0,
      confidence: userProfile.learningConfidence,
    };

    // Calculate industry adjustments
    Object.entries(userProfile.industryWeights).forEach(([industry, data]) => {
      if (data.sampleSize >= 3) {
        adjustments.industryAdjustments[industry] = (data.weight - 0.5) * 2 * data.confidence;
      }
    });

    // Calculate role adjustments
    Object.entries(userProfile.rolePreferences).forEach(([role, data]) => {
      if (data.totalSamples >= 3) {
        adjustments.roleAdjustments[role] = (data.positiveRate - 0.5) * 2;
      }
    });

    // Calculate content adjustments
    Object.entries(userProfile.contentPreferences).forEach(([content, weight]) => {
      if (Math.abs(weight) > 0.1) {
        adjustments.contentAdjustments[content] = weight;
      }
    });

    // Calculate overall bias from recent feedback
    const recentRatings = recentFeedback
      .filter(fb => fb.overallRating && fb.analysisContext?.originalScore)
      .map(fb => ({
        user: fb.overallRating!,
        original: fb.analysisContext!.originalScore,
      }));

    if (recentRatings.length >= 5) {
      const avgDifference = recentRatings
        .reduce((sum, rating) => sum + (rating.user - rating.original), 0) / recentRatings.length;
      adjustments.overallBias = avgDifference * 0.3; // Dampened
    }

    return adjustments;
  }

  private applyPrecomputedAdjustments(
    originalScore: number,
    scoringFactors: any,
    analysisContext: any,
    precomputed: any
  ): { score: number; reasons: string[] } {
    let totalAdjustment = precomputed.overallBias || 0;
    const reasons: string[] = [];

    // Apply industry adjustments
    const industry = analysisContext.commenterData?.industry;
    if (industry && precomputed.industryAdjustments[industry]) {
      const adjustment = precomputed.industryAdjustments[industry];
      totalAdjustment += adjustment;
      reasons.push(`Industry (${industry}): ${adjustment > 0 ? '+' : ''}${adjustment.toFixed(2)}`);
    }

    // Apply role adjustments
    const role = analysisContext.commenterData?.role;
    if (role && precomputed.roleAdjustments[role]) {
      const adjustment = precomputed.roleAdjustments[role];
      totalAdjustment += adjustment;
      reasons.push(`Role (${role}): ${adjustment > 0 ? '+' : ''}${adjustment.toFixed(2)}`);
    }

    // Apply content adjustments
    const topics = analysisContext.contentAnalysis?.topics || [];
    topics.forEach((topic: string) => {
      const adjustment = precomputed.contentAdjustments[topic];
      if (adjustment) {
        totalAdjustment += adjustment * 0.5; // Reduced weight for content
        reasons.push(`Content (${topic}): ${adjustment > 0 ? '+' : ''}${(adjustment * 0.5).toFixed(2)}`);
      }
    });

    // Apply confidence weighting and limits
    const confidenceWeight = precomputed.confidence || 1;
    const finalAdjustment = Math.max(-3, Math.min(3, totalAdjustment * confidenceWeight));

    return {
      score: Math.max(0, Math.min(10, originalScore + finalAdjustment)),
      reasons: reasons.length > 0 ? reasons : ['No significant adjustments'],
    };
  }

  private async precomputeFeedbackAnalytics(userId: string): Promise<void> {
    const cacheKey = `analytics_${userId}`;
    
    try {
      const { getUserFeedbackAnalytics } = await import('./feedback-database');
      const analytics = await getUserFeedbackAnalytics(userId);
      
      this.setMemoryCache(cacheKey, analytics, 10 * 60 * 1000); // 10 minutes
      await setCachedFeedbackData(cacheKey, analytics, 'analytics', 30);
    } catch (error) {
      console.error('Error precomputing analytics:', error);
    }
  }

  private async precomputeTeamData(teamId: string): Promise<void> {
    const cacheKey = `team_data_${teamId}`;
    
    try {
      const { getTeamLearningProfile } = await import('./feedback-database');
      const teamProfile = await getTeamLearningProfile(teamId);
      
      if (teamProfile) {
        this.setMemoryCache(cacheKey, teamProfile, 15 * 60 * 1000); // 15 minutes
        await setCachedFeedbackData(cacheKey, teamProfile, 'team_data', 60);
      }
    } catch (error) {
      console.error('Error precomputing team data:', error);
    }
  }

  private async getUserActivityPattern(userId: string): Promise<{
    averageAccuracy: number;
    feedbackQuality: number;
    frequency: number;
  }> {
    const cacheKey = `activity_pattern_${userId}`;
    
    let cached = this.getFromMemoryCache(cacheKey);
    if (cached) return cached;

    try {
      const { getEnhancedFeedbackByUser } = await import('./feedback-database');
      const recentFeedback = await getEnhancedFeedbackByUser(userId, {
        limit: 50,
      });

      // Calculate accuracy
      const accurateFeedback = recentFeedback.filter(fb => {
        if (!fb.analysisContext?.originalScore || !fb.overallRating) return false;
        return Math.abs(fb.analysisContext.originalScore - fb.overallRating) <= 2;
      });
      
      const averageAccuracy = recentFeedback.length > 0 
        ? (accurateFeedback.length / recentFeedback.length) * 100 
        : 50;

      // Calculate quality
      const qualityFeedback = recentFeedback.filter(fb => 
        (fb.feedbackText && fb.feedbackText.length > 10) ||
        (fb.factorRatings && Object.keys(fb.factorRatings).length > 0) ||
        fb.improvementSuggestions
      );
      
      const feedbackQuality = recentFeedback.length > 0 
        ? qualityFeedback.length / recentFeedback.length 
        : 0.5;

      // Calculate frequency (feedback per day over last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentCount = recentFeedback.filter(fb => 
        new Date(fb.submittedAt) > thirtyDaysAgo
      ).length;
      
      const frequency = recentCount / 30; // Per day

      const pattern = {
        averageAccuracy,
        feedbackQuality,
        frequency,
      };

      this.setMemoryCache(cacheKey, pattern, 30 * 60 * 1000); // 30 minutes
      return pattern;

    } catch (error) {
      console.error('Error calculating activity pattern:', error);
      return { averageAccuracy: 50, feedbackQuality: 0.5, frequency: 0 };
    }
  }

  private async invalidateUserCaches(userId: string): Promise<void> {
    const cachePatterns = [
      `user_preferences_${userId}`,
      `user_preferences_computed_${userId}`,
      `analytics_${userId}`,
      `activity_pattern_${userId}`,
    ];

    // Clear memory cache
    for (const [key] of this.memoryCache) {
      if (cachePatterns.some(pattern => key.startsWith(pattern.split('_')[0]))) {
        this.memoryCache.delete(key);
      }
    }

    // Clear distributed cache
    for (const pattern of cachePatterns) {
      await invalidateFeedbackCache(pattern, 'user_update');
    }
  }

  private setMemoryCache(key: string, data: any, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private getFromMemoryCache(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.memoryCache) {
        if (now - cached.timestamp > cached.ttl) {
          this.memoryCache.delete(key);
        }
      }
    }, this.CACHE_CLEANUP_INTERVAL_MS);
  }
}

// Export singleton instance
export const performanceOptimization = PerformanceOptimizationService.getInstance();