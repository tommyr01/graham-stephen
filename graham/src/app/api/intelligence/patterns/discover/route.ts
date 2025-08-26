/**
 * API endpoint for pattern discovery
 * POST /api/intelligence/patterns/discover
 */

import { NextRequest, NextResponse } from 'next/server';
import PatternDiscoveryEngine from '@/lib/services/pattern-discovery-engine';
import { supabase } from '@/lib/supabase';
import type { APIResponse, PatternDiscoveryResult } from '@/lib/types/intelligence';

interface DiscoverPatternsRequest {
  userId?: string;
  patternTypes?: string[];
  config?: {
    minSupportingSessions?: number;
    minConfidenceScore?: number;
    lookbackDays?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscoverPatternsRequest = await request.json();
    const { userId, patternTypes, config } = body;

    // Initialize pattern discovery engine with custom config if provided
    const patternEngine = new PatternDiscoveryEngine(config);

    // Discover patterns
    const discoveredPatterns = await patternEngine.discoverPatterns(userId);

    // Filter by pattern types if specified
    let filteredPatterns = discoveredPatterns;
    if (patternTypes && patternTypes.length > 0) {
      filteredPatterns = discoveredPatterns.filter(pattern => 
        patternTypes.includes(pattern.pattern_type)
      );
    }

    // Save discovered patterns to database
    const savedPatterns: string[] = [];
    for (const pattern of filteredPatterns) {
      try {
        const { data: savedPattern, error } = await supabase
          .from('discovered_patterns')
          .insert({
            pattern_type: pattern.pattern_type,
            pattern_name: pattern.pattern_name,
            pattern_description: pattern.pattern_description,
            pattern_data: pattern.pattern_data,
            trigger_conditions: pattern.trigger_conditions,
            expected_outcome: pattern.expected_outcome,
            confidence_score: pattern.confidence_score,
            supporting_sessions: pattern.supporting_sessions,
            discovery_method: pattern.discovery_method,
            discovery_agent: 'pattern_discovery_engine',
            applies_to_users: pattern.applies_to_users || [],
            applies_to_industries: pattern.applies_to_industries || [],
            applies_to_roles: pattern.applies_to_roles || [],
            validation_status: 'discovered'
          })
          .select('id')
          .single();

        if (!error && savedPattern) {
          savedPatterns.push(savedPattern.id);
        }
      } catch (error) {
        console.error('Error saving pattern:', error);
      }
    }

    const response: APIResponse<{
      patterns: PatternDiscoveryResult[];
      saved_count: number;
      discovery_config: any;
    }> = {
      success: true,
      data: {
        patterns: filteredPatterns,
        saved_count: savedPatterns.length,
        discovery_config: config || {}
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in pattern discovery:', error);
    
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
    const userId = searchParams.get('userId');
    const patternType = searchParams.get('patternType');
    const status = searchParams.get('status') || 'discovered';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('discovered_patterns')
      .select('*')
      .eq('validation_status', status)
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.or(`applies_to_users.cs.{${userId}},applies_to_users.eq.{}`);
    }

    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }

    const { data: patterns, error } = await query;

    if (error) {
      throw new Error(`Error fetching patterns: ${error.message}`);
    }

    const response: APIResponse<typeof patterns> = {
      success: true,
      data: patterns,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}