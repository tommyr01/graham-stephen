/**
 * Pattern Discovery Engine - Core ML algorithms for finding patterns in user behavior
 * 
 * This service analyzes user feedback interactions and research sessions to discover
 * actionable insights and behavioral patterns that improve research effectiveness.
 */

import { supabase } from '@/lib/supabase';
import type { 
  PatternDiscoveryResult, 
  UserBehaviorData, 
  IndustryPattern,
  TimingPattern,
  SuccessIndicator,
  EngagementSignal,
  QualityIndicator,
  ContextPattern
} from '@/lib/types/intelligence';

interface PatternAnalysisConfig {
  minSupportingSessions: number;
  minConfidenceScore: number;
  lookbackDays: number;
  significanceThreshold: number;
  batchSize: number;
}

const DEFAULT_CONFIG: PatternAnalysisConfig = {
  minSupportingSessions: 5,
  minConfidenceScore: 0.6,
  lookbackDays: 30,
  significanceThreshold: 0.05,
  batchSize: 1000
};

export class PatternDiscoveryEngine {
  private config: PatternAnalysisConfig;

  constructor(config: Partial<PatternAnalysisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main pattern discovery orchestrator - discovers all types of patterns
   */
  async discoverPatterns(userId?: string): Promise<PatternDiscoveryResult[]> {
    console.log(`Starting pattern discovery${userId ? ` for user ${userId}` : ' globally'}`);
    
    const results: PatternDiscoveryResult[] = [];
    
    try {
      // Run all pattern discovery algorithms in parallel
      const [
        userPreferences,
        industrySignals,
        timingPatterns,
        successIndicators,
        engagementSignals,
        qualityIndicators,
        contextPatterns
      ] = await Promise.all([
        this.discoverUserPreferencePatterns(userId),
        this.discoverIndustrySignalPatterns(userId),
        this.discoverTimingPatterns(userId),
        this.discoverSuccessIndicators(userId),
        this.discoverEngagementSignals(userId),
        this.discoverQualityIndicators(userId),
        this.discoverContextPatterns(userId)
      ]);

      results.push(...userPreferences, ...industrySignals, ...timingPatterns, 
                  ...successIndicators, ...engagementSignals, ...qualityIndicators, ...contextPatterns);

      console.log(`Pattern discovery completed. Found ${results.length} patterns.`);
      return results;
    } catch (error) {
      console.error('Error in pattern discovery:', error);
      throw new Error('Failed to discover patterns');
    }
  }

  /**
   * Discovers individual user preference patterns
   */
  private async discoverUserPreferencePatterns(userId?: string): Promise<PatternDiscoveryResult[]> {
    const query = supabase
      .from('research_session_intelligence')
      .select(`
        user_id,
        profile_data,
        session_outcome,
        session_duration,
        confidence_level,
        relevance_rating,
        research_context,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000).toISOString())
      .not('session_outcome', 'is', null);

    if (userId) {
      query.eq('user_id', userId);
    }

    const { data: sessions, error } = await query.limit(this.config.batchSize);
    
    if (error) {
      console.error('Error fetching session data:', error);
      return [];
    }

    if (!sessions || sessions.length < this.config.minSupportingSessions) {
      return [];
    }

    const patterns: PatternDiscoveryResult[] = [];

    // Group sessions by user
    const userSessions = this.groupSessionsByUser(sessions);

    for (const [currentUserId, userSessionData] of Object.entries(userSessions)) {
      // Discover industry preferences
      const industryPattern = this.analyzeIndustryPreferences(currentUserId, userSessionData);
      if (industryPattern) patterns.push(industryPattern);

      // Discover company size preferences
      const companySizePattern = this.analyzeCompanySizePreferences(currentUserId, userSessionData);
      if (companySizePattern) patterns.push(companySizePattern);

      // Discover seniority preferences
      const seniorityPattern = this.analyzeSeniorityPreferences(currentUserId, userSessionData);
      if (seniorityPattern) patterns.push(seniorityPattern);

      // Discover location preferences
      const locationPattern = this.analyzeLocationPreferences(currentUserId, userSessionData);
      if (locationPattern) patterns.push(locationPattern);
    }

    return patterns;
  }

  /**
   * Discovers industry-specific signal patterns
   */
  private async discoverIndustrySignalPatterns(userId?: string): Promise<PatternDiscoveryResult[]> {
    const query = supabase
      .from('feedback_interactions')
      .select(`
        user_id,
        feedback_data,
        interaction_type,
        learning_value,
        created_at,
        research_session_intelligence!inner (
          profile_data,
          session_outcome,
          confidence_level
        )
      `)
      .eq('interaction_type', 'explicit_rating')
      .gte('created_at', new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000).toISOString());

    if (userId) {
      query.eq('user_id', userId);
    }

    const { data: interactions, error } = await query.limit(this.config.batchSize);
    
    if (error || !interactions) return [];

    // Analyze by industry patterns
    const industryData = this.groupInteractionsByIndustry(interactions);
    const patterns: PatternDiscoveryResult[] = [];

    for (const [industry, data] of Object.entries(industryData)) {
      if (data.length < this.config.minSupportingSessions) continue;

      const successRate = data.filter(d => d.outcome === 'contacted').length / data.length;
      const avgConfidence = data.reduce((sum, d) => sum + (d.confidence || 0), 0) / data.length;

      if (successRate > 0.7 && avgConfidence > 7) {
        patterns.push({
          pattern_type: 'industry_signal',
          pattern_name: `High Success Rate in ${industry}`,
          pattern_description: `Users show consistently high success rates when researching ${industry} profiles`,
          pattern_data: {
            industry,
            success_rate: successRate,
            average_confidence: avgConfidence,
            supporting_interactions: data.length
          },
          trigger_conditions: {
            profile_industry: industry
          },
          expected_outcome: 'High likelihood of successful contact',
          confidence_score: Math.min(0.95, successRate * 0.8 + avgConfidence * 0.02),
          supporting_sessions: data.length,
          discovery_method: 'industry_success_correlation',
          applies_to_users: userId ? [userId] : [],
          applies_to_industries: [industry]
        });
      }
    }

    return patterns;
  }

  /**
   * Discovers timing-based behavioral patterns
   */
  private async discoverTimingPatterns(userId?: string): Promise<PatternDiscoveryResult[]> {
    const query = supabase
      .from('research_session_intelligence')
      .select(`
        user_id,
        session_duration,
        profile_view_time,
        session_outcome,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000).toISOString())
      .not('session_outcome', 'is', null);

    if (userId) {
      query.eq('user_id', userId);
    }

    const { data: sessions, error } = await query.limit(this.config.batchSize);
    
    if (error || !sessions) return [];

    const patterns: PatternDiscoveryResult[] = [];
    const userSessions = this.groupSessionsByUser(sessions);

    for (const [currentUserId, userSessionData] of Object.entries(userSessions)) {
      // Analyze optimal research times
      const timePattern = this.analyzeOptimalResearchTimes(currentUserId, userSessionData);
      if (timePattern) patterns.push(timePattern);

      // Analyze session duration patterns
      const durationPattern = this.analyzeOptimalSessionDuration(currentUserId, userSessionData);
      if (durationPattern) patterns.push(durationPattern);
    }

    return patterns;
  }

  /**
   * Discovers success indicator patterns
   */
  private async discoverSuccessIndicators(userId?: string): Promise<PatternDiscoveryResult[]> {
    const { data: sessions, error } = await supabase
      .from('research_session_intelligence')
      .select(`
        user_id,
        profile_data,
        session_outcome,
        confidence_level,
        relevance_rating,
        session_duration,
        sections_viewed,
        sections_expanded,
        click_patterns,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000).toISOString())
      .in('session_outcome', ['contacted', 'skipped']);

    if (error || !sessions) return [];

    const patterns: PatternDiscoveryResult[] = [];
    
    // Analyze successful vs unsuccessful sessions
    const successfulSessions = sessions.filter(s => s.session_outcome === 'contacted');
    const unsuccessfulSessions = sessions.filter(s => s.session_outcome === 'skipped');

    if (successfulSessions.length < this.config.minSupportingSessions) {
      return patterns;
    }

    // Pattern: Section viewing behavior that predicts success
    const successSectionPattern = this.analyzeSectionViewingSuccess(
      successfulSessions, 
      unsuccessfulSessions, 
      userId
    );
    if (successSectionPattern) patterns.push(successSectionPattern);

    // Pattern: Session duration that predicts success
    const durationSuccessPattern = this.analyzeSessionDurationSuccess(
      successfulSessions, 
      unsuccessfulSessions, 
      userId
    );
    if (durationSuccessPattern) patterns.push(durationSuccessPattern);

    return patterns;
  }

  /**
   * Discovers engagement signal patterns
   */
  private async discoverEngagementSignals(userId?: string): Promise<PatternDiscoveryResult[]> {
    const { data: interactions, error } = await supabase
      .from('feedback_interactions')
      .select(`
        user_id,
        interaction_type,
        feedback_data,
        learning_value,
        created_at,
        research_session_intelligence!inner (
          session_duration,
          profile_view_time,
          sections_viewed,
          click_patterns,
          session_outcome
        )
      `)
      .eq('interaction_type', 'implicit_behavior')
      .gte('created_at', new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000).toISOString());

    if (error || !interactions) return [];

    const patterns: PatternDiscoveryResult[] = [];
    const userInteractions = this.groupInteractionsByUser(interactions);

    for (const [currentUserId, userInteractionData] of Object.entries(userInteractions)) {
      // Analyze engagement indicators
      const engagementPattern = this.analyzeEngagementIndicators(currentUserId, userInteractionData);
      if (engagementPattern) patterns.push(engagementPattern);
    }

    return patterns;
  }

  /**
   * Discovers quality indicator patterns
   */
  private async discoverQualityIndicators(userId?: string): Promise<PatternDiscoveryResult[]> {
    const { data: sessions, error } = await supabase
      .from('research_session_intelligence')
      .select(`
        user_id,
        profile_data,
        relevance_rating,
        confidence_level,
        session_outcome,
        reasoning,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000).toISOString())
      .not('relevance_rating', 'is', null);

    if (error || !sessions) return [];

    const patterns: PatternDiscoveryResult[] = [];
    
    // Analyze what profile characteristics correlate with high relevance ratings
    const qualityPattern = this.analyzeProfileQualityIndicators(sessions, userId);
    if (qualityPattern) patterns.push(qualityPattern);

    return patterns;
  }

  /**
   * Discovers context-based patterns
   */
  private async discoverContextPatterns(userId?: string): Promise<PatternDiscoveryResult[]> {
    const { data: sessions, error } = await supabase
      .from('research_session_intelligence')
      .select(`
        user_id,
        research_context,
        research_goal,
        session_outcome,
        confidence_level,
        profile_data,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000).toISOString())
      .not('research_context', 'is', null);

    if (error || !sessions) return [];

    const patterns: PatternDiscoveryResult[] = [];
    
    // Analyze context-based success patterns
    const contextSuccessPattern = this.analyzeContextBasedSuccess(sessions, userId);
    if (contextSuccessPattern) patterns.push(contextSuccessPattern);

    return patterns;
  }

  // Helper methods for pattern analysis

  private groupSessionsByUser(sessions: any[]): Record<string, any[]> {
    return sessions.reduce((acc, session) => {
      const userId = session.user_id;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(session);
      return acc;
    }, {});
  }

  private groupInteractionsByUser(interactions: any[]): Record<string, any[]> {
    return interactions.reduce((acc, interaction) => {
      const userId = interaction.user_id;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(interaction);
      return acc;
    }, {});
  }

  private groupInteractionsByIndustry(interactions: any[]): Record<string, any[]> {
    return interactions.reduce((acc, interaction) => {
      const profileData = interaction.research_session_intelligence?.profile_data;
      const industry = profileData?.industry || 'Unknown';
      
      if (!acc[industry]) acc[industry] = [];
      acc[industry].push({
        ...interaction,
        outcome: interaction.research_session_intelligence?.session_outcome,
        confidence: interaction.research_session_intelligence?.confidence_level
      });
      return acc;
    }, {});
  }

  private analyzeIndustryPreferences(userId: string, sessions: any[]): PatternDiscoveryResult | null {
    const industryOutcomes: Record<string, { contacted: number; total: number }> = {};
    
    sessions.forEach(session => {
      const industry = session.profile_data?.industry || 'Unknown';
      if (!industryOutcomes[industry]) {
        industryOutcomes[industry] = { contacted: 0, total: 0 };
      }
      industryOutcomes[industry].total++;
      if (session.session_outcome === 'contacted') {
        industryOutcomes[industry].contacted++;
      }
    });

    // Find industries with high success rates
    const preferredIndustries = Object.entries(industryOutcomes)
      .filter(([_, data]) => data.total >= 3 && data.contacted / data.total > 0.6)
      .map(([industry, data]) => ({
        industry,
        success_rate: data.contacted / data.total,
        sample_size: data.total
      }))
      .sort((a, b) => b.success_rate - a.success_rate);

    if (preferredIndustries.length === 0) return null;

    return {
      pattern_type: 'user_preference',
      pattern_name: 'Industry Preference Pattern',
      pattern_description: `User shows preference for ${preferredIndustries.map(p => p.industry).join(', ')} industries`,
      pattern_data: {
        preferred_industries: preferredIndustries,
        analysis_period_days: this.config.lookbackDays
      },
      trigger_conditions: {
        industries: preferredIndustries.map(p => p.industry)
      },
      expected_outcome: 'Higher likelihood of contact',
      confidence_score: Math.min(0.9, preferredIndustries[0].success_rate * 0.8),
      supporting_sessions: preferredIndustries.reduce((sum, p) => sum + p.sample_size, 0),
      discovery_method: 'industry_preference_analysis',
      applies_to_users: [userId],
      applies_to_industries: preferredIndustries.map(p => p.industry)
    };
  }

  private analyzeCompanySizePreferences(userId: string, sessions: any[]): PatternDiscoveryResult | null {
    // Similar analysis for company size preferences
    // Implementation would analyze profile_data for company size indicators
    return null; // Placeholder for now
  }

  private analyzeSeniorityPreferences(userId: string, sessions: any[]): PatternDiscoveryResult | null {
    // Similar analysis for seniority preferences
    // Implementation would analyze profile_data for seniority indicators
    return null; // Placeholder for now
  }

  private analyzeLocationPreferences(userId: string, sessions: any[]): PatternDiscoveryResult | null {
    // Similar analysis for location preferences
    // Implementation would analyze profile_data for location indicators
    return null; // Placeholder for now
  }

  private analyzeOptimalResearchTimes(userId: string, sessions: any[]): PatternDiscoveryResult | null {
    const hourlySuccess: Record<number, { contacted: number; total: number }> = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.created_at).getHours();
      if (!hourlySuccess[hour]) {
        hourlySuccess[hour] = { contacted: 0, total: 0 };
      }
      hourlySuccess[hour].total++;
      if (session.session_outcome === 'contacted') {
        hourlySuccess[hour].contacted++;
      }
    });

    const optimalHours = Object.entries(hourlySuccess)
      .filter(([_, data]) => data.total >= 2 && data.contacted / data.total > 0.6)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        success_rate: data.contacted / data.total,
        sample_size: data.total
      }))
      .sort((a, b) => b.success_rate - a.success_rate);

    if (optimalHours.length === 0) return null;

    return {
      pattern_type: 'timing_pattern',
      pattern_name: 'Optimal Research Time Pattern',
      pattern_description: `User is most successful when researching between ${optimalHours[0].hour}:00-${optimalHours[0].hour + 1}:00`,
      pattern_data: {
        optimal_hours: optimalHours,
        timezone_note: 'Times are in user local timezone'
      },
      trigger_conditions: {
        optimal_hours: optimalHours.map(h => h.hour)
      },
      expected_outcome: 'Higher research effectiveness',
      confidence_score: Math.min(0.8, optimalHours[0].success_rate * 0.7),
      supporting_sessions: optimalHours.reduce((sum, h) => sum + h.sample_size, 0),
      discovery_method: 'temporal_success_analysis',
      applies_to_users: [userId]
    };
  }

  private analyzeOptimalSessionDuration(userId: string, sessions: any[]): PatternDiscoveryResult | null {
    const successfulSessions = sessions.filter(s => s.session_outcome === 'contacted');
    const unsuccessfulSessions = sessions.filter(s => s.session_outcome === 'skipped');

    if (successfulSessions.length < 3 || unsuccessfulSessions.length < 3) return null;

    const avgSuccessfulDuration = successfulSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / successfulSessions.length;
    const avgUnsuccessfulDuration = unsuccessfulSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / unsuccessfulSessions.length;

    // If successful sessions are significantly longer, create a pattern
    if (avgSuccessfulDuration > avgUnsuccessfulDuration * 1.3) {
      return {
        pattern_type: 'timing_pattern',
        pattern_name: 'Optimal Session Duration Pattern',
        pattern_description: `User is more successful with longer research sessions (avg: ${Math.round(avgSuccessfulDuration)}s)`,
        pattern_data: {
          optimal_duration_seconds: avgSuccessfulDuration,
          successful_avg: avgSuccessfulDuration,
          unsuccessful_avg: avgUnsuccessfulDuration,
          improvement_factor: avgSuccessfulDuration / avgUnsuccessfulDuration
        },
        trigger_conditions: {
          min_session_duration: avgSuccessfulDuration * 0.8
        },
        expected_outcome: 'Higher likelihood of contact',
        confidence_score: Math.min(0.8, (avgSuccessfulDuration / avgUnsuccessfulDuration - 1) * 0.5),
        supporting_sessions: successfulSessions.length + unsuccessfulSessions.length,
        discovery_method: 'duration_success_analysis',
        applies_to_users: [userId]
      };
    }

    return null;
  }

  private analyzeSectionViewingSuccess(
    successfulSessions: any[], 
    unsuccessfulSessions: any[], 
    userId?: string
  ): PatternDiscoveryResult | null {
    // Analyze which sections are viewed more in successful sessions
    const successfulSections = successfulSessions
      .flatMap(s => s.sections_viewed || [])
      .reduce((acc, section) => {
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const unsuccessfulSections = unsuccessfulSessions
      .flatMap(s => s.sections_viewed || [])
      .reduce((acc, section) => {
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Find sections that appear significantly more in successful sessions
    const significantSections = Object.entries(successfulSections)
      .filter(([section, count]) => {
        const successRate = count / successfulSessions.length;
        const unsuccessRate = (unsuccessfulSections[section] || 0) / unsuccessfulSessions.length;
        return successRate > unsuccessRate * 1.5 && count >= 3;
      })
      .map(([section, count]) => ({
        section,
        success_frequency: count / successfulSessions.length,
        unsuccess_frequency: (unsuccessfulSections[section] || 0) / unsuccessfulSessions.length
      }));

    if (significantSections.length === 0) return null;

    return {
      pattern_type: 'success_indicator',
      pattern_name: 'Section Viewing Success Pattern',
      pattern_description: `Viewing ${significantSections.map(s => s.section).join(', ')} correlates with successful contacts`,
      pattern_data: {
        predictive_sections: significantSections,
        analysis_basis: {
          successful_sessions: successfulSessions.length,
          unsuccessful_sessions: unsuccessfulSessions.length
        }
      },
      trigger_conditions: {
        required_sections: significantSections.map(s => s.section)
      },
      expected_outcome: 'Higher likelihood of contact',
      confidence_score: Math.min(0.85, significantSections[0].success_frequency * 0.8),
      supporting_sessions: successfulSessions.length + unsuccessfulSessions.length,
      discovery_method: 'section_correlation_analysis',
      applies_to_users: userId ? [userId] : []
    };
  }

  private analyzeSessionDurationSuccess(
    successfulSessions: any[], 
    unsuccessfulSessions: any[], 
    userId?: string
  ): PatternDiscoveryResult | null {
    // This is similar to analyzeOptimalSessionDuration but for global patterns
    return null; // Already handled in timing patterns
  }

  private analyzeEngagementIndicators(userId: string, interactions: any[]): PatternDiscoveryResult | null {
    // Analyze implicit behaviors that indicate high engagement
    const highEngagementBehaviors = interactions.filter(i => {
      const sessionData = i.research_session_intelligence;
      return sessionData?.session_duration > 120 && // More than 2 minutes
             sessionData?.sections_viewed?.length > 3; // Viewed multiple sections
    });

    if (highEngagementBehaviors.length < this.config.minSupportingSessions) return null;

    const engagementSuccessRate = highEngagementBehaviors
      .filter(i => i.research_session_intelligence?.session_outcome === 'contacted')
      .length / highEngagementBehaviors.length;

    if (engagementSuccessRate < 0.6) return null;

    return {
      pattern_type: 'engagement_signal',
      pattern_name: 'High Engagement Success Pattern',
      pattern_description: 'Sessions with high engagement (long duration + multiple sections) lead to more contacts',
      pattern_data: {
        engagement_success_rate: engagementSuccessRate,
        engagement_indicators: {
          min_duration: 120,
          min_sections_viewed: 3
        },
        supporting_behaviors: highEngagementBehaviors.length
      },
      trigger_conditions: {
        session_duration_min: 120,
        sections_viewed_min: 3
      },
      expected_outcome: 'Higher likelihood of contact',
      confidence_score: Math.min(0.8, engagementSuccessRate * 0.9),
      supporting_sessions: highEngagementBehaviors.length,
      discovery_method: 'engagement_correlation_analysis',
      applies_to_users: [userId]
    };
  }

  private analyzeProfileQualityIndicators(sessions: any[], userId?: string): PatternDiscoveryResult | null {
    // Analyze profile characteristics that correlate with high relevance ratings
    const highQualitySessions = sessions.filter(s => s.relevance_rating >= 8);
    
    if (highQualitySessions.length < this.config.minSupportingSessions) return null;

    // Extract common characteristics from high-quality profiles
    const qualityIndicators = this.extractQualityCharacteristics(highQualitySessions);
    
    if (Object.keys(qualityIndicators).length === 0) return null;

    return {
      pattern_type: 'quality_indicator',
      pattern_name: 'Profile Quality Indicator Pattern',
      pattern_description: 'Certain profile characteristics predict high relevance ratings',
      pattern_data: {
        quality_indicators: qualityIndicators,
        high_quality_threshold: 8,
        sample_size: highQualitySessions.length
      },
      trigger_conditions: qualityIndicators,
      expected_outcome: 'High relevance rating',
      confidence_score: Math.min(0.8, highQualitySessions.length / sessions.length * 2),
      supporting_sessions: highQualitySessions.length,
      discovery_method: 'quality_characteristic_analysis',
      applies_to_users: userId ? [userId] : []
    };
  }

  private analyzeContextBasedSuccess(sessions: any[], userId?: string): PatternDiscoveryResult | null {
    const contextSuccess: Record<string, { contacted: number; total: number }> = {};
    
    sessions.forEach(session => {
      const context = session.research_context?.purpose || session.research_goal || 'general';
      if (!contextSuccess[context]) {
        contextSuccess[context] = { contacted: 0, total: 0 };
      }
      contextSuccess[context].total++;
      if (session.session_outcome === 'contacted') {
        contextSuccess[context].contacted++;
      }
    });

    const successfulContexts = Object.entries(contextSuccess)
      .filter(([_, data]) => data.total >= 3 && data.contacted / data.total > 0.7)
      .map(([context, data]) => ({
        context,
        success_rate: data.contacted / data.total,
        sample_size: data.total
      }));

    if (successfulContexts.length === 0) return null;

    return {
      pattern_type: 'context_pattern',
      pattern_name: 'Context-Based Success Pattern',
      pattern_description: `Highest success in ${successfulContexts[0].context} context`,
      pattern_data: {
        successful_contexts: successfulContexts,
        context_analysis: contextSuccess
      },
      trigger_conditions: {
        research_contexts: successfulContexts.map(c => c.context)
      },
      expected_outcome: 'Higher success rate',
      confidence_score: Math.min(0.85, successfulContexts[0].success_rate * 0.8),
      supporting_sessions: successfulContexts.reduce((sum, c) => sum + c.sample_size, 0),
      discovery_method: 'context_success_analysis',
      applies_to_users: userId ? [userId] : []
    };
  }

  private extractQualityCharacteristics(sessions: any[]): Record<string, any> {
    const characteristics: Record<string, any> = {};
    
    // Analyze common traits in high-quality profiles
    const profileData = sessions.map(s => s.profile_data).filter(Boolean);
    
    // Example characteristics (would be more sophisticated in practice)
    const industries = profileData.map(p => p.industry).filter(Boolean);
    const companySizes = profileData.map(p => p.company_size).filter(Boolean);
    const seniorities = profileData.map(p => p.seniority).filter(Boolean);

    // Find most common characteristics
    if (industries.length > 0) {
      const industryCount = industries.reduce((acc, industry) => {
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});
      const topIndustry = Object.entries(industryCount).sort(([,a], [,b]) => (b as number) - (a as number))[0];
      if ((topIndustry[1] as number) / industries.length > 0.4) {
        characteristics.preferred_industry = topIndustry[0];
      }
    }

    return characteristics;
  }
}

export default PatternDiscoveryEngine;