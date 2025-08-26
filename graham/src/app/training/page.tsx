"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import VoiceTraining from "@/components/ui/voice-training"
import { 
  Brain, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  XCircle, 
  Mic, 
  Upload,
  Eye,
  Settings,
  Zap,
  Target,
  BarChart3,
  Clock,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Play,
  Pause,
  RotateCcw,
  Database,
  Activity,
  Lightbulb
} from "lucide-react"
import Link from "next/link"
import { generateDemoUserID } from "@/lib/utils/uuid"

interface TrainingMetrics {
  totalFeedback: number
  processedFeedback: number
  accuracyImprovement: number
  patternsDiscovered: number
  confidenceScore: number
  lastUpdate: string
}

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

interface PersonalIntelligence {
  userId: string
  accuracyTrend: number[]
  preferredIndustries: Array<{ name: string; weight: number }>
  successPatterns: string[]
  improvementAreas: string[]
  totalFeedbackContributions: number
  learningConfidence: number
}

interface VoiceTrainingData {
  sessionId: string
  duration: number
  transcription: string
  insights: string[]
  confidence: number
}

function TrainingDashboard() {
  // State management
  const [metrics, setMetrics] = React.useState<TrainingMetrics>({
    totalFeedback: 247,
    processedFeedback: 189,
    accuracyImprovement: 23.5,
    patternsDiscovered: 12,
    confidenceScore: 0.87,
    lastUpdate: '2 hours ago'
  })

  const [pendingPatterns, setPendingPatterns] = React.useState<PatternData[]>([
    {
      id: 'pattern-1',
      type: 'boost',
      pattern: 'VP Engineering with 5+ years at high-growth SaaS companies',
      confidence: 0.91,
      samples: 8,
      impact: 3.2,
      status: 'pending',
      discoveredAt: '2 hours ago',
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
      discoveredAt: '4 hours ago',
      evidence: [
        { commenterId: 'comm-4', name: 'Alex Johnson', score: 2.3, actualOutcome: false },
        { commenterId: 'comm-5', name: 'David Miller', score: 1.8, actualOutcome: false }
      ]
    }
  ])

  const [personalIntelligence, setPersonalIntelligence] = React.useState<PersonalIntelligence>({
    userId: generateDemoUserID(),
    accuracyTrend: [68, 71, 73, 76, 78, 82, 85, 87],
    preferredIndustries: [
      { name: 'SaaS', weight: 0.9 },
      { name: 'Fintech', weight: 0.7 },
      { name: 'E-commerce', weight: 0.6 }
    ],
    successPatterns: [
      'Strong preference for technical founders',
      'Values recent Y Combinator companies',
      'Responds well to specific use case mentions'
    ],
    improvementAreas: [
      'Better detection of enterprise vs SMB fit',
      'Improved timing analysis for outreach'
    ],
    totalFeedbackContributions: 47,
    learningConfidence: 0.87
  })

  const [isTrainingMode, setIsTrainingMode] = React.useState(false)
  const [voiceTrainingSessions, setVoiceTrainingSessions] = React.useState<VoiceTrainingData[]>([])

  // API integration functions
  const fetchTrainingMetrics = React.useCallback(async () => {
    try {
      const response = await fetch('/api/training/metrics')
      const data = await response.json()
      if (data.success) {
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch training metrics:', error)
    }
  }, [])

  const fetchPendingPatterns = React.useCallback(async () => {
    try {
      const response = await fetch('/api/training/patterns?status=pending')
      const data = await response.json()
      if (data.success) {
        setPendingPatterns(data.patterns)
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
    }
  }, [])

  const fetchPersonalIntelligence = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/training/intelligence?userId=${generateDemoUserID()}`)
      const data = await response.json()
      if (data.success) {
        setPersonalIntelligence(data.intelligence)
      }
    } catch (error) {
      console.error('Failed to fetch personal intelligence:', error)
    }
  }, [])

  // Initialize data on component mount
  React.useEffect(() => {
    fetchTrainingMetrics()
    fetchPendingPatterns()
    fetchPersonalIntelligence()
  }, [fetchTrainingMetrics, fetchPendingPatterns, fetchPersonalIntelligence])

  // Pattern action handler
  const handlePatternAction = async (patternId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/training/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId, action })
      })
      
      const data = await response.json()
      if (data.success) {
        // Update local state
        setPendingPatterns(prev => prev.map(p => 
          p.id === patternId 
            ? { ...p, status: action === 'approve' ? 'approved' : 'rejected' }
            : p
        ))
        
        // Refresh metrics
        fetchTrainingMetrics()
      }
    } catch (error) {
      console.error('Failed to update pattern:', error)
    }
  }

  // Voice training completion handler
  const handleVoiceTrainingComplete = (data: VoiceTrainingData) => {
    setVoiceTrainingSessions(prev => [...prev, data])
    
    // In production, would send to backend for processing
    console.log('Voice training session completed:', data)
    
    // Update metrics to reflect new learning
    setMetrics(prev => ({
      ...prev,
      totalFeedback: prev.totalFeedback + 1,
      processedFeedback: prev.processedFeedback + 1,
      lastUpdate: 'Just now'
    }))
  }

  const handleVoiceTraining = () => {
    // Voice training is now handled by the VoiceTraining component
    console.log('Voice training initiated...')
  }

  const handleBulkUpload = () => {
    // Would open file upload dialog
    console.log('Opening bulk training data upload...')
  }

  const handleResetTrainingData = async () => {
    // Confirm with user first
    const confirmed = window.confirm(
      'Are you sure you want to reset all training data? This action cannot be undone and will affect AI accuracy.'
    )
    
    if (!confirmed) return

    try {
      // First, get confirmation code
      const response = await fetch('/api/training/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetType: 'all' })
      })

      const data = await response.json()
      
      if (data.success && data.requiresConfirmation) {
        // Show confirmation dialog with code
        const userConfirmation = window.prompt(
          `To confirm reset, enter this confirmation code: ${data.confirmationCode}\n\n` +
          `This will affect approximately ${data.estimatedAffectedRecords} records.\n` +
          `Warning: ${data.warning}`
        )

        if (userConfirmation === data.confirmationCode) {
          // Submit with confirmation code
          const confirmResponse = await fetch('/api/training/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resetType: 'all',
              confirmationCode: data.confirmationCode
            })
          })

          const confirmData = await confirmResponse.json()
          
          if (confirmData.success) {
            alert(`Training data reset completed! ${confirmData.recordsAffected} records were affected.`)
            
            // Refresh the dashboard
            fetchTrainingMetrics()
            fetchPendingPatterns()
            fetchPersonalIntelligence()
          } else {
            alert(`Reset failed: ${confirmData.error}`)
          }
        } else if (userConfirmation !== null) {
          alert('Incorrect confirmation code. Reset cancelled.')
        }
      } else {
        alert(`Reset initiation failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Reset error:', error)
      alert('Failed to reset training data. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-h1 font-bold text-foreground mb-2 flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                AI Training Dashboard
              </h1>
              <p className="text-body-lg text-muted-foreground">
                Watch your AI learn and improve from your feedback in real-time
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleVoiceTraining} className="gap-2">
                <Mic className="w-4 h-4" />
                Voice Training
              </Button>
              <Button onClick={handleBulkUpload} variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Bulk Upload
              </Button>
            </div>
          </div>
          
          {/* Training Mode Toggle */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isTrainingMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <div>
                    <h3 className="font-semibold">Training Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      {isTrainingMode ? 'AI is actively learning from your feedback' : 'Training paused'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isTrainingMode}
                  onCheckedChange={setIsTrainingMode}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold">{metrics.totalFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy Boost</p>
                  <p className="text-2xl font-bold text-success">+{metrics.accuracyImprovement}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Patterns</p>
                  <p className="text-2xl font-bold">{metrics.patternsDiscovered}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-2xl font-bold">{Math.round(metrics.confidenceScore * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-sm font-semibold">{metrics.lastUpdate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="patterns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patterns" className="gap-2">
              <Eye className="w-4 h-4" />
              Pattern Validation
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="w-4 h-4" />
              Voice Training
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <Users className="w-4 h-4" />
              Personal Intelligence
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Pattern Validation Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Discovered Patterns Awaiting Validation
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review AI-discovered patterns and approve the ones that make sense for your prospecting
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPatterns.map((pattern) => (
                    <div key={pattern.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={pattern.type === 'boost' ? 'default' : 'destructive'}>
                              {pattern.type === 'boost' ? '+' : '-'} {Math.abs(pattern.impact)}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(pattern.confidence * 100)}% confident
                            </Badge>
                            <Badge variant="secondary">
                              {pattern.samples} samples
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {pattern.pattern}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Discovered {pattern.discoveredAt} • Impact: {pattern.impact > 0 ? '+' : ''}{pattern.impact} points
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handlePatternAction(pattern.id, 'approve')}
                            className="gap-1"
                            disabled={pattern.status !== 'pending'}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {pattern.status === 'approved' ? 'Approved' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePatternAction(pattern.id, 'reject')}
                            className="gap-1"
                            disabled={pattern.status !== 'pending'}
                          >
                            <XCircle className="w-4 h-4" />
                            {pattern.status === 'rejected' ? 'Rejected' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Evidence Examples */}
                      <div className="bg-muted/50 rounded-md p-3">
                        <h4 className="text-sm font-medium mb-2">Supporting Evidence:</h4>
                        <div className="space-y-1">
                          {pattern.evidence.slice(0, 3).map((evidence, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{evidence.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Score: {evidence.score}
                                </Badge>
                                {evidence.actualOutcome !== undefined && (
                                  <Badge
                                    variant={evidence.actualOutcome ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {evidence.actualOutcome ? 'Success' : 'No Response'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Training Tab */}
          <TabsContent value="voice" className="space-y-6">
            <VoiceTraining onTrainingComplete={handleVoiceTrainingComplete} />
            
            {/* Voice Training History */}
            {voiceTrainingSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Voice Training Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {voiceTrainingSessions.map((session) => (
                      <Card key={session.sessionId} className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">
                              {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
                            </Badge>
                            <Badge variant="default">
                              {Math.round(session.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 italic">
                            "{session.transcription.substring(0, 120)}..."
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Extracted Insights:</p>
                            {session.insights.slice(0, 2).map((insight, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground">• {insight}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Personal Intelligence Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Accuracy Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Your Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Accuracy</span>
                      <span className="font-semibold text-success">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      +19% improvement since you started training the AI
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Preferred Industries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Your Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {personalIntelligence.preferredIndustries.map((industry, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{industry.name}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={industry.weight * 100} className="w-20 h-2" />
                          <span className="text-sm font-medium w-8">
                            {Math.round(industry.weight * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Success Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Your Success Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {personalIntelligence.successPatterns.map((pattern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Improvement Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {personalIntelligence.improvementAreas.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Processing Speed</span>
                      <span className="font-semibold">1.2s avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Feedback Processed</span>
                      <span className="font-semibold">{metrics.processedFeedback}/{metrics.totalFeedback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Learning Efficiency</span>
                      <span className="font-semibold text-success">High</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Processed 12 new feedback entries</span>
                      <span className="text-muted-foreground ml-auto">2h ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Discovered 2 new patterns</span>
                      <span className="text-muted-foreground ml-auto">4h ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>Updated user preferences</span>
                      <span className="text-muted-foreground ml-auto">1d ago</span>
                    </div>
                    {voiceTrainingSessions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span>Completed voice training session</span>
                        <span className="text-muted-foreground ml-auto">Now</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/research">
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Back to Research
                </Button>
              </Link>
              <Button variant="outline" className="gap-2" onClick={handleBulkUpload}>
                <Upload className="w-4 h-4" />
                Import Training Data
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={handleResetTrainingData}
              >
                <RotateCcw className="w-4 h-4" />
                Reset Training Data
              </Button>
              <Button variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                Export Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TrainingPage() {
  return <TrainingDashboard />
}