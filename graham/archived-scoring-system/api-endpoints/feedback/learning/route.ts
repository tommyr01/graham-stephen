import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { 
  getUserPreferenceProfile,
  getTeamLearningProfile,
  getUserFeedbackAnalytics,
  getTeamFeedbackAnalytics 
} from '@/lib/feedback-database';
import { LearningStatusResponse, FeedbackAnalyticsResponse, APIError } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// Validation schema for learning status queries
const learningStatusQuerySchema = z.object({
  includeTeam: z.string().transform(val => val === 'true').optional(),
  includeAnalytics: z.string().transform(val => val === 'true').optional(),
  teamId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/feedback/learning
 * Retrieves learning status and analytics for user and optionally team
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = learningStatusQuerySchema.safeParse({
      includeTeam: searchParams.get('includeTeam'),
      includeAnalytics: searchParams.get('includeAnalytics'),
      teamId: searchParams.get('teamId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!queryValidation.success) {
      const errors = queryValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { includeTeam, includeAnalytics, teamId, startDate, endDate } = queryValidation.data;

    // Get user learning readiness data
    const { data: learningReadiness, error: readinessError } = await supabase
      .rpc('get_user_learning_readiness', { p_user_id: payload.userId });

    if (readinessError) {
      console.error('Error getting learning readiness:', readinessError);
    }

    const readinessData = learningReadiness?.[0] || {
      feedback_count: 0,
      recent_feedback_count: 0,
      learning_confidence: 0,
      ready_for_update: false,
    };

    // Get user preference profile
    const userProfile = await getUserPreferenceProfile(payload.userId, teamId);

    // Build personal learning status
    const personalLearning = {
      feedbackCount: readinessData.feedback_count,
      recentFeedbackCount: readinessData.recent_feedback_count,
      learningConfidence: readinessData.learning_confidence,
      readyForUpdate: readinessData.ready_for_update,
      lastUpdate: userProfile?.lastSignificantUpdate,
    };

    // Get team learning data if requested
    let teamLearning = null;
    let teamId_resolved = teamId;
    
    if (includeTeam || teamId) {
      // If no teamId provided, try to find user's team from their profile
      if (!teamId_resolved && userProfile?.teamId) {
        teamId_resolved = userProfile.teamId;
      }

      if (teamId_resolved) {
        const teamProfile = await getTeamLearningProfile(teamId_resolved);
        const teamAnalytics = await getTeamFeedbackAnalytics(teamId_resolved);
        
        if (teamProfile) {
          // Calculate user's contribution rank within the team
          const userContribution = teamProfile.feedbackDistribution[payload.userId];
          const allContributions = Object.values(teamProfile.feedbackDistribution)
            .map((dist: any) => dist.count)
            .sort((a, b) => b - a); // Sort descending
          
          const userRank = userContribution 
            ? allContributions.indexOf(userContribution.count) + 1 
            : teamProfile.activeMembers;

          teamLearning = {
            teamAccuracy: teamProfile.teamAccuracy,
            contributionRank: userRank,
            benefitFromTeam: teamProfile.individualVsTeamBenefit,
            teamSize: teamProfile.teamSize,
            activeMembers: teamAnalytics.activeFeedbackProviders,
            collaborationScore: teamAnalytics.collaborationScore,
          };
        }
      }
    }

    // Calculate improvement metrics
    const improvementMetrics = {
      accuracyTrend: userProfile?.accuracyTrend?.slice(-10).map(trend => trend.accuracy) || [],
      recentImprovement: userProfile?.improvementRate || 0,
      predictiveFactors: Object.keys(userProfile?.successPatterns?.keyIndicators || {}).slice(0, 5) || [],
    };

    const learningStatus: LearningStatusResponse = {
      userId: payload.userId,
      teamId: teamId_resolved,
      personalLearning,
      teamLearning,
      improvementMetrics,
    };

    // Get detailed analytics if requested
    let analytics = null;
    if (includeAnalytics) {
      const analyticsData = await getUserFeedbackAnalytics(
        payload.userId,
        startDate,
        endDate
      );

      // Calculate insights based on feedback patterns
      const insights = {
        topPerformingFactors: [] as string[],
        areasForImprovement: [] as string[],
        recommendedActions: [] as string[],
      };

      // Analyze user preferences to generate insights
      if (userProfile) {
        // Top performing factors based on success patterns
        if (userProfile.successPatterns.keyIndicators) {
          insights.topPerformingFactors = userProfile.successPatterns.keyIndicators.slice(0, 5);
        }

        // Areas for improvement based on failure patterns
        if (userProfile.failurePatterns.warningSignals) {
          insights.areasForImprovement = userProfile.failurePatterns.warningSignals.slice(0, 5);
        }

        // Generate recommended actions based on learning confidence and feedback count
        if (userProfile.learningConfidence < 0.5 && userProfile.totalFeedbackCount < 10) {
          insights.recommendedActions.push('Provide more feedback to improve algorithm accuracy');
        }
        
        if (userProfile.recentPerformance && userProfile.recentPerformance < 70) {
          insights.recommendedActions.push('Review recent feedback patterns for consistency');
        }
        
        if (teamLearning && teamLearning.contributionRank && teamLearning.contributionRank > teamLearning.teamSize / 2) {
          insights.recommendedActions.push('Increase feedback frequency to benefit from team learning');
        }

        if (personalLearning.readyForUpdate) {
          insights.recommendedActions.push('Your learning model is ready for an accuracy update');
        }
      }

      const period = {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
      };

      analytics = {
        userId: payload.userId,
        period,
        metrics: {
          totalFeedback: analyticsData.totalFeedback,
          feedbackByType: analyticsData.feedbackByType,
          averageRating: Math.round(analyticsData.averageRating * 100) / 100,
          accuracyImprovement: userProfile?.improvementRate || 0,
          responseTime: 24, // Default estimate - could be calculated from outcome data
        },
        insights,
        trends: {
          feedbackFrequency: analyticsData.feedbackTrend,
          accuracyOverTime: userProfile?.accuracyTrend?.slice(-30) || [],
        },
      } as FeedbackAnalyticsResponse;
    }

    return NextResponse.json({
      learningStatus,
      analytics,
    }, { status: 200 });

  } catch (error) {
    console.error('Get learning status error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: error.message, statusCode: 401 } as APIError,
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while retrieving learning status', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback/learning
 * Triggers learning pipeline run for user or team
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const body = await request.json();
    
    const requestSchema = z.object({
      runType: z.enum(['individual', 'team']),
      teamId: z.string().uuid().optional(),
      force: z.boolean().optional(),
    });

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { runType, teamId, force } = validation.data;

    // Validate team access if team run requested
    if (runType === 'team') {
      if (!teamId) {
        return NextResponse.json(
          { error: 'Missing Parameter', message: 'teamId is required for team learning runs', statusCode: 400 } as APIError,
          { status: 400 }
        );
      }

      // Check if user is part of the team
      const userProfile = await getUserPreferenceProfile(payload.userId, teamId);
      if (!userProfile) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'User is not part of the specified team', statusCode: 403 } as APIError,
          { status: 403 }
        );
      }
    }

    // Check if learning update is needed (unless forced)
    if (!force) {
      const { data: learningReadiness } = await supabase
        .rpc('get_user_learning_readiness', { p_user_id: payload.userId });

      const readinessData = learningReadiness?.[0];
      if (!readinessData?.ready_for_update) {
        return NextResponse.json(
          { 
            error: 'Learning Not Ready', 
            message: 'Not enough new feedback to warrant a learning update. Use force=true to override.', 
            statusCode: 400,
            details: {
              feedbackCount: readinessData?.feedback_count || 0,
              recentFeedbackCount: readinessData?.recent_feedback_count || 0,
              minimumRequired: 3,
            }
          } as APIError,
          { status: 400 }
        );
      }
    }

    // Get pending feedback for processing
    const { getEnhancedFeedbackByUser } = await import('@/lib/feedback-database');
    const pendingFeedback = await getEnhancedFeedbackByUser(payload.userId, {
      feedbackStatus: 'pending',
      limit: 100,
    });

    if (pendingFeedback.length === 0 && !force) {
      return NextResponse.json(
        { error: 'No Pending Feedback', message: 'No pending feedback found for processing', statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    // Create learning pipeline run
    const { createLearningPipelineRun } = await import('@/lib/feedback-database');
    const pipelineRun = await createLearningPipelineRun({
      runType,
      userId: runType === 'individual' ? payload.userId : undefined,
      teamId: runType === 'team' ? teamId : undefined,
      feedbackIds: pendingFeedback.map(fb => fb.id),
      stage: 'collecting',
    });

    // In a real implementation, this would trigger the actual learning pipeline
    // For now, we'll simulate the process by updating the run status
    const { updateLearningPipelineRun } = await import('@/lib/feedback-database');
    
    // Simulate processing stages
    setTimeout(async () => {
      try {
        await updateLearningPipelineRun(pipelineRun.id, {
          stage: 'processing',
          newPatternsDiscovered: Math.floor(Math.random() * 5) + 1,
          patternsUpdated: Math.floor(Math.random() * 3) + 1,
        });

        // Mark feedback as processed
        const { updateFeedbackStatus } = await import('@/lib/feedback-database');
        for (const feedback of pendingFeedback) {
          await updateFeedbackStatus(feedback.id, 'processed');
        }

        // Complete the run
        await updateLearningPipelineRun(pipelineRun.id, {
          stage: 'deploying',
          completedAt: new Date().toISOString(),
          isSuccessful: true,
          actualAccuracy: Math.random() * 20 + 70, // Simulate accuracy between 70-90%
        });

      } catch (error) {
        console.error('Error in simulated learning pipeline:', error);
      }
    }, 1000); // Simulate 1 second processing time

    return NextResponse.json({
      message: 'Learning pipeline run initiated successfully',
      pipelineRun: {
        id: pipelineRun.id,
        runType: pipelineRun.runType,
        stage: pipelineRun.stage,
        feedbackCount: pipelineRun.feedbackCount,
        startedAt: pipelineRun.startedAt,
      },
    }, { status: 202 }); // 202 Accepted for async processing

  } catch (error) {
    console.error('Learning pipeline initiation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: error.message, statusCode: 401 } as APIError,
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while initiating learning pipeline', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}