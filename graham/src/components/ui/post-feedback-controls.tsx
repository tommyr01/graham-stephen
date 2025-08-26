"use client"

import * as React from "react"
import { ThumbsUp, ThumbsDown, Minus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface PostFeedbackControlsProps {
  postId: string
  commenterId: string
  sessionId?: string
  initialFeedback?: -1 | 0 | 1 | null
  onFeedbackChange?: (postId: string, feedback: -1 | 0 | 1 | null) => void
  disabled?: boolean
  className?: string
}

export function PostFeedbackControls({
  postId,
  commenterId,
  sessionId,
  initialFeedback = null,
  onFeedbackChange,
  disabled = false,
  className
}: PostFeedbackControlsProps) {
  const [feedback, setFeedback] = React.useState<-1 | 0 | 1 | null>(initialFeedback)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFeedbackClick = async (value: -1 | 0 | 1) => {
    // Toggle: if clicking same button, set to null
    const newFeedback = feedback === value ? null : value
    setFeedback(newFeedback)
    setError(null)
    setIsSubmitting(true)

    try {
      // Submit feedback to API
      const response = await fetch('/api/feedback/post-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          commenterId,
          sessionId,
          feedback: newFeedback,
          timestamp: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit post feedback')
      }

      // Notify parent component
      onFeedbackChange?.(postId, newFeedback)

    } catch (error) {
      console.error('Post feedback submission error:', error)
      setError('Failed to submit feedback')
      // Revert feedback state on error
      setFeedback(feedback)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Bad Post (-1) */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-1.5 h-7 w-7 transition-colors",
          feedback === -1
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
        )}
        onClick={() => handleFeedbackClick(-1)}
        disabled={disabled || isSubmitting}
        title="Mark as bad post"
      >
        {isSubmitting && feedback === -1 ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ThumbsDown className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Neutral (0) */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-1.5 h-7 w-7 transition-colors",
          feedback === 0
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        )}
        onClick={() => handleFeedbackClick(0)}
        disabled={disabled || isSubmitting}
        title="Mark as neutral post"
      >
        {isSubmitting && feedback === 0 ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Good Post (+1) */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-1.5 h-7 w-7 transition-colors",
          feedback === 1
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
        )}
        onClick={() => handleFeedbackClick(1)}
        disabled={disabled || isSubmitting}
        title="Mark as good post"
      >
        {isSubmitting && feedback === 1 ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ThumbsUp className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Error indicator */}
      {error && (
        <span className="text-xs text-red-500 ml-2" title={error}>
          !
        </span>
      )}
    </div>
  )
}