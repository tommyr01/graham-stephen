/**
 * Graham-Style Relevance Scoring
 * 
 * Relevance scoring system based on Graham's actual decision-making criteria
 * from the conversation. Focuses on content authenticity, network quality,
 * and the specific signals he uses to identify quality prospects.
 */

import { contentAuthenticityAnalyzer } from './content-authenticity-analyzer'
import { networkQualityAnalyzer } from './network-quality-analyzer'
import { targetedLearningEngine } from './targeted-learning-engine'
import { feedbackLearningDatabase } from './feedback-learning-database'

interface ProspectData {
  profileId: string
  name: string
  role: string
  company: string
  experience: string
  about: string
  recentPosts: string[]
  networkConnections?: any[]
  engagementPatterns?: any[]
  linkedinUrl?: string
}

interface GrahamScoreBreakdown {
  // Overall scores
  totalScore: number // 0-10 scale (Graham's preferred scale)
  confidence: number // 0-1
  
  // Component scores
  contentAuthenticity: {
    score: number // 0-1
    signals: string[]
    redFlags: string[]
  }
  
  networkQuality: {
    score: number // 0-1
    qualityConnections: number
    warmPaths: string[]
  }
  
  professionalAuthority: {
    score: number // 0-1
    claimsMatchExperience: boolean
    experienceDepth: number
  }
  
  // Decision indicators
  recommendation: 'worth_connecting' | 'time_waster' | 'uncertain'
  reasoning: string[]
  
  // Personalization
  personalizedAdjustments?: {
    originalScore: number
    adjustedScore: number
    adjustmentFactors: string[]
  }
}

export class GrahamRelevanceScoring {
  
  /**
   * Score a prospect using Graham's criteria
   */
  public async scoreProspect(
    prospectData: ProspectData, 
    userId?: string
  ): Promise<GrahamScoreBreakdown> {
    
    // 1. Analyze content authenticity
    const contentAnalysis = this.analyzeContent(prospectData)
    
    // 2. Analyze network quality  
    const networkAnalysis = this.analyzeNetwork(prospectData)
    
    // 3. Assess professional authority
    const authorityAnalysis = this.assessAuthority(prospectData)
    
    // 4. Calculate base score
    const baseScore = this.calculateBaseScore(contentAnalysis, networkAnalysis, authorityAnalysis)
    
    // 5. Apply personalization if user provided
    const personalizedScore = userId ? 
      await this.applyPersonalization(baseScore, userId, prospectData) : 
      baseScore
    
    // 6. Generate recommendation and reasoning
    const recommendation = this.generateRecommendation(personalizedScore)
    const reasoning = this.generateReasoning(contentAnalysis, networkAnalysis, authorityAnalysis)
    
    return {
      totalScore: Math.round(personalizedScore.adjustedScore * 10) / 10, // Round to 1 decimal
      confidence: this.calculateConfidence(contentAnalysis, networkAnalysis, authorityAnalysis),
      
      contentAuthenticity: {
        score: contentAnalysis.authenticityScore,
        signals: contentAnalysis.positiveSignals,
        redFlags: contentAnalysis.redFlags
      },
      
      networkQuality: {
        score: networkAnalysis.networkQualityScore,
        qualityConnections: networkAnalysis.topConnections.length,
        warmPaths: networkAnalysis.warmPaths
      },
      
      professionalAuthority: {
        score: authorityAnalysis.score,
        claimsMatchExperience: authorityAnalysis.claimsMatch,
        experienceDepth: authorityAnalysis.experienceYears
      },
      
      recommendation,
      reasoning,
      personalizedAdjustments: userId ? personalizedScore : undefined
    }
  }

  /**
   * Analyze content authenticity using Graham's criteria
   */
  private analyzeContent(prospectData: ProspectData) {
    const profileData = {
      experience: prospectData.experience,
      about: prospectData.about,
      currentRole: prospectData.role,
      recentPosts: prospectData.recentPosts,
      connections: 500 // Default estimate
    }
    
    if (prospectData.recentPosts.length > 0) {
      return contentAuthenticityAnalyzer.analyzePostHistory(prospectData.recentPosts, profileData)
    } else {
      // Analyze just the about section if no posts available
      return contentAuthenticityAnalyzer.analyzePost(prospectData.about || '', profileData)
    }
  }

  /**
   * Analyze network quality
   */
  private analyzeNetwork(prospectData: ProspectData) {
    // Convert prospect connections to our format
    const connections = this.convertToNetworkConnections(prospectData.networkConnections || [])
    const engagements = this.convertToEngagementPatterns(prospectData.engagementPatterns || [])
    
    return networkQualityAnalyzer.analyzeNetworkQuality(connections, engagements)
  }

  /**
   * Assess professional authority and expertise claims
   */
  private assessAuthority(prospectData: ProspectData): {
    score: number
    claimsMatch: boolean
    experienceYears: number
    insights: string[]
  } {
    const insights: string[] = []
    let score = 0.5 // Base score
    
    // Extract experience years from role and experience
    const experienceYears = this.extractExperienceYears(prospectData.experience, prospectData.role)
    
    // Check role seniority
    const roleScore = this.assessRoleSeniority(prospectData.role)
    score += roleScore * 0.3
    
    // Check company quality
    const companyScore = this.assessCompanyPrestige(prospectData.company)
    score += companyScore * 0.2
    
    // Validate claims vs experience
    const claimsMatch = this.validateClaims(prospectData)
    if (claimsMatch) {
      score += 0.2
      insights.push("Claims match experience")
    } else {
      score -= 0.2
      insights.push("Claims don't match experience level")
    }
    
    // Experience depth bonus
    if (experienceYears > 5) score += 0.1
    if (experienceYears > 10) score += 0.1
    
    return {
      score: Math.max(0, Math.min(1, score)),
      claimsMatch,
      experienceYears,
      insights
    }
  }

  /**
   * Calculate base score from all components
   */
  private calculateBaseScore(contentAnalysis: any, networkAnalysis: any, authorityAnalysis: any): {
    originalScore: number
    adjustedScore: number
    breakdown: any
  } {
    // Weights based on Graham's emphasis in the conversation
    const weights = {
      contentAuthenticity: 0.4,  // Very important - immediate disqualifier if AI
      networkQuality: 0.35,      // "Quality attracts quality" principle  
      professionalAuthority: 0.25 // Important but less emphasized
    }
    
    const score = 
      (contentAnalysis.authenticityScore * weights.contentAuthenticity) +
      (networkAnalysis.networkQualityScore * weights.networkQuality) +
      (authorityAnalysis.score * weights.professionalAuthority)
    
    return {
      originalScore: score,
      adjustedScore: score,
      breakdown: {
        contentWeight: weights.contentAuthenticity,
        networkWeight: weights.networkQuality,  
        authorityWeight: weights.professionalAuthority
      }
    }
  }

  /**
   * Apply personalized adjustments based on rich feedback learning
   */
  private async applyPersonalization(
    baseScore: any, 
    userId: string, 
    prospectData: ProspectData
  ): Promise<{
    originalScore: number
    adjustedScore: number
    adjustmentFactors: string[]
  }> {
    const adjustmentFactors: string[] = []
    let adjustedScore = baseScore.originalScore
    
    // Get learned patterns from rich feedback database
    const learnedPatterns = feedbackLearningDatabase.getLearnedPatterns(userId)
    
    if (learnedPatterns) {
      // Apply learned pattern weights
      adjustedScore = this.applyLearnedPatterns(
        adjustedScore, 
        prospectData, 
        learnedPatterns, 
        adjustmentFactors
      )
    }
    
    // Fallback to legacy learning engine for compatibility
    const legacyPersonalizations = targetedLearningEngine.getPersonalizedAdjustments(userId)
    
    // Apply content authenticity personalization
    const contentWeight = legacyPersonalizations.contentAuthenticityWeight
    if (Math.abs(contentWeight - 0.4) > 0.1) {
      const adjustment = (contentWeight - 0.4) * 0.3 // Reduced impact when rich learning available
      adjustedScore += adjustment
      adjustmentFactors.push(`Content authenticity weighted ${contentWeight > 0.4 ? 'higher' : 'lower'} based on feedback patterns`)
    }
    
    // Apply network quality personalization
    const networkWeight = legacyPersonalizations.networkQualityWeight
    if (Math.abs(networkWeight - 0.3) > 0.1) {
      const adjustment = (networkWeight - 0.3) * 0.3
      adjustedScore += adjustment
      adjustmentFactors.push(`Network quality weighted ${networkWeight > 0.3 ? 'higher' : 'lower'} based on your feedback`)
    }
    
    return {
      originalScore: baseScore.originalScore,
      adjustedScore: Math.max(0, Math.min(1, adjustedScore)),
      adjustmentFactors
    }
  }

  /**
   * Apply learned patterns from rich feedback to scoring
   */
  private applyLearnedPatterns(
    score: number,
    prospectData: ProspectData,
    learnedPatterns: any,
    adjustmentFactors: string[]
  ): number {
    let adjustedScore = score
    
    // Apply authenticity markers learned from detailed feedback
    const authenticityAdjustment = this.calculateAuthenticityAdjustment(
      prospectData,
      learnedPatterns.authenticityMarkers
    )
    if (Math.abs(authenticityAdjustment) > 0.01) {
      adjustedScore += authenticityAdjustment
      adjustmentFactors.push(`Authenticity patterns: ${authenticityAdjustment > 0 ? '+' : ''}${(authenticityAdjustment * 10).toFixed(1)} points based on learned writing analysis`)
    }
    
    // Apply expertise indicators learned from feedback
    const expertiseAdjustment = this.calculateExpertiseAdjustment(
      prospectData,
      learnedPatterns.expertiseIndicators
    )
    if (Math.abs(expertiseAdjustment) > 0.01) {
      adjustedScore += expertiseAdjustment
      adjustmentFactors.push(`Expertise indicators: ${expertiseAdjustment > 0 ? '+' : ''}${(expertiseAdjustment * 10).toFixed(1)} points based on learned professional depth markers`)
    }
    
    // Apply linguistic quality patterns
    const linguisticAdjustment = this.calculateLinguisticAdjustment(
      prospectData,
      learnedPatterns.linguisticPatterns
    )
    if (Math.abs(linguisticAdjustment) > 0.01) {
      adjustedScore += linguisticAdjustment
      adjustmentFactors.push(`Writing quality: ${linguisticAdjustment > 0 ? '+' : ''}${(linguisticAdjustment * 10).toFixed(1)} points based on learned linguistic preferences`)
    }
    
    // Apply industry signal preferences
    const industryAdjustment = this.calculateIndustryAdjustment(
      prospectData,
      learnedPatterns.industrySignals
    )
    if (Math.abs(industryAdjustment) > 0.01) {
      adjustedScore += industryAdjustment
      adjustmentFactors.push(`Industry expertise: ${industryAdjustment > 0 ? '+' : ''}${(industryAdjustment * 10).toFixed(1)} points based on learned terminology preferences`)
    }
    
    return adjustedScore
  }

  /**
   * Calculate authenticity adjustment based on learned markers
   */
  private calculateAuthenticityAdjustment(
    prospectData: ProspectData,
    authenticityMarkers: Record<string, number>
  ): number {
    let adjustment = 0
    const contentText = [prospectData.about, ...prospectData.recentPosts].join(' ').toLowerCase()
    
    // Check for learned positive authenticity markers
    if (authenticityMarkers['authenticity_positive'] > 0.3) {
      if (/authentic|genuine|real experience|actual experience/gi.test(contentText)) {
        adjustment += authenticityMarkers['authenticity_positive'] * 0.1
      }
    }
    
    // Check for learned negative authenticity markers
    if (authenticityMarkers['authenticity_negative'] < -0.3) {
      if (/formulaic|template|generated|artificial/gi.test(contentText)) {
        adjustment += authenticityMarkers['authenticity_negative'] * 0.1 // Will be negative
      }
    }
    
    // Check for story authenticity markers
    if (authenticityMarkers['story_authenticity'] > 0.2) {
      if (/story|experience|went through|happened/gi.test(contentText)) {
        adjustment += authenticityMarkers['story_authenticity'] * 0.08
      }
    }
    
    return Math.max(-0.3, Math.min(0.3, adjustment))
  }

  /**
   * Calculate expertise adjustment based on learned indicators
   */
  private calculateExpertiseAdjustment(
    prospectData: ProspectData,
    expertiseIndicators: Record<string, number>
  ): number {
    let adjustment = 0
    const contentText = [prospectData.about, prospectData.experience, ...prospectData.recentPosts].join(' ').toLowerCase()
    
    // Technical expertise markers
    if (expertiseIndicators['technical_expertise'] > 0.3) {
      if (/technical|technical depth|domain expertise/gi.test(contentText)) {
        adjustment += expertiseIndicators['technical_expertise'] * 0.12
      }
    }
    
    // Concrete evidence markers
    if (expertiseIndicators['concrete_evidence'] > 0.2) {
      if (/\d+%|\$\d+|\d+x|specific example|actual case/gi.test(contentText)) {
        adjustment += expertiseIndicators['concrete_evidence'] * 0.1
      }
    }
    
    // Proven results markers
    if (expertiseIndicators['proven_results'] > 0.2) {
      if (/track record|results|achieved|delivered/gi.test(contentText)) {
        adjustment += expertiseIndicators['proven_results'] * 0.08
      }
    }
    
    return Math.max(-0.2, Math.min(0.2, adjustment))
  }

  /**
   * Calculate linguistic adjustment based on learned patterns
   */
  private calculateLinguisticAdjustment(
    prospectData: ProspectData,
    linguisticPatterns: Record<string, number>
  ): number {
    let adjustment = 0
    const contentText = [prospectData.about, ...prospectData.recentPosts].join(' ').toLowerCase()
    
    // Writing quality indicators
    if (linguisticPatterns['positive_writing'] > 0.2) {
      if (/conversational|natural|clear|well[\s-]written/gi.test(contentText)) {
        adjustment += linguisticPatterns['positive_writing'] * 0.06
      }
    }
    
    // Negative writing indicators
    if (linguisticPatterns['negative_writing'] < -0.2) {
      if (/awkward|stilted|robotic|unnatural/gi.test(contentText)) {
        adjustment += linguisticPatterns['negative_writing'] * 0.06 // Will be negative
      }
    }
    
    // AI detection patterns
    if (linguisticPatterns['ai_detection'] < -0.3) {
      if (/excited to share|thrilled to announce|game[\s-]chang/gi.test(contentText)) {
        adjustment += linguisticPatterns['ai_detection'] * 0.08 // Will be negative
      }
    }
    
    return Math.max(-0.15, Math.min(0.15, adjustment))
  }

  /**
   * Calculate industry adjustment based on learned terminology preferences
   */
  private calculateIndustryAdjustment(
    prospectData: ProspectData,
    industrySignals: Record<string, number>
  ): number {
    let adjustment = 0
    const contentText = [prospectData.about, prospectData.role, ...prospectData.recentPosts].join(' ').toLowerCase()
    
    // Check for industry terms the user has shown preference for
    Object.entries(industrySignals).forEach(([term, weight]) => {
      if (Math.abs(weight) > 0.1 && contentText.includes(term.toLowerCase())) {
        adjustment += weight * 0.05 // Smaller adjustment for industry terms
      }
    })
    
    return Math.max(-0.1, Math.min(0.1, adjustment))
  }

  /**
   * Generate recommendation based on score
   */
  private generateRecommendation(score: {adjustedScore: number}): 'worth_connecting' | 'time_waster' | 'uncertain' {
    if (score.adjustedScore >= 0.7) return 'worth_connecting'
    if (score.adjustedScore <= 0.3) return 'time_waster'
    return 'uncertain'
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(contentAnalysis: any, networkAnalysis: any, authorityAnalysis: any): string[] {
    const reasoning: string[] = []
    
    // Content authenticity reasoning
    if (contentAnalysis.isAiGenerated) {
      reasoning.push("❌ Content appears to be AI-generated or formulaic")
    } else if (contentAnalysis.hasRealStorytellingvalue) {
      reasoning.push("✅ Shows authentic storytelling and genuine insights")
    }
    
    if (contentAnalysis.isInfluencerBehavior) {
      reasoning.push("❌ Displays influencer-wannabe behavior")
    }
    
    // Network quality reasoning
    if (networkAnalysis.hasQualityConnections) {
      reasoning.push("✅ Connected to quality professionals")
    }
    
    if (networkAnalysis.hasWarmPathToUser) {
      reasoning.push("🔥 Has warm introduction path through mutual connections")
    }
    
    if (networkAnalysis.isInfluencerNetwork) {
      reasoning.push("❌ Primarily connected to influencers and lifestyle gurus")
    }
    
    // Authority reasoning
    if (authorityAnalysis.claimsMatch) {
      reasoning.push("✅ Professional claims match actual experience")
    } else {
      reasoning.push("❌ Claims don't align with experience level")
    }
    
    if (authorityAnalysis.experienceYears >= 10) {
      reasoning.push("✅ Deep professional experience")
    }
    
    return reasoning
  }

  /**
   * Calculate confidence in the scoring
   */
  private calculateConfidence(contentAnalysis: any, networkAnalysis: any, authorityAnalysis: any): number {
    let confidence = 0.5
    
    // More data = higher confidence
    if (contentAnalysis.positiveSignals.length > 0 || contentAnalysis.redFlags.length > 0) {
      confidence += 0.2
    }
    
    if (networkAnalysis.topConnections.length > 5) {
      confidence += 0.15
    }
    
    if (authorityAnalysis.insights.length > 0) {
      confidence += 0.1
    }
    
    // Clear signals = higher confidence
    if (contentAnalysis.authenticityScore > 0.8 || contentAnalysis.authenticityScore < 0.2) {
      confidence += 0.1
    }
    
    return Math.min(0.95, confidence)
  }

  // Helper methods for data conversion and analysis

  private convertToNetworkConnections(networkData: any[]): any[] {
    return networkData.map(conn => ({
      profileId: conn.id || '',
      name: conn.name || '',
      role: conn.title || '',
      company: conn.company || '',
      connectionDegree: conn.degree || 2,
      mutualConnections: conn.mutualConnections || 0,
      engagementFrequency: conn.engagementFrequency || 'low'
    }))
  }

  private convertToEngagementPatterns(engagementData: any[]): any[] {
    return engagementData.map(eng => ({
      type: eng.type || 'like',
      postId: eng.postId || '',
      content: eng.content || '',
      timestamp: new Date(eng.timestamp || Date.now()),
      engagementQuality: 'medium'
    }))
  }

  private extractExperienceYears(experience: string, role: string): number {
    // Extract years from experience text
    const yearMatches = experience.match(/(\d+)\s*(?:years?|yrs?)/i)
    if (yearMatches) {
      return parseInt(yearMatches[1])
    }
    
    // Estimate from role seniority
    if (/\b(senior|lead|principal)\b/i.test(role)) return 7
    if (/\b(manager|director)\b/i.test(role)) return 5
    if (/\b(ceo|founder|vp)\b/i.test(role)) return 10
    
    return 3 // Default estimate
  }

  private assessRoleSeniority(role: string): number {
    if (/\b(ceo|founder|president|vp|vice[\s\-]?president)\b/i.test(role)) return 1.0
    if (/\b(director|head[\s\-]?of|chief)\b/i.test(role)) return 0.8
    if (/\b(senior|lead|principal|manager)\b/i.test(role)) return 0.6
    if (/\b(specialist|coordinator|analyst)\b/i.test(role)) return 0.3
    if (/\b(intern|entry|junior|assistant)\b/i.test(role)) return 0.1
    
    return 0.5 // Default
  }

  private assessCompanyPrestige(company: string): number {
    // This would be learned from user feedback over time
    const prestigeCompanies = new Set([
      'Google', 'Microsoft', 'Apple', 'Amazon', 'Tesla', 'Meta',
      'McKinsey', 'Bain', 'BCG', 'Goldman Sachs', 'JP Morgan',
      'Deloitte', 'PwC', 'EY', 'KPMG'
    ])
    
    if (prestigeCompanies.has(company)) return 1.0
    if (/\b(fortune[\s\-]?500|f500)\b/i.test(company)) return 0.8
    if (/\b(inc|corp|corporation|ltd|limited)\b/i.test(company)) return 0.6
    
    return 0.4
  }

  private validateClaims(prospectData: ProspectData): boolean {
    // Simple validation - in reality this would be more sophisticated
    const roleLevel = this.assessRoleSeniority(prospectData.role)
    const experienceYears = this.extractExperienceYears(prospectData.experience, prospectData.role)
    
    // Check if role seniority matches experience years
    if (roleLevel > 0.8 && experienceYears < 5) return false // Senior role but little experience
    if (roleLevel < 0.3 && experienceYears > 15) return false // Junior role but lots of experience
    
    return true
  }

  /**
   * Quick assessment for filtering (Graham's style)
   */
  public async quickAssessment(prospectData: ProspectData, userId?: string): Promise<'connect' | 'skip' | 'maybe'> {
    const score = await this.scoreProspect(prospectData, userId)
    
    // Adjust thresholds based on learning progress
    let connectThreshold = 7
    let skipThreshold = 3
    
    if (userId) {
      const learningSummary = feedbackLearningDatabase.getUserLearningSummary(userId)
      if (learningSummary.learningProgress > 0.5) {
        // More confident thresholds as system learns
        connectThreshold = 6.5
        skipThreshold = 3.5
      }
    }
    
    if (score.totalScore >= connectThreshold) return 'connect'
    if (score.totalScore <= skipThreshold) return 'skip'
    return 'maybe'
  }

  /**
   * Get learning-enhanced scoring explanation
   */
  public async getEnhancedScoringExplanation(prospectData: ProspectData, userId?: string): Promise<{
    score: GrahamScoreBreakdown
    learningInsights?: {
      totalFeedback: number
      learningProgress: number
      topPatterns: string[]
      personalizedFactors: string[]
    }
  }> {
    const score = await this.scoreProspect(prospectData, userId)
    
    if (!userId) {
      return { score }
    }
    
    const learningSummary = feedbackLearningDatabase.getUserLearningSummary(userId)
    const personalizedFactors = score.personalizedAdjustments?.adjustmentFactors || []
    
    return {
      score,
      learningInsights: {
        totalFeedback: learningSummary.totalFeedback,
        learningProgress: learningSummary.learningProgress,
        topPatterns: learningSummary.topPatterns,
        personalizedFactors
      }
    }
  }
}

export const grahamRelevanceScoring = new GrahamRelevanceScoring()

// Export learning database for external access
export { feedbackLearningDatabase }