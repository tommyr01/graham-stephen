import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { createResearchSession, createCommenter, updateResearchSession } from '@/lib/database';
import { fetchLinkedInComments, validateLinkedInPostUrl } from '@/lib/linkedin';
import { ExtractCommentsRequest, ExtractCommentsResponse, APIError } from '@/lib/types';

const extractCommentsSchema = z.object({
  postUrl: z.string().url('Invalid URL format'),
  pageNumber: z.number().min(1).optional(),
  sortOrder: z.enum(['Most relevant', 'Most recent']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const body: ExtractCommentsRequest = await request.json();
    
    // Validate input
    const validation = extractCommentsSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { postUrl, pageNumber = 1, sortOrder = 'Most relevant' } = validation.data;

    // Validate LinkedIn post URL
    const urlValidation = validateLinkedInPostUrl(postUrl);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid LinkedIn URL', 
          message: 'Please provide a valid LinkedIn post URL', 
          statusCode: 400 
        } as APIError,
        { status: 400 }
      );
    }

    // Create research session
    const session = await createResearchSession({
      userId: payload.userId,
      postUrl,
      sessionName: `Analysis - ${new Date().toLocaleDateString()}`,
    });

    let totalComments = 0;
    let analyzedCommenters = 0;

    try {
      // Fetch LinkedIn comments
      const linkedInData = await fetchLinkedInComments(postUrl, pageNumber, sortOrder);
      totalComments = linkedInData.totalComments;

      // Store commenters in database and collect their IDs
      const commenterData: Array<{comment: any, commenterId: string}> = [];
      
      for (const comment of linkedInData.comments) {
        try {
          const createdCommenter = await createCommenter({
            sessionId: session.id,
            linkedinId: comment.author.profileUrl,
            commentId: comment.id,
            name: comment.author.name,
            headline: comment.author.headline,
            profileUrl: comment.author.profileUrl,
            profilePicture: comment.author.profilePicture || undefined,
            commentText: comment.text,
            commentDate: comment.postedAt.date,
            commentTimestamp: comment.postedAt.timestamp,
            isEdited: comment.isEdited,
            isPinned: comment.isPinned,
            commentUrl: comment.commentUrl,
            profileData: {
              profilePicture: comment.author.profilePicture || undefined,
              postedAt: comment.postedAt,
            },
            statsData: comment.stats,
          });
          
          commenterData.push({
            comment,
            commenterId: createdCommenter.id
          });
          
          analyzedCommenters++;
        } catch (error) {
          console.error(`Failed to create commenter for ${comment.author.name}:`, error);
          // Continue processing other commenters even if one fails
        }
      }

      // Update session with final counts
      await updateResearchSession(session.id, {
        totalComments,
        analyzedCommenters,
        status: 'completed',
      });

      // Enhance comments with database commenter IDs
      const enhancedComments = commenterData.map(({ comment, commenterId }) => ({
        ...comment,
        commenterId: commenterId,
        author: {
          ...comment.author,
          commenterId: commenterId
        }
      }));

      const response: ExtractCommentsResponse = {
        sessionId: session.id,
        post: {
          id: linkedInData.post.id,
          url: linkedInData.post.url,
        },
        comments: enhancedComments,
        totalComments: linkedInData.totalComments,
      };

      return NextResponse.json(response, { status: 200 });

    } catch (linkedInError) {
      console.error('LinkedIn API error:', linkedInError);

      // Update session status to indicate error
      await updateResearchSession(session.id, {
        status: 'error',
        totalComments,
        analyzedCommenters,
      });

      // Return appropriate error based on LinkedIn API error
      if (linkedInError instanceof Error) {
        let statusCode = 500;
        let errorType = 'LinkedIn API Error';

        if (linkedInError.message.includes('rate limit')) {
          statusCode = 429;
          errorType = 'Rate Limit Exceeded';
        } else if (linkedInError.message.includes('not found') || linkedInError.message.includes('private')) {
          statusCode = 404;
          errorType = 'Post Not Found';
        } else if (linkedInError.message.includes('access denied')) {
          statusCode = 403;
          errorType = 'Access Denied';
        } else if (linkedInError.message.includes('timeout')) {
          statusCode = 408;
          errorType = 'Request Timeout';
        }

        return NextResponse.json(
          { 
            error: errorType, 
            message: linkedInError.message, 
            statusCode,
            details: { sessionId: session.id }
          } as APIError,
          { status: statusCode }
        );
      }

      return NextResponse.json(
        { 
          error: 'LinkedIn API Error', 
          message: 'Failed to extract comments from LinkedIn', 
          statusCode: 500,
          details: { sessionId: session.id }
        } as APIError,
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Extract comments error:', error);
    
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
        message: 'An error occurred while extracting comments', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}