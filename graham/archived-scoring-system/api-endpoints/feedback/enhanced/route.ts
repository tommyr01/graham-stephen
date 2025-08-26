import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { 
  createEnhancedFeedback, 
  getEnhancedFeedbackByUser,
  getUserFeedbackAnalytics 
} from '@/lib/feedback-database';
import { 
  BinaryFeedbackRequest, 
  DetailedFeedbackRequest, 
  BulkFeedbackRequest,
  APIError,
  FeedbackType 
} from '@/lib/types';
import { checkRateLimit } from '@/lib/database';

// Validation schemas for different feedback types
const binaryFeedbackSchema = z.object({
  sessionId: z.string().uuid().optional(),
  commenterId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  isRelevant: z.boolean(),
  confidenceScore: z.number().min(0).max(1).optional(),
  notes: z.string().max(500).optional(),
});

const detailedFeedbackSchema = z.object({
  sessionId: z.string().uuid().optional(),
  commenterId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  overallRating: z.number().min(1).max(10),
  factorRatings: z.object({
    contentRelevance: z.number().min(1).max(5).optional(),
    professionalFit: z.number().min(1).max(5).optional(),
    timing: z.number().min(1).max(5).optional(),
    companyMatch: z.number().min(1).max(5).optional(),
    roleMatch: z.number().min(1).max(5).optional(),
  }).optional(),
  correctionFlags: z.array(z.string()).optional(),
  feedbackText: z.string().max(1000).optional(),
  improvementSuggestions: z.string().max(1000).optional(),
});

const bulkFeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  feedback: z.array(z.object({
    commenterId: z.string().uuid(),
    isRelevant: z.boolean(),
    rating: z.number().min(1).max(10).optional(),
    notes: z.string().max(200).optional(),
  })).min(1).max(50), // Limit bulk operations to prevent abuse
});

const feedbackQuerySchema = z.object({
  feedbackType: z.enum(['binary', 'detailed', 'outcome', 'bulk', 'implicit']).optional(),
  feedbackStatus: z.enum(['pending', 'processed', 'incorporated', 'rejected']).optional(),
  sessionId: z.string().uuid().optional(),
  commenterId: z.string().uuid().optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100).optional(),
  offset: z.string().transform(val => parseInt(val)).refine(val => val >= 0).optional(),
});

/**
 * POST /api/feedback/enhanced
 * Creates enhanced feedback with comprehensive data collection
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(
      payload.userId,
      'feedback_submission',
      100, // 100 requests per hour
      60
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate Limit Exceeded', 
          message: `Too many feedback submissions. Please try again after ${rateLimitResult.resetTime.toISOString()}`,
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

    const body = await request.json();
    const feedbackType: FeedbackType = body.feedbackType || 'binary';

    // Validate based on feedback type
    let validatedData: any;
    let additionalData: any = {};

    switch (feedbackType) {
      case 'binary':
        const binaryValidation = binaryFeedbackSchema.safeParse(body);
        if (!binaryValidation.success) {
          const errors = binaryValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          return NextResponse.json(
            { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
            { status: 400 }
          );
        }
        validatedData = binaryValidation.data;
        additionalData = {
          isRelevant: validatedData.isRelevant,
          confidenceScore: validatedData.confidenceScore,
          feedbackText: validatedData.notes,
        };
        break;

      case 'detailed':
        const detailedValidation = detailedFeedbackSchema.safeParse(body);
        if (!detailedValidation.success) {
          const errors = detailedValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          return NextResponse.json(
            { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
            { status: 400 }
          );
        }
        validatedData = detailedValidation.data;
        additionalData = {
          overallRating: validatedData.overallRating,
          factorRatings: validatedData.factorRatings,
          correctionFlags: validatedData.correctionFlags,
          feedbackText: validatedData.feedbackText,
          improvementSuggestions: validatedData.improvementSuggestions,
        };
        break;

      case 'bulk':
        const bulkValidation = bulkFeedbackSchema.safeParse(body);
        if (!bulkValidation.success) {
          const errors = bulkValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          return NextResponse.json(
            { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
            { status: 400 }
          );
        }
        
        // Process bulk feedback as multiple individual feedback entries
        const bulkResults = [];
        for (const feedbackItem of bulkValidation.data.feedback) {
          try {
            const bulkFeedback = await createEnhancedFeedback({
              userId: payload.userId,
              teamId: body.teamId,
              sessionId: bulkValidation.data.sessionId,
              commenterId: feedbackItem.commenterId,
              analysisId: body.analysisId,
              feedbackType: 'bulk',
              isRelevant: feedbackItem.isRelevant,
              overallRating: feedbackItem.rating,
              feedbackText: feedbackItem.notes,
              sourceIp: request.ip,
              userAgent: request.headers.get('user-agent') || undefined,
              deviceInfo: {
                platform: request.headers.get('sec-ch-ua-platform') || 'unknown',
                mobile: request.headers.get('sec-ch-ua-mobile') === '?1',
              },
            });
            bulkResults.push(bulkFeedback);
          } catch (error) {
            console.error(`Error processing bulk feedback item for commenter ${feedbackItem.commenterId}:`, error);
            // Continue processing other items even if one fails
          }
        }

        return NextResponse.json({
          message: 'Bulk feedback submitted successfully',
          processedCount: bulkResults.length,
          totalCount: bulkValidation.data.feedback.length,
          feedback: bulkResults,
        }, { status: 201 });

      default:
        return NextResponse.json(
          { error: 'Invalid Feedback Type', message: 'Unsupported feedback type', statusCode: 400 } as APIError,
          { status: 400 }
        );
    }

    // Verify ownership of session/commenter if provided
    if (validatedData.sessionId || validatedData.commenterId) {
      const { supabase } = await import('@/lib/supabase');
      
      if (validatedData.sessionId) {
        const { data: session, error: sessionError } = await supabase
          .from('research_sessions')
          .select('user_id')
          .eq('id', validatedData.sessionId)
          .single();

        if (sessionError || !session || session.user_id !== payload.userId) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Access denied to this session', statusCode: 403 } as APIError,
            { status: 403 }
          );
        }
      }

      if (validatedData.commenterId && validatedData.sessionId) {
        const { data: commenter, error: commenterError } = await supabase
          .from('commenters')
          .select('session_id')
          .eq('id', validatedData.commenterId)
          .single();

        if (commenterError || !commenter || commenter.session_id !== validatedData.sessionId) {
          return NextResponse.json(
            { error: 'Invalid Reference', message: 'Commenter does not belong to the specified session', statusCode: 400 } as APIError,
            { status: 400 }
          );
        }
      }
    }

    // Create enhanced feedback
    const feedback = await createEnhancedFeedback({
      userId: payload.userId,
      teamId: body.teamId,
      sessionId: validatedData.sessionId,
      commenterId: validatedData.commenterId,
      analysisId: validatedData.analysisId || body.analysisId,
      feedbackType,
      sourceIp: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
      deviceInfo: {
        platform: request.headers.get('sec-ch-ua-platform') || 'unknown',
        mobile: request.headers.get('sec-ch-ua-mobile') === '?1',
      },
      ...additionalData,
    });

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      feedback,
    }, { status: 201 });

  } catch (error) {
    console.error('Enhanced feedback submission error:', error);
    
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
        message: 'An error occurred while submitting feedback', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback/enhanced
 * Retrieves user feedback with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = feedbackQuerySchema.safeParse({
      feedbackType: searchParams.get('feedbackType'),
      feedbackStatus: searchParams.get('feedbackStatus'),
      sessionId: searchParams.get('sessionId'),
      commenterId: searchParams.get('commenterId'),
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

    // Verify session ownership if sessionId is provided
    if (filters.sessionId) {
      const { supabase } = await import('@/lib/supabase');
      const { data: session, error: sessionError } = await supabase
        .from('research_sessions')
        .select('user_id')
        .eq('id', filters.sessionId)
        .single();

      if (sessionError || !session || session.user_id !== payload.userId) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Access denied to this session', statusCode: 403 } as APIError,
          { status: 403 }
        );
      }
    }

    // Get feedback data
    const feedback = await getEnhancedFeedbackByUser(payload.userId, {
      feedbackType: filters.feedbackType,
      feedbackStatus: filters.feedbackStatus,
      sessionId: filters.sessionId,
      commenterId: filters.commenterId,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });

    // Get analytics data for context
    let analyticsData = null;
    if (searchParams.get('includeAnalytics') === 'true') {
      analyticsData = await getUserFeedbackAnalytics(payload.userId);
    }

    return NextResponse.json({
      feedback,
      pagination: {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        total: feedback.length,
      },
      analytics: analyticsData,
    }, { status: 200 });

  } catch (error) {
    console.error('Get enhanced feedback error:', error);
    
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
        message: 'An error occurred while retrieving feedback', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}