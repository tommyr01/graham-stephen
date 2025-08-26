/**
 * Targeted Learning Engine
 * 
 * Focused learning system based on Graham's specific criteria for identifying
 * quality prospects vs time-wasters. Learns from targeted feedback to improve
 * content authenticity detection and network quality scoring.
 */

import { contentAuthenticityAnalyzer } from './content-authenticity-analyzer'
import { networkQualityAnalyzer } from './network-quality-analyzer'

interface TargetedFeedback {
  decision: 'worth_connecting' | 'time_waster'
  signals: string[]
  notes?: string
  prospectId: string
  timestamp: Date
  userId: string
  contextData: {
    postContent?: string
    profileData?: any
    networkData?: any
    relevanceScore?: number
  }
}

interface LearningPattern {
  signal: string
  correlation: number  // How well this signal predicts the decision
  frequency: number   // How often this signal appears
  lastUpdated: Date
  examples: string[]  // Example content/contexts where this signal appeared
}

interface UserLearningProfile {
  userId: string
  preferences: {
    contentAuthenticityWeight: number
    networkQualityWeight: number
    specificSignalWeights: Map<string, number>
  }
  patterns: Map<string, LearningPattern>
  feedbackCount: number
  lastUpdated: Date
}

interface LearningInsights {
  improvedSignals: string[]
  newPatterns: string[]
  confidenceBoost: number
  recommendedAdjustments: string[]
}

export class TargetedLearningEngine {
  private userProfiles: Map<string, UserLearningProfile> = new Map()
  
  // Signal mappings from feedback to analysis systems
  private readonly SIGNAL_MAPPINGS = {
    // Positive signals
    'authentic_content': 'content_authenticity',
    'real_expertise': 'expertise_validation', 
    'quality_network': 'network_quality',
    'meaningful_engagement': 'engagement_quality',
    'consistent_authority': 'authority_consistency',
    'warm_connection': 'network_warmth',
    
    // Negative signals  
    'ai_generated': 'content_authenticity',
    'automation_behavior': 'automation_detection',
    'influencer_wannabe': 'influencer_behavior',
    'fake_authority': 'authority_validation',
    'shallow_content': 'content_depth',
    'over_trying': 'over_dramatic'
  }

  /**
   * Process targeted feedback and update learning patterns
   */
  public async processFeedback(feedback: TargetedFeedback): Promise<LearningInsights> {
    let userProfile = this.getUserProfile(feedback.userId)
    
    // Extract learning signals from feedback
    const learningSignals = this.extractLearningSignals(feedback)
    
    // Update patterns based on feedback
    const insights = this.updateLearningPatterns(userProfile, learningSignals, feedback)
    
    // Adjust system weights based on patterns
    this.adjustSystemWeights(userProfile, learningSignals)
    
    // Update authenticity analyzer patterns if needed
    this.updateAuthenticityPatterns(userProfile, feedback)
    
    // Update network quality preferences
    this.updateNetworkPreferences(userProfile, feedback)
    
    userProfile.feedbackCount++
    userProfile.lastUpdated = new Date()
    
    return insights
  }

  /**
   * Get or create user learning profile
   */
  private getUserProfile(userId: string): UserLearningProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        preferences: {
          contentAuthenticityWeight: 0.4,
          networkQualityWeight: 0.3,
          specificSignalWeights: new Map()
        },
        patterns: new Map(),
        feedbackCount: 0,
        lastUpdated: new Date()
      })
    }
    return this.userProfiles.get(userId)!
  }

  /**
   * Extract meaningful learning signals from feedback
   */
  private extractLearningSignals(feedback: TargetedFeedback): Array<{signal: string, weight: number, context: string}> {
    const signals: Array<{signal: string, weight: number, context: string}> = []
    
    // Direct signals from user selection
    feedback.signals.forEach(signal => {
      signals.push({
        signal,
        weight: feedback.decision === 'worth_connecting' ? 1.0 : -1.0,
        context: this.getSignalContext(signal, feedback)
      })
    })
    
    // Extract signals from notes using simple NLP
    if (feedback.notes) {
      const noteSignals = this.extractSignalsFromNotes(feedback.notes, feedback.decision)
      signals.push(...noteSignals)
    }
    
    return signals
  }

  /**
   * Get context for a specific signal
   */
  private getSignalContext(signal: string, feedback: TargetedFeedback): string {
    if (feedback.contextData.postContent) {
      // Extract relevant snippet from post content for this signal
      return this.extractRelevantContext(signal, feedback.contextData.postContent)
    }
    return feedback.notes || ''
  }

  /**
   * Extract relevant context snippet for a signal
   */
  private extractRelevantContext(signal: string, content: string): string {
    // Extract 2-3 sentences around key phrases related to the signal
    const sentences = content.split(/[.!?]+/)
    
    const keyWords = this.getKeyWordsForSignal(signal)
    const relevantSentences = sentences.filter(sentence => 
      keyWords.some(word => sentence.toLowerCase().includes(word.toLowerCase()))
    )
    
    return relevantSentences.slice(0, 2).join('. ').trim()
  }

  /**
   * Get key words associated with a signal
   */
  private getKeyWordsForSignal(signal: string): string[] {
    const keyWordMap: Record<string, string[]> = {
      'ai_generated': ['humbled', 'thrilled', 'excited to share', 'game changer'],
      'authentic_content': ['happened', 'learned', 'mistake', 'experience'],
      'influencer_wannabe': ['follow me', 'subscribe', 'thoughts?', 'agree?'],
      'real_expertise': ['years experience', 'built', 'led', 'managed'],
      'quality_network': ['connected with', 'introduced to', 'colleague'],
      'over_trying': ['amazing', 'incredible', 'mind-blowing', 'revolutionary']
    }
    
    return keyWordMap[signal] || []
  }

  /**
   * Extract signals from free-text notes
   */
  private extractSignalsFromNotes(notes: string, decision: 'worth_connecting' | 'time_waster'): Array<{signal: string, weight: number, context: string}> {
    const signals: Array<{signal: string, weight: number, context: string}> = []
    const weight = decision === 'worth_connecting' ? 1.0 : -1.0
    
    // Pattern matching for common feedback themes
    const patterns = {
      'ai_generated': /\b(ai|artificial|generated|formulaic|template)\b/i,
      'authentic_content': /\b(authentic|real|genuine|specific|detailed)\b/i,
      'influencer_behavior': /\b(influencer|self[\s\-]?promot|trying too hard)\b/i,
      'fake_authority': /\b(claims|doesn't match|overstat|fake|postur)\b/i,
      'quality_network': /\b(network|connect|quality people|associates)\b/i,
      'shallow_content': /\b(shallow|superficial|generic|meaningless)\b/i
    }
    
    Object.entries(patterns).forEach(([signal, pattern]) => {
      if (pattern.test(notes)) {
        signals.push({
          signal,
          weight,
          context: notes
        })
      }
    })
    
    return signals
  }

  /**
   * Update learning patterns based on feedback
   */
  private updateLearningPatterns(
    profile: UserLearningProfile, 
    signals: Array<{signal: string, weight: number, context: string}>,
    feedback: TargetedFeedback
  ): LearningInsights {
    
    const insights: LearningInsights = {
      improvedSignals: [],
      newPatterns: [],
      confidenceBoost: 0,
      recommendedAdjustments: []
    }
    
    signals.forEach(({signal, weight, context}) => {
      let pattern = profile.patterns.get(signal)
      
      if (!pattern) {
        // New pattern discovered
        pattern = {
          signal,
          correlation: weight,
          frequency: 1,
          lastUpdated: new Date(),
          examples: [context]
        }
        profile.patterns.set(signal, pattern)
        insights.newPatterns.push(signal)
      } else {
        // Update existing pattern
        const oldCorrelation = pattern.correlation
        
        // Update correlation using exponential moving average
        const alpha = 0.3 // Learning rate
        pattern.correlation = (1 - alpha) * pattern.correlation + alpha * weight
        pattern.frequency++
        pattern.lastUpdated = new Date()
        
        // Add example if it's different from existing ones
        if (!pattern.examples.some(ex => this.getSimilarity(ex, context) > 0.8)) {
          pattern.examples.push(context)
          if (pattern.examples.length > 5) {
            pattern.examples = pattern.examples.slice(-5) // Keep only recent examples
          }
        }
        
        // Check if signal improved significantly
        if (Math.abs(pattern.correlation - oldCorrelation) > 0.2) {
          insights.improvedSignals.push(signal)
        }
      }
    })
    
    // Calculate confidence boost
    insights.confidenceBoost = Math.min(0.1, signals.length * 0.02)
    
    // Generate recommendations
    insights.recommendedAdjustments = this.generateRecommendations(profile)
    
    return insights
  }

  /**
   * Adjust system weights based on learned patterns
   */
  private adjustSystemWeights(profile: UserLearningProfile, signals: Array<{signal: string, weight: number, context: string}>) {
    signals.forEach(({signal, weight}) => {
      const mappedSystem = this.SIGNAL_MAPPINGS[signal]
      if (mappedSystem) {
        // Adjust weights for content authenticity vs network quality
        if (mappedSystem === 'content_authenticity') {
          if (weight > 0) {
            profile.preferences.contentAuthenticityWeight = Math.min(0.8, 
              profile.preferences.contentAuthenticityWeight + 0.05)
          }
        } else if (mappedSystem === 'network_quality') {
          if (weight > 0) {
            profile.preferences.networkQualityWeight = Math.min(0.8,
              profile.preferences.networkQualityWeight + 0.05)
          }
        }
        
        // Update specific signal weights
        const currentWeight = profile.preferences.specificSignalWeights.get(signal) || 0.5
        const newWeight = Math.max(0.1, Math.min(0.9, currentWeight + (weight * 0.1)))
        profile.preferences.specificSignalWeights.set(signal, newWeight)
      }
    })
  }

  /**
   * Update authenticity analyzer based on user feedback
   */
  private updateAuthenticityPatterns(profile: UserLearningProfile, feedback: TargetedFeedback) {
    // If user consistently marks AI-generated content, we can learn their specific patterns
    const aiGeneratedPattern = profile.patterns.get('ai_generated')
    const authenticPattern = profile.patterns.get('authentic_content')
    
    if (aiGeneratedPattern && aiGeneratedPattern.frequency >= 3) {
      // Extract common phrases from AI-generated examples
      const commonPhrases = this.extractCommonPhrases(aiGeneratedPattern.examples)
      // This would update the content authenticity analyzer with user-specific patterns
    }
    
    if (authenticPattern && authenticPattern.frequency >= 3) {
      // Learn what this user considers authentic
      const authenticPhrases = this.extractCommonPhrases(authenticPattern.examples)
      // Update positive patterns
    }
  }

  /**
   * Update network quality preferences
   */
  private updateNetworkPreferences(profile: UserLearningProfile, feedback: TargetedFeedback) {
    if (feedback.signals.includes('quality_network') && feedback.decision === 'worth_connecting') {
      // Learn about what this user considers quality networks
      if (feedback.contextData.networkData) {
        // Extract quality indicators from the network data
        const qualityIndicators = this.extractNetworkQualityIndicators(feedback.contextData.networkData)
        // This would update the network quality analyzer
      }
    }
  }

  /**
   * Extract common phrases from examples
   */
  private extractCommonPhrases(examples: string[]): string[] {
    const wordCounts: Map<string, number> = new Map()
    
    examples.forEach(example => {
      const words = example.toLowerCase().match(/\b\w+\b/g) || []
      words.forEach(word => {
        if (word.length > 3) { // Skip short words
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        }
      })
    })
    
    // Return words that appear in multiple examples
    return Array.from(wordCounts.entries())
      .filter(([word, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Extract network quality indicators
   */
  private extractNetworkQualityIndicators(networkData: any): string[] {
    // This would analyze the network data to find patterns
    // For now, return placeholder
    return []
  }

  /**
   * Generate recommendations based on learned patterns
   */
  private generateRecommendations(profile: UserLearningProfile): string[] {
    const recommendations: string[] = []
    
    // Analyze pattern strengths
    const strongPatterns = Array.from(profile.patterns.entries())
      .filter(([signal, pattern]) => Math.abs(pattern.correlation) > 0.7 && pattern.frequency >= 3)
      .map(([signal]) => signal)
    
    if (strongPatterns.includes('ai_generated')) {
      recommendations.push("Consider increasing AI-detection sensitivity for better filtering")
    }
    
    if (strongPatterns.includes('quality_network')) {
      recommendations.push("Network quality appears to be a strong predictor for you")
    }
    
    if (profile.preferences.contentAuthenticityWeight > 0.6) {
      recommendations.push("Content authenticity is weighted heavily in your scoring")
    }
    
    return recommendations
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  private getSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Get personalized scoring adjustments for a user
   */
  public getPersonalizedAdjustments(userId: string): {
    contentAuthenticityWeight: number
    networkQualityWeight: number
    signalAdjustments: Map<string, number>
  } {
    const profile = this.userProfiles.get(userId)
    
    if (!profile || profile.feedbackCount < 3) {
      // Return default weights for new users
      return {
        contentAuthenticityWeight: 0.4,
        networkQualityWeight: 0.3,
        signalAdjustments: new Map()
      }
    }
    
    return {
      contentAuthenticityWeight: profile.preferences.contentAuthenticityWeight,
      networkQualityWeight: profile.preferences.networkQualityWeight,
      signalAdjustments: profile.preferences.specificSignalWeights
    }
  }

  /**
   * Get learning insights for a user
   */
  public getUserLearningInsights(userId: string): {
    totalFeedback: number
    strongPatterns: string[]
    learningProgress: number
    recommendations: string[]
  } {
    const profile = this.userProfiles.get(userId)
    
    if (!profile) {
      return {
        totalFeedback: 0,
        strongPatterns: [],
        learningProgress: 0,
        recommendations: ['Start providing feedback to improve accuracy']
      }
    }
    
    const strongPatterns = Array.from(profile.patterns.entries())
      .filter(([signal, pattern]) => Math.abs(pattern.correlation) > 0.6 && pattern.frequency >= 2)
      .map(([signal]) => signal)
    
    const learningProgress = Math.min(1, profile.feedbackCount / 20) // Progress towards 20 feedback examples
    
    return {
      totalFeedback: profile.feedbackCount,
      strongPatterns,
      learningProgress,
      recommendations: this.generateRecommendations(profile)
    }
  }
}

export const targetedLearningEngine = new TargetedLearningEngine()