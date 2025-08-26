/**
 * API endpoint for processing feedback data
 * POST /api/intelligence/feedback/process
 */

import { NextRequest, NextResponse } from 'next/server';
import LearningDataProcessor from '@/lib/services/learning-data-processor';
import type { APIResponse, ProcessingResult } from '@/lib/types/intelligence';

interface ProcessFeedbackRequest {
  feedbackType: 'prediction_correction' | 'relevance_rating' | 'outcome_report';
  feedbackData: Record<string, any>;
  userId: string;
  sessionId?: string;
  realtime?: boolean;
}

interface BatchProcessRequest {
  forceProcess?: boolean;
  config?: {
    batch_size?: number;
    max_processing_time_minutes?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessFeedbackRequest = await request.json();
    const { feedbackType, feedbackData, userId, sessionId, realtime = true } = body;

    if (!feedbackType || !feedbackData || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Feedback type, data, and user ID are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const processor = new LearningDataProcessor();

    // Process the feedback for system improvement
    await processor.processFeedbackForSystemImprovement(
      feedbackType,
      feedbackData,
      userId,
      sessionId
    );

    const response: APIResponse<null> = {
      success: true,
      message: 'Feedback processed successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing feedback:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: BatchProcessRequest = await request.json();
    const { forceProcess = false, config } = body;

    const processor = new LearningDataProcessor(config);

    // Run batch processing
    const result = await processor.processBatch();

    const response: APIResponse<ProcessingResult> = {
      success: true,
      data: result,
      message: 'Batch processing completed',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in batch processing:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const processor = new LearningDataProcessor();

    // Get processing metrics
    const metrics = await processor.getProcessingMetrics(days);

    const response: APIResponse<typeof metrics> = {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching processing metrics:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}