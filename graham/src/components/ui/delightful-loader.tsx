"use client"

import * as React from "react"
import { Target, Users, TrendingUp, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DelightfulLoaderProps {
  message?: string
  type?: "extraction" | "analysis" | "profile" | "default"
  size?: "sm" | "md" | "lg"
  className?: string
}

const loadingMessages = {
  extraction: [
    "Diving into LinkedIn comments...",
    "Finding your next prospects...",
    "Scanning the conversation...",
    "Discovering hidden gems...",
    "Almost there, hunting for gold..."
  ],
  analysis: [
    "Calculating relevance scores...",
    "Analyzing prospect quality...",
    "Crunching the numbers...",
    "Reading between the lines...",
    "Making the magic happen..."
  ],
  profile: [
    "Researching their background...",
    "Checking their recent activity...",
    "Understanding their interests...",
    "Building their profile...",
    "Connecting the dots..."
  ],
  default: [
    "Working on it...",
    "Processing your request...",
    "Almost ready...",
    "Just a moment...",
    "Getting things ready..."
  ]
}

const icons = {
  extraction: MessageCircle,
  analysis: TrendingUp,
  profile: Users,
  default: Target
}

export function DelightfulLoader({ 
  message, 
  type = "default", 
  size = "md",
  className 
}: DelightfulLoaderProps) {
  const [currentMessage, setCurrentMessage] = React.useState(
    message || loadingMessages[type][0]
  )
  const [messageIndex, setMessageIndex] = React.useState(0)
  
  const Icon = icons[type]
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  // Rotate through messages if no custom message provided
  React.useEffect(() => {
    if (!message) {
      const messages = loadingMessages[type]
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [message, type])
  
  React.useEffect(() => {
    if (!message) {
      setCurrentMessage(loadingMessages[type][messageIndex])
    }
  }, [messageIndex, message, type])

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 py-4",
      className
    )}>
      {/* Animated Icon */}
      <div className="relative">
        <Icon 
          className={cn(
            sizeClasses[size],
            "text-primary animate-gentle-bounce"
          )}
        />
        {/* Pulse ring */}
        <div className={cn(
          sizeClasses[size],
          "absolute inset-0 rounded-full border-2 border-primary/30 animate-glow-pulse"
        )} />
      </div>
      
      {/* Loading Dots */}
      <div className="animate-loading-dots">
        <span className="w-2 h-2 bg-primary rounded-full inline-block"></span>
        <span className="w-2 h-2 bg-primary rounded-full inline-block"></span>
        <span className="w-2 h-2 bg-primary rounded-full inline-block"></span>
      </div>
      
      {/* Message */}
      <div className={cn(
        textSizeClasses[size],
        "text-muted-foreground font-medium animate-scale-in"
      )}>
        {currentMessage}
      </div>
    </div>
  )
}

// Skeleton with shimmer effect
interface DelightfulSkeletonProps {
  className?: string
  children?: React.ReactNode
}

export function DelightfulSkeleton({ className, children }: DelightfulSkeletonProps) {
  return (
    <div className={cn(
      "animate-shimmer bg-muted rounded-md",
      className
    )}>
      {children}
    </div>
  )
}

// Enhanced loading overlay
interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  type?: "extraction" | "analysis" | "profile" | "default"
  children?: React.ReactNode
}

export function LoadingOverlay({ 
  isVisible, 
  message, 
  type = "default",
  children 
}: LoadingOverlayProps) {
  if (!isVisible) return <>{children}</>
  
  return (
    <div className="relative">
      {children && (
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
        <DelightfulLoader message={message} type={type} size="lg" />
      </div>
    </div>
  )
}