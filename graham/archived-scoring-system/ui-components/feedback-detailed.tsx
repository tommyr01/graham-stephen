"use client"

import * as React from "react"
import { Star, Send, X, TrendingUp, User, Clock, Building, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Textarea } from "./textarea"
import { Badge } from "./badge"

interface DetailedFeedbackProps {
  sessionId?: string
  commenterId?: string
  analysisId?: string
  commenterName?: string
  originalScore?: number
  onFeedbackSubmit?: (feedback: {
    overallRating: number
    factorRatings: {
      contentRelevance?: number
      professionalFit?: number
      timing?: number
      companyMatch?: number
      roleMatch?: number
    }
    correctionFlags?: string[]
    feedbackText?: string
    improvementSuggestions?: string
  }) => Promise<void>
  onClose?: () => void
  className?: string
  isSubmitting?: boolean
}

interface RatingComponentProps {
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

function RatingComponent({ 
  label, 
  icon: Icon, 
  description, 
  value, 
  onChange, 
  disabled = false 
}: RatingComponentProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <label className="text-body-sm font-medium text-foreground">{label}</label>
      </div>
      <p className="text-caption text-muted-foreground">{description}</p>
      
      {/* Star Rating */}
      <div className="flex gap-1" role="radiogroup" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            disabled={disabled}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
              rating <= value 
                ? "text-warning bg-warning/20 hover:bg-warning/30" 
                : "text-muted-foreground hover:text-warning hover:bg-warning/10"
            )}
            aria-label={`${rating} out of 5 stars`}
            aria-pressed={rating <= value}
          >
            <Star className={cn("w-4 h-4", rating <= value && "fill-current")} />
          </button>
        ))}
      </div>
      <div className="text-caption text-muted-foreground">
        {value > 0 ? `${value}/5 stars` : "Not rated"}
      </div>
    </div>
  )
}

export function DetailedFeedback({
  sessionId,
  commenterId,
  analysisId,
  commenterName = "this commenter",
  originalScore = 0,
  onFeedbackSubmit,
  onClose,
  className,
  isSubmitting = false,
  ...props
}: DetailedFeedbackProps) {
  const [overallRating, setOverallRating] = React.useState(0)
  const [factorRatings, setFactorRatings] = React.useState({
    contentRelevance: 0,
    professionalFit: 0,
    timing: 0,
    companyMatch: 0,
    roleMatch: 0,
  })
  const [correctionFlags, setCorrectionFlags] = React.useState<string[]>([])
  const [feedbackText, setFeedbackText] = React.useState("")
  const [improvementSuggestions, setImprovementSuggestions] = React.useState("")
  const [hasSubmitted, setHasSubmitted] = React.useState(false)

  const handleFactorRatingChange = React.useCallback((factor: keyof typeof factorRatings, rating: number) => {
    setFactorRatings(prev => ({
      ...prev,
      [factor]: rating
    }))
  }, [])

  const handleCorrectionToggle = React.useCallback((flag: string) => {
    setCorrectionFlags(prev => 
      prev.includes(flag) 
        ? prev.filter(f => f !== flag)
        : [...prev, flag]
    )
  }, [])

  const handleSubmit = React.useCallback(async () => {
    if (overallRating === 0) return

    try {
      await onFeedbackSubmit?.({
        overallRating,
        factorRatings,
        correctionFlags: correctionFlags.length > 0 ? correctionFlags : undefined,
        feedbackText: feedbackText.trim() || undefined,
        improvementSuggestions: improvementSuggestions.trim() || undefined,
      })
      setHasSubmitted(true)
      
      // Auto-close after success message
      setTimeout(() => {
        onClose?.()
      }, 2500)
    } catch (error) {
      console.error("Failed to submit detailed feedback:", error)
      // TODO: Show error message to user
    }
  }, [overallRating, factorRatings, correctionFlags, feedbackText, improvementSuggestions, onFeedbackSubmit, onClose])

  const isFormValid = overallRating > 0

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
                Detailed feedback submitted!
              </h3>
              <p className="text-body-sm text-muted-foreground">
                Your insights will help improve future analysis accuracy.
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
            <TrendingUp className="w-5 h-5 text-primary" />
            Detailed Feedback
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
        <div className="flex items-center gap-3 mt-2">
          <p className="text-body-sm text-muted-foreground">
            Help us improve by rating specific factors for {commenterName}
          </p>
          {originalScore > 0 && (
            <Badge variant="outline" className="text-xs">
              Original Score: {originalScore}/10
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <label className="text-body-sm font-medium text-foreground">Overall Relevance</label>
          </div>
          <div className="flex gap-1" role="radiogroup" aria-label="Overall relevance rating">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setOverallRating(rating)}
                disabled={isSubmitting}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                  rating <= overallRating
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                )}
                aria-label={`${rating} out of 10`}
                aria-pressed={rating <= overallRating}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="text-caption text-muted-foreground">
            {overallRating > 0 ? `${overallRating}/10 - ${
              overallRating >= 8 ? "High relevance" : 
              overallRating >= 6 ? "Medium relevance" : 
              overallRating >= 4 ? "Low-medium relevance" : "Low relevance"
            }` : "Rate overall relevance (required)"}
          </div>
        </div>

        {/* Factor-Specific Ratings */}
        <div className="space-y-4">
          <h4 className="text-body font-medium text-foreground">Specific Factors</h4>
          <div className="grid gap-4">
            <RatingComponent
              label="Content Relevance"
              icon={Target}
              description="How relevant was their LinkedIn content to your business?"
              value={factorRatings.contentRelevance}
              onChange={(value) => handleFactorRatingChange('contentRelevance', value)}
              disabled={isSubmitting}
            />
            <RatingComponent
              label="Professional Fit"
              icon={User}
              description="How well did their role and experience match your target?"
              value={factorRatings.professionalFit}
              onChange={(value) => handleFactorRatingChange('professionalFit', value)}
              disabled={isSubmitting}
            />
            <RatingComponent
              label="Timing & Readiness"
              icon={Clock}
              description="Did they seem ready for your solution right now?"
              value={factorRatings.timing}
              onChange={(value) => handleFactorRatingChange('timing', value)}
              disabled={isSubmitting}
            />
            <RatingComponent
              label="Company Match"
              icon={Building}
              description="Was their company a good fit for your solution?"
              value={factorRatings.companyMatch}
              onChange={(value) => handleFactorRatingChange('companyMatch', value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Correction Flags */}
        <div className="space-y-3">
          <h4 className="text-body font-medium text-foreground">What did we get wrong?</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'seniority_level', label: 'Overestimated seniority' },
              { id: 'buying_signals', label: 'Missed buying signals' },
              { id: 'industry_classification', label: 'Wrong industry classification' },
              { id: 'content_analysis', label: 'Poor content analysis' },
              { id: 'company_size', label: 'Wrong company size assessment' },
              { id: 'timing', label: 'Incorrect timing assessment' }
            ].map((flag) => (
              <button
                key={flag.id}
                type="button"
                onClick={() => handleCorrectionToggle(flag.id)}
                disabled={isSubmitting}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                  correctionFlags.includes(flag.id)
                    ? "bg-warning/20 text-warning border border-warning/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 border border-border"
                )}
                aria-pressed={correctionFlags.includes(flag.id)}
              >
                {flag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-3">
          <label htmlFor="feedback-details" className="block text-body-sm font-medium text-foreground">
            Additional notes
          </label>
          <Textarea
            id="feedback-details"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us more about this commenter's relevance..."
            className="min-h-[80px] bg-muted/30 border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background resize-none"
            maxLength={500}
            disabled={isSubmitting}
          />
          <p className="text-caption text-muted-foreground">
            {500 - feedbackText.length} characters remaining
          </p>
        </div>

        {/* Improvement Suggestions */}
        <div className="space-y-3">
          <label htmlFor="improvement-suggestions" className="block text-body-sm font-medium text-foreground">
            How can we improve our analysis?
          </label>
          <Textarea
            id="improvement-suggestions"
            value={improvementSuggestions}
            onChange={(e) => setImprovementSuggestions(e.target.value)}
            placeholder="Suggest ways to make future analysis more accurate..."
            className="min-h-[60px] bg-muted/30 border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background resize-none"
            maxLength={300}
            disabled={isSubmitting}
          />
          <p className="text-caption text-muted-foreground">
            {300 - improvementSuggestions.length} characters remaining
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="flex-1 h-11 font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Detailed Feedback
              </>
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6 h-11 text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}