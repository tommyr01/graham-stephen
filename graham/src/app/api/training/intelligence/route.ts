import { NextRequest, NextResponse } from 'next/server'
import { generateDemoUserID, convertToUUID } from '@/lib/utils/uuid'

/**
 * Personal Intelligence API
 * Returns user-specific learning insights and preferences
 */

interface PersonalIntelligence {
  userId: string
  accuracyTrend: number[]
  preferredIndustries: Array<{ name: string; weight: number }>
  successPatterns: string[]
  improvementAreas: string[]
  totalFeedbackContributions: number
  learningConfidence: number
  performanceMetrics: {
    currentAccuracy: number
    accuracyImprovement: number
    feedbackQuality: number
    responseConsistency: number
  }
  recentLearnings: Array<{
    id: string
    type: 'preference_update' | 'pattern_discovery' | 'accuracy_improvement'
    description: string
    impact: number
    timestamp: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || generateDemoUserID()

    // Mock personal intelligence data - would fetch from database
    const personalIntelligence: PersonalIntelligence = {
      userId: convertToUUID(userId, 'user'),
      accuracyTrend: [68, 71, 73, 76, 78, 82, 85, 87],
      preferredIndustries: [
        { name: 'SaaS', weight: 0.9 },
        { name: 'Fintech', weight: 0.7 },
        { name: 'E-commerce', weight: 0.6 },
        { name: 'Healthcare Tech', weight: 0.5 },
        { name: 'EdTech', weight: 0.4 }
      ],
      successPatterns: [
        'Strong preference for technical founders',
        'Values recent Y Combinator companies',
        'Responds well to specific use case mentions',
        'Prefers mid-stage companies (Series A-C)',
        'High engagement with data-driven content'
      ],
      improvementAreas: [
        'Better detection of enterprise vs SMB fit',
        'Improved timing analysis for outreach',
        'More accurate seniority level assessment',
        'Enhanced geographic preference detection'
      ],
      totalFeedbackContributions: 47,
      learningConfidence: 0.87,
      performanceMetrics: {
        currentAccuracy: 87,
        accuracyImprovement: 19,
        feedbackQuality: 8.4,
        responseConsistency: 0.91
      },
      recentLearnings: [
        {
          id: 'learning-1',
          type: 'accuracy_improvement',
          description: 'Improved detection of technical roles by 12%',
          impact: 0.12,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'learning-2',
          type: 'pattern_discovery',
          description: 'Discovered preference for Y Combinator companies',
          impact: 0.08,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'learning-3',
          type: 'preference_update',
          description: 'Updated industry weights based on feedback',
          impact: 0.05,
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }

    return NextResponse.json({
      success: true,
      intelligence: personalIntelligence
    })

  } catch (error) {
    console.error('Personal intelligence API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch personal intelligence'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, feedbackData } = body

    if (!userId || !feedbackData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Process new feedback and update personal intelligence
    // In production, this would:
    // 1. Store the feedback in database
    // 2. Trigger learning pipeline
    // 3. Update user preferences
    // 4. Recalculate accuracy metrics

    return NextResponse.json({
      success: true,
      message: 'Feedback processed successfully',
      updatedMetrics: {
        accuracyImprovement: 0.03,
        newPatternsDiscovered: 1,
        confidenceIncrease: 0.02
      }
    })

  } catch (error) {
    console.error('Intelligence update API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update intelligence'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 })
    }

    // Reset personal intelligence (privacy feature)
    // In production, this would:
    // 1. Clear all user-specific learning data
    // 2. Reset preferences to defaults
    // 3. Maintain anonymized aggregate data if consented
    // 4. Log the reset for audit purposes

    return NextResponse.json({
      success: true,
      message: 'Personal intelligence reset successfully'
    })

  } catch (error) {
    console.error('Intelligence reset API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset intelligence'
    }, { status: 500 })
  }
}