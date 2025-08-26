import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabase'
import { SessionLearningManager } from '@/lib/services/session-learning-manager'

// Initialize OpenAI for advanced voice processing
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Use singleton session learning manager to maintain state across requests
const sessionLearningManager = SessionLearningManager.getInstance()

interface VoiceProcessingRequest {
  transcription: string
  userId: string
  sessionId?: string
  commenterId?: string
  analysisData?: any
  profileUrl?: string
  profileData?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: VoiceProcessingRequest = await request.json()
    
    if (!body.transcription || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: transcription and userId' },
        { status: 400 }
      )
    }

    // Use OpenAI to process the voice transcription and extract insights
    const processingPrompt = `
You are an AI assistant helping analyse voice feedback for LinkedIn prospect evaluation. 

A user has provided voice feedback about a LinkedIn prospect. Your job is to extract key insights from their natural language feedback.

Voice Transcription: "${body.transcription}"

Please extract:
1. Overall sentiment (positive, negative, neutral, mixed)
2. Key decision points mentioned (max 5)
3. Whether they think this prospect is relevant/worth contacting (boolean)
4. Confidence level of their decision (0-1 scale)
5. Overall rating if mentioned (1-10 scale, null if not mentioned)
6. Any specific feedback about analysis accuracy

Respond in this exact JSON format:
{
  "sentiment": "positive|negative|neutral|mixed",
  "keyPoints": ["point1", "point2", ...],
  "isRelevant": true|false,
  "confidence": 0.85,
  "overallRating": 8,
  "feedbackText": "brief summary of their feedback",
  "analysisAccuracyFeedback": "what they said about the analysis accuracy, or null",
  "reasoningQuality": "high|medium|low based on how detailed their reasoning was"
}

Focus on extracting the user's actual decision and reasoning, not making your own evaluation of the prospect.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a voice feedback processing assistant. Extract insights from voice transcriptions accurately and concisely."
        },
        {
          role: "user", 
          content: processingPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    let extractedData: any
    try {
      extractedData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText)
      // Fallback to basic processing
      extractedData = {
        sentiment: determineBasicSentiment(body.transcription),
        keyPoints: extractKeyPhrases(body.transcription),
        isRelevant: body.transcription.toLowerCase().includes('contact') || 
                   body.transcription.toLowerCase().includes('good') ||
                   body.transcription.toLowerCase().includes('relevant'),
        confidence: 0.5,
        overallRating: null,
        feedbackText: body.transcription.slice(0, 200),
        analysisAccuracyFeedback: null,
        reasoningQuality: "medium"
      }
    }

    // Validate extracted data
    const processedData = {
      sentiment: validateSentiment(extractedData.sentiment),
      keyPoints: Array.isArray(extractedData.keyPoints) ? extractedData.keyPoints.slice(0, 5) : [],
      isRelevant: Boolean(extractedData.isRelevant),
      confidence: Math.max(0, Math.min(1, Number(extractedData.confidence) || 0.5)),
      overallRating: extractedData.overallRating ? Math.max(1, Math.min(10, Number(extractedData.overallRating))) : null,
      feedbackText: String(extractedData.feedbackText || body.transcription).slice(0, 500),
      analysisAccuracyFeedback: extractedData.analysisAccuracyFeedback || null,
      reasoningQuality: validateReasoningQuality(extractedData.reasoningQuality)
    }

    // Calculate voice processing metrics
    const voiceMetrics = {
      transcriptionLength: body.transcription.length,
      wordCount: body.transcription.split(/\s+/).length,
      processingTime: Date.now(),
      keyPointsExtracted: processedData.keyPoints.length,
      confidenceScore: processedData.confidence,
      sentimentDetected: processedData.sentiment
    }

    // Save voice feedback to database using the existing function
    let interactionId: string | null = null;
    let learningPatterns: any[] = [];
    let learningImpact: any = null;

    try {
      // Get session intelligence ID if session provided
      let sessionIntelligenceId = null;
      if (body.sessionId) {
        const { data: sessionData } = await supabase
          .from('research_session_intelligence')
          .select('id')
          .eq('session_id', body.sessionId)
          .single();
        
        sessionIntelligenceId = sessionData?.id || null;
      }

      // Call the record_voice_feedback_interaction function
      const { data: functionResult, error: dbError } = await supabase
        .rpc('record_voice_feedback_interaction', {
          p_session_id: sessionIntelligenceId,
          p_user_id: body.userId,
          p_voice_transcript: body.transcription,
          p_voice_confidence: processedData.confidence,
          p_voice_language: 'en-US',
          p_recording_duration: Math.ceil(body.transcription.length / 200), // Estimate duration
          p_context_data: {
            processed_feedback: processedData,
            voice_metrics: voiceMetrics,
            analysis_data: body.analysisData || {},
            profile_url: body.profileUrl || null,
            commenter_id: body.commenterId || null,
            processing_version: 'v1.0'
          },
          p_audio_blob: null // No audio blob for text-based voice feedback
        });

      if (dbError) {
        console.error('Database error saving voice feedback:', dbError);
        // Don't throw - continue with learning pipeline even if DB save fails
        interactionId = null;
      } else {
        interactionId = functionResult;
        console.log(`Voice feedback saved to database with interaction ID: ${interactionId}`);
      }

      // Trigger learning pipeline if we have session and profile data (even without successful DB save)
      console.log('DEBUG: Checking learning pipeline conditions:', {
        hasSessionId: !!body.sessionId,
        hasProfileUrl: !!body.profileUrl,
        hasProfileData: !!body.profileData,
        sessionId: body.sessionId,
        profileUrl: body.profileUrl
      });
      
      if (body.sessionId && body.profileUrl && body.profileData) {
        try {
          // Initialize session learning if not already done
          await sessionLearningManager.initializeSession(body.sessionId, body.userId);

          // Create feedback interaction object for learning (use fallback ID if DB save failed)
          const feedbackInteraction = {
            id: interactionId || `temp-${Date.now()}`,
            session_id: body.sessionId,
            user_id: body.userId,
            interaction_type: 'explicit_rating',
            feedback_data: {
              voice_feedback: true,
              transcript: body.transcription,
              processed_feedback: processedData,
              voice_metrics: voiceMetrics
            },
            voice_transcript: body.transcription,
            voice_confidence: processedData.confidence,
            context_data: {
              profile_url: body.profileUrl,
              commenter_id: body.commenterId
            },
            feedback_timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          };

          // Extract patterns from voice feedback
          console.log('DEBUG: About to call processVoiceFeedback with:', {
            sessionId: body.sessionId,
            feedbackInteraction,
            profileUrl: body.profileUrl,
            profileData: body.profileData
          });
          
          learningPatterns = await sessionLearningManager.processVoiceFeedback(
            body.sessionId,
            feedbackInteraction,
            body.profileUrl,
            body.profileData
          );

          console.log(`Extracted ${learningPatterns.length} learning patterns from voice feedback`);

          // Get session learning metrics
          learningImpact = sessionLearningManager.getSessionMetrics(body.sessionId);

          // Auto-save high-confidence patterns to database (Integration #3)
          if (learningPatterns.some(p => p.confidence_score >= 0.8)) {
            try {
              const savedCount = await sessionLearningManager.saveSessionPatterns(body.sessionId);
              console.log(`Auto-saved ${savedCount} high-confidence patterns to database`);
            } catch (saveError) {
              console.error('Error auto-saving patterns:', saveError);
            }
          }

        } catch (learningError) {
          console.error('Learning pipeline error:', learningError);
          // Don't fail the entire request due to learning errors
        }
      }

    } catch (error) {
      console.error('Error saving voice feedback to database:', error);
      // Continue without database save, but log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Voice feedback processed and saved successfully',
      data: {
        processedFeedback: processedData,
        voiceMetrics,
        originalTranscription: body.transcription,
        processingVersion: 'v1.0',
        database: {
          saved: !!interactionId,
          interactionId: interactionId,
          error: !interactionId ? 'Failed to save to database' : null
        },
        learning: {
          patternsExtracted: learningPatterns.length,
          patterns: learningPatterns.map(p => ({
            type: p.pattern_type,
            confidence: p.confidence_score
          })),
          sessionMetrics: learningImpact,
          learningEnabled: !!(body.sessionId && body.profileUrl && body.profileData)
        }
      }
    })

  } catch (error) {
    console.error('Voice processing error:', error)
    
    // Get basic request data for fallback
    let requestBody: any = {};
    try {
      // Clone the request since it may have already been consumed
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.json();
    } catch {
      // If we can't parse the request, try to get available data
      requestBody = {};
    }
    
    // Fallback processing if AI fails
    const fallbackData = {
      sentiment: 'neutral',
      keyPoints: extractKeyPhrases(requestBody?.transcription || ''),
      isRelevant: true,
      confidence: 0.5,
      overallRating: null,
      feedbackText: requestBody?.transcription || 'Processing failed',
      analysisAccuracyFeedback: null,
      reasoningQuality: 'low'
    }

    // Try to save fallback data to database if we have user info
    let fallbackInteractionId: string | null = null;
    if (requestBody?.userId && requestBody?.transcription) {
      try {
        // Get session intelligence ID if session provided
        let fallbackSessionIntelligenceId = null;
        if (requestBody.sessionId) {
          const { data: sessionData } = await supabase
            .from('research_session_intelligence')
            .select('id')
            .eq('session_id', requestBody.sessionId)
            .single();
          
          fallbackSessionIntelligenceId = sessionData?.id || null;
        }

        const { data: functionResult } = await supabase
          .rpc('record_voice_feedback_interaction', {
            p_session_id: fallbackSessionIntelligenceId,
            p_user_id: requestBody.userId,
            p_voice_transcript: requestBody.transcription,
            p_voice_confidence: 0.5,
            p_voice_language: 'en-US',
            p_recording_duration: Math.ceil(requestBody.transcription.length / 200),
            p_context_data: {
              processed_feedback: fallbackData,
              processing_error: error instanceof Error ? error.message : 'Unknown error',
              fallback_processing: true
            },
            p_audio_blob: null // No audio blob for fallback processing
          });
        
        fallbackInteractionId = functionResult;
        console.log(`Fallback voice feedback saved with ID: ${fallbackInteractionId}`);
      } catch (dbError) {
        console.error('Failed to save fallback data to database:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Voice processing completed with fallback method',
      data: {
        processedFeedback: fallbackData,
        voiceMetrics: {
          transcriptionLength: requestBody?.transcription?.length || 0,
          processingFallback: true
        },
        database: {
          saved: !!fallbackInteractionId,
          interactionId: fallbackInteractionId,
          fallbackMode: true
        },
        learning: {
          patternsExtracted: 0,
          patterns: [],
          learningEnabled: false,
          fallbackMode: true
        },
        warning: 'Advanced processing failed, used basic extraction'
      }
    })
  }
}

// Helper function to validate sentiment
function validateSentiment(sentiment: any): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const validSentiments = ['positive', 'negative', 'neutral', 'mixed']
  return validSentiments.includes(sentiment) ? sentiment : 'neutral'
}

// Helper function to validate reasoning quality
function validateReasoningQuality(quality: any): 'high' | 'medium' | 'low' {
  const validQualities = ['high', 'medium', 'low']
  return validQualities.includes(quality) ? quality : 'medium'
}

// Fallback sentiment analysis
function determineBasicSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const positiveWords = ['good', 'great', 'excellent', 'perfect', 'relevant', 'contact', 'yes', 'definitely']
  const negativeWords = ['bad', 'terrible', 'irrelevant', 'skip', 'no', 'not', 'wrong', 'poor']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount && positiveCount > 0) return 'positive'
  if (negativeCount > positiveCount && negativeCount > 0) return 'negative'
  if (positiveCount > 0 && negativeCount > 0) return 'mixed'
  return 'neutral'
}

// Extract key phrases using simple pattern matching
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  for (const sentence of sentences.slice(0, 3)) {
    const cleaned = sentence.trim()
    if (cleaned.length > 10 && cleaned.length < 100) {
      phrases.push(cleaned)
    }
  }
  
  return phrases.slice(0, 5)
}

// GET endpoint for voice processing status
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

    // Return voice processing capabilities and status
    return NextResponse.json({
      success: true,
      data: {
        capabilities: {
          realTimeTranscription: true,
          sentimentAnalysis: true,
          keyPointExtraction: true,
          multilanguageSupport: false, // For now
          confidenceScoring: true
        },
        status: 'ready',
        version: 'v1.0',
        supportedLanguages: ['en'],
        maxTranscriptionLength: 5000,
        processingTimeEstimate: '1-3 seconds'
      }
    })

  } catch (error) {
    console.error('Voice processing status error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}