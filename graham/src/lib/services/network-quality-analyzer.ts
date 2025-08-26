/**
 * Network Quality Analyzer
 * 
 * Analyzes the quality of a prospect's LinkedIn network based on Graham's 
 * "quality attracts quality" principle. Examines engagement patterns and 
 * connection quality to score prospects.
 */

interface NetworkConnection {
  profileId: string
  name: string
  role: string
  company: string
  connectionDegree: 1 | 2 | 3
  mutualConnections?: number
  qualityScore?: number
  engagementFrequency: 'high' | 'medium' | 'low'
  lastInteraction?: Date
}

interface EngagementPattern {
  type: 'comment' | 'like' | 'share' | 'mention'
  postId: string
  content?: string
  timestamp: Date
  engagementQuality: 'high' | 'medium' | 'low'
}

interface NetworkQualitySignals {
  // Core network score (0-1)
  networkQualityScore: number
  
  // Specific quality indicators
  hasQualityConnections: boolean
  engagesWithExperts: boolean
  isEngagedWithByQuality: boolean
  hasWarmPathToUser: boolean
  isInfluencerNetwork: boolean
  
  // Network analysis
  topConnections: NetworkConnection[]
  qualityEngagements: EngagementPattern[]
  networkInsights: string[]
  warmPaths: string[]
  redFlags: string[]
  
  confidence: number
}

interface QualityPerson {
  profileId: string
  name: string
  qualityScore: number
  role: string
  company: string
  isKnownQuality: boolean // User has marked as quality
}

export class NetworkQualityAnalyzer {
  
  // Known quality indicators (these would be learned from user feedback)
  private qualityPeople: Map<string, QualityPerson> = new Map()
  private qualityCompanies: Set<string> = new Set()
  private qualityRoles: Set<string> = new Set()
  
  // Quality signals in roles/titles
  private readonly QUALITY_ROLE_INDICATORS = [
    // Senior roles
    /\b(ceo|cto|cfo|founder|co[\-\s]?founder)\b/i,
    /\b(president|vp|vice[\s\-]?president|svp)\b/i,
    /\b(director|senior[\s\-]?director|executive[\s\-]?director)\b/i,
    /\b(head[\s\-]?of|chief|principal)\b/i,
    
    // Specific expertise roles
    /\b(partner|managing[\s\-]?partner|senior[\s\-]?partner)\b/i,
    /\b(lead|senior[\s\-]?lead|tech[\s\-]?lead)\b/i,
    /\b(architect|senior[\s\-]?architect|principal[\s\-]?architect)\b/i,
  ]
  
  // Company size/quality indicators
  private readonly QUALITY_COMPANY_INDICATORS = [
    // Enterprise companies (typically higher quality networks)
    /\b(fortune[\s\-]?500|f500)\b/i,
    /\b(enterprise|global|international)\b/i,
    /\b(inc|corp|corporation|ltd|limited)\b/i,
    
    // VC/Investment firms
    /\b(ventures|capital|partners|investments)\b/i,
    /\b(fund|funds|equity|advisors)\b/i,
  ]
  
  // Low-quality network indicators
  private readonly INFLUENCER_NETWORK_PATTERNS = [
    // MLM/Get-rich-quick schemes
    /\b(mlm|multi[\s\-]?level|network[\s\-]?marketing)\b/i,
    /\b(passive[\s\-]?income|financial[\s\-]?freedom)\b/i,
    /\b(entrepreneur|digital[\s\-]?nomad|lifestyle[\s\-]?design)\b/i,
    /\b(crypto|bitcoin|nft|trading)\b/i,
    
    // Generic influencer titles
    /\b(influencer|content[\s\-]?creator|thought[\s\-]?leader)\b/i,
    /\b(motivational[\s\-]?speaker|life[\s\-]?coach|mindset[\s\-]?coach)\b/i,
  ]

  constructor() {
    this.initializeQualityIndicators()
  }

  /**
   * Initialize known quality indicators (these would come from user feedback)
   */
  private initializeQualityIndicators() {
    // This would be populated from user feedback over time
    // For now, some general high-quality company indicators
    this.qualityCompanies.add('Google')
    this.qualityCompanies.add('Microsoft')
    this.qualityCompanies.add('Apple')
    this.qualityCompanies.add('Amazon')
    this.qualityCompanies.add('Tesla')
    this.qualityCompanies.add('McKinsey')
    this.qualityCompanies.add('Bain')
    this.qualityCompanies.add('BCG')
    this.qualityCompanies.add('Goldman Sachs')
    this.qualityCompanies.add('JP Morgan')
  }

  /**
   * Analyse network quality for a prospect
   */
  public analyzeNetworkQuality(
    connections: NetworkConnection[], 
    engagements: EngagementPattern[],
    userQualityNetwork?: QualityPerson[]
  ): NetworkQualitySignals {
    
    const signals: NetworkQualitySignals = {
      networkQualityScore: 0,
      hasQualityConnections: false,
      engagesWithExperts: false,
      isEngagedWithByQuality: false,
      hasWarmPathToUser: false,
      isInfluencerNetwork: false,
      topConnections: [],
      qualityEngagements: [],
      networkInsights: [],
      warmPaths: [],
      redFlags: [],
      confidence: 0
    }

    // Analyse connection quality
    const qualityConnections = this.identifyQualityConnections(connections)
    signals.hasQualityConnections = qualityConnections.length >= 3
    signals.topConnections = qualityConnections.slice(0, 10)

    // Analyse engagement patterns
    const qualityEngagements = this.analyzeEngagementQuality(engagements, qualityConnections)
    signals.engagesWithExperts = qualityEngagements.filter(e => e.engagementQuality === 'high').length >= 2
    signals.qualityEngagements = qualityEngagements

    // Check for warm paths to user's network
    if (userQualityNetwork) {
      signals.warmPaths = this.findWarmPaths(connections, userQualityNetwork)
      signals.hasWarmPathToUser = signals.warmPaths.length > 0
    }

    // Check for influencer network red flags
    signals.isInfluencerNetwork = this.detectInfluencerNetwork(connections)
    if (signals.isInfluencerNetwork) {
      signals.redFlags.push("Connected primarily to influencers/lifestyle gurus")
    }

    // Calculate overall network quality score
    signals.networkQualityScore = this.calculateNetworkScore(signals, connections)
    
    // Generate insights
    signals.networkInsights = this.generateNetworkInsights(signals, qualityConnections)
    
    // Calculate confidence
    signals.confidence = this.calculateConfidence(connections, engagements)

    return signals
  }

  /**
   * Identify quality connections based on roles, companies, and known quality people
   */
  private identifyQualityConnections(connections: NetworkConnection[]): NetworkConnection[] {
    return connections
      .map(conn => ({
        ...conn,
        qualityScore: this.calculateConnectionQuality(conn)
      }))
      .filter(conn => (conn.qualityScore || 0) > 0.6)
      .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
  }

  /**
   * Calculate quality score for a single connection
   */
  private calculateConnectionQuality(connection: NetworkConnection): number {
    let score = 0.3 // Base score

    // Check if it's a known quality person
    if (this.qualityPeople.has(connection.profileId)) {
      const qualityPerson = this.qualityPeople.get(connection.profileId)!
      return qualityPerson.qualityScore
    }

    // Quality role indicators
    const roleQuality = this.assessRoleQuality(connection.role)
    score += roleQuality * 0.3

    // Quality company indicators
    const companyQuality = this.assessCompanyQuality(connection.company)
    score += companyQuality * 0.25

    // Connection degree (closer connections are typically higher quality)
    if (connection.connectionDegree === 1) score += 0.15
    else if (connection.connectionDegree === 2) score += 0.1

    // Mutual connections (more mutual = higher quality)
    if (connection.mutualConnections) {
      if (connection.mutualConnections > 10) score += 0.1
      else if (connection.mutualConnections > 5) score += 0.05
    }

    // High engagement frequency suggests quality relationship
    if (connection.engagementFrequency === 'high') score += 0.15
    else if (connection.engagementFrequency === 'medium') score += 0.05

    return Math.min(1, Math.max(0, score))
  }

  /**
   * Assess role quality based on seniority and expertise indicators
   */
  private assessRoleQuality(role: string): number {
    // Check for quality role indicators
    const qualityMatches = this.QUALITY_ROLE_INDICATORS.filter(pattern => pattern.test(role))
    if (qualityMatches.length > 0) return 0.8

    // Check for influencer red flags
    const influencerMatches = this.INFLUENCER_NETWORK_PATTERNS.filter(pattern => pattern.test(role))
    if (influencerMatches.length > 0) return 0.1

    // Senior/lead roles
    if (/\b(senior|lead|principal|staff)\b/i.test(role)) return 0.6

    // Manager roles
    if (/\b(manager|supervisor)\b/i.test(role)) return 0.4

    return 0.3 // Default for other roles
  }

  /**
   * Assess company quality
   */
  private assessCompanyQuality(company: string): number {
    // Known quality companies
    if (this.qualityCompanies.has(company)) return 0.9

    // Quality company indicators
    const qualityMatches = this.QUALITY_COMPANY_INDICATORS.filter(pattern => pattern.test(company))
    if (qualityMatches.length > 0) return 0.7

    // Check for low-quality indicators
    const lowQualityPatterns = [
      /\b(coaching|consulting|guru|expert)\b/i,
      /\b(academy|institute|university)\b/i, // Unless it's a real university
      /\b(solutions|services|group|llc)\b/i
    ]
    
    const lowQualityMatches = lowQualityPatterns.filter(pattern => pattern.test(company))
    if (lowQualityMatches.length > 1) return 0.2

    return 0.5 // Default
  }

  /**
   * Analyse engagement quality patterns
   */
  private analyzeEngagementQuality(
    engagements: EngagementPattern[], 
    qualityConnections: NetworkConnection[]
  ): EngagementPattern[] {
    
    const qualityProfileIds = new Set(qualityConnections.map(c => c.profileId))
    
    return engagements.map(engagement => {
      let quality: 'high' | 'medium' | 'low' = 'medium'
      
      // High quality if engaging with known quality people
      if (qualityProfileIds.has(engagement.postId)) {
        quality = 'high'
      }
      
      // Analyse comment quality if available
      if (engagement.type === 'comment' && engagement.content) {
        const commentQuality = this.assessCommentQuality(engagement.content)
        if (commentQuality > 0.7) quality = 'high'
        else if (commentQuality < 0.3) quality = 'low'
      }
      
      return {
        ...engagement,
        engagementQuality: quality
      }
    })
  }

  /**
   * Assess comment quality (meaningful vs superficial)
   */
  private assessCommentQuality(comment: string): number {
    let score = 0.5

    // Meaningful engagement indicators
    if (comment.length > 50) score += 0.2
    if (/\b(interesting|insightful|thoughtful|valuable)\b/i.test(comment)) score += 0.1
    if (/\?(.*\?)?/.test(comment)) score += 0.1 // Asks questions
    if (/\b(experience|perspective|approach|strategy)\b/i.test(comment)) score += 0.15

    // Superficial engagement indicators
    if (/^(great|nice|awesome|amazing|fantastic)[\s!]*$/i.test(comment)) score -= 0.3
    if (/^(thanks|thank you|agreed|exactly|this)[\s!]*$/i.test(comment)) score -= 0.2
    if (comment.length < 10) score -= 0.2

    return Math.min(1, Math.max(0, score))
  }

  /**
   * Find warm paths to user's quality network
   */
  private findWarmPaths(connections: NetworkConnection[], userQualityNetwork: QualityPerson[]): string[] {
    const warmPaths: string[] = []
    const userQualityIds = new Set(userQualityNetwork.map(p => p.profileId))
    
    connections.forEach(conn => {
      if (userQualityIds.has(conn.profileId)) {
        warmPaths.push(`Direct connection to ${conn.name} (${conn.role})`)
      } else if (conn.connectionDegree === 2 && conn.mutualConnections && conn.mutualConnections > 0) {
        // Check if mutual connections include quality people
        warmPaths.push(`Connected through ${conn.mutualConnections} mutual connections`)
      }
    })
    
    return warmPaths
  }

  /**
   * Detect if this is primarily an influencer/lifestyle network
   */
  private detectInfluencerNetwork(connections: NetworkConnection[]): boolean {
    const influencerConnections = connections.filter(conn => 
      this.INFLUENCER_NETWORK_PATTERNS.some(pattern => 
        pattern.test(conn.role) || pattern.test(conn.company)
      )
    )
    
    // If more than 30% of connections are influencer-type, flag as influencer network
    return influencerConnections.length > connections.length * 0.3
  }

  /**
   * Calculate overall network quality score
   */
  private calculateNetworkScore(signals: NetworkQualitySignals, connections: NetworkConnection[]): number {
    let score = 0.3 // Base score

    // Quality connections boost
    if (signals.hasQualityConnections) score += 0.25
    
    // Expert engagement boost
    if (signals.engagesWithExperts) score += 0.2
    
    // Warm path boost
    if (signals.hasWarmPathToUser) score += 0.15
    
    // Top connections quality
    const avgQualityScore = signals.topConnections.reduce((sum, conn) => 
      sum + (conn.qualityScore || 0), 0) / Math.max(1, signals.topConnections.length)
    score += avgQualityScore * 0.2

    // Penalties
    if (signals.isInfluencerNetwork) score -= 0.3
    if (connections.length < 50) score -= 0.1 // Very small network
    if (connections.length > 5000) score -= 0.05 // Possibly fake/bulk connections

    return Math.min(1, Math.max(0, score))
  }

  /**
   * Generate network insights
   */
  private generateNetworkInsights(signals: NetworkQualitySignals, qualityConnections: NetworkConnection[]): string[] {
    const insights: string[] = []
    
    if (qualityConnections.length > 0) {
      const topCompanies = [...new Set(qualityConnections.slice(0, 5).map(c => c.company))]
      insights.push(`Connected to quality people at: ${topCompanies.join(', ')}`)
    }
    
    if (signals.hasWarmPathToUser) {
      insights.push(`Has warm introduction paths through mutual connections`)
    }
    
    if (signals.engagesWithExperts) {
      insights.push(`Actively engages with industry experts and thought leaders`)
    }
    
    if (signals.networkQualityScore > 0.7) {
      insights.push(`Moves in high-quality professional circles`)
    } else if (signals.networkQualityScore < 0.4) {
      insights.push(`Network shows limited professional depth`)
    }
    
    return insights
  }

  /**
   * Calculate confidence in network analysis
   */
  private calculateConfidence(connections: NetworkConnection[], engagements: EngagementPattern[]): number {
    let confidence = 0.3

    // More connections = higher confidence
    if (connections.length > 100) confidence += 0.2
    if (connections.length > 300) confidence += 0.1

    // More engagement data = higher confidence
    if (engagements.length > 10) confidence += 0.2
    if (engagements.length > 30) confidence += 0.1

    // Detailed connection info = higher confidence
    const connectionsWithDetails = connections.filter(c => c.mutualConnections && c.role && c.company)
    if (connectionsWithDetails.length > connections.length * 0.7) confidence += 0.15

    return Math.min(0.95, confidence)
  }

  /**
   * Add a quality person to the known quality network (from user feedback)
   */
  public addQualityPerson(person: QualityPerson) {
    this.qualityPeople.set(person.profileId, person)
  }

  /**
   * Get quality assessment for quick filtering
   */
  public quickNetworkAssessment(connections: NetworkConnection[]): 'high_quality' | 'average' | 'low_quality' {
    const signals = this.analyzeNetworkQuality(connections, [])
    
    if (signals.networkQualityScore > 0.7) return 'high_quality'
    else if (signals.networkQualityScore < 0.4) return 'low_quality'
    else return 'average'
  }
}

export const networkQualityAnalyzer = new NetworkQualityAnalyzer()