---
title: "API Endpoints Reference"
description: "Complete API reference for the LinkedIn Comment Research Tool"
author: "Backend Engineering Team"
created: "2025-01-19"
last-updated: "2025-01-19"
version: "1.0.0"
status: "published"
audience: "developers, frontend engineers, integrators"
tags: ["api", "reference", "endpoints", "integration"]
---

# API Endpoints Reference

> Complete API documentation for the LinkedIn Comment Research Tool backend services

## 📋 Table of Contents

- [Authentication](#authentication)
- [LinkedIn Integration](#linkedin-integration)
- [User Management](#user-management)
- [Research & Analysis](#research--analysis)
- [Feedback System](#feedback-system)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## 🔐 Authentication

All API endpoints require authentication using JWT tokens unless otherwise specified.

### Authentication Flow

```typescript
// Login/Register returns JWT token
POST /api/auth/login
POST /api/auth/register

// Include token in subsequent requests
Headers: {
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### Authentication Endpoints

#### Register User
**Endpoint**: `POST /api/auth/register`  
**Purpose**: Create new user account  
**Authentication**: None required  

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt-token-string"
  }
}
```

#### User Login
**Endpoint**: `POST /api/auth/login`  
**Purpose**: Authenticate existing user  
**Authentication**: None required  

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt-token-string"
  }
}
```

#### Get Current User
**Endpoint**: `GET /api/auth/me`  
**Purpose**: Get current authenticated user details  
**Authentication**: JWT required  

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-01-19T10:30:00Z",
      "preferences": {
        "boostTerms": ["AI", "machine learning"],
        "downTerms": ["spam", "unrelated"]
      }
    }
  }
}
```

## 🔗 LinkedIn Integration

### Validate LinkedIn URL
**Endpoint**: `POST /api/linkedin/validate-url`  
**Purpose**: Validate LinkedIn post URL format  
**Authentication**: JWT required  

**Request Body**:
```json
{
  "url": "https://www.linkedin.com/posts/username_activity-123456789-abcd"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "postId": "123456789",
    "username": "username"
  }
}
```

### Extract Post Comments
**Endpoint**: `POST /api/linkedin/extract-comments`  
**Purpose**: Extract all comments from LinkedIn post  
**Authentication**: JWT required  

**Request Body**:
```json
{
  "postUrl": "https://www.linkedin.com/posts/username_activity-123456789-abcd",
  "pageNumber": 1,
  "sortOrder": "Most relevant"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Comments extracted successfully",
  "data": {
    "post": {
      "id": "123456789",
      "url": "https://www.linkedin.com/posts/username_activity-123456789-abcd",
      "author": {
        "name": "Post Author",
        "headline": "CEO at Company",
        "profileUrl": "https://www.linkedin.com/in/author"
      },
      "text": "Post content text...",
      "stats": {
        "totalReactions": 150,
        "comments": 25,
        "reposts": 10
      }
    },
    "comments": [
      {
        "commentId": "comment-id-1",
        "text": "Great post! Very insightful.",
        "author": {
          "name": "Commenter Name",
          "firstName": "First",
          "lastName": "Last",
          "headline": "Position at Company",
          "profileUrl": "https://www.linkedin.com/in/commenter",
          "profilePicture": "https://media.licdn.com/image-url"
        },
        "stats": {
          "totalReactions": 5,
          "replies": 2
        },
        "createdAt": {
          "timestamp": 1705123456789,
          "formatted": "2025-01-13 14:30:56",
          "relative": "2 days ago"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalComments": 25,
      "hasNextPage": false
    }
  }
}
```

### Research Individual Commenter
**Endpoint**: `GET /api/linkedin/commenter/:commenterId`  
**Purpose**: Get detailed research analysis for individual commenter  
**Authentication**: JWT required  

**Parameters**:
- `commenterId`: Unique identifier for commenter

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "commenter-id",
      "name": "Commenter Name",
      "headline": "Senior Developer at Tech Co",
      "location": "San Francisco, CA",
      "profileUrl": "https://www.linkedin.com/in/commenter",
      "profilePicture": "https://media.licdn.com/image-url",
      "connections": 500,
      "followers": 1200
    },
    "relevanceScore": {
      "overall": 8.5,
      "confidence": 0.85,
      "factors": [
        {
          "name": "Industry Alignment",
          "score": 9.0,
          "weight": 0.3,
          "reason": "Works in target technology sector"
        },
        {
          "name": "Recent Activity",
          "score": 8.0,
          "weight": 0.2,
          "reason": "Active posting about relevant topics"
        }
      ]
    },
    "recentPosts": [
      {
        "id": "post-1",
        "text": "Recent post content...",
        "url": "https://www.linkedin.com/posts/post-1",
        "createdAt": "2025-01-15T10:00:00Z",
        "stats": {
          "reactions": 45,
          "comments": 8
        }
      }
    ],
    "keywordMatches": {
      "boost": ["AI", "machine learning"],
      "down": [],
      "neutral": ["technology", "innovation"]
    },
    "researchedAt": "2025-01-19T10:30:00Z"
  }
}
```

## 🔍 Research & Analysis

### Analyze Relevance Score
**Endpoint**: `POST /api/analysis/relevance-score`  
**Purpose**: Calculate relevance score for commenter profile  
**Authentication**: JWT required  

**Request Body**:
```json
{
  "commenterId": "commenter-id",
  "profileData": {
    "headline": "Senior Developer at Tech Co",
    "posts": ["Post content 1", "Post content 2"],
    "profile": {
      "industry": "Technology",
      "location": "San Francisco"
    }
  },
  "userPreferences": {
    "boostTerms": ["AI", "machine learning"],
    "downTerms": ["spam"],
    "targetIndustries": ["Technology", "Software"]
  }
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "relevanceScore": 8.5,
    "confidence": 0.85,
    "breakdown": {
      "industryMatch": 9.0,
      "keywordRelevance": 8.0,
      "activityLevel": 8.5,
      "profileCompleteness": 9.2
    },
    "explanation": "High relevance due to strong industry alignment and keyword matches",
    "recommendations": [
      "Consider reaching out about AI collaboration",
      "High-quality prospect for technology partnerships"
    ]
  }
}
```

### Create Research Session
**Endpoint**: `POST /api/analysis/session`  
**Purpose**: Create new research session for LinkedIn post analysis  
**Authentication**: JWT required  

**Request Body**:
```json
{
  "linkedinPostUrl": "https://www.linkedin.com/posts/example",
  "sessionName": "Q1 Prospect Research",
  "settings": {
    "includeReplies": true,
    "minRelevanceScore": 6.0,
    "maxCommenters": 50
  }
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "status": "created",
    "postUrl": "https://www.linkedin.com/posts/example",
    "createdAt": "2025-01-19T10:30:00Z",
    "settings": {
      "includeReplies": true,
      "minRelevanceScore": 6.0,
      "maxCommenters": 50
    }
  }
}
```

### Get Research Session
**Endpoint**: `GET /api/analysis/session/:sessionId`  
**Purpose**: Get complete research session results  
**Authentication**: JWT required  

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "status": "completed",
    "postUrl": "https://www.linkedin.com/posts/example",
    "createdAt": "2025-01-19T10:30:00Z",
    "completedAt": "2025-01-19T10:35:00Z",
    "summary": {
      "totalCommenters": 25,
      "researchedCount": 25,
      "averageRelevanceScore": 7.2,
      "highValueProspects": 8
    },
    "commenters": [
      {
        "id": "commenter-1",
        "name": "John Doe",
        "headline": "CTO at StartupCo",
        "relevanceScore": 9.2,
        "status": "researched"
      }
    ]
  }
}
```

## 📝 Feedback System

### Submit Feedback
**Endpoint**: `POST /api/feedback`  
**Purpose**: Submit user feedback on relevance scoring  
**Authentication**: JWT required  

**Request Body**:
```json
{
  "type": "binary",
  "commenterId": "commenter-id",
  "sessionId": "session-id",
  "feedback": {
    "relevant": true,
    "confidence": 0.9,
    "notes": "Perfect match for our target audience"
  },
  "context": {
    "originalScore": 8.5,
    "scoringFactors": ["industry", "keywords", "activity"]
  }
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "feedbackId": "feedback-uuid",
    "impact": {
      "learningTriggered": true,
      "algorithmUpdate": "scheduled",
      "confidenceImprovement": 0.05
    }
  }
}
```

### Get Feedback Status
**Endpoint**: `GET /api/feedback/learning-status`  
**Purpose**: Get learning algorithm status and user's feedback impact  
**Authentication**: JWT required  

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "userStats": {
      "totalFeedback": 156,
      "accuracyImprovement": "12%",
      "lastContribution": "2025-01-19T09:15:00Z"
    },
    "systemLearning": {
      "currentAccuracy": 87.5,
      "improvementTrend": "+2.3% this week",
      "feedbackProcessed": 1247,
      "algorithmVersion": "v2.1.3"
    },
    "personalizedScoring": {
      "enabled": true,
      "adaptationStrength": 0.7,
      "recentLearnings": [
        "Increased weight for fintech experience",
        "Decreased emphasis on post frequency"
      ]
    }
  }
}
```

## ⚠️ Error Handling

### Standard Error Response Format
All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional context if available",
    "timestamp": "2025-01-19T10:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description | Resolution |
|-------------|------------|-------------|------------|
| 400 | `INVALID_REQUEST` | Request validation failed | Check request format and required fields |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication | Include valid JWT token in Authorization header |
| 403 | `FORBIDDEN` | Insufficient permissions | Verify user has required access level |
| 404 | `NOT_FOUND` | Resource not found | Verify resource ID and existence |
| 409 | `CONFLICT` | Resource already exists | Use different identifier or update existing |
| 422 | `VALIDATION_ERROR` | Input validation failed | Review input data format and constraints |
| 429 | `RATE_LIMITED` | Too many requests | Wait before retrying, respect rate limits |
| 500 | `INTERNAL_ERROR` | Server error | Contact support if persistent |

### LinkedIn API Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `LINKEDIN_URL_INVALID` | Invalid LinkedIn URL format | Provide valid LinkedIn post URL |
| `LINKEDIN_POST_NOT_FOUND` | Post not accessible or deleted | Verify post exists and is public |
| `LINKEDIN_API_LIMIT` | LinkedIn API rate limit exceeded | Wait before making more requests |
| `LINKEDIN_AUTH_FAILED` | LinkedIn API authentication failed | Check API credentials configuration |

## 🚦 Rate Limiting

### Rate Limits by Endpoint Category

| Category | Limit | Window | Applies To |
|----------|-------|--------|------------|
| **Authentication** | 20 requests | 15 minutes | Login, register attempts |
| **LinkedIn API** | 100 requests | 1 hour | Comment extraction, profile research |
| **Analysis** | 500 requests | 1 hour | Relevance scoring, research sessions |
| **Feedback** | 200 requests | 1 hour | Feedback submission and status |
| **General** | 1000 requests | 1 hour | All other endpoints |

### Rate Limit Headers
Every response includes rate limiting information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705123456
X-RateLimit-Window: 3600
```

### Handling Rate Limits
When rate limited (HTTP 429):

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": "Try again in 45 minutes",
    "retryAfter": 2700
  }
}
```

## 🔧 Development & Testing

### Health Check
**Endpoint**: `GET /api/health`  
**Purpose**: Check API service health  
**Authentication**: None required  

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-19T10:30:00Z",
    "version": "1.0.0",
    "services": {
      "database": "connected",
      "linkedin_api": "operational",
      "cache": "active"
    }
  }
}
```

### API Versioning
All endpoints are versioned and accessible at:
- **Current**: `/api/v1/*` (default, no version prefix needed)
- **Previous**: `/api/v0/*` (deprecated, will be removed)

## 📚 SDK & Integration Examples

### JavaScript/TypeScript Integration
```typescript
// SDK initialization
import { GrahamAPI } from '@graham/api-client';

const api = new GrahamAPI({
  baseUrl: 'https://api.graham-build.com',
  apiKey: 'your-api-key'
});

// Extract comments
const result = await api.linkedin.extractComments({
  postUrl: 'https://www.linkedin.com/posts/example',
  pageNumber: 1
});

// Research commenter
const research = await api.analysis.researchCommenter('commenter-id');

// Submit feedback
await api.feedback.submit({
  type: 'binary',
  commenterId: 'commenter-id',
  feedback: { relevant: true, confidence: 0.9 }
});
```

### Python Integration
```python
# pip install graham-api-client
from graham_api import GrahamAPI

api = GrahamAPI(api_key='your-api-key')

# Extract comments
comments = api.linkedin.extract_comments(
    post_url='https://www.linkedin.com/posts/example'
)

# Research commenter
research = api.analysis.research_commenter('commenter-id')

# Submit feedback
api.feedback.submit({
    'type': 'binary',
    'commenter_id': 'commenter-id',
    'feedback': {'relevant': True, 'confidence': 0.9}
})
```

## 📊 API Status & Monitoring

### Current API Metrics
- **Availability**: 99.9% uptime SLA
- **Response Time**: < 3 seconds average
- **Throughput**: 10,000+ requests/hour capacity
- **Success Rate**: 98.5% of requests successful

### Status Page
Monitor real-time API status at: `https://status.graham-build.com`

---

## 🔗 Related Documentation

- **[Authentication Guide](../05-development/authentication.md)**: Detailed auth implementation
- **[Database Schema](./database-schema.md)**: Data model reference
- **[System Architecture](./system-overview.md)**: Technical architecture overview
- **[Integration Examples](../05-development/integration-examples.md)**: Complete integration tutorials

---

**API Version**: 1.0.0  
**Last Updated**: 2025-01-19  
**Next Review**: 2025-02-19  
**Maintained By**: Backend Engineering Team

> This API documentation is automatically updated with each release. For the latest changes, see the [CHANGELOG](../CHANGELOG.md).