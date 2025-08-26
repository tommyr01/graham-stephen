/**
 * Enhanced Relevance Scoring - V2.0
 * Integrates AI content analysis and predictive scoring with existing relevance scoring
 */

import { calculateRelevanceScore, RelevanceScore, ScoringWeights, DEFAULT_SCORING_WEIGHTS } from '../relevance-scoring';
import { contentIntelligence, ContentAnalysisResult } from './content-intelligence-engine';
import { predictiveScoring, GrahamPrediction } from './predictive-scoring-engine';

// Enhanced scoring interfaces
export interface EnhancedRelevanceScore extends RelevanceScore {
  aiPrediction?: GrahamPrediction;
  contentIntelligence?: {
    overallAuthenticity: number;
    expertiseLevel: number;
    contentQuality: string;
    aiGeneratedContent: number;
    redFlags: string[];
  };
  enhancedRecommendations: string[];
  grahamLikelihood: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  decisionFactors: {
    primary: string[];
    concerning: string[];
    neutral: string[];
  };
}

export interface EnhancedScoringWeights extends ScoringWeights {
  // V2.0 AI weights
  aiPredictionWeight: number;
  contentAuthenticityWeight: number;
  expertiseDetectionWeight: number;
  patternMatchWeight: number;
  similarProspectWeight: number;
}

export const DEFAULT_ENHANCED_WEIGHTS: EnhancedScoringWeights = {
  ...DEFAULT_SCORING_WEIGHTS,
  // V2.0 AI weights (these override traditional scoring when AI is available)
  aiPredictionWeight: 3.0,          // Highest weight - Graham's learned patterns
  contentAuthenticityWeight: 2.0,   // High weight - authentic content matters
  expertiseDetectionWeight: 2.5,    // High weight - industry expertise detection
  patternMatchWeight: 1.5,           // Medium weight - learned pattern matching
  similarProspectWeight: 1.0,       // Medium weight - similar prospect outcomes
};

/**
 * Enhanced relevance scoring that integrates AI analysis
 */
export async function calculateEnhancedRelevanceScore(
  commenter: any,
  boostTerms: string[] = [],
  downTerms: string[] = [],
  analysisDepth: 'basic' | 'detailed' = 'detailed',
  weights: EnhancedScoringWeights = DEFAULT_ENHANCED_WEIGHTS,
  options: {
    includeAIPrediction?: boolean;
    includeContentAnalysis?: boolean;
    useTrainingData?: boolean;
  } = {}
): Promise<EnhancedRelevanceScore> {
  
  // Set default options
  const {
    includeAIPrediction = true,
    includeContentAnalysis = true,
    useTrainingData = true
  } = options;

  try {
    // Start with traditional relevance scoring
    const baseScore = calculateRelevanceScore(
      commenter,
      boostTerms,
      downTerms,
      analysisDepth,
      weights
    );

    // Initialize enhanced result
    let enhancedResult: EnhancedRelevanceScore = {
      ...baseScore,
      enhancedRecommendations: [],
      grahamLikelihood: 'medium',
      decisionFactors: {
        primary: [],
        concerning: [],
        neutral: []
      }
    };

    // AI Content Analysis (if enabled and posts available)
    if (includeContentAnalysis && commenter.recentPosts?.length > 0) {
      const contentAnalysis = await analyzeContentIntelligence(commenter);
      enhancedResult.contentIntelligence = contentAnalysis;
      
      // Adjust score based on content analysis
      enhancedResult.score = adjustScoreForContentIntelligence(
        enhancedResult.score,
        contentAnalysis,
        weights
      );
    }

    // AI Prediction (if enabled and training data available)
    if (includeAIPrediction && useTrainingData) {
      const prediction = await generateAIPrediction(commenter);
      if (prediction) {
        enhancedResult.aiPrediction = prediction;
        
        // Integrate AI prediction into scoring
        enhancedResult = integrateAIPrediction(enhancedResult, prediction, weights);
      }
    }

    // Generate enhanced recommendations and factors
    enhancedResult.enhancedRecommendations = generateEnhancedRecommendations(enhancedResult);
    enhancedResult.decisionFactors = extractDecisionFactors(enhancedResult);
    enhancedResult.grahamLikelihood = calculateGrahamLikelihood(enhancedResult);

    // Final score normalization
    enhancedResult.score = Math.max(0, Math.min(10, enhancedResult.score));

    return enhancedResult;

  } catch (error) {
    console.error('Enhanced scoring failed, falling back to basic scoring:', error);
    
    // Fallback to basic scoring on error
    const baseScore = calculateRelevanceScore(commenter, boostTerms, downTerms, analysisDepth, weights);
    return {
      ...baseScore,
      enhancedRecommendations: ['Enhanced analysis unavailable - using basic scoring'],
      grahamLikelihood: 'medium',
      decisionFactors: {
        primary: baseScore.recommendations,
        concerning: [],
        neutral: []
      }
    };
  }
}

/**
 * Analyze content intelligence for prospect
 */
async function analyzeContentIntelligence(commenter: any): Promise<{
  overallAuthenticity: number;
  expertiseLevel: number;
  contentQuality: string;
  aiGeneratedContent: number;
  redFlags: string[];
}> {
  try {
    // Check for cached content summary
    const contentSummary = await contentIntelligence.getProspectContentSummary(commenter.id);
    
    if (contentSummary) {
      return {
        overallAuthenticity: contentSummary.avgAuthenticity,
        expertiseLevel: contentSummary.avgExpertise,
        contentQuality: contentSummary.overallQuality,
        aiGeneratedContent: (contentSummary.aiGeneratedPosts / Math.max(contentSummary.totalPosts, 1)) * 100,
        redFlags: [] // Would extract from detailed analysis
      };
    }

    // Perform fresh analysis if no cached data
    if (commenter.recentPosts?.length > 0) {
      const posts = commenter.recentPosts.map((post: any) => ({
        id: post.id || `post_${Date.now()}_${Math.random()}`,
        content: post.content || post.text || '',
        publishedAt: post.publishedAt || post.date || new Date().toISOString()
      }));

      const analysisResults = await contentIntelligence.batchAnalyzePosts(posts, commenter.id);
      
      if (analysisResults.length > 0) {
        const avgAuthenticity = analysisResults.reduce((sum, r) => sum + r.authenticityScore, 0) / analysisResults.length;
        const avgExpertise = analysisResults.reduce((sum, r) => sum + r.expertiseLevel, 0) / analysisResults.length;
        const aiGenerated = analysisResults.filter(r => r.authenticityScore < 5).length;
        const allRedFlags = analysisResults.flatMap(r => r.redFlags);

        let quality = 'medium';
        const avgScore = (avgAuthenticity + avgExpertise) / 2;
        if (avgScore >= 7) quality = 'high';
        else if (avgScore < 5) quality = 'low';

        return {
          overallAuthenticity: avgAuthenticity,
          expertiseLevel: avgExpertise,
          contentQuality: quality,
          aiGeneratedContent: (aiGenerated / analysisResults.length) * 100,
          redFlags: [...new Set(allRedFlags)].slice(0, 5) // Unique red flags, limit to 5
        };
      }
    }

    // No content available or analysis failed
    return {
      overallAuthenticity: 5.0,
      expertiseLevel: 5.0,
      contentQuality: 'unknown',
      aiGeneratedContent: 0,
      redFlags: []
    };

  } catch (error) {
    console.error('Content intelligence analysis failed:', error);
    return {
      overallAuthenticity: 5.0,
      expertiseLevel: 5.0,
      contentQuality: 'unknown',
      aiGeneratedContent: 0,
      redFlags: ['Analysis failed']
    };
  }
}

/**
 * Generate AI prediction for prospect
 */
async function generateAIPrediction(commenter: any): Promise<GrahamPrediction | null> {
  try {
    // Convert commenter data to prospect format
    const prospectData = {
      id: commenter.id,
      name: commenter.name || '',
      headline: commenter.headline || '',
      company: commenter.company || '',
      location: commenter.location || '',
      industry: extractIndustry(commenter),
      role: extractRole(commenter),
      experience: commenter.experience || commenter.profileData?.experience || [],
      recentPosts: commenter.recentPosts || [],
      profileUrl: commenter.profileUrl || '',
      profilePicture: commenter.profilePicture || undefined
    };

    // Generate prediction
    const prediction = await predictiveScoring.predictGrahamDecision(prospectData);
    return prediction;

  } catch (error) {
    console.error('AI prediction failed:', error);
    return null;
  }
}

/**
 * Adjust score based on content intelligence
 */
function adjustScoreForContentIntelligence(
  currentScore: number,
  contentAnalysis: any,
  weights: EnhancedScoringWeights
): number {
  let adjustedScore = currentScore;

  // Authenticity adjustment
  const authenticityDiff = contentAnalysis.overallAuthenticity - 5.5; // Neutral is 5.5
  adjustedScore += (authenticityDiff * weights.contentAuthenticityWeight) / 10;

  // Expertise adjustment  
  const expertiseDiff = contentAnalysis.expertiseLevel - 5.5;
  adjustedScore += (expertiseDiff * weights.expertiseDetectionWeight) / 10;

  // AI content penalty
  if (contentAnalysis.aiGeneratedContent > 50) {
    adjustedScore -= 1.5; // Significant penalty for mostly AI content
  } else if (contentAnalysis.aiGeneratedContent > 25) {
    adjustedScore -= 0.8; // Moderate penalty
  }

  // Red flags penalty
  adjustedScore -= contentAnalysis.redFlags.length * 0.5;

  return adjustedScore;
}

/**
 * Integrate AI prediction into enhanced score
 */
function integrateAIPrediction(
  currentResult: EnhancedRelevanceScore,
  prediction: GrahamPrediction,
  weights: EnhancedScoringWeights
): EnhancedRelevanceScore {
  
  // AI prediction influence based on confidence
  const predictionInfluence = (prediction.confidence / 100) * weights.aiPredictionWeight;
  
  if (prediction.predictedDecision === 'contact') {
    currentResult.score += predictionInfluence;
  } else {
    currentResult.score -= predictionInfluence;
  }

  // Pattern match influence
  if (prediction.learningMetadata.patternsUsed > 0) {
    const patternInfluence = Math.min(prediction.learningMetadata.patternsUsed * 0.3, 1.0);
    currentResult.score += patternInfluence * weights.patternMatchWeight;
  }

  // Similar prospect influence
  const similarContactRate = prediction.reasoning.similarProspects
    .filter(p => p.grahamDecision === 'contact').length / 
    Math.max(prediction.reasoning.similarProspects.length, 1);
  
  if (prediction.reasoning.similarProspects.length > 0) {
    const similarityInfluence = (similarContactRate - 0.5) * weights.similarProspectWeight;
    currentResult.score += similarityInfluence;
  }

  return currentResult;
}

/**
 * Generate enhanced recommendations
 */
function generateEnhancedRecommendations(result: EnhancedRelevanceScore): string[] {
  const recommendations: string[] = [];

  // AI Prediction recommendations
  if (result.aiPrediction) {
    const prediction = result.aiPrediction;
    
    if (prediction.confidence >= 80) {
      if (prediction.predictedDecision === 'contact') {
        recommendations.push(`🎯 AI HIGH CONFIDENCE: ${prediction.confidence}% likely Graham would CONTACT`);
      } else {
        recommendations.push(`🚫 AI HIGH CONFIDENCE: ${prediction.confidence}% likely Graham would SKIP`);
      }
    } else if (prediction.confidence >= 60) {
      recommendations.push(`🤖 AI MODERATE CONFIDENCE: ${prediction.confidence}% ${prediction.predictedDecision.toUpperCase()}`);
    }

    // Add primary AI factors
    prediction.reasoning.primaryFactors.slice(0, 2).forEach(factor => {
      recommendations.push(factor);
    });

    // Add concerning signals
    prediction.reasoning.concerningSignals.slice(0, 2).forEach(signal => {
      recommendations.push(signal);
    });
  }

  // Content Intelligence recommendations
  if (result.contentIntelligence) {
    const content = result.contentIntelligence;
    
    if (content.overallAuthenticity >= 8) {
      recommendations.push('✅ HIGH AUTHENTICITY: Content appears genuinely human-written');
    } else if (content.overallAuthenticity <= 4) {
      recommendations.push('🤖 LOW AUTHENTICITY: Content likely AI-generated');
    }

    if (content.expertiseLevel >= 8) {
      recommendations.push('⭐ DEEP EXPERTISE: Strong industry knowledge demonstrated');
    } else if (content.expertiseLevel <= 4) {
      recommendations.push('📚 LIMITED EXPERTISE: Basic industry knowledge shown');
    }

    if (content.aiGeneratedContent > 50) {
      recommendations.push(`🚨 AI CONTENT ALERT: ${Math.round(content.aiGeneratedContent)}% of posts appear AI-generated`);
    }

    content.redFlags.slice(0, 2).forEach(flag => {
      recommendations.push(`🚩 RED FLAG: ${flag}`);
    });
  }

  // Include original recommendations if no AI data
  if (!result.aiPrediction && !result.contentIntelligence) {
    recommendations.push(...result.recommendations);
  }

  return recommendations;
}

/**
 * Extract decision factors
 */
function extractDecisionFactors(result: EnhancedRelevanceScore): {
  primary: string[];
  concerning: string[];
  neutral: string[];
} {
  const factors = {
    primary: [] as string[],
    concerning: [] as string[],
    neutral: [] as string[]
  };

  if (result.aiPrediction) {
    factors.primary.push(...result.aiPrediction.reasoning.primaryFactors);
    factors.concerning.push(...result.aiPrediction.reasoning.concerningSignals);
  }

  if (result.contentIntelligence) {
    if (result.contentIntelligence.contentQuality === 'high') {
      factors.primary.push('High-quality content profile');
    } else if (result.contentIntelligence.contentQuality === 'low') {
      factors.concerning.push('Low-quality content profile');
    }
  }

  // Add traditional scoring factors
  if (result.score >= 7) {
    factors.primary.push('High relevance score');
  } else if (result.score <= 4) {
    factors.concerning.push('Low relevance score');
  } else {
    factors.neutral.push('Moderate relevance score');
  }

  return factors;
}

/**
 * Calculate Graham likelihood
 */
function calculateGrahamLikelihood(result: EnhancedRelevanceScore): 'very_high' | 'high' | 'medium' | 'low' | 'very_low' {
  // Weight different factors
  let likelihoodScore = result.score; // Base score

  if (result.aiPrediction) {
    const aiWeight = result.aiPrediction.confidence / 100;
    if (result.aiPrediction.predictedDecision === 'contact') {
      likelihoodScore += aiWeight * 3; // Strong positive influence
    } else {
      likelihoodScore -= aiWeight * 3; // Strong negative influence
    }
  }

  if (result.contentIntelligence) {
    if (result.contentIntelligence.contentQuality === 'high') {
      likelihoodScore += 1;
    } else if (result.contentIntelligence.contentQuality === 'low') {
      likelihoodScore -= 1;
    }
  }

  // Map to likelihood categories
  if (likelihoodScore >= 8) return 'very_high';
  if (likelihoodScore >= 6.5) return 'high';
  if (likelihoodScore >= 4.5) return 'medium';
  if (likelihoodScore >= 2.5) return 'low';
  return 'very_low';
}

// Helper functions
function extractIndustry(commenter: any): string {
  return commenter.industry || 
         commenter.profileData?.industry || 
         extractFromHeadline(commenter.headline, ['M&A', 'Investment', 'Private Equity', 'Banking']) ||
         'Unknown';
}

function extractRole(commenter: any): string {
  return commenter.role ||
         commenter.profileData?.role ||
         extractFromHeadline(commenter.headline, ['CEO', 'CFO', 'Director', 'VP', 'Manager']) ||
         'Unknown';
}

function extractFromHeadline(headline: string, keywords: string[]): string {
  if (!headline) return 'Unknown';
  
  const lowerHeadline = headline.toLowerCase();
  const foundKeyword = keywords.find(keyword => 
    lowerHeadline.includes(keyword.toLowerCase())
  );
  
  return foundKeyword || 'Unknown';
}

/**
 * Batch enhanced scoring for multiple prospects
 */
export async function batchCalculateEnhancedRelevanceScores(
  commenters: any[],
  boostTerms: string[] = [],
  downTerms: string[] = [],
  analysisDepth: 'basic' | 'detailed' = 'detailed',
  weights: EnhancedScoringWeights = DEFAULT_ENHANCED_WEIGHTS,
  options: {
    includeAIPrediction?: boolean;
    includeContentAnalysis?: boolean;
    useTrainingData?: boolean;
  } = {}
): Promise<Array<{ commenterId: string; score: EnhancedRelevanceScore }>> {
  
  // Process in batches to avoid overwhelming the AI services
  const batchSize = 5;
  const results: Array<{ commenterId: string; score: EnhancedRelevanceScore }> = [];
  
  for (let i = 0; i < commenters.length; i += batchSize) {
    const batch = commenters.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (commenter) => ({
      commenterId: commenter.id,
      score: await calculateEnhancedRelevanceScore(
        commenter,
        boostTerms,
        downTerms,
        analysisDepth,
        weights,
        options
      )
    }));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches
    if (i + batchSize < commenters.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}