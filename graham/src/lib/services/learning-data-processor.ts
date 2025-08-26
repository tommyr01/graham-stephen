/**
 * Learning Data Processor - Processes feedback interactions into learning insights
 * 
 * This service processes raw feedback interactions and research sessions to generate
 * actionable learning insights and update user intelligence profiles.
 */

import { supabase } from '@/lib/supabase';
import UserIntelligenceProfileService from './user-intelligence-profile-service';
import PatternDiscoveryEngine from './pattern-discovery-engine';
import type { 
  FeedbackInteraction,
  LearningInsight,
  ProcessingResult,
  DataProcessingConfig,
  ResearchSessionIntelligence
} from '@/lib/types/intelligence';

interface ProcessingBatch {
  feedback_interactions: FeedbackInteraction[];
  research_sessions: ResearchSessionIntelligence[];
  processing_timestamp: Date;
}

interface InsightGenerationConfig {
  min_confidence_threshold: number;
  max_insights_per_user: number;
  insight_freshness_days: number;
  pattern_discovery_threshold: number;
}

const DEFAULT_PROCESSING_CONFIG: DataProcessingConfig = {
  batch_size: 100,
  processing_interval_minutes: 15,
  max_processing_time_minutes: 5,
  enable_real_time: true,
  enable_pattern_discovery: true
};

const DEFAULT_INSIGHT_CONFIG: InsightGenerationConfig = {
  min_confidence_threshold: 0.6,
  max_insights_per_user: 10,
  insight_freshness_days: 7,
  pattern_discovery_threshold: 0.7
};

export class LearningDataProcessor {
  private profileService: UserIntelligenceProfileService;
  private patternEngine: PatternDiscoveryEngine;
  private processingConfig: DataProcessingConfig;
  private insightConfig: InsightGenerationConfig;

  constructor(
    processingConfig: Partial<DataProcessingConfig> = {},
    insightConfig: Partial<InsightGenerationConfig> = {}
  ) {
    this.profileService = new UserIntelligenceProfileService();
    this.patternEngine = new PatternDiscoveryEngine();
    this.processingConfig = { ...DEFAULT_PROCESSING_CONFIG, ...processingConfig };
    this.insightConfig = { ...DEFAULT_INSIGHT_CONFIG, ...insightConfig };
  }

  /**
   * Process a single feedback interaction in real-time
   */
  async processRealtimeFeedback(interaction: FeedbackInteraction): Promise<ProcessingResult> {
    if (!this.processingConfig.enable_real_time) {
      return { success: false, message: 'Real-time processing disabled' };
    }

    try {
      console.log(`Processing real-time feedback interaction: ${interaction.id}`);

      // Process the interaction
      const processingResult = await this.processSingleInteraction(interaction);

      // Update user profile if significant learning occurred
      if (processingResult.learning_value > 0.5) {
        await this.updateUserProfileFromInteraction(interaction, processingResult);
      }

      // Mark as processed
      await this.markInteractionProcessed(interaction.id, processingResult);

      // Generate immediate insights if warranted
      const insights = await this.generateImmediateInsights(interaction, processingResult);

      return {
        success: true,
        processing_time: Date.now() - new Date(interaction.created_at).getTime(),
        insights_generated: insights.length,
        learning_value: processingResult.learning_value,
        pattern_updates: processingResult.pattern_updates || []
      };
    } catch (error) {
      console.error('Error processing real-time feedback:', error);
      return { 
        success: false, 
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Process batch of unprocessed interactions
   */
  async processBatch(): Promise<ProcessingResult> {
    try {
      console.log('Starting batch processing of learning data');

      // Get unprocessed interactions
      const batch = await this.getUnprocessedBatch();
      
      if (batch.feedback_interactions.length === 0) {
        return { success: true, message: 'No unprocessed interactions found' };
      }

      console.log(`Processing batch of ${batch.feedback_interactions.length} interactions`);

      const processingResults: any[] = [];
      const userUpdates: Map<string, any[]> = new Map();

      // Process each interaction
      for (const interaction of batch.feedback_interactions) {
        try {
          const result = await this.processSingleInteraction(interaction);
          processingResults.push({ interaction: interaction.id, result });

          // Collect updates by user
          if (result.learning_value > 0.3) {
            const userId = interaction.user_id;
            if (!userUpdates.has(userId)) {
              userUpdates.set(userId, []);
            }
            userUpdates.get(userId)!.push({ interaction, result });
          }

          // Mark as processed
          await this.markInteractionProcessed(interaction.id, result);
        } catch (error) {
          console.error(`Error processing interaction ${interaction.id}:`, error);
        }
      }

      // Update user profiles in batch
      let profileUpdates = 0;
      for (const [userId, updates] of userUpdates.entries()) {
        try {
          await this.batchUpdateUserProfile(userId, updates);
          profileUpdates++;
        } catch (error) {
          console.error(`Error updating profile for user ${userId}:`, error);
        }
      }

      // Discover new patterns if enabled
      let newPatterns = 0;
      if (this.processingConfig.enable_pattern_discovery) {
        const patternResults = await this.patternEngine.discoverPatterns();
        newPatterns = await this.saveDiscoveredPatterns(patternResults);
      }

      // Generate batch insights
      const batchInsights = await this.generateBatchInsights(batch);

      return {
        success: true,
        interactions_processed: batch.feedback_interactions.length,
        profiles_updated: profileUpdates,
        patterns_discovered: newPatterns,
        insights_generated: batchInsights.length,
        processing_time: Date.now() - batch.processing_timestamp.getTime()
      };
    } catch (error) {
      console.error('Error in batch processing:', error);
      return { 
        success: false, 
        message: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Generate learning insights for a specific user
   */
  async generateUserInsights(userId: string): Promise<LearningInsight[]> {
    try {
      // Get user's recent activity
      const recentActivity = await this.getUserRecentActivity(userId);
      
      // Get user's current profile
      const profile = await this.profileService.getProfile(userId);

      const insights: LearningInsight[] = [];

      // Pattern-based insights
      const patternInsights = await this.generatePatternInsights(userId, recentActivity, profile);
      insights.push(...patternInsights);

      // Behavior trend insights
      const trendInsights = await this.generateTrendInsights(userId, recentActivity);
      insights.push(...trendInsights);

      // Recommendation insights
      const recommendationInsights = await this.generateRecommendationInsights(userId, profile);
      insights.push(...recommendationInsights);

      // Filter and rank insights
      return this.filterAndRankInsights(insights);
    } catch (error) {
      console.error('Error generating user insights:', error);
      return [];
    }
  }

  /**
   * Process feedback to improve system accuracy
   */
  async processFeedbackForSystemImprovement(
    feedbackType: 'prediction_correction' | 'relevance_rating' | 'outcome_report',
    feedbackData: any,
    userId: string,
    sessionId?: string
  ): Promise<void> {
    try {
      // Create feedback interaction record
      const interaction: Omit<FeedbackInteraction, 'id'> = {
        user_id: userId,
        session_id: sessionId || null,
        interaction_type: feedbackType === 'prediction_correction' ? 'pattern_correction' : 
                         feedbackType === 'outcome_report' ? 'outcome_report' : 'explicit_rating',
        feedback_data: feedbackData,
        feedback_timestamp: new Date(),
        context_data: { feedback_type: feedbackType },
        collection_method: 'explicit',
        ui_component: 'feedback_system',
        processed: false,
        learning_value: this.calculateLearningValue(feedbackType, feedbackData),
        created_at: new Date()
      };

      // Save feedback interaction
      const { data: savedInteraction, error } = await supabase
        .from('feedback_interactions')
        .insert(interaction)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error saving feedback interaction: ${error.message}`);
      }

      // Process immediately if high value
      if (interaction.learning_value > 0.7) {
        await this.processRealtimeFeedback(savedInteraction);
      }

      console.log(`Processed ${feedbackType} feedback for user ${userId}`);
    } catch (error) {
      console.error('Error processing feedback for system improvement:', error);
      throw error;
    }
  }

  /**
   * Get processing statistics and metrics
   */
  async getProcessingMetrics(days: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      // Get processing counts
      const { data: processingStats, error: statsError } = await supabase
        .from('feedback_interactions')
        .select('processed, learning_value, interaction_type, created_at')
        .gte('created_at', startDate.toISOString());

      if (statsError) {
        throw new Error(`Error fetching processing stats: ${statsError.message}`);
      }

      const stats = processingStats || [];
      const processed = stats.filter(s => s.processed);
      const unprocessed = stats.filter(s => !s.processed);

      // Calculate metrics
      return {
        total_interactions: stats.length,
        processed_interactions: processed.length,
        unprocessed_interactions: unprocessed.length,
        processing_rate: stats.length > 0 ? processed.length / stats.length : 0,
        average_learning_value: processed.reduce((sum, s) => sum + (s.learning_value || 0), 0) / processed.length || 0,
        interactions_by_type: this.groupByType(stats),
        daily_processing_trend: this.calculateDailyTrend(processed, days),
        backlog_age: this.calculateBacklogAge(unprocessed)
      };
    } catch (error) {
      console.error('Error getting processing metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getUnprocessedBatch(): Promise<ProcessingBatch> {
    const { data: interactions, error } = await supabase
      .from('feedback_interactions')
      .select(`
        *,
        research_session_intelligence (*)
      `)
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(this.processingConfig.batch_size);

    if (error) {
      throw new Error(`Error fetching unprocessed batch: ${error.message}`);
    }

    return {
      feedback_interactions: interactions || [],
      research_sessions: [], // Would be populated from related sessions
      processing_timestamp: new Date()
    };
  }

  private async processSingleInteraction(interaction: FeedbackInteraction): Promise<any> {
    const processingResult = {
      interaction_id: interaction.id,
      processing_timestamp: new Date(),
      learning_value: interaction.learning_value || 0,
      insights_extracted: [],
      pattern_updates: [],
      profile_updates: {},
      confidence_impact: 0
    };

    // Extract insights based on interaction type
    switch (interaction.interaction_type) {
      case 'explicit_rating':
        processingResult.insights_extracted = await this.extractRatingInsights(interaction);
        break;
      case 'implicit_behavior':
        processingResult.insights_extracted = await this.extractBehaviorInsights(interaction);
        break;
      case 'outcome_report':
        processingResult.insights_extracted = await this.extractOutcomeInsights(interaction);
        break;
      case 'pattern_correction':
        processingResult.insights_extracted = await this.extractCorrectionInsights(interaction);
        break;
    }

    // Calculate confidence impact
    processingResult.confidence_impact = this.calculateConfidenceImpact(interaction, processingResult.insights_extracted);

    return processingResult;
  }

  private async updateUserProfileFromInteraction(
    interaction: FeedbackInteraction, 
    processingResult: any
  ): Promise<void> {
    // This would trigger profile updates based on the learning
    // Implementation would depend on specific interaction types and insights
  }

  private async markInteractionProcessed(interactionId: string, processingResult: any): Promise<void> {
    await supabase
      .from('feedback_interactions')
      .update({
        processed: true,
        processing_results: processingResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', interactionId);
  }

  private async generateImmediateInsights(
    interaction: FeedbackInteraction, 
    processingResult: any
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Generate immediate actionable insights
    if (interaction.interaction_type === 'pattern_correction' && processingResult.learning_value > 0.8) {
      insights.push({
        type: 'pattern_correction',
        title: 'Pattern Correction Applied',
        description: 'User feedback has been used to improve system predictions',
        confidence: processingResult.learning_value,
        actionable: false,
        suggestion: null,
        user_id: interaction.user_id,
        created_at: new Date()
      });
    }

    return insights;
  }

  private async batchUpdateUserProfile(userId: string, updates: any[]): Promise<void> {
    // Aggregate all updates for the user and apply them in a single profile update
    const aggregatedLearning = this.aggregateUserLearning(updates);
    
    // Update user profile with aggregated learning
    await this.profileService.updateProfile(userId, {
      userId,
      behaviorAnalysis: aggregatedLearning.behaviorAnalysis,
      sessionData: aggregatedLearning.sessionData,
      feedbackData: aggregatedLearning.feedbackData,
      timestamp: new Date()
    });
  }

  private async saveDiscoveredPatterns(patternResults: any[]): Promise<number> {
    let savedCount = 0;
    
    for (const pattern of patternResults) {
      try {
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
            discovery_agent: 'learning_data_processor',
            applies_to_users: pattern.applies_to_users || [],
            applies_to_industries: pattern.applies_to_industries || [],
            applies_to_roles: pattern.applies_to_roles || []
          });
        
        savedCount++;
      } catch (error) {
        console.error('Error saving pattern:', error);
      }
    }

    return savedCount;
  }

  private async generateBatchInsights(batch: ProcessingBatch): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyse batch for system-wide insights
    const userGroups = this.groupInteractionsByUser(batch.feedback_interactions);
    
    for (const [userId, userInteractions] of userGroups.entries()) {
      const userInsights = await this.generateUserInsightsFromBatch(userId, userInteractions);
      insights.push(...userInsights);
    }

    return insights;
  }

  private async getUserRecentActivity(userId: string): Promise<any> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [sessionsResult, feedbackResult] = await Promise.all([
      supabase
        .from('research_session_intelligence')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false }),
      
      supabase
        .from('feedback_interactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
    ]);

    return {
      sessions: sessionsResult.data || [],
      feedback: feedbackResult.data || []
    };
  }

  private async generatePatternInsights(userId: string, activity: any, profile: any): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    try {
      // Get user's validated patterns
      const { data: userPatterns } = await supabase
        .from('discovered_patterns')
        .select('*')
        .or(`applies_to_users.cs.{${userId}},applies_to_users.eq.{}`)
        .eq('validation_status', 'validated')
        .gte('confidence_score', 0.7)
        .order('confidence_score', { ascending: false })
        .limit(10);
      
      if (userPatterns && userPatterns.length > 0) {
        // Analyze pattern effectiveness
        const highPerformingPatterns = userPatterns.filter(p => p.accuracy_rate > 0.8);
        
        if (highPerformingPatterns.length > 0) {
          insights.push({
            type: 'pattern_recognition',
            title: 'High-Performing Patterns Identified',
            description: `Found ${highPerformingPatterns.length} patterns with >80% accuracy that are improving your research effectiveness.`,
            confidence: 0.9,
            actionable: true,
            suggestion: 'Continue using similar research approaches to leverage these patterns.',
            user_id: userId,
            created_at: new Date()
          });
        }
        
        // Identify underused patterns
        const underusedPatterns = userPatterns.filter(p => 
          p.last_used && 
          new Date(p.last_used) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        
        if (underusedPatterns.length > 0) {
          insights.push({
            type: 'improvement_opportunity',
            title: 'Underused Success Patterns',
            description: `You have ${underusedPatterns.length} proven patterns that haven't been used recently.`,
            confidence: 0.8,
            actionable: true,
            suggestion: 'Review your successful patterns and consider applying them to similar profiles.',
            user_id: userId,
            created_at: new Date()
          });
        }
      }
      
      // Pattern discovery opportunities
      if (activity.sessions && activity.sessions.length >= 10) {
        const successfulSessions = activity.sessions.filter(s => s.session_outcome === 'contacted');
        const successRate = successfulSessions.length / activity.sessions.length;
        
        if (successRate > 0.7) {
          insights.push({
            type: 'pattern_recognition',
            title: 'Strong Success Pattern Emerging',
            description: `Your ${Math.round(successRate * 100)}% contact success rate suggests consistent patterns worth capturing.`,
            confidence: successRate,
            actionable: true,
            suggestion: 'Continue providing feedback to help the system learn your successful approaches.',
            user_id: userId,
            created_at: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error generating pattern insights:', error);
    }
    
    return insights;
  }

  private async generateTrendInsights(userId: string, activity: any): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    if (!activity.sessions || activity.sessions.length === 0) {
      return insights;
    }
    
    try {
      // Analyze session duration trends
      const recentSessions = activity.sessions.slice(0, 10);
      const olderSessions = activity.sessions.slice(10, 20);
      
      if (recentSessions.length >= 5 && olderSessions.length >= 5) {
        const recentAvgDuration = recentSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / recentSessions.length;
        const olderAvgDuration = olderSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / olderSessions.length;
        
        const durationChange = (recentAvgDuration - olderAvgDuration) / olderAvgDuration;
        
        if (durationChange > 0.2) {
          insights.push({
            type: 'efficiency_improvement',
            title: 'Research Depth Increasing',
            description: `Your average research time has increased by ${Math.round(durationChange * 100)}%, suggesting more thorough analysis.`,
            confidence: 0.8,
            actionable: false,
            suggestion: null,
            user_id: userId,
            created_at: new Date()
          });
        } else if (durationChange < -0.2) {
          insights.push({
            type: 'efficiency_improvement',
            title: 'Research Efficiency Improving',
            description: `Your average research time has decreased by ${Math.round(Math.abs(durationChange) * 100)}%, suggesting improved efficiency.`,
            confidence: 0.8,
            actionable: false,
            suggestion: null,
            user_id: userId,
            created_at: new Date()
          });
        }
      }
      
      // Analyze feedback frequency trends
      if (activity.feedback && activity.feedback.length > 0) {
        const recentFeedback = activity.feedback.filter(f => 
          new Date(f.feedback_timestamp) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        );
        
        if (recentFeedback.length >= 3) {
          insights.push({
            type: 'pattern_recognition',
            title: 'High Engagement with Learning',
            description: `You've provided ${recentFeedback.length} pieces of feedback in the last 3 days, accelerating system learning.`,
            confidence: 0.9,
            actionable: true,
            suggestion: 'Your consistent feedback is helping the system learn your preferences quickly.',
            user_id: userId,
            created_at: new Date()
          });
        }
      }
      
      // Time-based activity patterns
      const sessionsByHour = activity.sessions.reduce((acc: Record<number, number>, session) => {
        const hour = new Date(session.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});
      
      const peakHour = Object.entries(sessionsByHour)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (peakHour && sessionsByHour[parseInt(peakHour[0])] >= 3) {
        insights.push({
          type: 'pattern_recognition',
          title: 'Optimal Research Time Identified',
          description: `You're most active around ${peakHour[0]}:00, which could be your peak research time.`,
          confidence: 0.7,
          actionable: true,
          suggestion: `Consider scheduling important research sessions around ${peakHour[0]}:00 for optimal performance.`,
          user_id: userId,
          created_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating trend insights:', error);
    }
    
    return insights;
  }

  private async generateRecommendationInsights(userId: string, profile: any): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    if (!profile) {
      return insights;
    }
    
    try {
      // Learning confidence recommendations
      if (profile.learning_confidence < 0.3) {
        insights.push({
          type: 'recommendation',
          title: 'Build Learning Foundation',
          description: 'The system needs more feedback to learn your preferences effectively.',
          confidence: 1.0,
          actionable: true,
          suggestion: 'Provide voice feedback on 5-10 more profiles to see significant learning improvements.',
          user_id: userId,
          created_at: new Date()
        });
      } else if (profile.learning_confidence > 0.8) {
        insights.push({
          type: 'recommendation',
          title: 'Advanced Learning Active',
          description: 'The system has strong confidence in your preferences and is actively improving predictions.',
          confidence: profile.learning_confidence,
          actionable: true,
          suggestion: 'Try researching profiles in new industries to expand your learned patterns.',
          user_id: userId,
          created_at: new Date()
        });
      }
      
      // Industry focus recommendations
      if (profile.industry_focus && profile.industry_focus.length === 0) {
        insights.push({
          type: 'recommendation',
          title: 'Define Industry Focus',
          description: 'Focusing on specific industries will help the system provide more targeted recommendations.',
          confidence: 0.9,
          actionable: true,
          suggestion: 'Research profiles in 2-3 specific industries to help the system learn your sector preferences.',
          user_id: userId,
          created_at: new Date()
        });
      } else if (profile.industry_focus && profile.industry_focus.length > 5) {
        insights.push({
          type: 'recommendation',
          title: 'Consider Narrowing Focus',
          description: `You're tracking ${profile.industry_focus.length} industries. Focusing on fewer might improve accuracy.`,
          confidence: 0.7,
          actionable: true,
          suggestion: 'Consider focusing on your top 3-4 most successful industries for better pattern recognition.',
          user_id: userId,
          created_at: new Date()
        });
      }
      
      // Session frequency recommendations
      if (profile.total_research_sessions < 10) {
        insights.push({
          type: 'recommendation',
          title: 'Consistent Usage Needed',
          description: 'Regular usage helps the learning system identify stronger patterns.',
          confidence: 0.8,
          actionable: true,
          suggestion: 'Aim for 3-5 research sessions per week to maximize learning effectiveness.',
          user_id: userId,
          created_at: new Date()
        });
      }
      
      // Success rate optimization
      const successRate = profile.successful_contacts / Math.max(profile.total_research_sessions, 1);
      if (successRate < 0.2 && profile.total_research_sessions >= 10) {
        insights.push({
          type: 'recommendation',
          title: 'Review Contact Strategy',
          description: `Your ${Math.round(successRate * 100)}% contact rate suggests room for improvement.`,
          confidence: 0.8,
          actionable: true,
          suggestion: 'Analyze your most successful contacts and provide feedback on what made them effective.',
          user_id: userId,
          created_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating recommendation insights:', error);
    }
    
    return insights;
  }

  private filterAndRankInsights(insights: LearningInsight[]): LearningInsight[] {
    return insights
      .filter(insight => insight.confidence >= this.insightConfig.min_confidence_threshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.insightConfig.max_insights_per_user);
  }

  private calculateLearningValue(feedbackType: string, feedbackData: any): number {
    switch (feedbackType) {
      case 'prediction_correction':
        return 1.0; // Highest value - direct correction
      case 'outcome_report':
        return 0.9; // Very high value - actual results
      case 'relevance_rating':
        return 0.7; // Good value - explicit feedback
      default:
        return 0.5; // Default moderate value
    }
  }

  private async extractRatingInsights(interaction: FeedbackInteraction): Promise<string[]> {
    const insights: string[] = [];
    const feedbackData = interaction.feedback_data;
    
    // Extract specific pattern insights from rating feedback
    if (feedbackData.voice_feedback && feedbackData.transcript) {
      const transcript = feedbackData.transcript.toLowerCase();
      
      // Analyze sentiment and preferences from voice feedback
      if (transcript.includes('good') || transcript.includes('relevant') || transcript.includes('helpful')) {
        insights.push('positive_relevance_pattern');
      }
      if (transcript.includes('bad') || transcript.includes('irrelevant') || transcript.includes('wrong')) {
        insights.push('negative_relevance_pattern');
      }
      
      // Extract industry/role preferences
      const industryKeywords = ['tech', 'finance', 'healthcare', 'marketing', 'sales', 'engineering'];
      const roleKeywords = ['manager', 'director', 'engineer', 'analyst', 'consultant', 'founder'];
      
      industryKeywords.forEach(keyword => {
        if (transcript.includes(keyword)) {
          insights.push(`industry_preference_${keyword}`);
        }
      });
      
      roleKeywords.forEach(keyword => {
        if (transcript.includes(keyword)) {
          insights.push(`role_preference_${keyword}`);
        }
      });
      
      // Extract company size preferences
      if (transcript.includes('startup') || transcript.includes('small company')) {
        insights.push('company_size_preference_small');
      }
      if (transcript.includes('enterprise') || transcript.includes('large company')) {
        insights.push('company_size_preference_large');
      }
    }
    
    return insights;
  }

  private async extractBehaviorInsights(interaction: FeedbackInteraction): Promise<string[]> {
    const insights: string[] = [];
    const contextData = interaction.context_data;
    
    // Extract behavioral patterns from implicit feedback
    if (contextData.session_duration && contextData.session_duration > 180) { // 3+ minutes
      insights.push('high_engagement_pattern');
    }
    
    if (contextData.scroll_behavior) {
      const scrollData = contextData.scroll_behavior;
      if (scrollData.total_scrolls > 10) {
        insights.push('detailed_review_pattern');
      }
    }
    
    if (contextData.sections_viewed && contextData.sections_viewed.length > 3) {
      insights.push('comprehensive_analysis_pattern');
    }
    
    // Extract timing patterns
    const feedbackTime = new Date(interaction.feedback_timestamp);
    const hour = feedbackTime.getHours();
    
    if (hour >= 9 && hour <= 17) {
      insights.push('business_hours_activity_pattern');
    } else {
      insights.push('after_hours_activity_pattern');
    }
    
    return insights;
  }

  private async extractOutcomeInsights(interaction: FeedbackInteraction): Promise<string[]> {
    const insights: string[] = [];
    const feedbackData = interaction.feedback_data;
    
    // Extract insights from contact outcomes
    if (feedbackData.contact_outcome) {
      const outcome = feedbackData.contact_outcome;
      
      if (outcome === 'contacted' || outcome === 'successful_contact') {
        insights.push('successful_contact_pattern');
        
        // Analyze what made this contact successful
        if (feedbackData.profile_characteristics) {
          const characteristics = feedbackData.profile_characteristics;
          
          if (characteristics.industry) {
            insights.push(`successful_industry_${characteristics.industry}`);
          }
          if (characteristics.role) {
            insights.push(`successful_role_${characteristics.role}`);
          }
          if (characteristics.company_size) {
            insights.push(`successful_company_size_${characteristics.company_size}`);
          }
        }
      } else if (outcome === 'no_response' || outcome === 'unsuccessful') {
        insights.push('unsuccessful_contact_pattern');
      }
    }
    
    // Extract response time patterns
    if (feedbackData.response_time_days) {
      const responseDays = feedbackData.response_time_days;
      if (responseDays <= 1) {
        insights.push('quick_response_pattern');
      } else if (responseDays > 7) {
        insights.push('slow_response_pattern');
      }
    }
    
    return insights;
  }

  private async extractCorrectionInsights(interaction: FeedbackInteraction): Promise<string[]> {
    const insights: string[] = [];
    const feedbackData = interaction.feedback_data;
    
    // Extract insights from user corrections to AI predictions
    if (feedbackData.correction_type) {
      const correctionType = feedbackData.correction_type;
      
      if (correctionType === 'relevance_score') {
        insights.push('relevance_scoring_correction');
        
        // Learn from the specific correction
        if (feedbackData.predicted_score && feedbackData.actual_score) {
          const scoreDiff = Math.abs(feedbackData.predicted_score - feedbackData.actual_score);
          if (scoreDiff > 0.3) {
            insights.push('significant_relevance_correction');
          }
        }
      }
      
      if (correctionType === 'industry_classification') {
        insights.push('industry_classification_correction');
        if (feedbackData.correct_industry) {
          insights.push(`industry_correction_to_${feedbackData.correct_industry}`);
        }
      }
      
      if (correctionType === 'role_classification') {
        insights.push('role_classification_correction');
        if (feedbackData.correct_role) {
          insights.push(`role_correction_to_${feedbackData.correct_role}`);
        }
      }
    }
    
    // Extract pattern strength adjustments
    if (feedbackData.pattern_strength_adjustment) {
      const adjustment = feedbackData.pattern_strength_adjustment;
      if (adjustment > 0) {
        insights.push('pattern_strength_increase');
      } else {
        insights.push('pattern_strength_decrease');
      }
    }
    
    return insights;
  }

  private calculateConfidenceImpact(interaction: FeedbackInteraction, insights: string[]): number {
    // Calculate how much this interaction improves confidence
    return interaction.learning_value * insights.length * 0.1;
  }

  private aggregateUserLearning(updates: any[]): any {
    // Aggregate multiple learning updates for a single user
    return {
      behaviorAnalysis: {},
      sessionData: [],
      feedbackData: []
    };
  }

  private groupInteractionsByUser(interactions: FeedbackInteraction[]): Map<string, FeedbackInteraction[]> {
    const groups = new Map<string, FeedbackInteraction[]>();
    
    interactions.forEach(interaction => {
      const userId = interaction.user_id;
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)!.push(interaction);
    });

    return groups;
  }

  private async generateUserInsightsFromBatch(userId: string, interactions: FeedbackInteraction[]): Promise<LearningInsight[]> {
    // Generate insights for a user from a batch of their interactions
    return [];
  }

  private groupByType(stats: any[]): Record<string, number> {
    return stats.reduce((acc, stat) => {
      acc[stat.interaction_type] = (acc[stat.interaction_type] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateDailyTrend(processed: any[], days: number): number[] {
    const dailyCounts = new Array(days).fill(0);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    processed.forEach(item => {
      const itemDate = new Date(item.created_at);
      const dayIndex = Math.floor((itemDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < days) {
        dailyCounts[dayIndex]++;
      }
    });

    return dailyCounts;
  }

  private calculateBacklogAge(unprocessed: any[]): number {
    if (unprocessed.length === 0) return 0;
    
    const now = new Date();
    const ages = unprocessed.map(item => (now.getTime() - new Date(item.created_at).getTime()) / (60 * 60 * 1000)); // hours
    
    return Math.max(...ages);
  }
}

export default LearningDataProcessor;