"use client"

import * as React from "react"
import { Link, Loader2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Button } from "./button"
import { Label } from "./label"

interface LinkedInUrlInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (url: string) => void
  isLoading?: boolean
  isValid?: boolean | null
  error?: string
  className?: string
  placeholder?: string
  disabled?: boolean
}

const LINKEDIN_POST_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/(posts|feed\/update)\/[a-zA-Z0-9\-_:]+\/?(\?.*)?$/

function LinkedInUrlInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  isValid = null,
  error,
  className,
  placeholder = "https://linkedin.com/posts/username_activity-id",
  disabled = false,
  ...props
}: LinkedInUrlInputProps) {
  const [internalValid, setInternalValid] = React.useState<boolean | null>(null)
  
  // Validate URL format
  React.useEffect(() => {
    if (!value.trim()) {
      setInternalValid(null)
      return
    }
    
    const isValidFormat = LINKEDIN_POST_REGEX.test(value.trim())
    setInternalValid(isValidFormat)
  }, [value])

  const validationState = isValid !== null ? isValid : internalValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit && value.trim() && validationState) {
      onSubmit(value.trim())
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const getValidationIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    }
    
    if (validationState === true) {
      return <Check className="w-4 h-4 text-success" />
    }
    
    if (validationState === false || error) {
      return <AlertCircle className="w-4 h-4 text-destructive" />
    }
    
    return <Link className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)} {...props}>
      <div className="space-y-1">
        <Label htmlFor="linkedin-url">LinkedIn Post URL</Label>
        <div className="relative">
          <Input
            id="linkedin-url"
            type="url"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "pr-12",
              validationState === true && "border-success focus:ring-success/20",
              (validationState === false || error) && "border-destructive focus:ring-destructive/20"
            )}
            aria-describedby={error ? "url-error" : "url-help"}
            aria-invalid={validationState === false || !!error}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {getValidationIcon()}
          </div>
        </div>
        
        {/* Help Text */}
        {!error && !value.trim() && (
          <div id="url-help" className="text-caption text-muted-foreground">
            Example: https://linkedin.com/posts/username_activity-id
          </div>
        )}
        
        {/* Validation Messages */}
        {error && (
          <div id="url-error" className="text-caption text-destructive" role="alert">
            {error}
          </div>
        )}
        
        {validationState === false && !error && value.trim() && (
          <div className="text-caption text-destructive" role="alert">
            Please enter a valid LinkedIn post URL
          </div>
        )}
        
        {validationState === true && !error && (
          <div className="text-caption text-success">
            Valid LinkedIn post URL detected
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!validationState || disabled || isLoading}
        className="w-full focus-ring-enhanced"
        aria-describedby="extract-description"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Extracting Comments...
          </>
        ) : (
          <>
            <Link className="w-4 h-4" />
            Extract Comments
          </>
        )}
      </Button>
      
      <div id="extract-description" className="sr-only">
        This will fetch all commenters from the LinkedIn post for research analysis
      </div>
    </form>
  )
}

export { LinkedInUrlInput }