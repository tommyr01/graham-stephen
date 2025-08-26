/**
 * Training Decision API Endpoint
 * POST /api/v2/training/decision
 * Captures Graham's training decisions for AI learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Request validation schema
const TrainingDecisionSchema = z.object({
  prospectId: z.string().min(1), // Allow any non-empty string ID
  decision: z.enum(['contact', 'skip']),
  confidence: z.number().min(1).max(10),
  decisionTime: z.number().positive(), // milliseconds
  voiceNote: z.object({
    transcription: z.string(),
    keyPoints: z.array(z.string()).optional()
  }).optional(),
  prospectSnapshot: z.any(), // JSONB - full prospect data at time of decision
  systemScore: z.number().optional(),
  sessionContext: z.object({
    trainingModeEnabled: z.boolean().default(true),
    pageUrl: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validatedData = TrainingDecisionSchema.parse(body);
    
    // Store training decision
    const trainingDecision = await storeTrainingDecision(validatedData);
    
    // Process for immediate learning (async)
    processImmediateLearning(trainingDecision.id).catch(error => {
      console.error('Immediate learning processing failed:', error);
    });
    
    return NextResponse.json({
      success: true,
      data: {
        decisionId: trainingDecision.id,
        prospectId: validatedData.prospectId,
        decision: validatedData.decision,
        confidence: validatedData.confidence,
        timestamp: trainingDecision.created_at,
        learningTriggered: true
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Training decision storage failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to store training decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function storeTrainingDecision(data: z.infer<typeof TrainingDecisionSchema>) {
  try {
    const { data: result, error } = await supabase
      .from('training_decisions')
      .insert({
        prospect_id: data.prospectId,
        decision: data.decision,
        confidence: data.confidence,
        decision_time_ms: data.decisionTime,
        voice_transcription: data.voiceNote?.transcription,
        voice_key_points: data.voiceNote?.keyPoints,
        prospect_snapshot: data.prospectSnapshot,
        system_score: data.systemScore
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to store training decision:', error);
    throw error;
  }
}

async function processImmediateLearning(decisionId: string) {
  try {
    // Get the training decision
    const { data: decision, error } = await supabase
      .from('training_decisions')
      .select('*')
      .eq('id', decisionId)
      .single();

    if (error || !decision) {
      throw new Error('Training decision not found');
    }

    // Extract patterns from this decision
    await extractPatternsFromDecision(decision);
    
    // Update pattern strengths based on this decision
    await updatePatternStrengths(decision);
    
    // Log learning progress
    await logLearningProgress(decisionId);
    
  } catch (error) {
    console.error('Immediate learning processing failed:', error);
    // Don't throw - this is async processing that shouldn't affect the API response
  }
}

async function extractPatternsFromDecision(decision: any) {
  try {
    const snapshot = decision.prospect_snapshot;
    const patterns = [];

    // Extract content authenticity patterns
    if (snapshot.contentAnalysis) {
      const avgAuthenticity = snapshot.contentAnalysis.reduce((sum: number, analysis: any) => 
        sum + analysis.authenticityScore, 0) / snapshot.contentAnalysis.length;
      
      if (avgAuthenticity < 5 && decision.decision === 'skip') {
        patterns.push({
          pattern_type: 'content_authenticity',
          trigger_conditions: { 
            field: 'avgAuthenticity',
            operator: 'less_than',
            value: 5,
            weight: 1.0
          },
          expected_outcome: 'skip',
          confidence: 0.7,
          supporting_decisions: [decision.id],
          contextual_modifiers: {
            minPostsRequired: snapshot.contentAnalysis.length
          }
        });
      }
    }

    // Extract experience patterns
    if (snapshot.experienceAnalysis) {
      const yearsInIndustry = snapshot.experienceAnalysis.details?.yearsInIndustry || 0;
      
      if (yearsInIndustry >= 10 && decision.decision === 'contact') {
        patterns.push({
          pattern_type: 'experience_threshold',
          trigger_conditions: {
            field: 'yearsInIndustry',
            operator: 'greater_than_equal',
            value: 10,
            weight: 1.0
          },
          expected_outcome: 'contact',
          confidence: 0.9,
          supporting_decisions: [decision.id],
          contextual_modifiers: {
            industryType: 'M&A'
          }
        });
      } else if (yearsInIndustry < 3 && decision.decision === 'skip') {
        patterns.push({
          pattern_type: 'experience_threshold',
          trigger_conditions: {
            field: 'yearsInIndustry',
            operator: 'less_than',
            value: 3,
            weight: 1.0
          },
          expected_outcome: 'skip',
          confidence: 0.8,
          supporting_decisions: [decision.id],
          contextual_modifiers: {
            industryType: 'M&A'
          }
        });
      }
    }

    // Extract red flag patterns
    if (snapshot.redFlags && snapshot.redFlags.length > 0 && decision.decision === 'skip') {
      patterns.push({
        pattern_type: 'red_flag_detection',
        trigger_conditions: {
          field: 'redFlagCount',
          operator: 'greater_than',
          value: 0,
          weight: 1.0
        },
        expected_outcome: 'skip',
        confidence: 0.85,
        supporting_decisions: [decision.id],
        contextual_modifiers: {
          detectedFlags: snapshot.redFlags
        }
      });
    }

    // Store discovered patterns
    for (const pattern of patterns) {
      await upsertPattern(pattern);
    }

  } catch (error) {
    console.error('Pattern extraction failed:', error);
  }
}

async function upsertPattern(patternData: any) {
  try {
    // Check if similar pattern already exists
    const { data: existingPatterns, error: searchError } = await supabase
      .from('decision_patterns')
      .select('*')
      .eq('pattern_type', patternData.pattern_type)
      .eq('expected_outcome', patternData.expected_outcome);

    if (searchError) {
      throw searchError;
    }

    // Find matching pattern based on trigger conditions
    const matchingPattern = existingPatterns?.find(pattern => 
      JSON.stringify(pattern.trigger_conditions) === JSON.stringify(patternData.trigger_conditions)
    );

    if (matchingPattern) {
      // Update existing pattern
      const updatedSupportingDecisions = [
        ...matchingPattern.supporting_decisions,
        ...patternData.supporting_decisions
      ];

      await supabase
        .from('decision_patterns')
        .update({
          supporting_decisions: updatedSupportingDecisions,
          usage_count: matchingPattern.usage_count + 1,
          confidence: Math.min(1.0, matchingPattern.confidence + 0.01),
          last_validated_at: new Date().toISOString()
        })
        .eq('id', matchingPattern.id);
    } else {
      // Insert new pattern
      await supabase
        .from('decision_patterns')
        .insert({
          pattern_type: patternData.pattern_type,
          trigger_conditions: patternData.trigger_conditions,
          expected_outcome: patternData.expected_outcome,
          confidence: patternData.confidence,
          supporting_decisions: patternData.supporting_decisions,
          contradictory_decisions: [],
          strength_score: 0.5,
          usage_count: 1,
          accuracy_rate: 0.0,
          contextual_modifiers: patternData.contextual_modifiers,
          time_based_factors: {}
        });
    }
  } catch (error) {
    console.error('Pattern upsert failed:', error);
  }
}

async function updatePatternStrengths(decision: any) {
  try {
    // Get all patterns that might apply to this decision
    const { data: patterns, error } = await supabase
      .from('decision_patterns')
      .select('*');

    if (error || !patterns) return;

    for (const pattern of patterns) {
      const patternApplies = evaluatePatternMatch(decision.prospect_snapshot, pattern);
      
      if (patternApplies) {
        const isCorrectPrediction = pattern.expected_outcome === decision.decision;
        
        if (isCorrectPrediction) {
          // Pattern was correct - increase confidence
          await supabase
            .from('decision_patterns')
            .update({
              confidence: Math.min(1.0, pattern.confidence + 0.02),
              accuracy_rate: calculateUpdatedAccuracy(pattern.id, true),
              usage_count: pattern.usage_count + 1,
              last_validated_at: new Date().toISOString()
            })
            .eq('id', pattern.id);
        } else {
          // Pattern was wrong - decrease confidence
          await supabase
            .from('decision_patterns')
            .update({
              confidence: Math.max(0.0, pattern.confidence - 0.03),
              accuracy_rate: calculateUpdatedAccuracy(pattern.id, false),
              contradictory_decisions: [...pattern.contradictory_decisions, decision.id],
              last_validated_at: new Date().toISOString()
            })
            .eq('id', pattern.id);
        }
      }
    }
  } catch (error) {
    console.error('Pattern strength update failed:', error);
  }
}

function evaluatePatternMatch(prospectSnapshot: any, pattern: any): boolean {
  try {
    const conditions = pattern.trigger_conditions;
    
    // Simple evaluation - in production this would be more sophisticated
    switch (conditions.field) {
      case 'avgAuthenticity':
        const avgAuth = prospectSnapshot.contentAnalysis?.reduce((sum: number, analysis: any) => 
          sum + analysis.authenticityScore, 0) / (prospectSnapshot.contentAnalysis?.length || 1);
        return conditions.operator === 'less_than' ? avgAuth < conditions.value : avgAuth >= conditions.value;
        
      case 'yearsInIndustry':
        const years = prospectSnapshot.experienceAnalysis?.details?.yearsInIndustry || 0;
        return conditions.operator === 'greater_than_equal' ? years >= conditions.value : years < conditions.value;
        
      case 'redFlagCount':
        const flagCount = prospectSnapshot.redFlags?.length || 0;
        return conditions.operator === 'greater_than' ? flagCount > conditions.value : flagCount <= conditions.value;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Pattern evaluation failed:', error);
    return false;
  }
}

async function calculateUpdatedAccuracy(patternId: string, wasCorrect: boolean): Promise<number> {
  try {
    const { data } = await supabase.rpc('update_pattern_accuracy', { 
      pattern_id: patternId 
    });
    return data || 0.0;
  } catch (error) {
    console.error('Accuracy calculation failed:', error);
    return 0.0;
  }
}

async function logLearningProgress(decisionId: string) {
  try {
    // Log that learning occurred for this decision
    await supabase
      .from('learning_metrics')
      .insert({
        metric_type: 'training_decision',
        metric_name: 'decision_processed',
        metric_value: 1,
        time_window: '24h',
        model_version: 'v2.0'
      });
  } catch (error) {
    console.error('Learning progress logging failed:', error);
  }
}