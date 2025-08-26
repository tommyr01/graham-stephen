"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScoreRevealProps {
  score: number
  maxScore?: number
  duration?: number
  showConfetti?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  onComplete?: () => void
}

export function ScoreReveal({
  score,
  maxScore = 10,
  duration = 800,
  showConfetti = true,
  className,
  size = "md",
  onComplete
}: ScoreRevealProps) {
  const [displayScore, setDisplayScore] = React.useState(0)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [showCelebration, setShowCelebration] = React.useState(false)
  
  const sizeClasses = {
    sm: "text-lg w-8 h-8",
    md: "text-2xl w-12 h-12",
    lg: "text-4xl w-16 h-16"
  }
  
  const confettiSizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2", 
    lg: "w-3 h-3"
  }

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500 bg-green-50 border-green-200"
    if (score >= 4) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-gray-500 bg-gray-50 border-gray-200"
  }
  
  const getScoreGlow = (score: number) => {
    if (score >= 8) return "animate-glow-pulse"
    return ""
  }

  React.useEffect(() => {
    setIsAnimating(true)
    const startTime = Date.now()
    
    const animateScore = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentScore = Math.round(easeOut * score)
      
      setDisplayScore(currentScore)
      
      if (progress < 1) {
        requestAnimationFrame(animateScore)
      } else {
        setIsAnimating(false)
        // Trigger celebration for high scores
        if (score >= 8 && showConfetti) {
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 3000)
        }
        onComplete?.()
      }
    }
    
    requestAnimationFrame(animateScore)
  }, [score, duration, showConfetti, onComplete])

  return (
    <div className="relative inline-block">
      {/* Score Circle */}
      <div className={cn(
        "relative flex items-center justify-center rounded-full border-2 font-bold transition-all duration-300",
        sizeClasses[size],
        getScoreColor(displayScore),
        getScoreGlow(displayScore),
        isAnimating && "animate-score-reveal",
        className
      )}>
        {displayScore}
        
        {/* Score text for screen readers */}
        <span className="sr-only">
          Score: {displayScore} out of {maxScore}
        </span>
      </div>
      
      {/* Confetti particles for high scores */}
      {showCelebration && score >= 8 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "confetti-particle animate-confetti",
                confettiSizeClasses[size]
              )}
            />
          ))}
        </div>
      )}
      
      {/* Achievement badge for perfect scores */}
      {displayScore === maxScore && (
        <div className="absolute -top-1 -right-1 animate-success-celebration">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 text-xs font-bold">
            ⭐
          </div>
        </div>
      )}
    </div>
  )
}

// Progress bar with personality
interface DelightfulProgressProps {
  value: number
  max?: number
  showPercentage?: boolean
  message?: string
  className?: string
  variant?: "default" | "success" | "warning" | "error"
}

export function DelightfulProgress({
  value,
  max = 100,
  showPercentage = false,
  message,
  className,
  variant = "default"
}: DelightfulProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const variantClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500"
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {(message || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {message && (
            <span className="text-muted-foreground animate-scale-in">
              {message}
            </span>
          )}
          {showPercentage && (
            <span className="font-medium animate-score-reveal">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            variantClasses[variant],
            percentage >= 100 && "animate-success-celebration"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}