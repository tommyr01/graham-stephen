"use client"

import * as React from "react"
import { Users, Target, MessageCircle, Search, Coffee, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EmptyStateProps {
  type?: "commenters" | "analysis" | "search" | "feedback" | "default"
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const emptyStateConfig = {
  commenters: {
    icon: Users,
    title: "Ready to find your next prospects?",
    descriptions: [
      "Enter a LinkedIn post URL above to extract commenters and discover your next unicorn prospects! 🦄",
      "Let's dive into those LinkedIn comments and find some business gold! ✨",
      "Time to turn those LinkedIn conversations into quality leads! 🎯",
      "Ready to uncover hidden prospects in LinkedIn comment threads? 🔍"
    ],
    ascii: `
    👥 ➜ 🎯 ➜ 💰
    Find → Score → Connect
    `
  },
  analysis: {
    icon: Target,
    title: "Analysis complete!",
    descriptions: [
      "Your prospects are all scored and ready for outreach! Time to make those connections count! 🚀",
      "Graham has analyzed everything - now go turn those scores into sales! 💪",
      "All done! Your highest-scoring prospects are waiting for your brilliant outreach! ✨"
    ],
    ascii: `
    📊 ✅ 🎉
    Analyzed & Ready!
    `
  },
  search: {
    icon: Search,
    title: "Nothing found here... yet!",
    descriptions: [
      "Maybe try a different search term? Sometimes the best prospects are hiding in unexpected places! 🕵️",
      "No matches this time, but that just means you're being selective - keep hunting! 🎯",
      "Empty results mean you're thinking outside the box! Try another angle! 💡"
    ],
    ascii: `
    🔍 ➜ ❓ ➜ 💭
    Keep searching...
    `
  },
  feedback: {
    icon: Coffee,
    title: "Take a breather!",
    descriptions: [
      "While you grab a coffee ☕, I'll be here learning from all the feedback you've shared!",
      "Perfect time for a stretch break! When you're back, I'll be even smarter thanks to you! 🧠",
      "Coffee break? Good idea! I'll use this time to process everything you've taught me! ✨"
    ],
    ascii: `
    ☕ 📚 🧠
    Learning mode...
    `
  },
  default: {
    icon: Lightbulb,
    title: "Ready when you are!",
    descriptions: [
      "What shall we discover together today? 🚀",
      "The possibilities are endless - let's get started! ✨",
      "Ready to turn LinkedIn into your personal prospect goldmine? 🎯"
    ],
    ascii: `
    💡 ➜ 🎯 ➜ 🌟
    Let's get started!
    `
  }
}

const helpfulTips = [
  "💡 Pro tip: Look for posts with 50+ comments for the best prospect variety!",
  "🎯 Hot tip: Industry-specific posts often have higher-quality leads!",
  "⭐ Graham's wisdom: Recent comments show more engaged prospects!",
  "🔥 Success secret: Check the comment author's recent posts too!",
  "💎 Insider tip: Engagement quality matters more than quantity!",
  "🚀 Power move: Connect with prospects who ask thoughtful questions!",
  "🎪 Fun fact: Graham learns from every feedback you give!",
  "☕ Productivity hack: Best prospecting happens with good coffee!"
]

export function EmptyState({
  type = "default",
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon
  const [currentTip, setCurrentTip] = React.useState(0)
  const [currentDescription, setCurrentDescription] = React.useState(0)

  // Rotate through helpful tips
  React.useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % helpfulTips.length)
    }, 4000)
    
    return () => clearInterval(tipInterval)
  }, [])

  // Rotate through descriptions
  React.useEffect(() => {
    const descInterval = setInterval(() => {
      setCurrentDescription((prev) => (prev + 1) % config.descriptions.length)
    }, 6000)
    
    return () => clearInterval(descInterval)
  }, [config.descriptions.length])

  return (
    <div className={cn(
      "text-center py-12 px-6 max-w-md mx-auto space-y-6",
      className
    )}>
      {/* Animated Icon */}
      <div className="relative">
        <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center animate-gentle-bounce">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        
        {/* Pulsing ring */}
        <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-2 border-primary/20 animate-glow-pulse" />
      </div>

      {/* ASCII Art */}
      <div className="font-mono text-xs text-muted-foreground/70 whitespace-pre-line animate-scale-in">
        {config.ascii}
      </div>

      {/* Title */}
      <div>
        <h3 className="text-h3 font-semibold mb-2 animate-scale-in">
          {title || config.title}
        </h3>
        
        {/* Rotating Description */}
        <p className="text-body text-muted-foreground animate-scale-in">
          {description || config.descriptions[currentDescription]}
        </p>
      </div>

      {/* Helpful Tips */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 animate-shimmer">
        <div className="text-sm text-primary/80 font-medium animate-scale-in">
          {helpfulTips[currentTip]}
        </div>
      </div>

      {/* Action Button */}
      {action && (
        <div className="pt-4">
          <Button 
            onClick={action.onClick}
            className="animate-scale-in animate-wobble"
            size="lg"
          >
            {action.label}
          </Button>
        </div>
      )}

      {/* Easter Egg - Hidden coffee animation */}
      <div className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-xs text-muted-foreground/50">
        <span className="animate-gentle-bounce inline-block">☕</span>
        <span className="ml-1">Graham is powered by coffee and your feedback!</span>
      </div>
    </div>
  )
}

// Specialized empty states
export function CommenterEmptyState({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <EmptyState
      type="commenters"
      action={onGetStarted ? {
        label: "Find Some Prospects!",
        onClick: onGetStarted
      } : undefined}
    />
  )
}

export function AnalysisEmptyState() {
  return <EmptyState type="analysis" />
}

export function SearchEmptyState({ onTryAgain }: { onTryAgain?: () => void }) {
  return (
    <EmptyState
      type="search"
      action={onTryAgain ? {
        label: "Try Different Keywords",
        onClick: onTryAgain
      } : undefined}
    />
  )
}

export function FeedbackEmptyState() {
  return <EmptyState type="feedback" />
}