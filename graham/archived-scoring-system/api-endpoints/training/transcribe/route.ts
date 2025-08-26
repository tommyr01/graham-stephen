/**
 * Voice Transcription API Endpoint
 * POST /api/v2/training/transcribe
 * Transcribes audio recordings for training feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transcription service not available',
          details: 'OpenAI API key not configured'
        },
        { status: 503 }
      );
    }

    // Get audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        {
          success: false,
          error: 'No audio file provided'
        },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'Audio file too large',
          details: 'Maximum file size is 25MB'
        },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Transcribe audio using Whisper
    const startTime = Date.now();
    
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
        temperature: 0.1
      });

      const processingTime = Date.now() - startTime;

      // Process transcription for key insights
      const processedTranscription = await processTranscriptionForInsights(transcription);

      return NextResponse.json({
        success: true,
        data: {
          transcription: processedTranscription.text,
          keyPoints: processedTranscription.keyPoints,
          sentiment: processedTranscription.sentiment,
          processingTime,
          wordCount: processedTranscription.text.split(' ').length
        }
      });

    } catch (whisperError: any) {
      // Log the exact error for debugging
      console.error('OpenAI Whisper API error:', {
        status: whisperError.status,
        code: whisperError.code,
        message: whisperError.message,
        type: whisperError.type
      });

      // Handle OpenAI Whisper API specific errors
      if (whisperError.status === 429 || whisperError.code === 'insufficient_quota' || 
          whisperError.message?.includes('quota') || whisperError.message?.includes('429')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Voice transcription temporarily unavailable',
            details: 'OpenAI quota exceeded. Please type your reasoning instead.',
            fallbackMessage: 'You can still submit your feedback by typing in the text area.'
          },
          { status: 503 } // Service temporarily unavailable
        );
      }

      // Handle other Whisper API errors
      if (whisperError.message?.includes('invalid_request_error')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid audio format',
            details: 'Please try recording again or type your reasoning instead.'
          },
          { status: 400 }
        );
      }

      // Re-throw to be caught by outer try-catch
      throw whisperError;
    }

  } catch (error) {
    console.error('Transcription failed:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('invalid_request_error')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid audio format',
            details: 'Please use a supported audio format (mp3, wav, webm, etc.)'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Transcription service temporarily unavailable',
            details: 'Please try again in a moment'
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function processTranscriptionForInsights(transcriptionText: string): Promise<{
  text: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}> {
  try {
    // Clean up the transcription text
    const cleanText = transcriptionText
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([a-z])/g, '$1 $2'); // Fix sentence spacing

    // Extract key points (simple sentence-based extraction)
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 200); // Filter reasonable sentence lengths

    // Simple sentiment analysis based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'strong', 'solid', 'impressive', 'qualified', 'experienced'];
    const negativeWords = ['bad', 'poor', 'weak', 'lacking', 'inexperienced', 'concerning', 'red flag', 'avoid'];
    
    const words = cleanText.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    // Select most informative sentences as key points
    const keyPoints = sentences
      .filter(sentence => {
        // Prefer sentences with decision-related keywords
        const decisionKeywords = ['because', 'since', 'due to', 'reason', 'experience', 'background', 'years', 'industry'];
        return decisionKeywords.some(keyword => sentence.toLowerCase().includes(keyword));
      })
      .slice(0, 3); // Limit to top 3

    // If no decision-related sentences, take first few sentences
    if (keyPoints.length === 0) {
      keyPoints.push(...sentences.slice(0, 2));
    }

    return {
      text: cleanText,
      keyPoints,
      sentiment
    };

  } catch (error) {
    console.error('Transcription processing failed:', error);
    
    // Fallback to basic processing
    return {
      text: transcriptionText.trim(),
      keyPoints: transcriptionText.trim().split(/[.!?]+/).slice(0, 2).map(s => s.trim()).filter(s => s.length > 0),
      sentiment: 'neutral'
    };
  }
}