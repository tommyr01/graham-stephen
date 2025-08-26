/**
 * API endpoint for user learning insights
 * GET /api/intelligence/insights/[userId]
 */

import { NextRequest, NextResponse } from 'next/server';
import UserIntelligenceProfileService from '@/lib/services/user-intelligence-profile-service';
import LearningDataProcessor from '@/lib/services/learning-data-processor';
import type { APIResponse, LearningInsight } from '@/lib/types/intelligence';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const insightTypes = searchParams.get('types')?.split(',') || [];

    const profileService = new UserIntelligenceProfileService();
    const processor = new LearningDataProcessor();

    // Get insights from profile service
    const profileInsights = await profileService.getLearningInsights(userId);

    // Get additional insights from processor if refresh is requested
    let processorInsights: LearningInsight[] = [];
    if (refresh) {
      processorInsights = await processor.generateUserInsights(userId);
    }

    // Combine and filter insights
    let allInsights = [...profileInsights, ...processorInsights];

    // Filter by types if specified
    if (insightTypes.length > 0) {
      allInsights = allInsights.filter(insight => 
        insightTypes.includes(insight.type)
      );
    }

    // Remove duplicates and sort by confidence
    const uniqueInsights = allInsights
      .filter((insight, index, self) => 
        index === self.findIndex(i => i.title === insight.title && i.type === insight.type)
      )
      .sort((a, b) => b.confidence - a.confidence);

    const response: APIResponse<LearningInsight[]> = {
      success: true,
      data: uniqueInsights,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user insights:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}