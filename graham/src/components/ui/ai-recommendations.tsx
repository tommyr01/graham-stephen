/**
 * AI Recommendations Component - V2.0
 * Provides intelligent recommendations based on AI analysis and training data
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Lightbulb, 
  TrendingUp, 
  MessageSquare,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Star
} from "lucide-react"

interface AIRecommendation {
  id: string
  type: 'outreach_strategy' | 'timing' | 'content_focus' | 'follow_up' | 'qualification'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  reasoning: string
  actionable: boolean
  confidence: number
  relatedPatterns?: string[]
  exampleMessage?: string
}

interface AIRecommendationsProps {
  prospectId: string
  aiPrediction?: any
  similarProspects?: any[]
  contentAnalysis?: any
  className?: string
  compact?: boolean
}

export function AIRecommendations({ 
  prospectId,
  aiPrediction,
  similarProspects = [],
  contentAnalysis,
  className,
  compact = false
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = React.useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(!compact)

  const generateRecommendations = React.useCallback(async () => {
    if (!aiPrediction && !similarProspects.length) return

    setIsLoading(true)
    
    try {
      // Generate recommendations based on available data
      const generatedRecommendations: AIRecommendation[] = []

      // Outreach strategy recommendations
      if (aiPrediction?.predictedDecision === 'contact') {
        if (aiPrediction.confidence >= 80) {
          generatedRecommendations.push({
            id: 'high-confidence-contact',
            type: 'outreach_strategy',
            priority: 'high',
            title: 'High-Confidence Contact Opportunity',
            description: 'AI predicts strong likelihood of positive response',
            reasoning: `Based on ${aiPrediction.learningMetadata.patternsUsed} learned patterns, this prospect shows strong indicators for successful outreach.`,
            actionable: true,
            confidence: aiPrediction.confidence,
            exampleMessage: "Hi [Name], I noticed your recent post about [relevant topic]. Your expertise in [area] aligns perfectly with what we're building at [company]. Would love to share how we're helping similar [role] professionals..."
          })
        } else {
          generatedRecommendations.push({
            id: 'moderate-confidence-contact',
            type: 'outreach_strategy',
            priority: 'medium',
            title: 'Cautious Outreach Recommended',
            description: 'Moderate confidence - personalize approach',
            reasoning: `AI shows ${aiPrediction.confidence}% confidence. Consider additional research to strengthen approach.`,
            actionable: true,
            confidence: aiPrediction.confidence
          })
        }
      }

      // Content-based recommendations
      if (contentAnalysis) {
        if (contentAnalysis.authenticityScore < 6) {
          generatedRecommendations.push({
            id: 'low-authenticity-warning',
            type: 'qualification',
            priority: 'high',
            title: 'Content Authenticity Concerns',
            description: 'Low authentic content score detected',
            reasoning: `Authenticity score of ${contentAnalysis.authenticityScore.toFixed(1)}/10 suggests limited genuine expertise or AI-generated content.`,
            actionable: true,
            confidence: 85
          })
        }

        if (contentAnalysis.redFlagCount > 0) {
          generatedRecommendations.push({
            id: 'red-flags-detected',
            type: 'qualification',
            priority: 'high',
            title: 'Content Quality Issues',
            description: `${contentAnalysis.redFlagCount} quality concerns identified`,
            reasoning: 'Multiple content quality issues may indicate this prospect does not meet quality standards.',
            actionable: true,
            confidence: 90
          })
        }

        if (contentAnalysis.expertiseLevel >= 8) {
          generatedRecommendations.push({
            id: 'high-expertise-opportunity',
            type: 'outreach_strategy',
            priority: 'high',
            title: 'High-Expertise Prospect Detected',
            description: 'Strong subject matter expertise identified',
            reasoning: `Expertise score of ${contentAnalysis.expertiseLevel.toFixed(1)}/10 indicates deep knowledge and credibility.`,
            actionable: true,
            confidence: 95,
            exampleMessage: "Hi [Name], Your insights on [expertise area] really caught my attention, especially your recent thoughts on [specific topic]. I'd love to discuss how our work in [related area] might align with your expertise..."
          })
        }
      }

      // Similar prospects insights
      if (similarProspects.length > 0) {
        const contactedSimilar = similarProspects.filter(p => p.grahamDecision === 'contact')
        const successfulOutcomes = contactedSimilar.filter(p => 
          p.outcome?.responded || p.outcome?.meetingHeld || p.outcome?.dealClosed
        )

        if (contactedSimilar.length > 0 && successfulOutcomes.length > 0) {
          const successRate = (successfulOutcomes.length / contactedSimilar.length) * 100
          
          generatedRecommendations.push({
            id: 'similar-success-pattern',
            type: 'outreach_strategy',
            priority: 'medium',
            title: 'Proven Success Pattern',
            description: `${Math.round(successRate)}% success rate with similar prospects`,
            reasoning: `${successfulOutcomes.length} out of ${contactedSimilar.length} similar prospects had positive outcomes.`,
            actionable: true,
            confidence: 75,
            relatedPatterns: contactedSimilar.map(p => p.originalReasoning).filter(Boolean).slice(0, 2)
          })
        }

        // Best time to contact based on similar prospects
        const recentSuccesses = successfulOutcomes.filter(p => 
          new Date(p.decisionDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )

        if (recentSuccesses.length > 0) {
          generatedRecommendations.push({
            id: 'timing-recommendation',
            type: 'timing',
            priority: 'low',
            title: 'Optimal Timing Detected',
            description: 'Recent success with similar prospects',
            reasoning: `${recentSuccesses.length} similar prospects responded positively in the last 30 days.`,
            actionable: true,
            confidence: 65
          })
        }
      }

      // Follow-up recommendations
      if (aiPrediction?.predictedDecision === 'skip' && aiPrediction?.confidence < 70) {
        generatedRecommendations.push({
          id: 'reconsider-later',
          type: 'follow_up',
          priority: 'low',
          title: 'Monitor for Changes',
          description: 'Low confidence skip - consider revisiting',
          reasoning: `AI shows only ${aiPrediction.confidence}% confidence in skip decision. Prospect profile may improve over time.`,
          actionable: true,
          confidence: 60
        })
      }

      setRecommendations(generatedRecommendations.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }))

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [aiPrediction, similarProspects, contentAnalysis])

  React.useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  const getRecommendationIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'outreach_strategy': return MessageSquare
      case 'timing': return Calendar
      case 'content_focus': return Target
      case 'follow_up': return TrendingUp
      case 'qualification': return AlertTriangle
      default: return Lightbulb
    }
  }

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-300'
      default: return 'text-gray-600 bg-gray-100 border-gray-300'
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Generating AI recommendations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2" />
            <p>No specific recommendations available</p>
            <p className="text-sm">More data needed for personalized insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    const topRecommendations = recommendations.slice(0, 2)
    
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRecommendations.map((rec) => {
              const IconComponent = getRecommendationIcon(rec.type)
              return (
                <div key={rec.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                  <IconComponent className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{rec.title}</p>
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {recommendations.length > 2 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(true)}
              className="w-full mt-3"
            >
              View {recommendations.length - 2} More Recommendations
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Recommendations
            </CardTitle>
            <CardDescription>
              Personalized insights based on your training data and AI analysis
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
            {recommendations.length} insights
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => {
          const IconComponent = getRecommendationIcon(recommendation.type)
          
          return (
            <Card key={recommendation.id} className={`${
              recommendation.priority === 'high' ? 'border-red-200 bg-red-50/30' :
              recommendation.priority === 'medium' ? 'border-yellow-200 bg-yellow-50/30' :
              'border-blue-200 bg-blue-50/30'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      recommendation.priority === 'high' ? 'bg-red-100 text-red-600' :
                      recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{recommendation.title}</h4>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{recommendation.description}</p>
                      <p className="text-xs text-muted-foreground italic">{recommendation.reasoning}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      {recommendation.confidence}% confidence
                    </div>
                  </div>
                </div>

                {recommendation.exampleMessage && (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Message:</p>
                    <p className="text-sm text-gray-700 italic">
                      "{recommendation.exampleMessage}"
                    </p>
                  </div>
                )}

                {recommendation.relatedPatterns && recommendation.relatedPatterns.length > 0 && (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Related Success Patterns:</p>
                    <div className="space-y-1">
                      {recommendation.relatedPatterns.map((pattern, index) => (
                        <p key={index} className="text-xs text-gray-600 italic line-clamp-1">
                          "_{pattern}_"
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {recommendation.actionable && (
                  <div className="mt-3 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-700">Actionable recommendation</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}