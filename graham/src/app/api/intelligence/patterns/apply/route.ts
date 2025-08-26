/**
 * Pattern Application API Endpoint
 * Applies learned patterns to improve profile analysis accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import SessionLearningManager from '@/lib/services/session-learning-manager';

// Pattern application schema
const PatternApplicationSchema = z.object({
  sessionId: z.string().uuid(),
  profileUrl: z.string().url(),
  baseAnalysis: z.record(z.any()),
  analysisContext: z.record(z.any()).optional(),
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
    const validatedData = PatternApplicationSchema.parse(body);

    try {
      // Initialize session learning if not already done
      await sessionLearningManager.initializeSession(validatedData.sessionId, user.id);

      // Apply learned patterns to the profile analysis
      const startTime = Date.now();
      const {
        enhancedAnalysis,
        learningImpact,
        applicationsApplied
      } = await sessionLearningManager.applyPatternsToProfile(
        validatedData.sessionId,
        validatedData.profileUrl,
        validatedData.baseAnalysis
      );
      const processingTime = Date.now() - startTime;

      // Get current session metrics
      const sessionMetrics = sessionLearningManager.getSessionMetrics(validatedData.sessionId);

      console.log(`Applied patterns for profile ${validatedData.profileUrl}: ${applicationsApplied.length} patterns applied, ${Math.round(learningImpact.confidence_improvement * 100)}% improvement in ${processingTime}ms`);

      return NextResponse.json({
        success: true,
        data: {
          originalAnalysis: validatedData.baseAnalysis,
          enhancedAnalysis,
          learningImpact: {
            patterns_applied: learningImpact.patterns_applied,
            confidence_improvement: learningImpact.confidence_improvement,
            before_confidence: learningImpact.before_confidence,
            after_confidence: learningImpact.after_confidence,
            learning_strength: learningImpact.learning_strength,
            improvement_percentage: Math.round(learningImpact.confidence_improvement * 100)
          },
          applicationsApplied: applicationsApplied.map(app => ({
            pattern_type: app.pattern_id.includes('existing_') ? 'validated_pattern' : 'session_pattern',
            confidence_delta: app.confidence_delta,
            accuracy_improvement: app.accuracy_improvement,
            application_reason: app.application_reason,
            applied: app.applied
          })),
          sessionMetrics,
          processingMetrics: {
            processing_time_ms: processingTime,
            target_latency_ms: 200,
            performance_status: processingTime < 200 ? 'excellent' : processingTime < 400 ? 'good' : 'needs_optimization'
          }
        }
      });

    } catch (error) {
      console.error('Pattern application error:', error);
      return NextResponse.json(
        { 
          error: 'Pattern application failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          fallback: {
            enhancedAnalysis: validatedData.baseAnalysis,
            learningImpact: {
              patterns_applied: 0,
              confidence_improvement: 0,
              learning_active: false
            }
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Pattern application API error:', error);
    
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

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const action = url.searchParams.get('action') || 'metrics';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'metrics':
        return await getSessionMetrics(sessionId);
      
      case 'patterns':
        return await getSessionPatterns(sessionId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: metrics, patterns' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Pattern application GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSessionMetrics(sessionId: string) {
  try {
    const metrics = sessionLearningManager.getSessionMetrics(sessionId);
    
    if (!metrics) {
      return NextResponse.json(
        { error: 'Session not found or not initialized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionMetrics: metrics,
        learningStatus: {
          isActive: metrics.patterns_discovered > 0 || metrics.patterns_applied > 0,
          effectiveness: metrics.learning_effectiveness,
          recommendations: generateLearningRecommendations(metrics)
        }
      }
    });
  } catch (error) {
    throw new Error(`Failed to get session metrics: ${error.message}`);
  }
}

async function getSessionPatterns(sessionId: string) {
  try {
    const patterns = sessionLearningManager.getSessionPatterns(sessionId);
    
    return NextResponse.json({
      success: true,
      data: {
        patterns: patterns.map(pattern => ({
          id: pattern.id,
          type: pattern.pattern_type,
          confidence: pattern.confidence_score,
          source_profile: pattern.source_profile_url,
          created_at: pattern.created_at,
          isSessionPattern: !pattern.id.includes('existing_'),
          summary: generatePatternSummary(pattern)
        })),
        totalPatterns: patterns.length,
        highConfidencePatterns: patterns.filter(p => p.confidence_score >= 0.8).length
      }
    });
  } catch (error) {
    throw new Error(`Failed to get session patterns: ${error.message}`);
  }
}

function generateLearningRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.patterns_discovered === 0) {
    recommendations.push('Provide feedback on profile analyses to start building learning patterns');
  }

  if (metrics.patterns_applied === 0 && metrics.patterns_discovered > 0) {
    recommendations.push('Continue analyzing similar profiles to see pattern applications');
  }

  if (metrics.average_confidence_boost < 0.05) {
    recommendations.push('Provide more specific feedback to improve learning effectiveness');
  }

  if (metrics.learning_effectiveness === 'high') {
    recommendations.push('Your feedback is generating strong learning patterns - keep it up!');
  }

  if (metrics.session_duration_minutes > 60) {
    recommendations.push('Consider saving valuable patterns for future sessions');
  }

  return recommendations;
}

function generatePatternSummary(pattern: any): string {
  switch (pattern.pattern_type) {
    case 'industry_preference':
      return `Prefers ${pattern.pattern_data.preferred_industry} industry profiles`;
    
    case 'role_preference':
      return `Shows interest in ${pattern.pattern_data.preferred_role} roles`;
    
    case 'company_size_preference':
      return `Favors ${pattern.pattern_data.preferred_size} company sizes`;
    
    case 'industry_avoidance':
      return `Avoids ${pattern.pattern_data.avoided_industry} industry profiles`;
    
    default:
      return `${pattern.pattern_type} pattern with ${Math.round(pattern.confidence_score * 100)}% confidence`;
  }
}