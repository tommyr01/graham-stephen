"use client"

import * as React from "react"
import { X, ExternalLink, Building2, MapPin, Clock, Send, ThumbsUp, MessageCircle, Repeat2, ChevronDown, ChevronUp, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Avatar } from "./avatar"
import { Badge } from "./badge"
import { Card, CardContent, CardHeader } from "./card"
import { PostFeedbackControls } from "./post-feedback-controls"
import { VoiceFeedback } from "./voice-feedback"
// Removed scoring-related imports
import type { BinaryFeedbackRequest, DetailedFeedbackRequest } from "@/lib/types"

interface CommenterModalProps {
  isOpen: boolean
  onClose: () => void
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
    experience?: Array<{
      title: string
      company: string
      description?: string
      duration?: string
      start_date?: any
      end_date?: any
      is_current?: boolean
    }>
  }
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
  aiPrediction?: any
  trainingMode?: boolean
  // Feedback system props
  sessionId?: string
  analysisId?: string
  userId?: string
  teamId?: string
  showFeedback?: boolean
}

function CommenterModal({
  isOpen,
  onClose,
  commenter,
  analysisData,
  aiPrediction,
  trainingMode,
  sessionId,
  analysisId,
  userId,
  teamId,
  showFeedback = true,
  ...props
}: CommenterModalProps) {
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false)
  const [isExperienceExpanded, setIsExperienceExpanded] = React.useState(false)
  const [postFeedback, setPostFeedback] = React.useState<Record<string, -1 | 0 | 1 | null>>({})
  const [showVoiceFeedback, setShowVoiceFeedback] = React.useState(false)

  const initials = commenter.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 24) {
        return `${diffHours}h`
      }
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 7) {
        return `${diffDays}d`
      }
      const diffWeeks = Math.ceil(diffDays / 7)
      return `${diffWeeks}w`
    } catch {
      return dateString
    }
  }

  const formatEngagement = (engagement: { likes: number; comments: number; reposts: number }) => {
    const { likes, comments, reposts } = engagement
    return { likes, comments, reposts }
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
          rating: feedback.isRelevant ? 4 : 2, // Convert boolean to 1-5 scale
          feedbackText: feedback.notes,
          isRelevant: feedback.isRelevant,
          notes: `Binary feedback from modal. Confidence: ${feedback.confidenceScore || 'N/A'}`,
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

  const handlePostFeedback = React.useCallback((postId: string, feedback: -1 | 0 | 1 | null) => {
    setPostFeedback(prev => ({
      ...prev,
      [postId]: feedback
    }))
  }, [])

  const handleVoiceFeedbackSubmitted = (feedbackResult: any) => {
    console.log('Voice feedback submitted successfully:', feedbackResult)
    setShowVoiceFeedback(false)
  }

  const handleVoiceFeedbackError = (error: string) => {
    console.error('Voice feedback error:', error)
  }

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-[105rem] max-h-[90vh] bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                {commenter.profilePicture ? (
                  <img 
                    src={commenter.profilePicture} 
                    alt={`${commenter.name} profile picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {initials}
                  </div>
                )}
              </Avatar>
              <div>
                <h2 id="modal-title" className="text-h3 font-semibold text-foreground">
                  {commenter.name}
                </h2>
                {commenter.headline && (
                  <p className="text-body-sm text-muted-foreground">
                    {commenter.headline}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1 text-caption text-muted-foreground">
                  {commenter.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{commenter.company}</span>
                    </div>
                  )}
                  {commenter.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{commenter.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {commenter.profileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => window.open(commenter.profileUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  View Profile
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Modal Content - Two Panel Layout */}
          <div className="flex h-[calc(90vh-120px)]">
            {/* Left Panel - Analysis */}
            <div className="w-1/2 p-6 border-r border-border overflow-y-auto">
              <div className="space-y-6">
                {/* Original Comment */}
                {commenter.commentText && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-h4 font-medium">Original Comment</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-body-sm italic text-muted-foreground">
                        &ldquo;{commenter.commentText}&rdquo;
                      </p>
                      {commenter.commentDate && (
                        <div className="flex items-center gap-1 mt-2 text-caption text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(commenter.commentDate)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Relevance Analysis */}
                {analysisData && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-h4 font-medium">Profile Analysis</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Profile data retrieved successfully. Scoring functionality has been removed.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Professional Experience Section */}
                {commenter.experience && commenter.experience.length > 0 && (
                  <Card>
                    <CardHeader>
                      <button
                        onClick={() => setIsExperienceExpanded(!isExperienceExpanded)}
                        className="w-full flex items-center justify-between text-left hover:bg-muted/30 -m-2 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <h3 className="text-h4 font-medium">Professional Experience</h3>
                          <Badge variant="secondary" className="text-xs">
                            {commenter.experience.length} positions
                          </Badge>
                        </div>
                        {isExperienceExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Always show first 2 positions */}
                        {commenter.experience.slice(0, 2).map((job, index) => (
                          <div key={index} className="border-l-2 border-primary/20 pl-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{job.title}</h4>
                                <p className="text-sm text-muted-foreground">{job.company}</p>
                                {job.duration && (
                                  <p className="text-xs text-muted-foreground">{job.duration}</p>
                                )}
                              </div>
                              {job.is_current && (
                                <Badge variant="outline" className="text-xs">Current</Badge>
                              )}
                            </div>
                            {job.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                {job.description}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* Additional positions when expanded */}
                        {isExperienceExpanded && commenter.experience.length > 2 && (
                          <div className="max-h-64 overflow-y-auto space-y-4 pt-2 border-t">
                            {commenter.experience.slice(2).map((job, index) => (
                              <div key={index + 2} className="border-l-2 border-muted pl-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{job.title}</h4>
                                    <p className="text-sm text-muted-foreground">{job.company}</p>
                                    {job.duration && (
                                      <p className="text-xs text-muted-foreground">{job.duration}</p>
                                    )}
                                  </div>
                                  {job.is_current && (
                                    <Badge variant="outline" className="text-xs">Current</Badge>
                                  )}
                                </div>
                                {job.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {job.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Voice Feedback System */}
                {showFeedback && userId && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-h4 font-medium">Provide Feedback</h3>
                          <p className="text-body-sm text-muted-foreground">
                            Share your insights about this profile through voice feedback
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVoiceFeedback(!showVoiceFeedback)}
                          className={showVoiceFeedback ? 'bg-purple-100 text-purple-700' : ''}
                        >
                          {showVoiceFeedback ? 'Hide Voice Feedback' : 'Show Voice Feedback'}
                        </Button>
                      </div>
                    </CardHeader>
                    {showVoiceFeedback && (
                      <CardContent>
                        <VoiceFeedback
                          sessionId={sessionId}
                          commenterId={commenter.id}
                          analysisId={analysisId}
                          userId={userId}
                          teamId={teamId}
                          analysisData={analysisData}
                          onFeedbackSubmitted={handleVoiceFeedbackSubmitted}
                          onError={handleVoiceFeedbackError}
                        />
                      </CardContent>
                    )}
                  </Card>
                )}
              </div>
            </div>

            {/* Right Panel - LinkedIn-style Posts Feed */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-h4 font-medium mb-4">Recent Posts</h3>
                
                {analysisData?.recentPosts && analysisData.recentPosts.length > 0 ? (
                  <div className="space-y-4">
                    {analysisData.recentPosts.map((post) => {
                      const engagement = formatEngagement(post.engagement)
                      return (
                        <Card key={post.id} className="hover:bg-muted/30 transition-colors duration-200">
                          <CardContent className="p-4">
                            {/* Post Header */}
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar className="w-10 h-10">
                                {commenter.profilePicture ? (
                                  <img 
                                    src={commenter.profilePicture} 
                                    alt={commenter.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                                    {initials}
                                  </div>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-body-sm font-medium text-foreground">
                                  {commenter.name}
                                </p>
                                <p className="text-caption text-muted-foreground">
                                  {commenter.headline}
                                </p>
                                <p className="text-caption text-muted-foreground">
                                  {formatDate(post.publishedAt)}
                                </p>
                              </div>
                              {post.relevanceContribution !== undefined && (
                                <Badge
                                  variant={post.relevanceContribution > 0 ? "default" : "secondary"}
                                  className={cn(
                                    "text-xs",
                                    post.relevanceContribution > 0 
                                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                                      : post.relevanceContribution < 0
                                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {post.relevanceContribution > 0 ? '+' : ''}{post.relevanceContribution}
                                </Badge>
                              )}
                            </div>

                            {/* Post Content */}
                            <div className="space-y-3">
                              <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-line">
                                {post.content}
                              </p>

                              {/* Post Images */}
                              {post.images && post.images.length > 0 && (
                                <div className={cn(
                                  "gap-2 mt-3",
                                  post.images.length === 1 ? "grid grid-cols-1" :
                                  post.images.length === 2 ? "grid grid-cols-2" :
                                  "grid grid-cols-2"
                                )}>
                                  {post.images?.slice(0, 4).map((image, index) => (
                                    <div key={index} className="relative overflow-hidden rounded-lg bg-muted">
                                      <img 
                                        src={image}
                                        alt={`Post image ${index + 1}`}
                                        className={cn(
                                          "w-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer",
                                          (post.images?.length || 0) === 1 ? "max-h-80" : "h-32"
                                        )}
                                        onClick={() => window.open(image, '_blank')}
                                        onError={(e) => {
                                          // Hide broken images gracefully
                                          const target = e.currentTarget as HTMLImageElement;
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.style.display = 'none';
                                          }
                                        }}
                                        loading="lazy"
                                      />
                                      {(post.images?.length || 0) > 4 && index === 3 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                          <span className="text-white font-medium text-sm">
                                            +{(post.images?.length || 0) - 4} more
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Engagement Stats and Post Feedback */}
                              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                <div className="flex items-center gap-6 text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="w-4 h-4" />
                                    <span className="text-caption">{engagement.likes}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-caption">{engagement.comments}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Repeat2 className="w-4 h-4" />
                                    <span className="text-caption">{engagement.reposts}</span>
                                  </div>
                                </div>
                                
                                {/* Post Feedback Controls */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Rate post:</span>
                                  <PostFeedbackControls
                                    postId={post.id}
                                    commenterId={commenter.id}
                                    sessionId={sessionId}
                                    initialFeedback={postFeedback[post.id] || null}
                                    onFeedbackChange={handlePostFeedback}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No recent posts available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CommenterModal }