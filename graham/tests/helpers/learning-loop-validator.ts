/**
 * Learning Loop Validator
 * 
 * Helper class for testing and validating learning loop functionality.
 * Provides utilities for creating test sessions, simulating learning scenarios,
 * and measuring learning effectiveness.
 */

import { v4 as uuidv4 } from 'uuid';

export interface LearningSession {
  id: string;
  userId: string;
  baselineAccuracy: number;
  currentAccuracy: number;
  patternsLearned: DiscoveredPattern[];
  profilesAnalyzed: number;
  createdAt: Date;
}

export interface DiscoveredPattern {
  id: string;
  type: 'industry_signal' | 'success_indicator' | 'user_preference' | 'timing_pattern';
  confidence: number;
  evidence: any[];
  applicationSuccessRate?: number;
  lastUpdated: Date;
}

export interface VoiceFeedbackResult {
  patternsExtracted: DiscoveredPattern[];
  confidenceImpact: number;
  processingTime: number;
  learningValue: number;
}

export interface ProfileAnalysisResult {
  accuracy: number;
  confidence: number;
  relevanceScore: number;
  learningContributions: PatternContribution[];
  processingTime: number;
}

export interface PatternContribution {
  patternId: string;
  patternType: string;
  impact: number;
  confidence: number;
}

export interface LearningConfirmation {
  acknowledged: boolean;
  patternsUpdated: number;
  accuracyImpact: number;
  nextProfilePredictions: any;
}

export class LearningLoopValidator {
  private activeSessions: Map<string, LearningSession> = new Map();
  private mockDatabase: Map<string, any> = new Map();

  /**
   * Initialize a test learning session
   */
  async initializeSession(sessionData: Partial<LearningSession>): Promise<LearningSession> {
    const session: LearningSession = {
      id: uuidv4(),
      userId: sessionData.userId || uuidv4(),
      baselineAccuracy: sessionData.baselineAccuracy || 0.72,
      currentAccuracy: sessionData.baselineAccuracy || 0.72,
      patternsLearned: [],
      profilesAnalyzed: 0,
      createdAt: new Date(),
      ...sessionData
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Process voice feedback and extract learning patterns
   */
  async processVoiceFeedback(params: {
    sessionId: string;
    feedback: string;
    profileData: any;
    expectLearning: boolean;
  }): Promise<VoiceFeedbackResult> {
    const startTime = performance.now();
    const session = this.activeSessions.get(params.sessionId);
    
    if (!session) {
      throw new Error(`Session ${params.sessionId} not found`);
    }

    // Simulate pattern extraction from voice feedback
    const extractedPatterns = await this.extractPatternsFromFeedback(
      params.feedback,
      params.profileData
    );

    // Update session with new patterns
    session.patternsLearned.push(...extractedPatterns);
    session.profilesAnalyzed++;

    // Calculate confidence impact
    const confidenceImpact = this.calculateConfidenceImpact(extractedPatterns);
    session.currentAccuracy = Math.min(0.95, session.currentAccuracy + confidenceImpact);

    const processingTime = performance.now() - startTime;

    return {
      patternsExtracted: extractedPatterns,
      confidenceImpact,
      processingTime,
      learningValue: this.calculateLearningValue(extractedPatterns)
    };
  }

  /**
   * Analyze profile with learning enhancements applied
   */
  async analyzeProfileWithLearning(
    sessionId: string,
    profileData: any
  ): Promise<ProfileAnalysisResult> {
    const startTime = performance.now();
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Get baseline analysis
    const baselineResult = await this.analyzeProfileBaseline(profileData);

    // Apply learned patterns
    const learningContributions = await this.applyLearnedPatterns(
      session.patternsLearned,
      profileData
    );

    // Calculate enhanced accuracy
    const learningBoost = learningContributions.reduce(
      (sum, contrib) => sum + contrib.impact,
      0
    );

    const enhancedAccuracy = Math.min(0.95, baselineResult.accuracy + learningBoost);
    const enhancedConfidence = Math.min(0.95, baselineResult.confidence + (learningBoost * 0.5));

    const processingTime = performance.now() - startTime;

    return {
      accuracy: enhancedAccuracy,
      confidence: enhancedConfidence,
      relevanceScore: enhancedAccuracy,
      learningContributions,
      processingTime
    };
  }

  /**
   * Baseline profile analysis without learning
   */
  async analyzeProfileBaseline(profileData: any): Promise<ProfileAnalysisResult> {
    const startTime = performance.now();
    
    // Simulate baseline AI analysis
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // Simulate processing
    
    const baselineAccuracy = this.calculateBaselineAccuracy(profileData);
    const processingTime = performance.now() - startTime;

    return {
      accuracy: baselineAccuracy,
      confidence: baselineAccuracy * 0.9, // Slightly lower confidence than accuracy
      relevanceScore: baselineAccuracy,
      learningContributions: [],
      processingTime
    };
  }

  /**
   * Get current session patterns
   */
  async getSessionPatterns(sessionId: string): Promise<DiscoveredPattern[]> {
    const session = this.activeSessions.get(sessionId);
    return session?.patternsLearned || [];
  }

  /**
   * Get learning confirmation for user feedback
   */
  async getLearningConfirmation(sessionId: string): Promise<LearningConfirmation> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      acknowledged: true,
      patternsUpdated: session.patternsLearned.length,
      accuracyImpact: session.currentAccuracy - session.baselineAccuracy,
      nextProfilePredictions: {
        expectedImprovement: 0.1,
        confidenceLevel: 0.85
      }
    };
  }

  /**
   * Calculate confidence-accuracy correlation for pattern validation
   */
  async calculateConfidenceAccuracyCorrelation(
    patterns: DiscoveredPattern[],
    validationProfiles: any[]
  ): Promise<number> {
    if (patterns.length === 0 || validationProfiles.length === 0) {
      return 0;
    }

    const correlationData: Array<{ confidence: number; accuracy: number }> = [];

    for (const profile of validationProfiles) {
      const applicablePatterns = patterns.filter(pattern => 
        this.isPatternApplicable(pattern, profile)
      );

      if (applicablePatterns.length > 0) {
        const avgConfidence = applicablePatterns.reduce(
          (sum, p) => sum + p.confidence, 0
        ) / applicablePatterns.length;

        const accuracy = await this.validatePatternAccuracy(applicablePatterns, profile);
        
        correlationData.push({ confidence: avgConfidence, accuracy });
      }
    }

    return this.calculatePearsonCorrelation(correlationData);
  }

  /**
   * Cleanup test sessions and data
   */
  async cleanup(): Promise<void> {
    this.activeSessions.clear();
    this.mockDatabase.clear();
  }

  // Private helper methods

  private async extractPatternsFromFeedback(
    feedback: string,
    profileData: any
  ): Promise<DiscoveredPattern[]> {
    const patterns: DiscoveredPattern[] = [];

    // Simulate pattern extraction based on feedback content
    if (feedback.toLowerCase().includes('technical') || feedback.toLowerCase().includes('engineering')) {
      patterns.push({
        id: uuidv4(),
        type: 'success_indicator',
        confidence: 0.85,
        evidence: [{ source: 'voice_feedback', content: feedback, profile: profileData.id }],
        lastUpdated: new Date()
      });
    }

    if (feedback.toLowerCase().includes('saas') || feedback.toLowerCase().includes('software')) {
      patterns.push({
        id: uuidv4(),
        type: 'industry_signal',
        confidence: 0.78,
        evidence: [{ source: 'voice_feedback', content: feedback, profile: profileData.id }],
        lastUpdated: new Date()
      });
    }

    if (feedback.toLowerCase().includes('experience') || feedback.toLowerCase().includes('background')) {
      patterns.push({
        id: uuidv4(),
        type: 'user_preference',
        confidence: 0.72,
        evidence: [{ source: 'voice_feedback', content: feedback, profile: profileData.id }],
        lastUpdated: new Date()
      });
    }

    // Simulate pattern quality based on feedback quality
    const feedbackQuality = this.assessFeedbackQuality(feedback);
    patterns.forEach(pattern => {
      pattern.confidence *= feedbackQuality;
    });

    return patterns;
  }

  private assessFeedbackQuality(feedback: string): number {
    // Simple quality assessment based on feedback characteristics
    let quality = 0.5; // Base quality

    // Length indicates thoughtfulness
    if (feedback.length > 20) quality += 0.2;
    if (feedback.length > 50) quality += 0.1;

    // Specific keywords indicate relevant feedback
    const qualityKeywords = [
      'experience', 'background', 'skills', 'industry', 'role',
      'technical', 'leadership', 'results', 'achievement'
    ];
    
    const keywordMatches = qualityKeywords.filter(keyword => 
      feedback.toLowerCase().includes(keyword)
    ).length;
    
    quality += Math.min(0.3, keywordMatches * 0.1);

    return Math.min(1.0, quality);
  }

  private calculateConfidenceImpact(patterns: DiscoveredPattern[]): number {
    if (patterns.length === 0) return 0;

    const totalConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0);
    const avgConfidence = totalConfidence / patterns.length;
    
    // Impact is proportional to pattern confidence and count
    return Math.min(0.15, avgConfidence * patterns.length * 0.05);
  }

  private calculateLearningValue(patterns: DiscoveredPattern[]): number {
    if (patterns.length === 0) return 0;

    return patterns.reduce((sum, pattern) => {
      let value = pattern.confidence;
      
      // Higher value for diverse pattern types
      if (pattern.type === 'success_indicator') value *= 1.2;
      if (pattern.type === 'industry_signal') value *= 1.1;
      
      return sum + value;
    }, 0) / patterns.length;
  }

  private async applyLearnedPatterns(
    patterns: DiscoveredPattern[],
    profileData: any
  ): Promise<PatternContribution[]> {
    const contributions: PatternContribution[] = [];

    for (const pattern of patterns) {
      if (this.isPatternApplicable(pattern, profileData)) {
        const impact = this.calculatePatternImpact(pattern, profileData);
        
        contributions.push({
          patternId: pattern.id,
          patternType: pattern.type,
          impact,
          confidence: pattern.confidence
        });
      }
    }

    return contributions;
  }

  private isPatternApplicable(pattern: DiscoveredPattern, profileData: any): boolean {
    // Simulate pattern applicability logic
    switch (pattern.type) {
      case 'industry_signal':
        return profileData.industry?.toLowerCase().includes('software') ||
               profileData.industry?.toLowerCase().includes('tech');
      
      case 'success_indicator':
        return profileData.experience?.includes('Senior') ||
               profileData.experience?.includes('Lead') ||
               profileData.experience?.includes('VP');
      
      case 'user_preference':
        return true; // User preferences generally apply
      
      default:
        return Math.random() > 0.5; // 50% applicability for unknown types
    }
  }

  private calculatePatternImpact(pattern: DiscoveredPattern, profileData: any): number {
    // Base impact from pattern confidence
    let impact = pattern.confidence * 0.1; // Max 10% improvement per pattern

    // Adjust based on pattern type relevance
    switch (pattern.type) {
      case 'success_indicator':
        if (profileData.signals?.includes('leadership')) impact *= 1.3;
        break;
      case 'industry_signal':
        if (profileData.industry === 'Software') impact *= 1.2;
        break;
      case 'user_preference':
        impact *= 1.1; // Slight boost for user preferences
        break;
    }

    return Math.min(0.15, impact); // Cap at 15% improvement per pattern
  }

  private calculateBaselineAccuracy(profileData: any): number {
    // Simulate baseline accuracy calculation
    let accuracy = 0.72; // Default baseline

    // Adjust based on profile quality indicators
    if (profileData.experience?.includes('Senior')) accuracy += 0.05;
    if (profileData.industry === 'Software') accuracy += 0.03;
    if (profileData.signals?.length > 2) accuracy += 0.02;

    // Add some randomness to simulate real-world variation
    accuracy += (Math.random() - 0.5) * 0.1;

    return Math.max(0.5, Math.min(0.9, accuracy));
  }

  private async validatePatternAccuracy(
    patterns: DiscoveredPattern[],
    profile: any
  ): Promise<number> {
    // Simulate pattern validation against known good outcomes
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    
    // Add some noise to simulate real-world validation
    const noise = (Math.random() - 0.5) * 0.2;
    return Math.max(0.1, Math.min(0.95, avgConfidence + noise));
  }

  private calculatePearsonCorrelation(
    data: Array<{ confidence: number; accuracy: number }>
  ): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.confidence, 0);
    const sumY = data.reduce((sum, d) => sum + d.accuracy, 0);
    const sumXY = data.reduce((sum, d) => sum + d.confidence * d.accuracy, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.confidence * d.confidence, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.accuracy * d.accuracy, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Utility methods for test helpers
  calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  calculatePooledStandardDeviation(group1: number[], group2: number[]): number {
    const n1 = group1.length;
    const n2 = group2.length;
    
    const var1 = this.calculateVariance(group1);
    const var2 = this.calculateVariance(group2);
    
    const pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    
    return Math.sqrt(pooledVariance);
  }
}