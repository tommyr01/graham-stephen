import { 
  TeamLearningProfile,
  UserPreferenceProfile,
  EnhancedUserFeedback,
  LearningPipelineRun 
} from './types';
import {
  getTeamLearningProfile,
  createOrUpdateTeamLearningProfile,
  getUserPreferenceProfile,
  createOrUpdateUserPreferences,
  getEnhancedFeedbackByUser
} from './feedback-database';
import { learningPipeline } from './learning-pipeline';

/**
 * Team-Based Learning Algorithms Service
 * Handles collaborative learning across team members
 */
export class TeamLearningService {
  private static instance: TeamLearningService;

  private constructor() {}

  static getInstance(): TeamLearningService {
    if (!TeamLearningService.instance) {
      TeamLearningService.instance = new TeamLearningService();
    }
    return TeamLearningService.instance;
  }

  /**
   * Aggregate team learning from all team members
   */
  async aggregateTeamLearning(
    teamId: string,
    options: {
      aggregationStrategy?: 'consensus' | 'weighted' | 'expertise';
      conflictResolution?: 'majority' | 'confidence' | 'experience';
      minMembersForConsensus?: number;
    } = {}
  ): Promise<TeamLearningProfile> {
    const {
      aggregationStrategy = 'consensus',
      conflictResolution = 'confidence',
      minMembersForConsensus = 3
    } = options;

    // Get all team members and their feedback
    const teamMembers = await this.getTeamMembers(teamId);
    const teamFeedback = await this.collectTeamFeedback(teamMembers);
    
    if (teamMembers.length < 2) {
      throw new Error('Team must have at least 2 members for team learning');
    }

    // Analyze individual learning patterns
    const individualPatterns = await this.analyzeIndividualPatterns(teamMembers, teamFeedback);
    
    // Detect expertise areas for each team member
    const expertiseAreas = await this.detectExpertiseAreas(teamMembers, individualPatterns);
    
    // Find consensus patterns across team members
    const consensusPatterns = await this.findConsensusPatterns(
      individualPatterns,
      aggregationStrategy,
      minMembersForConsensus
    );
    
    // Identify diverse perspectives and healthy disagreements
    const diversePerspectives = await this.identifyDiversePerspectives(
      individualPatterns,
      consensusPatterns
    );
    
    // Perform quality analysis and outlier detection
    const qualityAnalysis = await this.performQualityAnalysis(teamFeedback, individualPatterns);
    
    // Calculate team performance metrics
    const performanceMetrics = await this.calculateTeamPerformance(
      teamMembers,
      individualPatterns,
      consensusPatterns
    );
    
    // Create or update team learning profile
    const teamProfile = await createOrUpdateTeamLearningProfile(teamId, {
      teamSize: teamMembers.length,
      activeMembers: teamMembers.filter(member => member.recentFeedbackCount > 0).length,
      collectivePreferences: consensusPatterns,
      consensusPatterns,
      diversePerspectives,
      teamAccuracy: performanceMetrics.teamAccuracy,
      individualVsTeamBenefit: performanceMetrics.teamBenefit,
      knowledgeTransferRate: performanceMetrics.knowledgeTransferRate,
      outlierDetection: qualityAnalysis.outlierDetection,
      qualityScores: qualityAnalysis.qualityScores,
      feedbackDistribution: qualityAnalysis.feedbackDistribution,
      expertiseAreas,
      modelVersion: '2.0',
    });

    return teamProfile;
  }

  /**
   * Apply team insights to improve individual member preferences
   */
  async applyTeamInsightsToMembers(
    teamId: string,
    teamProfile: TeamLearningProfile,
    options: {
      blendingStrategy?: 'conservative' | 'balanced' | 'aggressive';
      respectIndividualPreferences?: boolean;
      minTeamConfidence?: number;
    } = {}
  ): Promise<void> {
    const {
      blendingStrategy = 'balanced',
      respectIndividualPreferences = true,
      minTeamConfidence = 0.6
    } = options;

    const teamMembers = await this.getTeamMembers(teamId);
    
    for (const member of teamMembers) {
      const individualProfile = await getUserPreferenceProfile(member.userId, teamId);
      
      if (individualProfile) {
        const enhancedProfile = await this.enhanceIndividualWithTeamLearning(
          individualProfile,
          teamProfile,
          member,
          {
            blendingStrategy,
            respectIndividualPreferences,
            minTeamConfidence
          }
        );
        
        await createOrUpdateUserPreferences(member.userId, teamId, enhancedProfile);
      }
    }
  }

  /**
   * Detect knowledge gaps in team learning
   */
  async detectKnowledgeGaps(teamId: string): Promise<{
    underrepresentedAreas: Array<{
      area: string;
      coverage: number; // 0-1
      importance: number; // 0-1
      recommendation: string;
    }>;
    expertiseImbalances: Array<{
      area: string;
      experts: string[]; // user IDs
      novices: string[]; // user IDs
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    learningOpportunities: Array<{
      opportunity: string;
      beneficiaries: string[]; // user IDs
      priority: 'low' | 'medium' | 'high';
    }>;
  }> {
    const teamProfile = await getTeamLearningProfile(teamId);
    const teamMembers = await this.getTeamMembers(teamId);
    
    if (!teamProfile) {
      throw new Error('Team learning profile not found');
    }

    const gaps = {
      underrepresentedAreas: [] as any[],
      expertiseImbalances: [] as any[],
      learningOpportunities: [] as any[],
    };

    // Analyze coverage of different areas
    const areaCoverage = await this.analyzeAreaCoverage(teamMembers, teamProfile);
    
    // Identify underrepresented areas
    Object.entries(areaCoverage).forEach(([area, coverage]) => {
      if (coverage.coverageScore < 0.5) {
        gaps.underrepresentedAreas.push({
          area,
          coverage: coverage.coverageScore,
          importance: coverage.importance,
          recommendation: this.generateCoverageRecommendation(area, coverage),
        });
      }
    });

    // Detect expertise imbalances
    Object.entries(teamProfile.expertiseAreas).forEach(([area, experts]) => {
      const expertCount = experts.length;
      const noviceCount = teamMembers.length - expertCount;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (expertCount === 1 && teamMembers.length > 3) {
        riskLevel = 'high'; // Single point of failure
      } else if (expertCount < teamMembers.length * 0.3) {
        riskLevel = 'medium'; // Too few experts
      }

      if (riskLevel !== 'low') {
        gaps.expertiseImbalances.push({
          area,
          experts,
          novices: teamMembers
            .filter(member => !experts.includes(member.userId))
            .map(member => member.userId),
          riskLevel,
        });
      }
    });

    // Identify learning opportunities
    gaps.learningOpportunities = await this.identifyLearningOpportunities(
      teamMembers,
      teamProfile,
      gaps
    );

    return gaps;
  }

  /**
   * Calculate team collaboration effectiveness
   */
  async calculateCollaborationEffectiveness(teamId: string): Promise<{
    overallScore: number; // 0-100
    metrics: {
      feedbackConsistency: number;
      knowledgeSharing: number;
      diversityValue: number;
      consensusQuality: number;
      learningVelocity: number;
    };
    recommendations: string[];
    strengths: string[];
    improvements: string[];
  }> {
    const teamProfile = await getTeamLearningProfile(teamId);
    const teamMembers = await this.getTeamMembers(teamId);
    
    if (!teamProfile) {
      throw new Error('Team learning profile not found');
    }

    const effectiveness = {
      overallScore: 0,
      metrics: {
        feedbackConsistency: 0,
        knowledgeSharing: 0,
        diversityValue: 0,
        consensusQuality: 0,
        learningVelocity: 0,
      },
      recommendations: [] as string[],
      strengths: [] as string[],
      improvements: [] as string[],
    };

    // Calculate feedback consistency
    effectiveness.metrics.feedbackConsistency = await this.calculateFeedbackConsistency(
      teamMembers,
      teamProfile
    );

    // Calculate knowledge sharing effectiveness
    effectiveness.metrics.knowledgeSharing = this.calculateKnowledgeSharing(teamProfile);

    // Calculate diversity value
    effectiveness.metrics.diversityValue = this.calculateDiversityValue(teamProfile);

    // Calculate consensus quality
    effectiveness.metrics.consensusQuality = this.calculateConsensusQuality(teamProfile);

    // Calculate learning velocity
    effectiveness.metrics.learningVelocity = await this.calculateLearningVelocity(teamMembers);

    // Calculate overall score
    effectiveness.overallScore = Object.values(effectiveness.metrics)
      .reduce((sum, score) => sum + score, 0) / Object.keys(effectiveness.metrics).length;

    // Generate insights
    effectiveness.strengths = this.identifyStrengths(effectiveness.metrics);
    effectiveness.improvements = this.identifyImprovements(effectiveness.metrics);
    effectiveness.recommendations = this.generateCollaborationRecommendations(
      effectiveness.metrics,
      teamProfile
    );

    return effectiveness;
  }

  /**
   * Optimize team composition for learning effectiveness
   */
  async optimizeTeamComposition(
    currentTeamId: string,
    candidateUsers: string[],
    targetSize: number
  ): Promise<{
    recommendedTeam: Array<{
      userId: string;
      role: 'expert' | 'contributor' | 'learner';
      expertiseAreas: string[];
      expectedContribution: number;
    }>;
    expectedImprovement: {
      accuracyGain: number;
      diversityGain: number;
      collaborationGain: number;
    };
    reasoning: string[];
  }> {
    const currentTeam = await this.getTeamMembers(currentTeamId);
    const currentProfile = await getTeamLearningProfile(currentTeamId);
    
    // Analyze candidate users
    const candidateAnalysis = await Promise.all(
      candidateUsers.map(async (userId) => {
        const userProfile = await getUserPreferenceProfile(userId);
        const userFeedback = await getEnhancedFeedbackByUser(userId, { limit: 100 });
        
        return {
          userId,
          profile: userProfile,
          feedbackCount: userFeedback.length,
          averageRating: userFeedback
            .filter(fb => fb.overallRating)
            .reduce((sum, fb) => sum + fb.overallRating!, 0) / 
            userFeedback.filter(fb => fb.overallRating).length || 0,
          expertiseAreas: this.identifyUserExpertise(userProfile, userFeedback),
          collaborationPotential: this.calculateCollaborationPotential(
            userProfile,
            currentProfile
          ),
        };
      })
    );

    // Optimize team composition using collaborative filtering approach
    const optimization = await this.optimizeComposition(
      currentTeam,
      candidateAnalysis,
      targetSize,
      currentProfile
    );

    return optimization;
  }

  // Private helper methods

  private async getTeamMembers(teamId: string): Promise<Array<{
    userId: string;
    profile: UserPreferenceProfile | null;
    recentFeedbackCount: number;
  }>> {
    // In a real implementation, this would query the database for team members
    // For now, we'll use a placeholder approach
    const teamProfile = await getTeamLearningProfile(teamId);
    
    if (!teamProfile || !teamProfile.feedbackDistribution) {
      return [];
    }

    const members = await Promise.all(
      Object.keys(teamProfile.feedbackDistribution).map(async (userId) => {
        const profile = await getUserPreferenceProfile(userId, teamId);
        const recentFeedback = await getEnhancedFeedbackByUser(userId, {
          limit: 20,
        });
        
        return {
          userId,
          profile,
          recentFeedbackCount: recentFeedback.filter(fb => 
            new Date(fb.submittedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
        };
      })
    );

    return members.filter(member => member.profile !== null);
  }

  private async collectTeamFeedback(
    teamMembers: Array<{ userId: string; profile: UserPreferenceProfile | null }>
  ): Promise<Map<string, EnhancedUserFeedback[]>> {
    const teamFeedback = new Map<string, EnhancedUserFeedback[]>();

    for (const member of teamMembers) {
      const feedback = await getEnhancedFeedbackByUser(member.userId, {
        limit: 100,
        feedbackStatus: 'processed',
      });
      teamFeedback.set(member.userId, feedback);
    }

    return teamFeedback;
  }

  private async analyzeIndividualPatterns(
    teamMembers: Array<{ userId: string; profile: UserPreferenceProfile | null }>,
    teamFeedback: Map<string, EnhancedUserFeedback[]>
  ): Promise<Map<string, any>> {
    const patterns = new Map<string, any>();

    for (const member of teamMembers) {
      if (!member.profile) continue;

      const feedback = teamFeedback.get(member.userId) || [];
      
      const memberPattern = {
        industryPreferences: member.profile.industryWeights,
        rolePreferences: member.profile.rolePreferences,
        contentPreferences: member.profile.contentPreferences,
        successPatterns: member.profile.successPatterns,
        failurePatterns: member.profile.failurePatterns,
        learningConfidence: member.profile.learningConfidence,
        totalFeedback: feedback.length,
        recentAccuracy: member.profile.recentPerformance || 0,
        consistencyScore: this.calculateIndividualConsistency(feedback),
      };

      patterns.set(member.userId, memberPattern);
    }

    return patterns;
  }

  private async detectExpertiseAreas(
    teamMembers: Array<{ userId: string; profile: UserPreferenceProfile | null }>,
    individualPatterns: Map<string, any>
  ): Promise<{ [userId: string]: string[] }> {
    const expertiseAreas: { [userId: string]: string[] } = {};

    for (const member of teamMembers) {
      const pattern = individualPatterns.get(member.userId);
      if (!pattern) continue;

      const expertise: string[] = [];

      // Detect industry expertise
      Object.entries(pattern.industryPreferences).forEach(([industry, data]: [string, any]) => {
        if (data.sampleSize >= 10 && data.confidence > 0.8) {
          expertise.push(`industry_${industry}`);
        }
      });

      // Detect role expertise
      Object.entries(pattern.rolePreferences).forEach(([role, data]: [string, any]) => {
        if (data.totalSamples >= 5 && data.positiveRate > 0.7) {
          expertise.push(`role_${role}`);
        }
      });

      // Detect content expertise
      Object.entries(pattern.contentPreferences).forEach(([content, weight]: [string, any]) => {
        if (Math.abs(weight) > 0.5) {
          expertise.push(`content_${content}`);
        }
      });

      // High accuracy indicates general expertise
      if (pattern.recentAccuracy > 80) {
        expertise.push('general_accuracy');
      }

      expertiseAreas[member.userId] = expertise;
    }

    return expertiseAreas;
  }

  private async findConsensusPatterns(
    individualPatterns: Map<string, any>,
    strategy: 'consensus' | 'weighted' | 'expertise',
    minMembers: number
  ): Promise<any> {
    const consensus = {
      industries: {} as any,
      roles: {} as any,
      content: {} as any,
      successFactors: [] as string[],
      failureFactors: [] as string[],
    };

    const members = Array.from(individualPatterns.keys());
    
    if (members.length < minMembers) {
      return consensus;
    }

    // Find industry consensus
    const allIndustries = new Set<string>();
    members.forEach(memberId => {
      const pattern = individualPatterns.get(memberId)!;
      Object.keys(pattern.industryPreferences || {}).forEach(industry => 
        allIndustries.add(industry)
      );
    });

    for (const industry of allIndustries) {
      const memberPrefs = members
        .map(memberId => {
          const pattern = individualPatterns.get(memberId)!;
          return pattern.industryPreferences?.[industry];
        })
        .filter(pref => pref && pref.sampleSize >= 3);

      if (memberPrefs.length >= Math.ceil(members.length * 0.6)) {
        // At least 60% of members have experience with this industry
        const weights = memberPrefs.map(pref => pref.weight);
        const confidences = memberPrefs.map(pref => pref.confidence);
        
        consensus.industries[industry] = {
          consensusWeight: this.calculateWeightedAverage(weights, confidences),
          memberCount: memberPrefs.length,
          confidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
          variance: this.calculateVariance(weights),
        };
      }
    }

    // Similar logic for roles and content
    consensus.roles = this.findRoleConsensus(individualPatterns, members);
    consensus.content = this.findContentConsensus(individualPatterns, members);

    // Find common success and failure patterns
    const allSuccessFactors = new Map<string, number>();
    const allFailureFactors = new Map<string, number>();

    members.forEach(memberId => {
      const pattern = individualPatterns.get(memberId)!;
      
      (pattern.successPatterns?.keyIndicators || []).forEach((factor: string) => {
        allSuccessFactors.set(factor, (allSuccessFactors.get(factor) || 0) + 1);
      });
      
      (pattern.failurePatterns?.warningSignals || []).forEach((factor: string) => {
        allFailureFactors.set(factor, (allFailureFactors.get(factor) || 0) + 1);
      });
    });

    // Include factors mentioned by at least 50% of team
    const threshold = Math.ceil(members.length * 0.5);
    consensus.successFactors = Array.from(allSuccessFactors.entries())
      .filter(([, count]) => count >= threshold)
      .map(([factor]) => factor);

    consensus.failureFactors = Array.from(allFailureFactors.entries())
      .filter(([, count]) => count >= threshold)
      .map(([factor]) => factor);

    return consensus;
  }

  private async identifyDiversePerspectives(
    individualPatterns: Map<string, any>,
    consensusPatterns: any
  ): Promise<any> {
    const diverse = {
      industryDisagreements: [] as any[],
      roleDisagreements: [] as any[],
      contentDivergence: [] as any[],
      minorityInsights: [] as any[],
    };

    const members = Array.from(individualPatterns.keys());

    // Find industry disagreements
    Object.entries(consensusPatterns.industries).forEach(([industry, consensus]: [string, any]) => {
      const memberWeights = members
        .map(memberId => {
          const pattern = individualPatterns.get(memberId)!;
          return pattern.industryPreferences?.[industry]?.weight;
        })
        .filter(weight => weight !== undefined);

      if (consensus.variance > 0.2) {
        // Significant disagreement
        diverse.industryDisagreements.push({
          industry,
          consensus: consensus.consensusWeight,
          variance: consensus.variance,
          perspectives: memberWeights,
        });
      }
    });

    return diverse;
  }

  private async performQualityAnalysis(
    teamFeedback: Map<string, EnhancedUserFeedback[]>,
    individualPatterns: Map<string, any>
  ): Promise<{
    outlierDetection: any;
    qualityScores: any;
    feedbackDistribution: any;
  }> {
    const analysis = {
      outlierDetection: {
        detectedOutliers: [] as string[],
        patterns: {} as any,
      },
      qualityScores: {
        overallQuality: 0,
        consistencyScore: 0,
        contributionBalance: 0,
      },
      feedbackDistribution: {} as any,
    };

    const members = Array.from(teamFeedback.keys());
    
    // Calculate feedback distribution
    members.forEach(memberId => {
      const feedback = teamFeedback.get(memberId) || [];
      const avgRating = feedback
        .filter(fb => fb.overallRating)
        .reduce((sum, fb) => sum + fb.overallRating!, 0) / 
        feedback.filter(fb => fb.overallRating).length || 0;

      analysis.feedbackDistribution[memberId] = {
        count: feedback.length,
        quality: this.assessFeedbackQuality(feedback),
        lastContribution: feedback[0]?.submittedAt || new Date().toISOString(),
        averageRating: avgRating,
      };
    });

    // Detect outliers
    const avgTeamRating = Object.values(analysis.feedbackDistribution)
      .map((dist: any) => dist.averageRating)
      .filter(rating => !isNaN(rating))
      .reduce((a, b) => a + b, 0) / members.length || 0;

    Object.entries(analysis.feedbackDistribution).forEach(([memberId, dist]: [string, any]) => {
      if (Math.abs(dist.averageRating - avgTeamRating) > 2) {
        analysis.outlierDetection.detectedOutliers.push(memberId);
      }
    });

    // Calculate quality scores
    const contributions = Object.values(analysis.feedbackDistribution)
      .map((dist: any) => dist.count);
    const avgContribution = contributions.reduce((a, b) => a + b, 0) / contributions.length;
    const variance = this.calculateVariance(contributions);
    
    analysis.qualityScores.contributionBalance = Math.max(0, 100 - (variance / avgContribution) * 10);
    analysis.qualityScores.consistencyScore = Math.max(0, 100 - 
      this.calculateVariance(Object.values(analysis.feedbackDistribution)
        .map((dist: any) => dist.averageRating)
        .filter(rating => !isNaN(rating))) * 5
    );
    analysis.qualityScores.overallQuality = 
      (analysis.qualityScores.contributionBalance + analysis.qualityScores.consistencyScore) / 2;

    return analysis;
  }

  private async calculateTeamPerformance(
    teamMembers: Array<{ userId: string; profile: UserPreferenceProfile | null }>,
    individualPatterns: Map<string, any>,
    consensusPatterns: any
  ): Promise<{
    teamAccuracy: number;
    teamBenefit: number;
    knowledgeTransferRate: number;
  }> {
    const performance = {
      teamAccuracy: 0,
      teamBenefit: 0,
      knowledgeTransferRate: 0,
    };

    // Calculate team accuracy as weighted average of individual accuracies
    const accuracies = Array.from(individualPatterns.values())
      .map(pattern => pattern.recentAccuracy)
      .filter(acc => acc > 0);

    if (accuracies.length > 0) {
      performance.teamAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    }

    // Calculate team benefit (improvement from collaboration)
    const individualAvg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length || 0;
    const teamConsensusBonus = Math.min(10, Object.keys(consensusPatterns.industries).length * 2);
    performance.teamBenefit = teamConsensusBonus;

    // Calculate knowledge transfer rate (how quickly new members improve)
    const newMembers = teamMembers.filter(member => 
      member.profile && member.profile.totalFeedbackCount < 20
    );
    
    if (newMembers.length > 0) {
      const newMemberAccuracies = newMembers
        .map(member => member.profile?.recentPerformance || 0)
        .filter(acc => acc > 0);
      
      if (newMemberAccuracies.length > 0) {
        const newMemberAvg = newMemberAccuracies.reduce((a, b) => a + b, 0) / newMemberAccuracies.length;
        performance.knowledgeTransferRate = Math.max(0, newMemberAvg - 50); // 50% baseline
      }
    }

    return performance;
  }

  private async enhanceIndividualWithTeamLearning(
    individualProfile: UserPreferenceProfile,
    teamProfile: TeamLearningProfile,
    member: any,
    options: any
  ): Promise<Partial<UserPreferenceProfile>> {
    const enhancement: Partial<UserPreferenceProfile> = {};
    
    const blendFactor = this.getBlendFactor(options.blendingStrategy, individualProfile.learningConfidence);

    // Enhanced industry weights with team consensus
    const enhancedIndustryWeights = { ...individualProfile.industryWeights };
    
    if (teamProfile.consensusPatterns?.industries) {
      Object.entries(teamProfile.consensusPatterns.industries).forEach(([industry, teamData]: [string, any]) => {
        const individualData = enhancedIndustryWeights[industry];
        
        if (teamData.confidence >= options.minTeamConfidence) {
          if (individualData && options.respectIndividualPreferences) {
            // Blend individual and team preferences
            enhancedIndustryWeights[industry] = {
              ...individualData,
              weight: individualData.weight * (1 - blendFactor) + teamData.consensusWeight * blendFactor,
              confidence: Math.max(individualData.confidence, teamData.confidence * 0.8),
              sampleSize: individualData.sampleSize,
              lastUpdated: new Date().toISOString(),
            };
          } else if (!individualData) {
            // Adopt team consensus for new areas
            enhancedIndustryWeights[industry] = {
              weight: teamData.consensusWeight * 0.7, // Conservative adoption
              confidence: teamData.confidence * 0.6,
              sampleSize: 1,
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      });
    }

    enhancement.industryWeights = enhancedIndustryWeights;

    // Enhanced success patterns with team insights
    const teamSuccessFactors = teamProfile.consensusPatterns?.successFactors || [];
    const individualSuccessFactors = individualProfile.successPatterns.keyIndicators || [];
    
    const combinedSuccessFactors = [
      ...individualSuccessFactors,
      ...teamSuccessFactors.filter((factor: string) => 
        !individualSuccessFactors.includes(factor)
      ).slice(0, 3) // Add up to 3 team factors
    ];

    enhancement.successPatterns = {
      ...individualProfile.successPatterns,
      keyIndicators: combinedSuccessFactors.slice(0, 10), // Limit total
    };

    return enhancement;
  }

  private getBlendFactor(strategy: string, individualConfidence: number): number {
    switch (strategy) {
      case 'conservative':
        return Math.min(0.2, individualConfidence * 0.3);
      case 'aggressive':
        return Math.min(0.5, (1 - individualConfidence) * 0.7);
      case 'balanced':
      default:
        return Math.min(0.35, 0.5 - individualConfidence * 0.3);
    }
  }

  // Additional helper methods for various calculations

  private calculateIndividualConsistency(feedback: EnhancedUserFeedback[]): number {
    if (feedback.length < 5) return 0;

    const ratings = feedback
      .filter(fb => fb.overallRating)
      .map(fb => fb.overallRating!);

    if (ratings.length < 3) return 0;

    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / ratings.length;
    
    return Math.max(0, 100 - variance * 5); // Lower variance = higher consistency
  }

  private calculateWeightedAverage(values: number[], weights: number[]): number {
    if (values.length === 0) return 0;
    
    const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private findRoleConsensus(individualPatterns: Map<string, any>, members: string[]): any {
    // Similar to industry consensus logic
    const roleConsensus: any = {};
    
    const allRoles = new Set<string>();
    members.forEach(memberId => {
      const pattern = individualPatterns.get(memberId)!;
      Object.keys(pattern.rolePreferences || {}).forEach(role => allRoles.add(role));
    });

    for (const role of allRoles) {
      const memberPrefs = members
        .map(memberId => {
          const pattern = individualPatterns.get(memberId)!;
          return pattern.rolePreferences?.[role];
        })
        .filter(pref => pref && pref.totalSamples >= 3);

      if (memberPrefs.length >= Math.ceil(members.length * 0.5)) {
        const positiveRates = memberPrefs.map(pref => pref.positiveRate);
        
        roleConsensus[role] = {
          consensusRate: positiveRates.reduce((a, b) => a + b, 0) / positiveRates.length,
          memberCount: memberPrefs.length,
          confidence: memberPrefs.reduce((sum, pref) => sum + pref.totalSamples, 0) / 
                      (memberPrefs.length * 10), // Normalize
          variance: this.calculateVariance(positiveRates),
        };
      }
    }

    return roleConsensus;
  }

  private findContentConsensus(individualPatterns: Map<string, any>, members: string[]): any {
    // Similar consensus logic for content preferences
    const contentConsensus: any = {};
    
    const allContent = new Set<string>();
    members.forEach(memberId => {
      const pattern = individualPatterns.get(memberId)!;
      Object.keys(pattern.contentPreferences || {}).forEach(content => allContent.add(content));
    });

    for (const content of allContent) {
      const memberPrefs = members
        .map(memberId => {
          const pattern = individualPatterns.get(memberId)!;
          return pattern.contentPreferences?.[content];
        })
        .filter(pref => pref !== undefined && Math.abs(pref) > 0.1);

      if (memberPrefs.length >= Math.ceil(members.length * 0.4)) {
        contentConsensus[content] = {
          consensusWeight: memberPrefs.reduce((a, b) => a + b, 0) / memberPrefs.length,
          memberCount: memberPrefs.length,
          variance: this.calculateVariance(memberPrefs),
        };
      }
    }

    return contentConsensus;
  }

  private assessFeedbackQuality(feedback: EnhancedUserFeedback[]): number {
    let qualityScore = 0;
    let factors = 0;

    // Has detailed ratings
    const detailedCount = feedback.filter(fb => fb.factorRatings && 
      Object.keys(fb.factorRatings).length > 0).length;
    if (detailedCount > 0) {
      qualityScore += (detailedCount / feedback.length) * 30;
      factors++;
    }

    // Has text feedback
    const textCount = feedback.filter(fb => fb.feedbackText && fb.feedbackText.length > 10).length;
    if (textCount > 0) {
      qualityScore += (textCount / feedback.length) * 25;
      factors++;
    }

    // Consistent ratings
    const ratings = feedback.filter(fb => fb.overallRating).map(fb => fb.overallRating!);
    if (ratings.length >= 5) {
      const consistency = Math.max(0, 100 - this.calculateVariance(ratings) * 10);
      qualityScore += consistency * 0.2;
      factors++;
    }

    // Has improvement suggestions
    const suggestionsCount = feedback.filter(fb => fb.improvementSuggestions && 
      fb.improvementSuggestions.length > 0).length;
    if (suggestionsCount > 0) {
      qualityScore += (suggestionsCount / feedback.length) * 15;
      factors++;
    }

    // Confidence scores provided
    const confidenceCount = feedback.filter(fb => fb.confidenceScore !== undefined).length;
    if (confidenceCount > 0) {
      qualityScore += (confidenceCount / feedback.length) * 10;
      factors++;
    }

    return factors > 0 ? qualityScore / factors : 0;
  }

  // Placeholder implementations for remaining methods would continue here
  // Due to length constraints, I'm including the essential structure

  private async analyzeAreaCoverage(teamMembers: any[], teamProfile: TeamLearningProfile): Promise<any> {
    return {}; // Placeholder
  }

  private generateCoverageRecommendation(area: string, coverage: any): string {
    return `Increase team expertise in ${area}`;
  }

  private async identifyLearningOpportunities(teamMembers: any[], teamProfile: TeamLearningProfile, gaps: any): Promise<any[]> {
    return []; // Placeholder
  }

  private async calculateFeedbackConsistency(teamMembers: any[], teamProfile: TeamLearningProfile): Promise<number> {
    return 75; // Placeholder
  }

  private calculateKnowledgeSharing(teamProfile: TeamLearningProfile): number {
    return 80; // Placeholder
  }

  private calculateDiversityValue(teamProfile: TeamLearningProfile): number {
    return 70; // Placeholder
  }

  private calculateConsensusQuality(teamProfile: TeamLearningProfile): number {
    return 85; // Placeholder
  }

  private async calculateLearningVelocity(teamMembers: any[]): Promise<number> {
    return 65; // Placeholder
  }

  private identifyStrengths(metrics: any): string[] {
    const strengths: string[] = [];
    Object.entries(metrics).forEach(([metric, score]: [string, any]) => {
      if (score > 80) {
        strengths.push(`Strong ${metric.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });
    return strengths;
  }

  private identifyImprovements(metrics: any): string[] {
    const improvements: string[] = [];
    Object.entries(metrics).forEach(([metric, score]: [string, any]) => {
      if (score < 60) {
        improvements.push(`Improve ${metric.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });
    return improvements;
  }

  private generateCollaborationRecommendations(metrics: any, teamProfile: TeamLearningProfile): string[] {
    const recommendations: string[] = [];
    
    if (metrics.feedbackConsistency < 70) {
      recommendations.push('Establish feedback guidelines to improve consistency');
    }
    
    if (metrics.knowledgeSharing < 60) {
      recommendations.push('Implement regular knowledge sharing sessions');
    }
    
    if (metrics.diversityValue < 50) {
      recommendations.push('Encourage diverse perspectives in team discussions');
    }
    
    return recommendations;
  }

  private identifyUserExpertise(userProfile: UserPreferenceProfile | null, userFeedback: EnhancedUserFeedback[]): string[] {
    return []; // Placeholder
  }

  private calculateCollaborationPotential(userProfile: UserPreferenceProfile | null, currentProfile: TeamLearningProfile | null): number {
    return 0.5; // Placeholder
  }

  private async optimizeComposition(currentTeam: any[], candidates: any[], targetSize: number, currentProfile: TeamLearningProfile | null): Promise<any> {
    return {
      recommendedTeam: [],
      expectedImprovement: {
        accuracyGain: 0,
        diversityGain: 0,
        collaborationGain: 0,
      },
      reasoning: [],
    };
  }
}

// Export singleton instance
export const teamLearning = TeamLearningService.getInstance();