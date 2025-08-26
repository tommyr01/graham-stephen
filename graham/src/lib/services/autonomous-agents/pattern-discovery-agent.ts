/**
 * Pattern Discovery Agent - Autonomous AI agent for discovering new behavioral patterns
 * 
 * This agent continuously monitors user behavior and automatically discovers
 * new patterns without human intervention, improving the system's learning capabilities.
 */

import { supabase } from '@/lib/supabase';
import PatternDiscoveryEngine from '../pattern-discovery-engine';
import type { 
  PatternDiscoveryResult, 
  UserBehaviorData,
  APIResponse,
  AgentImprovement
} from '@/lib/types/intelligence';

interface PatternDiscoveryConfig {
  discovery_interval_hours: number;
  min_confidence_threshold: number;
  max_patterns_per_run: number;
  behavioral_lookback_days: number;
  auto_validation_threshold: number;
  improvement_tracking: boolean;
}

interface DiscoverySession {
  id: string;
  started_at: Date;
  completed_at: Date | null;
  patterns_discovered: number;
  patterns_validated: number;
  processing_time_ms: number;
  success_rate: number;
  agent_version: string;
}

const DEFAULT_CONFIG: PatternDiscoveryConfig = {
  discovery_interval_hours: 6,
  min_confidence_threshold: 0.65,
  max_patterns_per_run: 15,
  behavioral_lookback_days: 45,
  auto_validation_threshold: 0.85,
  improvement_tracking: true
};

export class PatternDiscoveryAgent {
  private config: PatternDiscoveryConfig;
  private discoveryEngine: PatternDiscoveryEngine;
  private agentVersion = '2.1.0';
  private isRunning = false;
  private lastRunTime: Date | null = null;

  constructor(config: Partial<PatternDiscoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.discoveryEngine = new PatternDiscoveryEngine({
      minConfidenceScore: this.config.min_confidence_threshold,
      lookbackDays: this.config.behavioral_lookback_days
    });
  }

  /**
   * Main autonomous discovery process
   */
  async runDiscoveryProcess(): Promise<{
    session: DiscoverySession;
    patterns: PatternDiscoveryResult[];
    improvements: AgentImprovement[];
    recommendations: string[];
  }> {
    if (this.isRunning) {
      throw new Error('Pattern discovery agent is already running');
    }

    this.isRunning = true;
    const sessionId = `discovery_${Date.now()}`;
    const startTime = Date.now();

    console.log(`🔍 Pattern Discovery Agent ${this.agentVersion} starting session ${sessionId}`);

    try {
      // Initialize discovery session
      const session: DiscoverySession = {
        id: sessionId,
        started_at: new Date(),
        completed_at: null,
        patterns_discovered: 0,
        patterns_validated: 0,
        processing_time_ms: 0,
        success_rate: 0,
        agent_version: this.agentVersion
      };

      // Run discovery across multiple dimensions
      const discoveredPatterns = await this.runComprehensiveDiscovery();
      
      // Filter and rank patterns by potential impact
      const rankedPatterns = await this.rankPatternsByImpact(discoveredPatterns);
      const topPatterns = rankedPatterns.slice(0, this.config.max_patterns_per_run);

      // Auto-validate high-confidence patterns
      const validatedPatterns = await this.autoValidateHighConfidencePatterns(topPatterns);

      // Generate agent improvements based on discoveries
      const improvements = await this.generateAgentImprovements(topPatterns, discoveredPatterns);

      // Generate recommendations for system optimization
      const recommendations = this.generateOptimizationRecommendations(topPatterns, validatedPatterns);

      // Complete session tracking
      const endTime = Date.now();
      session.completed_at = new Date();
      session.patterns_discovered = topPatterns.length;
      session.patterns_validated = validatedPatterns.length;
      session.processing_time_ms = endTime - startTime;
      session.success_rate = discoveredPatterns.length > 0 ? topPatterns.length / discoveredPatterns.length : 0;

      // Store session results
      await this.storeDiscoverySession(session, topPatterns);

      this.lastRunTime = new Date();
      console.log(`✅ Discovery session completed: ${topPatterns.length} patterns discovered, ${validatedPatterns.length} validated`);

      return {
        session,
        patterns: topPatterns,
        improvements,
        recommendations
      };

    } catch (error) {
      console.error('❌ Pattern Discovery Agent error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if autonomous discovery should run based on schedule and triggers
   */
  async shouldRunDiscovery(): Promise<{
    should_run: boolean;
    reason: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    estimated_patterns: number;
  }> {
    try {
      // Check time-based trigger
      if (this.lastRunTime) {
        const hoursSinceLastRun = (Date.now() - this.lastRunTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < this.config.discovery_interval_hours) {
          return {
            should_run: false,
            reason: `Last run was ${hoursSinceLastRun.toFixed(1)} hours ago, interval is ${this.config.discovery_interval_hours} hours`,
            priority: 'low',
            estimated_patterns: 0
          };
        }
      }

      // Check for new behavioral data volume
      const { data: recentSessions } = await supabase
        .from('research_session_intelligence')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: recentFeedback } = await supabase
        .from('feedback_interactions')
        .select('id')
        .eq('processed', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const newDataPoints = (recentSessions?.length || 0) + (recentFeedback?.length || 0);

      // Priority-based triggers
      if (newDataPoints > 100) {
        return {
          should_run: true,
          reason: `High volume of new data: ${newDataPoints} new data points`,
          priority: 'high',
          estimated_patterns: Math.floor(newDataPoints / 20)
        };
      }

      if (newDataPoints > 50) {
        return {
          should_run: true,
          reason: `Moderate new data volume: ${newDataPoints} data points`,
          priority: 'normal',
          estimated_patterns: Math.floor(newDataPoints / 25)
        };
      }

      if (newDataPoints > 20) {
        return {
          should_run: true,
          reason: `Regular discovery interval with ${newDataPoints} new data points`,
          priority: 'normal',
          estimated_patterns: Math.floor(newDataPoints / 30)
        };
      }

      return {
        should_run: false,
        reason: `Insufficient new data: only ${newDataPoints} new data points`,
        priority: 'low',
        estimated_patterns: 0
      };

    } catch (error) {
      console.error('Error checking discovery triggers:', error);
      return {
        should_run: false,
        reason: 'Error checking triggers',
        priority: 'low',
        estimated_patterns: 0
      };
    }
  }

  /**
   * Get agent performance metrics and health status
   */
  async getAgentMetrics(): Promise<{
    agent_version: string;
    last_run: Date | null;
    total_patterns_discovered: number;
    avg_discovery_time_ms: number;
    success_rate: number;
    health_status: 'excellent' | 'good' | 'degraded' | 'error';
    performance_trend: 'improving' | 'stable' | 'declining';
    next_scheduled_run: Date;
  }> {
    try {
      // Get recent discovery sessions
      const { data: sessions } = await supabase
        .from('agent_discovery_sessions')
        .select('*')
        .eq('agent_version', this.agentVersion)
        .order('started_at', { ascending: false })
        .limit(10);

      const totalPatterns = sessions?.reduce((sum, s) => sum + s.patterns_discovered, 0) || 0;
      const avgTime = sessions?.reduce((sum, s) => sum + s.processing_time_ms, 0) / (sessions?.length || 1) || 0;
      const avgSuccessRate = sessions?.reduce((sum, s) => sum + s.success_rate, 0) / (sessions?.length || 1) || 0;

      // Determine health status
      let healthStatus: 'excellent' | 'good' | 'degraded' | 'error' = 'good';
      if (avgSuccessRate > 0.8 && avgTime < 30000) healthStatus = 'excellent';
      else if (avgSuccessRate < 0.5 || avgTime > 60000) healthStatus = 'degraded';
      else if (sessions?.length === 0) healthStatus = 'error';

      // Determine performance trend
      let performanceTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (sessions && sessions.length >= 3) {
        const recent = sessions.slice(0, 3);
        const older = sessions.slice(3, 6);
        if (recent.length === 3 && older.length === 3) {
          const recentAvg = recent.reduce((sum, s) => sum + s.success_rate, 0) / 3;
          const olderAvg = older.reduce((sum, s) => sum + s.success_rate, 0) / 3;
          if (recentAvg > olderAvg + 0.1) performanceTrend = 'improving';
          else if (recentAvg < olderAvg - 0.1) performanceTrend = 'declining';
        }
      }

      const nextScheduledRun = this.lastRunTime 
        ? new Date(this.lastRunTime.getTime() + this.config.discovery_interval_hours * 60 * 60 * 1000)
        : new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now if never run

      return {
        agent_version: this.agentVersion,
        last_run: this.lastRunTime,
        total_patterns_discovered: totalPatterns,
        avg_discovery_time_ms: avgTime,
        success_rate: avgSuccessRate,
        health_status: healthStatus,
        performance_trend: performanceTrend,
        next_scheduled_run: nextScheduledRun
      };
    } catch (error) {
      console.error('Error getting agent metrics:', error);
      return {
        agent_version: this.agentVersion,
        last_run: null,
        total_patterns_discovered: 0,
        avg_discovery_time_ms: 0,
        success_rate: 0,
        health_status: 'error',
        performance_trend: 'declining',
        next_scheduled_run: new Date()
      };
    }
  }

  // Private methods

  private async runComprehensiveDiscovery(): Promise<PatternDiscoveryResult[]> {
    console.log('🔄 Running comprehensive pattern discovery...');

    try {
      // Run global pattern discovery
      const globalPatterns = await this.discoveryEngine.discoverPatterns();

      // Run user-specific pattern discovery for active users
      const { data: activeUsers } = await supabase
        .from('user_intelligence_profiles')
        .select('user_id')
        .gte('total_research_sessions', 5)
        .gte('last_pattern_update', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(20);

      const userPatterns: PatternDiscoveryResult[] = [];
      
      if (activeUsers && activeUsers.length > 0) {
        for (const user of activeUsers) {
          try {
            const patterns = await this.discoveryEngine.discoverPatterns(user.user_id);
            userPatterns.push(...patterns);
          } catch (error) {
            console.warn(`Failed to discover patterns for user ${user.user_id}:`, error);
          }
        }
      }

      // Run industry-specific and temporal pattern discovery
      const industryPatterns = await this.discoverIndustrySpecificPatterns();
      const temporalPatterns = await this.discoverTemporalPatterns();

      const allPatterns = [
        ...globalPatterns,
        ...userPatterns,
        ...industryPatterns,
        ...temporalPatterns
      ];

      console.log(`📊 Discovered ${allPatterns.length} total patterns across all dimensions`);
      return allPatterns;
    } catch (error) {
      console.error('Error in comprehensive discovery:', error);
      throw error;
    }
  }

  private async rankPatternsByImpact(patterns: PatternDiscoveryResult[]): Promise<PatternDiscoveryResult[]> {
    // Calculate impact score for each pattern
    const rankedPatterns = patterns.map(pattern => {
      // Impact factors:
      // 1. Confidence score (40%)
      // 2. Supporting sessions (30%)
      // 3. Pattern type importance (20%)
      // 4. Novelty (10%)
      
      const confidenceScore = pattern.confidence_score * 0.4;
      const supportScore = Math.min(1, pattern.supporting_sessions / 50) * 0.3;
      
      // Pattern type weights
      const typeWeights = {
        'success_indicator': 1.0,
        'user_preference': 0.9,
        'industry_signal': 0.8,
        'timing_pattern': 0.7,
        'engagement_signal': 0.6,
        'quality_indicator': 0.8,
        'context_pattern': 0.7
      };
      const typeScore = (typeWeights[pattern.pattern_type] || 0.5) * 0.2;
      
      // Novelty score (higher for less common pattern types)
      const noveltyScore = 0.1; // Simplified for now
      
      const impactScore = confidenceScore + supportScore + typeScore + noveltyScore;
      
      return {
        ...pattern,
        impact_score: impactScore
      };
    });

    // Sort by impact score descending
    return rankedPatterns.sort((a, b) => (b as any).impact_score - (a as any).impact_score);
  }

  private async autoValidateHighConfidencePatterns(patterns: PatternDiscoveryResult[]): Promise<string[]> {
    const validatedPatternIds: string[] = [];
    
    for (const pattern of patterns) {
      if (pattern.confidence_score >= this.config.auto_validation_threshold) {
        try {
          // Store pattern with validated status
          const { data: insertedPattern } = await supabase
            .from('discovered_patterns')
            .insert({
              pattern_type: pattern.pattern_type,
              pattern_name: pattern.pattern_name,
              pattern_description: pattern.pattern_description,
              pattern_data: pattern.pattern_data,
              trigger_conditions: pattern.trigger_conditions,
              expected_outcome: pattern.expected_outcome,
              confidence_score: pattern.confidence_score,
              supporting_sessions: pattern.supporting_sessions,
              discovery_method: pattern.discovery_method,
              discovery_agent: `pattern_discovery_agent_${this.agentVersion}`,
              validation_status: 'validated', // Auto-validated
              applies_to_users: pattern.applies_to_users || [],
              applies_to_industries: pattern.applies_to_industries || [],
              applies_to_roles: pattern.applies_to_roles || [],
              accuracy_rate: pattern.confidence_score,
              impact_score: (pattern as any).impact_score || pattern.confidence_score
            })
            .select('id')
            .single();

          if (insertedPattern) {
            validatedPatternIds.push(insertedPattern.id);
            console.log(`✅ Auto-validated pattern: ${pattern.pattern_name}`);
          }
        } catch (error) {
          console.warn(`Failed to auto-validate pattern ${pattern.pattern_name}:`, error);
        }
      }
    }

    return validatedPatternIds;
  }

  private async generateAgentImprovements(
    topPatterns: PatternDiscoveryResult[], 
    allPatterns: PatternDiscoveryResult[]
  ): Promise<AgentImprovement[]> {
    const improvements: AgentImprovement[] = [];

    // Algorithm improvement: If we found many low-confidence patterns, suggest threshold tuning
    const lowConfidencePatterns = allPatterns.filter(p => p.confidence_score < 0.6);
    if (lowConfidencePatterns.length > topPatterns.length * 0.3) {
      improvements.push({
        id: `improvement_${Date.now()}_threshold`,
        agent_name: 'pattern_discovery_agent',
        agent_version: this.agentVersion,
        improvement_type: 'parameter_tuning',
        improvement_name: 'Confidence Threshold Optimization',
        description: 'Detected many low-confidence patterns suggesting threshold adjustment needed',
        technical_details: {
          current_threshold: this.config.min_confidence_threshold,
          suggested_threshold: this.config.min_confidence_threshold + 0.05,
          low_confidence_ratio: lowConfidencePatterns.length / allPatterns.length
        },
        affected_users: [],
        affected_components: ['pattern_discovery_engine', 'validation_system'],
        performance_impact: {
          expected_precision_improvement: 0.15,
          expected_recall_decrease: 0.05
        },
        expected_benefits: ['Higher quality patterns', 'Reduced validation overhead', 'Better user recommendations'],
        rollout_status: 'planned',
        rollout_percentage: 0,
        test_group_size: null,
        success_metrics: {
          pattern_quality_score: 0,
          validation_success_rate: 0
        },
        validation_results: {},
        user_feedback_score: null,
        performance_delta: null,
        implemented_at: new Date(),
        validated_at: null,
        deployed_at: null,
        deprecated_at: null,
        created_by: 'autonomous_agent',
        approval_required: true,
        approved_by: null,
        approved_at: null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Feature enhancement: If we found good industry patterns, suggest industry-specific agents
    const industryPatterns = topPatterns.filter(p => p.applies_to_industries && p.applies_to_industries.length > 0);
    if (industryPatterns.length >= 5) {
      improvements.push({
        id: `improvement_${Date.now()}_industry_agents`,
        agent_name: 'pattern_discovery_agent',
        agent_version: this.agentVersion,
        improvement_type: 'feature_enhancement',
        improvement_name: 'Industry-Specific Discovery Agents',
        description: 'High number of industry-specific patterns suggests value in specialized agents',
        technical_details: {
          industry_patterns_found: industryPatterns.length,
          top_industries: [...new Set(industryPatterns.flatMap(p => p.applies_to_industries || []))].slice(0, 5)
        },
        affected_users: [],
        affected_components: ['pattern_discovery_system'],
        performance_impact: {
          expected_pattern_quality_improvement: 0.20,
          expected_discovery_time_increase: 0.15
        },
        expected_benefits: ['Industry-specific insights', 'Better pattern relevance', 'Specialized optimization'],
        rollout_status: 'planned',
        rollout_percentage: 0,
        test_group_size: null,
        success_metrics: {},
        validation_results: {},
        user_feedback_score: null,
        performance_delta: null,
        implemented_at: new Date(),
        validated_at: null,
        deployed_at: null,
        deprecated_at: null,
        created_by: 'autonomous_agent',
        approval_required: true,
        approved_by: null,
        approved_at: null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return improvements;
  }

  private generateOptimizationRecommendations(
    topPatterns: PatternDiscoveryResult[], 
    validatedPatterns: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (topPatterns.length === 0) {
      recommendations.push('No significant patterns discovered - consider increasing behavioral data volume or adjusting discovery parameters');
    } else {
      recommendations.push(`Successfully discovered ${topPatterns.length} high-quality patterns with ${validatedPatterns.length} auto-validated`);
    }

    // Pattern type analysis
    const patternTypes = topPatterns.reduce((acc, p) => {
      acc[p.pattern_type] = (acc[p.pattern_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonType = Object.entries(patternTypes).sort(([,a], [,b]) => b - a)[0];
    if (mostCommonType) {
      recommendations.push(`Most discovered pattern type: ${mostCommonType[0]} (${mostCommonType[1]} patterns) - consider specialized processing for this type`);
    }

    // Confidence analysis
    const avgConfidence = topPatterns.reduce((sum, p) => sum + p.confidence_score, 0) / topPatterns.length;
    if (avgConfidence > 0.8) {
      recommendations.push('High pattern confidence detected - system learning is highly effective');
    } else if (avgConfidence < 0.65) {
      recommendations.push('Lower pattern confidence - consider collecting more behavioral data or refining discovery algorithms');
    }

    // Validation rate analysis
    const validationRate = validatedPatterns.length / topPatterns.length;
    if (validationRate > 0.7) {
      recommendations.push('High auto-validation rate indicates excellent pattern quality');
    } else if (validationRate < 0.3) {
      recommendations.push('Low auto-validation rate suggests need for confidence threshold adjustment');
    }

    return recommendations;
  }

  private async discoverIndustrySpecificPatterns(): Promise<PatternDiscoveryResult[]> {
    // Get top industries by user activity
    const { data: sessions } = await supabase
      .from('research_session_intelligence')
      .select('profile_data')
      .not('profile_data', 'is', null)
      .gte('created_at', new Date(Date.now() - this.config.behavioral_lookback_days * 24 * 60 * 60 * 1000).toISOString());

    if (!sessions) return [];

    // Extract industry information
    const industryData: Record<string, any[]> = {};
    sessions.forEach(session => {
      const industry = session.profile_data?.industry;
      if (industry) {
        if (!industryData[industry]) industryData[industry] = [];
        industryData[industry].push(session);
      }
    });

    const patterns: PatternDiscoveryResult[] = [];
    
    // Analyse top industries (limit to prevent excessive processing)
    const topIndustries = Object.entries(industryData)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);

    for (const [industry, sessions] of topIndustries) {
      if (sessions.length < 10) continue; // Minimum threshold for meaningful patterns

      // Example pattern: Industry engagement rates
      // In a real implementation, this would be more sophisticated
      patterns.push({
        pattern_type: 'industry_signal',
        pattern_name: `${industry} Engagement Pattern`,
        pattern_description: `Specific engagement characteristics observed in ${industry} industry`,
        pattern_data: {
          industry,
          session_count: sessions.length,
          avg_engagement: 0.7 // Mock calculation
        },
        trigger_conditions: {
          profile_industry: industry
        },
        expected_outcome: `Optimized research approach for ${industry}`,
        confidence_score: Math.min(0.9, sessions.length / 100),
        supporting_sessions: sessions.length,
        discovery_method: 'industry_specific_analysis',
        applies_to_industries: [industry]
      });
    }

    return patterns;
  }

  private async discoverTemporalPatterns(): Promise<PatternDiscoveryResult[]> {
    const patterns: PatternDiscoveryResult[] = [];

    // Get session timing data
    const { data: sessions } = await supabase
      .from('research_session_intelligence')
      .select('created_at, session_outcome, session_duration')
      .gte('created_at', new Date(Date.now() - this.config.behavioral_lookback_days * 24 * 60 * 60 * 1000).toISOString());

    if (!sessions || sessions.length < 20) return patterns;

    // Analyse hourly patterns
    const hourlyData: Record<number, { total: number; contacted: number; avgDuration: number }> = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.created_at).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { total: 0, contacted: 0, avgDuration: 0 };
      }
      hourlyData[hour].total++;
      if (session.session_outcome === 'contacted') {
        hourlyData[hour].contacted++;
      }
      hourlyData[hour].avgDuration += session.session_duration || 0;
    });

    // Calculate success rates and identify peak hours
    const hourlyStats = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      success_rate: data.contacted / data.total,
      avg_duration: data.avgDuration / data.total,
      total_sessions: data.total
    })).filter(h => h.total_sessions >= 5); // Minimum sessions for reliability

    // Find peak performance hours
    const topHours = hourlyStats
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 3);

    if (topHours.length > 0 && topHours[0].success_rate > 0.6) {
      patterns.push({
        pattern_type: 'timing_pattern',
        pattern_name: 'Peak Performance Hours',
        pattern_description: `Research sessions show higher success rates during specific hours`,
        pattern_data: {
          peak_hours: topHours,
          global_success_rate: sessions.filter(s => s.session_outcome === 'contacted').length / sessions.length
        },
        trigger_conditions: {
          session_hour: topHours.map(h => h.hour)
        },
        expected_outcome: 'Improved research timing recommendations',
        confidence_score: Math.min(0.8, topHours[0].success_rate),
        supporting_sessions: topHours.reduce((sum, h) => sum + h.total_sessions, 0),
        discovery_method: 'temporal_analysis'
      });
    }

    return patterns;
  }

  private async storeDiscoverySession(session: DiscoverySession, patterns: PatternDiscoveryResult[]): Promise<void> {
    try {
      // Store session metadata
      await supabase
        .from('agent_discovery_sessions')
        .insert({
          session_id: session.id,
          agent_name: 'pattern_discovery_agent',
          agent_version: session.agent_version,
          started_at: session.started_at,
          completed_at: session.completed_at,
          patterns_discovered: session.patterns_discovered,
          patterns_validated: session.patterns_validated,
          processing_time_ms: session.processing_time_ms,
          success_rate: session.success_rate,
          session_data: {
            config: this.config,
            pattern_summary: patterns.map(p => ({
              type: p.pattern_type,
              name: p.pattern_name,
              confidence: p.confidence_score
            }))
          }
        });

      console.log(`📊 Stored discovery session ${session.id} with ${patterns.length} patterns`);
    } catch (error) {
      console.error('Failed to store discovery session:', error);
    }
  }
}

export default PatternDiscoveryAgent;