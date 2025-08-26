"use client"

import * as React from "react"
import { MessageSquare, TrendingUp, Calendar, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { BinaryFeedback } from "./feedback-binary"
import { DetailedFeedback } from "./feedback-detailed"
import { OutcomeFeedback } from "./feedback-outcome"
import { FeedbackImpact } from "./feedback-impact"
import { SimpleFeedback } from "./feedback-simple"
import { feedbackService, getFeedbackErrorMessage } from "@/lib/feedback-service"
import { feedbackNLPExtractor } from "@/lib/services/feedback-nlp-extractor"
import { targetedLearningEngine } from "@/lib/services/targeted-learning-engine"
import { feedbackLearningDatabase } from "@/lib/services/feedback-learning-database"
import type { 
  BinaryFeedbackRequest,
  DetailedFeedbackRequest, 
  OutcomeFeedbackRequest,
  FeedbackAnalyticsResponse
} from "@/lib/types"

export type FeedbackMode = 'simple' | 'binary' | 'detailed' | 'outcome' | 'impact' | 'closed'

interface FeedbackManagerProps {
  // Context data
  sessionId?: string
  commenterId?: string
  analysisId?: string
  feedbackId?: string
  commenterName?: string
  originalScore?: number
  analysisDate?: string
  userId?: string
  teamId?: string
  
  // Mode control
  initialMode?: FeedbackMode
  onModeChange?: (mode: FeedbackMode) => void
  
  // Feedback callbacks
  onBinaryFeedback?: (feedback: BinaryFeedbackRequest) => Promise<void>
  onDetailedFeedback?: (feedback: DetailedFeedbackRequest) => Promise<void>
  onOutcomeFeedback?: (feedback: OutcomeFeedbackRequest) => Promise<void>
  
  // Data loading
  impactData?: FeedbackAnalyticsResponse
  onLoadImpactData?: (userId: string, teamId?: string) => Promise<FeedbackAnalyticsResponse>
  
  // UI control
  onClose?: () => void
  className?: string
  autoShow?: boolean
  showTriggers?: boolean
  
  // Submission states
  isSubmitting?: boolean
}

interface FeedbackTriggerProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
}

function FeedbackTrigger({ 
  icon: Icon, 
  label, 
  description, 
  onClick, 
  variant = 'outline',
  disabled = false 
}: FeedbackTriggerProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={cn(
        "flex-1 h-auto p-4 flex-col items-start text-left space-y-1",
        variant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === 'secondary' && "bg-muted text-foreground hover:bg-muted/80",
        variant === 'outline' && "border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2 w-full">
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className="text-xs opacity-80 text-left">{description}</span>
    </Button>
  )
}

export function FeedbackManager({
  sessionId,
  commenterId,
  analysisId,
  feedbackId,
  commenterName,
  originalScore,
  analysisDate,
  userId,
  teamId,
  initialMode = 'closed',
  onModeChange,
  onBinaryFeedback,
  onDetailedFeedback,
  onOutcomeFeedback,
  impactData,
  onLoadImpactData,
  onClose,
  className,
  autoShow = false,
  showTriggers = true,
  isSubmitting = false,
  ...props
}: FeedbackManagerProps) {
  const [mode, setMode] = React.useState<FeedbackMode>(initialMode)
  const [impactDataState, setImpactDataState] = React.useState(impactData)
  const [isLoadingImpact, setIsLoadingImpact] = React.useState(false)

  // Handle mode changes
  const handleModeChange = React.useCallback((newMode: FeedbackMode) => {
    setMode(newMode)
    onModeChange?.(newMode)
  }, [onModeChange])

  // Auto-show logic based on conditions
  React.useEffect(() => {
    if (autoShow && mode === 'closed') {
      // Auto-show binary feedback after analysis completion
      const timer = setTimeout(() => {
        handleModeChange('binary')
      }, 2000) // Show after 2 seconds
      
      return () => clearTimeout(timer)
    }
  }, [autoShow, mode, handleModeChange])

  // Load impact data when needed
  const handleLoadImpactData = React.useCallback(async () => {
    if (!userId) return
    
    setIsLoadingImpact(true)
    try {
      if (onLoadImpactData) {
        // Use provided callback
        const data = await onLoadImpactData(userId, teamId)
        setImpactDataState(data)
      } else {
        // Use centralized service as fallback
        const data = await feedbackService.getFeedbackAnalytics(userId, teamId)
        setImpactDataState(data)
      }
    } catch (error) {
      console.error('Failed to load impact data:', getFeedbackErrorMessage(error))
      // TODO: Show user-friendly error message
    } finally {
      setIsLoadingImpact(false)
    }
  }, [userId, teamId, onLoadImpactData])

  // Handle feedback submissions with mode transitions
  const handleSimpleSubmit = React.useCallback(async (feedback: {
    isRelevant: boolean
    textFeedback: string
    confidenceScore?: number
  }) => {
    try {
      // Convert to binary format and include text feedback
      const binaryFeedback = {
        isRelevant: feedback.isRelevant,
        confidenceScore: feedback.confidenceScore || 0.8,
        notes: feedback.textFeedback
      }
      
      if (onBinaryFeedback) {
        await onBinaryFeedback({
          sessionId,
          commenterId,
          analysisId,
          ...binaryFeedback
        })
      } else {
        // Use centralized service as fallback
        await feedbackService.submitBinaryFeedback({
          sessionId,
          commenterId,
          analysisId,
          ...binaryFeedback
        })
      }
      
      // Process rich feedback with enhanced NLP extraction and learning
      if (feedback.textFeedback.trim()) {
        try {
          // Extract signals from rich feedback text
          const extractedSignals = await feedbackNLPExtractor.extractSignals({
            isRelevant: feedback.isRelevant,
            textFeedback: feedback.textFeedback,
            prospectName: commenterName,
            prospectRole: undefined, // Would come from prospect data
            prospectCompany: undefined // Would come from prospect data
          })
          
          // Store in learning database for pattern recognition
          if (userId) {
            const { entryId, learningInsights } = await feedbackLearningDatabase.storeFeedbackEntry(
              userId,
              feedback.textFeedback,
              {
                prospectId: commenterId || 'unknown',
                prospectName: commenterName,
                originalScore: binaryFeedback.confidenceScore
              },
              extractedSignals
            )
            
            console.log('Rich feedback processed:', {
              entryId,
              insights: learningInsights.length,
              sentiment: extractedSignals.overallSentiment,
              patternsLearned: learningInsights.map(i => i.description)
            })
            
            // Also process with existing targeted learning engine for compatibility
            const learningFeedback = {
              decision: extractedSignals.overallSentiment === 'positive' ? 'worth_connecting' : 'time_waster' as const,
              signals: [...extractedSignals.positiveSignals.map(s => s.signal), ...extractedSignals.issuesIdentified.map(i => i.issue)],
              notes: feedback.textFeedback,
              prospectId: commenterId || 'unknown',
              timestamp: new Date(),
              userId,
              contextData: {
                postContent: feedback.textFeedback,
                relevanceScore: binaryFeedback.confidenceScore
              }
            }
            
            await targetedLearningEngine.processFeedback(learningFeedback)
          }
          
        } catch (error) {
          console.warn('Rich feedback processing failed, continuing with basic feedback:', error)
        }
      }
      
      // Auto-transition to closed state after successful submission
      setTimeout(() => {
        handleModeChange('closed')
      }, 2000)
    } catch (error) {
      console.error('Failed to submit simple feedback:', getFeedbackErrorMessage(error))
      throw error
    }
  }, [onBinaryFeedback, sessionId, commenterId, analysisId, handleModeChange])

  const handleBinarySubmit = React.useCallback(async (feedback: Omit<BinaryFeedbackRequest, 'sessionId' | 'commenterId' | 'analysisId'>) => {
    try {
      if (onBinaryFeedback) {
        // Use provided callback
        await onBinaryFeedback({
          sessionId,
          commenterId,
          analysisId,
          ...feedback
        })
      } else {
        // Use centralized service as fallback
        await feedbackService.submitBinaryFeedback({
          sessionId,
          commenterId,
          analysisId,
          ...feedback
        })
      }
      
      // Auto-transition to impact view after successful submission
      setTimeout(() => {
        if (userId) {
          handleModeChange('impact')
          handleLoadImpactData()
        } else {
          handleModeChange('closed')
        }
      }, 2000)
    } catch (error) {
      console.error('Failed to submit binary feedback:', getFeedbackErrorMessage(error))
      // TODO: Show user-friendly error message
      throw error
    }
  }, [onBinaryFeedback, sessionId, commenterId, analysisId, userId, handleModeChange, handleLoadImpactData])

  const handleDetailedSubmit = React.useCallback(async (feedback: Omit<DetailedFeedbackRequest, 'sessionId' | 'commenterId' | 'analysisId'>) => {
    try {
      if (onDetailedFeedback) {
        // Use provided callback
        await onDetailedFeedback({
          sessionId,
          commenterId,
          analysisId,
          ...feedback
        })
      } else {
        // Use centralized service as fallback
        await feedbackService.submitDetailedFeedback({
          sessionId,
          commenterId,
          analysisId,
          ...feedback
        })
      }
      
      // Auto-transition to impact view after successful submission
      setTimeout(() => {
        if (userId) {
          handleModeChange('impact')
          handleLoadImpactData()
        } else {
          handleModeChange('closed')
        }
      }, 2500)
    } catch (error) {
      console.error('Failed to submit detailed feedback:', getFeedbackErrorMessage(error))
      // TODO: Show user-friendly error message
      throw error
    }
  }, [onDetailedFeedback, sessionId, commenterId, analysisId, userId, handleModeChange, handleLoadImpactData])

  const handleOutcomeSubmit = React.useCallback(async (outcomeData: OutcomeFeedbackRequest['outcomeData'], retrospectiveNotes?: string) => {
    if (!feedbackId) return
    
    try {
      if (onOutcomeFeedback) {
        // Use provided callback
        await onOutcomeFeedback({
          feedbackId,
          outcomeData,
          retrospectiveNotes
        })
      } else {
        // Use centralized service as fallback
        await feedbackService.submitOutcomeFeedback({
          feedbackId,
          outcomeData,
          retrospectiveNotes
        })
      }
      
      // Auto-transition to impact view after successful submission
      setTimeout(() => {
        if (userId) {
          handleModeChange('impact')
          handleLoadImpactData()
        } else {
          handleModeChange('closed')
        }
      }, 2500)
    } catch (error) {
      console.error('Failed to submit outcome feedback:', getFeedbackErrorMessage(error))
      // TODO: Show user-friendly error message
      throw error
    }
  }, [onOutcomeFeedback, feedbackId, userId, handleModeChange, handleLoadImpactData])

  const handleClose = React.useCallback(() => {
    handleModeChange('closed')
    onClose?.()
  }, [handleModeChange, onClose])

  // Don't render anything if closed and not showing triggers
  if (mode === 'closed' && !showTriggers) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Feedback Trigger Buttons */}
      {mode === 'closed' && showTriggers && (
        <div className="flex justify-center">
          <FeedbackTrigger
            icon={Target}
            label="Quick Feedback"
            description="Worth connecting with?"
            onClick={() => handleModeChange('simple')}
            variant="primary"
          />
        </div>
      )}

      {/* Active Feedback Components */}
      {mode === 'simple' && (
        <SimpleFeedback
          sessionId={sessionId}
          commenterId={commenterId}
          analysisId={analysisId}
          commenterName={commenterName}
          onFeedbackSubmit={handleSimpleSubmit}
          onClose={handleClose}
          isSubmitting={isSubmitting}
        />
      )}

      {mode === 'binary' && (
        <BinaryFeedback
          sessionId={sessionId}
          commenterId={commenterId}
          analysisId={analysisId}
          commenterName={commenterName}
          onFeedbackSubmit={handleBinarySubmit}
          onClose={handleClose}
          isSubmitting={isSubmitting}
        />
      )}

      {mode === 'detailed' && (
        <DetailedFeedback
          sessionId={sessionId}
          commenterId={commenterId}
          analysisId={analysisId}
          commenterName={commenterName}
          originalScore={originalScore}
          onFeedbackSubmit={handleDetailedSubmit}
          onClose={handleClose}
          isSubmitting={isSubmitting}
        />
      )}

      {mode === 'outcome' && feedbackId && (
        <OutcomeFeedback
          feedbackId={feedbackId}
          commenterName={commenterName}
          analysisDate={analysisDate}
          originalScore={originalScore}
          onFeedbackSubmit={handleOutcomeSubmit}
          onClose={handleClose}
          onRemindLater={() => {
            // TODO: Schedule reminder
            handleClose()
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {mode === 'impact' && userId && (
        <FeedbackImpact
          userId={userId}
          teamId={teamId}
          impactData={impactDataState}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

// FeedbackManager is already exported via export function declaration above