import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Training Metrics API
 * Returns comprehensive training dashboard metrics from real database
 */

interface TrainingMetrics {
  totalFeedback: number
  processedFeedback: number
  accuracyImprovement: number
  patternsDiscovered: number
  confidenceScore: number
  lastUpdate: string
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
  systemHealth: {
    databaseConnected: boolean
    tablesAccessible: number
    lastDataUpdate: string | null
  }
}

export async function GET() {
  try {
    const metrics = await fetchRealTrainingMetrics()

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error('Training metrics API error:', error)
    
    // Fallback to basic metrics if database fails
    const fallbackMetrics: TrainingMetrics = {
      totalFeedback: 0,
      processedFeedback: 0,
      accuracyImprovement: 0,
      patternsDiscovered: 0,
      confidenceScore: 0,
      lastUpdate: new Date().toISOString(),
      recentActivity: [],
      systemHealth: {
        databaseConnected: false,
        tablesAccessible: 0,
        lastDataUpdate: null
      }
    }
    
    return NextResponse.json({
      success: true,
      metrics: fallbackMetrics,
      warning: 'Using fallback data due to database error'
    })
  }
}

async function fetchRealTrainingMetrics(): Promise<TrainingMetrics> {
  const metrics: TrainingMetrics = {
    totalFeedback: 0,
    processedFeedback: 0,
    accuracyImprovement: 0,
    patternsDiscovered: 0,
    confidenceScore: 0,
    lastUpdate: new Date().toISOString(),
    recentActivity: [],
    systemHealth: {
      databaseConnected: true,
      tablesAccessible: 0,
      lastDataUpdate: null
    }
  }

  try {
    // Get feedback interactions count
    const { count: totalFeedback, error: feedbackError } = await supabase
      .from('feedback_interactions')
      .select('*', { count: 'exact', head: true })
    
    if (!feedbackError) {
      metrics.totalFeedback = totalFeedback || 0
      metrics.systemHealth.tablesAccessible++
    }

    // Get processed feedback count
    const { count: processedFeedback } = await supabase
      .from('feedback_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true)
    
    metrics.processedFeedback = processedFeedback || 0

    // Get discovered patterns count
    const { count: patternsCount, error: patternsError } = await supabase
      .from('discovered_patterns')
      .select('*', { count: 'exact', head: true })
    
    if (!patternsError) {
      metrics.patternsDiscovered = patternsCount || 0
      metrics.systemHealth.tablesAccessible++
    }

    // Get latest research quality metrics for accuracy improvement
    const { data: latestMetrics } = await supabase
      .from('research_quality_metrics')
      .select('prediction_accuracy, calculated_at')
      .order('calculated_at', { ascending: false })
      .limit(2)
    
    if (latestMetrics && latestMetrics.length >= 2) {
      const current = latestMetrics[0].prediction_accuracy || 0
      const previous = latestMetrics[1].prediction_accuracy || 0
      metrics.accuracyImprovement = ((current - previous) / previous) * 100
      metrics.systemHealth.tablesAccessible++
    }

    // Calculate confidence score from user intelligence profiles
    const { data: profiles } = await supabase
      .from('user_intelligence_profiles')
      .select('learning_confidence')
      .not('learning_confidence', 'is', null)
    
    if (profiles && profiles.length > 0) {
      const avgConfidence = profiles.reduce((sum, p) => sum + (p.learning_confidence || 0), 0) / profiles.length
      metrics.confidenceScore = avgConfidence
      metrics.systemHealth.tablesAccessible++
    }

    // Get recent activity from multiple sources
    const recentActivity = []

    // Recent feedback interactions
    const { data: recentFeedback } = await supabase
      .from('feedback_interactions')
      .select('id, interaction_type, created_at, feedback_data')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (recentFeedback) {
      recentFeedback.forEach(feedback => {
        recentActivity.push({
          id: `feedback-${feedback.id}`,
          type: 'feedback_processed',
          description: `Processed ${feedback.interaction_type} feedback`,
          timestamp: feedback.created_at
        })
      })
    }

    // Recent pattern discoveries
    const { data: recentPatterns } = await supabase
      .from('discovered_patterns')
      .select('id, pattern_name, discovered_at, confidence_score')
      .order('discovered_at', { ascending: false })
      .limit(2)
    
    if (recentPatterns) {
      recentPatterns.forEach(pattern => {
        recentActivity.push({
          id: `pattern-${pattern.id}`,
          type: 'pattern_discovered',
          description: `Discovered pattern: ${pattern.pattern_name}`,
          timestamp: pattern.discovered_at
        })
      })
    }

    // Recent agent improvements
    const { data: recentImprovements } = await supabase
      .from('agent_improvements')
      .select('id, improvement_name, implemented_at')
      .order('implemented_at', { ascending: false })
      .limit(2)
    
    if (recentImprovements) {
      recentImprovements.forEach(improvement => {
        recentActivity.push({
          id: `improvement-${improvement.id}`,
          type: 'system_improvement',
          description: improvement.improvement_name,
          timestamp: improvement.implemented_at
        })
      })
    }

    // Sort activity by timestamp and limit to 5 most recent
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    metrics.recentActivity = recentActivity.slice(0, 5)

    // Set last update time
    if (metrics.recentActivity.length > 0) {
      metrics.lastUpdate = metrics.recentActivity[0].timestamp
      metrics.systemHealth.lastDataUpdate = metrics.recentActivity[0].timestamp
    }

  } catch (error) {
    console.error('Error fetching real training metrics:', error)
    metrics.systemHealth.databaseConnected = false
    throw error
  }

  return metrics
}

export async function POST() {
  return NextResponse.json({
    error: 'Method not allowed'
  }, { status: 405 })
}