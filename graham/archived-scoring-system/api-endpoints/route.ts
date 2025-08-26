import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { supabase, TABLES } from '@/lib/supabase';
import { updateCommenterRelevanceScore } from '@/lib/database';
import { calculateRelevanceScore } from '@/lib/relevance-scoring';
import { RelevanceScoreRequest, RelevanceScoreResponse, APIError } from '@/lib/types';

const relevanceScoreSchema = z.object({
  commenterId: z.string().uuid('Invalid commenter ID'),
  boostTerms: z.array(z.string()).default([]),
  downTerms: z.array(z.string()).default([]),
  analysisDepth: z.enum(['basic', 'detailed']).default('basic'),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const body: RelevanceScoreRequest = await request.json();
    
    // Validate input
    const validation = relevanceScoreSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { commenterId, boostTerms, downTerms, analysisDepth } = validation.data;

    // Get commenter data with session verification
    const { data: commenter, error } = await supabase
      .from(TABLES.COMMENTERS)
      .select(`
        *,
        research_sessions!inner(
          user_id,
          boost_terms
        )
      `)
      .eq('id', commenterId)
      .single();

    if (error || !commenter) {
      return NextResponse.json(
        { error: 'Commenter Not Found', message: 'Commenter not found', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    // Verify that the commenter belongs to a session owned by the authenticated user
    if (commenter.research_sessions.user_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Access denied', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    // Merge boost terms from session and request
    const allBoostTerms = [
      ...commenter.research_sessions.boost_terms,
      ...boostTerms
    ].filter((term, index, arr) => arr.indexOf(term) === index); // Remove duplicates

    try {
      // Prepare commenter data for scoring
      const commenterData = {
        id: commenter.id,
        name: commenter.name,
        headline: commenter.headline,
        company: commenter.company,
        location: commenter.location,
        commentText: commenter.comment_text,
        followersCount: commenter.followers_count,
        connectionsCount: commenter.connections_count,
        profileData: commenter.profile_data,
        recentPosts: commenter.profile_data?.recentPosts || [],
        stats: commenter.profile_data?.stats,
      };

      // Calculate relevance score
      const relevanceAnalysis = calculateRelevanceScore(
        commenterData,
        allBoostTerms,
        downTerms,
        analysisDepth
      );

      // Update commenter with new relevance score
      await updateCommenterRelevanceScore(commenterId, relevanceAnalysis.score);

      // Log the scoring event for analytics (optional)
      try {
        await supabase.from('scoring_events').insert({
          commenter_id: commenterId,
          user_id: payload.userId,
          score: relevanceAnalysis.score,
          boost_terms: allBoostTerms,
          down_terms: downTerms,
          analysis_depth: analysisDepth,
          confidence: relevanceAnalysis.confidence,
          created_at: new Date().toISOString(),
        });
      } catch (loggingError) {
        // Don't fail the request if logging fails
        console.warn('Failed to log scoring event:', loggingError);
      }

      const response: RelevanceScoreResponse = {
        score: relevanceAnalysis.score,
        explanation: relevanceAnalysis.explanation,
        recommendations: relevanceAnalysis.recommendations,
        confidence: relevanceAnalysis.confidence,
      };

      return NextResponse.json(response, { status: 200 });

    } catch (scoringError) {
      console.error('Relevance scoring error:', scoringError);
      
      return NextResponse.json(
        { 
          error: 'Scoring Error', 
          message: 'Failed to calculate relevance score', 
          statusCode: 500,
          details: scoringError instanceof Error ? scoringError.message : 'Unknown scoring error'
        } as APIError,
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Relevance score calculation error:', error);
    
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
        message: 'An error occurred while calculating relevance score', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}