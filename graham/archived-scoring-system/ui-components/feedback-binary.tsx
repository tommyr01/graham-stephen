"use client"

import * as React from "react"
import { ThumbsUp, ThumbsDown, Send, X, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Textarea } from "./textarea"

interface BinaryFeedbackProps {
  sessionId?: string
  commenterId?: string
  analysisId?: string
  commenterName?: string
  onFeedbackSubmit?: (feedback: {
    isRelevant: boolean
    confidenceScore?: number
    notes?: string
  }) => Promise<void>
  onClose?: () => void
  className?: string
  isSubmitting?: boolean
}

export function BinaryFeedback({
  sessionId,
  commenterId,
  analysisId,
  commenterName = "this commenter",
  onFeedbackSubmit,
  onClose,
  className,
  isSubmitting = false,
  ...props
}: BinaryFeedbackProps) {
  const [selectedFeedback, setSelectedFeedback] = React.useState<boolean | null>(null)
  const [notes, setNotes] = React.useState("")
  const [showNotesInput, setShowNotesInput] = React.useState(false)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)

  const handleFeedbackSelect = React.useCallback((isRelevant: boolean) => {
    setSelectedFeedback(isRelevant)
    setShowNotesInput(true)
  }, [])

  const handleSubmit = React.useCallback(async () => {
    if (selectedFeedback === null) return

    try {
      await onFeedbackSubmit?.({
        isRelevant: selectedFeedback,
        confidenceScore: selectedFeedback ? 0.8 : 0.7, // Default confidence based on selection
        notes: notes.trim() || undefined,
      })
      setHasSubmitted(true)
      
      // Auto-close after success message
      setTimeout(() => {
        onClose?.()
      }, 2000)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      // TODO: Show error message to user
    }
  }, [selectedFeedback, notes, onFeedbackSubmit, onClose])

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
              <ThumbsUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-h4 font-medium text-foreground mb-1">
                Thank you for your feedback!
              </h3>
              <p className="text-body-sm text-muted-foreground">
                Your input helps improve our relevance scoring.
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
            <MessageSquare className="w-5 h-5 text-primary" />
            How accurate was this analysis?
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
        {/* Binary Choice Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => handleFeedbackSelect(true)}
            variant={selectedFeedback === true ? "default" : "outline"}
            className={cn(
              "flex-1 h-12 font-medium transition-all duration-200",
              selectedFeedback === true
                ? "bg-success text-white hover:bg-success/90 focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-background"
                : "border-success/50 text-success hover:bg-success/10 focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-background"
            )}
            aria-pressed={selectedFeedback === true}
            disabled={isSubmitting}
          >
            <ThumbsUp className="w-5 h-5 mr-2" />
            Worth Connecting
          </Button>
          
          <Button
            onClick={() => handleFeedbackSelect(false)}
            variant={selectedFeedback === false ? "default" : "outline"}
            className={cn(
              "flex-1 h-12 font-medium transition-all duration-200",
              selectedFeedback === false
                ? "bg-error text-white hover:bg-error/90 focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-background"
                : "border-error/50 text-error hover:bg-error/10 focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-background"
            )}
            aria-pressed={selectedFeedback === false}
            disabled={isSubmitting}
          >
            <ThumbsDown className="w-5 h-5 mr-2" />
            Time Waster
          </Button>
        </div>

        {/* Optional Notes Input */}
        {showNotesInput && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label htmlFor="feedback-notes" className="block text-body-sm font-medium text-foreground mb-2">
                Optional: Tell us more
              </label>
              <Textarea
                id="feedback-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  selectedFeedback
                    ? "What made them worth connecting with? (e.g., authentic content, real expertise, quality network)"
                    : "What were the red flags? (e.g., AI-generated posts, trying to be influencer, fake authority)"
                }
                className="min-h-[80px] bg-muted/30 border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background resize-none"
                maxLength={500}
                disabled={isSubmitting}
              />
              <p className="text-caption text-muted-foreground mt-1">
                {500 - notes.length} characters remaining
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={selectedFeedback === null || isSubmitting}
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

        {/* Skip Option (when no selection made) */}
        {!showNotesInput && (
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