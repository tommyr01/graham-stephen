"use client"

import * as React from "react"
import { ThumbsUp, ThumbsDown, Send, X, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Textarea } from "./textarea"

interface SimpleFeedbackProps {
  sessionId?: string
  commenterId?: string
  analysisId?: string
  commenterName?: string
  onFeedbackSubmit?: (feedback: {
    isRelevant: boolean
    textFeedback: string
    confidenceScore?: number
  }) => Promise<void>
  onClose?: () => void
  className?: string
  isSubmitting?: boolean
}

export function SimpleFeedback({
  sessionId,
  commenterId,
  analysisId,
  commenterName = "this person",
  onFeedbackSubmit,
  onClose,
  className,
  isSubmitting = false,
  ...props
}: SimpleFeedbackProps) {
  const [textFeedback, setTextFeedback] = React.useState("")
  const [hasSubmitted, setHasSubmitted] = React.useState(false)


  const handleSubmit = React.useCallback(async () => {
    if (!textFeedback.trim()) return

    try {
      // NLP will determine sentiment automatically
      await onFeedbackSubmit?.({
        isRelevant: true, // Will be overridden by NLP analysis
        textFeedback: textFeedback.trim(),
        confidenceScore: 0.8 // Default confidence
      })
      setHasSubmitted(true)
      
      // Auto-close after success message
      setTimeout(() => {
        onClose?.()
      }, 3000) // Slightly longer to read success message
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    }
  }, [textFeedback, onFeedbackSubmit, onClose])

  const handleSkip = React.useCallback(() => {
    onClose?.()
  }, [onClose])

  // Rich feedback placeholder encouraging detailed analysis
  const getPlaceholderText = () => {
    return `Share your detailed analysis of ${commenterName}...\n\nFor example:\n• What patterns do you notice in their writing style?\n• Do their posts show authentic experience or seem AI-generated?\n• What specific industry knowledge or expertise do they demonstrate?\n• How do they structure their content and storytelling?\n• What makes them a good/poor prospect for your goals?\n\nThe more specific and detailed your feedback, the better our system learns your preferences.`
  }

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
                Feedback Processed!
              </h3>
              <p className="text-body-sm text-muted-foreground">
                Your insights are being analyzed to improve future prospect research. The system learns from your expertise to get better over time.
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
            Provide Detailed Feedback
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
          Share your analysis of {commenterName} to help train the research agent
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rich Text Feedback Area - Always visible */}
        <div className="space-y-4">
          <div>
            <label htmlFor="text-feedback" className="block text-body-sm font-medium text-foreground mb-3">
              Your detailed analysis:
            </label>
            <Textarea
              id="text-feedback"
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              placeholder={getPlaceholderText()}
              className="min-h-[200px] bg-muted/30 border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background resize-y"
              maxLength={2000}
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-caption text-muted-foreground">
                {2000 - textFeedback.length} characters remaining
              </p>
              <p className="text-caption text-muted-foreground">
                💡 Voice-to-text supported - dictate your analysis
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!textFeedback.trim() || isSubmitting}
              className="flex-1 h-11 font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Processing Analysis...
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
              className="px-6 h-11 text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
              disabled={isSubmitting}
            >
              Skip
            </Button>
          </div>

          {/* Helpful Examples */}
          <div className="bg-muted/50 rounded-lg p-4 mt-3">
            <h4 className="text-sm font-medium text-foreground mb-3">💡 Tips for effective feedback:</h4>
            <div className="text-xs text-muted-foreground space-y-2">
              <p><strong>Good prospects:</strong> "Their posts show deep SaaS expertise with specific examples like 'reduced churn by 15% using cohort analysis.' Writing style is conversational and includes actual failure stories, not just wins."</p>
              <p><strong>Poor prospects:</strong> "Sentence structure screams AI-generated - uses phrases like 'I'm thrilled to share' and 'game-changing insights.' No specific examples, just surface-level motivational content."</p>
              <p><strong>Pattern recognition:</strong> Explain what specific linguistic patterns, content depth, or expertise indicators influenced your assessment.</p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}