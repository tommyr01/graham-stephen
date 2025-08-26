import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface VoiceFeedbackRequest {
  sessionId?: string
  commenterId?: string
  analysisId?: string
  userId: string
  teamId?: string
  
  // Voice-specific data
  voiceTranscription: string
  voiceDurationSeconds: number
  voiceConfidence: number
  voiceKeyPoints: string[]
  voiceSentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  
  // Traditional feedback data (derived from voice)
  isRelevant: boolean
  overallRating?: number
  confidenceScore?: number
  feedbackText?: string
  
  // Context
  analysisContext?: any
  userContext?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: VoiceFeedbackRequest = await request.json()
    
    // Validate required fields
    if (!body.userId || !body.voiceTranscription) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and voiceTranscription' },
        { status: 400 }
      )
    }

    // Get client IP for tracking
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Insert voice feedback into database
    const { data: feedback, error: feedbackError } = await supabase
      .from('enhanced_user_feedback')
      .insert({
        user_id: body.userId,
        team_id: body.teamId,
        session_id: body.sessionId,
        commenter_id: body.commenterId,
        analysis_id: body.analysisId,
        
        feedback_type: 'voice',
        feedback_status: 'pending',
        priority: 2, // Voice feedback gets higher priority
        
        overall_rating: body.overallRating,
        is_relevant: body.isRelevant,
        confidence_score: body.confidenceScore,
        
        feedback_text: body.feedbackText,
        
        // Voice-specific fields
        voice_transcription: body.voiceTranscription,
        voice_duration_seconds: body.voiceDurationSeconds,
        voice_confidence: body.voiceConfidence,
        voice_key_points: body.voiceKeyPoints,
        voice_sentiment: body.voiceSentiment,
        
        // Context data
        analysis_context: body.analysisContext,
        user_context: body.userContext,
        
        // Metadata
        source_ip: clientIp,
        user_agent: userAgent,
        
        submitted_at: new Date().toISOString(),
        learning_weight: 1.5 // Voice feedback has higher learning weight
      })
      .select()
      .single()

    if (feedbackError) {
      console.error('Error inserting voice feedback:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to save voice feedback', details: feedbackError.message },
        { status: 500 }
      )
    }

    // Process the voice feedback asynchronously
    try {
      const { data: processingResult, error: processingError } = await supabase
        .rpc('process_voice_feedback', { feedback_id: feedback.id })

      if (processingError) {
        console.warn('Voice feedback processing warning:', processingError)
        // Don't fail the request, just log the warning
      }
    } catch (processingErr) {
      console.warn('Voice feedback processing failed:', processingErr)
      // Continue with success response
    }

    // Get updated user learning stats
    const { data: learningStats, error: statsError } = await supabase
      .rpc('get_user_learning_stats', { p_user_id: body.userId })

    if (statsError) {
      console.warn('Failed to get learning stats:', statsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Voice feedback received and processing initiated',
      data: {
        feedbackId: feedback.id,
        status: 'processing',
        learningStats: learningStats || null,
        voiceProcessing: {
          transcriptionLength: body.voiceTranscription.length,
          keyPointsExtracted: body.voiceKeyPoints.length,
          sentiment: body.voiceSentiment,
          confidence: body.voiceConfidence
        }
      }
    })

  } catch (error) {
    console.error('Voice feedback API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    // Get recent voice feedback for the user
    const { data: recentFeedback, error: feedbackError } = await supabase
      .from('enhanced_user_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('feedback_type', 'voice')
      .order('created_at', { ascending: false })
      .limit(10)

    if (feedbackError) {
      console.error('Error fetching voice feedback:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to fetch voice feedback' },
        { status: 500 }
      )
    }

    // Get learning statistics
    const { data: learningStats, error: statsError } = await supabase
      .rpc('get_user_learning_stats', { p_user_id: userId })

    if (statsError) {
      console.warn('Failed to get learning stats:', statsError)
    }

    // Get voice feedback analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('voice_feedback_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('feedback_date', { ascending: false })
      .limit(7)

    if (analyticsError) {
      console.warn('Failed to get voice analytics:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        recentFeedback: recentFeedback || [],
        learningStats: learningStats || null,
        analytics: analytics || [],
        summary: {
          totalVoiceFeedback: recentFeedback?.length || 0,
          avgDuration: recentFeedback?.reduce((acc, f) => acc + (f.voice_duration_seconds || 0), 0) / Math.max(recentFeedback?.length || 1, 1),
          commonSentiment: getCommonSentiment(recentFeedback || [])
        }
      }
    })

  } catch (error) {
    console.error('Voice feedback GET API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to determine common sentiment
function getCommonSentiment(feedback: any[]): string {
  if (feedback.length === 0) return 'neutral'
  
  const sentimentCounts = feedback.reduce((acc, f) => {
    acc[f.voice_sentiment] = (acc[f.voice_sentiment] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(sentimentCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral'
}