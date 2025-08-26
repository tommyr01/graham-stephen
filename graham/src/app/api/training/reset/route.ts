import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Reset Training Data API
 * Provides secure training data reset functionality
 * 
 * DELETE /api/training/reset - Reset all training data
 * POST /api/training/reset/confirm - Confirm and execute reset
 */

interface ResetRequest {
  confirmationCode?: string
  resetType: 'all' | 'patterns' | 'feedback' | 'user_profiles'
  userId?: string
}

// Generate a simple confirmation code for security
function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

// Store pending resets (in production, use Redis or database)
const pendingResets = new Map<string, { 
  code: string, 
  resetType: string, 
  userId?: string,
  timestamp: number 
}>()

export async function POST(request: NextRequest) {
  try {
    const body: ResetRequest = await request.json()
    const { confirmationCode, resetType = 'all', userId } = body

    // If no confirmation code, generate one and return it
    if (!confirmationCode) {
      const code = generateConfirmationCode()
      const resetId = Math.random().toString(36).substring(2)
      
      pendingResets.set(resetId, {
        code,
        resetType,
        userId,
        timestamp: Date.now()
      })

      // Clean up old pending resets (older than 5 minutes)
      for (const [id, reset] of pendingResets.entries()) {
        if (Date.now() - reset.timestamp > 5 * 60 * 1000) {
          pendingResets.delete(id)
        }
      }

      return NextResponse.json({
        success: true,
        requiresConfirmation: true,
        confirmationCode: code,
        resetId,
        message: `To confirm resetting ${resetType} training data, send this confirmation code back`,
        warning: 'This action cannot be undone. All training progress will be lost.',
        resetType,
        estimatedAffectedRecords: await getEstimatedResetCount(resetType, userId)
      })
    }

    // Find matching pending reset
    let matchingResetId: string | null = null
    let pendingReset: any = null

    for (const [id, reset] of pendingResets.entries()) {
      if (reset.code === confirmationCode && reset.resetType === resetType) {
        matchingResetId = id
        pendingReset = reset
        break
      }
    }

    if (!matchingResetId || !pendingReset) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired confirmation code'
      }, { status: 400 })
    }

    // Check if confirmation is too old (5 minutes)
    if (Date.now() - pendingReset.timestamp > 5 * 60 * 1000) {
      pendingResets.delete(matchingResetId)
      return NextResponse.json({
        success: false,
        error: 'Confirmation code expired. Please request a new reset.'
      }, { status: 400 })
    }

    // Execute the reset
    const resetResult = await executeReset(resetType, userId)
    
    // Remove the pending reset
    pendingResets.delete(matchingResetId)

    return NextResponse.json({
      success: true,
      message: `Training data reset completed successfully`,
      resetType,
      recordsAffected: resetResult.recordsAffected,
      resetDetails: resetResult.details,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Training reset API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process reset request'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resetType = searchParams.get('type') || 'all'
    const userId = searchParams.get('userId')

    // Get current training data statistics
    const stats = await getTrainingDataStats(resetType, userId)

    return NextResponse.json({
      success: true,
      currentStats: stats,
      resetTypes: {
        all: 'Reset all training data (feedback, patterns, user profiles)',
        patterns: 'Reset discovered patterns only', 
        feedback: 'Reset feedback interactions only',
        user_profiles: 'Reset user intelligence profiles only'
      },
      warning: 'Resetting training data cannot be undone and will affect AI accuracy'
    })

  } catch (error) {
    console.error('Training reset stats API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get training data statistics'
    }, { status: 500 })
  }
}

async function getEstimatedResetCount(resetType: string, userId?: string): Promise<number> {
  let totalCount = 0

  try {
    switch (resetType) {
      case 'all':
        // Count all training-related records
        const tables = [
          'feedback_interactions',
          'discovered_patterns', 
          'user_intelligence_profiles',
          'research_session_intelligence'
        ]
        
        for (const table of tables) {
          try {
            const { count } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
            totalCount += count || 0
          } catch (err) {
            console.warn(`Could not count ${table}:`, err)
          }
        }
        break

      case 'feedback':
        const { count: feedbackCount } = await supabase
          .from('feedback_interactions')
          .select('*', { count: 'exact', head: true })
        totalCount = feedbackCount || 0
        break

      case 'patterns':
        const { count: patternsCount } = await supabase
          .from('discovered_patterns')
          .select('*', { count: 'exact', head: true })
        totalCount = patternsCount || 0
        break

      case 'user_profiles':
        let query = supabase
          .from('user_intelligence_profiles')
          .select('*', { count: 'exact', head: true })
        
        if (userId) {
          query = query.eq('user_id', userId)
        }
        
        const { count: profilesCount } = await query
        totalCount = profilesCount || 0
        break
    }
  } catch (error) {
    console.warn('Could not estimate reset count:', error)
    return 0
  }

  return totalCount
}

async function getTrainingDataStats(resetType: string, userId?: string) {
  const stats: any = {
    totalRecords: 0,
    lastUpdate: null,
    breakdown: {}
  }

  try {
    // Get feedback interactions count
    let feedbackQuery = supabase
      .from('feedback_interactions')
      .select('*', { count: 'exact', head: true })
    
    if (userId) {
      feedbackQuery = feedbackQuery.eq('user_id', userId)
    }
    
    const { count: feedbackCount } = await feedbackQuery
    stats.breakdown.feedbackInteractions = feedbackCount || 0

    // Get patterns count
    const { count: patternsCount } = await supabase
      .from('discovered_patterns')
      .select('*', { count: 'exact', head: true })
    stats.breakdown.discoveredPatterns = patternsCount || 0

    // Get user profiles count
    let profilesQuery = supabase
      .from('user_intelligence_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (userId) {
      profilesQuery = profilesQuery.eq('user_id', userId)
    }
    
    const { count: profilesCount } = await profilesQuery
    stats.breakdown.userProfiles = profilesCount || 0

    // Calculate total
    stats.totalRecords = Object.values(stats.breakdown)
      .reduce((sum: number, count: any) => sum + count, 0)

    // Get last update timestamp
    const { data: lastFeedback } = await supabase
      .from('feedback_interactions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (lastFeedback && lastFeedback.length > 0) {
      stats.lastUpdate = lastFeedback[0].created_at
    }

  } catch (error) {
    console.warn('Could not get training data stats:', error)
  }

  return stats
}

async function executeReset(resetType: string, userId?: string) {
  const result = {
    recordsAffected: 0,
    details: {} as any
  }

  try {
    switch (resetType) {
      case 'all':
        // Reset all training data
        const allTables = [
          'feedback_interactions',
          'discovered_patterns',
          'user_intelligence_profiles', 
          'research_session_intelligence',
          'research_quality_metrics',
          'agent_improvements'
        ]

        for (const table of allTables) {
          try {
            let deleteQuery = supabase.from(table).delete()
            
            // For user-specific tables, optionally filter by user_id
            if (userId && ['feedback_interactions', 'user_intelligence_profiles', 'research_session_intelligence'].includes(table)) {
              deleteQuery = deleteQuery.eq('user_id', userId)
            }

            if (!userId || !['feedback_interactions', 'user_intelligence_profiles', 'research_session_intelligence'].includes(table)) {
              // For global resets or non-user-specific tables, delete everything
              deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000') // Delete all except impossible UUID
            }

            const { count } = await deleteQuery
            result.details[table] = count || 0
            result.recordsAffected += count || 0
          } catch (err) {
            console.warn(`Could not reset ${table}:`, err)
            result.details[table] = `Error: ${err}`
          }
        }
        break

      case 'feedback':
        let feedbackDelete = supabase.from('feedback_interactions').delete()
        if (userId) {
          feedbackDelete = feedbackDelete.eq('user_id', userId)
        } else {
          feedbackDelete = feedbackDelete.neq('id', '00000000-0000-0000-0000-000000000000')
        }
        const { count: feedbackDeleted } = await feedbackDelete
        result.recordsAffected = feedbackDeleted || 0
        result.details.feedbackInteractions = feedbackDeleted || 0
        break

      case 'patterns':
        const { count: patternsDeleted } = await supabase
          .from('discovered_patterns')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        result.recordsAffected = patternsDeleted || 0
        result.details.discoveredPatterns = patternsDeleted || 0
        break

      case 'user_profiles':
        let profilesDelete = supabase.from('user_intelligence_profiles').delete()
        if (userId) {
          profilesDelete = profilesDelete.eq('user_id', userId)
        } else {
          profilesDelete = profilesDelete.neq('id', '00000000-0000-0000-0000-000000000000')
        }
        const { count: profilesDeleted } = await profilesDelete
        result.recordsAffected = profilesDeleted || 0
        result.details.userProfiles = profilesDeleted || 0
        break
    }
  } catch (error) {
    console.error('Reset execution error:', error)
    throw new Error(`Failed to execute reset: ${error}`)
  }

  return result
}

// Handle unsupported methods
export async function GET_NOT_USED() {
  return NextResponse.json({
    error: 'Use POST to initiate reset or GET with parameters to view stats'
  }, { status: 405 })
}