/**
 * Content Analysis Retrieval API
 * GET /api/v2/content/[prospectId]
 * Retrieves cached content analysis for a prospect
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentIntelligence } from '@/lib/services/content-intelligence-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: { prospectId: string } }
) {
  try {
    const { prospectId } = params;
    
    // Validate prospect ID format
    if (!prospectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prospectId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid prospect ID format'
        },
        { status: 400 }
      );
    }

    // Get content summary for the prospect
    const contentSummary = await contentIntelligence.getProspectContentSummary(prospectId);
    
    if (!contentSummary) {
      return NextResponse.json(
        {
          success: false,
          error: 'No content analysis found for this prospect'
        },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      success: true,
      data: {
        prospectId,
        contentSummary: {
          scores: {
            authenticity: contentSummary.avgAuthenticity,
            expertise: contentSummary.avgExpertise,
            specificity: contentSummary.avgSpecificity,
            professionalism: contentSummary.avgProfessionalism
          },
          metrics: {
            totalPosts: contentSummary.totalPosts,
            aiGeneratedPosts: contentSummary.aiGeneratedPosts,
            highExpertisePosts: contentSummary.highExpertisePosts,
            redFlagCount: contentSummary.redFlagCount
          },
          overall: {
            quality: contentSummary.overallQuality,
            qualityScore: (
              contentSummary.avgAuthenticity + 
              contentSummary.avgExpertise + 
              contentSummary.avgSpecificity + 
              contentSummary.avgProfessionalism
            ) / 4
          },
          insights: generateContentInsights(contentSummary)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Content retrieval failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve content analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateContentInsights(summary: {
  avgAuthenticity: number;
  avgExpertise: number;
  avgSpecificity: number;
  avgProfessionalism: number;
  totalPosts: number;
  aiGeneratedPosts: number;
  highExpertisePosts: number;
  redFlagCount: number;
  overallQuality: 'high' | 'medium' | 'low';
}): string[] {
  const insights: string[] = [];
  
  // Authenticity insights
  if (summary.avgAuthenticity >= 8) {
    insights.push('✅ Highly authentic content - appears human-written');
  } else if (summary.avgAuthenticity <= 4) {
    insights.push('🚩 Low authenticity - high likelihood of AI-generated content');
  }
  
  // Expertise insights
  if (summary.avgExpertise >= 8) {
    insights.push('⭐ Deep industry expertise demonstrated');
  } else if (summary.avgExpertise >= 6) {
    insights.push('👍 Good industry knowledge shown');
  } else if (summary.avgExpertise <= 4) {
    insights.push('⚠️ Limited industry expertise detected');
  }
  
  // AI content detection
  if (summary.totalPosts > 0) {
    const aiContentPercentage = (summary.aiGeneratedPosts / summary.totalPosts) * 100;
    if (aiContentPercentage >= 50) {
      insights.push(`🤖 ${Math.round(aiContentPercentage)}% of posts appear AI-generated`);
    } else if (aiContentPercentage >= 25) {
      insights.push(`⚠️ ${Math.round(aiContentPercentage)}% of posts may be AI-generated`);
    }
  }
  
  // High expertise content
  if (summary.totalPosts > 0) {
    const expertisePercentage = (summary.highExpertisePosts / summary.totalPosts) * 100;
    if (expertisePercentage >= 50) {
      insights.push(`🎯 ${Math.round(expertisePercentage)}% of posts show high expertise`);
    }
  }
  
  // Red flags
  if (summary.redFlagCount > 0) {
    insights.push(`🚨 ${summary.redFlagCount} content red flags detected`);
  }
  
  // Overall quality assessment
  if (summary.overallQuality === 'high') {
    insights.push('💎 High-quality content profile');
  } else if (summary.overallQuality === 'low') {
    insights.push('❌ Low-quality content profile');
  }
  
  // Volume insights
  if (summary.totalPosts >= 10) {
    insights.push(`📊 Comprehensive analysis based on ${summary.totalPosts} posts`);
  } else if (summary.totalPosts < 5) {
    insights.push(`⚠️ Limited analysis - only ${summary.totalPosts} posts available`);
  }
  
  return insights;
}