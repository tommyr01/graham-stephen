/**
 * Personalization Agent - Autonomous AI agent for customizing user experience
 * 
 * This agent continuously learns user preferences and automatically personalizes
 * the research experience, interface, and recommendations for each individual user.
 */

import { supabase } from '@/lib/supabase';
import UserIntelligenceProfileService from '../user-intelligence-profile-service';
import type { 
  UserIntelligenceProfile,
  ResearchSessionIntelligence,
  FeedbackInteraction,
  APIResponse,
  LearningInsight,
  AgentImprovement
} from '@/lib/types/intelligence';

interface PersonalizationConfig {
  learning_rate: number;
  personalization_threshold: number;
  min_sessions_for_personalization: number;
  adaptation_speed: 'conservative' | 'balanced' | 'aggressive';
  auto_apply_personalizations: boolean;
  cross_user_learning: boolean;
}

interface PersonalizationSession {
  id: string;
  started_at: Date;
  completed_at: Date | null;
  users_processed: number;
  personalizations_created: number;
  personalizations_applied: number;
  adaptation_improvements: number;
  agent_version: string;
}

interface PersonalizationRule {
  id: string;
  user_id: string;
  rule_type: 'interface_preference' | 'content_priority' | 'analysis_depth' | 'timing_optimization' | 'industry_focus';
  rule_data: Record<string, any>;
  confidence_score: number;
  impact_score: number;
  created_from_sessions: number;
  last_validation: Date | null;
  effectiveness_score: number;
}

interface UserPersonalizationProfile {
  user_id: string;
  interface_preferences: Record<string, any>;
  content_priorities: Record<string, number>;
  research_patterns: Record<string, any>;
  success_indicators: Record<string, any>;
  timing_preferences: Record<string, any>;
  industry_specializations: string[];
  personalization_confidence: number;
  last_updated: Date;
}

const DEFAULT_CONFIG: PersonalizationConfig = {
  learning_rate: 0.1,
  personalization_threshold: 0.7,
  min_sessions_for_personalization: 8,
  adaptation_speed: 'balanced',
  auto_apply_personalizations: true,
  cross_user_learning: true
};

export class PersonalizationAgent {
  private config: PersonalizationConfig;
  private profileService: UserIntelligenceProfileService;
  private agentVersion = '2.0.0';
  private isRunning = false;
  private lastRunTime: Date | null = null;

  constructor(config: Partial<PersonalizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.profileService = new UserIntelligenceProfileService();
  }

  /**
   * Main autonomous personalization process
   */
  async runPersonalizationProcess(): Promise<{
    session: PersonalizationSession;
    personalizations: PersonalizationRule[];
    user_profiles_updated: UserPersonalizationProfile[];
    insights: LearningInsight[];
    cross_user_patterns: Record<string, any>;
  }> {
    if (this.isRunning) {
      throw new Error('Personalization Agent is already running');
    }

    this.isRunning = true;
    const sessionId = `personalization_${Date.now()}`;
    const startTime = Date.now();

    console.log(`🎯 Personalization Agent ${this.agentVersion} starting session ${sessionId}`);

    try {
      const session: PersonalizationSession = {
        id: sessionId,
        started_at: new Date(),
        completed_at: null,
        users_processed: 0,
        personalizations_created: 0,
        personalizations_applied: 0,
        adaptation_improvements: 0,
        agent_version: this.agentVersion
      };

      // Get users ready for personalization analysis
      const eligibleUsers = await this.getEligibleUsersForPersonalization();
      session.users_processed = eligibleUsers.length;

      // Generate personalizations for each user
      const allPersonalizations: PersonalizationRule[] = [];
      const updatedProfiles: UserPersonalizationProfile[] = [];

      for (const userId of eligibleUsers) {
        try {
          const userPersonalizations = await this.generateUserPersonalizations(userId);
          allPersonalizations.push(...userPersonalizations);

          const updatedProfile = await this.updateUserPersonalizationProfile(userId, userPersonalizations);
          updatedProfiles.push(updatedProfile);

          if (this.config.auto_apply_personalizations) {
            const applied = await this.applyPersonalizations(userId, userPersonalizations);
            session.personalizations_applied += applied;
          }
        } catch (error) {
          console.warn(`Failed to personalize for user ${userId}:`, error);
        }
      }

      session.personalizations_created = allPersonalizations.length;

      // Discover cross-user patterns if enabled
      let crossUserPatterns = {};
      if (this.config.cross_user_learning) {
        crossUserPatterns = await this.discoverCrossUserPatterns(allPersonalizations);
      }

      // Generate insights from personalization analysis
      const insights = await this.generatePersonalizationInsights(
        allPersonalizations, 
        updatedProfiles, 
        crossUserPatterns
      );

      // Complete session
      session.completed_at = new Date();
      await this.storePersonalizationSession(session, allPersonalizations, insights);

      this.lastRunTime = new Date();
      console.log(`✅ Personalization session completed: ${allPersonalizations.length} personalizations for ${eligibleUsers.length} users`);

      return {
        session,
        personalizations: allPersonalizations,
        user_profiles_updated: updatedProfiles,
        insights,
        cross_user_patterns: crossUserPatterns
      };

    } catch (error) {
      console.error('❌ Personalization Agent error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate personalized recommendations for a specific user
   */
  async generatePersonalizedRecommendations(userId: string): Promise<{
    interface_recommendations: Record<string, any>;
    content_recommendations: Record<string, any>;
    timing_recommendations: Record<string, any>;
    search_recommendations: Record<string, any>;
    confidence_score: number;
  }> {
    console.log(`🔍 Generating personalized recommendations for user ${userId}`);

    try {
      // Get user's research patterns
      const userProfile = await this.profileService.getProfile(userId);
      const recentSessions = await this.getUserRecentSessions(userId, 30);
      const userBehavior = await this.profileService.getBehaviorSummary(userId, 30);

      // Generate interface personalization recommendations
      const interfaceRecommendations = this.generateInterfaceRecommendations(recentSessions, userBehavior);

      // Generate content prioritization recommendations
      const contentRecommendations = this.generateContentRecommendations(userProfile, recentSessions);

      // Generate optimal timing recommendations
      const timingRecommendations = this.generateTimingRecommendations(recentSessions, userBehavior);

      // Generate search and filtering recommendations
      const searchRecommendations = this.generateSearchRecommendations(userProfile, recentSessions);

      // Calculate overall confidence in recommendations
      const confidenceScore = this.calculateRecommendationConfidence(
        userProfile, 
        recentSessions.length, 
        userBehavior
      );

      return {
        interface_recommendations: interfaceRecommendations,
        content_recommendations: contentRecommendations,
        timing_recommendations: timingRecommendations,
        search_recommendations: searchRecommendations,
        confidence_score: confidenceScore
      };

    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Adapt user interface based on usage patterns
   */
  async adaptUserInterface(userId: string): Promise<{
    interface_adaptations: Record<string, any>;
    layout_optimizations: Record<string, any>;
    feature_prioritizations: Record<string, any>;
    accessibility_adjustments: Record<string, any>;
    effectiveness_prediction: number;
  }> {
    console.log(`🎨 Adapting user interface for user ${userId}`);

    try {
      // Analyze user interaction patterns
      const interactionPatterns = await this.analyzeUserInteractionPatterns(userId);

      // Generate interface adaptations
      const interfaceAdaptations = this.generateInterfaceAdaptations(interactionPatterns);

      // Optimize layout based on usage
      const layoutOptimizations = this.generateLayoutOptimizations(interactionPatterns);

      // Prioritize features based on usage frequency
      const featurePrioritizations = this.generateFeaturePrioritizations(interactionPatterns);

      // Adjust for accessibility based on behavior patterns
      const accessibilityAdjustments = this.generateAccessibilityAdjustments(interactionPatterns);

      // Predict effectiveness of adaptations
      const effectivenessPrediction = this.predictAdaptationEffectiveness(
        interfaceAdaptations,
        layoutOptimizations,
        featurePrioritizations
      );

      return {
        interface_adaptations: interfaceAdaptations,
        layout_optimizations: layoutOptimizations,
        feature_prioritizations: featurePrioritizations,
        accessibility_adjustments: accessibilityAdjustments,
        effectiveness_prediction: effectivenessPrediction
      };

    } catch (error) {
      console.error('Error adapting user interface:', error);
      throw error;
    }
  }

  /**
   * Optimize content delivery for individual users
   */
  async optimizeContentDelivery(userId: string): Promise<{
    content_prioritization: Record<string, number>;
    information_density: 'minimal' | 'moderate' | 'detailed' | 'comprehensive';
    visualization_preferences: Record<string, any>;
    interaction_style: 'guided' | 'semi_autonomous' | 'autonomous';
    delivery_optimization_score: number;
  }> {
    console.log(`📊 Optimizing content delivery for user ${userId}`);

    try {
      const userProfile = await this.profileService.getProfile(userId);
      const recentSessions = await this.getUserRecentSessions(userId, 20);
      const feedbackHistory = await this.getUserFeedbackHistory(userId, 30);

      // Analyze content consumption patterns
      const contentPatterns = this.analyzeContentConsumption(recentSessions, feedbackHistory);

      // Determine optimal information density
      const informationDensity = this.determineOptimalInformationDensity(contentPatterns);

      // Identify visualization preferences
      const visualizationPreferences = this.identifyVisualizationPreferences(contentPatterns);

      // Determine preferred interaction style
      const interactionStyle = this.determineInteractionStyle(contentPatterns, userProfile);

      // Prioritize content types
      const contentPrioritization = this.generateContentPrioritization(contentPatterns, userProfile);

      // Calculate optimization score
      const optimizationScore = this.calculateContentOptimizationScore(
        contentPatterns,
        informationDensity,
        visualizationPreferences,
        interactionStyle
      );

      return {
        content_prioritization: contentPrioritization,
        information_density: informationDensity,
        visualization_preferences: visualizationPreferences,
        interaction_style: interactionStyle,
        delivery_optimization_score: optimizationScore
      };

    } catch (error) {
      console.error('Error optimizing content delivery:', error);
      throw error;
    }
  }

  // Private methods

  private async getEligibleUsersForPersonalization(): Promise<string[]> {
    const { data: users } = await supabase
      .from('user_intelligence_profiles')
      .select('user_id, total_research_sessions, last_pattern_update')
      .gte('total_research_sessions', this.config.min_sessions_for_personalization)
      .gte('last_pattern_update', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(50); // Process max 50 users per run

    return users?.map(u => u.user_id) || [];
  }

  private async generateUserPersonalizations(userId: string): Promise<PersonalizationRule[]> {
    const personalizations: PersonalizationRule[] = [];

    try {
      const userProfile = await this.profileService.getProfile(userId);
      const recentSessions = await this.getUserRecentSessions(userId, 30);
      const feedbackHistory = await this.getUserFeedbackHistory(userId, 30);

      // Generate interface preference personalizations
      const interfacePrefs = this.analyzeInterfacePreferences(recentSessions, feedbackHistory);
      if (interfacePrefs.confidence > this.config.personalization_threshold) {
        personalizations.push({
          id: `interface_${userId}_${Date.now()}`,
          user_id: userId,
          rule_type: 'interface_preference',
          rule_data: interfacePrefs.preferences,
          confidence_score: interfacePrefs.confidence,
          impact_score: interfacePrefs.impact,
          created_from_sessions: recentSessions.length,
          last_validation: null,
          effectiveness_score: 0
        });
      }

      // Generate content priority personalizations
      const contentPriorities = this.analyzeContentPriorities(userProfile, recentSessions);
      if (contentPriorities.confidence > this.config.personalization_threshold) {
        personalizations.push({
          id: `content_${userId}_${Date.now()}`,
          user_id: userId,
          rule_type: 'content_priority',
          rule_data: contentPriorities.priorities,
          confidence_score: contentPriorities.confidence,
          impact_score: contentPriorities.impact,
          created_from_sessions: recentSessions.length,
          last_validation: null,
          effectiveness_score: 0
        });
      }

      // Generate analysis depth personalizations
      const analysisDepth = this.analyzePreferredAnalysisDepth(recentSessions, feedbackHistory);
      if (analysisDepth.confidence > this.config.personalization_threshold) {
        personalizations.push({
          id: `analysis_${userId}_${Date.now()}`,
          user_id: userId,
          rule_type: 'analysis_depth',
          rule_data: analysisDepth.settings,
          confidence_score: analysisDepth.confidence,
          impact_score: analysisDepth.impact,
          created_from_sessions: recentSessions.length,
          last_validation: null,
          effectiveness_score: 0
        });
      }

      // Generate timing optimization personalizations
      const timingOptimization = this.analyzeOptimalTiming(recentSessions);
      if (timingOptimization.confidence > this.config.personalization_threshold) {
        personalizations.push({
          id: `timing_${userId}_${Date.now()}`,
          user_id: userId,
          rule_type: 'timing_optimization',
          rule_data: timingOptimization.settings,
          confidence_score: timingOptimization.confidence,
          impact_score: timingOptimization.impact,
          created_from_sessions: recentSessions.length,
          last_validation: null,
          effectiveness_score: 0
        });
      }

      // Generate industry focus personalizations
      const industryFocus = this.analyzeIndustryFocus(userProfile, recentSessions);
      if (industryFocus.confidence > this.config.personalization_threshold) {
        personalizations.push({
          id: `industry_${userId}_${Date.now()}`,
          user_id: userId,
          rule_type: 'industry_focus',
          rule_data: industryFocus.settings,
          confidence_score: industryFocus.confidence,
          impact_score: industryFocus.impact,
          created_from_sessions: recentSessions.length,
          last_validation: null,
          effectiveness_score: 0
        });
      }

    } catch (error) {
      console.error(`Error generating personalizations for user ${userId}:`, error);
    }

    return personalizations;
  }

  private async updateUserPersonalizationProfile(
    userId: string, 
    personalizations: PersonalizationRule[]
  ): Promise<UserPersonalizationProfile> {
    // Aggregate personalization data into a profile
    const profile: UserPersonalizationProfile = {
      user_id: userId,
      interface_preferences: {},
      content_priorities: {},
      research_patterns: {},
      success_indicators: {},
      timing_preferences: {},
      industry_specializations: [],
      personalization_confidence: 0,
      last_updated: new Date()
    };

    for (const rule of personalizations) {
      switch (rule.rule_type) {
        case 'interface_preference':
          profile.interface_preferences = { ...profile.interface_preferences, ...rule.rule_data };
          break;
        case 'content_priority':
          profile.content_priorities = { ...profile.content_priorities, ...rule.rule_data };
          break;
        case 'timing_optimization':
          profile.timing_preferences = { ...profile.timing_preferences, ...rule.rule_data };
          break;
        case 'industry_focus':
          profile.industry_specializations.push(...(rule.rule_data.industries || []));
          break;
      }
    }

    // Calculate overall personalization confidence
    profile.personalization_confidence = personalizations.length > 0 
      ? personalizations.reduce((sum, p) => sum + p.confidence_score, 0) / personalizations.length
      : 0;

    // Store the profile
    await supabase
      .from('user_personalization_profiles')
      .upsert({
        user_id: userId,
        profile_data: profile,
        personalization_confidence: profile.personalization_confidence,
        last_updated: profile.last_updated
      }, {
        onConflict: 'user_id'
      });

    return profile;
  }

  private async applyPersonalizations(userId: string, personalizations: PersonalizationRule[]): Promise<number> {
    let appliedCount = 0;

    for (const rule of personalizations) {
      try {
        // Store personalization rule for application
        await supabase
          .from('user_personalization_rules')
          .upsert({
            id: rule.id,
            user_id: rule.user_id,
            rule_type: rule.rule_type,
            rule_data: rule.rule_data,
            confidence_score: rule.confidence_score,
            impact_score: rule.impact_score,
            is_active: true,
            created_from_sessions: rule.created_from_sessions,
            created_at: new Date()
          }, {
            onConflict: 'id'
          });

        appliedCount++;
      } catch (error) {
        console.warn(`Failed to apply personalization rule ${rule.id}:`, error);
      }
    }

    return appliedCount;
  }

  private async discoverCrossUserPatterns(personalizations: PersonalizationRule[]): Promise<Record<string, any>> {
    // Group personalizations by type and analyze patterns
    const patternsByType: Record<string, PersonalizationRule[]> = {};
    personalizations.forEach(p => {
      if (!patternsByType[p.rule_type]) patternsByType[p.rule_type] = [];
      patternsByType[p.rule_type].push(p);
    });

    const crossUserPatterns: Record<string, any> = {};

    for (const [type, rules] of Object.entries(patternsByType)) {
      if (rules.length < 3) continue; // Need minimum rules for pattern analysis

      crossUserPatterns[type] = {
        total_users: new Set(rules.map(r => r.user_id)).size,
        average_confidence: rules.reduce((sum, r) => sum + r.confidence_score, 0) / rules.length,
        common_patterns: this.extractCommonPatterns(rules),
        trend_analysis: this.analyzeTrends(rules)
      };
    }

    return crossUserPatterns;
  }

  // Helper analysis methods (simplified implementations)

  private async getUserRecentSessions(userId: string, days: number): Promise<ResearchSessionIntelligence[]> {
    const { data: sessions } = await supabase
      .from('research_session_intelligence')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    return sessions || [];
  }

  private async getUserFeedbackHistory(userId: string, days: number): Promise<FeedbackInteraction[]> {
    const { data: feedback } = await supabase
      .from('feedback_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    return feedback || [];
  }

  private analyzeInterfacePreferences(sessions: ResearchSessionIntelligence[], feedback: FeedbackInteraction[]): any {
    // Mock implementation - would analyze UI interaction patterns
    return {
      preferences: {
        layout_density: 'moderate',
        information_display: 'structured',
        navigation_style: 'sidebar'
      },
      confidence: 0.75,
      impact: 0.8
    };
  }

  private analyzeContentPriorities(profile: UserIntelligenceProfile, sessions: ResearchSessionIntelligence[]): any {
    // Mock implementation - would analyze what content sections users focus on
    return {
      priorities: {
        professional_experience: 0.9,
        education: 0.7,
        industry_context: 0.8,
        network_analysis: 0.6
      },
      confidence: 0.82,
      impact: 0.75
    };
  }

  private analyzePreferredAnalysisDepth(sessions: ResearchSessionIntelligence[], feedback: FeedbackInteraction[]): any {
    // Mock implementation - would analyze preferred depth of analysis
    return {
      settings: {
        detail_level: 'comprehensive',
        reasoning_verbosity: 'detailed',
        confidence_display: 'always_show'
      },
      confidence: 0.78,
      impact: 0.7
    };
  }

  private analyzeOptimalTiming(sessions: ResearchSessionIntelligence[]): any {
    // Analyze when user is most productive
    const hourlySuccess: Record<number, number> = {};
    sessions.forEach(s => {
      const hour = new Date(s.created_at).getHours();
      if (!hourlySuccess[hour]) hourlySuccess[hour] = 0;
      if (s.session_outcome === 'contacted') hourlySuccess[hour]++;
    });

    const bestHours = Object.entries(hourlySuccess)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      settings: {
        optimal_hours: bestHours,
        productivity_pattern: 'morning_focused' // Mock
      },
      confidence: 0.73,
      impact: 0.65
    };
  }

  private analyzeIndustryFocus(profile: UserIntelligenceProfile, sessions: ResearchSessionIntelligence[]): any {
    return {
      settings: {
        industries: profile.industry_focus,
        specialization_level: 'moderate'
      },
      confidence: profile.industry_focus.length > 0 ? 0.8 : 0.4,
      impact: 0.85
    };
  }

  // Additional helper methods (simplified)
  private generateInterfaceRecommendations(sessions: ResearchSessionIntelligence[], behavior: any): Record<string, any> {
    return {
      layout: 'compact',
      theme: 'professional',
      sidebar_position: 'left',
      information_cards: 'expandable'
    };
  }

  private generateContentRecommendations(profile: UserIntelligenceProfile, sessions: ResearchSessionIntelligence[]): Record<string, any> {
    return {
      priority_sections: ['experience', 'education', 'skills'],
      detail_level: 'high',
      analysis_focus: 'comprehensive'
    };
  }

  private generateTimingRecommendations(sessions: ResearchSessionIntelligence[], behavior: any): Record<string, any> {
    return {
      optimal_research_times: ['09:00', '14:00', '16:00'],
      session_duration_target: 180, // seconds
      break_reminders: true
    };
  }

  private generateSearchRecommendations(profile: UserIntelligenceProfile, sessions: ResearchSessionIntelligence[]): Record<string, any> {
    return {
      default_filters: profile.industry_focus,
      search_scope: 'focused',
      result_ranking: 'relevance_first'
    };
  }

  private calculateRecommendationConfidence(profile: UserIntelligenceProfile, sessionCount: number, behavior: any): number {
    const baseConfidence = Math.min(1, sessionCount / 20);
    const profileConfidence = profile.learning_confidence;
    return (baseConfidence + profileConfidence) / 2;
  }

  // More helper methods would be implemented here...
  
  private analyzeUserInteractionPatterns(userId: string): Promise<any> {
    return Promise.resolve({
      click_patterns: {},
      navigation_flow: {},
      feature_usage: {},
      session_patterns: {}
    });
  }

  private generateInterfaceAdaptations(patterns: any): Record<string, any> {
    return {
      layout_adjustments: {},
      component_positioning: {},
      interaction_optimization: {}
    };
  }

  private generateLayoutOptimizations(patterns: any): Record<string, any> {
    return {
      grid_layout: 'optimized',
      spacing_adjustments: 'comfortable',
      visual_hierarchy: 'enhanced'
    };
  }

  private generateFeaturePrioritizations(patterns: any): Record<string, any> {
    return {
      primary_features: [],
      secondary_features: [],
      hidden_features: []
    };
  }

  private generateAccessibilityAdjustments(patterns: any): Record<string, any> {
    return {
      font_size: 'standard',
      contrast: 'normal',
      keyboard_navigation: 'enhanced'
    };
  }

  private predictAdaptationEffectiveness(
    interfaceAdaptations: Record<string, any>,
    layout: Record<string, any>,
    features: Record<string, any>
  ): number {
    return 0.78; // Mock prediction
  }

  private analyzeContentConsumption(sessions: ResearchSessionIntelligence[], feedback: FeedbackInteraction[]): any {
    return {
      reading_speed: 'moderate',
      information_depth_preference: 'detailed',
      visual_vs_text: 'balanced'
    };
  }

  private determineOptimalInformationDensity(patterns: any): 'minimal' | 'moderate' | 'detailed' | 'comprehensive' {
    return 'detailed';
  }

  private identifyVisualizationPreferences(patterns: any): Record<string, any> {
    return {
      charts: 'preferred',
      tables: 'moderate',
      graphs: 'preferred',
      text_heavy: 'acceptable'
    };
  }

  private determineInteractionStyle(patterns: any, profile: UserIntelligenceProfile): 'guided' | 'semi_autonomous' | 'autonomous' {
    return profile.total_research_sessions > 50 ? 'autonomous' : 'semi_autonomous';
  }

  private generateContentPrioritization(patterns: any, profile: UserIntelligenceProfile): Record<string, number> {
    return {
      professional_summary: 0.9,
      experience_details: 0.8,
      education: 0.7,
      skills_analysis: 0.85,
      network_insights: 0.75
    };
  }

  private calculateContentOptimizationScore(
    patterns: any,
    density: string,
    viz: Record<string, any>,
    style: string
  ): number {
    return 0.82; // Mock calculation
  }

  private extractCommonPatterns(rules: PersonalizationRule[]): any {
    return {
      common_preferences: {},
      trend_indicators: {},
      outliers: []
    };
  }

  private analyzeTrends(rules: PersonalizationRule[]): any {
    return {
      growth_trends: {},
      preference_shifts: {},
      adoption_patterns: {}
    };
  }

  private async generatePersonalizationInsights(
    personalizations: PersonalizationRule[],
    profiles: UserPersonalizationProfile[],
    crossUserPatterns: Record<string, any>
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    if (personalizations.length > 0) {
      const avgConfidence = personalizations.reduce((sum, p) => sum + p.confidence_score, 0) / personalizations.length;
      
      insights.push({
        type: 'efficiency_improvement',
        title: 'User Personalization Analysis Complete',
        description: `Generated ${personalizations.length} personalization rules with average confidence of ${(avgConfidence * 100).toFixed(1)}%`,
        confidence: avgConfidence,
        actionable: true,
        suggestion: 'Apply high-confidence personalizations to improve user experience',
        created_at: new Date()
      });
    }

    return insights;
  }

  private async storePersonalizationSession(
    session: PersonalizationSession,
    personalizations: PersonalizationRule[],
    insights: LearningInsight[]
  ): Promise<void> {
    try {
      await supabase
        .from('agent_personalization_sessions')
        .insert({
          session_id: session.id,
          agent_name: 'personalization_agent',
          agent_version: session.agent_version,
          started_at: session.started_at,
          completed_at: session.completed_at,
          users_processed: session.users_processed,
          personalizations_created: session.personalizations_created,
          personalizations_applied: session.personalizations_applied,
          adaptation_improvements: session.adaptation_improvements,
          session_data: {
            personalizations: personalizations.map(p => ({
              type: p.rule_type,
              confidence: p.confidence_score,
              impact: p.impact_score
            })),
            insights: insights.map(i => ({
              type: i.type,
              title: i.title,
              confidence: i.confidence
            }))
          }
        });

      console.log(`📊 Stored personalization session ${session.id}`);
    } catch (error) {
      console.error('Failed to store personalization session:', error);
    }
  }
}

export default PersonalizationAgent;