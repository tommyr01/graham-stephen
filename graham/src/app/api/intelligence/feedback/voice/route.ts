/**
 * Voice Feedback API Endpoint
 * Handles voice transcript submission, audio file processing, and voice analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import SessionLearningManager from '@/lib/services/session-learning-manager';
import IntelligenceOrchestrator from '@/lib/services/intelligence-orchestrator';

// Voice feedback submission schema
const VoiceFeedbackSchema = z.object({
  sessionId: z.string().uuid().optional(),
  contextType: z.string().default('voice_feedback'),
  transcript: z.string().min(1, 'Transcript cannot be empty'),
  confidence: z.number().min(0).max(1).optional(),
  language: z.string().default('en-US'),
  recordingDuration: z.number().min(0).default(0),
  editedTranscript: z.string().optional(),
  voiceAnalysis: z.record(z.any()).optional(),
  contextData: z.record(z.any()).optional(),
  profileUrl: z.string().url().optional(),
  profileData: z.record(z.any()).optional(), // Profile data for learning
  learningContext: z.record(z.any()).optional(), // Additional learning context
});

// Global session learning manager instance
const sessionLearningManager = new SessionLearningManager();
const intelligenceOrchestrator = new IntelligenceOrchestrator();

// Audio upload schema
const AudioUploadSchema = z.object({
  interactionId: z.string().uuid(),
  audioData: z.string(), // Base64 encoded audio
  audioFormat: z.string().default('audio/wav'),
  audioDuration: z.number().min(0),
  sampleRate: z.number().default(44100),
  channels: z.number().default(1),
});

// Voice analytics request schema
const VoiceAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  includeGlobal: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'submit';
    const body = await request.json();

    switch (action) {
      case 'submit':
        return await handleVoiceFeedbackSubmission(supabase, user.id, body);
      
      case 'upload-audio':
        return await handleAudioUpload(supabase, user.id, body);
      
      case 'analytics':
        return await handleVoiceAnalytics(supabase, user.id, body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action', details: 'Supported actions: submit, upload-audio, analytics' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Voice feedback API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

async function handleVoiceFeedbackSubmission(supabase: any, userId: string, body: any) {
  try {
    // Validate input
    const validatedData = VoiceFeedbackSchema.parse(body);
    
    // Prepare feedback data
    const feedbackData = {
      voice_feedback: true,
      transcript: validatedData.transcript,
      confidence: validatedData.confidence || 0.5,
      language: validatedData.language,
      recording_duration: validatedData.recordingDuration,
      context_type: validatedData.contextType,
      edited: !!validatedData.editedTranscript,
      original_length: validatedData.transcript.length,
      final_length: (validatedData.editedTranscript || validatedData.transcript).length,
      voice_analysis: validatedData.voiceAnalysis || {}
    };

    const contextData = {
      ...validatedData.contextData,
      profileUrl: validatedData.profileUrl,
      voice_language: validatedData.language,
      recording_duration: validatedData.recordingDuration,
      confidence_score: validatedData.confidence,
      submission_method: 'voice_api',
      collection_timestamp: new Date().toISOString()
    };

    // Save to database
    const { data: interaction, error: insertError } = await supabase
      .from('feedback_interactions')
      .insert({
        user_id: userId,
        session_id: validatedData.sessionId,
        interaction_type: 'explicit_rating',
        feedback_data: feedbackData,
        context_data: contextData,
        voice_transcript: validatedData.editedTranscript || validatedData.transcript,
        voice_confidence: validatedData.confidence,
        voice_language: validatedData.language,
        voice_recording_duration: validatedData.recordingDuration,
        voice_edited: !!validatedData.editedTranscript,
        speech_recognition_used: true,
        collection_method: 'voluntary',
        ui_component: 'voice_feedback_api',
        learning_value: calculateLearningValue(validatedData.confidence, validatedData.transcript.length),
        feedback_timestamp: new Date(),
        processed: false
      })
      .select('*')
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // Real-time learning processing
    let learningResults: any = null;
    if (validatedData.sessionId && validatedData.profileUrl && validatedData.profileData) {
      try {
        // Initialize session learning if not already done
        await sessionLearningManager.initializeSession(validatedData.sessionId, userId);

        // Process voice feedback for immediate learning
        const extractedPatterns = await sessionLearningManager.processVoiceFeedback(
          validatedData.sessionId,
          interaction,
          validatedData.profileUrl,
          validatedData.profileData
        );

        // Get session metrics
        const sessionMetrics = sessionLearningManager.getSessionMetrics(validatedData.sessionId);

        learningResults = {
          patterns_extracted: extractedPatterns.length,
          session_metrics: sessionMetrics,
          learning_active: true
        };

        console.log(`Real-time learning processed: ${extractedPatterns.length} patterns extracted for session ${validatedData.sessionId}`);
      } catch (learningError) {
        console.error('Real-time learning processing failed:', learningError);
        learningResults = {
          patterns_extracted: 0,
          learning_active: false,
          error: 'Learning processing failed'
        };
      }
    }

    // Update user intelligence profile asynchronously
    updateUserVoiceProfile(supabase, userId, validatedData).catch(error => {
      console.error('Failed to update user voice profile:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        interactionId: interaction.id,
        message: 'Voice feedback submitted successfully',
        processingStatus: 'completed',
        learning: learningResults
      }
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

async function handleAudioUpload(supabase: any, userId: string, body: any) {
  try {
    const validatedData = AudioUploadSchema.parse(body);
    
    // Verify the interaction belongs to the user
    const { data: interaction, error: verifyError } = await supabase
      .from('feedback_interactions')
      .select('id')
      .eq('id', validatedData.interactionId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !interaction) {
      return NextResponse.json(
        { error: 'Invalid interaction', details: 'Interaction not found or access denied' },
        { status: 404 }
      );
    }

    // Decode base64 audio data
    const audioBuffer = Buffer.from(validatedData.audioData, 'base64');
    
    // Store audio data
    const { data: voiceRecording, error: audioError } = await supabase
      .from('voice_recordings')
      .insert({
        feedback_interaction_id: validatedData.interactionId,
        user_id: userId,
        audio_blob: audioBuffer,
        audio_format: validatedData.audioFormat,
        audio_size_bytes: audioBuffer.length,
        audio_duration_ms: validatedData.audioDuration * 1000,
        sample_rate: validatedData.sampleRate,
        channels: validatedData.channels,
        recording_quality: determineRecordingQuality(audioBuffer.length, validatedData.audioDuration),
        is_processed: true,
        privacy_compliant: true
      })
      .select('id')
      .single();

    if (audioError) {
      throw new Error(`Audio storage failed: ${audioError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        voiceRecordingId: voiceRecording.id,
        message: 'Audio uploaded successfully',
        audioSize: audioBuffer.length,
        duration: validatedData.audioDuration
      }
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

async function handleVoiceAnalytics(supabase: any, userId: string, body: any) {
  try {
    const validatedData = VoiceAnalyticsSchema.parse(body);
    
    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 1 week ago
    const endDate = validatedData.endDate ? new Date(validatedData.endDate) : new Date();
    const targetUserId = validatedData.userId || userId;

    // Get voice feedback analytics
    const { data: analytics, error: analyticsError } = await supabase
      .rpc('calculate_voice_analytics', {
        p_user_id: validatedData.includeGlobal ? null : targetUserId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

    if (analyticsError) {
      throw new Error(`Analytics calculation failed: ${analyticsError.message}`);
    }

    // Get user-specific voice statistics
    const { data: userStats, error: statsError } = await supabase
      .rpc('get_user_voice_stats', {
        p_user_id: targetUserId
      });

    if (statsError) {
      console.warn('Failed to get user voice stats:', statsError);
    }

    // Get recent voice feedback for trends
    const { data: recentFeedback, error: feedbackError } = await supabase
      .from('feedback_interactions')
      .select(`
        id,
        voice_transcript,
        voice_confidence,
        voice_language,
        voice_recording_duration,
        voice_edited,
        feedback_timestamp,
        context_data
      `)
      .eq('user_id', targetUserId)
      .eq('speech_recognition_used', true)
      .gte('feedback_timestamp', startDate.toISOString())
      .lte('feedback_timestamp', endDate.toISOString())
      .order('feedback_timestamp', { ascending: false })
      .limit(50);

    if (feedbackError) {
      console.warn('Failed to get recent feedback:', feedbackError);
    }

    return NextResponse.json({
      success: true,
      data: {
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        analytics: analytics || {},
        userStats: userStats || {},
        recentFeedback: recentFeedback || [],
        insights: generateVoiceInsights(analytics, userStats, recentFeedback)
      }
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

// Helper functions

function calculateLearningValue(confidence?: number, transcriptLength?: number): number {
  const baseValue = 0.7; // Base value for voice feedback
  const confidenceBonus = confidence ? confidence * 0.2 : 0;
  const lengthBonus = transcriptLength && transcriptLength > 100 ? 0.1 : 0;
  
  return Math.min(baseValue + confidenceBonus + lengthBonus, 1.0);
}

function determineRecordingQuality(sizeBytes: number, durationSeconds: number): string {
  if (durationSeconds === 0) return 'low';
  
  const bytesPerSecond = sizeBytes / durationSeconds;
  
  if (bytesPerSecond > 88200) return 'high'; // > 44.1kHz * 16bit mono
  if (bytesPerSecond > 44100) return 'medium';
  return 'low';
}

async function updateUserVoiceProfile(supabase: any, userId: string, voiceData: any) {
  try {
    // Get current profile
    const { data: profile, error: getError } = await supabase
      .from('user_intelligence_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (getError && getError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw getError;
    }

    // Calculate voice-specific patterns
    const voicePatterns = {
      preferred_language: voiceData.language,
      average_recording_duration: voiceData.recordingDuration,
      confidence_trend: voiceData.confidence || 0.5,
      voice_usage_frequency: 1,
      last_voice_feedback: new Date().toISOString()
    };

    if (profile) {
      // Update existing profile
      const updatedPatterns = {
        ...profile.engagement_patterns,
        voice_patterns: {
          ...profile.engagement_patterns?.voice_patterns,
          ...voicePatterns
        }
      };

      await supabase
        .from('user_intelligence_profiles')
        .update({
          engagement_patterns: updatedPatterns,
          last_pattern_update: new Date().toISOString(),
          feedback_interactions: (profile.feedback_interactions || 0) + 1
        })
        .eq('user_id', userId);
    } else {
      // Create new profile
      await supabase.rpc('initialize_user_intelligence_profile', {
        target_user_id: userId
      });

      await supabase
        .from('user_intelligence_profiles')
        .update({
          engagement_patterns: { voice_patterns: voicePatterns },
          feedback_interactions: 1
        })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Failed to update user voice profile:', error);
    // Don't throw - this is a background operation
  }
}

function generateVoiceInsights(analytics: any, userStats: any, recentFeedback: any[]): any {
  const insights: any[] = [];

  // Usage patterns
  if (analytics?.total_voice_feedbacks > 0) {
    const avgDuration = analytics.average_recording_duration || 0;
    if (avgDuration > 30) {
      insights.push({
        type: 'usage_pattern',
        title: 'Detailed Voice Feedback',
        description: `Your average recording is ${Math.round(avgDuration)} seconds, indicating thoughtful, detailed feedback.`,
        score: 0.8,
        category: 'engagement'
      });
    }

    // Confidence trends
    if (analytics.average_confidence > 0.7) {
      insights.push({
        type: 'quality_indicator',
        title: 'High Recognition Accuracy',
        description: `Speech recognition confidence is ${Math.round(analytics.average_confidence * 100)}%, indicating clear speech.`,
        score: analytics.average_confidence,
        category: 'quality'
      });
    }

    // Language consistency
    if (analytics.languages_used && analytics.languages_used.length === 1) {
      insights.push({
        type: 'consistency',
        title: 'Consistent Language Use',
        description: `Consistent use of ${analytics.languages_used[0]} helps improve recognition accuracy.`,
        score: 0.9,
        category: 'optimization'
      });
    }
  }

  // Improvement suggestions
  if (recentFeedback && recentFeedback.length > 3) {
    const editRate = recentFeedback.filter(f => f.voice_edited).length / recentFeedback.length;
    if (editRate > 0.5) {
      insights.push({
        type: 'suggestion',
        title: 'Consider Adjusting Recording Environment',
        description: 'You edit over 50% of transcripts. A quieter environment might improve accuracy.',
        score: 0.4,
        category: 'improvement'
      });
    }
  }

  return insights;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats':
        return await getUserVoiceStats(supabase, user.id);
      
      case 'capabilities':
        return await getVoiceCapabilities();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Voice feedback GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUserVoiceStats(supabase: any, userId: string) {
  const { data: stats, error } = await supabase
    .rpc('get_user_voice_stats', { p_user_id: userId });

  if (error) {
    throw new Error(`Failed to get user stats: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    data: stats || {}
  });
}

async function getVoiceCapabilities() {
  return NextResponse.json({
    success: true,
    data: {
      speechRecognitionSupported: true,
      supportedLanguages: [
        'en-US', 'en-GB', 'en-CA', 'en-AU',
        'es-ES', 'es-MX', 'fr-FR', 'fr-CA',
        'de-DE', 'it-IT', 'pt-BR', 'pt-PT',
        'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'
      ],
      maxRecordingDuration: 300, // 5 minutes
      audioFormats: ['audio/wav', 'audio/mp3', 'audio/ogg'],
      features: {
        realTimeTranscription: true,
        confidenceScoring: true,
        transcriptEditing: true,
        audioPlayback: true,
        multiLanguage: true
      }
    }
  });
}