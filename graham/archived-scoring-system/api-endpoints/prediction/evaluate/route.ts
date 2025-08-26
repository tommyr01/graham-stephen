/**
 * Prediction Evaluation API Endpoint
 * POST /api/v2/prediction/evaluate
 * Generates Graham's decision prediction for a prospect
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictiveScoring } from '@/lib/services/predictive-scoring-engine';
import { performanceMonitor, measurePerformance } from '@/lib/utils/performance-monitor';
import { z } from 'zod';

// Request validation schema
const EvaluateRequestSchema = z.object({
  prospectId: z.string().min(1), // Allow any non-empty string ID
  forceRefresh: z.boolean().default(false),
  // Prospect data for prediction
  prospectData: z.object({
    id: z.string(),
    name: z.string(),
    headline: z.string(),
    company: z.string(),
    location: z.string(),
    industry: z.string(),
    role: z.string(),
    experience: z.array(z.any()).default([]),
    recentPosts: z.array(z.any()).default([]),
    profileUrl: z.string(),
    profilePicture: z.string().optional()
  })
});

const BatchEvaluateRequestSchema = z.object({
  prospects: z.array(z.object({
    prospectId: z.string().min(1), // Allow any non-empty string ID
    prospectData: z.object({
      id: z.string(),
      name: z.string(),
      headline: z.string(),
      company: z.string(),
      location: z.string(),
      industry: z.string(),
      role: z.string(),
      experience: z.array(z.any()).default([]),
      recentPosts: z.array(z.any()).default([]),
      profileUrl: z.string(),
      profilePicture: z.string().optional()
    })
  })).max(10), // Limit batch size to 10
  options: z.object({
    includeReasoningDetails: z.boolean().default(true),
    includeSimilarProspects: z.boolean().default(true),
    maxSimilarProspects: z.number().min(1).max(10).default(5)
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a batch request
    if (body.prospects && Array.isArray(body.prospects)) {
      return handleBatchEvaluation(body);
    } else {
      return handleSingleEvaluation(body);
    }
  } catch (error) {
    console.error('Prediction request failed:', error);
    
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

async function handleSingleEvaluation(body: any) {
  try {
    // Validate request
    const validatedData = EvaluateRequestSchema.parse(body);
    
    // Check for cached prediction if not forcing refresh
    if (!validatedData.forceRefresh) {
      const cachedPrediction = await getCachedPrediction(validatedData.prospectId);
      if (cachedPrediction) {
        return NextResponse.json({
          success: true,
          data: {
            predictionId: cachedPrediction.id,
            prediction: cachedPrediction,
            processingTime: 0,
            cached: true,
            modelVersion: cachedPrediction.learningMetadata?.modelVersion || 'v2.0'
          }
        });
      }
    }

    // **PERFORMANCE OPTIMIZED**: Generate prediction with monitoring and timeout
    const { result: prediction, duration: processingTime } = await measurePerformance(
      'single_prediction',
      async () => {
        // Add timeout to prevent hanging
        const predictionPromise = predictiveScoring.predictGrahamDecision(validatedData.prospectData, validatedData.forceRefresh);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Prediction timeout after 60 seconds')), 60000)
        );
        
        return Promise.race([predictionPromise, timeoutPromise]);
      },
      {
        prospectId: validatedData.prospectId,
        forceRefresh: validatedData.forceRefresh,
        hasExperience: validatedData.prospectData.experience?.length > 0,
        hasRecentPosts: validatedData.prospectData.recentPosts?.length > 0
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        predictionId: prediction.learningMetadata.predictionId,
        prediction,
        processingTime,
        cached: false,
        modelVersion: prediction.learningMetadata.modelVersion
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

    console.error('Single evaluation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleBatchEvaluation(body: any) {
  try {
    // Validate batch request
    const validatedData = BatchEvaluateRequestSchema.parse(body);
    const options = validatedData.options || {};
    
    const startTime = Date.now();

    // **CRITICAL PERFORMANCE FIX**: Process all prospects in parallel instead of sequential
    const prospectPromises = validatedData.prospects.map(async (prospectRequest) => {
      const prospectStartTime = Date.now();
      
      try {
        // Generate prediction for this prospect (all running in parallel)
        const prediction = await predictiveScoring.predictGrahamDecision(prospectRequest.prospectData, false);
        const prospectProcessingTime = Date.now() - prospectStartTime;

        // Filter response based on options
        let filteredPrediction = { ...prediction };
        
        if (!options.includeReasoningDetails) {
          filteredPrediction.reasoning = {
            primaryFactors: prediction.reasoning.primaryFactors.slice(0, 2),
            concerningSignals: prediction.reasoning.concerningSignals.slice(0, 2),
            contentQuality: prediction.reasoning.contentQuality,
            experienceMatch: prediction.reasoning.experienceMatch,
            similarProspects: []
          };
        }
        
        if (!options.includeSimilarProspects) {
          filteredPrediction.reasoning.similarProspects = [];
        } else if (options.maxSimilarProspects) {
          filteredPrediction.reasoning.similarProspects = 
            prediction.reasoning.similarProspects.slice(0, options.maxSimilarProspects);
        }

        return {
          success: true,
          result: {
            prospectId: prospectRequest.prospectId,
            prediction: filteredPrediction,
            processingTime: prospectProcessingTime
          }
        };

      } catch (error) {
        console.error(`Prediction failed for prospect ${prospectRequest.prospectId}:`, error);
        return {
          success: false,
          error: {
            prospectId: prospectRequest.prospectId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        };
      }
    });

    // **PERFORMANCE MONITORING**: Track batch processing
    const { result: prospectResults, duration: batchDuration } = await measurePerformance(
      'batch_prediction',
      () => Promise.allSettled(prospectPromises),
      {
        batchSize: validatedData.prospects.length,
        includeReasoningDetails: options.includeReasoningDetails,
        includeSimilarProspects: options.includeSimilarProspects
      }
    );
    
    // Separate successful results from errors
    const results = [];
    const errors = [];
    
    prospectResults.forEach((settledResult, index) => {
      if (settledResult.status === 'fulfilled') {
        if (settledResult.value.success) {
          results.push(settledResult.value.result);
        } else {
          errors.push(settledResult.value.error);
        }
      } else {
        // Promise was rejected
        errors.push({
          prospectId: validatedData.prospects[index].prospectId,
          error: settledResult.reason?.message || 'Promise rejected'
        });
      }
    });

    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        predictions: results,
        totalProcessed: results.length,
        averageProcessingTime: results.length > 0 ? batchDuration / results.length : 0,
        parallelProcessingTime: batchDuration, // Total time with parallel processing
        sequentialEstimate: results.reduce((sum, r) => sum + r.processingTime, 0), // What it would have taken sequentially
        performanceGain: results.length > 1 ? 
          `${Math.round(((results.reduce((sum, r) => sum + r.processingTime, 0) / batchDuration) - 1) * 100)}% faster` : 'N/A',
        cacheHitRate: 0, // Would calculate from cached vs new predictions
        modelVersion: 'v2.0'
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

    console.error('Batch evaluation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Batch prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getCachedPrediction(prospectId: string): Promise<any | null> {
  try {
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase
      .from('prediction_results')
      .select('*')
      .eq('prospect_id', prospectId)
      .is('actual_decision', null) // Only get predictions that haven't been validated yet
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    // Check if prediction is recent enough (within 24 hours)
    const predictionAge = Date.now() - new Date(data.created_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (predictionAge > maxAge) return null;

    // Reconstruct prediction object
    return {
      id: data.id,
      predictedDecision: data.predicted_decision,
      confidence: data.confidence_score,
      reasoning: data.reasoning,
      scoreBreakdown: {
        // Would reconstruct from stored data
        finalScore: 0 // Placeholder
      },
      learningMetadata: {
        predictionId: data.id,
        modelVersion: data.model_version,
        dataQuality: 'medium' // Would determine from data
      }
    };

  } catch (error) {
    console.error('Cache retrieval failed:', error);
    return null;
  }
}