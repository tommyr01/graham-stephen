/**
 * Analytics Dashboard Component - V2.0
 * Displays training metrics and AI learning progress
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Brain, 
  Users, 
  CheckCircle, 
  XCircle, 
  Zap,
  Calendar,
  Activity,
  RefreshCw
} from "lucide-react"

interface AnalyticsDashboardProps {
  className?: string
  compact?: boolean
}

interface TrainingMetrics {
  totalDecisions: number
  accuracyRate: number
  patternsLearned: number
  lastTrainingSession?: string
  weeklyProgress: {
    week: string
    decisions: number
    accuracy: number
  }[]
  decisionBreakdown: {
    contact: number
    skip: number
  }
  topPatterns: {
    id: string
    type: string
    accuracy: number
    usageCount: number
  }[]
  recentPerformance: {
    date: string
    predicted: 'contact' | 'skip'
    actual: 'contact' | 'skip'
    confidence: number
    correct: boolean
  }[]
}

export function AnalyticsDashboard({ className, compact = false }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = React.useState<TrainingMetrics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const loadMetrics = React.useCallback(async () => {
    try {
      const response = await fetch('/api/v2/analytics/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to load analytics metrics:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadMetrics()
  }

  React.useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p>No training data available yet</p>
            <p className="text-sm">Start training to see analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Training Progress
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{metrics.totalDecisions}</div>
              <div className="text-xs text-muted-foreground">Decisions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(metrics.accuracyRate * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">AI Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{metrics.patternsLearned}</div>
              <div className="text-xs text-muted-foreground">Patterns</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalDecisions}</p>
                <p className="text-xs text-muted-foreground">Training Decisions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(metrics.accuracyRate * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">AI Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{metrics.patternsLearned}</p>
                <p className="text-xs text-muted-foreground">Patterns Learned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((metrics.decisionBreakdown.contact / (metrics.decisionBreakdown.contact + metrics.decisionBreakdown.skip)) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Contact Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Decision Breakdown
          </CardTitle>
          <CardDescription>
            Your training decisions distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Contact Decisions
                </span>
                <span className="font-medium">{metrics.decisionBreakdown.contact}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(metrics.decisionBreakdown.contact / metrics.totalDecisions) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-orange-600" />
                  Skip Decisions
                </span>
                <span className="font-medium">{metrics.decisionBreakdown.skip}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(metrics.decisionBreakdown.skip / metrics.totalDecisions) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Top Performing Patterns
          </CardTitle>
          <CardDescription>
            AI patterns with highest accuracy rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topPatterns.slice(0, 5).map((pattern, index) => (
              <div key={pattern.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{pattern.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">Used {pattern.usageCount} times</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${
                    pattern.accuracy >= 0.9 ? 'bg-green-100 text-green-700 border-green-300' :
                    pattern.accuracy >= 0.7 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    'bg-red-100 text-red-700 border-red-300'
                  }`}
                >
                  {Math.round(pattern.accuracy * 100)}% accurate
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent AI Performance
          </CardTitle>
          <CardDescription>
            Last 10 predictions vs your actual decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.recentPerformance.slice(0, 10).map((performance, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    performance.correct ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(performance.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={`${
                    performance.predicted === 'contact' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    AI: {performance.predicted.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className={`${
                    performance.actual === 'contact' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    You: {performance.actual.toUpperCase()}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      performance.correct 
                        ? 'bg-green-100 text-green-700 border-green-300' 
                        : 'bg-red-100 text-red-700 border-red-300'
                    }`}
                  >
                    {performance.correct ? 'MATCH' : 'DIFF'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {metrics.lastTrainingSession && (
        <div className="text-xs text-muted-foreground text-center">
          Last training session: {new Date(metrics.lastTrainingSession).toLocaleString()}
        </div>
      )}
    </div>
  )
}