"use client"

import * as React from "react"
import { LinkedInUrlInput } from "@/components/ui/linkedin-url-input"
import { CommenterCard } from "@/components/ui/commenter-card"
import { CommenterCardSkeleton } from "@/components/ui/skeleton"
import { ErrorMessage, ErrorBoundary } from "@/components/ui/error-boundary"
import { LoadingOverlay } from "@/components/ui/loading"
import { MobileNav } from "@/components/ui/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
// Removed scoring-related imports
import { CommenterEmptyState } from "@/components/ui/empty-state"
import { DelightfulError } from "@/components/ui/delightful-error"
import { SuccessCelebration } from "@/components/ui/success-celebration"
import { Users, Target, TrendingUp, Settings, Download, RefreshCw, ArrowUp } from "lucide-react"
import type { 
  CommentData, 
  ExtractCommentsResponse,
  RelevanceScoreResponse,
  CommenterDetailsResponse
} from "@/lib/types"
import { generateDemoUserID } from "@/lib/utils/uuid"

interface AnalysisData {
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

interface CommenterWithAnalysis {
  id: string
  name: string
  headline: string
  profileUrl: string
  profilePicture: string | null
  commentText: string
  commentDate: string
  analysisData?: AnalysisData
  isAnalyzing?: boolean
}

function ResearchPageContent() {
  const [url, setUrl] = React.useState("")
  const [isExtracting, setIsExtracting] = React.useState(false)
  const [extractError, setExtractError] = React.useState<string | null>(null)
  const [commenters, setCommenters] = React.useState<CommenterWithAnalysis[]>([])
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set())
  const [analysisProgress, setAnalysisProgress] = React.useState<{
    total: number
    completed: number
    isAnalyzing: boolean
  }>({ total: 0, completed: 0, isAnalyzing: false })
  const [showSuccessCelebration, setShowSuccessCelebration] = React.useState<string | null>(null)

  // Mock user data for feedback system
  const [userId] = React.useState(generateDemoUserID()) // Would come from auth context
  const [teamId] = React.useState("team-456") // Would come from user profile

  // Extract comments from LinkedIn post
  const handleExtractComments = React.useCallback(async (postUrl: string) => {
    setIsExtracting(true)
    setExtractError(null)
    setCommenters([])
    
    try {
      // Use development endpoint for single-user deployment
      const response = await fetch('/api/dev/extract-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postUrl, pageNumber: 1, sortOrder: 'Most relevant' }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to extract comments')
      }
      
      const data: ExtractCommentsResponse = await response.json()
      setSessionId(data.sessionId)
      
      // Transform comment data into commenter format
      const uniqueCommenters = new Map<string, CommenterWithAnalysis>()
      
      data.comments.forEach((comment, index) => {
        const commenterId = comment.author.profileUrl ? comment.author.profileUrl.split('/').pop() || `commenter-${index}` : `commenter-${index}`
        if (!uniqueCommenters.has(commenterId)) {
          uniqueCommenters.set(commenterId, {
            id: commenterId,
            name: comment.author.name,
            headline: comment.author.headline,
            profileUrl: comment.author.profileUrl,
            profilePicture: comment.author.profilePicture,
            commentText: comment.text,
            commentDate: comment.postedAt.date,
          })
        }
      })
      
      setCommenters(Array.from(uniqueCommenters.values()))
      
      // Show success celebration for extraction
      setShowSuccessCelebration("extraction")
      setTimeout(() => setShowSuccessCelebration(null), 3000)
    } catch (error) {
      console.error('Error extracting comments:', error)
      setExtractError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsExtracting(false)
    }
  }, [])

  // Analyse individual commenter
  const handleResearchCommenter = React.useCallback(async (commenterId: string) => {
    const commenter = commenters.find(c => c.id === commenterId)
    if (!commenter || commenter.isAnalyzing) return

    // Update state to show loading
    setCommenters(prev => prev.map(c => 
      c.id === commenterId 
        ? { ...c, isAnalyzing: true }
        : c
    ))

    try {
      // Find the commenter's profile URL for the development endpoint
      const profileUrl = commenter?.profileUrl;
      
      if (!profileUrl) {
        throw new Error('Profile URL not found for commenter');
      }
      
      // Use development endpoint with profile URL parameter
      const analysisResponse = await fetch(`/api/dev/analyze/${commenterId}?profileUrl=${encodeURIComponent(profileUrl)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!analysisResponse.ok) {
        throw new Error('Failed to analyse commenter')
      }
      
      const response = await analysisResponse.json()
      
      // Create analysis data from development API response
      const analysisDataObj: AnalysisData = {
        relevanceScore: response.score,
        confidence: response.confidence > 0.8 ? 'high' : response.confidence > 0.5 ? 'medium' : 'low',
        matchedTerms: response.explanation?.matchedBoostTerms?.map((term: any) => term.term) || [],
        recentPosts: response.commenter.recentPosts?.map((post: any) => ({
          id: post.id,
          content: post.content,
          publishedAt: post.publishedAt,
          engagement: post.engagement,
          relevanceContribution: Math.round(Math.random() * 4 - 1) // Mock relevance contribution
        })) || [],
        explanation: response.explanation
      }
      
      // Update commenter with analysis data
      setCommenters(prev => prev.map(c => 
        c.id === commenterId 
          ? { 
              ...c, 
              ...response.commenter,
              company: response.commenter.company?.name || response.commenter.company,
              analysisData: analysisDataObj,
              isAnalyzing: false 
            }
          : c
      ))
      
      // Auto-expand the card to show results
      setExpandedCards(prev => new Set([...prev, commenterId]))
      
    } catch (error) {
      console.error('Error analysing commenter:', error)
      setCommenters(prev => prev.map(c => 
        c.id === commenterId 
          ? { ...c, isAnalyzing: false }
          : c
      ))
    }
  }, [commenters])

  // Toggle card expansion
  const handleToggleExpansion = React.useCallback((commenterId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commenterId)) {
        newSet.delete(commenterId)
      } else {
        newSet.add(commenterId)
      }
      return newSet
    })
  }, [])

  // Bulk analyse all commenters
  const handleAnalyzeAll = React.useCallback(async () => {
    const unanalysedCommenters = commenters.filter(c => !c.analysisData && !c.isAnalyzing)
    if (unanalysedCommenters.length === 0) return

    setAnalysisProgress({
      total: unanalysedCommenters.length,
      completed: 0,
      isAnalyzing: true
    })

    for (let i = 0; i < unanalysedCommenters.length; i++) {
      const commenter = unanalysedCommenters[i]
      await handleResearchCommenter(commenter.id)
      setAnalysisProgress(prev => ({
        ...prev,
        completed: i + 1
      }))
      
      // Add delay to avoid rate limiting
      if (i < unanalysedCommenters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    setAnalysisProgress(prev => ({
      ...prev,
      isAnalyzing: false
    }))
    
    // Show analysis complete celebration
    setShowSuccessCelebration("analysis")
    setTimeout(() => setShowSuccessCelebration(null), 4000)
  }, [commenters, handleResearchCommenter])

  // Statistics
  const stats = React.useMemo(() => {
    const analysed = commenters.filter(c => c.analysisData).length
    const highRelevance = commenters.filter(c => c.analysisData && c.analysisData.relevanceScore >= 8).length
    const mediumRelevance = commenters.filter(c => c.analysisData && c.analysisData.relevanceScore >= 4 && c.analysisData.relevanceScore < 8).length
    
    return {
      total: commenters.length,
      analysed,
      unanalysed: commenters.length - analysed,
      highRelevance,
      mediumRelevance,
      lowRelevance: analysed - highRelevance - mediumRelevance
    }
  }, [commenters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10">
      <MobileNav />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Skip Navigation */}
        <a href="#main-content" className="skip-link focus-ring">
          Skip to main content
        </a>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 font-bold text-foreground mb-2">
            LinkedIn Comment Research
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Extract and analyse LinkedIn commenters to identify high-quality prospects for your outreach campaigns.
          </p>
        </div>

      {/* URL Input Section */}
      <main id="main-content">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Extract Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LinkedInUrlInput
              value={url}
              onChange={setUrl}
              onSubmit={handleExtractComments}
              isLoading={isExtracting}
              error={extractError || undefined}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {extractError && (
          <DelightfulError
            type="network"
            title="LinkedIn is being shy today! 🙈"
            message={extractError}
            onRetry={() => {
              setExtractError(null)
              if (url.trim()) {
                handleExtractComments(url.trim())
              }
            }}
            className="mb-8"
          />
        )}

      {/* Results Section */}
      {(commenters.length > 0 || isExtracting) && (
        <>
          {/* Statistics and Controls */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            {/* Statistics */}
            <Card className="flex-1" delightful>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-h2 font-bold">{stats.total}</div>
                    <div className="text-body-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-h2 font-bold text-success">{stats.highRelevance}</div>
                    <div className="text-body-sm text-muted-foreground">High Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-h2 font-bold text-warning">{stats.mediumRelevance}</div>
                    <div className="text-body-sm text-muted-foreground">Medium Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-h2 font-bold">{stats.analysed}</div>
                    <div className="text-body-sm text-muted-foreground">Analysed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="lg:w-80" delightful>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    onClick={handleAnalyzeAll}
                    disabled={stats.unanalysed === 0 || analysisProgress.isAnalyzing}
                    className="w-full"
                  >
                    {analysisProgress.isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analysing ({analysisProgress.completed}/{analysisProgress.total})
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Analyse All ({stats.unanalysed})
                      </>
                    )}
                  </Button>
                  
                  {analysisProgress.isAnalyzing && (
                    <div className="space-y-2">
                      <Progress 
                        value={(analysisProgress.completed / analysisProgress.total) * 100}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        Analysing prospects... {analysisProgress.completed}/{analysisProgress.total}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commenters List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-h2 font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Commenters ({commenters.length})
              </h2>
              <div className="flex gap-2">
                <Badge variant="secondary">{stats.analysed} analysed</Badge>
                <Badge variant="outline">{stats.unanalysed} remaining</Badge>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {isExtracting ? (
                // Loading skeletons
                Array.from({ length: 6 }, (_, i) => (
                  <CommenterCardSkeleton key={i} />
                ))
              ) : (
                // Actual commenter cards
                commenters.map((commenter) => (
                  <CommenterCard
                    key={commenter.id}
                    commenter={commenter}
                    isLoading={commenter.isAnalyzing}
                    onResearchClick={() => handleResearchCommenter(commenter.id)}
                    analysisData={commenter.analysisData}
                    sessionId={sessionId || undefined}
                    analysisId={commenter.analysisData ? `analysis-${commenter.id}` : undefined}
                    userId={userId}
                    teamId={teamId}
                    showFeedback={!!commenter.analysisData}
                    autoShowFeedback={true}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {commenters.length === 0 && !isExtracting && !extractError && (
        <CommenterEmptyState 
          onGetStarted={() => {
            const input = document.querySelector('input[type="url"]') as HTMLInputElement
            if (input) {
              input.focus()
            }
          }}
        />
      )}
      </main>
      
      {/* Success Celebrations */}
      {showSuccessCelebration && (
        <SuccessCelebration
          type={showSuccessCelebration as any}
          onComplete={() => setShowSuccessCelebration(null)}
        />
      )}
      </div>
    </div>
  )
}

export default function ResearchPage() {
  return (
    <ErrorBoundary>
      <ResearchPageContent />
    </ErrorBoundary>
  )
}