/**
 * Pattern Validation System - A/B tests discovered patterns to validate effectiveness
 * 
 * This service implements A/B testing framework to validate discovered patterns
 * and measure their impact on user research effectiveness.
 */

import { supabase } from '@/lib/supabase';
import type { 
  DiscoveredPattern,
  ValidationExperiment,
  ExperimentResult,
  ValidationConfig,
  PatternValidationStatus
} from '@/lib/types/intelligence';

interface ExperimentGroup {
  id: string;
  name: string;
  users: string[];
  pattern_enabled: boolean;
  start_date: Date;
  end_date: Date;
}

interface ValidationMetrics {
  contact_rate: number;
  session_duration: number;
  user_satisfaction: number;
  efficiency_score: number;
  retention_rate: number;
}

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  min_users_per_group: 10,
  experiment_duration_days: 14,
  significance_threshold: 0.05,
  min_effect_size: 0.1,
  power: 0.8,
  early_stopping: true
};

export class PatternValidationSystem {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  /**
   * Start A/B test for a discovered pattern
   */
  async startPatternValidation(
    patternId: string,
    validationConfig?: Partial<ValidationConfig>
  ): Promise<ValidationExperiment> {
    const config = { ...this.config, ...validationConfig };
    
    try {
      // Get the pattern to validate
      const { data: pattern, error: patternError } = await supabase
        .from('discovered_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

      if (patternError || !pattern) {
        throw new Error(`Pattern not found: ${patternId}`);
      }

      // Check if pattern is eligible for validation
      if (pattern.validation_status !== 'discovered') {
        throw new Error(`Pattern is not in 'discovered' status: ${pattern.validation_status}`);
      }

      // Create experiment groups
      const experimentGroups = await this.createExperimentGroups(pattern, config);
      
      // Create validation experiment record
      const experiment: Omit<ValidationExperiment, 'id'> = {
        pattern_id: patternId,
        experiment_name: `Validation: ${pattern.pattern_name}`,
        hypothesis: `Pattern '${pattern.pattern_name}' will improve user research effectiveness`,
        control_group: experimentGroups.control,
        treatment_group: experimentGroups.treatment,
        metrics_to_track: this.getMetricsForPatternType(pattern.pattern_type),
        start_date: new Date(),
        end_date: new Date(Date.now() + config.experiment_duration_days * 24 * 60 * 60 * 1000),
        status: 'running',
        config: config,
        baseline_metrics: null,
        current_metrics: null,
        statistical_significance: null,
        created_at: new Date()
      };

      // Save experiment to database
      const { data: savedExperiment, error: experimentError } = await supabase
        .from('pattern_validation_experiments')
        .insert(experiment)
        .select('*')
        .single();

      if (experimentError) {
        throw new Error(`Error saving experiment: ${experimentError.message}`);
      }

      // Update pattern status
      await supabase
        .from('discovered_patterns')
        .update({ 
          validation_status: 'testing',
          updated_at: new Date().toISOString()
        })
        .eq('id', patternId);

      // Record the experiment start in agent improvements
      await this.recordExperimentStart(savedExperiment, pattern);

      console.log(`Started validation experiment for pattern ${patternId}`);
      return savedExperiment;
    } catch (error) {
      console.error('Error starting pattern validation:', error);
      throw error;
    }
  }

  /**
   * Check experiment progress and update metrics
   */
  async updateExperimentMetrics(experimentId: string): Promise<ExperimentResult> {
    try {
      // Get experiment details
      const { data: experiment, error: expError } = await supabase
        .from('pattern_validation_experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (expError || !experiment) {
        throw new Error(`Experiment not found: ${experimentId}`);
      }

      if (experiment.status !== 'running') {
        throw new Error(`Experiment is not running: ${experiment.status}`);
      }

      // Calculate current metrics for both groups
      const controlMetrics = await this.calculateGroupMetrics(
        experiment.control_group.users,
        experiment.start_date,
        new Date()
      );

      const treatmentMetrics = await this.calculateGroupMetrics(
        experiment.treatment_group.users,
        experiment.start_date,
        new Date()
      );

      // Perform statistical analysis
      const statisticalResult = await this.performStatisticalAnalysis(
        controlMetrics,
        treatmentMetrics,
        experiment.config
      );

      // Update experiment with current results
      const updatedExperiment = {
        ...experiment,
        current_metrics: {
          control: controlMetrics,
          treatment: treatmentMetrics,
          last_updated: new Date().toISOString()
        },
        statistical_significance: statisticalResult,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('pattern_validation_experiments')
        .update(updatedExperiment)
        .eq('id', experimentId);

      // Check if experiment should be stopped early
      const shouldStop = await this.shouldStopExperimentEarly(statisticalResult, experiment.config);
      
      if (shouldStop.stop) {
        return await this.concludeExperiment(experimentId, shouldStop.reason);
      }

      return {
        experiment_id: experimentId,
        status: 'running',
        control_metrics: controlMetrics,
        treatment_metrics: treatmentMetrics,
        statistical_result: statisticalResult,
        recommendation: this.generateInterimRecommendation(statisticalResult),
        days_remaining: this.calculateDaysRemaining(experiment.end_date)
      };
    } catch (error) {
      console.error('Error updating experiment metrics:', error);
      throw error;
    }
  }

  /**
   * Conclude an experiment and determine pattern validity
   */
  async concludeExperiment(
    experimentId: string, 
    reason: string = 'completed'
  ): Promise<ExperimentResult> {
    try {
      const { data: experiment, error: expError } = await supabase
        .from('pattern_validation_experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (expError || !experiment) {
        throw new Error(`Experiment not found: ${experimentId}`);
      }

      // Get final metrics
      const result = await this.updateExperimentMetrics(experimentId);
      
      // Determine if pattern is validated
      const isValidated = this.determinePatternValidity(result.statistical_result);
      
      // Update pattern status
      const newPatternStatus: PatternValidationStatus = isValidated ? 'validated' : 'deprecated';
      
      await supabase
        .from('discovered_patterns')
        .update({ 
          validation_status: newPatternStatus,
          last_validated: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', experiment.pattern_id);

      // Update experiment status
      await supabase
        .from('pattern_validation_experiments')
        .update({
          status: 'completed',
          conclusion: reason,
          final_result: isValidated ? 'validated' : 'rejected',
          completed_at: new Date().toISOString()
        })
        .eq('id', experimentId);

      // Record the conclusion in agent improvements
      await this.recordExperimentConclusion(experiment, isValidated, result);

      console.log(`Concluded experiment ${experimentId}: Pattern ${isValidated ? 'validated' : 'rejected'}`);
      
      return {
        ...result,
        status: 'completed',
        final_decision: isValidated ? 'validated' : 'rejected',
        conclusion_reason: reason
      };
    } catch (error) {
      console.error('Error concluding experiment:', error);
      throw error;
    }
  }

  /**
   * Get all active experiments
   */
  async getActiveExperiments(): Promise<ValidationExperiment[]> {
    const { data: experiments, error } = await supabase
      .from('pattern_validation_experiments')
      .select('*')
      .eq('status', 'running')
      .order('start_date', { ascending: false });

    if (error) {
      throw new Error(`Error fetching active experiments: ${error.message}`);
    }

    return experiments || [];
  }

  /**
   * Get experiment results and history
   */
  async getExperimentHistory(patternId?: string): Promise<ValidationExperiment[]> {
    let query = supabase
      .from('pattern_validation_experiments')
      .select(`
        *,
        discovered_patterns (
          pattern_name,
          pattern_type,
          pattern_description
        )
      `)
      .order('start_date', { ascending: false });

    if (patternId) {
      query = query.eq('pattern_id', patternId);
    }

    const { data: experiments, error } = await query;

    if (error) {
      throw new Error(`Error fetching experiment history: ${error.message}`);
    }

    return experiments || [];
  }

  // Private helper methods

  private async createExperimentGroups(
    pattern: DiscoveredPattern,
    config: ValidationConfig
  ): Promise<{ control: ExperimentGroup; treatment: ExperimentGroup }> {
    // Get eligible users for the experiment
    const eligibleUsers = await this.getEligibleUsers(pattern, config);
    
    if (eligibleUsers.length < config.min_users_per_group * 2) {
      throw new Error(`Insufficient users for experiment. Need ${config.min_users_per_group * 2}, found ${eligibleUsers.length}`);
    }

    // Randomly split users into control and treatment groups
    const shuffledUsers = this.shuffleArray(eligibleUsers);
    const midpoint = Math.floor(shuffledUsers.length / 2);
    
    const controlUsers = shuffledUsers.slice(0, midpoint);
    const treatmentUsers = shuffledUsers.slice(midpoint);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + config.experiment_duration_days * 24 * 60 * 60 * 1000);

    return {
      control: {
        id: `control_${pattern.id}_${Date.now()}`,
        name: `Control Group - ${pattern.pattern_name}`,
        users: controlUsers,
        pattern_enabled: false,
        start_date: startDate,
        end_date: endDate
      },
      treatment: {
        id: `treatment_${pattern.id}_${Date.now()}`,
        name: `Treatment Group - ${pattern.pattern_name}`,
        users: treatmentUsers,
        pattern_enabled: true,
        start_date: startDate,
        end_date: endDate
      }
    };
  }

  private async getEligibleUsers(pattern: DiscoveredPattern, config: ValidationConfig): Promise<string[]> {
    // Get users who have been active in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    let query = supabase
      .from('user_intelligence_profiles')
      .select('user_id')
      .gte('last_pattern_update', thirtyDaysAgo.toISOString())
      .gte('total_research_sessions', 5); // Minimum session requirement

    // Apply pattern-specific filters
    if (pattern.applies_to_users && pattern.applies_to_users.length > 0) {
      query = query.in('user_id', pattern.applies_to_users);
    }

    const { data: profiles, error } = await query;
    
    if (error) {
      throw new Error(`Error getting eligible users: ${error.message}`);
    }

    return (profiles || []).map(p => p.user_id);
  }

  private getMetricsForPatternType(patternType: string): string[] {
    const baseMetrics = ['contact_rate', 'session_duration', 'user_satisfaction'];
    
    switch (patternType) {
      case 'user_preference':
        return [...baseMetrics, 'relevance_accuracy'];
      case 'timing_pattern':
        return [...baseMetrics, 'efficiency_score'];
      case 'success_indicator':
        return [...baseMetrics, 'prediction_accuracy'];
      case 'engagement_signal':
        return [...baseMetrics, 'engagement_score'];
      default:
        return baseMetrics;
    }
  }

  private async calculateGroupMetrics(
    userIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<ValidationMetrics> {
    // Get sessions for the group in the time period
    const { data: sessions, error } = await supabase
      .from('research_session_intelligence')
      .select(`
        session_duration,
        session_outcome,
        confidence_level,
        relevance_rating,
        created_at
      `)
      .in('user_id', userIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error || !sessions) {
      throw new Error(`Error calculating group metrics: ${error?.message}`);
    }

    const totalSessions = sessions.length;
    const contactedSessions = sessions.filter(s => s.session_outcome === 'contacted').length;
    
    return {
      contact_rate: totalSessions > 0 ? contactedSessions / totalSessions : 0,
      session_duration: sessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / totalSessions || 0,
      user_satisfaction: sessions.reduce((sum, s) => sum + (s.relevance_rating || 0), 0) / totalSessions || 0,
      efficiency_score: this.calculateEfficiencyScore(sessions),
      retention_rate: await this.calculateRetentionRate(userIds, startDate, endDate)
    };
  }

  private async performStatisticalAnalysis(
    controlMetrics: ValidationMetrics,
    treatmentMetrics: ValidationMetrics,
    config: ValidationConfig
  ): Promise<any> {
    // Simplified statistical analysis (would use proper statistical library in production)
    const results: any = {};
    
    // Calculate effect sizes and p-values for each metric
    for (const metric of ['contact_rate', 'session_duration', 'user_satisfaction', 'efficiency_score']) {
      const controlValue = controlMetrics[metric as keyof ValidationMetrics] as number;
      const treatmentValue = treatmentMetrics[metric as keyof ValidationMetrics] as number;
      
      const effectSize = (treatmentValue - controlValue) / controlValue || 0;
      const pValue = this.calculatePValue(controlValue, treatmentValue); // Simplified
      
      results[metric] = {
        control_value: controlValue,
        treatment_value: treatmentValue,
        effect_size: effectSize,
        p_value: pValue,
        significant: pValue < config.significance_threshold,
        practically_significant: Math.abs(effectSize) > config.min_effect_size
      };
    }

    results.overall_significant = Object.values(results).some((r: any) => r.significant && r.practically_significant);
    
    return results;
  }

  private async shouldStopExperimentEarly(
    statisticalResult: any,
    config: ValidationConfig
  ): Promise<{ stop: boolean; reason: string }> {
    if (!config.early_stopping) {
      return { stop: false, reason: '' };
    }

    // Stop early if we have strong statistical evidence
    const strongEvidence = Object.values(statisticalResult)
      .filter((r: any) => r.p_value !== undefined)
      .some((r: any) => r.p_value < 0.01 && Math.abs(r.effect_size) > 0.2);

    if (strongEvidence) {
      return { stop: true, reason: 'Strong statistical evidence detected' };
    }

    return { stop: false, reason: '' };
  }

  private determinePatternValidity(statisticalResult: any): boolean {
    // Pattern is valid if it shows statistically and practically significant improvement
    return statisticalResult.overall_significant === true;
  }

  private generateInterimRecommendation(statisticalResult: any): string {
    const significantResults = Object.entries(statisticalResult)
      .filter(([key, result]: [string, any]) => 
        result.significant && result.practically_significant && key !== 'overall_significant'
      );

    if (significantResults.length === 0) {
      return 'No significant improvements detected yet. Continue monitoring.';
    }

    const improvements = significantResults
      .map(([metric, result]: [string, any]) => 
        `${metric}: ${(result.effect_size * 100).toFixed(1)}% improvement`
      )
      .join(', ');

    return `Positive signals detected: ${improvements}`;
  }

  private calculateDaysRemaining(endDate: Date): number {
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private calculateEfficiencyScore(sessions: any[]): number {
    // Simple efficiency calculation based on contact rate and session duration
    const contactRate = sessions.filter(s => s.session_outcome === 'contacted').length / sessions.length || 0;
    const avgDuration = sessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / sessions.length || 1;
    
    // Efficiency = contacts per minute (normalized to 0-1 scale)
    return Math.min(1, (contactRate * 60) / avgDuration);
  }

  private async calculateRetentionRate(userIds: string[], startDate: Date, endDate: Date): Promise<number> {
    // Calculate how many users remained active throughout the period
    const totalUsers = userIds.length;
    
    const { data: activeSessions, error } = await supabase
      .from('research_session_intelligence')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error || !activeSessions) return 0;

    const activeUsers = new Set(activeSessions.map(s => s.user_id));
    return activeUsers.size / totalUsers;
  }

  private calculatePValue(control: number, treatment: number): number {
    // Simplified p-value calculation (would use proper statistical test in production)
    const diff = Math.abs(treatment - control);
    const avg = (control + treatment) / 2;
    const relativeError = diff / (avg || 1);
    
    // Mock p-value based on relative difference
    return Math.max(0.001, 0.5 - (relativeError * 2));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async recordExperimentStart(experiment: ValidationExperiment, pattern: DiscoveredPattern): Promise<void> {
    await supabase
      .from('agent_improvements')
      .insert({
        agent_name: 'pattern_validation_system',
        improvement_type: 'new_pattern',
        improvement_name: `A/B Testing: ${pattern.pattern_name}`,
        description: `Started A/B test to validate pattern: ${pattern.pattern_description}`,
        technical_details: {
          experiment_id: experiment.id,
          pattern_id: pattern.id,
          control_group_size: experiment.control_group.users.length,
          treatment_group_size: experiment.treatment_group.users.length
        },
        rollout_status: 'testing',
        rollout_percentage: 50
      });
  }

  private async recordExperimentConclusion(
    experiment: ValidationExperiment,
    validated: boolean,
    result: ExperimentResult
  ): Promise<void> {
    await supabase
      .from('agent_improvements')
      .insert({
        agent_name: 'pattern_validation_system',
        improvement_type: validated ? 'algorithm_update' : 'bug_fix',
        improvement_name: `Pattern ${validated ? 'Validated' : 'Rejected'}: ${experiment.experiment_name}`,
        description: `A/B test ${validated ? 'validated' : 'rejected'} the pattern. ${result.conclusion_reason || ''}`,
        technical_details: {
          experiment_id: experiment.id,
          statistical_results: result.statistical_result,
          final_decision: result.final_decision
        },
        rollout_status: validated ? 'full' : 'rollback',
        rollout_percentage: validated ? 100 : 0,
        validated_at: new Date().toISOString()
      });
  }
}

export default PatternValidationSystem;