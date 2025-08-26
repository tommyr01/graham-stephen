import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { 
  createOrUpdateOutcomeTracking,
  getOutcomeTrackingByFeedback,
  getEnhancedFeedbackByUser 
} from '@/lib/feedback-database';
import { OutcomeFeedbackRequest, APIError } from '@/lib/types';
import { checkRateLimit } from '@/lib/database';

// Validation schema for outcome feedback
const outcomeFeedbackSchema = z.object({
  feedbackId: z.string().uuid(),
  outcomeData: z.object({
    contacted: z.boolean(),
    contactMethod: z.enum(['email', 'linkedin', 'phone', 'in_person', 'other']).optional(),
    responded: z.boolean(),
    responseTime: z.number().min(0).max(8760).optional(), // Max 1 year in hours
    responseQuality: z.number().min(1).max(5).optional(),
    meetingScheduled: z.boolean(),
    meetingCompleted: z.boolean().optional(),
    meetingOutcome: z.enum([
      'qualified', 'not_qualified', 'follow_up_scheduled', 
      'demo_requested', 'proposal_requested', 'no_show',
      'cancelled', 'rescheduled'
    ]).optional(),
    opportunityCreated: z.boolean(),
    opportunityValue: z.number().min(0).optional(),
    dealClosed: z.boolean().optional(),
    actualDealValue: z.number().min(0).optional(),
  }),
  retrospectiveNotes: z.string().max(1000).optional(),
  originalPredictionAccuracy: z.number().min(1).max(10).optional(),
  factorsMostPredictive: z.array(z.string()).max(10).optional(),
  factorsLeastPredictive: z.array(z.string()).max(10).optional(),
  unexpectedOutcomes: z.string().max(500).optional(),
  improvementSuggestions: z.string().max(500).optional(),
});

const outcomeQuerySchema = z.object({
  feedbackId: z.string().uuid().optional(),
  commenterId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100).optional(),
  offset: z.string().transform(val => parseInt(val)).refine(val => val >= 0).optional(),
});

/**
 * POST /api/feedback/outcome
 * Creates or updates outcome tracking data for feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(
      payload.userId,
      'outcome_tracking',
      50, // 50 requests per hour for outcome updates
      60
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate Limit Exceeded', 
          message: `Too many outcome updates. Please try again after ${rateLimitResult.resetTime.toISOString()}`,
          statusCode: 429 
        } as APIError,
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
          }
        }
      );
    }

    const body: OutcomeFeedbackRequest = await request.json();
    
    // Validate input
    const validation = outcomeFeedbackSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { feedbackId, outcomeData, retrospectiveNotes, originalPredictionAccuracy, factorsMostPredictive, factorsLeastPredictive, unexpectedOutcomes, improvementSuggestions } = validation.data;

    // Verify that the feedback belongs to the authenticated user
    const userFeedback = await getEnhancedFeedbackByUser(payload.userId, { 
      limit: 1000 // Get all to find the specific one
    });
    
    const targetFeedback = userFeedback.find(fb => fb.id === feedbackId);
    if (!targetFeedback) {
      return NextResponse.json(
        { error: 'Feedback Not Found', message: 'Feedback not found or access denied', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    // Validate business logic
    if (outcomeData.dealClosed && !outcomeData.opportunityCreated) {
      return NextResponse.json(
        { error: 'Invalid Data', message: 'Cannot close a deal without creating an opportunity first', statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    if (outcomeData.actualDealValue && !outcomeData.dealClosed) {
      return NextResponse.json(
        { error: 'Invalid Data', message: 'Cannot specify deal value without closing the deal', statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    if (outcomeData.meetingCompleted && !outcomeData.meetingScheduled) {
      return NextResponse.json(
        { error: 'Invalid Data', message: 'Cannot complete a meeting without scheduling it first', statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    // Create or update outcome tracking
    const outcomeTracking = await createOrUpdateOutcomeTracking(feedbackId, {
      commenterId: targetFeedback.commenterId!,
      userId: payload.userId,
      contacted: outcomeData.contacted,
      contactMethod: outcomeData.contactMethod,
      initialResponse: outcomeData.responded,
      responseTime: outcomeData.responseTime,
      responseQuality: outcomeData.responseQuality,
      meetingRequested: outcomeData.meetingScheduled, // Assuming requested if scheduled
      meetingScheduled: outcomeData.meetingScheduled,
      meetingCompleted: outcomeData.meetingCompleted || false,
      meetingOutcome: outcomeData.meetingOutcome,
      opportunityCreated: outcomeData.opportunityCreated,
      opportunityValue: outcomeData.opportunityValue,
      dealClosed: outcomeData.dealClosed || false,
      closeDate: outcomeData.dealClosed ? new Date().toISOString().split('T')[0] : undefined,
      actualDealValue: outcomeData.actualDealValue,
      originalPredictionAccuracy,
      factorsMostPredictive: factorsMostPredictive || [],
      factorsLeastPredictive: factorsLeastPredictive || [],
      unexpectedOutcomes,
      improvementSuggestions,
      // Set timeline dates based on outcome data
      contactDate: outcomeData.contacted ? new Date().toISOString().split('T')[0] : undefined,
      firstResponseDate: outcomeData.responded ? new Date().toISOString().split('T')[0] : undefined,
      lastInteractionDate: outcomeData.contacted ? new Date().toISOString().split('T')[0] : undefined,
      outcomeRecordedDate: new Date().toISOString().split('T')[0],
    });

    // Update the original feedback with outcome reference
    if (targetFeedback.feedbackType !== 'outcome') {
      const { updateFeedbackStatus } = await import('@/lib/feedback-database');
      await updateFeedbackStatus(feedbackId, 'processed');
    }

    // Create a follow-up outcome feedback record
    const { createEnhancedFeedback } = await import('@/lib/feedback-database');
    const outcomeFeedback = await createEnhancedFeedback({
      userId: payload.userId,
      teamId: targetFeedback.teamId,
      sessionId: targetFeedback.sessionId,
      commenterId: targetFeedback.commenterId,
      analysisId: targetFeedback.analysisId,
      feedbackType: 'outcome',
      feedbackText: retrospectiveNotes,
      outcomeData: {
        contacted: outcomeData.contacted,
        contactMethod: outcomeData.contactMethod,
        responded: outcomeData.responded,
        responseTime: outcomeData.responseTime,
        responseQuality: outcomeData.responseQuality,
        meetingScheduled: outcomeData.meetingScheduled,
        meetingCompleted: outcomeData.meetingCompleted,
        meetingOutcome: outcomeData.meetingOutcome,
        opportunityCreated: outcomeData.opportunityCreated,
        opportunityValue: outcomeData.opportunityValue,
        dealClosed: outcomeData.dealClosed,
        actualValue: outcomeData.actualDealValue,
        outcome: outcomeData.dealClosed ? 'deal_closed' : 
                 outcomeData.opportunityCreated ? 'opportunity_created' :
                 outcomeData.responded ? 'great_conversation' : 'no_response',
      },
      sourceIp: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      message: 'Outcome tracking updated successfully',
      outcomeTracking,
      outcomeFeedback,
    }, { status: 201 });

  } catch (error) {
    console.error('Outcome feedback error:', error);
    
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
        message: 'An error occurred while updating outcome tracking', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback/outcome
 * Retrieves outcome tracking data with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = outcomeQuerySchema.safeParse({
      feedbackId: searchParams.get('feedbackId'),
      commenterId: searchParams.get('commenterId'),
      sessionId: searchParams.get('sessionId'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!queryValidation.success) {
      const errors = queryValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const filters = queryValidation.data;

    // Get outcome tracking data based on filters
    let outcomeData = [];

    if (filters.feedbackId) {
      // Get specific outcome tracking by feedback ID
      const outcome = await getOutcomeTrackingByFeedback(filters.feedbackId);
      if (outcome) {
        // Verify ownership
        const userFeedback = await getEnhancedFeedbackByUser(payload.userId, { limit: 1000 });
        const ownsFeeback = userFeedback.some(fb => fb.id === filters.feedbackId);
        
        if (ownsFeeback) {
          outcomeData = [outcome];
        }
      }
    } else {
      // Get user's feedback with outcome data
      const userFeedback = await getEnhancedFeedbackByUser(payload.userId, {
        feedbackType: 'outcome',
        sessionId: filters.sessionId,
        commenterId: filters.commenterId,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      });

      // For each outcome feedback, get the detailed outcome tracking
      const outcomePromises = userFeedback
        .filter(fb => fb.feedbackType === 'outcome')
        .map(async (fb) => {
          const tracking = await getOutcomeTrackingByFeedback(fb.id);
          return {
            feedback: fb,
            tracking,
          };
        });

      const outcomes = await Promise.all(outcomePromises);
      outcomeData = outcomes.filter(outcome => outcome.tracking !== null);
    }

    // Calculate outcome analytics
    const analytics = {
      totalOutcomes: outcomeData.length,
      contactedRate: outcomeData.length > 0 
        ? (outcomeData.filter((o: any) => o.tracking?.contacted || o.feedback?.outcomeData?.contacted).length / outcomeData.length) * 100 
        : 0,
      responseRate: outcomeData.length > 0 
        ? (outcomeData.filter((o: any) => o.tracking?.initialResponse || o.feedback?.outcomeData?.responded).length / outcomeData.length) * 100 
        : 0,
      meetingRate: outcomeData.length > 0 
        ? (outcomeData.filter((o: any) => o.tracking?.meetingScheduled || o.feedback?.outcomeData?.meetingScheduled).length / outcomeData.length) * 100 
        : 0,
      opportunityRate: outcomeData.length > 0 
        ? (outcomeData.filter((o: any) => o.tracking?.opportunityCreated || o.feedback?.outcomeData?.opportunityCreated).length / outcomeData.length) * 100 
        : 0,
      conversionRate: outcomeData.length > 0 
        ? (outcomeData.filter((o: any) => o.tracking?.dealClosed || o.feedback?.outcomeData?.dealClosed).length / outcomeData.length) * 100 
        : 0,
    };

    return NextResponse.json({
      outcomes: outcomeData,
      analytics: Math.round(analytics.contactedRate * 100) / 100 >= 0 ? analytics : null,
      pagination: {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        total: outcomeData.length,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Get outcome feedback error:', error);
    
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
        message: 'An error occurred while retrieving outcome data', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}