"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-body-sm text-muted-foreground">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={resetError} className="w-full gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

function ErrorMessage({ 
  title = "Error", 
  message, 
  onRetry, 
  className 
}: ErrorMessageProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-destructive">{title}</h3>
            <p className="text-body-sm text-muted-foreground">{message}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ErrorBoundary, ErrorMessage, type ErrorFallbackProps }