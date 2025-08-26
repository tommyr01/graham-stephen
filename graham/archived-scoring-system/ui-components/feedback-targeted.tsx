"use client"

import * as React from "react"
import { ThumbsUp, ThumbsDown, Send, X, AlertTriangle, CheckCircle, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Textarea } from "./textarea"
import { Badge } from "./badge"

interface TargetedFeedbackProps {
  sessionId?: string
  commenterId?: string
  analysisId?: string
  commenterName?: string
  onFeedbackSubmit?: (feedback: {
    decision: 'worth_connecting' | 'time_waster'
    signals: string[]
    notes?: string
    confidenceScore: number
  }) => Promise<void>
  onClose?: () => void
  className?: string
  isSubmitting?: boolean
}

// Based on Graham's actual decision criteria from the conversation
const POSITIVE_SIGNALS = [
  { id: 'authentic_content', label: 'Authentic Content', description: 'Real storytelling, not AI-generated' },
  { id: 'real_expertise', label: 'Real Expertise', description: 'Claims match actual experience' },
  { id: 'quality_network', label: 'Quality Network', description: 'Engages with quality people' },
  { id: 'meaningful_engagement', label: 'Meaningful Engagement', description: 'Adds value to conversations' },
  { id: 'consistent_authority', label: 'Consistent Authority', description: 'Track record of valuable insights' },
  { id: 'warm_connection', label: 'Warm Connection', description: 'Connected through quality people' }
]

const NEGATIVE_SIGNALS = [
  { id: 'ai_generated', label: 'AI-Generated Posts', description: 'Formulaic, humble-brag content' },
  { id: 'automation_behavior', label: 'Automation Behavior', description: 'Connection requests at odd hours' },
  { id: 'influencer_wannabe', label: 'Influencer Behavior', description: 'Trying too hard to be social media influencer' },
  { id: 'fake_authority', label: 'Fake Authority', description: 'Claims expertise without experience' },
  { id: 'shallow_content', label: 'Shallow Content', description: 'Sounds smart but lacks substance' },
  { id: 'over_trying', label: 'Over-Trying', description: 'Dramatic language, trying too hard to impress' }
]

export function TargetedFeedback({
  sessionId,
  commenterId,
  analysisId,
  commenterName = "this person",
  onFeedbackSubmit,
  onClose,
  className,
  isSubmitting = false,
  ...props
}: TargetedFeedbackProps) {
  const [decision, setDecision] = React.useState<'worth_connecting' | 'time_waster' | null>(null)
  const [selectedSignals, setSelectedSignals] = React.useState<string[]>([])
  const [notes, setNotes] = React.useState("")
  const [hasSubmitted, setHasSubmitted] = React.useState(false)

  const availableSignals = decision === 'worth_connecting' ? POSITIVE_SIGNALS : NEGATIVE_SIGNALS

  const handleDecisionSelect = React.useCallback((selectedDecision: 'worth_connecting' | 'time_waster') => {
    setDecision(selectedDecision)
    setSelectedSignals([]) // Reset signals when decision changes
  }, [])

  const handleSignalToggle = React.useCallback((signalId: string) => {
    setSelectedSignals(prev => 
      prev.includes(signalId) 
        ? prev.filter(id => id !== signalId)
        : [...prev, signalId]
    )
  }, [])

  const handleSubmit = React.useCallback(async () => {
    if (!decision) return

    // Calculate confidence based on number of signals selected
    const confidenceScore = Math.min(0.9, 0.5 + (selectedSignals.length * 0.1))

    try {
      await onFeedbackSubmit?.({
        decision,
        signals: selectedSignals,
        notes: notes.trim() || undefined,
        confidenceScore
      })
      setHasSubmitted(true)
      
      // Auto-close after success message
      setTimeout(() => {
        onClose?.()
      }, 2000)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    }
  }, [decision, selectedSignals, notes, onFeedbackSubmit, onClose])

  const handleSkip = React.useCallback(() => {
    onClose?.()
  }, [onClose])

  // Success state
  if (hasSubmitted) {
    return (
      <Card className={cn("bg-card border border-border rounded-xl shadow-sm", className)} {...props}>
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-h4 font-medium text-foreground mb-1">
                Thanks for the feedback!
              </h3>
              <p className="text-body-sm text-muted-foreground">
                This helps train the system to identify quality prospects like you do.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-card border border-border rounded-xl shadow-sm", className)} {...props}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-h4 font-medium">
            <Target className="w-5 h-5 text-primary" />
            Quick Feedback
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Close feedback"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-body-sm text-muted-foreground mt-1">
          Was {commenterName} worth connecting with?
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Decision Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => handleDecisionSelect('worth_connecting')}
            variant={decision === 'worth_connecting' ? "default" : "outline"}
            className={cn(
              "flex-1 h-12 font-medium transition-all duration-200",
              decision === 'worth_connecting'
                ? "bg-success text-white hover:bg-success/90 focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-background"
                : "border-success/50 text-success hover:bg-success/10 focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-background"
            )}
            aria-pressed={decision === 'worth_connecting'}
            disabled={isSubmitting}
          >
            <ThumbsUp className="w-5 h-5 mr-2" />
            Worth Connecting
          </Button>
          
          <Button
            onClick={() => handleDecisionSelect('time_waster')}
            variant={decision === 'time_waster' ? "default" : "outline"}
            className={cn(
              "flex-1 h-12 font-medium transition-all duration-200",
              decision === 'time_waster'
                ? "bg-error text-white hover:bg-error/90 focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-background"
                : "border-error/50 text-error hover:bg-error/10 focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-background"
            )}
            aria-pressed={decision === 'time_waster'}
            disabled={isSubmitting}
          >
            <ThumbsDown className="w-5 h-5 mr-2" />
            Time Waster
          </Button>
        </div>

        {/* Signal Selection */}
        {decision && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-body-sm font-medium text-foreground mb-3">
                What signals did you notice? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {availableSignals.map((signal) => (
                  <Button
                    key={signal.id}
                    onClick={() => handleSignalToggle(signal.id)}
                    variant="outline"
                    className={cn(
                      "h-auto p-3 text-left justify-start transition-all duration-200",
                      selectedSignals.includes(signal.id)
                        ? decision === 'worth_connecting'
                          ? "bg-success/10 border-success text-success"
                          : "bg-error/10 border-error text-error"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                        selectedSignals.includes(signal.id)
                          ? decision === 'worth_connecting'
                            ? "bg-success border-success"
                            : "bg-error border-error"
                          : "border-border"
                      )}>
                        {selectedSignals.includes(signal.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{signal.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{signal.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label htmlFor="targeted-feedback-notes" className="block text-body-sm font-medium text-foreground mb-2">
                Additional context (optional)
              </label>
              <Textarea
                id="targeted-feedback-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other details that influenced your decision..."
                className="min-h-[60px] bg-muted/30 border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background resize-none"
                maxLength={300}
                disabled={isSubmitting}
              />
              <p className="text-caption text-muted-foreground mt-1">
                {300 - notes.length} characters remaining
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!decision || isSubmitting}
                className="flex-1 h-10 font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="px-4 h-10 text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
                disabled={isSubmitting}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Skip Option (when no decision made) */}
        {!decision && (
          <div className="text-center">
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Skip for now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}