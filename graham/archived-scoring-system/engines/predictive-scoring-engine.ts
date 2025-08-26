/**
 * Predictive Scoring Engine - V2.0
 * AI-powered pattern recognition and decision prediction based on Graham's training data
 */

import { supabase } from '../supabase';
import { contentIntelligence } from './content-intelligence-engine';
import Anthropic from '@anthropic-ai/sdk';
import { 
  callAIServiceSafely, 
  parseAIResponse, 
  AI_MODELS, 
  DEFAULT_AI_OPTIONS 
} from '../utils/ai-service-utils';

// Core interfaces
export interface GrahamPrediction {
  predictedDecision: 'contact' | 'skip';
  confidence: number; // 0-100%
  reasoning: {
    primaryFactors: string[];
    concerningSignals: string[];
    contentQuality: ContentQualityAssessment;
    experienceMatch: ExperienceMatchAssessment;
    similarProspects: SimilarProspectMatch[];
  };
  scoreBreakdown: DetailedScoreBreakdown;
  learningMetadata: LearningMetadata;
}

export interface ContentQualityAssessment {
  overallQuality: 'high' | 'medium' | 'low';
  authenticityScore: number;
  expertiseLevel: number;
  aiContentPercentage: number;
  redFlagCount: number;
}

export interface ExperienceMatchAssessment {
  yearsInIndustry: number;
  relevancyScore: number;
  careerConsistency: number;
  credibilitySignals: string[];
  roleBreakdown?: Array<{
    title: string;
    company: string;
    years: number;
    relevanceScore: number;
    reasoning: string;
  }>;
  analysisMethod: 'AI' | 'Keywords';
}

export interface SimilarProspectMatch {
  prospectId: string;
  similarity: number;
  grahamDecision: 'contact' | 'skip';
  grahamConfidence: number;
  outcome?: {
    contacted: boolean;
    responded: boolean;
    meetingHeld: boolean;
    dealClosed: boolean;
  };
  matchingFactors: string[];
  originalReasoning?: string;
}

export interface DetailedScoreBreakdown {
  patternMatchScore: number;
  similarityScore: number;
  contentIntelligenceScore: number;
  experienceScore: number;
  redFlagPenalty: number;
  finalScore: number;
}

export interface LearningMetadata {
  patternsUsed: number;
  similarProspectsFound: number;
  dataQuality: 'high' | 'medium' | 'low';
  modelVersion: string;
  predictionId: string;
}

export interface ProspectData {
  id: string;
  name: string;
  headline: string;
  company: string;
  location: string;
  industry: string;
  role: string;
  experience: any[];
  recentPosts: any[];
  profileUrl: string;
  profilePicture?: string;
}

export interface PatternMatch {
  patternId: string;
  patternType: string;
  matchStrength: number;
  triggeredConditions: string[];
  expectedOutcome: 'contact' | 'skip';
  confidence: number;
}

export class PredictiveScoringEngine {
  private readonly MODEL_VERSION = 'v2.0';
  private readonly SIMILARITY_THRESHOLD = 0.6;
  private readonly MIN_PATTERN_CONFIDENCE = 0.5;
  private anthropicClient: any = null;
  private lastExperienceAnalysis: any = null; // Store for reasoning generation

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    try {
      // Initialize Anthropic client for AI experience analysis
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicClient = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
        console.log('Anthropic client initialized for AI experience analysis');
      } else {
        console.warn('ANTHROPIC_API_KEY not found, using keyword fallback only');
      }
    } catch (error) {
      console.warn('Failed to initialize Anthropic client for experience analysis:', error);
    }
  }

  /**
   * Generate Graham prediction for a prospect with parallel processing
   * **PERFORMANCE OPTIMIZED**: Run analysis steps in parallel where possible
   */
  async predictGrahamDecision(prospectData: ProspectData, forceRefresh: boolean = false): Promise<GrahamPrediction> {
    const startTime = Date.now();
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // **PARALLEL PROCESSING**: Run independent analysis steps concurrently
      const [contentAnalysis, similarProspects] = await Promise.allSettled([
        this.analyzeProspectContent(prospectData, forceRefresh),
        this.findSimilarProspects(prospectData)
      ]);
      
      // Extract results, using fallbacks for failed promises
      const contentResult = contentAnalysis.status === 'fulfilled' 
        ? contentAnalysis.value 
        : this.generateFallbackContentAnalysis(prospectData);
        
      const similarResult = similarProspects.status === 'fulfilled' 
        ? similarProspects.value 
        : [];
      
      // Apply learned patterns (depends on content analysis)
      const patternMatches = await this.applyLearningPatterns(prospectData, contentResult);
      
      // Generate final prediction
      const prediction = await this.generateFinalPrediction(
        prospectData,
        contentResult,
        similarResult,
        patternMatches,
        predictionId
      );

      // Store prediction for future learning (fire and forget)
      this.storePrediction(prediction, prospectData.id).catch(error => 
        console.error('Failed to store prediction (non-blocking):', error)
      );

      return prediction;

    } catch (error) {
      console.error('Prediction generation failed:', error);
      
      // Return fallback prediction
      return this.generateFallbackPrediction(prospectData, predictionId);
    }
  }

  /**
   * Analyze prospect's content using Content Intelligence Engine
   * Now handles OpenAI quota failures gracefully with fallback analysis
   */
  private async analyzeProspectContent(prospectData: ProspectData, forceRefresh: boolean = false): Promise<ContentQualityAssessment> {
    try {
      // Get content summary if available (bypass cache if forceRefresh is true)
      const contentSummary = await contentIntelligence.getProspectContentSummary(prospectData.id, forceRefresh);
      
      if (contentSummary) {
        return {
          overallQuality: contentSummary.overallQuality,
          authenticityScore: contentSummary.avgAuthenticity,
          expertiseLevel: contentSummary.avgExpertise,
          aiContentPercentage: (contentSummary.aiGeneratedPosts / Math.max(contentSummary.totalPosts, 1)) * 100,
          redFlagCount: contentSummary.redFlagCount
        };
      }

      // Try AI analysis but handle quota failures gracefully
      if (prospectData.recentPosts && prospectData.recentPosts.length > 0) {
        try {
          const analysisResults = await contentIntelligence.batchAnalyzePosts(
            prospectData.recentPosts.map(post => ({
              id: post.id,
              content: post.content,
              publishedAt: post.publishedAt || new Date().toISOString()
            })),
            prospectData.id
          );

          const avgAuthenticity = analysisResults.reduce((sum, r) => sum + r.authenticityScore, 0) / analysisResults.length;
          const avgExpertise = analysisResults.reduce((sum, r) => sum + r.expertiseLevel, 0) / analysisResults.length;
          const aiGenerated = analysisResults.filter(r => r.authenticityScore < 5).length;
          const totalRedFlags = analysisResults.reduce((sum, r) => sum + r.redFlags.length, 0);

          let overallQuality: 'high' | 'medium' | 'low' = 'medium';
          const avgScore = (avgAuthenticity + avgExpertise) / 2;
          if (avgScore >= 7) overallQuality = 'high';
          else if (avgScore < 5) overallQuality = 'low';

          return {
            overallQuality,
            authenticityScore: avgAuthenticity,
            expertiseLevel: avgExpertise,
            aiContentPercentage: (aiGenerated / analysisResults.length) * 100,
            redFlagCount: totalRedFlags
          };

        } catch (aiError: any) {
          // Handle OpenAI quota exceeded (429) or other AI failures
          if (aiError.message?.includes('429') || aiError.message?.includes('quota') || aiError.message?.includes('insufficient_quota')) {
            console.warn('OpenAI quota exceeded, using fallback content analysis for prospect:', prospectData.id);
            return this.generateFallbackContentAnalysis(prospectData);
          }
          
          // For other AI errors, also fall back gracefully
          console.warn('AI content analysis failed, using fallback:', aiError.message);
          return this.generateFallbackContentAnalysis(prospectData);
        }
      }

      // No content available - use basic fallback
      return this.generateFallbackContentAnalysis(prospectData);

    } catch (error) {
      console.error('Content analysis completely failed, using minimal fallback:', error);
      return this.generateFallbackContentAnalysis(prospectData);
    }
  }

  /**
   * Generate fallback content analysis when AI services are unavailable
   * Uses basic heuristics to approximate content quality
   */
  /**
   * Generate fallback content analysis when AI services are unavailable
   * Now exposed as public method for parallel processing error handling
   */
  public generateFallbackContentAnalysis(prospectData: ProspectData): ContentQualityAssessment {
    let redFlagCount = 0;
    let qualityIndicators = 0;
    let totalWordCount = 0;

    // Basic heuristic analysis of content without AI
    if (prospectData.recentPosts && prospectData.recentPosts.length > 0) {
      prospectData.recentPosts.forEach(post => {
        const content = (post.content || '').toLowerCase();
        const wordCount = content.split(/\s+/).filter(word => word.length > 2).length;
        totalWordCount += wordCount;

        // Red flag detection (basic keyword matching)
        // Note: Removed 'expert' as it's commonly used legitimately in professional M&A contexts
        const redFlagKeywords = [
          'guru', 'ninja', 'rockstar', 'superstar', 'maven',
          'marketing agency', 'lead generation', 'guaranteed', 'make money fast',
          'earn $', 'work from home', 'passive income', 'get rich',
          'limited time', 'act now', 'exclusive offer', 'secret formula'
        ];

        redFlagKeywords.forEach(keyword => {
          if (content.includes(keyword)) {
            redFlagCount++;
          }
        });

        // Quality indicators (basic professional keywords)
        const professionalKeywords = [
          'acquisition', 'merger', 'due diligence', 'valuation', 'deal flow',
          'private equity', 'investment', 'finance', 'strategy', 'growth',
          'revenue', 'ebitda', 'roi', 'market analysis', 'business development'
        ];

        professionalKeywords.forEach(keyword => {
          if (content.includes(keyword)) {
            qualityIndicators++;
          }
        });
      });
    }

    // Determine overall quality based on heuristics
    const avgWordCount = totalWordCount / Math.max(prospectData.recentPosts?.length || 1, 1);
    const qualityRatio = qualityIndicators / Math.max(prospectData.recentPosts?.length || 1, 1);
    
    let overallQuality: 'high' | 'medium' | 'low' = 'medium';
    let authenticityScore = 6.0; // Default neutral
    let expertiseLevel = 5.0; // Default neutral

    // Adjust based on indicators
    if (qualityRatio > 1.0 && avgWordCount > 50) {
      overallQuality = 'high';
      authenticityScore = 7.5;
      expertiseLevel = 7.0;
    } else if (redFlagCount > 2 || avgWordCount < 20) {
      overallQuality = 'low';
      authenticityScore = 4.0;
      expertiseLevel = 3.5;
    }

    // Reduce scores if many red flags detected
    if (redFlagCount > 0) {
      authenticityScore = Math.max(3.0, authenticityScore - (redFlagCount * 1.5));
      expertiseLevel = Math.max(2.0, expertiseLevel - (redFlagCount * 1.0));
    }

    return {
      overallQuality,
      authenticityScore,
      expertiseLevel,
      aiContentPercentage: 0, // Can't determine without AI
      redFlagCount: Math.min(redFlagCount, 5) // Cap at 5 for reasonable display
    };
  }

  /**
   * Find similar prospects from training decisions
   */
  private async findSimilarProspects(prospectData: ProspectData, limit: number = 10): Promise<SimilarProspectMatch[]> {
    try {
      const { data: trainingDecisions, error } = await supabase
        .from('training_decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Get recent decisions for comparison

      if (error || !trainingDecisions) return [];

      const similarities: SimilarProspectMatch[] = [];

      for (const decision of trainingDecisions) {
        const similarity = await this.calculateProspectSimilarity(prospectData, decision.prospect_snapshot);
        
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          similarities.push({
            prospectId: decision.prospect_id,
            similarity,
            grahamDecision: decision.decision,
            grahamConfidence: decision.confidence,
            matchingFactors: this.identifyMatchingFactors(prospectData, decision.prospect_snapshot),
            originalReasoning: decision.voice_transcription
          });
        }
      }

      // Sort by similarity and return top matches
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('Similar prospect matching failed:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between two prospects
   */
  private async calculateProspectSimilarity(prospect1: ProspectData, prospect2Snapshot: any): Promise<number> {
    let totalSimilarity = 0;
    let factors = 0;

    // Industry similarity (25% weight)
    if (prospect1.industry && prospect2Snapshot.basicInfo?.industry) {
      const industryMatch = this.calculateStringSimilarity(prospect1.industry, prospect2Snapshot.basicInfo.industry);
      totalSimilarity += industryMatch * 0.25;
      factors++;
    }

    // Role similarity (20% weight)
    if (prospect1.role && prospect2Snapshot.basicInfo?.role) {
      const roleMatch = this.calculateStringSimilarity(prospect1.role, prospect2Snapshot.basicInfo.role);
      totalSimilarity += roleMatch * 0.20;
      factors++;
    }

    // Company size similarity (15% weight)
    if (prospect1.company && prospect2Snapshot.basicInfo?.company) {
      const companyMatch = this.calculateStringSimilarity(prospect1.company, prospect2Snapshot.basicInfo.company);
      totalSimilarity += companyMatch * 0.15;
      factors++;
    }

    // Experience level similarity (20% weight)
    const exp1Years = await this.extractYearsOfExperience(prospect1.experience);
    const exp2Years = await this.extractYearsOfExperience(prospect2Snapshot.experienceAnalysis);
    if (exp1Years > 0 && exp2Years > 0) {
      const expSimilarity = 1 - Math.abs(exp1Years - exp2Years) / Math.max(exp1Years, exp2Years);
      totalSimilarity += expSimilarity * 0.20;
      factors++;
    }

    // Content quality similarity (20% weight)
    if (prospect1.recentPosts?.length > 0 && prospect2Snapshot.contentAnalysis) {
      const contentSimilarity = await this.calculateContentSimilarity(prospect1.recentPosts, prospect2Snapshot.contentAnalysis);
      totalSimilarity += contentSimilarity * 0.20;
      factors++;
    }

    return factors > 0 ? totalSimilarity : 0;
  }

  /**
   * Apply learned patterns to prospect
   */
  private async applyLearningPatterns(prospectData: ProspectData, contentAnalysis: ContentQualityAssessment): Promise<PatternMatch[]> {
    try {
      const { data: patterns, error } = await supabase
        .from('decision_patterns')
        .select('*')
        .gte('confidence', this.MIN_PATTERN_CONFIDENCE)
        .order('confidence', { ascending: false });

      if (error || !patterns) return [];

      const matchedPatterns: PatternMatch[] = [];

      for (const pattern of patterns) {
        const matchResult = await this.evaluatePatternMatch(prospectData, contentAnalysis, pattern);
        
        if (matchResult.matches) {
          matchedPatterns.push({
            patternId: pattern.id,
            patternType: pattern.pattern_type,
            matchStrength: matchResult.strength,
            triggeredConditions: matchResult.triggeredConditions,
            expectedOutcome: pattern.expected_outcome,
            confidence: pattern.confidence
          });
        }
      }

      return matchedPatterns.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Pattern application failed:', error);
      return [];
    }
  }

  /**
   * Evaluate if a pattern matches the prospect
   */
  private async evaluatePatternMatch(
    prospectData: ProspectData, 
    contentAnalysis: ContentQualityAssessment, 
    pattern: any
  ): Promise<{ matches: boolean; strength: number; triggeredConditions: string[] }> {
    try {
      const conditions = pattern.trigger_conditions;
      const triggeredConditions: string[] = [];
      let matchStrength = 0;

      switch (conditions.field) {
        case 'avgAuthenticity':
          if (conditions.operator === 'less_than' && contentAnalysis.authenticityScore < conditions.value) {
            triggeredConditions.push(`Low authenticity: ${contentAnalysis.authenticityScore.toFixed(1)} < ${conditions.value}`);
            matchStrength = 1.0;
          } else if (conditions.operator === 'greater_than_equal' && contentAnalysis.authenticityScore >= conditions.value) {
            triggeredConditions.push(`High authenticity: ${contentAnalysis.authenticityScore.toFixed(1)} >= ${conditions.value}`);
            matchStrength = 1.0;
          }
          break;

        case 'yearsInIndustry':
          const yearsExp = await this.extractYearsOfExperience(prospectData.experience);
          if (conditions.operator === 'greater_than_equal' && yearsExp >= conditions.value) {
            triggeredConditions.push(`Experienced: ${yearsExp} years >= ${conditions.value}`);
            matchStrength = 1.0;
          } else if (conditions.operator === 'less_than' && yearsExp < conditions.value) {
            triggeredConditions.push(`Limited experience: ${yearsExp} years < ${conditions.value}`);
            matchStrength = 1.0;
          }
          break;

        case 'redFlagCount':
          if (conditions.operator === 'greater_than' && contentAnalysis.redFlagCount > conditions.value) {
            triggeredConditions.push(`Red flags detected: ${contentAnalysis.redFlagCount} > ${conditions.value}`);
            matchStrength = 1.0;
          }
          break;

        case 'aiContentPercentage':
          if (conditions.operator === 'greater_than' && contentAnalysis.aiContentPercentage > conditions.value) {
            triggeredConditions.push(`High AI content: ${contentAnalysis.aiContentPercentage.toFixed(1)}% > ${conditions.value}%`);
            matchStrength = 1.0;
          }
          break;
      }

      return {
        matches: triggeredConditions.length > 0,
        strength: matchStrength,
        triggeredConditions
      };

    } catch (error) {
      console.error('Pattern evaluation failed:', error);
      return { matches: false, strength: 0, triggeredConditions: [] };
    }
  }

  /**
   * Generate final prediction based on all analysis
   */
  private async generateFinalPrediction(
    prospectData: ProspectData,
    contentAnalysis: ContentQualityAssessment,
    similarProspects: SimilarProspectMatch[],
    patternMatches: PatternMatch[],
    predictionId: string
  ): Promise<GrahamPrediction> {
    
    // Calculate score components
    const patternScore = this.calculatePatternScore(patternMatches);
    const similarityScore = this.calculateSimilarityScore(similarProspects);
    const contentScore = this.calculateContentScore(contentAnalysis);
    const experienceScore = await this.calculateExperienceScore(prospectData.experience);
    const redFlagPenalty = Math.max(contentAnalysis.redFlagCount * -0.5, -3.0); // Reduce penalty and cap at -3

    // If no training data exists, weight experience and content more heavily
    const hasTrainingData = patternMatches.length > 0 || similarProspects.length > 0;
    
    let finalScore;
    if (hasTrainingData) {
      // Use original weights when training data is available
      finalScore = (
        patternScore * 0.4 +
        similarityScore * 0.3 +
        contentScore * 0.15 +
        experienceScore * 0.15 +
        redFlagPenalty
      );
    } else {
      // Bootstrap weights - rely more on experience and content when no training data
      finalScore = (
        contentScore * 0.4 +
        experienceScore * 0.6 +
        redFlagPenalty
      );
    }

    // Determine decision and confidence
    const predictedDecision: 'contact' | 'skip' = finalScore >= 0 ? 'contact' : 'skip';
    const confidence = Math.min(100, Math.abs(finalScore) * 20); // Scale to 0-100

    // Generate reasoning
    const reasoning = await this.generateReasoning(
      contentAnalysis,
      prospectData.experience,
      similarProspects,
      patternMatches
    );

    return {
      predictedDecision,
      confidence,
      reasoning,
      scoreBreakdown: {
        patternMatchScore: patternScore,
        similarityScore,
        contentIntelligenceScore: contentScore,
        experienceScore,
        redFlagPenalty,
        finalScore
      },
      learningMetadata: {
        patternsUsed: patternMatches.length,
        similarProspectsFound: similarProspects.length,
        dataQuality: this.assessDataQuality(prospectData, contentAnalysis),
        modelVersion: this.MODEL_VERSION,
        predictionId
      }
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private async generateReasoning(
    contentAnalysis: ContentQualityAssessment,
    experience: any[],
    similarProspects: SimilarProspectMatch[],
    patternMatches: PatternMatch[]
  ): Promise<{
    primaryFactors: string[];
    concerningSignals: string[];
    contentQuality: ContentQualityAssessment;
    experienceMatch: ExperienceMatchAssessment;
    similarProspects: SimilarProspectMatch[];
  }> {
    const primaryFactors: string[] = [];
    const concerningSignals: string[] = [];

    // Experience factors
    const yearsExp = await this.extractYearsOfExperience(experience);
    if (yearsExp >= 10) {
      primaryFactors.push(`⭐ ${yearsExp} years industry experience (Gold Standard)`);
    } else if (yearsExp >= 5) {
      primaryFactors.push(`✅ ${yearsExp} years industry experience (Good)`);
    } else if (yearsExp >= 3) {
      primaryFactors.push(`⚡ ${yearsExp} years industry experience (Emerging)`);
    } else {
      concerningSignals.push(`⚠️ Limited experience: Only ${yearsExp} years in industry`);
    }

    // Content quality factors
    if (contentAnalysis.overallQuality === 'high') {
      primaryFactors.push('💎 High-quality content profile');
    } else if (contentAnalysis.overallQuality === 'low') {
      concerningSignals.push('❌ Low-quality content profile');
    }

    if (contentAnalysis.aiContentPercentage > 50) {
      concerningSignals.push(`🤖 ${Math.round(contentAnalysis.aiContentPercentage)}% AI-generated content`);
    }

    if (contentAnalysis.redFlagCount > 0) {
      concerningSignals.push(`🚨 ${contentAnalysis.redFlagCount} content red flags detected`);
    }

    // Pattern matches
    const contactPatterns = patternMatches.filter(p => p.expectedOutcome === 'contact');
    const skipPatterns = patternMatches.filter(p => p.expectedOutcome === 'skip');

    if (contactPatterns.length > 0) {
      primaryFactors.push(`🎯 Matches ${contactPatterns.length} positive patterns`);
    }

    if (skipPatterns.length > 0) {
      concerningSignals.push(`⚠️ Matches ${skipPatterns.length} negative patterns`);
    }

    // Similar prospects
    const similarSuccesses = similarProspects.filter(p => p.grahamDecision === 'contact');
    if (similarSuccesses.length > 0) {
      primaryFactors.push(`📊 Similar to ${similarSuccesses.length} prospects Graham contacted`);
    }

    return {
      primaryFactors,
      concerningSignals,
      contentQuality: contentAnalysis,
      experienceMatch: {
        yearsInIndustry: yearsExp,
        relevancyScore: this.calculateRelevancyScore(experience),
        careerConsistency: this.calculateCareerConsistency(experience),
        credibilitySignals: this.extractCredibilitySignals(experience),
        roleBreakdown: this.lastExperienceAnalysis?.roleAnalysis || [],
        analysisMethod: this.lastExperienceAnalysis?.analysisMethod || 'Keywords'
      },
      similarProspects: similarProspects.slice(0, 3) // Top 3 most similar
    };
  }

  // Helper methods
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    // Simple Levenshtein distance implementation
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLength = Math.max(s1.length, s2.length);
    return maxLength > 0 ? 1 - (matrix[s2.length][s1.length] / maxLength) : 0;
  }

  /**
   * AI-powered M&A experience analysis with keyword fallback
   */
  private async extractYearsOfExperience(experience: any[]): Promise<number> {
    if (!Array.isArray(experience)) return 0;
    
    try {
      // Try AI-powered analysis first
      console.log('Attempting AI-powered experience analysis...');
      const aiAnalysis = await this.analyzeExperienceWithAI(experience);
      if (aiAnalysis.success) {
        console.log(`AI analysis successful: ${aiAnalysis.weightedYears} years from ${aiAnalysis.roleAnalysis.length} roles`);
        // Store for later use in reasoning generation
        this.lastExperienceAnalysis = {
          ...aiAnalysis,
          analysisMethod: 'AI'
        };
        return aiAnalysis.weightedYears;
      }
      
      console.warn('AI experience analysis failed, falling back to keyword matching');
    } catch (error) {
      console.warn('AI experience analysis error:', error);
    }
    
    // Fallback to improved keyword matching
    const keywordYears = this.extractYearsWithKeywords(experience);
    this.lastExperienceAnalysis = {
      success: true,
      weightedYears: keywordYears,
      roleAnalysis: [], // Keywords don't provide detailed breakdown
      analysisMethod: 'Keywords'
    };
    
    return keywordYears;
  }

  /**
   * AI-powered analysis of each role for M&A relevance
   */
  private async analyzeExperienceWithAI(experience: any[]): Promise<{
    success: boolean;
    weightedYears: number;
    roleAnalysis: Array<{
      title: string;
      company: string;
      years: number;
      relevanceScore: number;
      reasoning: string;
    }>;
  }> {
    if (!experience || experience.length === 0) {
      return { success: false, weightedYears: 0, roleAnalysis: [] };
    }

    const currentYear = new Date().getFullYear();
    const roleAnalysis: Array<{
      title: string;
      company: string;
      years: number;
      relevanceScore: number;
      reasoning: string;
    }> = [];

    // Prepare experience data for AI analysis
    const experienceText = experience.map((job, index) => {
      const startYear = this.extractYear(job.start_date || job.startDate);
      const endYear = job.end_date || job.endDate ? this.extractYear(job.end_date || job.endDate) : currentYear;
      const duration = startYear && endYear ? `${startYear}-${endYear === currentYear ? 'Present' : endYear}` : 'Unknown duration';
      
      return `
ROLE ${index + 1}:
Title: ${job.title || 'Unknown Title'}
Company: ${job.company || 'Unknown Company'}
Duration: ${duration}
Description: ${job.description || 'No description available'}
---`;
    }).join('\n');

    const analysisPrompt = `
You are an expert in analyzing professional experience for M&A/Business Brokerage relevance.

Analyze each role below and assign a relevance score from 0.0 to 1.0 based on how directly it relates to M&A work:

SCORING GUIDELINES:
- 1.0: Direct M&A work (Business Broker, M&A Advisor, Investment Banker doing deals, Deal sourcing)
- 0.8-0.9: Business consulting focused on exits/acquisitions, Corporate Development, Private Equity
- 0.6-0.7: Related finance (Valuation, Corporate Finance, Investment Advisory)
- 0.4-0.5: Business consulting/strategy without clear M&A focus
- 0.2-0.3: General finance/executive roles (CFO, Controller, CEO without M&A context)
- 0.0: Completely unrelated (Marketing agencies, Personal training, Retail, Technical roles)

EXCLUDE COMPLETELY (0.0 score):
- Marketing/advertising agencies
- Personal training/fitness
- Retail/customer service
- Technical roles without business context
- Teaching/education

EXPERIENCE TO ANALYZE:
${experienceText}

Return response in this exact JSON format:
{
  "roles": [
    {
      "roleIndex": 0,
      "title": "extracted title",
      "company": "extracted company", 
      "relevanceScore": 0.8,
      "reasoning": "Brief explanation of why this score was assigned"
    }
  ]
}`;

    try {
      // Use Anthropic for analysis if available
      if (!this.anthropicClient) {
        throw new Error('Anthropic client not available');
      }

      const response = await callAIServiceSafely('anthropic', async () => {
        return this.anthropicClient!.messages.create({
          model: AI_MODELS.CLAUDE.LATEST,
          max_tokens: 4000,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: analysisPrompt
          }]
        });
      }, DEFAULT_AI_OPTIONS);

      const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const aiResult = parseAIResponse(responseText, 'Experience analysis response');
      let totalWeightedYears = 0;

      // Process each role analysis
      aiResult.roles?.forEach((roleAI: any, index: number) => {
        const job = experience[index];
        if (!job) return;

        const startYear = this.extractYear(job.start_date || job.startDate);
        const endYear = job.end_date || job.endDate ? this.extractYear(job.end_date || job.endDate) : currentYear;
        
        if (startYear && endYear >= startYear) {
          const years = endYear - startYear + 1;
          const relevanceScore = Math.max(0, Math.min(1, roleAI.relevanceScore || 0));
          const weightedYears = years * relevanceScore;
          
          totalWeightedYears += weightedYears;

          roleAnalysis.push({
            title: job.title || roleAI.title || 'Unknown',
            company: job.company || roleAI.company || 'Unknown',
            years: years,
            relevanceScore: relevanceScore,
            reasoning: roleAI.reasoning || 'AI analysis completed'
          });
        }
      });

      return {
        success: true,
        weightedYears: Math.round(totalWeightedYears * 10) / 10,
        roleAnalysis
      };

    } catch (error) {
      console.error('AI experience analysis failed:', error);
      return { success: false, weightedYears: 0, roleAnalysis: [] };
    }
  }

  /**
   * Improved keyword-based fallback analysis
   */
  private extractYearsWithKeywords(experience: any[]): number {
    const currentYear = new Date().getFullYear();
    
    // Define M&A relevance tiers with specific scoring weights
    const DIRECT_MA_KEYWORDS = [
      'business broker', 'broker', 'brokerage', 'm&a', 'merger', 'acquisition', 
      'deal flow', 'valuation', 'due diligence', 'investment banker',
      'transaction advisory', 'deal sourcing', 'business exit', 'business intermediary',
      'sell side', 'buy side', 'deal maker', 'acquisitions', 'divestiture'
    ];
    
    const HIGH_RELEVANCE_KEYWORDS = [
      'private equity', 'investment advisor', 'corporate finance', 'venture capital',
      'corporate development', 'strategic planning', 'investment management',
      'financial advisor', 'wealth management', 'capital markets'
    ];
    
    const MEDIUM_RELEVANCE_KEYWORDS = [
      'management consulting', 'strategy consulting', 'business consulting',
      'corporate strategy', 'business development', 'partnerships',
      'strategic alliances', 'joint ventures'
    ];
    
    const LOW_RELEVANCE_KEYWORDS = [
      'cfo', 'finance director', 'financial analyst', 'controller',
      'accounting', 'tax', 'audit', 'compliance'
    ];
    
    // Roles that should NOT count as M&A experience despite being business-related
    const EXCLUDED_ROLES = [
      'marketing', 'advertising', 'social media', 'content', 'copywriter',
      'seo', 'sem', 'digital marketing', 'brand', 'creative',
      'personal trainer', 'fitness', 'gym', 'health', 'wellness',
      'coach', 'training', 'education', 'teaching', 'instructor',
      'retail', 'sales representative', 'customer service', 'support'
    ];
    
    // Calculate M&A relevance score for each job
    const scoredRoles: Array<{
      start: number, 
      end: number, 
      relevanceScore: number,
      title: string,
      company: string
    }> = [];
    
    experience.forEach(job => {
      const jobText = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
      const title = (job.title || '').toLowerCase();
      const company = (job.company || '').toLowerCase();
      
      // Check for excluded roles first - these get 0 score regardless of other keywords
      const isExcluded = EXCLUDED_ROLES.some(excluded => 
        title.includes(excluded) || company.includes(excluded) || jobText.includes(excluded)
      );
      
      if (isExcluded) {
        // Skip completely - don't count marketing agencies, fitness, etc.
        return;
      }
      
      // Calculate relevance score
      let relevanceScore = 0;
      
      // Direct M&A = 1.0 (100% relevant)
      if (DIRECT_MA_KEYWORDS.some(keyword => jobText.includes(keyword))) {
        relevanceScore = 1.0;
      }
      // High relevance = 0.7 (70% relevant) 
      else if (HIGH_RELEVANCE_KEYWORDS.some(keyword => jobText.includes(keyword))) {
        relevanceScore = 0.7;
      }
      // Medium relevance = 0.4 (40% relevant)
      else if (MEDIUM_RELEVANCE_KEYWORDS.some(keyword => jobText.includes(keyword))) {
        relevanceScore = 0.4;
      }
      // Low relevance = 0.2 (20% relevant)
      else if (LOW_RELEVANCE_KEYWORDS.some(keyword => jobText.includes(keyword))) {
        relevanceScore = 0.2;
      }
      // Generic business terms like "entrepreneur", "founder", "ceo" without specific context = 0.1 (10% relevant)
      else if (['entrepreneur', 'founder', 'ceo', 'owner', 'president'].some(keyword => jobText.includes(keyword))) {
        relevanceScore = 0.1;
      }
      
      // Only include roles with some relevance
      if (relevanceScore > 0) {
        const startYear = this.extractYear(job.start_date || job.startDate);
        const endYear = job.end_date || job.endDate ? this.extractYear(job.end_date || job.endDate) : currentYear;
        
        if (startYear && endYear >= startYear) {
          scoredRoles.push({
            start: startYear,
            end: endYear,
            relevanceScore: relevanceScore,
            title: job.title || '',
            company: job.company || ''
          });
        }
      }
    });
    
    if (scoredRoles.length === 0) return 0;
    
    // Sort and merge overlapping periods, keeping the highest relevance score
    scoredRoles.sort((a, b) => a.start - b.start);
    const mergedPeriods: Array<{start: number, end: number, relevanceScore: number}> = [];
    
    for (const role of scoredRoles) {
      const lastPeriod = mergedPeriods[mergedPeriods.length - 1];
      
      if (lastPeriod && role.start <= lastPeriod.end + 1) {
        // Merge periods, keeping highest relevance score
        lastPeriod.end = Math.max(lastPeriod.end, role.end);
        lastPeriod.relevanceScore = Math.max(lastPeriod.relevanceScore, role.relevanceScore);
      } else {
        mergedPeriods.push({
          start: role.start,
          end: role.end,
          relevanceScore: role.relevanceScore
        });
      }
    }
    
    // Calculate weighted M&A experience
    const weightedYears = mergedPeriods.reduce((total, period) => {
      const periodYears = Math.min(period.end - period.start + 1, 15); // Cap individual periods at 15 years
      return total + (periodYears * period.relevanceScore);
    }, 0);
    
    // Round to 1 decimal place and cap at reasonable maximum
    return Math.min(Math.round(weightedYears * 10) / 10, 20);
  }

  private extractYear(dateField: any): number | null {
    if (!dateField) return null;
    
    // Handle LinkedIn API object format: {year: 2024, month: 2, day: 15}
    if (typeof dateField === 'object') {
      if (dateField.year && !isNaN(parseInt(dateField.year))) {
        return parseInt(dateField.year);
      }
      
      // Handle nested date objects
      if (dateField.date && typeof dateField.date === 'object' && dateField.date.year) {
        return parseInt(dateField.date.year);
      }
      
      // Handle ISO string in object
      if (dateField.date && typeof dateField.date === 'string') {
        const isoYear = new Date(dateField.date).getFullYear();
        if (!isNaN(isoYear) && isoYear > 1900 && isoYear <= new Date().getFullYear() + 1) {
          return isoYear;
        }
      }
    }
    
    // Handle string formats
    if (typeof dateField === 'string') {
      // Try ISO date first
      const isoDate = new Date(dateField);
      if (!isNaN(isoDate.getTime())) {
        const year = isoDate.getFullYear();
        if (year > 1900 && year <= new Date().getFullYear() + 1) {
          return year;
        }
      }
      
      // Try extracting 4-digit year from string (2024, "Jan 2024", etc.)
      const yearMatch = dateField.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) return parseInt(yearMatch[0]);
    }
    
    // Handle number
    if (typeof dateField === 'number') {
      if (dateField > 1900 && dateField <= new Date().getFullYear() + 1) {
        return dateField;
      }
    }
    
    return null;
  }

  private calculatePatternScore(patterns: PatternMatch[]): number {
    if (patterns.length === 0) return 0;
    
    return patterns.reduce((sum, pattern) => {
      const weight = pattern.expectedOutcome === 'contact' ? 1 : -1;
      return sum + (pattern.confidence * pattern.matchStrength * weight);
    }, 0);
  }

  private calculateSimilarityScore(similar: SimilarProspectMatch[]): number {
    if (similar.length === 0) return 0;
    
    return similar.reduce((sum, match) => {
      const weight = match.grahamDecision === 'contact' ? 1 : -1;
      return sum + (match.similarity * weight);
    }, 0) / similar.length;
  }

  private calculateContentScore(content: ContentQualityAssessment): number {
    let score = 0;
    
    if (content.overallQuality === 'high') score += 2;
    else if (content.overallQuality === 'low') score -= 2;
    
    if (content.authenticityScore >= 8) score += 1;
    else if (content.authenticityScore <= 4) score -= 2;
    
    if (content.expertiseLevel >= 8) score += 1;
    else if (content.expertiseLevel <= 4) score -= 1;
    
    return score;
  }

  private async calculateExperienceScore(experience: any[]): Promise<number> {
    const years = await this.extractYearsOfExperience(experience);
    
    if (years >= 10) return 3;
    if (years >= 5) return 1;
    if (years >= 3) return 0;
    return -2;
  }

  private calculateRelevancyScore(experience: any[]): number {
    // Implementation depends on experience analysis
    return 0.5; // Placeholder
  }

  private calculateCareerConsistency(experience: any[]): number {
    // Implementation depends on experience analysis
    return 0.5; // Placeholder
  }

  private extractCredibilitySignals(experience: any[]): string[] {
    // Implementation depends on experience analysis
    return []; // Placeholder
  }

  private async calculateContentSimilarity(posts1: any[], contentAnalysis2: any[]): Promise<number> {
    // Implementation would compare content patterns
    return 0.5; // Placeholder
  }

  private identifyMatchingFactors(prospect1: ProspectData, snapshot2: any): string[] {
    const factors: string[] = [];
    
    if (prospect1.industry === snapshot2.basicInfo?.industry) {
      factors.push('Same industry');
    }
    
    if (prospect1.role === snapshot2.basicInfo?.role) {
      factors.push('Same role');
    }
    
    return factors;
  }

  private assessDataQuality(prospectData: ProspectData, contentAnalysis: ContentQualityAssessment): 'high' | 'medium' | 'low' {
    let qualityScore = 0;
    
    if (prospectData.experience?.length > 0) qualityScore++;
    if (prospectData.recentPosts?.length >= 5) qualityScore++;
    if (contentAnalysis.authenticityScore > 0) qualityScore++;
    
    if (qualityScore >= 3) return 'high';
    if (qualityScore >= 2) return 'medium';
    return 'low';
  }

  private generateFallbackPrediction(prospectData: ProspectData, predictionId: string): GrahamPrediction {
    return {
      predictedDecision: 'skip',
      confidence: 20,
      reasoning: {
        primaryFactors: [],
        concerningSignals: ['Prediction failed - insufficient data'],
        contentQuality: {
          overallQuality: 'low',
          authenticityScore: 5,
          expertiseLevel: 5,
          aiContentPercentage: 0,
          redFlagCount: 0
        },
        experienceMatch: {
          yearsInIndustry: 0,
          relevancyScore: 0,
          careerConsistency: 0,
          credibilitySignals: []
        },
        similarProspects: []
      },
      scoreBreakdown: {
        patternMatchScore: 0,
        similarityScore: 0,
        contentIntelligenceScore: 0,
        experienceScore: 0,
        redFlagPenalty: 0,
        finalScore: -1
      },
      learningMetadata: {
        patternsUsed: 0,
        similarProspectsFound: 0,
        dataQuality: 'low',
        modelVersion: this.MODEL_VERSION,
        predictionId
      }
    };
  }

  private async storePrediction(prediction: GrahamPrediction, prospectId: string): Promise<void> {
    try {
      await supabase.from('prediction_results').insert({
        prospect_id: prospectId,
        predicted_decision: prediction.predictedDecision,
        confidence_score: prediction.confidence,
        reasoning: prediction.reasoning,
        matched_patterns: [], // Would include pattern IDs
        similar_prospects: prediction.reasoning.similarProspects,
        model_version: prediction.learningMetadata.modelVersion,
        processing_time_ms: 0 // Would calculate actual processing time
      });
    } catch (error) {
      console.error('Failed to store prediction:', error);
    }
  }
}

// Export singleton instance
export const predictiveScoring = new PredictiveScoringEngine();