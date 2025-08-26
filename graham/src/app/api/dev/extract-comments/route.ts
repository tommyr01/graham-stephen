import { NextRequest, NextResponse } from 'next/server';
import { fetchLinkedInComments, validateLinkedInPostUrl } from '@/lib/linkedin';

// Development endpoint without authentication for single-user deployment
export async function POST(request: NextRequest) {
  try {
    const { postUrl, pageNumber = 1, sortOrder = 'Most relevant' } = await request.json();
    
    if (!postUrl) {
      return NextResponse.json(
        { error: 'Post URL is required' },
        { status: 400 }
      );
    }

    // Validate LinkedIn post URL
    const urlValidation = validateLinkedInPostUrl(postUrl);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid LinkedIn URL', 
          message: 'Please provide a valid LinkedIn post URL', 
        },
        { status: 400 }
      );
    }

    // Fetch LinkedIn comments directly using the real API
    const linkedInData = await fetchLinkedInComments(postUrl, pageNumber, sortOrder);
    
    // Enhance comments with unique commenter IDs for development
    const enhancedComments = linkedInData.comments.map((comment, index) => ({
      ...comment,
      commenterId: `commenter-${comment.id}`,
      author: {
        ...comment.author,
        commenterId: `commenter-${comment.id}`
      }
    }));

    const response = {
      sessionId: `session-${Date.now()}`,
      post: {
        id: linkedInData.post.id,
        url: linkedInData.post.url,
      },
      comments: enhancedComments,
      totalComments: linkedInData.totalComments,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Extract comments error:', error);
    
    // Provide more specific error messages based on the error type
    let statusCode = 500;
    let errorMessage = 'An error occurred while extracting comments';
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'LinkedIn API rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('not found') || error.message.includes('private')) {
        statusCode = 404;
        errorMessage = 'LinkedIn post not found or is private. Please check the URL and try again.';
      } else if (error.message.includes('access denied')) {
        statusCode = 403;
        errorMessage = 'Unable to access LinkedIn post. The post may be restricted or the URL format may be unsupported.';
      } else if (error.message.includes('LinkedIn API error')) {
        statusCode = 400;
        errorMessage = `LinkedIn API issue: ${error.message}. Please try a different post URL.`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: 'LinkedIn API Error', 
        message: errorMessage,
        suggestion: 'Try using a LinkedIn post URL in this format: https://www.linkedin.com/posts/username_post-activity-123456789-abc/'
      },
      { status: statusCode }
    );
  }
}