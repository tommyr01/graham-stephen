/**
 * Content Intelligence Engine - V2.0
 * AI-powered content analysis for LinkedIn posts
 * Integrates with OpenAI/Anthropic for authenticity and expertise assessment
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { supabase } from '../supabase';

// Configuration interfaces
export interface ContentAnalysisConfig {
  aiProvider: 'openai' | 'anthropic';
  model: string;
  maxTokens: number;
  temperature: number;
  cacheEnabled: boolean;
  cacheTTLDays: number;
}

export interface ContentAnalysisResult {
  postId: string;
  contentHash: string;
  authenticityScore: number;      // 1-10 scale (human vs AI generated)
  expertiseLevel: number;         // 1-10 scale (industry knowledge depth)
  specificityScore: number;       // 1-10 scale (concrete vs generic)
  professionalismScore: number;   // 1-10 scale (writing quality)
  redFlags: string[];
  reasoning: string;
  aiProvider: string;
  modelVersion: string;
  processingTime: number;
  cached: boolean;
}

export interface LinkedInPost {
  id: string;
  content: string;
  publishedAt: string;
  engagement?: {
    likes: number;
    comments: number;
    reposts: number;
  };
  postType?: string;
  url?: string;
}

// Default configuration - Updated to use Claude 3.5 Sonnet for better performance
const DEFAULT_CONFIG: ContentAnalysisConfig = {
  aiProvider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022', // Working Claude 3.5 Sonnet model
  maxTokens: 2000, // Increased for batch processing capabilities
  temperature: 0.1,
  cacheEnabled: true,
  cacheTTLDays: 30
};

// Analysis prompts optimized for M&A/Business Brokerage industry
const AUTHENTICITY_ANALYSIS_PROMPT = `
You are an expert in analyzing LinkedIn content for authenticity in the M&A/Business Brokerage industry.

Analyze this LinkedIn post for the following factors (rate each 1-10):

POST CONTENT: {content}

Rate 1-10 for each factor:

1. AUTHENTICITY: Does this sound human-written vs AI-generated?
   - Look for: Personal voice, specific details, natural imperfections, unique perspective
   - Red flags: Generic phrases, perfect structure, buzzword overuse, formulaic language
   - 9-10: Clearly human, personal voice, specific experiences
   - 7-8: Mostly human with some polish
   - 5-6: Could be either, moderate authenticity signals
   - 3-4: Likely AI with some human editing
   - 1-2: Obviously AI-generated, generic, formulaic

2. INDUSTRY EXPERTISE: Does this show real M&A/brokerage knowledge?
   - Look for: Specific deal values, actual processes, industry terminology, real client situations
   - Red flags: Surface-level business speak, vague references, generic advice
   - 9-10: Deep industry knowledge, specific deal examples, insider terminology
   - 7-8: Good industry understanding, some specifics
   - 5-6: Basic industry knowledge
   - 3-4: Limited understanding, mostly generic business content
   - 1-2: No industry knowledge, completely generic

3. SPECIFICITY: Concrete details vs generic business content?
   - Look for: Actual numbers, client situations, specific outcomes, real examples
   - Red flags: Vague statements, motivational platitudes, generic success stories
   - 9-10: Highly specific with real examples and numbers
   - 7-8: Good specificity with some concrete details
   - 5-6: Mix of specific and generic content
   - 3-4: Mostly generic with few specifics
   - 1-2: Completely generic, no specific details

4. PROFESSIONALISM: Quality of business communication?
   - Look for: Clear communication, professional tone, value-driven content, credible insights
   - Red flags: Poor grammar, unprofessional language, sales-heavy content
   - 9-10: Excellent professional communication
   - 7-8: Good professional quality
   - 5-6: Adequate professionalism
   - 3-4: Below professional standards
   - 1-2: Unprofessional or heavily promotional

Also identify any RED FLAGS (return as array of strings):
- Generic motivational language patterns
- Excessive buzzword usage
- Lead generation/marketing service indicators
- Recent career pivot signals
- Startup/entrepreneur red flags
- Copy-paste content patterns
- AI writing signatures

Return response in this exact JSON format:
{
  "authenticityScore": number,
  "expertiseLevel": number, 
  "specificityScore": number,
  "professionalismScore": number,
  "redFlags": ["flag1", "flag2"],
  "reasoning": "Brief explanation of the analysis in 2-3 sentences focusing on key decision factors"
}
`;

// Batch analysis prompt for efficient processing of multiple posts
const BATCH_AUTHENTICITY_ANALYSIS_PROMPT = `
You are an expert in analyzing LinkedIn content for authenticity in the M&A/Business Brokerage industry.

I will provide you with multiple LinkedIn posts from the same person. Analyze each post individually using these criteria:

1. AUTHENTICITY: Does this content feel genuine and human-written?
   - Look for: Personal insights, unique perspectives, natural language patterns, specific experiences
   - Red flags: Generic phrases, buzzword overuse, templated language, AI-generated patterns
   - 9-10: Highly authentic, clearly human-written with unique voice
   - 7-8: Mostly authentic with natural language
   - 5-6: Mixed signals, some generic elements
   - 3-4: Mostly generic or template-like
   - 1-2: Likely AI-generated or heavily templated

2. EXPERTISE: Demonstrates real M&A/Business Brokerage knowledge?
   - Look for: Deal experience, market insights, specific industry knowledge, professional credentials
   - Red flags: Surface-level knowledge, generic business advice, unrelated content
   - 9-10: Deep industry expertise with specific examples
   - 7-8: Good knowledge with relevant insights
   - 5-6: Basic understanding of the field
   - 3-4: Limited relevant expertise
   - 1-2: No clear industry knowledge

3. SPECIFICITY: Uses concrete examples vs vague statements?
   - Look for: Specific deal sizes, real examples, measurable outcomes, detailed scenarios
   - Red flags: Vague statements, motivational platitudes, generic success stories
   - 9-10: Highly specific with real examples and numbers
   - 7-8: Good specificity with some concrete details
   - 5-6: Mix of specific and generic content
   - 3-4: Mostly generic with few specifics
   - 1-2: Completely generic, no specific details

4. PROFESSIONALISM: Quality of business communication?
   - Look for: Clear communication, professional tone, value-driven content, credible insights
   - Red flags: Poor grammar, unprofessional language, sales-heavy content
   - 9-10: Excellent professional communication
   - 7-8: Good professional quality
   - 5-6: Adequate professionalism
   - 3-4: Below professional standards
   - 1-2: Unprofessional or heavily promotional

For each post, also identify any RED FLAGS:
- Generic motivational language patterns
- Excessive buzzword usage
- Lead generation/marketing service indicators
- Recent career pivot signals
- Startup/entrepreneur red flags
- Copy-paste content patterns
- AI writing signatures

POSTS TO ANALYZE:
{posts}

Return response in this exact JSON format (array of objects, one per post):
[
  {
    "postIndex": 0,
    "authenticityScore": number,
    "expertiseLevel": number, 
    "specificityScore": number,
    "professionalismScore": number,
    "redFlags": ["flag1", "flag2"],
    "reasoning": "Brief explanation of the analysis for this post"
  },
  // ... more posts
]
`;

export class ContentIntelligenceEngine {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private config: ContentAnalysisConfig;

  constructor(config: Partial<ContentAnalysisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeClients();
  }

  private initializeClients(): void {
    try {
      // Initialize OpenAI client
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      }

      // Initialize Anthropic client
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicClient = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
      }

      if (!this.openaiClient && !this.anthropicClient) {
        console.warn('No AI provider API keys found. Content analysis will be unavailable.');
      }
    } catch (error) {
      console.error('Failed to initialize AI clients:', error);
    }
  }

  /**
   * Analyze a single LinkedIn post for content intelligence
   */
  async analyzePost(post: LinkedInPost, prospectId: string): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    const contentHash = this.generateContentHash(post.content);

    // Check cache first if enabled
    if (this.config.cacheEnabled) {
      const cachedResult = await this.getCachedAnalysis(contentHash, this.config.aiProvider);
      if (cachedResult) {
        return {
          ...cachedResult,
          postId: post.id,
          cached: true,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Perform AI analysis
    const analysisResult = await this.performAIAnalysis(post.content);
    const processingTime = Date.now() - startTime;

    const result: ContentAnalysisResult = {
      postId: post.id,
      contentHash,
      ...analysisResult,
      aiProvider: this.config.aiProvider,
      modelVersion: this.config.model,
      processingTime,
      cached: false
    };

    // Cache the result if enabled
    if (this.config.cacheEnabled) {
      await this.cacheAnalysis(result, prospectId);
    }

    return result;
  }

  /**
   * Batch analyze multiple posts with parallel processing and improved error handling
   * **PERFORMANCE OPTIMIZED**: Use parallel batches for maximum throughput
   */
  async batchAnalyzePosts(
    posts: LinkedInPost[], 
    prospectId: string
  ): Promise<ContentAnalysisResult[]> {
    if (posts.length === 0) return [];
    
    const results: ContentAnalysisResult[] = [];
    
    // **PARALLEL BATCH PROCESSING**: Split into multiple parallel batches
    const batchSize = Math.min(6, posts.length); // Slightly smaller batches for reliability
    const batches: LinkedInPost[][] = [];
    
    for (let i = 0; i < posts.length; i += batchSize) {
      batches.push(posts.slice(i, i + batchSize));
    }
    
    // Process all batches in parallel with timeout protection
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const batchStartTime = Date.now();
      
      try {
        // Add timeout to batch processing
        const batchPromise = this.analyzeBatchWithClaude(batch, prospectId);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Batch ${batchIndex} timeout after 45 seconds`)), 45000)
        );
        
        const batchResults = await Promise.race([batchPromise, timeoutPromise]);
        
        // Update processing time for each result
        const batchProcessingTime = Date.now() - batchStartTime;
        batchResults.forEach(result => {
          result.processingTime = batchProcessingTime / batch.length; // Distribute time across posts
        });
        
        return { success: true, results: batchResults };
        
      } catch (error) {
        console.error(`Batch ${batchIndex} analysis failed:`, error);
        
        // Fallback to individual analysis for this batch
        try {
          const fallbackResults = await this.fallbackToIndividualAnalysis(batch, prospectId);
          return { success: true, results: fallbackResults };
        } catch (fallbackError) {
          console.error(`Fallback for batch ${batchIndex} also failed:`, fallbackError);
          // Return default results to prevent complete failure
          const defaultResults = batch.map(post => this.createDefaultAnalysisResult(post));
          return { success: false, results: defaultResults };
        }
      }
    });

    // Wait for all batches to complete
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Collect all results
    batchResults.forEach((settledResult, batchIndex) => {
      if (settledResult.status === 'fulfilled') {
        results.push(...settledResult.value.results);
      } else {
        console.error(`Batch ${batchIndex} promise failed:`, settledResult.reason);
        // Add default results for failed batches
        const failedBatch = batches[batchIndex];
        const defaultResults = failedBatch.map(post => this.createDefaultAnalysisResult(post));
        results.push(...defaultResults);
      }
    });

    return results;
  }

  /**
   * Analyze multiple posts in a single Claude request for efficiency
   */
  private async analyzeBatchWithClaude(
    posts: LinkedInPost[], 
    prospectId: string
  ): Promise<ContentAnalysisResult[]> {
    if (posts.length === 0) return [];
    
    // Format posts for batch analysis
    const postsText = posts.map((post, index) => 
      `POST ${index}:\n"${post.content}"\n---`
    ).join('\n\n');
    
    const prompt = BATCH_AUTHENTICITY_ANALYSIS_PROMPT.replace('{posts}', postsText);
    
    // Use Anthropic for batch analysis
    if (this.config.aiProvider === 'anthropic' && this.anthropicClient) {
      const response = await this.analyzeWithAnthropic(prompt);
      return this.parseBatchAnalysisResponse(response, posts, prospectId);
    } else {
      throw new Error('Claude batch analysis requires Anthropic client');
    }
  }

  /**
   * Parse batch analysis response from Claude
   */
  private parseBatchAnalysisResponse(
    response: string, 
    posts: LinkedInPost[], 
    prospectId: string
  ): ContentAnalysisResult[] {
    try {
      const analysisArray = JSON.parse(response);
      
      if (!Array.isArray(analysisArray)) {
        throw new Error('Response is not an array');
      }
      
      return analysisArray.map((analysis, index) => {
        const post = posts[analysis.postIndex] || posts[index];
        if (!post) {
          throw new Error(`No post found for index ${analysis.postIndex || index}`);
        }
        
        return {
          postId: post.id,
          contentHash: this.generateContentHash(post.content),
          authenticityScore: analysis.authenticityScore || 5.0,
          expertiseLevel: analysis.expertiseLevel || 5.0,
          specificityScore: analysis.specificityScore || 5.0,
          professionalismScore: analysis.professionalismScore || 5.0,
          redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : [],
          reasoning: analysis.reasoning || 'Batch analysis completed',
          aiProvider: this.config.aiProvider,
          modelVersion: this.config.model,
          processingTime: 0, // Will be set by caller
          cached: false
        };
      });
      
    } catch (error) {
      console.error('Failed to parse batch analysis response:', error);
      throw new Error('Invalid batch analysis response format');
    }
  }

  /**
   * Fallback to individual post analysis when batch fails
   */
  private async fallbackToIndividualAnalysis(
    posts: LinkedInPost[], 
    prospectId: string
  ): Promise<ContentAnalysisResult[]> {
    const results: ContentAnalysisResult[] = [];
    
    for (const post of posts) {
      try {
        const result = await this.analyzePost(post, prospectId);
        results.push(result);
      } catch (error) {
        console.error(`Individual analysis failed for post ${post.id}:`, error);
        results.push(this.createDefaultAnalysisResult(post));
      }
    }
    
    return results;
  }

  /**
   * Create default analysis result when all else fails
   */
  private createDefaultAnalysisResult(post: LinkedInPost): ContentAnalysisResult {
    return {
      postId: post.id,
      contentHash: this.generateContentHash(post.content),
      authenticityScore: 5.0,
      expertiseLevel: 5.0,
      specificityScore: 5.0,
      professionalismScore: 5.0,
      redFlags: [], // No red flags for analysis failures
      reasoning: 'Default analysis due to service error',
      aiProvider: this.config.aiProvider,
      modelVersion: this.config.model,
      processingTime: 0,
      cached: false
    };
  }

  /**
   * Detect if content appears to be AI-generated (quick check)
   */
  async detectAIGenerated(content: string): Promise<{ isAIGenerated: boolean; confidence: number }> {
    try {
      const result = await this.performAIAnalysis(content);
      const isAIGenerated = result.authenticityScore <= 4; // Low authenticity suggests AI
      const confidence = Math.abs(result.authenticityScore - 5.5) / 4.5; // Distance from neutral
      
      return { isAIGenerated, confidence };
    } catch (error) {
      console.error('AI detection failed:', error);
      return { isAIGenerated: false, confidence: 0 };
    }
  }

  /**
   * Assess industry expertise level for M&A/Brokerage content
   */
  async assessIndustryExpertise(content: string, industry: string = 'M&A'): Promise<number> {
    try {
      const result = await this.performAIAnalysis(content);
      return result.expertiseLevel;
    } catch (error) {
      console.error('Expertise assessment failed:', error);
      return 0;
    }
  }

  /**
   * Core AI analysis using configured provider
   */
  private async performAIAnalysis(content: string): Promise<Omit<ContentAnalysisResult, 'postId' | 'contentHash' | 'aiProvider' | 'modelVersion' | 'processingTime' | 'cached'>> {
    const prompt = AUTHENTICITY_ANALYSIS_PROMPT.replace('{content}', content);

    try {
      let response: string;

      if (this.config.aiProvider === 'openai' && this.openaiClient) {
        response = await this.analyzeWithOpenAI(prompt);
      } else if (this.config.aiProvider === 'anthropic' && this.anthropicClient) {
        response = await this.analyzeWithAnthropic(prompt);
      } else {
        throw new Error(`No available client for provider: ${this.config.aiProvider}`);
      }

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Return default scores on failure
      // Note: Don't add red flags for service failures - only for content issues
      return {
        authenticityScore: 5.0,
        expertiseLevel: 5.0,
        specificityScore: 5.0,
        professionalismScore: 5.0,
        redFlags: [], // Empty array - service failures shouldn't be red flags
        reasoning: 'Unable to analyze content due to AI service error'
      };
    }
  }

  /**
   * Analyze content using OpenAI
   * Now handles quota failures gracefully
   */
  private async analyzeWithOpenAI(prompt: string): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      return response.choices[0]?.message?.content || '';
      
    } catch (error: any) {
      // Handle OpenAI quota exceeded specifically
      if (error.status === 429 || error.code === 'insufficient_quota' || error.message?.includes('quota')) {
        console.warn('OpenAI quota exceeded, throwing specific error for fallback handling');
        throw new Error('429 You exceeded your current quota, please check your plan and billing details.');
      }
      
      // Re-throw other errors as-is
      throw error;
    }
  }

  /**
   * Analyze content using Anthropic Claude
   */
  private async analyzeWithAnthropic(prompt: string): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const response = await this.anthropicClient.messages.create({
      model: this.config.model, // Use configured model (Claude 3.5 Sonnet)
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.content[0]?.type === 'text' ? response.content[0].text : '';
  }

  /**
   * Parse AI response into structured analysis result
   */
  private parseAnalysisResponse(response: string): Omit<ContentAnalysisResult, 'postId' | 'contentHash' | 'aiProvider' | 'modelVersion' | 'processingTime' | 'cached'> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        authenticityScore: this.validateScore(parsed.authenticityScore),
        expertiseLevel: this.validateScore(parsed.expertiseLevel),
        specificityScore: this.validateScore(parsed.specificityScore),
        professionalismScore: this.validateScore(parsed.professionalismScore),
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'Analysis completed'
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return neutral scores on parse failure
      return {
        authenticityScore: 5.0,
        expertiseLevel: 5.0,
        specificityScore: 5.0,
        professionalismScore: 5.0,
        redFlags: ['Parse error'],
        reasoning: 'Unable to parse analysis response'
      };
    }
  }

  /**
   * Validate and clamp scores to 1-10 range
   */
  private validateScore(score: any): number {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 5.0;
    return Math.max(1, Math.min(10, numScore));
  }

  /**
   * Generate content hash for caching
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached analysis result
   */
  private async getCachedAnalysis(
    contentHash: string, 
    aiProvider: string
  ): Promise<Omit<ContentAnalysisResult, 'postId' | 'cached' | 'processingTime'> | null> {
    try {
      const { data, error } = await supabase
        .from('content_analysis')
        .select('*')
        .eq('content_hash', contentHash)
        .eq('ai_provider', aiProvider)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      return {
        contentHash: data.content_hash,
        authenticityScore: data.authenticity_score,
        expertiseLevel: data.expertise_level,
        specificityScore: data.specificity_score,
        professionalismScore: data.professionalism_score,
        redFlags: data.red_flags || [],
        reasoning: data.reasoning,
        aiProvider: data.ai_provider,
        modelVersion: data.model_version
      };
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Cache analysis result
   */
  private async cacheAnalysis(result: ContentAnalysisResult, prospectId: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.config.cacheTTLDays);

      await supabase
        .from('content_analysis')
        .insert({
          post_id: result.postId,
          prospect_id: prospectId,
          content_hash: result.contentHash,
          authenticity_score: result.authenticityScore,
          expertise_level: result.expertiseLevel,
          specificity_score: result.specificityScore,
          professionalism_score: result.professionalismScore,
          red_flags: result.redFlags,
          reasoning: result.reasoning,
          ai_provider: result.aiProvider,
          model_version: result.modelVersion,
          processing_time_ms: result.processingTime,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Cache storage failed:', error);
      // Don't throw - caching failure shouldn't break analysis
    }
  }

  /**
   * Get content analysis summary for a prospect
   */
  async getProspectContentSummary(prospectId: string, bypassCache: boolean = false): Promise<{
    avgAuthenticity: number;
    avgExpertise: number;
    avgSpecificity: number;
    avgProfessionalism: number;
    totalPosts: number;
    aiGeneratedPosts: number;
    highExpertisePosts: number;
    redFlagCount: number;
    overallQuality: 'high' | 'medium' | 'low';
  } | null> {
    try {
      // If bypassCache is true, return null to force fresh analysis
      if (bypassCache) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('prospect_content_summary')
        .select('*')
        .eq('prospect_id', prospectId)
        .single();

      if (error || !data) return null;

      // Calculate overall quality
      const avgScore = (
        data.avg_authenticity_score + 
        data.avg_expertise_level + 
        data.avg_specificity_score + 
        data.avg_professionalism_score
      ) / 4;

      let overallQuality: 'high' | 'medium' | 'low';
      if (avgScore >= 7) overallQuality = 'high';
      else if (avgScore >= 5) overallQuality = 'medium';
      else overallQuality = 'low';

      // Cap red flag count at reasonable maximum and log if suspicious
      const cappedRedFlagCount = Math.min(data.red_flag_count || 0, 10);
      
      if (data.red_flag_count > 10) {
        console.warn(`Suspicious red flag count for prospect ${prospectId}: ${data.red_flag_count}, capped to 10`);
      }

      return {
        avgAuthenticity: data.avg_authenticity_score,
        avgExpertise: data.avg_expertise_level,
        avgSpecificity: data.avg_specificity_score,
        avgProfessionalism: data.avg_professionalism_score,
        totalPosts: data.total_posts_analyzed,
        aiGeneratedPosts: data.ai_generated_posts,
        highExpertisePosts: data.high_expertise_posts,
        redFlagCount: cappedRedFlagCount,
        overallQuality
      };
    } catch (error) {
      console.error('Failed to get content summary:', error);
      return null;
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const { data } = await supabase.rpc('clean_expired_content_analysis');
      return data || 0;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const contentIntelligence = new ContentIntelligenceEngine();