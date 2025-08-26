"use client"

import * as React from "react"
import { AlertTriangle, Coffee, RefreshCw, Wifi, Zap, Bug } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface DelightfulErrorProps {
  title?: string
  message?: string
  type?: "network" | "validation" | "server" | "rate-limit" | "permission" | "default"
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showRetry?: boolean
}

const errorConfig = {
  network: {
    icon: Wifi,
    titles: [
      "Houston, we have a connection problem! 🚀",
      "The internet is playing hide and seek! 🙈",
      "Looks like your WiFi needs a coffee break! ☕",
      "Connection temporarily on vacation! 🏖️"
    ],
    messages: [
      "Don't worry - even LinkedIn has bad hair days sometimes. Let's try that again!",
      "Your internet might need a pep talk. Give it a moment and we'll retry!",
      "Network hiccup detected! Even the best connections need a stretch break.",
      "Connectivity taking a power nap. Let's wake it up with a retry!"
    ],
    suggestions: [
      "☕ Perfect time for a coffee break while your connection sorts itself out!",
      "🧘 Take a deep breath - technology will behave better after a moment.",
      "🔌 Maybe check that ethernet cable hasn't become a cat toy?",
      "📱 Your hotspot might be feeling shy today - give it some encouragement!"
    ]
  },
  validation: {
    icon: AlertTriangle,
    titles: [
      "Oops, that doesn't look quite right! 🤔",
      "Close, but not quite there yet! 🎯",
      "That input needs a little TLC! 💝",
      "Almost perfect - just needs a tiny tweak! ✨"
    ],
    messages: [
      "No worries! Even seasoned LinkedIn users make typos. Let's fix this together!",
      "That URL is playing hard to get. Let's try a different approach!",
      "Input validation is like a friendly bouncer - just making sure everything's legit!",
      "Grammar check time! Even Graham makes mistakes sometimes (don't tell anyone)."
    ],
    suggestions: [
      "💡 Try copying the URL directly from LinkedIn's address bar!",
      "🔍 Double-check that the post URL starts with 'linkedin.com/posts'",
      "✨ Remove any extra characters that might have snuck in!",
      "🎯 Make sure you're sharing the actual post, not a company page!"
    ]
  },
  server: {
    icon: Zap,
    titles: [
      "Our servers are taking a quick power nap! 😴",
      "Graham's brain is temporarily out to lunch! 🍽️",
      "Server hiccup - even robots need breaks sometimes! 🤖",
      "Oops! Our digital hamsters stopped running! 🐹"
    ],
    messages: [
      "Don't panic! Our team of highly caffeinated engineers is on it.",
      "Even the best systems need a stretch break. We'll be back shortly!",
      "Our servers are probably just updating their LinkedIn profiles.",
      "Error 500: Coffee reserves depleted. Refilling now..."
    ],
    suggestions: [
      "☕ Perfect excuse to grab that coffee you've been putting off!",
      "📚 Great time to brush up on your LinkedIn connection messages!",
      "🧘 Practice your breathing exercises - technology will catch up!",
      "📱 Maybe check your own LinkedIn notifications while you wait?"
    ]
  },
  "rate-limit": {
    icon: Coffee,
    titles: [
      "Whoa there, speed demon! 🏃‍♂️💨",
      "Easy tiger - we're not going anywhere! 🐅",
      "Someone's caffeinated today! ☕⚡",
      "Slow down there, Lightning McQueen! ⚡🏎️"
    ],
    messages: [
      "You're so enthusiastic about finding prospects! Let's pace ourselves a bit.",
      "Quality over quantity! Take a breather and we'll resume the prospect hunt.",
      "Even Graham needs a moment to think between analyses!",
      "Your eagerness is admirable, but let's not overwhelm LinkedIn!"
    ],
    suggestions: [
      "☕ Perfect coffee break timing - productivity guru approved!",
      "🧠 Use this time to review your existing prospect notes!",
      "📝 Great moment to craft those personalized connection messages!",
      "⏰ Good things come to those who wait (like quality prospects)!"
    ]
  },
  permission: {
    icon: Bug,
    titles: [
      "Access denied - but it's not personal! 🚪",
      "Looks like we need special clearance! 🔒",
      "Permission slip required! 📝",
      "VIP access needed for this operation! 🎫"
    ],
    messages: [
      "LinkedIn is being extra protective today. Can't blame them!",
      "Seems like we need to sweet-talk LinkedIn into letting us in.",
      "Don't worry - this happens to the best of us! Let's try a different approach.",
      "Even Graham sometimes forgets to say 'please' to LinkedIn!"
    ],
    suggestions: [
      "🔑 Try logging into LinkedIn first, then come back!",
      "🔄 A quick refresh might do the trick!",
      "🍪 Clear those cookies - sometimes they get stale!",
      "🔐 Make sure your LinkedIn session is still fresh!"
    ]
  },
  default: {
    icon: AlertTriangle,
    titles: [
      "Well, this is unexpected! 🤷‍♂️",
      "Plot twist nobody saw coming! 🎭",
      "Even Graham is scratching his digital head! 🤔",
      "Error level: 'It's not you, it's me'! 💔"
    ],
    messages: [
      "Something mysterious happened, but don't worry - we're on the case!",
      "Looks like we discovered a new way to break things! Innovation!",
      "Even the best detectives encounter unsolved mysteries sometimes.",
      "This error is so rare, it might be collectible! (But let's fix it anyway)"
    ],
    suggestions: [
      "🔄 The classic turn-it-off-and-on-again might work!",
      "☕ When in doubt, coffee usually helps (for humans at least)!",
      "🎯 Try a slightly different approach - creativity encouraged!",
      "🤝 If this keeps happening, our support team loves solving puzzles!"
    ]
  }
}

export function DelightfulError({
  title,
  message,
  type = "default",
  onRetry,
  onDismiss,
  className,
  showRetry = true
}: DelightfulErrorProps) {
  const [currentSuggestion, setCurrentSuggestion] = React.useState(0)
  const [retryCount, setRetryCount] = React.useState(0)
  
  const config = errorConfig[type]
  const Icon = config.icon
  
  const currentTitle = title || config.titles[retryCount % config.titles.length]
  const currentMessage = message || config.messages[retryCount % config.messages.length]

  // Rotate suggestions
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % config.suggestions.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [config.suggestions.length])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    onRetry?.()
  }

  return (
    <div className={cn(
      "border rounded-lg p-6 max-w-md mx-auto animate-scale-in",
      type === "network" ? "border-blue-200 bg-blue-50" :
      type === "validation" ? "border-orange-200 bg-orange-50" :
      type === "server" ? "border-red-200 bg-red-50" :
      type === "rate-limit" ? "border-purple-200 bg-purple-50" :
      type === "permission" ? "border-yellow-200 bg-yellow-50" :
      "border-gray-200 bg-gray-50",
      className
    )}>
      {/* Error Icon with Animation */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm animate-wobble">
          <Icon className={cn(
            "w-6 h-6",
            type === "network" ? "text-blue-600" :
            type === "validation" ? "text-orange-600" :
            type === "server" ? "text-red-600" :
            type === "rate-limit" ? "text-purple-600" :
            type === "permission" ? "text-yellow-600" :
            "text-gray-600"
          )} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-h4 font-semibold text-center mb-3 animate-gentle-bounce">
        {currentTitle}
      </h3>

      {/* Message */}
      <p className="text-body-sm text-muted-foreground text-center mb-4 animate-scale-in">
        {currentMessage}
      </p>

      {/* Rotating Suggestion */}
      <div className="p-3 bg-white/50 rounded-md border border-white/80 mb-4 animate-shimmer">
        <div className="text-sm font-medium text-center animate-scale-in">
          {config.suggestions[currentSuggestion]}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        {showRetry && onRetry && (
          <Button
            onClick={handleRetry}
            variant="default"
            size="sm"
            className="animate-card-hover"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryCount === 0 ? "Try Again" : 
             retryCount === 1 ? "One More Time" :
             retryCount === 2 ? "Third Time's the Charm" :
             "Never Give Up!"}
          </Button>
        )}
        
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="outline"
            size="sm"
            className="animate-card-hover"
          >
            Dismiss
          </Button>
        )}
      </div>

      {/* Easter Egg for Multiple Retries */}
      {retryCount >= 3 && (
        <div className="mt-4 text-center animate-success-celebration">
          <div className="text-xs text-muted-foreground">
            🎖️ Persistence Award Unlocked! Graham respects your determination.
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced error boundary with personality
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class DelightfulErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<any> }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ComponentType<any> }>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    console.error('Delightful Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback
      
      if (Fallback) {
        return <Fallback error={this.state.error} />
      }

      return (
        <DelightfulError
          type="default"
          title="Oops! Something went sideways! 🤪"
          message="Don't worry - even Graham has his off days. Let's get you back on track!"
          onRetry={() => this.setState({ hasError: false })}
          showRetry={true}
        />
      )
    }

    return this.props.children
  }
}

// Inline error helpers
interface InlineErrorProps {
  message: string
  type?: "validation" | "warning" | "info"
  className?: string
}

export function InlineError({ message, type = "validation", className }: InlineErrorProps) {
  const colorClasses = {
    validation: "text-red-600 border-red-200 bg-red-50",
    warning: "text-yellow-700 border-yellow-200 bg-yellow-50", 
    info: "text-blue-600 border-blue-200 bg-blue-50"
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md border text-sm animate-scale-in",
      colorClasses[type],
      className
    )}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-wobble" />
      <span>{message}</span>
    </div>
  )
}