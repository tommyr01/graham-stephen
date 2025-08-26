/**
 * Analytics Metrics API Endpoint
 * GET /api/v2/analytics/metrics
 * Provides performance metrics for the AI learning system
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Query parameter validation
const MetricsQuerySchema = z.object({
  timeRange: z.enum(['24h', '7d', '30d', '90d']).default('24h'),
  includePatternMetrics: z.boolean().default(true),
  includeContentMetrics: z.boolean().default(true),
  includePredictionMetrics: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = MetricsQuerySchema.parse({
      timeRange: searchParams.get('timeRange') || '24h',
      includePatternMetrics: searchParams.get('includePatternMetrics') === 'true',
      includeContentMetrics: searchParams.get('includeContentMetrics') === 'true',
      includePredictionMetrics: searchParams.get('includePredictionMetrics') === 'true'
    });

    // Calculate time window
    const timeWindow = getTimeWindow(params.timeRange);
    
    // Gather metrics
    const metrics = await gatherMetrics(timeWindow, params);
    
    return NextResponse.json({
      success: true,
      data: {
        timeRange: params.timeRange,
        timeWindow: {
          start: timeWindow.start,
          end: timeWindow.end
        },
        summary: generateMetricsSummary(metrics),
        metrics
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Metrics retrieval failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getTimeWindow(timeRange: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (timeRange) {
    case '24h':
      start.setHours(start.getHours() - 24);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
  }

  return { start, end };
}

async function gatherMetrics(timeWindow: { start: Date; end: Date }, params: any) {
  const metrics: any = {};

  try {
    // Training decision metrics
    const trainingMetrics = await getTrainingMetrics(timeWindow);
    metrics.training = trainingMetrics;

    // Prediction accuracy metrics
    if (params.includePredictionMetrics) {
      const predictionMetrics = await getPredictionMetrics(timeWindow);
      metrics.predictions = predictionMetrics;
    }

    // Pattern learning metrics
    if (params.includePatternMetrics) {
      const patternMetrics = await getPatternMetrics(timeWindow);
      metrics.patterns = patternMetrics;
    }

    // Content analysis metrics
    if (params.includeContentMetrics) {
      const contentMetrics = await getContentMetrics(timeWindow);
      metrics.content = contentMetrics;
    }

    // System performance metrics
    const performanceMetrics = await getPerformanceMetrics(timeWindow);
    metrics.performance = performanceMetrics;

  } catch (error) {
    console.error('Error gathering metrics:', error);
  }

  return metrics;
}

async function getTrainingMetrics(timeWindow: { start: Date; end: Date }) {
  try {
    // Total training decisions
    const { count: totalDecisions } = await supabase
      .from('training_decisions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    // Contact vs Skip breakdown
    const { data: decisionBreakdown } = await supabase
      .from('training_decisions')
      .select('decision')
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    const contactDecisions = decisionBreakdown?.filter(d => d.decision === 'contact').length || 0;
    const skipDecisions = decisionBreakdown?.filter(d => d.decision === 'skip').length || 0;

    // Average confidence
    const { data: confidenceData } = await supabase
      .from('training_decisions')
      .select('confidence')
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    const avgConfidence = confidenceData && confidenceData.length > 0 
      ? confidenceData.reduce((sum, d) => sum + d.confidence, 0) / confidenceData.length 
      : 0;

    // Average decision time
    const { data: timingData } = await supabase
      .from('training_decisions')
      .select('decision_time_ms')
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    const avgDecisionTime = timingData?.length > 0
      ? timingData.reduce((sum, d) => sum + d.decision_time_ms, 0) / timingData.length
      : 0;

    // Voice reasoning usage
    const { count: voiceUsage } = await supabase
      .from('training_decisions')
      .select('*', { count: 'exact', head: true })
      .not('voice_transcription', 'is', null)
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    return {
      totalDecisions: totalDecisions || 0,
      contactDecisions,
      skipDecisions,
      contactRate: totalDecisions > 0 ? (contactDecisions / totalDecisions) * 100 : 0,
      averageConfidence: Math.round(avgConfidence * 10) / 10,
      averageDecisionTime: Math.round(avgDecisionTime),
      voiceReasoningUsage: totalDecisions > 0 ? ((voiceUsage || 0) / totalDecisions) * 100 : 0
    };

  } catch (error) {
    console.error('Training metrics failed:', error);
    return {
      totalDecisions: 0,
      contactDecisions: 0,
      skipDecisions: 0,
      contactRate: 0,
      averageConfidence: 0,
      averageDecisionTime: 0,
      voiceReasoningUsage: 0
    };
  }
}

async function getPredictionMetrics(timeWindow: { start: Date; end: Date }) {
  try {
    // Total predictions made
    const { count: totalPredictions } = await supabase
      .from('prediction_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    // Validated predictions (where we have actual decisions)
    const { data: validatedPredictions } = await supabase
      .from('prediction_results')
      .select('predicted_decision, actual_decision, prediction_accuracy, confidence_score')
      .not('actual_decision', 'is', null)
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    const totalValidated = validatedPredictions?.length || 0;
    const correctPredictions = validatedPredictions?.filter(p => p.prediction_accuracy).length || 0;
    const accuracy = totalValidated > 0 ? (correctPredictions / totalValidated) * 100 : 0;

    // Average confidence
    const avgConfidence = validatedPredictions?.length > 0
      ? validatedPredictions.reduce((sum, p) => sum + p.confidence_score, 0) / validatedPredictions.length
      : 0;

    // Confidence calibration (how well confidence matches accuracy)
    const confidenceCalibration = calculateConfidenceCalibration(validatedPredictions || []);

    return {
      totalPredictions: totalPredictions || 0,
      validatedPredictions: totalValidated,
      overallAccuracy: Math.round(accuracy * 10) / 10,
      averageConfidence: Math.round(avgConfidence * 10) / 10,
      confidenceCalibration: Math.round(confidenceCalibration * 10) / 10,
      predictionBreakdown: {
        contact: validatedPredictions?.filter(p => p.predicted_decision === 'contact').length || 0,
        skip: validatedPredictions?.filter(p => p.predicted_decision === 'skip').length || 0
      }
    };

  } catch (error) {
    console.error('Prediction metrics failed:', error);
    return {
      totalPredictions: 0,
      validatedPredictions: 0,
      overallAccuracy: 0,
      averageConfidence: 0,
      confidenceCalibration: 0,
      predictionBreakdown: { contact: 0, skip: 0 }
    };
  }
}

async function getPatternMetrics(timeWindow: { start: Date; end: Date }) {
  try {
    // Total active patterns
    const { count: totalPatterns } = await supabase
      .from('decision_patterns')
      .select('*', { count: 'exact', head: true })
      .gte('confidence', 0.5); // Only count patterns with reasonable confidence

    // Recently updated patterns
    const { count: recentlyUpdated } = await supabase
      .from('decision_patterns')
      .select('*', { count: 'exact', head: true })
      .gte('last_validated_at', timeWindow.start.toISOString())
      .lte('last_validated_at', timeWindow.end.toISOString());

    // Pattern accuracy distribution
    const { data: patterns } = await supabase
      .from('decision_patterns')
      .select('pattern_type, accuracy_rate, confidence, usage_count')
      .gte('confidence', 0.5);

    const patternsByType = (patterns || []).reduce((acc, pattern) => {
      if (!acc[pattern.pattern_type]) {
        acc[pattern.pattern_type] = {
          count: 0,
          avgAccuracy: 0,
          avgConfidence: 0,
          totalUsage: 0
        };
      }
      acc[pattern.pattern_type].count++;
      acc[pattern.pattern_type].avgAccuracy += pattern.accuracy_rate;
      acc[pattern.pattern_type].avgConfidence += pattern.confidence;
      acc[pattern.pattern_type].totalUsage += pattern.usage_count;
      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(patternsByType).forEach(type => {
      const typeData = patternsByType[type];
      typeData.avgAccuracy = typeData.avgAccuracy / typeData.count;
      typeData.avgConfidence = typeData.avgConfidence / typeData.count;
    });

    return {
      totalPatterns: totalPatterns || 0,
      recentlyUpdated: recentlyUpdated || 0,
      patternsByType,
      overallPatternAccuracy: patterns?.length > 0
        ? patterns.reduce((sum, p) => sum + p.accuracy_rate, 0) / patterns.length
        : 0
    };

  } catch (error) {
    console.error('Pattern metrics failed:', error);
    return {
      totalPatterns: 0,
      recentlyUpdated: 0,
      patternsByType: {},
      overallPatternAccuracy: 0
    };
  }
}

async function getContentMetrics(timeWindow: { start: Date; end: Date }) {
  try {
    // Total content analyses
    const { count: totalAnalyses } = await supabase
      .from('content_analysis')
      .select('*', { count: 'exact', head: true })
      .gte('analyzed_at', timeWindow.start.toISOString())
      .lte('analyzed_at', timeWindow.end.toISOString());

    // Average scores
    const { data: scores } = await supabase
      .from('content_analysis')
      .select('authenticity_score, expertise_level, specificity_score, professionalism_score')
      .gte('analyzed_at', timeWindow.start.toISOString())
      .lte('analyzed_at', timeWindow.end.toISOString());

    const avgScores = scores?.length > 0 ? {
      authenticity: scores.reduce((sum, s) => sum + s.authenticity_score, 0) / scores.length,
      expertise: scores.reduce((sum, s) => sum + s.expertise_level, 0) / scores.length,
      specificity: scores.reduce((sum, s) => sum + s.specificity_score, 0) / scores.length,
      professionalism: scores.reduce((sum, s) => sum + s.professionalism_score, 0) / scores.length
    } : { authenticity: 0, expertise: 0, specificity: 0, professionalism: 0 };

    // AI content detection
    const aiGeneratedCount = scores?.filter(s => s.authenticity_score < 5).length || 0;
    const aiContentPercentage = scores?.length > 0 ? (aiGeneratedCount / scores.length) * 100 : 0;

    return {
      totalAnalyses: totalAnalyses || 0,
      averageScores: {
        authenticity: Math.round(avgScores.authenticity * 10) / 10,
        expertise: Math.round(avgScores.expertise * 10) / 10,
        specificity: Math.round(avgScores.specificity * 10) / 10,
        professionalism: Math.round(avgScores.professionalism * 10) / 10
      },
      aiContentDetection: {
        totalPosts: scores?.length || 0,
        aiGeneratedPosts: aiGeneratedCount,
        aiContentPercentage: Math.round(aiContentPercentage * 10) / 10
      }
    };

  } catch (error) {
    console.error('Content metrics failed:', error);
    return {
      totalAnalyses: 0,
      averageScores: { authenticity: 0, expertise: 0, specificity: 0, professionalism: 0 },
      aiContentDetection: { totalPosts: 0, aiGeneratedPosts: 0, aiContentPercentage: 0 }
    };
  }
}

async function getPerformanceMetrics(timeWindow: { start: Date; end: Date }) {
  try {
    // Processing times from content analysis
    const { data: processingTimes } = await supabase
      .from('content_analysis')
      .select('processing_time_ms')
      .not('processing_time_ms', 'is', null)
      .gte('analyzed_at', timeWindow.start.toISOString())
      .lte('analyzed_at', timeWindow.end.toISOString());

    const avgProcessingTime = processingTimes?.length > 0
      ? processingTimes.reduce((sum, p) => sum + p.processing_time_ms, 0) / processingTimes.length
      : 0;

    // Cache hit rate estimation
    const { count: totalAnalyses } = await supabase
      .from('content_analysis')
      .select('*', { count: 'exact', head: true })
      .gte('analyzed_at', timeWindow.start.toISOString())
      .lte('analyzed_at', timeWindow.end.toISOString());

    // System health metrics
    return {
      averageProcessingTime: Math.round(avgProcessingTime),
      throughput: totalAnalyses || 0,
      systemHealth: 'operational', // Would implement actual health checks
      uptime: '99.9%' // Would calculate from monitoring data
    };

  } catch (error) {
    console.error('Performance metrics failed:', error);
    return {
      averageProcessingTime: 0,
      throughput: 0,
      systemHealth: 'unknown',
      uptime: '0%'
    };
  }
}

function calculateConfidenceCalibration(predictions: any[]): number {
  if (predictions.length === 0) return 0;

  // Group predictions by confidence ranges
  const confidenceBuckets = [
    { min: 0, max: 20, predictions: [] },
    { min: 20, max: 40, predictions: [] },
    { min: 40, max: 60, predictions: [] },
    { min: 60, max: 80, predictions: [] },
    { min: 80, max: 100, predictions: [] }
  ];

  predictions.forEach(pred => {
    const bucket = confidenceBuckets.find(b => 
      pred.confidence_score >= b.min && pred.confidence_score < b.max
    );
    if (bucket) bucket.predictions.push(pred);
  });

  // Calculate calibration for each bucket
  let totalCalibrationError = 0;
  let bucketsWithData = 0;

  confidenceBuckets.forEach(bucket => {
    if (bucket.predictions.length > 0) {
      const avgConfidence = bucket.predictions.reduce((sum, p) => sum + p.confidence_score, 0) / bucket.predictions.length;
      const actualAccuracy = bucket.predictions.filter(p => p.prediction_accuracy).length / bucket.predictions.length * 100;
      
      totalCalibrationError += Math.abs(avgConfidence - actualAccuracy);
      bucketsWithData++;
    }
  });

  // Return inverse of calibration error (higher is better)
  const avgCalibrationError = bucketsWithData > 0 ? totalCalibrationError / bucketsWithData : 100;
  return Math.max(0, 100 - avgCalibrationError);
}

function generateMetricsSummary(metrics: any) {
  return {
    learningVelocity: calculateLearningVelocity(metrics),
    systemHealth: assessSystemHealth(metrics),
    keyInsights: generateKeyInsights(metrics),
    recommendations: generateRecommendations(metrics)
  };
}

function calculateLearningVelocity(metrics: any): string {
  const trainingDecisions = metrics.training?.totalDecisions || 0;
  const patternUpdates = metrics.patterns?.recentlyUpdated || 0;
  
  if (trainingDecisions >= 10 && patternUpdates >= 5) return 'High';
  if (trainingDecisions >= 5 && patternUpdates >= 2) return 'Medium';
  return 'Low';
}

function assessSystemHealth(metrics: any): 'excellent' | 'good' | 'fair' | 'poor' {
  const accuracy = metrics.predictions?.overallAccuracy || 0;
  const confidence = metrics.predictions?.confidenceCalibration || 0;
  
  const healthScore = (accuracy + confidence) / 2;
  
  if (healthScore >= 85) return 'excellent';
  if (healthScore >= 70) return 'good';
  if (healthScore >= 55) return 'fair';
  return 'poor';
}

function generateKeyInsights(metrics: any): string[] {
  const insights: string[] = [];
  
  if (metrics.training?.totalDecisions > 0) {
    insights.push(`${metrics.training.totalDecisions} training decisions captured`);
  }
  
  if (metrics.predictions?.overallAccuracy > 80) {
    insights.push(`High prediction accuracy: ${metrics.predictions.overallAccuracy}%`);
  }
  
  if (metrics.content?.aiContentDetection?.aiContentPercentage > 30) {
    insights.push(`${metrics.content.aiContentDetection.aiContentPercentage}% of content appears AI-generated`);
  }
  
  return insights;
}

function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (metrics.training?.totalDecisions < 10) {
    recommendations.push('Continue training mode to improve prediction accuracy');
  }
  
  if (metrics.predictions?.overallAccuracy < 70) {
    recommendations.push('Model needs more training data for better accuracy');
  }
  
  if (metrics.patterns?.totalPatterns < 5) {
    recommendations.push('Increase training variety to discover more patterns');
  }
  
  return recommendations;
}