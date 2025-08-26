"use client"

import * as React from "react"
import { CheckCircle, XCircle, Clock, Calendar, MessageSquare, TrendingUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Textarea } from "./textarea"
import { Badge } from "./badge"

interface OutcomeFeedbackProps {
  feedbackId: string
  commenterName?: string
  analysisDate?: string
  originalScore?: number
  onFeedbackSubmit?: (outcome: {
    contacted: boolean
    contactMethod?: string
    responded: boolean
    responseTime?: number
    responseQuality?: number
    meetingScheduled: boolean
    meetingCompleted?: boolean
    meetingOutcome?: string
    opportunityCreated: boolean
    opportunityValue?: number
    dealClosed?: boolean
    actualDealValue?: number
  }, retrospectiveNotes?: string) => Promise<void>
  onClose?: () => void
  onRemindLater?: () => void
  className?: string
  isSubmitting?: boolean
}

const OUTCOME_OPTIONS = [
  {
    id: 'great_conversation',
    label: 'Great conversation, good prospect',
    icon: CheckCircle,
    description: 'Positive response, potential for business',
    color: 'success'
  },
  {
    id: 'not_a_fit',
    label: 'Responded but not a fit',
    icon: XCircle,
    description: 'Responded politely but not interested/relevant',
    color: 'warning'
  },
  {
    id: 'no_response',
    label: 'No response to outreach',
    icon: Clock,
    description: 'Did not respond to initial contact',
    color: 'error'
  },
  {
    id: 'haven_not_reached_out',
    label: "Haven't reached out yet",
    icon: Calendar,
    description: 'Still planning to contact this person',
    color: 'muted'
  }
] as const

type OutcomeOptionId = typeof OUTCOME_OPTIONS[number]['id']

export function OutcomeFeedback({
  feedbackId,
  commenterName = "this commenter",
  analysisDate,
  originalScore = 0,
  onFeedbackSubmit,
  onClose,
  onRemindLater,
  className,
  isSubmitting = false,
  ...props
}: OutcomeFeedbackProps) {
  const [selectedOutcome, setSelectedOutcome] = React.useState<OutcomeOptionId | null>(null)
  const [retrospectiveNotes, setRetrospectiveNotes] = React.useState("")
  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const [showDetails, setShowDetails] = React.useState(false)

  // Detailed outcome tracking (shown after initial selection)
  const [contactMethod, setContactMethod] = React.useState("")
  const [responseQuality, setResponseQuality] = React.useState(0)
  const [meetingScheduled, setMeetingScheduled] = React.useState(false)
  const [meetingCompleted, setMeetingCompleted] = React.useState(false)
  const [opportunityCreated, setOpportunityCreated] = React.useState(false)
  const [estimatedValue, setEstimatedValue] = React.useState("")

  const formatAnalysisDate = (dateString?: string) => {
    if (!dateString) return "recently"
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return "yesterday"
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
      return `${Math.ceil(diffDays / 30)} months ago`
    } catch {
      return dateString
    }
  }

  const handleOutcomeSelect = React.useCallback((outcomeId: OutcomeOptionId) => {
    setSelectedOutcome(outcomeId)
    
    // Show details for successful outcomes
    if (outcomeId === 'great_conversation') {
      setShowDetails(true)
    } else {
      setShowDetails(false)
    }
  }, [])

  const handleSubmit = React.useCallback(async () => {
    if (!selectedOutcome) return

    const outcomeData = {
      contacted: selectedOutcome !== 'haven_not_reached_out',
      contactMethod: contactMethod || undefined,
      responded: selectedOutcome === 'great_conversation' || selectedOutcome === 'not_a_fit',
      responseTime: selectedOutcome === 'great_conversation' ? 24 : undefined, // Mock response time
      responseQuality: responseQuality > 0 ? responseQuality : undefined,
      meetingScheduled: meetingScheduled,
      meetingCompleted: meetingCompleted,
      meetingOutcome: meetingCompleted ? (opportunityCreated ? 'opportunity_created' : 'no_opportunity') : undefined,
      opportunityCreated: opportunityCreated,
      opportunityValue: estimatedValue ? parseInt(estimatedValue) : undefined,
      dealClosed: false, // Would be updated later
      actualDealValue: undefined,
    }

    try {
      await onFeedbackSubmit?.(outcomeData, retrospectiveNotes.trim() || undefined)
      setHasSubmitted(true)
      
      // Auto-close after success message
      setTimeout(() => {
        onClose?.()
      }, 2500)
    } catch (error) {
      console.error("Failed to submit outcome feedback:", error)
      // TODO: Show error message to user
    }
  }, [selectedOutcome, contactMethod, responseQuality, meetingScheduled, meetingCompleted, opportunityCreated, estimatedValue, retrospectiveNotes, onFeedbackSubmit, onClose])

  // Success state
  if (hasSubmitted) {
    return (
      <Card className={cn("bg-card border border-border rounded-xl shadow-sm", className)} {...props}>
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-h4 font-medium text-foreground mb-1">
                Outcome feedback recorded!
              </h3>
              <p className="text-body-sm text-muted-foreground">
                This helps us validate and improve our predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedOption = OUTCOME_OPTIONS.find(opt => opt.id === selectedOutcome)

  return (
    <Card className={cn("bg-card border border-border rounded-xl shadow-sm", className)} {...props}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-h4 font-medium">
            <MessageSquare className="w-5 h-5 text-primary" />
            How did it go?
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Close feedback"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-body-sm text-muted-foreground">
            You researched <span className="font-medium text-foreground">{commenterName}</span>{" "}
            {formatAnalysisDate(analysisDate)}
          </p>
          {originalScore > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Relevance Score: {originalScore}/10
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Outcome Selection */}
        <div className="space-y-3">
          <h4 className="text-body font-medium text-foreground">What happened next?</h4>
          <div className="space-y-2">
            {OUTCOME_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOutcomeSelect(option.id)}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                    selectedOutcome === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  )}
                  aria-pressed={selectedOutcome === option.id}
                >
                  <div className="flex items-start gap-3">
                    <Icon 
                      className={cn(
                        "w-5 h-5 mt-0.5 flex-shrink-0",
                        option.color === 'success' && "text-success",
                        option.color === 'warning' && "text-warning", 
                        option.color === 'error' && "text-error",
                        option.color === 'muted' && "text-muted-foreground"
                      )} 
                    />
                    <div className="space-y-1">
                      <div className="text-body-sm font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="text-caption text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detailed Follow-up (for successful outcomes) */}
        {showDetails && selectedOutcome === 'great_conversation' && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-body font-medium text-foreground">Tell us more</h4>
            
            {/* Contact Method */}
            <div className="space-y-2">
              <label className="block text-body-sm font-medium text-foreground">
                How did you contact them?
              </label>
              <div className="flex flex-wrap gap-2">
                {['LinkedIn Message', 'Email', 'Phone Call', 'Social Media', 'Other'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setContactMethod(method)}
                    disabled={isSubmitting}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      contactMethod === method
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground hover:bg-muted/70 border border-border"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Quality */}
            <div className="space-y-2">
              <label className="block text-body-sm font-medium text-foreground">
                Response quality (1-5)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setResponseQuality(rating)}
                    disabled={isSubmitting}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      rating <= responseQuality
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground hover:bg-success/20"
                    )}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting Follow-up */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="meeting-scheduled"
                  checked={meetingScheduled}
                  onChange={(e) => setMeetingScheduled(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                />
                <label htmlFor="meeting-scheduled" className="text-body-sm font-medium text-foreground">
                  Meeting scheduled
                </label>
              </div>

              {meetingScheduled && (
                <div className="ml-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="meeting-completed"
                      checked={meetingCompleted}
                      onChange={(e) => setMeetingCompleted(e.target.checked)}
                      disabled={isSubmitting}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    />
                    <label htmlFor="meeting-completed" className="text-body-sm font-medium text-foreground">
                      Meeting completed
                    </label>
                  </div>

                  {meetingCompleted && (
                    <div className="ml-7">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="opportunity-created"
                          checked={opportunityCreated}
                          onChange={(e) => setOpportunityCreated(e.target.checked)}
                          disabled={isSubmitting}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                        />
                        <label htmlFor="opportunity-created" className="text-body-sm font-medium text-foreground">
                          Opportunity created
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retrospective Notes */}
        {selectedOutcome && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            <label htmlFor="retrospective-notes" className="block text-body-sm font-medium text-foreground">
              Additional notes
            </label>
            <Textarea
              id="retrospective-notes"
              value={retrospectiveNotes}
              onChange={(e) => setRetrospectiveNotes(e.target.value)}
              placeholder={`Tell us more about your experience with ${commenterName}...`}
              className="min-h-[80px] bg-muted/30 border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-caption text-muted-foreground">
              {500 - retrospectiveNotes.length} characters remaining
            </p>
          </div>
        )}

        {/* Don't Ask Again Option */}
        {selectedOutcome && (
          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
            <input
              type="checkbox"
              id="dont-ask-again"
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background mt-0.5"
              disabled={isSubmitting}
            />
            <div className="space-y-1">
              <label htmlFor="dont-ask-again" className="text-body-sm font-medium text-foreground">
                Don't ask about future prospects from this company
              </label>
              <p className="text-caption text-muted-foreground">
                We won't request outcome feedback for other people from the same organization
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!selectedOutcome || isSubmitting}
            className="flex-1 h-11 font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
          <Button
            onClick={onRemindLater}
            variant="outline"
            className="px-4 h-11 text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
            disabled={isSubmitting}
          >
            Remind me later
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}