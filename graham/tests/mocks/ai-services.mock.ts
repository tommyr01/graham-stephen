/**
 * AI Services Mock for Testing
 * Provides mock responses for OpenAI and Anthropic API calls
 */

import { jest } from '@jest/globals';

// Mock OpenAI responses
export const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          analysis: {
            authenticityScore: 7.5,
            expertiseLevel: 8.2,
            redFlags: [],
            reasoning: 'Professional content with good industry knowledge'
          }
        })
      },
      finish_reason: 'stop',
      index: 0
    }
  ],
  usage: {
    prompt_tokens: 500,
    completion_tokens: 200,
    total_tokens: 700
  },
  model: 'gpt-4o',
  created: Date.now()
};

export const mockOpenAIBatchResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          analyses: [
            {
              postId: 'post-1',
              authenticityScore: 7.5,
              expertiseLevel: 8.2,
              redFlags: [],
              reasoning: 'Professional M&A content'
            },
            {
              postId: 'post-2',
              authenticityScore: 6.8,
              expertiseLevel: 7.9,
              redFlags: ['promotional'],
              reasoning: 'Good content with slight promotional tone'
            }
          ]
        })
      },
      finish_reason: 'stop',
      index: 0
    }
  ],
  usage: {
    prompt_tokens: 1200,
    completion_tokens: 400,
    total_tokens: 1600
  }
};

// Mock Anthropic responses
export const mockAnthropicResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        roles: [
          {
            roleIndex: 0,
            title: 'Senior M&A Advisor',
            company: 'Investment Firm',
            relevanceScore: 0.92,
            reasoning: 'Direct M&A experience with high transaction volume'
          },
          {
            roleIndex: 1,
            title: 'Investment Analyst',
            company: 'Goldman Sachs',
            relevanceScore: 0.75,
            reasoning: 'Related investment banking experience'
          }
        ]
      })
    }
  ],
  usage: {
    input_tokens: 800,
    output_tokens: 300
  },
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn'
};

// Mock LinkedIn API responses
export const mockLinkedInProfileResponse = {
  profileData: {
    basicInfo: {
      name: 'John Doe',
      headline: 'Senior M&A Advisor at Elite Investment Partners',
      company: 'Elite Investment Partners',
      location: 'New York, NY',
      industry: 'Investment Banking',
      role: 'Senior M&A Advisor'
    },
    experience: [
      {
        title: 'Senior M&A Advisor',
        company: 'Elite Investment Partners',
        start_date: { year: 2018 },
        end_date: { year: 2024 },
        description: 'Leading M&A transactions across technology and healthcare sectors'
      },
      {
        title: 'Investment Analyst',
        company: 'Goldman Sachs',
        start_date: { year: 2015 },
        end_date: { year: 2018 },
        description: 'Financial analysis and deal support'
      }
    ],
    recentPosts: [
      {
        id: 'post-1',
        content: 'Excited to announce the successful completion of our latest tech acquisition...',
        publishedAt: '2024-01-15T10:00:00Z',
        engagement: { likes: 45, comments: 12, shares: 8 }
      },
      {
        id: 'post-2',
        content: 'Key insights from this quarter\'s M&A market analysis...',
        publishedAt: '2024-01-10T14:30:00Z',
        engagement: { likes: 67, comments: 18, shares: 15 }
      }
    ]
  }
};

// Error response mocks
export const mockOpenAIQuotaError = {
  error: {
    message: 'You exceeded your current quota, please check your plan and billing details.',
    type: 'insufficient_quota',
    code: 'insufficient_quota'
  },
  status: 429
};

export const mockAnthropicRateLimitError = {
  error: {
    type: 'rate_limit_error',
    message: 'Rate limit exceeded. Please try again later.'
  },
  status: 429
};

export const mockLinkedInRateLimitError = {
  error: 'Rate limit exceeded',
  message: 'Too many requests. Please try again later.',
  status: 429,
  headers: {
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': '3600'
  }
};

// Service timeout errors
export const mockServiceTimeoutError = new Error('Service timeout after 30 seconds');

// Network errors
export const mockNetworkError = new Error('Network request failed');

// Mock AI service factories
export const createMockOpenAIClient = () => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue(mockOpenAIResponse)
    }
  }
});

export const createMockAnthropicClient = () => ({
  messages: {
    create: jest.fn().mockResolvedValue(mockAnthropicResponse)
  }
});

// Scenario-based mock configurators
export const configureMockAISuccess = () => {
  const openaiClient = createMockOpenAIClient();
  const anthropicClient = createMockAnthropicClient();
  
  return { openaiClient, anthropicClient };
};

export const configureMockAIFailure = (errorType: 'quota' | 'timeout' | 'network' | 'rate-limit' = 'quota') => {
  const openaiClient = createMockOpenAIClient();
  const anthropicClient = createMockAnthropicClient();
  
  const error = errorType === 'quota' ? mockOpenAIQuotaError :
                errorType === 'timeout' ? mockServiceTimeoutError :
                errorType === 'network' ? mockNetworkError :
                errorType === 'rate-limit' ? mockAnthropicRateLimitError :
                mockOpenAIQuotaError;
  
  openaiClient.chat.completions.create.mockRejectedValue(error);
  anthropicClient.messages.create.mockRejectedValue(error);
  
  return { openaiClient, anthropicClient };
};

export const configureMockAIMixed = () => {
  const openaiClient = createMockOpenAIClient();
  const anthropicClient = createMockAnthropicClient();
  
  // OpenAI succeeds, Anthropic fails
  openaiClient.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
  anthropicClient.messages.create.mockRejectedValue(mockAnthropicRateLimitError);
  
  return { openaiClient, anthropicClient };
};

// Mock response generators for different content types
export const generateMockContentAnalysis = (quality: 'high' | 'medium' | 'low' = 'medium') => {
  const baseScores = {
    high: { authenticity: 8.5, expertise: 8.2, redFlags: 0 },
    medium: { authenticity: 6.0, expertise: 6.5, redFlags: 1 },
    low: { authenticity: 3.5, expertise: 3.0, redFlags: 4 }
  };
  
  const scores = baseScores[quality];
  
  return {
    authenticityScore: scores.authenticity,
    expertiseLevel: scores.expertise,
    redFlags: quality === 'low' ? ['promotional', 'generic', 'low-effort'] : 
              quality === 'medium' ? ['promotional'] : [],
    reasoning: quality === 'high' ? 'Professional content with strong industry knowledge' :
               quality === 'medium' ? 'Decent content with some promotional elements' :
               'Low-quality content with multiple red flags'
  };
};

export const generateMockExperienceAnalysis = (relevance: 'high' | 'medium' | 'low' = 'medium') => {
  const baseRelevance = {
    high: 0.9,
    medium: 0.6,
    low: 0.2
  };
  
  return {
    roles: [
      {
        roleIndex: 0,
        title: relevance === 'high' ? 'M&A Director' : 
               relevance === 'medium' ? 'Business Analyst' : 
               'Marketing Manager',
        company: 'Test Company',
        relevanceScore: baseRelevance[relevance],
        reasoning: relevance === 'high' ? 'Direct M&A experience' :
                   relevance === 'medium' ? 'Related business experience' :
                   'Non-relevant experience'
      }
    ]
  };
};

// Batch processing mocks
export const generateMockBatchAnalysis = (count: number, quality: 'high' | 'medium' | 'low' = 'medium') => {
  return {
    analyses: Array.from({ length: count }, (_, index) => ({
      postId: `post-${index + 1}`,
      ...generateMockContentAnalysis(quality)
    }))
  };
};

// Performance testing mocks
export const createSlowMockAIClient = (delayMs: number = 5000) => ({
  chat: {
    completions: {
      create: jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(mockOpenAIResponse), delayMs)
        )
      )
    }
  }
});

// Mock clean up utilities
export const resetAIMocks = () => {
  jest.clearAllMocks();
};

export const resetAIServiceMocks = (mocks: any[]) => {
  mocks.forEach(mock => {
    if (mock && typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
  });
};