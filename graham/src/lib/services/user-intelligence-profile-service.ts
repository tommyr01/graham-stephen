/**
 * User Intelligence Profile Service - Manages and updates individual user learning profiles
 * 
 * This service maintains comprehensive intelligence profiles for each user, tracking their
 * preferences, patterns, and learning progress to provide personalized research experiences.
 */

import { supabase } from '@/lib/supabase';
import type { 
  UserIntelligenceProfile, 
  PatternUpdateRequest,
  LearningInsight,
  UserBehaviorAnalysis,
  PreferenceUpdate
} from '@/lib/types/intelligence';

interface ProfileUpdateOptions {
  incremental?: boolean;
  forceRefresh?: boolean;
  confidenceThreshold?: number;
  minSessionsRequired?: number;
}

const DEFAULT_UPDATE_OPTIONS: ProfileUpdateOptions = {
  incremental: true,
  forceRefresh: false,
  confidenceThreshold: 0.6,
  minSessionsRequired: 3
};

export class UserIntelligenceProfileService {
  
  /**
   * Initialize or retrieve user intelligence profile
   */
  async initializeProfile(userId: string): Promise<UserIntelligenceProfile> {
    try {
      // First, try to get existing profile
      let { data: existingProfile, error } = await supabase
        .from('user_intelligence_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Error fetching profile: ${error.message}`);
      }

      if (existingProfile) {
        console.log(`Retrieved existing profile for user ${userId}`);
        return this.mapDatabaseToProfile(existingProfile);
      }

      // Create new profile if none exists
      const newProfile = this.createEmptyProfile(userId);
      
      const { data: createdProfile, error: createError } = await supabase
        .from('user_intelligence_profiles')
        .insert(this.mapProfileToDatabase(newProfile))
        .select('*')
        .single();

      if (createError) {
        throw new Error(`Error creating profile: ${createError.message}`);
      }

      console.log(`Created new intelligence profile for user ${userId}`);
      return this.mapDatabaseToProfile(createdProfile);
    } catch (error) {
      console.error('Error initializing user intelligence profile:', error);
      throw error;
    }
  }

  /**
   * Update user intelligence profile with new patterns and insights
   */
  async updateProfile(
    userId: string, 
    updates: PatternUpdateRequest, 
    options: ProfileUpdateOptions = {}
  ): Promise<UserIntelligenceProfile> {
    const opts = { ...DEFAULT_UPDATE_OPTIONS, ...options };
    
    try {
      // Get current profile
      const currentProfile = await this.initializeProfile(userId);
      
      // Calculate updated profile
      const updatedProfile = await this.calculateProfileUpdates(
        currentProfile, 
        updates, 
        opts
      );

      // Save updated profile
      const { data: savedProfile, error } = await supabase
        .from('user_intelligence_profiles')
        .update({
          ...this.mapProfileToDatabase(updatedProfile),
          last_pattern_update: new Date().toISOString(),
          pattern_version: currentProfile.pattern_version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error updating profile: ${error.message}`);
      }

      console.log(`Updated intelligence profile for user ${userId}`);
      return this.mapDatabaseToProfile(savedProfile);
    } catch (error) {
      console.error('Error updating user intelligence profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile with optional fresh analysis
   */
  async getProfile(userId: string, refresh: boolean = false): Promise<UserIntelligenceProfile> {
    if (refresh) {
      return await this.refreshProfileFromBehavior(userId);
    }
    return await this.initializeProfile(userId);
  }

  /**
   * Refresh profile by analyzing recent user behavior
   */
  async refreshProfileFromBehavior(userId: string): Promise<UserIntelligenceProfile> {
    console.log(`Refreshing profile from behavior for user ${userId}`);
    
    try {
      // Get recent user behavior data
      const behaviorData = await this.getUserBehaviorData(userId);
      
      // Analyze behavior for patterns
      const behaviorAnalysis = await this.analyzeBehaviorPatterns(behaviorData);
      
      // Update profile with insights
      const updateRequest: PatternUpdateRequest = {
        userId,
        behaviorAnalysis,
        sessionData: behaviorData.recentSessions,
        feedbackData: behaviorData.recentFeedback,
        timestamp: new Date()
      };

      return await this.updateProfile(userId, updateRequest, { forceRefresh: true });
    } catch (error) {
      console.error('Error refreshing profile from behavior:', error);
      throw error;
    }
  }

  /**
   * Update specific preferences for a user
   */
  async updatePreferences(userId: string, preferences: PreferenceUpdate): Promise<void> {
    try {
      const currentProfile = await this.getProfile(userId);
      
      const updates: Partial<UserIntelligenceProfile> = {};

      if (preferences.industry_focus) {
        updates.industry_focus = preferences.industry_focus;
      }
      
      if (preferences.role_preferences) {
        updates.role_preferences = preferences.role_preferences;
      }
      
      if (preferences.company_size_preference) {
        updates.company_size_preference = preferences.company_size_preference;
      }
      
      if (preferences.location_preferences) {
        updates.location_preferences = preferences.location_preferences;
      }
      
      if (preferences.seniority_preferences) {
        updates.seniority_preferences = preferences.seniority_preferences;
      }

      await supabase
        .from('user_intelligence_profiles')
        .update({
          ...updates,
          last_pattern_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`Updated preferences for user ${userId}`);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user behavior summary and trends
   */
  async getBehaviorSummary(userId: string, days: number = 30): Promise<UserBehaviorAnalysis> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get research sessions in the period
      const { data: sessions, error: sessionsError } = await supabase
        .from('research_session_intelligence')
        .select(`
          session_duration,
          session_outcome,
          confidence_level,
          relevance_rating,
          created_at,
          profile_data
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (sessionsError) {
        throw new Error(`Error fetching sessions: ${sessionsError.message}`);
      }

      // Get feedback interactions in the period
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback_interactions')
        .select(`
          interaction_type,
          learning_value,
          feedback_data,
          created_at
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (feedbackError) {
        throw new Error(`Error fetching feedback: ${feedbackError.message}`);
      }

      return this.analyzeBehaviorData(sessions || [], feedback || [], days);
    } catch (error) {
      console.error('Error getting behavior summary:', error);
      throw error;
    }
  }

  /**
   * Record a successful contact outcome to update learning
   */
  async recordSuccessfulContact(
    userId: string, 
    sessionId: string, 
    contactDetails: {
      method: string;
      outcome: string;
      responseReceived: boolean;
      responseType?: string;
    }
  ): Promise<void> {
    try {
      // Update the session with outcome
      await supabase
        .from('research_session_intelligence')
        .update({
          session_outcome: 'contacted',
          contact_method: contactDetails.method,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      // Update user profile success metrics
      const { data: profile } = await supabase
        .from('user_intelligence_profiles')
        .select('successful_contacts, last_successful_contact')
        .eq('user_id', userId)
        .single();

      if (profile) {
        await supabase
          .from('user_intelligence_profiles')
          .update({
            successful_contacts: (profile.successful_contacts || 0) + 1,
            last_successful_contact: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      // Record detailed outcome tracking
      await supabase
        .from('feedback_interactions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          interaction_type: 'outcome_report',
          feedback_data: {
            contact_method: contactDetails.method,
            outcome_type: contactDetails.outcome,
            response_received: contactDetails.responseReceived,
            response_type: contactDetails.responseType
          },
          collection_method: 'explicit',
          learning_value: 0.9
        });

      console.log(`Recorded successful contact for user ${userId}, session ${sessionId}`);
    } catch (error) {
      console.error('Error recording successful contact:', error);
      throw error;
    }
  }

  /**
   * Get learning insights and recommendations for a user
   */
  async getLearningInsights(userId: string): Promise<LearningInsight[]> {
    try {
      const profile = await this.getProfile(userId);
      const behaviorSummary = await this.getBehaviorSummary(userId);
      
      const insights: LearningInsight[] = [];

      // Generate insights based on profile and behavior
      if (profile.learning_confidence < 0.5) {
        insights.push({
          type: 'improvement_opportunity',
          title: 'Building Your Research Profile',
          description: 'Continue using the system to help us learn your preferences and improve recommendations.',
          confidence: 0.8,
          actionable: true,
          suggestion: 'Complete more research sessions and provide feedback to improve personalization.'
        });
      }

      if (behaviorSummary.total_sessions > 10 && behaviorSummary.contact_rate < 0.3) {
        insights.push({
          type: 'efficiency_improvement',
          title: 'Low Contact Rate Detected',
          description: `Your contact rate is ${(behaviorSummary.contact_rate * 100).toFixed(1)}%. Consider adjusting your research criteria.`,
          confidence: 0.7,
          actionable: true,
          suggestion: 'Review your successful contact patterns and adjust your search criteria accordingly.'
        });
      }

      if (profile.industry_focus.length > 0) {
        insights.push({
          type: 'pattern_recognition',
          title: 'Industry Focus Identified',
          description: `You show strong preference for ${profile.industry_focus.slice(0, 3).join(', ')} industries.`,
          confidence: profile.learning_confidence,
          actionable: false,
          suggestion: null
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating learning insights:', error);
      return [];
    }
  }

  // Private helper methods

  private createEmptyProfile(userId: string): UserIntelligenceProfile {
    return {
      id: '', // Will be generated by database
      user_id: userId,
      industry_focus: [],
      role_preferences: [],
      company_size_preference: null,
      location_preferences: [],
      seniority_preferences: [],
      engagement_patterns: {},
      success_patterns: {},
      search_patterns: {},
      timing_patterns: {},
      learning_confidence: 0.0,
      total_research_sessions: 0,
      successful_contacts: 0,
      feedback_interactions: 0,
      last_pattern_update: new Date(),
      last_successful_contact: null,
      pattern_version: 1,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private mapDatabaseToProfile(dbProfile: any): UserIntelligenceProfile {
    return {
      id: dbProfile.id,
      user_id: dbProfile.user_id,
      industry_focus: dbProfile.industry_focus || [],
      role_preferences: dbProfile.role_preferences || [],
      company_size_preference: dbProfile.company_size_preference,
      location_preferences: dbProfile.location_preferences || [],
      seniority_preferences: dbProfile.seniority_preferences || [],
      engagement_patterns: dbProfile.engagement_patterns || {},
      success_patterns: dbProfile.success_patterns || {},
      search_patterns: dbProfile.search_patterns || {},
      timing_patterns: dbProfile.timing_patterns || {},
      learning_confidence: dbProfile.learning_confidence || 0.0,
      total_research_sessions: dbProfile.total_research_sessions || 0,
      successful_contacts: dbProfile.successful_contacts || 0,
      feedback_interactions: dbProfile.feedback_interactions || 0,
      last_pattern_update: new Date(dbProfile.last_pattern_update),
      last_successful_contact: dbProfile.last_successful_contact ? new Date(dbProfile.last_successful_contact) : null,
      pattern_version: dbProfile.pattern_version || 1,
      created_at: new Date(dbProfile.created_at),
      updated_at: new Date(dbProfile.updated_at)
    };
  }

  private mapProfileToDatabase(profile: UserIntelligenceProfile): any {
    return {
      user_id: profile.user_id,
      industry_focus: profile.industry_focus,
      role_preferences: profile.role_preferences,
      company_size_preference: profile.company_size_preference,
      location_preferences: profile.location_preferences,
      seniority_preferences: profile.seniority_preferences,
      engagement_patterns: profile.engagement_patterns,
      success_patterns: profile.success_patterns,
      search_patterns: profile.search_patterns,
      timing_patterns: profile.timing_patterns,
      learning_confidence: profile.learning_confidence,
      total_research_sessions: profile.total_research_sessions,
      successful_contacts: profile.successful_contacts,
      feedback_interactions: profile.feedback_interactions,
      last_pattern_update: profile.last_pattern_update?.toISOString(),
      last_successful_contact: profile.last_successful_contact?.toISOString(),
      pattern_version: profile.pattern_version
    };
  }

  private async getUserBehaviorData(userId: string): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get recent sessions
    const { data: recentSessions } = await supabase
      .from('research_session_intelligence')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Get recent feedback
    const { data: recentFeedback } = await supabase
      .from('feedback_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    return {
      recentSessions: recentSessions || [],
      recentFeedback: recentFeedback || []
    };
  }

  private async analyzeBehaviorPatterns(behaviorData: any): Promise<UserBehaviorAnalysis> {
    const sessions = behaviorData.recentSessions;
    const feedback = behaviorData.recentFeedback;

    return {
      total_sessions: sessions.length,
      successful_sessions: sessions.filter((s: any) => s.session_outcome === 'contacted').length,
      average_session_duration: sessions.reduce((sum: number, s: any) => sum + (s.session_duration || 0), 0) / sessions.length,
      contact_rate: sessions.length > 0 ? sessions.filter((s: any) => s.session_outcome === 'contacted').length / sessions.length : 0,
      feedback_frequency: feedback.length / Math.max(sessions.length, 1),
      most_active_hours: this.calculateMostActiveHours(sessions),
      preferred_industries: this.calculatePreferredIndustries(sessions),
      success_indicators: this.calculateSuccessIndicators(sessions, feedback)
    };
  }

  private analyzeBehaviorData(sessions: any[], feedback: any[], days: number): UserBehaviorAnalysis {
    const totalSessions = sessions.length;
    const successfulSessions = sessions.filter(s => s.session_outcome === 'contacted').length;
    
    return {
      total_sessions: totalSessions,
      successful_sessions: successfulSessions,
      average_session_duration: sessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / totalSessions || 0,
      contact_rate: totalSessions > 0 ? successfulSessions / totalSessions : 0,
      feedback_frequency: feedback.length / Math.max(totalSessions, 1),
      most_active_hours: this.calculateMostActiveHours(sessions),
      preferred_industries: this.calculatePreferredIndustries(sessions),
      success_indicators: this.calculateSuccessIndicators(sessions, feedback)
    };
  }

  private async calculateProfileUpdates(
    currentProfile: UserIntelligenceProfile,
    updates: PatternUpdateRequest,
    options: ProfileUpdateOptions
  ): Promise<UserIntelligenceProfile> {
    const updatedProfile = { ...currentProfile };

    // Update based on behavior analysis
    if (updates.behaviorAnalysis) {
      const analysis = updates.behaviorAnalysis;
      
      // Update industry focus based on recent behavior
      if (analysis.preferred_industries.length > 0) {
        updatedProfile.industry_focus = this.mergeIndustryPreferences(
          currentProfile.industry_focus,
          analysis.preferred_industries,
          options.incremental || false
        );
      }

      // Update timing patterns
      if (analysis.most_active_hours.length > 0) {
        updatedProfile.timing_patterns = {
          ...updatedProfile.timing_patterns,
          active_hours: analysis.most_active_hours,
          last_updated: new Date().toISOString()
        };
      }

      // Update success patterns
      if (analysis.success_indicators) {
        updatedProfile.success_patterns = {
          ...updatedProfile.success_patterns,
          ...analysis.success_indicators,
          last_updated: new Date().toISOString()
        };
      }

      // Update learning confidence based on data quality
      updatedProfile.learning_confidence = this.calculateLearningConfidence(
        updatedProfile.total_research_sessions + analysis.total_sessions,
        updatedProfile.feedback_interactions + (updates.feedbackData?.length || 0),
        analysis.contact_rate
      );

      // Update session counters
      updatedProfile.total_research_sessions += analysis.total_sessions;
      updatedProfile.successful_contacts += analysis.successful_sessions;
      updatedProfile.feedback_interactions += updates.feedbackData?.length || 0;
    }

    return updatedProfile;
  }

  private calculateMostActiveHours(sessions: any[]): number[] {
    const hourCounts: Record<number, number> = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private calculatePreferredIndustries(sessions: any[]): string[] {
    const industrySuccess: Record<string, { total: number; successful: number }> = {};
    
    sessions.forEach(session => {
      const industry = session.profile_data?.industry;
      if (industry) {
        if (!industrySuccess[industry]) {
          industrySuccess[industry] = { total: 0, successful: 0 };
        }
        industrySuccess[industry].total++;
        if (session.session_outcome === 'contacted') {
          industrySuccess[industry].successful++;
        }
      }
    });

    return Object.entries(industrySuccess)
      .filter(([, data]) => data.total >= 2 && data.successful / data.total > 0.5)
      .sort(([,a], [,b]) => (b.successful / b.total) - (a.successful / a.total))
      .slice(0, 5)
      .map(([industry]) => industry);
  }

  private calculateSuccessIndicators(sessions: any[], feedback: any[]): Record<string, any> {
    const successfulSessions = sessions.filter(s => s.session_outcome === 'contacted');
    const unsuccessfulSessions = sessions.filter(s => s.session_outcome === 'skipped');

    if (successfulSessions.length < 2) return {};

    return {
      avg_successful_duration: successfulSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / successfulSessions.length,
      avg_unsuccessful_duration: unsuccessfulSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / (unsuccessfulSessions.length || 1),
      successful_confidence_avg: successfulSessions.reduce((sum, s) => sum + (s.confidence_level || 0), 0) / successfulSessions.length,
      last_calculated: new Date().toISOString()
    };
  }

  private mergeIndustryPreferences(current: string[], new_preferences: string[], incremental: boolean): string[] {
    if (!incremental) {
      return new_preferences;
    }

    const merged = [...new Set([...current, ...new_preferences])];
    return merged.slice(0, 10); // Keep top 10
  }

  private calculateLearningConfidence(totalSessions: number, totalFeedback: number, contactRate: number): number {
    // Base confidence on data quantity and quality
    const dataQuantityScore = Math.min(1.0, (totalSessions + totalFeedback) / 50); // 50 data points for max score
    const qualityScore = Math.min(1.0, contactRate * 2); // Higher contact rate = better quality
    
    return Math.min(0.95, (dataQuantityScore * 0.6 + qualityScore * 0.4));
  }
}

export default UserIntelligenceProfileService;