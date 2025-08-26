"use client"

import * as React from "react"
import { Brain, TrendingUp, Mic, Target, Users, Zap, BarChart3, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Progress } from "./progress"

interface VoiceLearningDashboardProps {
  userId: string
  className?: string
}

interface LearningStats {
  totalVoiceFeedback: number
  recentVoiceFeedback: number
  learningConfidence: number
  learningStage: 'learning' | 'developing' | 'ready'
  avgDuration: number
  commonSentiment: string
  accuracy: number
}

export function VoiceLearningDashboard({ userId, className }: VoiceLearningDashboardProps) {
  const [stats, setStats] = React.useState<LearningStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchLearningStats()
  }, [userId])

  const fetchLearningStats = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/voice-feedback?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch learning stats')
      }

      const data = await response.json()
      
      // Transform the data into our expected format
      setStats({
        totalVoiceFeedback: data.data.summary.totalVoiceFeedback || 0,
        recentVoiceFeedback: data.data.recentFeedback?.length || 0,
        learningConfidence: data.data.learningStats?.learning_confidence || 0,
        learningStage: data.data.learningStats?.learning_stage || 'learning',
        avgDuration: data.data.summary.avgDuration || 0,
        commonSentiment: data.data.summary.commonSentiment || 'neutral',
        accuracy: Math.min(100, (data.data.learningStats?.learning_confidence || 0) * 100)
      })

    } catch (err) {
      console.error('Error fetching learning stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("border-purple-200 bg-purple-50/30", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-purple-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span>Loading voice learning stats...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-orange-200 bg-orange-50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <Target className="w-4 h-4" />
            <span className="font-medium">Learning Dashboard Unavailable</span>
          </div>
          <p className="text-sm text-orange-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className={cn("border-gray-200 bg-gray-50", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-600">
            <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No voice feedback data yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'ready': return 'bg-green-100 text-green-700 border-green-200'
      case 'developing': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-purple-100 text-purple-700 border-purple-200'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'mixed': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className={cn("border-purple-200 bg-purple-50/30", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Brain className="w-5 h-5" />
          Voice Learning Intelligence
          <Badge className={getStageColor(stats.learningStage)}>
            {stats.learningStage}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Learning Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700 font-medium">Learning Progress</span>
            <span className="text-purple-600">{Math.round(stats.accuracy)}%</span>
          </div>
          <Progress value={stats.accuracy} className="h-2" />
          <p className="text-xs text-purple-600">
            System confidence in understanding your preferences
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-purple-700">
              <Mic className="w-3 h-3" />
              <span className="font-medium">Voice Inputs</span>
            </div>
            <div className="text-lg font-semibold text-purple-900">
              {stats.totalVoiceFeedback}
            </div>
            <div className="text-xs text-purple-600">
              {stats.recentVoiceFeedback} this week
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-purple-700">
              <Clock className="w-3 h-3" />
              <span className="font-medium">Avg Duration</span>
            </div>
            <div className="text-lg font-semibold text-purple-900">
              {formatDuration(stats.avgDuration)}
            </div>
            <div className="text-xs text-purple-600">
              per voice note
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-purple-700">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">Sentiment</span>
            </div>
            <div className={`text-lg font-semibold capitalize ${getSentimentColor(stats.commonSentiment)}`}>
              {stats.commonSentiment}
            </div>
            <div className="text-xs text-purple-600">
              overall tone
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-purple-700">
              <Target className="w-3 h-3" />
              <span className="font-medium">Confidence</span>
            </div>
            <div className="text-lg font-semibold text-purple-900">
              {Math.round(stats.learningConfidence * 100)}%
            </div>
            <div className="text-xs text-purple-600">
              in predictions
            </div>
          </div>
        </div>

        {/* Learning Stage Description */}
        <div className="p-3 bg-white rounded border border-purple-200">
          <div className="flex items-start gap-2">
            {stats.learningStage === 'ready' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
            ) : stats.learningStage === 'developing' ? (
              <BarChart3 className="w-4 h-4 text-blue-600 mt-0.5" />
            ) : (
              <Brain className="w-4 h-4 text-purple-600 mt-0.5" />
            )}
            
            <div className="flex-1">
              <h5 className="text-sm font-medium text-gray-900 mb-1">
                {stats.learningStage === 'ready' 
                  ? 'AI Ready - High Accuracy Predictions' 
                  : stats.learningStage === 'developing'
                  ? 'Learning Your Patterns'
                  : 'Building Understanding'
                }
              </h5>
              <p className="text-xs text-gray-600">
                {stats.learningStage === 'ready'
                  ? 'The system has learned your preferences and can make reliable predictions about prospects.'
                  : stats.learningStage === 'developing' 
                  ? 'Continue providing voice feedback to improve prediction accuracy.'
                  : 'Record more voice notes to help the AI understand your decision patterns.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-purple-200">
          <div className="text-xs text-purple-600">
            Next learning update in ~{Math.max(1, 10 - stats.recentVoiceFeedback)} voice inputs
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-500">
            <Zap className="w-3 h-3" />
            <span>AI-Powered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}