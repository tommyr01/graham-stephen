/**
 * Learning Loop Test API Endpoint
 * Tests and validates the learning loop functionality
 * Voice feedback on Profile A should improve analysis of Profile B
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import SessionLearningManager from '@/lib/services/session-learning-manager';

// Test learning loop schema
const LearningLoopTestSchema = z.object({
  sessionId: z.string().uuid(),
  profileA: z.object({
    url: z.string().url(),
    data: z.record(z.any()),
    voiceFeedback: z.string().min(1)
  }),
  profileB: z.object({
    url: z.string().url(),
    data: z.record(z.any())
  }),
  testContext: z.record(z.any()).optional()
});

// Global session learning manager instance
const sessionLearningManager = new SessionLearningManager();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = LearningLoopTestSchema.parse(body);

    const testResults = {
      sessionId: validatedData.sessionId,
      testSteps: [],
      learningEvidence: {},
      performance: {},
      success: false,
      summary: ''
    };

    try {
      const startTime = Date.now();

      // Step 1: Initialize session learning
      await sessionLearningManager.initializeSession(validatedData.sessionId, user.id);
      testResults.testSteps.push({
        step: 1,
        action: 'Initialize session learning',
        status: 'completed',
        timestamp: new Date()
      });

      // Step 2: Generate baseline analysis for Profile B (before learning)
      const baselineAnalysis = await generateMockAnalysis(validatedData.profileB.data);
      testResults.testSteps.push({
        step: 2,
        action: 'Generate baseline analysis for Profile B',
        status: 'completed',
        baseline_confidence: baselineAnalysis.confidence_score,
        timestamp: new Date()
      });

      // Step 3: Create feedback interaction for Profile A
      const feedbackInteraction = await createTestFeedbackInteraction(
        supabase,
        user.id,
        validatedData.sessionId,
        validatedData.profileA.voiceFeedback,
        validatedData.profileA.data
      );
      
      testResults.testSteps.push({
        step: 3,
        action: 'Create feedback interaction for Profile A',
        status: 'completed',
        interaction_id: feedbackInteraction.id,
        timestamp: new Date()
      });

      // Step 4: Process voice feedback and extract patterns
      const extractedPatterns = await sessionLearningManager.processVoiceFeedback(
        validatedData.sessionId,
        feedbackInteraction,
        validatedData.profileA.url,
        validatedData.profileA.data
      );

      testResults.testSteps.push({
        step: 4,
        action: 'Process voice feedback and extract patterns',
        status: 'completed',
        patterns_extracted: extractedPatterns.length,
        patterns: extractedPatterns.map(p => ({
          type: p.pattern_type,
          confidence: p.confidence_score
        })),
        timestamp: new Date()
      });

      // Step 5: Apply patterns to Profile B analysis
      const {
        enhancedAnalysis,
        learningImpact,
        applicationsApplied
      } = await sessionLearningManager.applyPatternsToProfile(
        validatedData.sessionId,
        validatedData.profileB.url,
        baselineAnalysis
      );

      const processingTime = Date.now() - startTime;

      testResults.testSteps.push({
        step: 5,
        action: 'Apply patterns to Profile B analysis',
        status: 'completed',
        patterns_applied: applicationsApplied.length,
        confidence_improvement: learningImpact.confidence_improvement,
        timestamp: new Date()
      });

      // Step 6: Calculate learning effectiveness
      const learningMetrics = calculateLearningEffectiveness(
        baselineAnalysis,
        enhancedAnalysis,
        learningImpact,
        extractedPatterns,
        applicationsApplied
      );

      testResults.testSteps.push({
        step: 6,
        action: 'Calculate learning effectiveness',
        status: 'completed',
        effectiveness_score: learningMetrics.effectiveness_score,
        timestamp: new Date()
      });

      // Compile learning evidence
      testResults.learningEvidence = {
        baseline_analysis: {
          confidence_score: baselineAnalysis.confidence_score,
          relevance_score: baselineAnalysis.relevance_score
        },
        enhanced_analysis: {
          confidence_score: enhancedAnalysis.confidence_score,
          relevance_score: enhancedAnalysis.relevance_score
        },
        learning_impact: learningImpact,
        patterns_discovered: extractedPatterns.length,
        patterns_applied: applicationsApplied.length,
        confidence_improvement: learningImpact.confidence_improvement,
        improvement_percentage: Math.round(learningImpact.confidence_improvement * 100),
        session_metrics: sessionLearningManager.getSessionMetrics(validatedData.sessionId)
      };

      // Performance metrics
      testResults.performance = {
        total_processing_time_ms: processingTime,
        target_latency_ms: 200,
        latency_status: processingTime < 200 ? 'excellent' : processingTime < 400 ? 'good' : 'needs_optimization',
        patterns_per_second: extractedPatterns.length / (processingTime / 1000),
        learning_efficiency: learningMetrics.effectiveness_score / (processingTime / 1000)
      };

      // Determine test success
      const targetImprovement = 0.15; // 15% improvement target
      testResults.success = learningImpact.confidence_improvement >= targetImprovement;

      // Generate summary
      testResults.summary = generateTestSummary(testResults, learningMetrics, targetImprovement);

      console.log(`Learning loop test completed: ${testResults.success ? 'PASSED' : 'FAILED'} - ${Math.round(learningImpact.confidence_improvement * 100)}% improvement in ${processingTime}ms`);

      return NextResponse.json({
        success: true,
        data: testResults
      });

    } catch (error) {
      console.error('Learning loop test error:', error);
      testResults.testSteps.push({
        step: 'error',
        action: 'Test execution failed',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      return NextResponse.json(
        { 
          error: 'Learning loop test failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          partial_results: testResults
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Learning loop test API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// Helper functions

async function createTestFeedbackInteraction(
  supabase: any,
  userId: string,
  sessionId: string,
  voiceFeedback: string,
  profileData: any
) {
  const feedbackData = {
    voice_feedback: true,
    transcript: voiceFeedback,
    confidence: 0.9,
    language: 'en-US',
    recording_duration: voiceFeedback.length * 0.5, // Estimate based on text length
    context_type: 'test_feedback',
    voice_analysis: {}
  };

  const contextData = {
    profileData,
    test_context: true,
    collection_timestamp: new Date().toISOString()
  };

  const { data: interaction, error } = await supabase
    .from('feedback_interactions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      interaction_type: 'explicit_rating',
      feedback_data: feedbackData,
      context_data: contextData,
      voice_transcript: voiceFeedback,
      voice_confidence: 0.9,
      voice_language: 'en-US',
      voice_recording_duration: voiceFeedback.length * 0.5,
      voice_edited: false,
      speech_recognition_used: true,
      collection_method: 'test',
      ui_component: 'learning_loop_test',
      learning_value: 0.9,
      feedback_timestamp: new Date(),
      processed: false
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create test feedback interaction: ${error.message}`);
  }

  return interaction;
}

async function generateMockAnalysis(profileData: any) {
  // Generate a realistic baseline analysis
  const baselineConfidence = 0.5 + Math.random() * 0.2; // 0.5 to 0.7
  const baselineRelevance = 0.4 + Math.random() * 0.3; // 0.4 to 0.7

  return {
    confidence_score: baselineConfidence,
    relevance_score: baselineRelevance,
    industry: profileData.industry || 'Unknown',
    current_role: profileData.current_role || 'Unknown',
    company_size: profileData.company_size || 'Unknown',
    years_experience: profileData.years_experience || 0,
    analysis_timestamp: new Date().toISOString(),
    baseline: true
  };
}

function calculateLearningEffectiveness(
  baseline: any,
  enhanced: any,
  learningImpact: any,
  patterns: any[],
  applications: any[]
) {
  const confidenceImprovement = enhanced.confidence_score - baseline.confidence_score;
  const relevanceImprovement = (enhanced.relevance_score || 0.5) - (baseline.relevance_score || 0.5);
  
  // Calculate effectiveness score (0-1)
  const patternQuality = patterns.length > 0 ? 
    patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length : 0;
  
  const applicationSuccess = applications.length > 0 ?
    applications.filter(a => a.applied).length / applications.length : 0;

  const effectivenessScore = Math.min(1, 
    (confidenceImprovement * 2) + // Weight confidence highly
    (relevanceImprovement * 1.5) + // Weight relevance moderately
    (patternQuality * 0.5) + // Pattern quality contribution
    (applicationSuccess * 0.3) // Application success contribution
  );

  return {
    effectiveness_score: effectivenessScore,
    confidence_improvement: confidenceImprovement,
    relevance_improvement: relevanceImprovement,
    pattern_quality: patternQuality,
    application_success_rate: applicationSuccess,
    meets_target: confidenceImprovement >= 0.15,
    learning_strength: learningImpact.learning_strength || 0
  };
}

function generateTestSummary(testResults: any, learningMetrics: any, targetImprovement: number): string {
  const improvement = testResults.learningEvidence.confidence_improvement;
  const improvementPercent = Math.round(improvement * 100);
  const targetPercent = Math.round(targetImprovement * 100);
  
  if (testResults.success) {
    return `✅ LEARNING LOOP TEST PASSED: Voice feedback on Profile A improved Profile B analysis by ${improvementPercent}% (target: ${targetPercent}%). ` +
           `Extracted ${testResults.learningEvidence.patterns_discovered} patterns, applied ${testResults.learningEvidence.patterns_applied} patterns. ` +
           `Processing completed in ${testResults.performance.total_processing_time_ms}ms with ${testResults.performance.latency_status} performance.`;
  } else {
    return `❌ LEARNING LOOP TEST FAILED: Voice feedback on Profile A improved Profile B analysis by only ${improvementPercent}% (target: ${targetPercent}%). ` +
           `Need stronger pattern extraction or better pattern application. ` +
           `Extracted ${testResults.learningEvidence.patterns_discovered} patterns, applied ${testResults.learningEvidence.patterns_applied} patterns.`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        endpoint: 'Learning Loop Test',
        description: 'Tests the learning loop functionality where voice feedback on Profile A improves analysis of Profile B',
        usage: {
          method: 'POST',
          required_fields: ['sessionId', 'profileA', 'profileB'],
          example: {
            sessionId: '123e4567-e89b-12d3-a456-426614174000',
            profileA: {
              url: 'https://linkedin.com/in/profile-a',
              data: { industry: 'tech', current_role: 'engineer' },
              voiceFeedback: 'This profile looks very relevant for our tech team'
            },
            profileB: {
              url: 'https://linkedin.com/in/profile-b',
              data: { industry: 'tech', current_role: 'senior engineer' }
            }
          }
        },
        success_criteria: {
          target_improvement: '15%',
          target_latency: '<200ms',
          required_patterns: '>=1'
        }
      }
    });

  } catch (error) {
    console.error('Learning loop test GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}