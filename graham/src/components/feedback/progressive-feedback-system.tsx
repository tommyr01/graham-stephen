/**
 * Progressive Feedback System - Adapts complexity based on user experience
 * Dynamically adjusts feedback complexity and frequency based on user behavior and expertise
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Brain, TrendingUp, Settings, Clock, Star, Target, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useImplicitFeedback } from '@/lib/hooks/use-implicit-feedback';
import { supabase } from '@/lib/supabase';

// Import other feedback components
import { SmartFeedbackWidget } from './smart-feedback-widget';
import { RelevanceRatingComponent } from './relevance-rating-component';
import { QuickActionFeedback } from './quick-action-feedback';

export interface ProgressiveFeedbackSystemProps {
  profileUrl?: string;
  userId: string;
  profileData?: any;
  researchContext?: any;
  onFeedbackCollected?: (feedback: any) => void;
  onExpertiseUpdate?: (level: UserExpertiseLevel) => void;
}

interface UserExpertiseLevel {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number; // 0-100
  confidence: number; // 0-1
  sessionCount: number;
  feedbackQuality: number; // 0-1
  patterns: string[];
  lastUpdated: Date;
}

interface FeedbackConfiguration {
  showDetailedRatings: boolean;
  showExplanations: boolean;
  allowReasoningInput: boolean;
  feedbackFrequency: 'high' | 'medium' | 'low';
  complexityLevel: 'simple' | 'standard' | 'detailed' | 'expert';
  adaptiveTriggers: boolean;
  smartTiming: boolean;
  contextualHints: boolean;
}

const EXPERTISE_LEVELS = {
  beginner: {
    range: [0, 25],
    description: 'New to research and prospecting',
    feedbackConfig: {
      showDetailedRatings: false,
      showExplanations: true,
      allowReasoningInput: false,
      feedbackFrequency: 'high' as const,
      complexityLevel: 'simple' as const,
      adaptiveTriggers: true,
      smartTiming: false,
      contextualHints: true
    }
  },
  intermediate: {
    range: [25, 50],
    description: 'Comfortable with basic research',
    feedbackConfig: {
      showDetailedRatings: true,
      showExplanations: true,
      allowReasoningInput: true,
      feedbackFrequency: 'medium' as const,
      complexityLevel: 'standard' as const,
      adaptiveTriggers: true,
      smartTiming: true,
      contextualHints: true
    }
  },
  advanced: {
    range: [50, 80],
    description: 'Experienced researcher',
    feedbackConfig: {
      showDetailedRatings: true,
      showExplanations: false,
      allowReasoningInput: true,
      feedbackFrequency: 'medium' as const,
      complexityLevel: 'detailed' as const,
      adaptiveTriggers: true,
      smartTiming: true,
      contextualHints: false
    }
  },
  expert: {
    range: [80, 100],
    description: 'Research and prospecting expert',
    feedbackConfig: {
      showDetailedRatings: true,
      showExplanations: false,
      allowReasoningInput: true,
      feedbackFrequency: 'low' as const,
      complexityLevel: 'expert' as const,
      adaptiveTriggers: false,
      smartTiming: true,
      contextualHints: false
    }
  }
};

export function ProgressiveFeedbackSystem({
  profileUrl,
  userId,
  profileData,
  researchContext,
  onFeedbackCollected,
  onExpertiseUpdate
}: ProgressiveFeedbackSystemProps) {
  const [userExpertise, setUserExpertise] = useState<UserExpertiseLevel | null>(null);
  const [feedbackConfig, setFeedbackConfig] = useState<FeedbackConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionMetrics, setSessionMetrics] = useState({
    totalSessions: 0,
    averageRatingQuality: 0,
    consistencyScore: 0,
    feedbackFrequency: 0
  });
  const [showExpertisePanel, setShowExpertisePanel] = useState(false);
  const [adaptationLog, setAdaptationLog] = useState<string[]>([]);

  const { recordAction, trackFormInteraction } = useImplicitFeedback({
    profileUrl,
    userId,
    componentName: 'ProgressiveFeedbackSystem'
  });

  // Load user expertise level and history
  useEffect(() => {
    loadUserExpertise();
  }, [userId]);

  // Update feedback configuration when expertise changes
  useEffect(() => {
    if (userExpertise) {
      const config = determineConfiguration(userExpertise);
      setFeedbackConfig(config);
      onExpertiseUpdate?.(userExpertise);
    }
  }, [userExpertise, onExpertiseUpdate]);

  const loadUserExpertise = async () => {
    try {
      setIsLoading(true);

      // Get user's feedback history
      const { data: feedbackHistory, error: feedbackError } = await supabase
        .from('feedback_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (feedbackError) throw feedbackError;

      // Get research session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('research_session_intelligence')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionError) throw sessionError;

      // Calculate expertise level
      const expertise = calculateExpertiseLevel(feedbackHistory || [], sessionData || []);
      setUserExpertise(expertise);

      // Calculate session metrics
      const metrics = calculateSessionMetrics(feedbackHistory || [], sessionData || []);
      setSessionMetrics(metrics);

    } catch (error) {
      console.error('Failed to load user expertise:', error);
      // Set default beginner level
      const defaultExpertise: UserExpertiseLevel = {
        level: 'beginner',
        score: 10,
        confidence: 0.2,
        sessionCount: 0,
        feedbackQuality: 0.3,
        patterns: [],
        lastUpdated: new Date()
      };
      setUserExpertise(defaultExpertise);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateExpertiseLevel = (
    feedbackHistory: any[],
    sessionData: any[]
  ): UserExpertiseLevel => {
    const sessionCount = sessionData.length;
    const feedbackCount = feedbackHistory.length;
    
    // Base score factors
    let score = 0;
    let confidence = 0;
    let feedbackQuality = 0;
    const patterns: string[] = [];

    // Session count factor (0-30 points)
    score += Math.min(sessionCount * 2, 30);

    // Feedback engagement factor (0-20 points)
    const feedbackEngagement = feedbackCount / Math.max(sessionCount, 1);
    score += Math.min(feedbackEngagement * 20, 20);

    // Rating consistency and quality (0-25 points)
    const explicitRatings = feedbackHistory.filter(f => f.interaction_type === 'explicit_rating');
    if (explicitRatings.length > 5) {
      const ratings = explicitRatings
        .map(f => f.feedback_data?.overall_score || f.feedback_data?.selected_option)
        .filter(r => typeof r === 'number');
      
      if (ratings.length > 0) {
        const variance = calculateVariance(ratings);
        const consistencyScore = Math.max(0, 10 - variance); // Lower variance = higher consistency
        score += consistencyScore;
        
        // Quality of reasoning
        const withReasoning = explicitRatings.filter(f => f.feedback_data?.reasoning || f.feedback_data?.additional_feedback);
        feedbackQuality = withReasoning.length / explicitRatings.length;
        score += feedbackQuality * 15;
      }
    }

    // Time-based progression (0-15 points)
    if (sessionData.length > 0) {
      const firstSession = new Date(sessionData[sessionData.length - 1].created_at);
      const daysSinceFirst = (Date.now() - firstSession.getTime()) / (1000 * 60 * 60 * 24);
      const experienceMultiplier = Math.min(daysSinceFirst / 30, 1); // Max after 30 days
      score += experienceMultiplier * 15;
    }

    // Pattern recognition (0-10 points)
    const outcomes = sessionData.map(s => s.session_outcome).filter(Boolean);
    const outcomeCounts = outcomes.reduce((acc, outcome) => {
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(outcomeCounts).forEach(([outcome, count]) => {
      if (count >= 3) patterns.push(`consistent_${outcome}`);
    });
    
    score += patterns.length * 2;

    // Calculate confidence based on data quality
    confidence = Math.min(1, (
      Math.min(sessionCount / 20, 1) * 0.4 +
      Math.min(feedbackCount / 30, 1) * 0.3 +
      feedbackQuality * 0.3
    ));

    // Determine level
    let level: UserExpertiseLevel['level'];
    if (score <= EXPERTISE_LEVELS.beginner.range[1]) level = 'beginner';
    else if (score <= EXPERTISE_LEVELS.intermediate.range[1]) level = 'intermediate';
    else if (score <= EXPERTISE_LEVELS.advanced.range[1]) level = 'advanced';
    else level = 'expert';

    return {
      level,
      score: Math.min(score, 100),
      confidence,
      sessionCount,
      feedbackQuality,
      patterns,
      lastUpdated: new Date()
    };
  };

  const calculateVariance = (numbers: number[]): number => {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    return variance;
  };

  const calculateSessionMetrics = (feedbackHistory: any[], sessionData: any[]) => {
    const totalSessions = sessionData.length;
    
    // Average rating quality
    const explicitRatings = feedbackHistory.filter(f => f.interaction_type === 'explicit_rating');
    const averageRatingQuality = explicitRatings.length > 0 
      ? explicitRatings.reduce((acc, rating) => {
          const hasReasoning = !!(rating.feedback_data?.reasoning || rating.feedback_data?.additional_feedback);
          const hasDetailedScores = !!rating.feedback_data?.detailed_scores;
          return acc + (hasReasoning ? 1 : 0) + (hasDetailedScores ? 0.5 : 0);
        }, 0) / explicitRatings.length
      : 0;
    
    // Consistency score
    const ratings = explicitRatings
      .map(f => f.feedback_data?.overall_score)
      .filter(r => typeof r === 'number');
    const consistencyScore = ratings.length > 3 
      ? 1 - (calculateVariance(ratings) / 10) 
      : 0;
    
    // Feedback frequency
    const feedbackFrequency = totalSessions > 0 
      ? feedbackHistory.length / totalSessions 
      : 0;
    
    return {
      totalSessions,
      averageRatingQuality,
      consistencyScore: Math.max(0, consistencyScore),
      feedbackFrequency: Math.min(1, feedbackFrequency)
    };
  };

  const determineConfiguration = (expertise: UserExpertiseLevel): FeedbackConfiguration => {
    const baseConfig = EXPERTISE_LEVELS[expertise.level].feedbackConfig;
    
    // Apply adaptive modifications based on specific patterns
    const adaptiveConfig = { ...baseConfig };
    
    // If user has high feedback quality but low frequency, reduce frequency
    if (expertise.feedbackQuality > 0.7 && sessionMetrics.feedbackFrequency < 0.3) {
      adaptiveConfig.feedbackFrequency = 'low';
      logAdaptation('Reduced feedback frequency due to high quality, low frequency pattern');
    }
    
    // If user shows consistent patterns, reduce explanations
    if (expertise.patterns.length > 3 && expertise.confidence > 0.8) {
      adaptiveConfig.showExplanations = false;
      adaptiveConfig.contextualHints = false;
      logAdaptation('Disabled explanations and hints due to consistent patterns');
    }
    
    // If user has high session count but low feedback engagement, make feedback more appealing
    if (sessionMetrics.totalSessions > 20 && sessionMetrics.feedbackFrequency < 0.2) {
      adaptiveConfig.complexityLevel = 'simple';
      adaptiveConfig.feedbackFrequency = 'high';
      logAdaptation('Simplified feedback to increase engagement');
    }
    
    return adaptiveConfig;
  };

  const logAdaptation = (message: string) => {
    setAdaptationLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFeedbackSubmitted = useCallback(async (feedback: any) => {
    // Update expertise based on new feedback
    await loadUserExpertise();
    
    // Record the feedback collection
    recordAction('progressive_feedback_submitted', {
      expertise_level: userExpertise?.level,
      feedback_type: feedback.interaction_type || 'unknown',
      configuration_used: feedbackConfig?.complexityLevel
    });
    
    onFeedbackCollected?.(feedback);
  }, [userExpertise, feedbackConfig, recordAction, onFeedbackCollected]);

  const renderFeedbackComponent = () => {
    if (!feedbackConfig || !userExpertise) return null;

    const commonProps = {
      profileUrl: profileUrl!,
      userId,
      profileData,
      onFeedbackSubmitted: handleFeedbackSubmitted
    };

    switch (feedbackConfig.complexityLevel) {
      case 'simple':
        return (
          <QuickActionFeedback
            {...commonProps}
            showReasons={false}
            compactMode={true}
          />
        );
        
      case 'standard':
        return (
          <RelevanceRatingComponent
            {...commonProps}
            researchContext={researchContext}
            showExplanations={feedbackConfig.showExplanations}
            allowReasons={feedbackConfig.allowReasoningInput}
            compactMode={false}
          />
        );
        
      case 'detailed':
        return (
          <RelevanceRatingComponent
            {...commonProps}
            researchContext={researchContext}
            showExplanations={feedbackConfig.showExplanations}
            allowReasons={feedbackConfig.allowReasoningInput}
            compactMode={false}
          />
        );
        
      case 'expert':
        return (
          <div className="space-y-4">
            <RelevanceRatingComponent
              {...commonProps}
              researchContext={researchContext}
              showExplanations={false}
              allowReasons={true}
              compactMode={false}
            />
            <QuickActionFeedback
              {...commonProps}
              showReasons={true}
              compactMode={false}
              expertMode={true}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Brain className="h-6 w-6 animate-pulse text-blue-600" />
            <span className="ml-2">Personalizing experience...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Expertise Panel */}
      {showExpertisePanel && userExpertise && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span>Your Research Expertise</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExpertisePanel(false)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline" className="mb-1">
                  {userExpertise.level.charAt(0).toUpperCase() + userExpertise.level.slice(1)}
                </Badge>
                <p className="text-xs text-gray-600">
                  {EXPERTISE_LEVELS[userExpertise.level].description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{userExpertise.score}/100</div>
                <div className="text-xs text-gray-500">
                  {Math.round(userExpertise.confidence * 100)}% confidence
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">{sessionMetrics.totalSessions} sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">
                  {Math.round(sessionMetrics.averageRatingQuality * 10)/10} quality
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">
                  {Math.round(sessionMetrics.consistencyScore * 100)}% consistent
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">{userExpertise.patterns.length} patterns</span>
              </div>
            </div>
            
            {adaptationLog.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Adaptations</h4>
                <div className="space-y-1">
                  {adaptationLog.slice(-2).map((log, index) => (
                    <p key={index} className="text-xs text-gray-500">{log}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Smart Feedback Widget (if configured) */}
      {feedbackConfig?.adaptiveTriggers && profileUrl && (
        <SmartFeedbackWidget
          profileUrl={profileUrl}
          userId={userId}
          contextData={{ expertiseLevel: userExpertise?.level }}
          onFeedbackSubmitted={handleFeedbackSubmitted}
          minimizedByDefault={userExpertise?.level !== 'beginner'}
          triggerOnEvents={
            userExpertise?.level === 'beginner' 
              ? ['time_threshold', 'exit_intent']
              : ['exit_intent']
          }
        />
      )}

      {/* Main Feedback Component */}
      {profileUrl && renderFeedbackComponent()}

      {/* Expertise Toggle */}
      {!showExpertisePanel && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExpertisePanel(true)}
            className="text-xs text-gray-500"
          >
            <Settings className="h-3 w-3 mr-1" />
            View expertise level
          </Button>
        </div>
      )}
    </div>
  );
}