import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateLinkedInPostUrl } from '@/lib/linkedin';
import { APIError } from '@/lib/types';

const validateUrlSchema = z.object({
  postUrl: z.string().url('Invalid URL format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateUrlSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { postUrl } = validation.data;

    // Validate LinkedIn post URL
    const urlValidation = validateLinkedInPostUrl(postUrl);
    
    if (!urlValidation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid LinkedIn URL format',
          message: 'Please provide a valid LinkedIn post URL (e.g., https://www.linkedin.com/posts/username_post-id)',
          examples: [
            'https://www.linkedin.com/posts/johndoe_great-insights-on-sales-activity-1234567890',
            'https://www.linkedin.com/posts/company_amazing-product-launch-activity-0987654321'
          ]
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        postId: urlValidation.postId,
        message: 'Valid LinkedIn post URL'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Validate URL error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while validating the URL', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}