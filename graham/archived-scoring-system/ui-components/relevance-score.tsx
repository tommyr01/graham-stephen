"use client"

import * as React from "react"
import { Target, Zap, Briefcase, Award, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { ScoreReveal } from "./score-reveal"

interface RelevanceScoreProps {
  score: number
  confidence: "high" | "medium" | "low"
  matchedTerms: string[]
  className?: string
  showBreakdown?: boolean
  animated?: boolean
  explanation?: {
    matchedBoostTerms?: { term: string; weight: number }[]
    matchedDownTerms?: { term: string; weight: number }[]
    contentAnalysis?: {
      businessRelevant: number
      promotional: number
      personal: number
    }
    // New professional analysis fields
    experienceAnalysis?: {
      yearsInIndustry: number
      careerConsistency: number
      relevantExperience: number
    }
    credibilitySignals?: string[]
    redFlags?: string[]
  }
}

function RelevanceScore({
  score,
  confidence,
  matchedTerms,
  className,
  showBreakdown = true,
  animated = true,
  explanation,
  ...props
}: RelevanceScoreProps) {
  const scoreLabel = React.useMemo(() => {
    if (score >= 8) return "High Relevance"
    if (score >= 4) return "Medium Relevance"
    return "Low Relevance"
  }, [score])

  const scoreColorClass = React.useMemo(() => {
    if (score >= 8) return "relevance-high"
    if (score >= 4) return "relevance-medium"
    return "relevance-low"
  }, [score])

  const scoreBgColorClass = React.useMemo(() => {
    if (score >= 8) return "relevance-high-bg"
    if (score >= 4) return "relevance-medium-bg"
    return "relevance-low-bg"
  }, [score])

  const confidenceIcon = confidence === "high" ? (
    <Zap className="w-4 h-4 text-emerald-500" />
  ) : confidence === "medium" ? (
    <Zap className="w-4 h-4 text-yellow-500" />
  ) : (
    <Zap className="w-4 h-4 text-red-500" />
  )

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-6 space-y-4",
        className
      )}
      role="region"
      aria-labelledby="relevance-score-title"
      {...props}
    >
      {/* Header */}
      <div className="space-y-2">
        <h3 id="relevance-score-title" className="text-label text-muted-foreground">
          RELEVANCE SCORE
        </h3>
        
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {animated ? (
              <div className="flex items-center gap-4 mb-2">
                <ScoreReveal 
                  score={score} 
                  size="lg" 
                  showConfetti={score >= 8}
                  className="animate-scale-in"
                />
                <div className="flex-1">
                  <div className={cn("text-h5 font-semibold", scoreColorClass)}>
                    {scoreLabel}
                  </div>
                  <div className="text-muted-foreground text-body-sm">
                    out of 10
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-2 mb-2">
                <span 
                  className={cn("text-4xl font-bold", scoreColorClass)}
                  aria-label={`Score ${score} out of 10`}
                >
                  {score}
                </span>
                <span className="text-muted-foreground text-body-sm pb-1">/10</span>
                <div className={cn("text-h5 font-semibold ml-2", scoreColorClass)}>
                  {scoreLabel}
                </div>
              </div>
            )}
          </div>
          
          {/* Score Bar */}
          <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all animate-short ease-out", 
                scoreBgColorClass,
                animated && score >= 8 && "animate-glow-pulse"
              )}
              style={{ width: `${(score / 10) * 100}%` }}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={`Relevance score: ${score} out of 10`}
            />
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="flex items-center gap-2">
        {confidenceIcon}
        <span className="text-body-sm text-muted-foreground">
          {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
        </span>
      </div>

      {/* Matched Terms */}
      {matchedTerms.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-body-sm font-medium">Strong matches:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedTerms.map((term, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {term}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {showBreakdown && explanation && (
        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-label text-muted-foreground">GRAHAM'S ANALYSIS</h4>
          
          {/* RED FLAGS (Show first and prominently) */}
          {explanation.redFlags && explanation.redFlags.length > 0 && (
            <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-body-sm font-medium text-red-800">Red Flags Detected</span>
              </div>
              <div className="space-y-1">
                {explanation.redFlags.map((flag, index) => (
                  <div key={index} className="text-caption text-red-700 ml-6">
                    • {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFESSIONAL EXPERIENCE (Primary Factor) */}
          {explanation.experienceAnalysis && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-body-sm font-medium">Professional Experience</span>
              </div>
              <div className="ml-6 space-y-1 text-caption text-muted-foreground">
                <div className="flex justify-between">
                  <span>Years in M&A/Brokerage:</span>
                  <span className={cn(
                    "font-medium",
                    explanation.experienceAnalysis.yearsInIndustry >= 10 ? "text-green-600" :
                    explanation.experienceAnalysis.yearsInIndustry >= 5 ? "text-yellow-600" :
                    explanation.experienceAnalysis.yearsInIndustry >= 3 ? "text-orange-600" :
                    "text-red-600"
                  )}>
                    {explanation.experienceAnalysis.yearsInIndustry} years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Career Consistency:</span>
                  <span className={cn(
                    "font-medium",
                    explanation.experienceAnalysis.careerConsistency >= 0.8 ? "text-green-600" :
                    explanation.experienceAnalysis.careerConsistency >= 0.5 ? "text-yellow-600" :
                    "text-red-600"
                  )}>
                    {Math.round(explanation.experienceAnalysis.careerConsistency * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Relevant Positions:</span>
                  <span className="font-medium">{explanation.experienceAnalysis.relevantExperience}</span>
                </div>
              </div>
            </div>
          )}

          {/* CREDIBILITY SIGNALS */}
          {explanation.credibilitySignals && explanation.credibilitySignals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-success" />
                <span className="text-body-sm font-medium text-success">Credibility Signals</span>
              </div>
              <div className="ml-6 space-y-1">
                {explanation.credibilitySignals.map((signal, index) => (
                  <div key={index} className="text-caption text-success">
                    ✓ {signal}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* KEYWORD MATCHES */}
          {explanation.matchedBoostTerms && explanation.matchedBoostTerms.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-body-sm font-medium">Industry Keywords</span>
              </div>
              <div className="text-caption text-muted-foreground ml-6">
                <div>M&A Terms Found: {explanation.matchedBoostTerms.length}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {explanation.matchedBoostTerms.slice(0, 5).map((term, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {term.term}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* FINAL VERDICT */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Graham's Verdict:</span>
              <span className={cn("font-bold", scoreColorClass)}>
                {score >= 8 ? "🎯 Connect Now" :
                 score >= 6 ? "👍 Worth Connecting" :
                 score >= 4 ? "⚠️ Proceed with Caution" :
                 "❌ Skip This Prospect"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { RelevanceScore }