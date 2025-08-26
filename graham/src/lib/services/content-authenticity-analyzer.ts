/**
 * Content Authenticity Analyzer
 * 
 * Analyzes LinkedIn posts and profiles to detect the specific signals that Graham uses
 * to identify quality prospects vs. time-wasters. Based on real conversation insights.
 */

interface AuthenticitySignals {
  // Core authenticity score (0-1)
  authenticityScore: number
  
  // Specific signal flags
  isAiGenerated: boolean
  hasHumbleBrag: boolean
  isInfluencerBehavior: boolean
  hasRealStorytellingvalue: boolean
  showsGenuineExpertise: boolean
  hasOverTrying: boolean
  
  // Detailed analysis
  reasons: string[]
  redFlags: string[]
  positiveSignals: string[]
  confidence: number
}

interface ProfileData {
  experience: string
  about: string
  currentRole: string
  recentPosts: string[]
  connections: number
  endorsements?: string[]
}

export class ContentAuthenticityAnalyzer {
  
  // AI-generated content patterns that Graham mentioned
  private readonly AI_GENERATED_PATTERNS = [
    // Humble brag indicators
    /i'm humbled? to (announce|share|say)/i,
    /excited to share that/i,
    /thrilled to announce/i,
    
    // Formulaic opening patterns
    /^(yesterday|today|this week),? i (had the pleasure|was fortunate|was honored)/i,
    /^(recently|lately),? i've been (thinking about|reflecting on|considering)/i,
    
    // Generic inspiration patterns
    /(this taught me|the lesson here is|what i learned)/i,
    /(here are \d+ (tips|lessons|insights|ways))/i,
    
    // Engagement bait
    /(agree\? disagree\?|thoughts\?|what do you think\?)\s*$/i,
    /comment below with/i,
    
    // LinkedIn cliche phrases
    /game[\s-]?changer/i,
    /circle back/i,
    /touch base/i,
    /low-hanging fruit/i,
    /think outside the box/i,
    /synergy/i
  ]
  
  // Influencer behavior patterns
  private readonly INFLUENCER_PATTERNS = [
    // Self-promotion focus
    /follow me for (more|daily)/i,
    /subscribe to my/i,
    /check out my (course|book|program)/i,
    
    // Dramatic language
    /this will (blow your mind|change everything|shock you)/i,
    /the truth that nobody tells you/i,
    /the secret to/i,
    /(insane|crazy|mind-blowing) results/i,
    
    // Generic motivational content
    /(grind|hustle) (never|24\/7)/i,
    /(rise and grind|hustle mode)/i,
    /failure is not an option/i,
    
    // Attention-seeking
    /unpopular opinion:/i,
    /hot take:/i,
    /controversial but/i
  ]
  
  // Authentic storytelling indicators
  private readonly AUTHENTIC_PATTERNS = [
    // Specific details and context
    /\$[\d,]+/,  // Specific numbers/money
    /\d{1,2}:\d{2} (am|pm)/i,  // Specific times
    /\d+ (weeks|months|years) ago/i,  // Specific timeframes
    
    // Real challenges and mistakes
    /(mistake|error|wrong|failed)/i,
    /(learned the hard way|difficult lesson)/i,
    
    // Conversational tone
    /here's what (actually )?happened/i,
    /(honestly|frankly|to be honest)/i,
    
    // Specific industry terminology (context-dependent)
    // This would be customized per user's industry
  ]
  
  // Over-trying patterns (dramatic language)
  private readonly OVER_TRYING_PATTERNS = [
    // Excessive emphasis
    /[A-Z]{3,}/,  // ALL CAPS words
    /!{2,}/,      // Multiple exclamation marks
    /\*{2,}.*?\*{2,}/,  // **emphasized** text
    
    // Superlatives overuse
    /(amazing|incredible|unbelievable|phenomenal|extraordinary){2,}/i,
    /(best|worst|greatest|most important) .* (ever|in history|of all time)/i,
    
    // Drama patterns
    /(you won't believe|prepare to be amazed|this will shock you)/i
  ]

  /**
   * Analyse a LinkedIn post for authenticity signals
   */
  public analyzePost(postContent: string, profileData?: ProfileData): AuthenticitySignals {
    const signals: AuthenticitySignals = {
      authenticityScore: 0,
      isAiGenerated: false,
      hasHumbleBrag: false,
      isInfluencerBehavior: false,
      hasRealStorytellingvalue: false,
      showsGenuineExpertise: false,
      hasOverTrying: false,
      reasons: [],
      redFlags: [],
      positiveSignals: [],
      confidence: 0
    }

    // Check for AI-generated patterns
    const aiPatternMatches = this.AI_GENERATED_PATTERNS.filter(pattern => 
      pattern.test(postContent)
    ).length
    
    if (aiPatternMatches >= 2) {
      signals.isAiGenerated = true
      signals.redFlags.push("Multiple AI-generated content patterns detected")
    }

    // Check for humble brag specifically
    const humbleBragPatterns = [
      /i'm humbled? to/i,
      /blessed to announce/i,
      /grateful to share/i
    ]
    
    if (humbleBragPatterns.some(pattern => pattern.test(postContent))) {
      signals.hasHumbleBrag = true
      signals.redFlags.push("Humble brag language detected")
    }

    // Check for influencer behavior
    const influencerMatches = this.INFLUENCER_PATTERNS.filter(pattern =>
      pattern.test(postContent)
    ).length
    
    if (influencerMatches >= 1) {
      signals.isInfluencerBehavior = true
      signals.redFlags.push("Influencer-style self-promotion detected")
    }

    // Check for over-trying
    const overTryingMatches = this.OVER_TRYING_PATTERNS.filter(pattern =>
      pattern.test(postContent)
    ).length
    
    if (overTryingMatches >= 2) {
      signals.hasOverTrying = true
      signals.redFlags.push("Over-dramatic language and emphasis")
    }

    // Check for authentic storytelling
    const authenticMatches = this.AUTHENTIC_PATTERNS.filter(pattern =>
      pattern.test(postContent)
    ).length
    
    if (authenticMatches >= 2) {
      signals.hasRealStorytellingvalue = true
      signals.positiveSignals.push("Specific details and authentic storytelling")
    }

    // Check for genuine expertise (if profile data available)
    if (profileData) {
      signals.showsGenuineExpertise = this.validateExpertiseClaims(postContent, profileData)
      if (signals.showsGenuineExpertise) {
        signals.positiveSignals.push("Claims match actual experience")
      } else if (this.hasExpertiseClaims(postContent)) {
        signals.redFlags.push("Claims don't match profile experience")
      }
    }

    // Calculate overall authenticity score
    signals.authenticityScore = this.calculateAuthenticityScore(signals)
    signals.confidence = this.calculateConfidence(postContent, signals)
    
    // Generate human-readable reasons
    signals.reasons = this.generateReasons(signals)

    return signals
  }

  /**
   * Analyse multiple posts to get a comprehensive view
   */
  public analyzePostHistory(posts: string[], profileData?: ProfileData): AuthenticitySignals {
    if (posts.length === 0) {
      return this.getDefaultSignals()
    }

    const analyses = posts.map(post => this.analyzePost(post, profileData))
    
    // Aggregate signals across all posts
    const aggregated: AuthenticitySignals = {
      authenticityScore: 0,
      isAiGenerated: false,
      hasHumbleBrag: false,
      isInfluencerBehavior: false,
      hasRealStorytellingvalue: false,
      showsGenuineExpertise: false,
      hasOverTrying: false,
      reasons: [],
      redFlags: [],
      positiveSignals: [],
      confidence: 0
    }

    // Use majority voting for boolean flags
    const trueCount = (flag: keyof Pick<AuthenticitySignals, 'isAiGenerated' | 'hasHumbleBrag' | 'isInfluencerBehavior' | 'hasRealStorytellingvalue' | 'showsGenuineExpertise' | 'hasOverTrying'>) => 
      analyses.filter(a => a[flag]).length

    aggregated.isAiGenerated = trueCount('isAiGenerated') > analyses.length / 2
    aggregated.hasHumbleBrag = trueCount('hasHumbleBrag') > analyses.length / 3
    aggregated.isInfluencerBehavior = trueCount('isInfluencerBehavior') > analyses.length / 3
    aggregated.hasRealStorytellingvalue = trueCount('hasRealStorytellingvalue') > analyses.length / 3
    aggregated.showsGenuineExpertise = trueCount('showsGenuineExpertise') > analyses.length / 2
    aggregated.hasOverTrying = trueCount('hasOverTrying') > analyses.length / 3

    // Average the authenticity score
    aggregated.authenticityScore = analyses.reduce((sum, a) => sum + a.authenticityScore, 0) / analyses.length
    
    // Combine unique red flags and positive signals
    aggregated.redFlags = [...new Set(analyses.flatMap(a => a.redFlags))]
    aggregated.positiveSignals = [...new Set(analyses.flatMap(a => a.positiveSignals))]
    
    // Use highest confidence
    aggregated.confidence = Math.max(...analyses.map(a => a.confidence))
    
    aggregated.reasons = this.generateReasons(aggregated)

    return aggregated
  }

  /**
   * Check if post content claims expertise
   */
  private hasExpertiseClaims(content: string): boolean {
    const expertiseClaims = [
      /\d+ years? (of )?experience/i,
      /(expert|specialist|authority) (in|on)/i,
      /i've (built|created|led|managed)/i,
      /(ceo|founder|director|vp) (of|at)/i
    ]
    
    return expertiseClaims.some(pattern => pattern.test(content))
  }

  /**
   * Validate if expertise claims match actual profile
   */
  private validateExpertiseClaims(content: string, profile: ProfileData): boolean {
    if (!this.hasExpertiseClaims(content)) {
      return true // No claims to validate
    }

    // Extract years of experience claims
    const experienceMatch = content.match(/(\d+) years? (of )?experience/i)
    if (experienceMatch) {
      const claimedYears = parseInt(experienceMatch[1])
      const profileYears = this.extractYearsFromProfile(profile)
      
      // Allow some variance but flag major discrepancies
      if (claimedYears > profileYears + 2) {
        return false
      }
    }

    // Check role claims against current role
    const roleMatches = content.match(/(ceo|founder|director|vp|manager)/gi)
    if (roleMatches) {
      const claimedRoles = roleMatches.map(r => r.toLowerCase())
      const profileRole = profile.currentRole.toLowerCase()
      
      // Check if any claimed role is supported by profile
      return claimedRoles.some(role => profileRole.includes(role))
    }

    return true // Default to true if we can't validate
  }

  /**
   * Extract years of experience from profile
   */
  private extractYearsFromProfile(profile: ProfileData): number {
    // This would analyse the experience section to calculate total years
    // For now, return a conservative estimate
    const experienceLines = profile.experience.split('\n').length
    return Math.min(experienceLines * 1.5, 20) // Rough estimate
  }

  /**
   * Calculate overall authenticity score based on signals
   */
  private calculateAuthenticityScore(signals: AuthenticitySignals): number {
    let score = 0.5 // Start neutral

    // Negative factors
    if (signals.isAiGenerated) score -= 0.3
    if (signals.hasHumbleBrag) score -= 0.15
    if (signals.isInfluencerBehavior) score -= 0.25
    if (signals.hasOverTrying) score -= 0.2
    if (!signals.showsGenuineExpertise && signals.redFlags.some(f => f.includes("Claims don't match"))) {
      score -= 0.3
    }

    // Positive factors
    if (signals.hasRealStorytellingvalue) score += 0.3
    if (signals.showsGenuineExpertise) score += 0.25

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(content: string, signals: AuthenticitySignals): number {
    let confidence = 0.5

    // Higher confidence with more content to analyse
    if (content.length > 500) confidence += 0.2
    if (content.length > 1000) confidence += 0.1

    // Higher confidence with clear signals
    if (signals.redFlags.length > 0) confidence += 0.15
    if (signals.positiveSignals.length > 0) confidence += 0.15

    // Lower confidence for edge cases
    if (signals.authenticityScore > 0.3 && signals.authenticityScore < 0.7) {
      confidence -= 0.1
    }

    return Math.max(0.1, Math.min(0.95, confidence))
  }

  /**
   * Generate human-readable reasons for the analysis
   */
  private generateReasons(signals: AuthenticitySignals): string[] {
    const reasons: string[] = []

    if (signals.authenticityScore < 0.3) {
      reasons.push("High likelihood of inauthentic content")
    } else if (signals.authenticityScore > 0.7) {
      reasons.push("Shows signs of authentic, genuine content")
    } else {
      reasons.push("Mixed signals - requires human judgment")
    }

    if (signals.isAiGenerated) {
      reasons.push("Contains multiple AI-generated content patterns")
    }
    
    if (signals.isInfluencerBehavior) {
      reasons.push("Shows influencer-style self-promotion behavior")
    }
    
    if (signals.hasRealStorytellingvalue) {
      reasons.push("Contains specific details and authentic storytelling")
    }

    return reasons
  }

  /**
   * Get default signals when no analysis is possible
   */
  private getDefaultSignals(): AuthenticitySignals {
    return {
      authenticityScore: 0.5,
      isAiGenerated: false,
      hasHumbleBrag: false,
      isInfluencerBehavior: false,
      hasRealStorytellingvalue: false,
      showsGenuineExpertise: false,
      hasOverTrying: false,
      reasons: ["Insufficient data for analysis"],
      redFlags: [],
      positiveSignals: [],
      confidence: 0.1
    }
  }

  /**
   * Get a quick authenticity assessment for a single post
   */
  public quickAssessment(postContent: string): 'authentic' | 'suspicious' | 'likely_ai' {
    const signals = this.analyzePost(postContent)
    
    if (signals.isAiGenerated || signals.authenticityScore < 0.3) {
      return 'likely_ai'
    } else if (signals.authenticityScore > 0.7) {
      return 'authentic'
    } else {
      return 'suspicious'
    }
  }
}

export const contentAuthenticityAnalyzer = new ContentAuthenticityAnalyzer()