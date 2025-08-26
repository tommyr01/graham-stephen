import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { supabase, TABLES } from '@/lib/supabase';
import { FeedbackRequest, FeedbackResponse, APIError } from '@/lib/types';

const feedbackSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  commenterId: z.string().uuid('Invalid commenter ID'),
  rating: z.number().min(1).max(5),
  feedbackText: z.string().optional(),
  isRelevant: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const body: FeedbackRequest = await request.json();
    
    // Validate input
    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { sessionId, commenterId, rating, feedbackText, isRelevant, notes } = validation.data;

    // Verify that the session belongs to the authenticated user
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.RESEARCH_SESSIONS)
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session Not Found', message: 'Research session not found', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    if (session.user_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Access denied', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    // Verify that the commenter belongs to the session
    const { data: commenter, error: commenterError } = await supabase
      .from(TABLES.COMMENTERS)
      .select('id, session_id')
      .eq('id', commenterId)
      .eq('session_id', sessionId)
      .single();

    if (commenterError || !commenter) {
      return NextResponse.json(
        { error: 'Commenter Not Found', message: 'Commenter not found in this session', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    // Create or update feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from(TABLES.USER_FEEDBACK)
      .upsert({
        session_id: sessionId,
        commenter_id: commenterId,
        user_id: payload.userId,
        rating,
        feedback_text: feedbackText,
        is_relevant: isRelevant,
        notes,
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Database error creating feedback:', feedbackError);
      return NextResponse.json(
        { 
          error: 'Database Error', 
          message: 'Failed to save feedback', 
          statusCode: 500 
        } as APIError,
        { status: 500 }
      );
    }

    const response: FeedbackResponse = {
      feedback: {
        id: feedback.id,
        sessionId: feedback.session_id,
        commenterId: feedback.commenter_id,
        userId: feedback.user_id,
        rating: feedback.rating,
        feedbackText: feedback.feedback_text,
        isRelevant: feedback.is_relevant,
        notes: feedback.notes,
        createdAt: feedback.created_at,
      },
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Submit feedback error:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const commenterId = searchParams.get('commenterId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing Parameter', message: 'sessionId is required', statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    // Verify that the session belongs to the authenticated user
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.RESEARCH_SESSIONS)
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session Not Found', message: 'Research session not found', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    if (session.user_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Access denied', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from(TABLES.USER_FEEDBACK)
      .select(`
        id,
        session_id,
        commenter_id,
        user_id,
        rating,
        feedback_text,
        is_relevant,
        notes,
        created_at,
        commenters!inner(
          name,
          headline,
          company
        )
      `)
      .eq('session_id', sessionId)
      .eq('user_id', payload.userId);

    if (commenterId) {
      query = query.eq('commenter_id', commenterId);
    }

    const { data: feedbackList, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error getting feedback:', error);
      return NextResponse.json(
        { 
          error: 'Database Error', 
          message: 'Failed to retrieve feedback', 
          statusCode: 500 
        } as APIError,
        { status: 500 }
      );
    }

    const formattedFeedback = feedbackList.map((item: any) => ({
      id: item.id,
      sessionId: item.session_id,
      commenterId: item.commenter_id,
      userId: item.user_id,
      rating: item.rating,
      feedbackText: item.feedback_text,
      isRelevant: item.is_relevant,
      notes: item.notes,
      createdAt: item.created_at,
      commenter: {
        name: item.commenters.name,
        headline: item.commenters.headline,
        company: item.commenters.company,
      },
    }));

    return NextResponse.json({ feedback: formattedFeedback }, { status: 200 });

  } catch (error) {
    console.error('Get feedback error:', error);
    
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