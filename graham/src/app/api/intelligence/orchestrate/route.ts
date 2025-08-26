/**
 * API endpoint for intelligence system orchestration
 * POST /api/intelligence/orchestrate
 */

import { NextRequest, NextResponse } from 'next/server';
import IntelligenceOrchestrator from '@/lib/services/intelligence-orchestrator';
import type { APIResponse } from '@/lib/types/intelligence';

interface OrchestrationRequest {
  action: 'full_orchestration' | 'batch_processing' | 'pattern_discovery' | 'validation_check' | 'user_summary';
  userId?: string;
  config?: {
    enable_auto_discovery?: boolean;
    enable_auto_validation?: boolean;
    enable_real_time_learning?: boolean;
  };
}

interface RealtimeFeedbackRequest {
  action: 'realtime_feedback';
  userId: string;
  feedbackType: string;
  feedbackData: any;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestrationRequest | RealtimeFeedbackRequest = await request.json();
    
    const orchestrator = new IntelligenceOrchestrator(body.config);

    switch (body.action) {
      case 'full_orchestration': {
        const result = await orchestrator.runOrchestration();
        
        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          message: 'Full orchestration completed',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'realtime_feedback': {
        const feedbackBody = body as RealtimeFeedbackRequest;
        const result = await orchestrator.processRealtimeFeedback(
          feedbackBody.userId,
          feedbackBody.feedbackType,
          feedbackBody.feedbackData,
          feedbackBody.sessionId
        );

        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          message: 'Real-time feedback processed',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'user_summary': {
        if (!body.userId) {
          return NextResponse.json({
            success: false,
            error: 'User ID is required for user summary',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        const summary = await orchestrator.getUserIntelligenceSummary(body.userId);
        
        const response: APIResponse<typeof summary> = {
          success: true,
          data: summary,
          message: 'User intelligence summary retrieved',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'pattern_discovery': {
        // This would trigger pattern discovery specifically
        const patterns = await orchestrator.runOrchestration();
        
        const response: APIResponse<typeof patterns.pattern_discovery> = {
          success: true,
          data: patterns.pattern_discovery,
          message: 'Pattern discovery completed',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'validation_check': {
        const experiments = await orchestrator.startPatternValidations();
        
        const response: APIResponse<typeof experiments> = {
          success: true,
          data: experiments,
          message: 'Validation checks initiated',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Error in intelligence orchestration:', error);
    
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
    const action = searchParams.get('action') || 'status';
    const userId = searchParams.get('userId');

    const orchestrator = new IntelligenceOrchestrator();

    switch (action) {
      case 'status': {
        const status = await orchestrator.getSystemStatus();
        
        const response: APIResponse<typeof status> = {
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'user_init': {
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'User ID is required for initialization',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        const profile = await orchestrator.initializeUserIntelligence(userId);
        
        const response: APIResponse<typeof profile> = {
          success: true,
          data: profile,
          message: 'User intelligence initialized',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Error in orchestration GET:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}