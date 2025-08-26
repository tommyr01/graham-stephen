/**
 * Relevance Rating Component - Quick 1-10 scale rating with explanations
 * Provides detailed relevance scoring with contextual explanations
 */

import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, User, Building, MapPin, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useImplicitFeedback } from '@/lib/hooks/use-implicit-feedback';
import { supabase } from '@/lib/supabase';

export interface RelevanceRatingProps {
  profileUrl: string;
  userId: string;
  profileData?: {
    name?: string;
    title?: string;
    company?: string;
    location?: string;
    industry?: string;
    experience?: string;
  };
  researchContext?: {
    targetRole?: string;
    targetIndustry?: string;
    targetCompanySize?: string;
    researchGoal?: string;
  };
  onRatingSubmitted?: (rating: RelevanceRating) => void;
  showExplanations?: boolean;
  allowReasons?: boolean;
  compactMode?: boolean;
}

interface RelevanceRating {
  score: number;
  reasoning?: string;
  relevanceFactors: {
    roleMatch: number;
    industryMatch: number;
    experienceMatch: number;
    locationMatch: number;
    companyMatch: number;
  };
  confidenceLevel: number;
  wouldContact: boolean;
}

const RATING_DESCRIPTIONS = {
  1: { label: "Not relevant", description: "This profile doesn't match my needs at all", color: "text-red-600" },
  2: { label: "Poor match", description: "Very few relevant qualities", color: "text-red-500" },
  3: { label: "Weak match", description: "Some relevant aspects but many gaps", color: "text-orange-500" },
  4: { label: "Below average", description: "Limited relevance to my goals", color: "text-orange-400" },
  5: { label: "Average match", description: "Moderately relevant but not ideal", color: "text-yellow-500" },
  6: { label: "Above average", description: "Good match with some strong points", color: "text-yellow-400" },
  7: { label: "Good match", description: "Strong relevance with minor gaps", color: "text-green-400" },
  8: { label: "Very good", description: "High relevance, meets most criteria", color: "text-green-500" },
  9: { label: "Excellent match", description: "Outstanding relevance, ideal candidate", color: "text-green-600" },
  10: { label: "Perfect match", description: "Exactly what I'm looking for", color: "text-green-700" }
};

const RELEVANCE_FACTORS = [
  { key: 'roleMatch', label: 'Role Match', icon: <User className="h-4 w-4" /> },
  { key: 'industryMatch', label: 'Industry', icon: <Building className="h-4 w-4" /> },
  { key: 'experienceMatch', label: 'Experience', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'locationMatch', label: 'Location', icon: <MapPin className="h-4 w-4" /> },
  { key: 'companyMatch', label: 'Company', icon: <Building className="h-4 w-4" /> }
];

export function RelevanceRatingComponent({
  profileUrl,
  userId,
  profileData = {},
  researchContext = {},
  onRatingSubmitted,
  showExplanations = true,
  allowReasons = true,
  compactMode = false
}: RelevanceRatingProps) {
  const [overallScore, setOverallScore] = useState([7]); // Default to 7
  const [factorScores, setFactorScores] = useState({
    roleMatch: 7,
    industryMatch: 7,
    experienceMatch: 7,
    locationMatch: 7,
    companyMatch: 7
  });
  const [reasoning, setReasoning] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState([8]);
  const [wouldContact, setWouldContact] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showDetailedRating, setShowDetailedRating] = useState(false);

  const { recordAction, trackFormInteraction } = useImplicitFeedback({
    profileUrl,
    userId,
    componentName: 'RelevanceRatingComponent'
  });

  // Auto-calculate overall score based on factor scores
  useEffect(() => {
    if (showDetailedRating) {
      const avgScore = Object.values(factorScores).reduce((a, b) => a + b, 0) / 5;
      setOverallScore([Math.round(avgScore)]);
    }
  }, [factorScores, showDetailedRating]);

  // Auto-determine contact decision based on score
  useEffect(() => {
    const score = overallScore[0];
    if (score >= 8) {
      setWouldContact(true);
    } else if (score <= 4) {
      setWouldContact(false);
    }
    // Leave middle scores (5-7) for user decision
  }, [overallScore]);

  const handleFactorChange = (factor: string, value: number[]) => {
    const newScores = { ...factorScores, [factor]: value[0] };
    setFactorScores(newScores);
    
    trackFormInteraction('relevance_rating', `factor_${factor}`, value[0]);
  };

  const handleOverallScoreChange = (value: number[]) => {
    setOverallScore(value);
    trackFormInteraction('relevance_rating', 'overall_score', value[0]);
  };

  const handleSubmitRating = async () => {
    if (hasSubmitted) return;

    setIsSubmitting(true);

    try {
      const rating: RelevanceRating = {
        score: overallScore[0],
        reasoning: reasoning.trim() || undefined,
        relevanceFactors: factorScores,
        confidenceLevel: confidenceLevel[0],
        wouldContact: wouldContact || false
      };

      const feedbackData = {
        rating_type: 'profile_relevance',
        overall_score: rating.score,
        detailed_scores: rating.relevanceFactors,
        confidence_level: rating.confidenceLevel,
        would_contact: rating.wouldContact,
        reasoning: rating.reasoning,
        profile_data: profileData,
        research_context: researchContext,
        rating_method: showDetailedRating ? 'detailed' : 'simple',
        submission_timestamp: new Date().toISOString()
      };

      // Save to feedback_interactions table
      const { error } = await supabase
        .from('feedback_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'explicit_rating',
          feedback_data: feedbackData,
          context_data: {
            profileUrl,
            profile_name: profileData.name,
            research_goal: researchContext.researchGoal,
            component_mode: compactMode ? 'compact' : 'full'
          },
          collection_method: 'voluntary',
          ui_component: 'relevance_rating_component'
        });

      if (error) throw error;

      // Record action for implicit tracking
      recordAction('relevance_rating_submitted', {
        score: rating.score,
        would_contact: rating.wouldContact,
        has_reasoning: !!rating.reasoning,
        confidence: rating.confidenceLevel
      });

      setHasSubmitted(true);
      onRatingSubmitted?.(rating);

    } catch (error) {
      console.error('Failed to submit relevance rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRating = RATING_DESCRIPTIONS[overallScore[0] as keyof typeof RATING_DESCRIPTIONS];

  if (hasSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Rating Submitted!
            </h3>
            <p className="text-sm text-gray-600">
              Thank you for rating this profile ({overallScore[0]}/10)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${compactMode ? 'max-w-sm' : 'max-w-lg'} mx-auto`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-lg font-semibold">Rate Relevance</span>
          </div>
          {!compactMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedRating(!showDetailedRating)}
            >
              {showDetailedRating ? 'Simple' : 'Detailed'}
            </Button>
          )}
        </CardTitle>
        {profileData.name && (
          <p className="text-sm text-gray-600">
            How relevant is <strong>{profileData.name}</strong> to your research goals?
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Relevance</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-800">{overallScore[0]}</span>
              <span className="text-sm text-gray-500">/10</span>
            </div>
          </div>
          
          <Slider
            value={overallScore}
            onValueChange={handleOverallScoreChange}
            max={10}
            min={1}
            step={1}
            disabled={showDetailedRating}
            className="w-full"
          />
          
          {showExplanations && currentRating && (
            <div className="text-center">
              <Badge variant="outline" className={`${currentRating.color} border-current`}>
                {currentRating.label}
              </Badge>
              {!compactMode && (
                <p className="text-xs text-gray-600 mt-1">{currentRating.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Detailed Factor Rating */}
        {showDetailedRating && !compactMode && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700">Detailed Breakdown</h4>
            {RELEVANCE_FACTORS.map((factor) => (
              <div key={factor.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {factor.icon}
                    <span className="text-sm">{factor.label}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {factorScores[factor.key as keyof typeof factorScores]}/10
                  </span>
                </div>
                <Slider
                  value={[factorScores[factor.key as keyof typeof factorScores]]}
                  onValueChange={(value) => handleFactorChange(factor.key, value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        {/* Contact Decision */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Would you contact this person?</span>
          <div className="flex space-x-2">
            <Button
              variant={wouldContact === true ? "default" : "outline"}
              size="sm"
              onClick={() => setWouldContact(true)}
              className="flex-1"
            >
              Yes, I'd reach out
            </Button>
            <Button
              variant={wouldContact === false ? "default" : "outline"}
              size="sm"
              onClick={() => setWouldContact(false)}
              className="flex-1"
            >
              No, not a fit
            </Button>
          </div>
        </div>

        {/* Confidence Level */}
        {!compactMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">How confident are you?</span>
              <span className="text-sm text-gray-600">{confidenceLevel[0]}/10</span>
            </div>
            <Slider
              value={confidenceLevel}
              onValueChange={(value) => {
                setConfidenceLevel(value);
                trackFormInteraction('relevance_rating', 'confidence_level', value[0]);
              }}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Reasoning */}
        {allowReasons && !compactMode && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Why this rating? (optional)</span>
            <Textarea
              placeholder="Share your thoughts on why this profile is/isn't a good match..."
              value={reasoning}
              onChange={(e) => {
                setReasoning(e.target.value);
                trackFormInteraction('relevance_rating', 'reasoning_length', e.target.value.length);
              }}
              className="resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmitRating}
          disabled={isSubmitting || wouldContact === null}
          className="w-full"
          size={compactMode ? "sm" : "default"}
        >
          {isSubmitting ? 'Submitting Rating...' : `Submit Rating (${overallScore[0]}/10)`}
        </Button>
      </CardContent>
    </Card>
  );
}