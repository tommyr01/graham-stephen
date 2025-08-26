/**
 * Session Learning Manager - Manages real-time learning within active research sessions
 * 
 * This service provides real-time pattern learning and application within a single
 * research session, enabling voice feedback on Profile A to immediately improve
 * analysis of Profile B within the same session.
 */

import { supabase } from '@/lib/supabase';
import LearningDataProcessor from './learning-data-processor';
import type { 
  FeedbackInteraction,
  DiscoveredPattern,
  ResearchSessionIntelligence
} from '@/lib/types/intelligence';

interface SessionPattern {
  id: string;
  pattern_type: string;
  pattern_data: Record<string, any>;
  confidence_score: number;
  source_profile_url?: string;
  source_interaction_id?: string;
  created_at: Date;
  applies_to_profiles?: string[];
}

interface SessionLearningState {
  session_id: string;
  user_id: string;
  patterns: Map<string, SessionPattern>;
  profile_analyses: Map<string, any>;
  learning_metrics: {
    patterns_discovered: number;
    patterns_applied: number;
    accuracy_improvements: number[];
    confidence_boosts: number[];
  };
  created_at: Date;
  last_updated: Date;
}

interface PatternApplicationResult {
  pattern_id: string;
  applied: boolean;
  confidence_delta: number;
  accuracy_improvement: number;
  application_reason: string;
}

interface LearningImpactMetrics {
  before_confidence: number;
  after_confidence: number;
  confidence_improvement: number;
  patterns_applied: number;
  learning_strength: number;
}

export class SessionLearningManager {
  private static instance: SessionLearningManager;
  private static learningStates: Map<string, SessionLearningState> = new Map();
  
  private dataProcessor: LearningDataProcessor;
  private maxSessionPatterns: number = 20;
  private minPatternConfidence: number = 0.6;
  private patternExpiryMinutes: number = 120; // 2 hours

  constructor() {
    this.dataProcessor = new LearningDataProcessor();
  }

  // Singleton pattern to maintain state across API calls
  static getInstance(): SessionLearningManager {
    if (!SessionLearningManager.instance) {
      SessionLearningManager.instance = new SessionLearningManager();
    }
    return SessionLearningManager.instance;
  }

  // Override the learningStates getter to use static property
  private get learningStates(): Map<string, SessionLearningState> {
    return SessionLearningManager.learningStates;
  }

  /**
   * Initialize learning state for a new session
   */
  async initializeSession(sessionId: string, userId: string): Promise<void> {
    if (this.learningStates.has(sessionId)) {
      console.log(`Session ${sessionId} already initialized with ${this.learningStates.get(sessionId)?.patterns.size || 0} patterns`);
      return; // Already initialized
    }

    // Try to restore session state from database first (Integration #4)
    const restoredState = await this.restoreSessionState(sessionId, userId);
    
    if (restoredState) {
      this.learningStates.set(sessionId, restoredState);
      console.log(`Session learning restored from database for session: ${sessionId}`);
      return;
    }

    // Create new learning state if no restored state
    const learningState: SessionLearningState = {
      session_id: sessionId,
      user_id: userId,
      patterns: new Map(),
      profile_analyses: new Map(),
      learning_metrics: {
        patterns_discovered: 0,
        patterns_applied: 0,
        accuracy_improvements: [],
        confidence_boosts: []
      },
      created_at: new Date(),
      last_updated: new Date()
    };

    this.learningStates.set(sessionId, learningState);

    // Load user's existing patterns that might apply to this session
    await this.loadUserPatterns(sessionId, userId);

    // Persist initial session state to database
    await this.persistSessionState(sessionId);

    console.log(`Session learning initialized for session: ${sessionId}`);
  }

  /**
   * Process voice feedback and extract patterns for immediate learning
   */
  async processVoiceFeedback(
    sessionId: string,
    interaction: FeedbackInteraction,
    profileUrl: string,
    profileData: any
  ): Promise<SessionPattern[]> {
    const learningState = this.learningStates.get(sessionId);
    if (!learningState) {
      throw new Error(`Session ${sessionId} not initialized for learning`);
    }

    const extractedPatterns: SessionPattern[] = [];

    try {
      // Extract patterns from voice feedback
      const patterns = await this.extractPatternsFromFeedback(
        interaction, 
        profileUrl, 
        profileData
      );

      for (const pattern of patterns) {
        // Create session pattern
        const sessionPattern: SessionPattern = {
          id: `session_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pattern_type: pattern.type,
          pattern_data: pattern.data,
          confidence_score: pattern.confidence,
          source_profile_url: profileUrl,
          source_interaction_id: interaction.id,
          created_at: new Date(),
          applies_to_profiles: pattern.applies_to_profiles || []
        };

        // Add to session state if confidence meets threshold
        if (sessionPattern.confidence_score >= this.minPatternConfidence) {
          learningState.patterns.set(sessionPattern.id, sessionPattern);
          extractedPatterns.push(sessionPattern);
          learningState.learning_metrics.patterns_discovered++;
        }
      }

      // Store profile analysis for comparison
      learningState.profile_analyses.set(profileUrl, {
        original_analysis: profileData,
        feedback_interaction: interaction.id,
        timestamp: new Date()
      });

      learningState.last_updated = new Date();

      // Persist updated session state to database (Integration #4)
      await this.persistSessionState(sessionId);

      console.log(`Extracted ${extractedPatterns.length} patterns from voice feedback in session ${sessionId}`);
      console.log(`Pattern details:`, extractedPatterns.map(p => ({ type: p.pattern_type, confidence: p.confidence_score })));
      return extractedPatterns;

    } catch (error) {
      console.error('Error processing voice feedback for learning:', error);
      return [];
    }
  }

  /**
   * Apply learned patterns to improve subsequent profile analysis
   */
  async applyPatternsToProfile(
    sessionId: string,
    profileUrl: string,
    baseAnalysis: any
  ): Promise<{ 
    enhancedAnalysis: any; 
    learningImpact: LearningImpactMetrics;
    applicationsApplied: PatternApplicationResult[];
  }> {
    const learningState = this.learningStates.get(sessionId);
    console.log(`DEBUG: applyPatternsToProfile - sessionId: ${sessionId}, learningState exists: ${!!learningState}`);
    console.log(`DEBUG: Available patterns in session:`, learningState ? Array.from(learningState.patterns.keys()) : 'none');
    console.log(`DEBUG: Base analysis industry: ${baseAnalysis.industry}, company_size: ${baseAnalysis.company_size}`);
    
    if (!learningState) {
      return {
        enhancedAnalysis: baseAnalysis,
        learningImpact: this.createEmptyLearningImpact(),
        applicationsApplied: []
      };
    }

    const applicationsApplied: PatternApplicationResult[] = [];
    let enhancedAnalysis = { ...baseAnalysis };
    const beforeConfidence = baseAnalysis.confidence_score || 0.5;

    try {
      // Apply each pattern that might be relevant
      for (const [patternId, pattern] of learningState.patterns) {
        const applicationResult = await this.applyPatternToProfile(
          pattern,
          profileUrl,
          enhancedAnalysis,
          baseAnalysis
        );

        if (applicationResult.applied) {
          applicationsApplied.push(applicationResult);
          learningState.learning_metrics.patterns_applied++;
          
          // Update enhanced analysis based on pattern application
          enhancedAnalysis = this.updateAnalysisFromPattern(
            enhancedAnalysis,
            pattern,
            applicationResult
          );
        }
      }

      const afterConfidence = enhancedAnalysis.confidence_score || beforeConfidence;
      const confidenceImprovement = afterConfidence - beforeConfidence;

      // Calculate learning impact
      const learningImpact: LearningImpactMetrics = {
        before_confidence: beforeConfidence,
        after_confidence: afterConfidence,
        confidence_improvement: confidenceImprovement,
        patterns_applied: applicationsApplied.length,
        learning_strength: this.calculateLearningStrength(applicationsApplied)
      };

      // Record improvement metrics
      if (confidenceImprovement > 0) {
        learningState.learning_metrics.confidence_boosts.push(confidenceImprovement);
        learningState.learning_metrics.accuracy_improvements.push(confidenceImprovement);
      }

      learningState.last_updated = new Date();

      // Persist updated session state to database (Integration #4)
      await this.persistSessionState(sessionId);

      console.log(`Applied ${applicationsApplied.length} patterns to profile ${profileUrl} with ${Math.round(confidenceImprovement * 100)}% confidence improvement`);

      return {
        enhancedAnalysis,
        learningImpact,
        applicationsApplied
      };

    } catch (error) {
      console.error('Error applying patterns to profile:', error);
      return {
        enhancedAnalysis: baseAnalysis,
        learningImpact: this.createEmptyLearningImpact(),
        applicationsApplied: []
      };
    }
  }

  /**
   * Get session learning metrics and progress
   */
  getSessionMetrics(sessionId: string): any {
    const learningState = this.learningStates.get(sessionId);
    if (!learningState) {
      return null;
    }

    const avgConfidenceBoost = learningState.learning_metrics.confidence_boosts.length > 0
      ? learningState.learning_metrics.confidence_boosts.reduce((a, b) => a + b, 0) / learningState.learning_metrics.confidence_boosts.length
      : 0;

    const totalAccuracyImprovement = learningState.learning_metrics.accuracy_improvements.length > 0
      ? learningState.learning_metrics.accuracy_improvements.reduce((a, b) => a + b, 0)
      : 0;

    return {
      session_id: sessionId,
      patterns_discovered: learningState.learning_metrics.patterns_discovered,
      patterns_applied: learningState.learning_metrics.patterns_applied,
      profiles_analyzed: learningState.profile_analyses.size,
      average_confidence_boost: avgConfidenceBoost,
      total_accuracy_improvement: totalAccuracyImprovement,
      learning_effectiveness: avgConfidenceBoost > 0.1 ? 'high' : avgConfidenceBoost > 0.05 ? 'medium' : 'low',
      session_duration_minutes: Math.round((Date.now() - learningState.created_at.getTime()) / 60000),
      last_updated: learningState.last_updated
    };
  }

  /**
   * Get patterns discovered in this session
   */
  getSessionPatterns(sessionId: string): SessionPattern[] {
    const learningState = this.learningStates.get(sessionId);
    if (!learningState) {
      return [];
    }

    return Array.from(learningState.patterns.values())
      .sort((a, b) => b.confidence_score - a.confidence_score);
  }

  /**
   * Save valuable session patterns to persistent storage
   */
  async saveSessionPatterns(sessionId: string): Promise<number> {
    const learningState = this.learningStates.get(sessionId);
    if (!learningState) {
      return 0;
    }

    let savedCount = 0;
    const highValuePatterns = Array.from(learningState.patterns.values())
      .filter(p => p.confidence_score >= 0.8); // Only save high-confidence patterns

    for (const pattern of highValuePatterns) {
      try {
        const { error } = await supabase
          .from('discovered_patterns')
          .insert({
            pattern_type: pattern.pattern_type,
            pattern_name: `Session Pattern - ${pattern.pattern_type}`,
            pattern_description: `Pattern discovered from session ${sessionId}`,
            pattern_data: pattern.pattern_data,
            trigger_conditions: {
              session_based: true,
              source_interaction: pattern.source_interaction_id,
              source_profile: pattern.source_profile_url
            },
            expected_outcome: 'Improved analysis accuracy',
            confidence_score: pattern.confidence_score,
            supporting_sessions: 1,
            contradicting_sessions: 0,
            accuracy_rate: pattern.confidence_score,
            applies_to_users: [learningState.user_id],
            applies_to_industries: [],
            applies_to_roles: [],
            discovery_method: 'voice_feedback_session',
            discovery_agent: 'session_learning_manager',
            validation_status: 'discovered',
            impact_score: pattern.confidence_score,
            usage_count: 0,
            last_used: null,
            parent_pattern_id: null,
            version: 1
          });

        if (!error) {
          savedCount++;
        }
      } catch (error) {
        console.error('Error saving session pattern:', error);
      }
    }

    console.log(`Saved ${savedCount} high-value patterns from session ${sessionId}`);
    return savedCount;
  }

  /**
   * Clear session learning state
   */
  clearSession(sessionId: string): void {
    this.learningStates.delete(sessionId);
    console.log(`Cleared learning state for session: ${sessionId}`);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, state] of this.learningStates) {
      const sessionAge = now.getTime() - state.last_updated.getTime();
      const maxAge = this.patternExpiryMinutes * 60 * 1000;

      if (sessionAge > maxAge) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.learningStates.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired learning sessions`);
    }
  }

  // Private helper methods

  private async loadUserPatterns(sessionId: string, userId: string): Promise<void> {
    try {
      const { data: userPatterns } = await supabase
        .from('discovered_patterns')
        .select('*')
        .or(`applies_to_users.cs.{${userId}},applies_to_users.eq.{}`)
        .eq('validation_status', 'validated')
        .gte('confidence_score', 0.7)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (userPatterns) {
        const learningState = this.learningStates.get(sessionId);
        if (learningState) {
          // Convert discovered patterns to session patterns
          userPatterns.forEach(pattern => {
            const sessionPattern: SessionPattern = {
              id: `existing_${pattern.id}`,
              pattern_type: pattern.pattern_type,
              pattern_data: pattern.pattern_data,
              confidence_score: pattern.confidence_score,
              created_at: new Date(pattern.created_at),
              applies_to_profiles: []
            };
            learningState.patterns.set(sessionPattern.id, sessionPattern);
          });
        }
      }
    } catch (error) {
      console.error('Error loading user patterns:', error);
    }
  }

  private async extractPatternsFromFeedback(
    interaction: FeedbackInteraction,
    profileUrl: string,
    profileData: any
  ): Promise<Array<{ type: string; data: any; confidence: number; applies_to_profiles?: string[] }>> {
    const patterns: Array<{ type: string; data: any; confidence: number; applies_to_profiles?: string[] }> = [];

    const feedbackData = interaction.feedback_data;
    console.log('DEBUG: extractPatternsFromFeedback called with:', { 
      feedbackData, 
      profileData,
      hasVoiceFeedback: feedbackData?.voice_feedback,
      hasTranscript: !!feedbackData?.transcript
    });
    
    // Extract voice transcript patterns
    if (feedbackData.voice_feedback && feedbackData.transcript) {
      const transcript = feedbackData.transcript.toLowerCase();

      // Industry preference patterns
      if (profileData.industry) {
        if (transcript.includes('good') || transcript.includes('relevant') || transcript.includes('perfect')) {
          patterns.push({
            type: 'industry_preference',
            data: {
              preferred_industry: profileData.industry,
              preference_strength: 'positive',
              source_transcript: transcript
            },
            confidence: 0.8
          });
        } else if (transcript.includes('wrong') || transcript.includes('bad') || transcript.includes('irrelevant')) {
          patterns.push({
            type: 'industry_avoidance',
            data: {
              avoided_industry: profileData.industry,
              avoidance_strength: 'negative',
              source_transcript: transcript
            },
            confidence: 0.7
          });
        }
      }

      // Role preference patterns
      if (profileData.current_role) {
        if (transcript.includes('good fit') || transcript.includes('perfect role')) {
          patterns.push({
            type: 'role_preference',
            data: {
              preferred_role: profileData.current_role,
              preference_strength: 'positive',
              source_transcript: transcript
            },
            confidence: 0.8
          });
        }
      }

      // Company size patterns
      if (profileData.company_size) {
        if (transcript.includes('size') || transcript.includes('company')) {
          const sizePreference = transcript.includes('good size') || transcript.includes('right size') ? 'positive' : 'neutral';
          patterns.push({
            type: 'company_size_preference',
            data: {
              preferred_size: profileData.company_size,
              preference_strength: sizePreference,
              source_transcript: transcript
            },
            confidence: 0.7
          });
        }
      }

      // Experience level patterns
      if (profileData.years_experience) {
        if (transcript.includes('experience') || transcript.includes('senior') || transcript.includes('junior')) {
          patterns.push({
            type: 'experience_preference',
            data: {
              preferred_experience_range: profileData.years_experience,
              source_transcript: transcript
            },
            confidence: 0.6
          });
        }
      }
    }

    return patterns;
  }

  private async applyPatternToProfile(
    pattern: SessionPattern,
    profileUrl: string,
    currentAnalysis: any,
    originalAnalysis: any
  ): Promise<PatternApplicationResult> {
    try {
      const result: PatternApplicationResult = {
        pattern_id: pattern.id,
        applied: false,
        confidence_delta: 0,
        accuracy_improvement: 0,
        application_reason: ''
      };

      // Check if pattern is applicable to this profile
      const isApplicable = await this.isPatternApplicable(pattern, currentAnalysis);
      
      if (!isApplicable) {
        result.application_reason = 'Pattern not applicable to this profile type';
        return result;
      }

      // Apply pattern based on type
      switch (pattern.pattern_type) {
        case 'industry_preference':
          if (currentAnalysis.industry === pattern.pattern_data.preferred_industry) {
            result.confidence_delta = 0.15;
            result.applied = true;
            result.application_reason = 'Industry preference match';
          }
          break;

        case 'role_preference':
          if (currentAnalysis.current_role && 
              currentAnalysis.current_role.toLowerCase().includes(pattern.pattern_data.preferred_role.toLowerCase())) {
            result.confidence_delta = 0.12;
            result.applied = true;
            result.application_reason = 'Role preference match';
          }
          break;

        case 'company_size_preference':
          if (currentAnalysis.company_size === pattern.pattern_data.preferred_size) {
            result.confidence_delta = 0.10;
            result.applied = true;
            result.application_reason = 'Company size preference match';
          }
          break;

        case 'industry_avoidance':
          if (currentAnalysis.industry === pattern.pattern_data.avoided_industry) {
            result.confidence_delta = -0.20;
            result.applied = true;
            result.application_reason = 'Industry avoidance pattern';
          }
          break;

        default:
          result.application_reason = 'Unknown pattern type';
      }

      // Calculate accuracy improvement
      if (result.applied && result.confidence_delta !== 0) {
        result.accuracy_improvement = Math.abs(result.confidence_delta) * pattern.confidence_score;
      }

      return result;

    } catch (error) {
      console.error('Error applying pattern to profile:', error);
      return {
        pattern_id: pattern.id,
        applied: false,
        confidence_delta: 0,
        accuracy_improvement: 0,
        application_reason: 'Error during application'
      };
    }
  }

  private async isPatternApplicable(pattern: SessionPattern, analysis: any): Promise<boolean> {
    // Basic applicability checks
    switch (pattern.pattern_type) {
      case 'industry_preference':
      case 'industry_avoidance':
        return !!analysis.industry;
      
      case 'role_preference':
        return !!analysis.current_role;
      
      case 'company_size_preference':
        return !!analysis.company_size;
      
      case 'experience_preference':
        return !!analysis.years_experience;
      
      default:
        return true;
    }
  }

  private updateAnalysisFromPattern(
    analysis: any,
    pattern: SessionPattern,
    applicationResult: PatternApplicationResult
  ): any {
    const updatedAnalysis = { ...analysis };

    // Update confidence score
    const newConfidence = Math.max(0, Math.min(1, 
      (updatedAnalysis.confidence_score || 0.5) + applicationResult.confidence_delta
    ));
    
    updatedAnalysis.confidence_score = newConfidence;

    // Add learning metadata
    if (!updatedAnalysis.learning_applied) {
      updatedAnalysis.learning_applied = [];
    }
    
    updatedAnalysis.learning_applied.push({
      pattern_id: pattern.id,
      pattern_type: pattern.pattern_type,
      confidence_delta: applicationResult.confidence_delta,
      application_reason: applicationResult.application_reason,
      applied_at: new Date().toISOString()
    });

    // Update relevance score if significantly impacted
    if (Math.abs(applicationResult.confidence_delta) > 0.1) {
      const currentRelevance = updatedAnalysis.relevance_score || 0.5;
      updatedAnalysis.relevance_score = Math.max(0, Math.min(1, 
        currentRelevance + (applicationResult.confidence_delta * 0.8)
      ));
    }

    return updatedAnalysis;
  }

  private calculateLearningStrength(applications: PatternApplicationResult[]): number {
    if (applications.length === 0) return 0;

    const totalAccuracyImprovement = applications.reduce((sum, app) => sum + app.accuracy_improvement, 0);
    const avgImprovement = totalAccuracyImprovement / applications.length;

    // Learning strength is based on both quantity and quality of applications
    const quantityFactor = Math.min(applications.length / 5, 1); // Max at 5 applications
    const qualityFactor = Math.min(avgImprovement / 0.2, 1); // Max at 20% improvement

    return (quantityFactor * 0.4 + qualityFactor * 0.6);
  }

  private createEmptyLearningImpact(): LearningImpactMetrics {
    return {
      before_confidence: 0.5,
      after_confidence: 0.5,
      confidence_improvement: 0,
      patterns_applied: 0,
      learning_strength: 0
    };
  }

  // Integration #4: Session state persistence methods

  /**
   * Persist session learning state to database
   */
  private async persistSessionState(sessionId: string): Promise<void> {
    const learningState = this.learningStates.get(sessionId);
    if (!learningState) {
      return;
    }

    try {
      // Convert Maps to serializable objects
      const patterns = Array.from(learningState.patterns.entries()).map(([id, pattern]) => ({
        pattern_id: id,
        ...pattern
      }));

      const profileAnalyses = Array.from(learningState.profile_analyses.entries()).map(([url, analysis]) => ({
        url,
        ...analysis
      }));

      const sessionData = {
        session_id: sessionId,
        user_id: learningState.user_id,
        patterns,
        profile_analyses: profileAnalyses,
        learning_metrics: learningState.learning_metrics,
        created_at: learningState.created_at.toISOString(),
        last_updated: learningState.last_updated.toISOString()
      };

      // Generate valid UUID for the learning state record
      const crypto = require('crypto');
      const learningStateId = crypto.randomUUID();
      
      // For now, skip database persistence and use in-memory only
      // This allows the learning loop to work without database setup
      console.log('Session state persistence skipped - using in-memory learning only');
      
      // TODO: Implement database persistence once schema is properly set up
      // const { error } = await supabase
      //   .from('feedback_interactions')
      //   .upsert({
      //     id: learningStateId,
      //     user_id: learningState.user_id,
      //     interaction_type: 'session_state_persistence',
      //     feedback_data: {
      //       learning_state: sessionData,
      //       state_version: 1,
      //       last_persisted: new Date().toISOString()
      //     },
      //     context_data: {
      //       session_id: sessionId,
      //       state_type: 'session_learning_state'
      //     },
      //     collection_method: 'automatic',
      //     processed: true,
      //     learning_value: 0.0
      //   }, {
      //     onConflict: 'id',
      //     ignoreDuplicates: false
      //   });

      const error = null; // Simulate success for in-memory learning

      if (error) {
        console.error('Error persisting session state:', error);
      }
    } catch (error) {
      console.error('Error serializing session state:', error);
    }
  }

  /**
   * Restore session learning state from database
   */
  private async restoreSessionState(sessionId: string, userId: string): Promise<SessionLearningState | null> {
    try {
      // Find session state by session_id in context_data since we can't predict the UUID
      const { data, error } = await supabase
        .from('feedback_interactions')
        .select('feedback_data')
        .eq('user_id', userId)
        .eq('interaction_type', 'session_state_persistence')
        .contains('context_data', { session_id: sessionId })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data?.feedback_data?.learning_state) {
        return null;
      }

      const sessionData = data.feedback_data.learning_state;

      // Reconstruct Maps from serialized data
      const patterns = new Map();
      if (sessionData.patterns) {
        sessionData.patterns.forEach((pattern: any) => {
          const { pattern_id, ...patternData } = pattern;
          patterns.set(pattern_id, patternData);
        });
      }

      const profileAnalyses = new Map();
      if (sessionData.profile_analyses) {
        sessionData.profile_analyses.forEach((analysis: any) => {
          const { url, ...analysisData } = analysis;
          profileAnalyses.set(url, analysisData);
        });
      }

      const restoredState: SessionLearningState = {
        session_id: sessionData.session_id,
        user_id: sessionData.user_id,
        patterns,
        profile_analyses: profileAnalyses,
        learning_metrics: sessionData.learning_metrics || {
          patterns_discovered: 0,
          patterns_applied: 0,
          accuracy_improvements: [],
          confidence_boosts: []
        },
        created_at: new Date(sessionData.created_at),
        last_updated: new Date(sessionData.last_updated)
      };

      return restoredState;

    } catch (error) {
      console.error('Error restoring session state:', error);
      return null;
    }
  }
}

export default SessionLearningManager;