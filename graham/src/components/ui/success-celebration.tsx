"use client"

import * as React from "react"
import { Check, Target, TrendingUp, Users, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuccessCelebrationProps {
  message?: string
  type?: "analysis" | "extraction" | "feedback" | "export" | "default"
  duration?: number
  showIcon?: boolean
  className?: string
  onComplete?: () => void
}

const successMessages = {
  analysis: [
    "Analysis complete! 🎯",
    "Another prospect decoded! ✨",
    "Great insights discovered! 💡",
    "Quality analysis delivered! 🌟"
  ],
  extraction: [
    "Comments extracted successfully! 🎉",
    "Found some great prospects! 🔍",
    "Data gathered and ready! ⚡",
    "LinkedIn comments captured! 📊"
  ],
  feedback: [
    "Thanks for making me smarter! 🧠",
    "Your feedback helps me learn! 📚",
    "Wisdom received and processed! ✨",
    "Another lesson learned! 🎓"
  ],
  export: [
    "Your prospect list is ready! 📄",
    "Data exported successfully! 💾",
    "Ready to conquer those leads! 🚀",
    "Export complete and delivered! ✅"
  ],
  default: [
    "Success! 🎉",
    "All done! ✨",
    "Task completed! ✅",
    "Mission accomplished! 🎯"
  ]
}

const icons = {
  analysis: TrendingUp,
  extraction: Target,
  feedback: Check,
  export: Zap,
  default: Check
}

export function SuccessCelebration({
  message,
  type = "default",
  duration = 3000,
  showIcon = true,
  className,
  onComplete
}: SuccessCelebrationProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const [currentMessage, setCurrentMessage] = React.useState(
    message || successMessages[type][Math.floor(Math.random() * successMessages[type].length)]
  )
  
  const Icon = icons[type]
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onComplete])
  
  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 animate-scale-in",
      className
    )}>
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center animate-success-celebration">
                <Icon className="w-4 h-4 text-green-600" />
              </div>
            </div>
          )}
          
          <div className="text-green-800 font-medium">
            {currentMessage}
          </div>
          
          {/* Confetti particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="confetti-particle animate-confetti"
                style={{
                  left: `${20 + i * 15}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast-style success message
interface SuccessToastProps {
  title: string
  description?: string
  duration?: number
  onClose?: () => void
}

export function SuccessToast({
  title,
  description,
  duration = 5000,
  onClose
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }
  
  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-scale-in max-w-sm">
      <div className="bg-card border border-green-200 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center animate-success-celebration">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground">
                {title}
              </h4>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close notification"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-green-500 animate-success-celebration"
            style={{
              animation: `success-progress ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Inline success feedback
interface InlineSuccessProps {
  message: string
  icon?: React.ReactNode
  className?: string
}

export function InlineSuccess({
  message,
  icon,
  className
}: InlineSuccessProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-green-600 text-sm font-medium animate-scale-in",
      className
    )}>
      <div className="animate-success-celebration">
        {icon || <Check className="w-4 h-4" />}
      </div>
      <span>{message}</span>
    </div>
  )
}

// Add the progress animation to CSS
const progressKeyframes = `
@keyframes success-progress {
  from { width: 100%; }
  to { width: 0%; }
}
`

// Inject the keyframes if not already present
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = progressKeyframes
  document.head.appendChild(styleSheet)
}