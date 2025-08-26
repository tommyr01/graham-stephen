/**
 * Performance Health Check Endpoint
 * Monitor API performance and system health
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, logPerformanceSummary } from '@/lib/utils/performance-monitor';
import { circuitBreakers } from '@/lib/utils/ai-service-utils';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test database connectivity
    const dbHealthPromise = testDatabaseHealth();
    
    // Get performance statistics
    const performanceStats = performanceMonitor.getStats();
    const slowOperations = performanceMonitor.getSlowOperations(5000);
    
    // Get circuit breaker states
    const circuitBreakerStates = {
      openai: circuitBreakers.openai.getState(),
      anthropic: circuitBreakers.anthropic.getState()
    };
    
    // Wait for database health check
    const dbHealth = await dbHealthPromise;
    
    const totalTime = Date.now() - startTime;
    
    // Determine overall health status
    const criticalIssues = [];
    if (!dbHealth.healthy) criticalIssues.push('Database connectivity issues');
    if (circuitBreakerStates.openai === 'OPEN') criticalIssues.push('OpenAI service unavailable');
    if (circuitBreakerStates.anthropic === 'OPEN') criticalIssues.push('Anthropic service unavailable');
    
    // Prediction performance monitoring removed
    
    const healthStatus = criticalIssues.length === 0 ? 'healthy' : 
                        criticalIssues.length <= 1 ? 'degraded' : 'unhealthy';
    
    // Performance recommendations
    const recommendations = generatePerformanceRecommendations(performanceStats, slowOperations);
    
    return NextResponse.json({
      status: healthStatus,
      timestamp: new Date().toISOString(),
      responseTime: totalTime,
      criticalIssues,
      
      // Performance metrics
      performance: {
        stats: performanceStats,
        slowOperations: slowOperations.slice(0, 5), // Top 5 slowest
        recommendations
      },
      
      // Service health
      services: {
        database: dbHealth,
        circuitBreakers: circuitBreakerStates,
        aiServices: {
          openai: {
            available: circuitBreakerStates.openai !== 'OPEN',
            state: circuitBreakerStates.openai
          },
          anthropic: {
            available: circuitBreakerStates.anthropic !== 'OPEN',
            state: circuitBreakerStates.anthropic
          }
        }
      },
      
      // System metrics
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      criticalIssues: ['Health check endpoint failure']
    }, { status: 500 });
  }
}

/**
 * Test database connectivity and basic operations
 */
async function testDatabaseHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  details: any;
}> {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        healthy: false,
        responseTime,
        details: { error: error.message }
      };
    }
    
    // Test if critical tables exist
    const { data: tableData, error: tableError } = await supabase
      .rpc('check_critical_tables');
    
    if (tableError) {
      console.warn('Table check failed (non-critical):', tableError);
    }
    
    return {
      healthy: true,
      responseTime,
      details: {
        tablesAccessible: !tableError,
        sampleQuerySuccess: true
      }
    };
    
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Generate performance recommendations based on metrics
 */
function generatePerformanceRecommendations(
  stats: Record<string, any>, 
  slowOps: any[]
): string[] {
  const recommendations: string[] = [];
  
  // Prediction performance monitoring removed
  
  // Check error rates
  Object.entries(stats).forEach(([operation, metrics]: [string, any]) => {
    if (metrics.successRate < 95) {
      recommendations.push(`${operation} has ${metrics.successRate.toFixed(1)}% success rate - investigate error causes`);
    }
  });
  
  // Check for frequently slow operations
  const frequentSlowOps = slowOps.filter(op => op.operation === 'content_analysis').length;
  if (frequentSlowOps > 3) {
    recommendations.push('Content analysis frequently slow - consider AI service optimization or fallback strategies');
  }
  
  // Memory usage recommendations
  const memUsage = process.memoryUsage();
  const memUsageMB = memUsage.heapUsed / 1024 / 1024;
  if (memUsageMB > 500) {
    recommendations.push(`High memory usage: ${memUsageMB.toFixed(0)}MB - consider memory optimization`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ System performance looks good!');
  }
  
  return recommendations;
}

/**
 * Reset performance monitoring data (for testing/debugging)
 */
export async function DELETE(request: NextRequest) {
  try {
    performanceMonitor.reset();
    
    // Reset circuit breakers
    circuitBreakers.openai.reset();
    circuitBreakers.anthropic.reset();
    
    return NextResponse.json({
      success: true,
      message: 'Performance monitoring data reset',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Reset failed'
    }, { status: 500 });
  }
}

/**
 * Trigger detailed performance logging (for debugging)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'log_summary') {
      logPerformanceSummary();
      return NextResponse.json({
        success: true,
        message: 'Performance summary logged to console'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Action failed'
    }, { status: 500 });
  }
}