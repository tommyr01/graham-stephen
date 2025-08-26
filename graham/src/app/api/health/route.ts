import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        linkedin_api: 'unknown',
      },
    };

    // Test database connection
    try {
      const { error: dbError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      healthCheck.services.database = dbError ? 'error' : 'ok';
    } catch (error) {
      healthCheck.services.database = 'error';
    }

    // Test LinkedIn API configuration
    if (process.env.RAPIDAPI_KEY) {
      healthCheck.services.linkedin_api = 'configured';
    } else {
      healthCheck.services.linkedin_api = 'not_configured';
    }

    // Determine overall status
    const hasErrors = Object.values(healthCheck.services).includes('error');
    if (hasErrors) {
      healthCheck.status = 'degraded';
    }

    const statusCode = hasErrors ? 503 : 200;

    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}