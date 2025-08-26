/**
 * API endpoint for autonomous agent orchestration
 * POST /api/agents/orchestrate - Run agent orchestration
 * GET /api/agents/orchestrate - Get orchestration status
 */

import { NextRequest, NextResponse } from 'next/server';
import AutonomousAgentOrchestrator from '@/lib/services/autonomous-agents';
import type { APIResponse } from '@/lib/types/intelligence';

interface OrchestrationRequest {
  action: 'run_orchestration' | 'emergency_optimization' | 'status_check' | 'agent_status';
  config?: {
    autonomous_mode?: boolean;
    max_concurrent_agents?: number;
    agent_coordination_enabled?: boolean;
  };
  force_run?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestrationRequest = await request.json();
    
    const orchestrator = new AutonomousAgentOrchestrator(body.config);

    switch (body.action) {
      case 'run_orchestration': {
        // Check if orchestration should run (unless forced)
        if (!body.force_run) {
          const shouldRun = await orchestrator.shouldRunOrchestration();
          if (!shouldRun.should_run) {
            const response: APIResponse<typeof shouldRun> = {
              success: true,
              data: shouldRun,
              message: 'Orchestration not needed at this time',
              timestamp: new Date().toISOString()
            };
            return NextResponse.json(response);
          }
        }

        // Run the orchestration
        const result = await orchestrator.runOrchestration();
        
        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          message: `Orchestration completed: ${result.session.successful_executions}/${result.session.agents_executed.length} agents succeeded`,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'emergency_optimization': {
        const result = await orchestrator.executeEmergencyOptimization();
        
        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          message: `Emergency optimization completed: ${result.emergency_actions_taken.length} actions taken`,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'status_check': {
        const shouldRun = await orchestrator.shouldRunOrchestration();
        
        const response: APIResponse<typeof shouldRun> = {
          success: true,
          data: shouldRun,
          message: 'Orchestration status check completed',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'agent_status': {
        const statusReport = await orchestrator.getAgentStatusReport();
        
        const response: APIResponse<typeof statusReport> = {
          success: true,
          data: statusReport,
          message: 'Agent status report generated',
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
    console.error('Error in agent orchestration:', error);
    
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
    const action = searchParams.get('action') || 'agent_status';

    const orchestrator = new AutonomousAgentOrchestrator();

    switch (action) {
      case 'agent_status': {
        const statusReport = await orchestrator.getAgentStatusReport();
        
        const response: APIResponse<typeof statusReport> = {
          success: true,
          data: statusReport,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
      }

      case 'should_run': {
        const shouldRun = await orchestrator.shouldRunOrchestration();
        
        const response: APIResponse<typeof shouldRun> = {
          success: true,
          data: shouldRun,
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