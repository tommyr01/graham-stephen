/**
 * Content Intelligence Display Component - V2.0
 * Shows content authenticity scores, red flags, and quality metrics
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Brain,
  TrendingUp,
  MessageSquare,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap
} from "lucide-react"

interface ContentIntelligenceProps {
  prospectId: string
  contentAnalysis?: {
    overallQuality: 'high' | 'medium' | 'low'
    authenticityScore: number
    expertiseLevel: number
    aiContentPercentage: number
    redFlagCount: number
  }
  postAnalysis?: Array<{
    id: string
    content: string
    publishedAt: string
    authenticityScore: number
    expertiseLevel: number
    redFlags: string[]
    qualityIndicators: string[]
    aiGenerated: boolean
  }>
  className?: string
  compact?: boolean
}

export function ContentIntelligenceDisplay({ 
  prospectId,
  contentAnalysis,
  postAnalysis,
  className,
  compact = false
}: ContentIntelligenceProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadedPostAnalysis, setLoadedPostAnalysis] = React.useState(postAnalysis)

  const loadDetailedAnalysis = async () => {
    if (loadedPostAnalysis) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v2/content/${prospectId}`)
      if (response.ok) {
        const data = await response.json()
        setLoadedPostAnalysis(data.postAnalysis || [])
      }
    } catch (error) {
      console.error('Failed to load detailed content analysis:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleExpanded = () => {
    if (!isExpanded && !loadedPostAnalysis) {
      loadDetailedAnalysis()
    }
    setIsExpanded(!isExpanded)
  }

  if (!contentAnalysis) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2" />
            <p>Content analysis not available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-100 border-green-300'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
      case 'low': return 'text-red-600 bg-red-100 border-red-300'
      default: return 'text-gray-600 bg-gray-100 border-gray-300'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (compact) {
    return (
      <Card className={`${className} border-l-4 ${
        contentAnalysis.overallQuality === 'high' ? 'border-l-green-500' :
        contentAnalysis.overallQuality === 'medium' ? 'border-l-yellow-500' :
        'border-l-red-500'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Content Quality
            </CardTitle>
            <Badge className={getQualityColor(contentAnalysis.overallQuality)}>
              {contentAnalysis.overallQuality.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Authenticity</p>
              <p className={`font-medium ${getScoreColor(contentAnalysis.authenticityScore)}`}>
                {contentAnalysis.authenticityScore.toFixed(1)}/10
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Expertise</p>
              <p className={`font-medium ${getScoreColor(contentAnalysis.expertiseLevel)}`}>
                {contentAnalysis.expertiseLevel.toFixed(1)}/10
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">AI Content</p>
              <p className={`font-medium ${contentAnalysis.aiContentPercentage > 50 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.round(contentAnalysis.aiContentPercentage)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Red Flags</p>
              <p className={`font-medium ${contentAnalysis.redFlagCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {contentAnalysis.redFlagCount}
              </p>
            </div>
          </div>
          
          {contentAnalysis.redFlagCount > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {contentAnalysis.redFlagCount} content quality concerns detected
              </p>
            </div>
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
              <Shield className="h-5 w-5" />
              Content Intelligence Analysis
            </CardTitle>
            <CardDescription>
              AI-powered content authenticity and quality assessment
            </CardDescription>
          </div>
          <Badge className={getQualityColor(contentAnalysis.overallQuality)}>
            {contentAnalysis.overallQuality.toUpperCase()} QUALITY
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className={`text-2xl font-bold ${getScoreColor(contentAnalysis.authenticityScore)}`}>
              {contentAnalysis.authenticityScore.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Authenticity Score</p>
            <div className="mt-2">
              <Progress 
                value={contentAnalysis.authenticityScore * 10} 
                className="h-1"
              />
            </div>
          </div>

          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className={`text-2xl font-bold ${getScoreColor(contentAnalysis.expertiseLevel)}`}>
              {contentAnalysis.expertiseLevel.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Expertise Level</p>
            <div className="mt-2">
              <Progress 
                value={contentAnalysis.expertiseLevel * 10} 
                className="h-1"
              />
            </div>
          </div>

          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className={`text-2xl font-bold ${
              contentAnalysis.aiContentPercentage > 50 ? 'text-red-600' : 
              contentAnalysis.aiContentPercentage > 25 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {Math.round(contentAnalysis.aiContentPercentage)}%
            </p>
            <p className="text-xs text-muted-foreground">AI Generated</p>
            <div className="mt-2">
              <Progress 
                value={contentAnalysis.aiContentPercentage} 
                className="h-1"
              />
            </div>
          </div>

          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className={`text-2xl font-bold ${
              contentAnalysis.redFlagCount === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {contentAnalysis.redFlagCount}
            </p>
            <p className="text-xs text-muted-foreground">Red Flags</p>
            <div className="mt-2 flex justify-center">
              {contentAnalysis.redFlagCount === 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Red Flags Alert */}
        {contentAnalysis.redFlagCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-800">Content Quality Concerns</h4>
            </div>
            <p className="text-sm text-red-700">
              {contentAnalysis.redFlagCount} potential quality issues detected in this prospect's content. 
              Review individual posts below for details.
            </p>
          </div>
        )}

        {/* High AI Content Warning */}
        {contentAnalysis.aiContentPercentage > 50 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium text-orange-800">High AI Content Detected</h4>
            </div>
            <p className="text-sm text-orange-700">
              {Math.round(contentAnalysis.aiContentPercentage)}% of analyzed content appears to be AI-generated. 
              This may indicate limited authentic expertise or engagement.
            </p>
          </div>
        )}

        {/* Detailed Post Analysis */}
        <div>
          <Button
            variant="outline"
            onClick={handleToggleExpanded}
            className="w-full"
            disabled={isLoading}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {isExpanded ? 'Hide' : 'Show'} Detailed Post Analysis
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
            ) : (
              isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>

          {isExpanded && loadedPostAnalysis && (
            <div className="mt-4 space-y-3">
              {loadedPostAnalysis.map((post, index) => (
                <Card key={post.id} className={`${
                  post.redFlags.length > 0 ? 'border-red-200 bg-red-50/30' : 
                  post.aiGenerated ? 'border-orange-200 bg-orange-50/30' : 
                  'border-green-200 bg-green-50/30'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Post {index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.aiGenerated && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                        {post.redFlags.length > 0 && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {post.redFlags.length} Issues
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.content}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Authenticity:</span>
                        <span className={`ml-2 font-medium ${getScoreColor(post.authenticityScore)}`}>
                          {post.authenticityScore.toFixed(1)}/10
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expertise:</span>
                        <span className={`ml-2 font-medium ${getScoreColor(post.expertiseLevel)}`}>
                          {post.expertiseLevel.toFixed(1)}/10
                        </span>
                      </div>
                    </div>

                    {post.redFlags.length > 0 && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800 mb-1">Quality Concerns:</p>
                        <ul className="text-xs text-red-700 list-disc list-inside">
                          {post.redFlags.map((flag, flagIndex) => (
                            <li key={flagIndex}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {post.qualityIndicators.length > 0 && (
                      <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded">
                        <p className="text-xs font-medium text-green-800 mb-1">Quality Indicators:</p>
                        <ul className="text-xs text-green-700 list-disc list-inside">
                          {post.qualityIndicators.slice(0, 3).map((indicator, indicatorIndex) => (
                            <li key={indicatorIndex}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}