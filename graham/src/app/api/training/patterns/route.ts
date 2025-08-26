import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Training Patterns API
 * Manages pattern discovery, validation, and approval using real database
 */

interface PatternData {
  id: string
  type: 'boost' | 'down' | 'neutral'
  pattern: string
  confidence: number
  samples: number
  impact: number
  status: 'pending' | 'approved' | 'rejected'
  discoveredAt: string
  evidence: Array<{
    commenterId: string
    name: string
    score: number
    actualOutcome?: boolean
  }>
}

// Database pattern type mapping
const PATTERN_TYPE_MAPPING = {
  'success_indicator': 'boost',
  'quality_indicator': 'boost', 
  'engagement_signal': 'boost',
  'user_preference': 'boost',
  'timing_pattern': 'neutral',
  'industry_signal': 'neutral',
  'context_pattern': 'neutral'
}

// Mock patterns data fallback if database is empty
let fallbackPatterns: PatternData[] = [
  {
    id: 'pattern-1',
    type: 'boost',
    pattern: 'VP Engineering with 5+ years at high-growth SaaS companies',
    confidence: 0.91,
    samples: 8,
    impact: 3.2,
    status: 'pending',
    discoveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    evidence: [
      { commenterId: 'comm-1', name: 'Sarah Chen', score: 9.1, actualOutcome: true },
      { commenterId: 'comm-2', name: 'Marcus Rodriguez', score: 8.7, actualOutcome: true },
      { commenterId: 'comm-3', name: 'Jennifer Park', score: 8.9, actualOutcome: true }
    ]
  },
  {
    id: 'pattern-2',
    type: 'down',
    pattern: 'Posts primarily motivational quotes without technical content',
    confidence: 0.83,
    samples: 12,
    impact: -2.1,
    status: 'pending',
    discoveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    evidence: [
      { commenterId: 'comm-4', name: 'Alex Johnson', score: 2.3, actualOutcome: false },
      { commenterId: 'comm-5', name: 'David Miller', score: 1.8, actualOutcome: false }
    ]
  },
  {
    id: 'pattern-3',
    type: 'boost',
    pattern: 'Active in technical communities with detailed answers',
    confidence: 0.88,
    samples: 15,
    impact: 2.7,
    status: 'pending',
    discoveredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    evidence: [
      { commenterId: 'comm-6', name: 'Tom Wilson', score: 8.5, actualOutcome: true },
      { commenterId: 'comm-7', name: 'Lisa Brown', score: 7.9, actualOutcome: true }
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Try to fetch from database first
    let patterns = await fetchPatternsFromDatabase(status, type)
    
    // Fallback to mock data if database is empty or fails
    if (patterns.length === 0) {
      console.log('No patterns in database, using fallback data')
      patterns = filterMockPatterns(status, type)
    }

    // Calculate summary statistics
    const allPatterns = await fetchAllPatterns()
    const summary = {
      total: allPatterns.length,
      pending: allPatterns.filter(p => p.status === 'pending').length,
      approved: allPatterns.filter(p => p.status === 'approved').length,
      rejected: allPatterns.filter(p => p.status === 'rejected').length
    }

    return NextResponse.json({
      success: true,
      patterns,
      summary,
      dataSource: patterns.length > 0 ? (patterns[0].id.includes('pattern-') ? 'fallback' : 'database') : 'empty'
    })

  } catch (error) {
    console.error('Training patterns API error:', error)
    
    // Use fallback patterns on error
    const patterns = filterMockPatterns(status, type)
    
    return NextResponse.json({
      success: true,
      patterns,
      summary: {
        total: fallbackPatterns.length,
        pending: fallbackPatterns.filter(p => p.status === 'pending').length,
        approved: fallbackPatterns.filter(p => p.status === 'approved').length,
        rejected: fallbackPatterns.filter(p => p.status === 'rejected').length
      },
      warning: 'Using fallback data due to database error',
      dataSource: 'fallback'
    })
  }
}

async function fetchPatternsFromDatabase(statusFilter?: string | null, typeFilter?: string | null): Promise<PatternData[]> {
  try {
    let query = supabase
      .from('discovered_patterns')
      .select(`
        id,
        pattern_type,
        pattern_name,
        pattern_description,
        confidence_score,
        supporting_sessions,
        impact_score,
        validation_status,
        discovered_at,
        pattern_data
      `)
      .order('confidence_score', { ascending: false })

    // Apply filters
    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      const dbStatus = statusFilter === 'pending' ? 'discovered' : 
                     statusFilter === 'approved' ? 'validated' : 'deprecated'
      query = query.eq('validation_status', dbStatus)
    }

    const { data: dbPatterns, error } = await query

    if (error) {
      console.error('Database patterns fetch error:', error)
      return []
    }

    if (!dbPatterns || dbPatterns.length === 0) {
      return []
    }

    // Transform database patterns to frontend format
    const patterns: PatternData[] = dbPatterns.map(dbPattern => {
      const patternType = PATTERN_TYPE_MAPPING[dbPattern.pattern_type] || 'neutral'
      const status = dbPattern.validation_status === 'discovered' ? 'pending' :
                    dbPattern.validation_status === 'validated' ? 'approved' : 'rejected'

      return {
        id: dbPattern.id,
        type: patternType,
        pattern: dbPattern.pattern_name || dbPattern.pattern_description || 'Unknown pattern',
        confidence: dbPattern.confidence_score || 0,
        samples: dbPattern.supporting_sessions || 0,
        impact: dbPattern.impact_score || 0,
        status: status,
        discoveredAt: dbPattern.discovered_at,
        evidence: extractEvidenceFromPatternData(dbPattern.pattern_data)
      }
    })

    // Apply type filter
    if (typeFilter && ['boost', 'down', 'neutral'].includes(typeFilter)) {
      return patterns.filter(p => p.type === typeFilter)
    }

    return patterns

  } catch (error) {
    console.error('Error fetching patterns from database:', error)
    return []
  }
}

async function fetchAllPatterns(): Promise<PatternData[]> {
  try {
    const patterns = await fetchPatternsFromDatabase()
    return patterns.length > 0 ? patterns : fallbackPatterns
  } catch (error) {
    return fallbackPatterns
  }
}

function filterMockPatterns(statusFilter?: string | null, typeFilter?: string | null): PatternData[] {
  let filteredPatterns = [...fallbackPatterns]

  // Filter by status if provided
  if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
    filteredPatterns = filteredPatterns.filter(p => p.status === statusFilter)
  }

  // Filter by type if provided  
  if (typeFilter && ['boost', 'down', 'neutral'].includes(typeFilter)) {
    filteredPatterns = filteredPatterns.filter(p => p.type === typeFilter)
  }

  // Sort by confidence (highest first)
  filteredPatterns.sort((a, b) => b.confidence - a.confidence)

  return filteredPatterns
}

function extractEvidenceFromPatternData(patternData: any): Array<{commenterId: string, name: string, score: number, actualOutcome?: boolean}> {
  if (!patternData || !patternData.evidence) {
    return []
  }

  try {
    if (Array.isArray(patternData.evidence)) {
      return patternData.evidence.map((item: any) => ({
        commenterId: item.commenterId || item.id || `commenter-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || item.commenter_name || 'Anonymous',
        score: item.score || item.relevance_score || 0,
        actualOutcome: item.actualOutcome !== undefined ? item.actualOutcome : undefined
      }))
    }
  } catch (error) {
    console.warn('Error extracting evidence from pattern data:', error)
  }

  return []
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patternId, action } = body

    if (!patternId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pattern ID or action'
      }, { status: 400 })
    }

    // Try to update in database first
    const updateResult = await updatePatternInDatabase(patternId, action)
    
    if (updateResult.success) {
      return NextResponse.json({
        success: true,
        pattern: updateResult.pattern,
        message: `Pattern ${action}d successfully`,
        dataSource: 'database'
      })
    }

    // Fallback to mock data if database fails
    console.log('Database update failed, using fallback data')
    const fallbackResult = updateMockPattern(patternId, action)
    
    if (!fallbackResult.success) {
      return NextResponse.json({
        success: false,
        error: fallbackResult.error
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      pattern: fallbackResult.pattern,
      message: `Pattern ${action}d successfully (fallback mode)`,
      dataSource: 'fallback',
      warning: 'Updated in fallback data only, database may not reflect changes'
    })

  } catch (error) {
    console.error('Pattern action API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update pattern'
    }, { status: 500 })
  }
}

async function updatePatternInDatabase(patternId: string, action: 'approve' | 'reject'): Promise<{success: boolean, pattern?: any, error?: string}> {
  try {
    // Map frontend action to database status
    const dbStatus = action === 'approve' ? 'validated' : 'deprecated'
    
    // Update the pattern in database
    const { data, error } = await supabase
      .from('discovered_patterns')
      .update({ 
        validation_status: dbStatus,
        last_validated: new Date().toISOString()
      })
      .eq('id', patternId)
      .select()
      .single()

    if (error) {
      console.error('Database pattern update error:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Pattern not found in database' }
    }

    // Transform back to frontend format
    const patternType = PATTERN_TYPE_MAPPING[data.pattern_type] || 'neutral'
    const status = data.validation_status === 'validated' ? 'approved' : 'rejected'

    const pattern = {
      id: data.id,
      type: patternType,
      pattern: data.pattern_name || data.pattern_description || 'Unknown pattern',
      confidence: data.confidence_score || 0,
      samples: data.supporting_sessions || 0,
      impact: data.impact_score || 0,
      status: status,
      discoveredAt: data.discovered_at,
      evidence: extractEvidenceFromPatternData(data.pattern_data)
    }

    return { success: true, pattern }

  } catch (error) {
    console.error('Error updating pattern in database:', error)
    return { success: false, error: error.message }
  }
}

function updateMockPattern(patternId: string, action: 'approve' | 'reject'): {success: boolean, pattern?: PatternData, error?: string} {
  try {
    const patternIndex = fallbackPatterns.findIndex(p => p.id === patternId)
    if (patternIndex === -1) {
      return { success: false, error: 'Pattern not found' }
    }

    // Update pattern status
    fallbackPatterns[patternIndex].status = action === 'approve' ? 'approved' : 'rejected'

    return { 
      success: true, 
      pattern: fallbackPatterns[patternIndex] 
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { patterns } = body

    // Bulk pattern management
    if (!Array.isArray(patterns)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid patterns data'
      }, { status: 400 })
    }

    let updated = 0
    let errors = 0

    for (const pattern of patterns) {
      const patternIndex = mockPatterns.findIndex(p => p.id === pattern.id)
      if (patternIndex !== -1 && ['approve', 'reject'].includes(pattern.action)) {
        mockPatterns[patternIndex].status = pattern.action === 'approve' ? 'approved' : 'rejected'
        updated++
      } else {
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      errors,
      message: `Updated ${updated} patterns, ${errors} errors`
    })

  } catch (error) {
    console.error('Bulk pattern update API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to bulk update patterns'
    }, { status: 500 })
  }
}