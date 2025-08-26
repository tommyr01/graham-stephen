"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DelightfulLoader } from "./delightful-loader"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
  type?: "extraction" | "analysis" | "profile" | "default"
  delightful?: boolean
}

function Loading({ size = "md", text, className, type = "default", delightful = true }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  // Use delightful loader by default, fallback to simple loader
  if (delightful) {
    return (
      <div className={cn("", className)} role="status" aria-live="polite">
        <DelightfulLoader message={text} type={type} size={size} />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)} role="status" aria-live="polite">
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <span className="text-body text-muted-foreground">
          {text}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  className?: string
  children: React.ReactNode
  type?: "extraction" | "analysis" | "profile" | "default"
  delightful?: boolean
}

function LoadingOverlay({ 
  isLoading, 
  text = "Loading...", 
  className, 
  children, 
  type = "default",
  delightful = true 
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
          <Loading text={text} size="lg" type={type} delightful={delightful} />
        </div>
      )}
    </div>
  )
}

export { Loading, LoadingOverlay }