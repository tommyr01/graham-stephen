"use client"

import * as React from "react"
import { Loader2, ExternalLink, Building2, MapPin, Clock, Brain, TrendingUp, AlertTriangle, CheckCircle, Target, Users, Zap, Mic, Search, FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader } from "./card"
import { Avatar } from "./avatar"
import { Badge } from "./badge"
import { CommenterModal } from "./commenter-modal"
import { VoiceFeedback } from "./voice-feedback"
import type { BinaryFeedbackRequest, DetailedFeedbackRequest } from "@/lib/types"

// V2.0 AI Prediction Interface
interface AIPrediction {
  predictedDecision: 'contact' | 'skip'
  confidence: number // 0-100%
  reasoning: {
    primaryFactors: string[]
    concerningSignals: string[]
    contentQuality: {
      overallQuality: 'high' | 'medium' | 'low'
      authenticityScore: number
      expertiseLevel: number
      aiContentPercentage: number
      redFlagCount: number
    }
    experienceMatch: {
      yearsInIndustry: number
      relevancyScore: number
      careerConsistency: number
      credibilitySignals: string[]
    }
    similarProspects: Array<{
      prospectId: string
      similarity: number
      grahamDecision: 'contact' | 'skip'
      grahamConfidence: number
      matchingFactors: string[]
    }>
  }
  learningMetadata: {
    patternsUsed: number
    similarProspectsFound: number
    dataQuality: 'high' | 'medium' | 'low'
    modelVersion: string
  }
}

interface CommenterCardProps {
  commenter: {
    id: string
    name: string
    headline?: string
    company?: string
    location?: string
    profileUrl?: string
    profilePicture?: string | null
    commentText?: string
    commentDate?: string
    relevanceScore?: number
    profileData?: unknown
    experience?: Array<any>
  }
  isLoading?: boolean
  onResearchClick?: () => void
  className?: string
  analysisData?: {
    relevanceScore: number
    confidence: "high" | "medium" | "low"
    matchedTerms: string[]
    recentPosts?: Array<{
      id: string
      content: string
      publishedAt: string
      engagement: {
        likes: number
        comments: number
        reposts: number
      }
      relevanceContribution?: number
      images?: string[]
      postType?: string
      url?: string
    }>
    explanation?: {
      matchedBoostTerms?: { term: string; weight: number }[]
      matchedDownTerms?: { term: string; weight: number }[]
      contentAnalysis?: {
        businessRelevant: number
        promotional: number
        personal: number
      }
    }
  }
  // V2.0 AI Prediction
  aiPrediction?: AIPrediction
  trainingMode?: boolean
  // Feedback system props
  sessionId?: string
  analysisId?: string
  userId?: string
  teamId?: string
  showFeedback?: boolean
  autoShowFeedback?: boolean
  // Voice feedback props
  enableVoiceFeedback?: boolean
}

function CommenterCard({
  commenter,
  isLoading = false,
  onResearchClick,
  className,
  analysisData,
  aiPrediction,
  trainingMode = false,
  sessionId,
  analysisId,
  userId,
  teamId,
  showFeedback = false,
  autoShowFeedback = false,
  enableVoiceFeedback = true,
  ...props
}: CommenterCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false)
  const [showAIPrediction, setShowAIPrediction] = React.useState(trainingMode && !!aiPrediction)
  const [showVoiceFeedback, setShowVoiceFeedback] = React.useState(false)
  const [voiceFeedbackError, setVoiceFeedbackError] = React.useState<string | null>(null)
  
  const initials = commenter.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Auto-show AI prediction when available and training mode is on
  React.useEffect(() => {
    if (trainingMode && aiPrediction) {
      setShowAIPrediction(true)
    } else {
      setShowAIPrediction(false)
    }
  }, [trainingMode, aiPrediction])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 24) {
        return `${diffHours}h ago`
      }
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return `${diffDays}d ago`
    } catch {
      return dateString
    }
  }

  const formatEngagement = (engagement: { likes: number; comments: number; reposts: number }) => {
    const total = engagement.likes + engagement.comments + engagement.reposts
    if (total === 0) return "No engagement"
    
    const parts = []
    if (engagement.likes > 0) parts.push(`${engagement.likes} likes`)
    if (engagement.comments > 0) parts.push(`${engagement.comments} comments`)
    if (engagement.reposts > 0) parts.push(`${engagement.reposts} reposts`)
    
    return parts.join(", ")
  }

  const handleBinaryFeedback = React.useCallback(async (feedback: BinaryFeedbackRequest) => {
    setIsSubmittingFeedback(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: feedback.sessionId,
          commenterId: feedback.commenterId,
          rating: feedback.isRelevant ? 4 : 2,
          feedbackText: feedback.notes,
          isRelevant: feedback.isRelevant,
          notes: `Binary feedback from card. Confidence: ${feedback.confidenceScore || 'N/A'}`,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting binary feedback:', error)
      throw error
    } finally {
      setIsSubmittingFeedback(false)
    }
  }, [])

  const handleDetailedFeedback = React.useCallback(async (feedback: DetailedFeedbackRequest) => {
    setIsSubmittingFeedback(true)
    try {
      const response = await fetch('/api/feedback/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: feedback.sessionId,
          commenterId: feedback.commenterId,
          analysisId: feedback.analysisId,
          feedbackType: 'detailed',
          overallRating: feedback.overallRating,
          factorRatings: feedback.factorRatings,
          correctionFlags: feedback.correctionFlags,
          feedbackText: feedback.feedbackText,
          improvementSuggestions: feedback.improvementSuggestions,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit detailed feedback')
      }
    } catch (error) {
      console.error('Error submitting detailed feedback:', error)
      throw error
    } finally {
      setIsSubmittingFeedback(false)
    }
  }, [])

  const handleVoiceFeedbackSubmitted = (feedbackResult: any) => {
    console.log('Voice feedback submitted successfully:', feedbackResult)
    setShowVoiceFeedback(false)
    setVoiceFeedbackError(null)
    
    // You might want to refresh the analysis or show a success message
  }

  const handleVoiceFeedbackError = (error: string) => {
    setVoiceFeedbackError(error)
  }

  return (
    <>
      <div className="space-y-4">
        <Card
          className={cn(
            "transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-secondary/50 bg-card border border-border rounded-xl shadow-sm cursor-pointer",
            className
          )}
          role="region"
          aria-labelledby={`commenter-name-${commenter.id}`}
          aria-describedby={analysisData ? `relevance-score-${commenter.id}` : undefined}
          onClick={() => analysisData && setIsModalOpen(true)}
          {...props}
        >
      <CardHeader className="pb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-12 h-12 flex-shrink-0">
            {commenter.profilePicture ? (
              <img 
                src={commenter.profilePicture} 
                alt={`${commenter.name} profile picture`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                {initials}
              </div>
            )}
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 
                  id={`commenter-name-${commenter.id}`}
                  className="text-h4 font-medium text-foreground truncate"
                >
                  {commenter.name}
                </h3>
                {commenter.headline && (
                  <p className="text-body-sm text-muted-foreground line-clamp-1 mt-1">
                    {commenter.headline}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-caption text-muted-foreground">
                  {commenter.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{commenter.company}</span>
                    </div>
                  )}
                  {commenter.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{commenter.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status Badges */}
              <div className="flex flex-col gap-2">
                {analysisData && (
                  <Badge 
                    className="bg-primary/20 text-primary border border-primary/30 text-xs px-2 py-1 font-medium"
                  >
                    Analyzed
                  </Badge>
                )}
                {aiPrediction && trainingMode && (
                  <Badge 
                    className={`text-xs px-2 py-1 font-medium ${
                      aiPrediction.predictedDecision === 'contact'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    AI: {aiPrediction.predictedDecision.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Preview */}
        {commenter.commentText && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-body-sm italic text-muted-foreground line-clamp-2">
              &ldquo;{commenter.commentText}&rdquo;
            </p>
            <div className="flex items-center justify-between mt-3 text-caption text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{commenter.commentDate ? formatDate(commenter.commentDate) : 'Recent'}</span>
              </div>
              {commenter.profileUrl && (
                <a
                  href={commenter.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-sm"
                >
                  <span>View on LinkedIn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* AI Prediction Display */}
        {showAIPrediction && aiPrediction && (
          <div className="mt-4">
            <div className={`p-4 rounded-lg border-2 ${
              aiPrediction.predictedDecision === 'contact'
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className={`h-4 w-4 ${
                    aiPrediction.predictedDecision === 'contact' ? 'text-green-600' : 'text-orange-600'
                  }`} />
                  <span className={`font-medium text-sm ${
                    aiPrediction.predictedDecision === 'contact' ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    AI Prediction: {aiPrediction.predictedDecision.toUpperCase()}
                  </span>
                </div>
                <Badge variant="outline" className={`${
                  aiPrediction.confidence >= 80 ? 'bg-green-100 text-green-700 border-green-300' :
                  aiPrediction.confidence >= 60 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                  'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {Math.round(aiPrediction.confidence)}% confident
                </Badge>
              </div>
              
              {/* Key Insights */}
              <div className="space-y-2">
                {aiPrediction.reasoning.primaryFactors.length > 0 && (
                  <div>
                    <h5 className={`text-xs font-medium mb-1 ${
                      aiPrediction.predictedDecision === 'contact' ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      Key Factors:
                    </h5>
                    <ul className="text-xs space-y-1">
                      {aiPrediction.reasoning.primaryFactors.slice(0, 2).map((factor, index) => (
                        <li key={index} className={`flex items-start gap-1 ${
                          aiPrediction.predictedDecision === 'contact' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {aiPrediction.reasoning.concerningSignals.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium mb-1 text-orange-700">
                      Concerns:
                    </h5>
                    <ul className="text-xs space-y-1">
                      {aiPrediction.reasoning.concerningSignals.slice(0, 2).map((signal, index) => (
                        <li key={index} className="flex items-start gap-1 text-orange-600">
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{signal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Learning Metadata */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {aiPrediction.learningMetadata.patternsUsed} patterns
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {aiPrediction.reasoning.similarProspects.length} similar prospects
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {aiPrediction.learningMetadata.dataQuality} quality
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 pb-6">
        {/* Enhanced Analysis Summary - Simplified */}
        {analysisData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">Analysis Summary</h4>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                Analyzed
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Relevance Score - Compact Whimsy */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-1 mb-1">
                  <Target className={`h-3 w-3 ${
                    (analysisData.relevanceScore || 0) >= 7 ? 'text-green-600' :
                    (analysisData.relevanceScore || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <p className="font-medium text-gray-700 text-xs">Match</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className={`text-lg font-bold ${
                    (analysisData.relevanceScore || 0) >= 7 ? 'text-green-600' :
                    (analysisData.relevanceScore || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(analysisData.relevanceScore || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">/10</p>
                  <span className="ml-1 text-xs">
                    {(analysisData.relevanceScore || 0) >= 7 ? '🎯' :
                     (analysisData.relevanceScore || 0) >= 4 ? '⚡' : '💡'}
                  </span>
                </div>
              </div>

              {/* Confidence Level - Compact */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-1 mb-1">
                  <Brain className={`h-3 w-3 ${
                    analysisData.confidence === 'high' ? 'text-green-600' :
                    analysisData.confidence === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                  }`} />
                  <p className="font-medium text-gray-700 text-xs">AI Trust</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className={`text-xs px-2 py-0.5 capitalize ${
                    analysisData.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    analysisData.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {analysisData.confidence}
                  </Badge>
                  <span className="text-xs">
                    {analysisData.confidence === 'high' ? '🚀' :
                     analysisData.confidence === 'medium' ? '🎲' : '🔍'}
                  </span>
                </div>
              </div>

              {/* Keywords Found - Compact */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-1 mb-1">
                  <Search className={`h-3 w-3 ${
                    analysisData.matchedTerms.length > 3 ? 'text-green-600' :
                    analysisData.matchedTerms.length > 0 ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium text-gray-700 text-xs">Keywords</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className={`text-lg font-bold ${
                    analysisData.matchedTerms.length > 3 ? 'text-green-600' :
                    analysisData.matchedTerms.length > 0 ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {analysisData.matchedTerms.length}
                  </p>
                  <span className="ml-1 text-xs">
                    {analysisData.matchedTerms.length > 3 ? '🎊' :
                     analysisData.matchedTerms.length > 0 ? '✨' : '🕵️'}
                  </span>
                </div>
              </div>

              {/* Content Intel - Compact */}
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className={`h-3 w-3 ${
                    (analysisData.recentPosts?.length || 0) > 5 ? 'text-green-600' :
                    (analysisData.recentPosts?.length || 0) > 0 ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium text-gray-700 text-xs">Posts</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className={`text-lg font-bold ${
                    (analysisData.recentPosts?.length || 0) > 5 ? 'text-green-600' :
                    (analysisData.recentPosts?.length || 0) > 0 ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {analysisData.recentPosts?.length || 0}
                  </p>
                  <span className="ml-1 text-xs">
                    {(analysisData.recentPosts?.length || 0) > 5 ? '📚' :
                     (analysisData.recentPosts?.length || 0) > 0 ? '📄' : '📭'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Research Button / Analysis View */}
        <div className="flex gap-2">
          {!analysisData ? (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onResearchClick?.()
              }}
              disabled={isLoading}
              className="flex-1 h-11 font-medium bg-primary text-primary-foreground hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              aria-describedby={`research-description-${commenter.id}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                "Research Profile"
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsModalOpen(true)
                }}
                variant="outline"
                className="flex-1 h-11 font-medium border-primary text-primary hover:bg-primary/10 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                View Full Analysis
              </Button>
              
              {/* Voice Feedback Button - NEW */}
              {enableVoiceFeedback && userId && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowVoiceFeedback(!showVoiceFeedback)
                  }}
                  variant="outline"
                  size="sm"
                  className={`h-11 px-3 ${
                    showVoiceFeedback ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-purple-300 text-purple-600 hover:bg-purple-50'
                  }`}
                  title="Record voice feedback"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              )}
              
              {trainingMode && aiPrediction && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAIPrediction(!showAIPrediction)
                  }}
                  variant="outline"
                  size="sm"
                  className={`h-11 px-3 ${
                    showAIPrediction ? 'bg-purple-100 border-purple-300 text-purple-700' : ''
                  }`}
                >
                  <Brain className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Screen reader description */}
        <div id={`research-description-${commenter.id}`} className="sr-only">
          Analyse recent posts and calculate relevance score for {commenter.name}
        </div>
      </CardContent>
    </Card>

    {/* Voice Feedback Section - NEW */}
    {showVoiceFeedback && enableVoiceFeedback && userId && analysisData && (
      <VoiceFeedback
        sessionId={sessionId}
        commenterId={commenter.id}
        analysisId={analysisId}
        userId={userId}
        teamId={teamId}
        analysisData={analysisData}
        onFeedbackSubmitted={handleVoiceFeedbackSubmitted}
        onError={handleVoiceFeedbackError}
        className="mt-4"
      />
    )}

    {/* Voice Feedback Error Display */}
    {voiceFeedbackError && (
      <Card className="mt-4 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Voice Feedback Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{voiceFeedbackError}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVoiceFeedbackError(null)}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Dismiss
          </Button>
        </CardContent>
      </Card>
    )}
  </div>
    
    {/* Full-screen Modal */}
    <CommenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        commenter={commenter}
        analysisData={analysisData}
        aiPrediction={aiPrediction}
        trainingMode={trainingMode}
        sessionId={sessionId}
        analysisId={analysisId}
        userId={userId}
        teamId={teamId}
        showFeedback={showFeedback}
      />
  </>
  )
}

export { CommenterCard }