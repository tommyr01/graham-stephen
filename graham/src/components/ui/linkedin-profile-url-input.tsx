"use client"

import * as React from "react"
import { User, Loader2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Button } from "./button"
import { Label } from "./label"

interface LinkedInProfileUrlInputProps {
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

const LINKEDIN_PROFILE_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_.%]+\/?(\?.*)?$/

function LinkedInProfileUrlInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  isValid = null,
  error,
  className,
  placeholder = "https://linkedin.com/in/username",
  disabled = false,
  ...props
}: LinkedInProfileUrlInputProps) {
  const [internalValid, setInternalValid] = React.useState<boolean | null>(null)
  
  // Validate URL format
  React.useEffect(() => {
    if (!value.trim()) {
      setInternalValid(null)
      return
    }
    
    const trimmedValue = value.trim()
    
    // Simple validation - check if it's a LinkedIn profile URL
    const isLinkedInProfile = trimmedValue.includes('linkedin.com/in/') && 
                             (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://'))
    
    setInternalValid(isLinkedInProfile)
  }, [value])

  const validationState = isValid !== null ? isValid : internalValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (onSubmit && value.trim()) {
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
    
    return <User className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)} {...props}>
      <div className="space-y-1">
        <Label htmlFor="linkedin-profile-url">LinkedIn Profile URL</Label>
        <div className="relative">
          <Input
            id="linkedin-profile-url"
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
            aria-describedby={error ? "profile-url-error" : "profile-url-help"}
            aria-invalid={validationState === false || !!error}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {getValidationIcon()}
          </div>
        </div>
        
        {/* Help Text */}
        {!error && !value.trim() && (
          <div id="profile-url-help" className="text-caption text-muted-foreground">
            Example: https://linkedin.com/in/john-doe
          </div>
        )}
        
        {/* Validation Messages */}
        {error && (
          <div id="profile-url-error" className="text-caption text-destructive" role="alert">
            {error}
          </div>
        )}
        
        {validationState === false && !error && value.trim() && (
          <div className="text-caption text-destructive" role="alert">
            Please enter a valid LinkedIn profile URL
          </div>
        )}
        
        {validationState === true && !error && (
          <div className="text-caption text-success">
            Valid LinkedIn profile URL detected
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!value.includes('linkedin.com/in/') || disabled || isLoading}
        className="w-full focus-ring-enhanced"
        aria-describedby="analyse-description"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysing Profile...
          </>
        ) : (
          <>
            <User className="w-4 h-4" />
            Analyse Profile
          </>
        )}
      </Button>
      
      <div id="analyse-description" className="sr-only">
        This will analyse the LinkedIn profile and recent posts to calculate relevance scores
      </div>
    </form>
  )
}

export { LinkedInProfileUrlInput }