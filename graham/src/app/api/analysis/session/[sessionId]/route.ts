import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { getResearchSession, updateResearchSession, getCommentersBySession } from '@/lib/database';
import { APIError } from '@/lib/types';

const updateSessionSchema = z.object({
  sessionName: z.string().optional(),
  boostTerms: z.array(z.string()).optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    const { sessionId } = await params;

    // Get research session
    const session = await getResearchSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session Not Found', message: 'Research session not found', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Access denied', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    // Get commenters for this session
    const commenters = await getCommentersBySession(sessionId);

    const response = {
      session: {
        id: session.id,
        postUrl: session.postUrl,
        sessionName: session.sessionName,
        status: session.status,
        totalComments: session.totalComments,
        analyzedCommenters: session.analyzedCommenters,
        boostTerms: session.boostTerms,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      commenters: commenters.map(commenter => ({
        id: commenter.id,
        name: commenter.name,
        headline: commenter.headline,
        profileUrl: commenter.profileUrl,
        company: commenter.company,
        location: commenter.location,
        commentText: commenter.commentText,
        commentDate: commenter.commentDate,
        relevanceScore: commenter.relevanceScore,
        createdAt: commenter.createdAt,
        updatedAt: commenter.updatedAt,
      })),
      stats: {
        totalCommenters: commenters.length,
        highRelevanceCommenters: commenters.filter(c => c.relevanceScore >= 7).length,
        mediumRelevanceCommenters: commenters.filter(c => c.relevanceScore >= 4 && c.relevanceScore < 7).length,
        lowRelevanceCommenters: commenters.filter(c => c.relevanceScore < 4).length,
        averageRelevanceScore: commenters.length > 0 
          ? commenters.reduce((sum, c) => sum + c.relevanceScore, 0) / commenters.length 
          : 0,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Get session details error:', error);
    
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
        message: 'An error occurred while retrieving session details', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    const { sessionId } = await params;

    const body = await request.json();
    
    // Validate input
    const validation = updateSessionSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Get research session to verify ownership
    const session = await getResearchSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session Not Found', message: 'Research session not found', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Access denied', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    // Update session
    const updatedSession = await updateResearchSession(sessionId, {
      ...(updates.sessionName && { sessionName: updates.sessionName }),
      ...(updates.boostTerms && { boostTerms: updates.boostTerms }),
      ...(updates.status && { status: updates.status }),
    });

    const response = {
      session: {
        id: updatedSession.id,
        postUrl: updatedSession.postUrl,
        sessionName: updatedSession.sessionName,
        status: updatedSession.status,
        totalComments: updatedSession.totalComments,
        analyzedCommenters: updatedSession.analyzedCommenters,
        boostTerms: updatedSession.boostTerms,
        createdAt: updatedSession.createdAt,
        updatedAt: updatedSession.updatedAt,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Update session error:', error);
    
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
        message: 'An error occurred while updating session', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}