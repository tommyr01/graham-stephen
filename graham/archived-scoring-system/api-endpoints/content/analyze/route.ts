/**
 * Content Analysis API Endpoint
 * POST /api/v2/content/analyze
 * Analyzes LinkedIn posts for authenticity and expertise
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentIntelligence } from '@/lib/services/content-intelligence-engine';
import { z } from 'zod';

// Request validation schema
const AnalyzeRequestSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1),
  prospectId: z.string().uuid(),
  publishedAt: z.string().optional(),
  engagement: z.object({
    likes: z.number().default(0),
    comments: z.number().default(0),
    reposts: z.number().default(0)
  }).optional()
});

const BatchAnalyzeRequestSchema = z.object({
  posts: z.array(z.object({
    postId: z.string().min(1),
    content: z.string().min(1),
    prospectId: z.string().uuid(),
    publishedAt: z.string().optional(),
    engagement: z.object({
      likes: z.number().default(0),
      comments: z.number().default(0),
      reposts: z.number().default(0)
    }).optional()
  })).max(20) // Limit batch size
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a batch request
    if (body.posts && Array.isArray(body.posts)) {
      return handleBatchAnalysis(body);
    } else {
      return handleSingleAnalysis(body);
    }
  } catch (error) {
    console.error('Content analysis request failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request format',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

async function handleSingleAnalysis(body: any) {
  try {
    // Validate request
    const validatedData = AnalyzeRequestSchema.parse(body);
    
    // Create post object
    const post = {
      id: validatedData.postId,
      content: validatedData.content,
      publishedAt: validatedData.publishedAt || new Date().toISOString(),
      engagement: validatedData.engagement
    };

    // Perform analysis
    const startTime = Date.now();
    const analysisResult = await contentIntelligence.analyzePost(post, validatedData.prospectId);
    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        postId: analysisResult.postId,
        analysisResult,
        cached: analysisResult.cached,
        processingTime: totalProcessingTime
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Single analysis failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleBatchAnalysis(body: any) {
  try {
    // Validate batch request
    const validatedData = BatchAnalyzeRequestSchema.parse(body);
    
    // Group posts by prospect for efficient processing
    const postsByProspect = validatedData.posts.reduce((acc, postData) => {
      if (!acc[postData.prospectId]) {
        acc[postData.prospectId] = [];
      }
      
      acc[postData.prospectId].push({
        id: postData.postId,
        content: postData.content,
        publishedAt: postData.publishedAt || new Date().toISOString(),
        engagement: postData.engagement
      });
      
      return acc;
    }, {} as Record<string, any[]>);

    // Process each prospect's posts
    const results = [];
    const errors = [];
    let totalFromCache = 0;
    let totalNewAnalysis = 0;
    
    const startTime = Date.now();

    for (const [prospectId, posts] of Object.entries(postsByProspect)) {
      try {
        const prospectResults = await contentIntelligence.batchAnalyzePosts(posts, prospectId);
        
        prospectResults.forEach(result => {
          results.push(result);
          if (result.cached) {
            totalFromCache++;
          } else {
            totalNewAnalysis++;
          }
        });
      } catch (error) {
        console.error(`Batch analysis failed for prospect ${prospectId}:`, error);
        errors.push({
          prospectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: results.length,
        results,
        fromCache: totalFromCache,
        newAnalysis: totalNewAnalysis,
        failed: errors.length,
        processingTime: totalProcessingTime
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batch validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Batch analysis failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Batch analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}