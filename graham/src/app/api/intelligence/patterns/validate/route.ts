/**
 * API endpoint for pattern validation
 * POST /api/intelligence/patterns/validate
 */

import { NextRequest, NextResponse } from 'next/server';
import PatternValidationSystem from '@/lib/services/pattern-validation-system';
import type { APIResponse, ValidationExperiment, ExperimentResult } from '@/lib/types/intelligence';

interface ValidatePatternRequest {
  patternId: string;
  validationConfig?: {
    min_users_per_group?: number;
    experiment_duration_days?: number;
    significance_threshold?: number;
    early_stopping?: boolean;
  };
}

interface UpdateExperimentRequest {
  experimentId: string;
  action: 'update_metrics' | 'conclude' | 'cancel';
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidatePatternRequest = await request.json();
    const { patternId, validationConfig } = body;

    if (!patternId) {
      return NextResponse.json({
        success: false,
        error: 'Pattern ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Initialize pattern validation system
    const validationSystem = new PatternValidationSystem(validationConfig);

    // Start pattern validation
    const experiment = await validationSystem.startPatternValidation(patternId, validationConfig);

    const response: APIResponse<ValidationExperiment> = {
      success: true,
      data: experiment,
      message: `Started validation experiment for pattern ${patternId}`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting pattern validation:', error);
    
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
    const body: UpdateExperimentRequest = await request.json();
    const { experimentId, action, reason } = body;

    if (!experimentId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Experiment ID and action are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validationSystem = new PatternValidationSystem();
    let result: ExperimentResult;

    switch (action) {
      case 'update_metrics':
        result = await validationSystem.updateExperimentMetrics(experimentId);
        break;
      
      case 'conclude':
        result = await validationSystem.concludeExperiment(experimentId, reason);
        break;
      
      case 'cancel':
        result = await validationSystem.concludeExperiment(experimentId, reason || 'cancelled');
        break;
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    const response: APIResponse<ExperimentResult> = {
      success: true,
      data: result,
      message: `Experiment ${action} completed successfully`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating experiment:', error);
    
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
    const status = searchParams.get('status') || 'running';
    const patternId = searchParams.get('patternId');

    const validationSystem = new PatternValidationSystem();
    
    let experiments: ValidationExperiment[];
    
    if (status === 'running') {
      experiments = await validationSystem.getActiveExperiments();
    } else {
      experiments = await validationSystem.getExperimentHistory(patternId || undefined);
    }

    const response: APIResponse<ValidationExperiment[]> = {
      success: true,
      data: experiments,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}