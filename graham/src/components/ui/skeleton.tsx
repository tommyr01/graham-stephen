import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

function CommenterCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border rounded-xl p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* Comment Preview */}
      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      
      {/* Button */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

function RelevanceScoreSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border rounded-xl p-6 space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-end gap-2">
              <Skeleton className="h-12 w-12" />
              <Skeleton className="h-6 w-8" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="w-24 h-3 rounded-full" />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-18 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, CommenterCardSkeleton, RelevanceScoreSkeleton }