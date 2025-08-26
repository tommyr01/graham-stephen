// Feedback Service - Centralized API calls for the feedback system

import type { 
  BinaryFeedbackRequest,
  DetailedFeedbackRequest,
  OutcomeFeedbackRequest,
  FeedbackAnalyticsResponse,
  APIError
} from './types'

class FeedbackServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'FeedbackServiceError'
  }
}

export class FeedbackService {
  private static instance: FeedbackService
  private baseUrl: string

  private constructor() {
    this.baseUrl = '/api/feedback'
  }

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService()
    }
    return FeedbackService.instance
  }

  /**
   * Submit binary feedback (thumbs up/down)
   */
  async submitBinaryFeedback(feedback: BinaryFeedbackRequest): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: feedback.sessionId,
          commenterId: feedback.commenterId,
          analysisId: feedback.analysisId,
          rating: feedback.isRelevant ? 4 : 2, // Convert boolean to 1-5 scale
          feedbackText: feedback.notes,
          isRelevant: feedback.isRelevant,
          notes: `Binary feedback. Confidence: ${feedback.confidenceScore || 'N/A'}`,
        }),
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new FeedbackServiceError(
          errorData.message || 'Failed to submit binary feedback',
          response.status,
          errorData
        )
      }
    } catch (error) {
      if (error instanceof FeedbackServiceError) {
        throw error
      }
      throw new FeedbackServiceError(
        'Network error while submitting binary feedback',
        undefined,
        error
      )
    }
  }

  /**
   * Submit detailed factor-specific feedback
   */
  async submitDetailedFeedback(feedback: DetailedFeedbackRequest): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: feedback.sessionId,
          commenterId: feedback.commenterId,
          analysisId: feedback.analysisId,
          feedbackType: 'detailed',
          overallRating: feedback.overallRating,
          factorRatings: feedback.factorRatings,
          correctionFlags: feedback.correctionFlags,
          feedbackText: feedback.feedbackText,
          improvementSuggestions: feedback.improvementSuggestions,
        }),
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new FeedbackServiceError(
          errorData.message || 'Failed to submit detailed feedback',
          response.status,
          errorData
        )
      }
    } catch (error) {
      if (error instanceof FeedbackServiceError) {
        throw error
      }
      throw new FeedbackServiceError(
        'Network error while submitting detailed feedback',
        undefined,
        error
      )
    }
  }

  /**
   * Submit outcome-based feedback
   */
  async submitOutcomeFeedback(feedback: OutcomeFeedbackRequest): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: feedback.feedbackId,
          outcomeData: feedback.outcomeData,
          retrospectiveNotes: feedback.retrospectiveNotes,
        }),
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new FeedbackServiceError(
          errorData.message || 'Failed to submit outcome feedback',
          response.status,
          errorData
        )
      }
    } catch (error) {
      if (error instanceof FeedbackServiceError) {
        throw error
      }
      throw new FeedbackServiceError(
        'Network error while submitting outcome feedback',
        undefined,
        error
      )
    }
  }

  /**
   * Get user feedback analytics and impact data
   */
  async getFeedbackAnalytics(
    userId: string, 
    teamId?: string
  ): Promise<FeedbackAnalyticsResponse> {
    try {
      const params = new URLSearchParams({ userId })
      if (teamId) {
        params.append('teamId', teamId)
      }

      const response = await fetch(`/api/feedback/analytics?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new FeedbackServiceError(
          errorData.message || 'Failed to fetch feedback analytics',
          response.status,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof FeedbackServiceError) {
        throw error
      }
      throw new FeedbackServiceError(
        'Network error while fetching feedback analytics',
        undefined,
        error
      )
    }
  }

  /**
   * Get user learning status and progress
   */
  async getLearningStatus(userId: string, teamId?: string) {
    try {
      const params = new URLSearchParams({ userId })
      if (teamId) {
        params.append('teamId', teamId)
      }

      const response = await fetch(`/api/feedback/learning?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new FeedbackServiceError(
          errorData.message || 'Failed to fetch learning status',
          response.status,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof FeedbackServiceError) {
        throw error
      }
      throw new FeedbackServiceError(
        'Network error while fetching learning status',
        undefined,
        error
      )
    }
  }

  /**
   * Mark feedback for future reminder
   */
  async scheduleOutcomeReminder(feedbackId: string, reminderDate: Date): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId,
          reminderDate: reminderDate.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new FeedbackServiceError(
          errorData.message || 'Failed to schedule reminder',
          response.status,
          errorData
        )
      }
    } catch (error) {
      if (error instanceof FeedbackServiceError) {
        throw error
      }
      throw new FeedbackServiceError(
        'Network error while scheduling reminder',
        undefined,
        error
      )
    }
  }

  /**
   * Handle bulk feedback submission
   */
  async submitBulkFeedback(feedbackList: Array<{
    commenterId: string
    isRelevant: boolean
    rating?: number
    notes?: string
  }>, sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedbackList,
          sessionId,
        }),
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new FeedbackServiceError(
          errorData.message || 'Failed to submit bulk feedback',
          response.status,
          errorData
        )
      }
    } catch (error) {
      if (error instanceof FeedbackServiceError) {
        throw error
      }
      throw new FeedbackServiceError(
        'Network error while submitting bulk feedback',
        undefined,
        error
      )
    }
  }
}

// Export singleton instance
export const feedbackService = FeedbackService.getInstance()

// Error type guard
export function isFeedbackServiceError(error: unknown): error is FeedbackServiceError {
  return error instanceof FeedbackServiceError
}

// Utility functions for error handling
export function getFeedbackErrorMessage(error: unknown): string {
  if (isFeedbackServiceError(error)) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export function shouldRetryFeedbackOperation(error: unknown): boolean {
  if (isFeedbackServiceError(error)) {
    // Retry on network errors or server errors (5xx), but not client errors (4xx)
    return !error.statusCode || error.statusCode >= 500
  }
  
  return true // Retry on unknown errors
}