/**
 * Feedback Learning Database
 * 
 * Stores and manages rich feedback data to train the research agent.
 * Handles pattern extraction, user preference learning, and model improvement.
 */

interface RichFeedbackEntry {
  id: string
  userId: string
  timestamp: Date
  
  // Prospect context
  prospectId: string
  prospectName?: string
  prospectRole?: string
  prospectCompany?: string
  
  // Analysis context
  originalScore?: number
  analysisResults?: any
  
  // Rich feedback data
  feedbackText: string
  extractedSignals: any
  
  // Processing metadata
  processingVersion: string
  confidence: number
  sentiment: 'positive' | 'negative' | 'neutral'
}

interface UserLearningProfile {
  userId: string
  totalFeedback: number
  
  // Learned patterns
  authenticityMarkers: Map<string, number> // pattern -> importance weight
  expertiseIndicators: Map<string, number>
  linguisticPatterns: Map<string, number>
  industrySignals: Map<string, number>
  
  // Preference weights
  contentAuthenticityWeight: number
  professionalDepthWeight: number
  linguisticQualityWeight: number
  industryExpertiseWeight: number
  
  // Pattern examples for reference
  positiveExamples: string[]
  negativeExamples: string[]
  
  lastUpdated: Date
  learningProgress: number // 0-1 scale
}

interface LearningInsight {
  type: 'pattern_discovery' | 'preference_shift' | 'expertise_indicator' | 'linguistic_marker'
  description: string
  confidence: number
  impactOnScoring: number
  examples: string[]
}

export class FeedbackLearningDatabase {
  private feedbackEntries: Map<string, RichFeedbackEntry> = new Map()
  private userProfiles: Map<string, UserLearningProfile> = new Map()
  
  private readonly PROCESSING_VERSION = '1.0.0'
  private readonly MIN_FEEDBACK_FOR_LEARNING = 3
  private readonly MAX_EXAMPLES_STORED = 10

  /**
   * Store rich feedback entry and trigger learning
   */
  public async storeFeedbackEntry(
    userId: string,
    feedbackText: string,
    prospectContext: {
      prospectId: string
      prospectName?: string
      prospectRole?: string
      prospectCompany?: string
      originalScore?: number
      analysisResults?: any
    },
    extractedSignals: any
  ): Promise<{ entryId: string, learningInsights: LearningInsight[] }> {
    
    const entryId = this.generateEntryId()
    
    // Create feedback entry
    const entry: RichFeedbackEntry = {
      id: entryId,
      userId,
      timestamp: new Date(),
      ...prospectContext,
      feedbackText,
      extractedSignals,
      processingVersion: this.PROCESSING_VERSION,
      confidence: extractedSignals.confidence || 0.5,
      sentiment: extractedSignals.overallSentiment || 'neutral'
    }
    
    // Store entry
    this.feedbackEntries.set(entryId, entry)
    
    // Process learning
    const learningInsights = await this.processLearningFromEntry(entry)
    
    return { entryId, learningInsights }
  }

  /**
   * Process learning insights from feedback entry
   */
  private async processLearningFromEntry(entry: RichFeedbackEntry): Promise<LearningInsight[]> {
    let userProfile = this.getUserProfile(entry.userId)
    const insights: LearningInsight[] = []
    
    // Extract and learn from linguistic patterns
    const linguisticInsights = this.extractLinguisticLearning(entry, userProfile)
    insights.push(...linguisticInsights)
    
    // Extract and learn from expertise indicators
    const expertiseInsights = this.extractExpertiseLearning(entry, userProfile)
    insights.push(...expertiseInsights)
    
    // Extract and learn from authenticity markers
    const authenticityInsights = this.extractAuthenticityLearning(entry, userProfile)
    insights.push(...authenticityInsights)
    
    // Update user profile with learned patterns
    this.updateUserProfile(userProfile, entry, insights)
    
    return insights
  }

  /**
   * Extract linguistic patterns from feedback
   */
  private extractLinguisticLearning(entry: RichFeedbackEntry, profile: UserLearningProfile): LearningInsight[] {
    const insights: LearningInsight[] = []
    const text = entry.feedbackText.toLowerCase()
    
    // Look for explicit linguistic analysis in feedback
    const linguisticAnalysis = [
      { pattern: /sentence structure|writing style|word choice/gi, type: 'writing_analysis' },
      { pattern: /sounds? like|reads? like|comes across as/gi, type: 'style_assessment' },
      { pattern: /natural|conversational|flows? well/gi, type: 'positive_writing' },
      { pattern: /awkward|stilted|robotic|unnatural/gi, type: 'negative_writing' },
      { pattern: /ai[- ]?generated|formulaic|template/gi, type: 'ai_detection' }
    ]
    
    linguisticAnalysis.forEach(({ pattern, type }) => {
      const matches = text.match(pattern)
      if (matches) {
        const weight = entry.sentiment === 'positive' ? 1.0 : -1.0
        const currentWeight = profile.linguisticPatterns.get(type) || 0
        const newWeight = (currentWeight + weight * 0.3) // Learning rate
        
        profile.linguisticPatterns.set(type, Math.max(-1, Math.min(1, newWeight)))
        
        insights.push({
          type: 'linguistic_marker',
          description: `User values linguistic analysis: ${type}`,
          confidence: 0.7,
          impactOnScoring: Math.abs(newWeight) * 0.1,
          examples: matches
        })
      }
    })
    
    return insights
  }

  /**
   * Extract expertise indicators from feedback
   */
  private extractExpertiseLearning(entry: RichFeedbackEntry, profile: UserLearningProfile): LearningInsight[] {
    const insights: LearningInsight[] = []
    const text = entry.feedbackText.toLowerCase()
    
    // Look for expertise evaluation patterns
    const expertisePatterns = [
      { pattern: /technical depth|domain expertise|industry knowledge/gi, type: 'technical_expertise' },
      { pattern: /specific examples|concrete cases|actual (numbers|data|results)/gi, type: 'concrete_evidence' },
      { pattern: /proven track record|demonstrable|quantifiable/gi, type: 'proven_results' },
      { pattern: /understands (the|our) (business|industry|field)/gi, type: 'industry_understanding' },
      { pattern: /mentions? (specific|actual) (tools|methods|processes)/gi, type: 'technical_specificity' }
    ]
    
    expertisePatterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern)
      if (matches) {
        const weight = entry.sentiment === 'positive' ? 1.0 : -1.0
        const currentWeight = profile.expertiseIndicators.get(type) || 0
        const newWeight = (currentWeight + weight * 0.4) // Higher weight for expertise
        
        profile.expertiseIndicators.set(type, Math.max(-1, Math.min(1, newWeight)))
        
        insights.push({
          type: 'expertise_indicator',
          description: `User values expertise marker: ${type}`,
          confidence: 0.8,
          impactOnScoring: Math.abs(newWeight) * 0.15,
          examples: matches
        })
      }
    })
    
    // Extract industry-specific terminology
    const industryTerms = text.match(/\\b(saas|b2b|crm|mrr|arr|churn|cac|ltv|cohort|funnel|conversion|roi|kpi|meddic|sales|marketing|product)\\b/gi) || []
    if (industryTerms.length > 0) {
      industryTerms.forEach(term => {
        const termLower = term.toLowerCase()
        const currentWeight = profile.industrySignals.get(termLower) || 0
        const weight = entry.sentiment === 'positive' ? 0.2 : -0.1
        profile.industrySignals.set(termLower, Math.max(-1, Math.min(1, currentWeight + weight)))
      })
      
      insights.push({
        type: 'expertise_indicator',
        description: 'User referenced industry-specific terminology',
        confidence: 0.9,
        impactOnScoring: 0.1,
        examples: industryTerms
      })
    }
    
    return insights
  }

  /**
   * Extract authenticity markers from feedback
   */
  private extractAuthenticityLearning(entry: RichFeedbackEntry, profile: UserLearningProfile): LearningInsight[] {
    const insights: LearningInsight[] = []
    const text = entry.feedbackText.toLowerCase()
    
    // Look for authenticity evaluation patterns
    const authenticityPatterns = [
      { pattern: /authentic|genuine|real experience|actual experience/gi, type: 'authenticity_positive' },
      { pattern: /fake|artificial|generated|formulaic|template/gi, type: 'authenticity_negative' },
      { pattern: /storytelling|personal story|went through|experienced/gi, type: 'story_authenticity' },
      { pattern: /specific details|actual details|messy details|real world/gi, type: 'detail_authenticity' },
      { pattern: /admits? mistakes?|failed|learned the hard way/gi, type: 'vulnerability_authenticity' }
    ]
    
    authenticityPatterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern)
      if (matches) {
        const isPositiveMarker = type.includes('positive') || type.includes('authenticity') && !type.includes('negative')
        const weight = (entry.sentiment === 'positive' && isPositiveMarker) || 
                      (entry.sentiment === 'negative' && !isPositiveMarker) ? 1.0 : -1.0
        
        const currentWeight = profile.authenticityMarkers.get(type) || 0
        const newWeight = (currentWeight + weight * 0.35)
        
        profile.authenticityMarkers.set(type, Math.max(-1, Math.min(1, newWeight)))
        
        insights.push({
          type: 'pattern_discovery',
          description: `User evaluates authenticity using: ${type}`,
          confidence: 0.8,
          impactOnScoring: Math.abs(newWeight) * 0.2, // High impact for authenticity
          examples: matches
        })
      }
    })
    
    return insights
  }

  /**
   * Update user profile with learned insights
   */
  private updateUserProfile(profile: UserLearningProfile, entry: RichFeedbackEntry, insights: LearningInsight[]) {
    profile.totalFeedback++
    profile.lastUpdated = new Date()
    
    // Update preference weights based on what patterns were mentioned
    const hasLinguisticFocus = insights.some(i => i.type === 'linguistic_marker')
    const hasExpertiseFocus = insights.some(i => i.type === 'expertise_indicator')
    const hasAuthenticityFocus = insights.some(i => i.type === 'pattern_discovery')
    
    if (hasLinguisticFocus) {
      profile.linguisticQualityWeight = Math.min(1.0, profile.linguisticQualityWeight + 0.05)
    }
    
    if (hasExpertiseFocus) {
      profile.professionalDepthWeight = Math.min(1.0, profile.professionalDepthWeight + 0.05)
    }
    
    if (hasAuthenticityFocus) {
      profile.contentAuthenticityWeight = Math.min(1.0, profile.contentAuthenticityWeight + 0.05)
    }
    
    // Store example feedback for future reference
    if (entry.sentiment === 'positive') {
      profile.positiveExamples.push(entry.feedbackText)
      if (profile.positiveExamples.length > this.MAX_EXAMPLES_STORED) {
        profile.positiveExamples = profile.positiveExamples.slice(-this.MAX_EXAMPLES_STORED)
      }
    } else if (entry.sentiment === 'negative') {
      profile.negativeExamples.push(entry.feedbackText)
      if (profile.negativeExamples.length > this.MAX_EXAMPLES_STORED) {
        profile.negativeExamples = profile.negativeExamples.slice(-this.MAX_EXAMPLES_STORED)
      }
    }
    
    // Update learning progress
    profile.learningProgress = Math.min(1.0, profile.totalFeedback / 20) // Progress toward 20 feedback examples
  }

  /**
   * Get or create user profile
   */
  private getUserProfile(userId: string): UserLearningProfile {
    if (!this.userProfiles.has(userId)) {
      const newProfile: UserLearningProfile = {
        userId,
        totalFeedback: 0,
        authenticityMarkers: new Map(),
        expertiseIndicators: new Map(),
        linguisticPatterns: new Map(),
        industrySignals: new Map(),
        contentAuthenticityWeight: 0.4,
        professionalDepthWeight: 0.3,
        linguisticQualityWeight: 0.2,
        industryExpertiseWeight: 0.3,
        positiveExamples: [],
        negativeExamples: [],
        lastUpdated: new Date(),
        learningProgress: 0
      }
      this.userProfiles.set(userId, newProfile)
    }
    return this.userProfiles.get(userId)!
  }

  /**
   * Get learned patterns for improving prospect scoring
   */
  public getLearnedPatterns(userId: string): {
    authenticityMarkers: Record<string, number>
    expertiseIndicators: Record<string, number>
    linguisticPatterns: Record<string, number>
    industrySignals: Record<string, number>
    weights: {
      contentAuthenticityWeight: number
      professionalDepthWeight: number
      linguisticQualityWeight: number
      industryExpertiseWeight: number
    }
  } | null {
    const profile = this.userProfiles.get(userId)
    if (!profile || profile.totalFeedback < this.MIN_FEEDBACK_FOR_LEARNING) {
      return null
    }
    
    return {
      authenticityMarkers: Object.fromEntries(profile.authenticityMarkers),
      expertiseIndicators: Object.fromEntries(profile.expertiseIndicators),
      linguisticPatterns: Object.fromEntries(profile.linguisticPatterns),
      industrySignals: Object.fromEntries(profile.industrySignals),
      weights: {
        contentAuthenticityWeight: profile.contentAuthenticityWeight,
        professionalDepthWeight: profile.professionalDepthWeight,
        linguisticQualityWeight: profile.linguisticQualityWeight,
        industryExpertiseWeight: profile.industryExpertiseWeight
      }
    }
  }

  /**
   * Get user learning summary
   */
  public getUserLearningSummary(userId: string): {
    totalFeedback: number
    learningProgress: number
    topPatterns: string[]
    recentInsights: string[]
  } {
    const profile = this.userProfiles.get(userId)
    if (!profile) {
      return {
        totalFeedback: 0,
        learningProgress: 0,
        topPatterns: [],
        recentInsights: []
      }
    }
    
    // Get top patterns by weight
    const allPatterns = [
      ...Array.from(profile.authenticityMarkers.entries()),
      ...Array.from(profile.expertiseIndicators.entries()),
      ...Array.from(profile.linguisticPatterns.entries())
    ]
    
    const topPatterns = allPatterns
      .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
      .slice(0, 5)
      .map(([pattern]) => pattern)
    
    return {
      totalFeedback: profile.totalFeedback,
      learningProgress: profile.learningProgress,
      topPatterns,
      recentInsights: [] // Could be enhanced to track recent insights
    }
  }

  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Export learning data for external systems
   */
  public exportLearningData(userId: string): any {
    const profile = this.userProfiles.get(userId)
    if (!profile) return null
    
    const feedbackEntries = Array.from(this.feedbackEntries.values())
      .filter(entry => entry.userId === userId)
      .map(entry => ({
        timestamp: entry.timestamp,
        feedbackText: entry.feedbackText,
        sentiment: entry.sentiment,
        extractedSignals: entry.extractedSignals
      }))
    
    return {
      userProfile: {
        totalFeedback: profile.totalFeedback,
        learningProgress: profile.learningProgress,
        weights: {
          contentAuthenticityWeight: profile.contentAuthenticityWeight,
          professionalDepthWeight: profile.professionalDepthWeight,
          linguisticQualityWeight: profile.linguisticQualityWeight,
          industryExpertiseWeight: profile.industryExpertiseWeight
        }
      },
      learnedPatterns: this.getLearnedPatterns(userId),
      feedbackEntries
    }
  }
}

export const feedbackLearningDatabase = new FeedbackLearningDatabase()