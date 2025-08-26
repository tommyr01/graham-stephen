# Technical Architecture Document: LinkedIn Comment Research Tool

## Executive Summary

### Project Overview

The LinkedIn Comment Research Tool is a web-based application that automates the manual process of researching LinkedIn post commenters for B2B sales, recruitment, and networking purposes. The system transforms hours of manual profile analysis into minutes of actionable insights through automated relevance scoring and intelligent post analysis.

**Core Value Proposition**: Reduce research time from 2-3 hours to 10-15 minutes per post while maintaining high relevance accuracy through machine learning feedback loops.

### Key Architectural Decisions

1. **Next.js 15 Full-Stack Architecture**: Leveraging the existing Next.js setup with App Router for unified frontend/backend development, enabling rapid iteration and deployment.

2. **Grey/Teal Dark Theme Integration**: Building upon the existing shadcn/ui theme system with custom grey/teal color palette and enhanced dark mode support.

3. **PostgreSQL + Redis Hybrid Storage**: PostgreSQL for structured user data and feedback, Redis for LinkedIn API response caching to manage rate limits effectively.

4. **Zustand State Management**: Lightweight state management solution optimal for the application's moderate complexity requirements.

5. **LinkedIn API Integration Strategy**: Direct integration with LinkedIn's post_comments_replies_stats and related endpoints, with comprehensive rate limiting and caching strategies.

### Technology Stack Summary

**Frontend Architecture**
- Framework: Next.js 15 with React 19 (App Router)
- UI Library: shadcn/ui with custom grey/teal theme
- Styling: Tailwind CSS v4 with CSS variables
- State Management: Zustand for application state
- Icons: Lucide React (existing setup)
- Theme System: next-themes with light/dark toggle

**Backend Architecture**  
- Runtime: Next.js API routes with Node.js
- API Architecture: RESTful endpoints with TypeScript
- Authentication: NextAuth.js with JWT strategy
- Validation: Zod schemas for type-safe validation
- Rate Limiting: Custom middleware with Redis backing

**Database and Storage**
- Primary Database: PostgreSQL for structured data
- Cache Layer: Redis for API responses and sessions
- File Storage: Local storage for temporary UI state
- Session Management: Redis-backed sessions

**Infrastructure Foundation**
- Deployment: Vercel for frontend and API routes
- Database Hosting: Railway or Supabase for PostgreSQL
- Cache Service: Upstash Redis for serverless caching
- Monitoring: Vercel Analytics and custom error tracking

### System Component Overview

**Core Components**
1. **URL Processor**: Validates and extracts LinkedIn post IDs from URLs
2. **Comment Extractor**: Interfaces with LinkedIn API to fetch comment data
3. **Profile Analyzer**: Retrieves and analyzes individual commenter profiles
4. **Scoring Engine**: Implements keyword-based relevance scoring algorithm
5. **Feedback Collector**: Captures user feedback for scoring improvement
6. **Session Manager**: Maintains research state and user preferences
7. **Cache Manager**: Optimizes API usage through intelligent caching

**Integration Boundaries**
- LinkedIn API gateway for all external data retrieval
- Database abstraction layer for data persistence
- Authentication middleware for secure API access
- Theme system integration for consistent UI experience

### Critical Technical Constraints and Assumptions

**LinkedIn API Limitations**
- Rate limit: 100 requests/hour per application
- Private profile restrictions may limit data availability
- API response format changes require adaptive parsing

**Performance Requirements**
- Page load time: <3 seconds on standard broadband
- Comment extraction: <10 seconds for 50+ comments
- Relevance analysis: <15 seconds per commenter
- Concurrent users: Support 10-50 simultaneous users initially

**Data Privacy Compliance**
- Minimal LinkedIn data retention (24-48 hours max)
- User consent for feedback collection
- GDPR compliance for EU users

## For Backend Engineers

### API Endpoint Specifications

#### Authentication Endpoints

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;        // Valid email format
  password: string;     // Min 8 characters, complexity requirements
  name: string;        // Display name, 2-100 characters
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  token: string;       // JWT token, expires in 7 days
}
```

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    lastLoginAt: string;
  };
  token: string;
  refreshToken: string;
}
```

#### LinkedIn Data Endpoints

```typescript
// POST /api/linkedin/extract-comments
interface ExtractCommentsRequest {
  postUrl: string;     // Full LinkedIn post URL
  maxComments?: number; // Default 100, max 500
}

// Based on actual LinkedIn API response structure
interface LinkedInAPIResponse {
  success: boolean;
  message: string;
  data: {
    post: {
      id: string;
      url: string;
    };
    comments: LinkedInComment[];
  };
}

interface LinkedInComment {
  comment_id: string;
  text: string;
  posted_at: {
    timestamp: number;
    date: string;
    relative: string;
  };
  is_edited: boolean;
  is_pinned: boolean;
  comment_url: string;
  author: {
    name: string;
    headline: string;
    profile_url: string;
    profile_picture: string | null;
  };
  stats: {
    total_reactions: number;
    reactions: {
      like: number;
      appreciation: number;
      empathy: number;
      interest: number;
      praise: number;
    };
    comments: number;
  };
  replies?: LinkedInComment[]; // Nested replies array
}

interface ExtractCommentsResponse {
  sessionId: string;   // Research session identifier
  post: {
    id: string;
    url: string;
  };
  comments: CommentData[];
  totalComments: number;
}

// Transformed interface for our application
interface CommentData {
  id: string;
  text: string;
  postedAt: {
    timestamp: number;
    date: string;
    relative: string;
  };
  isEdited: boolean;
  isPinned: boolean;
  commentUrl: string;
  author: {
    name: string;
    headline: string;
    profileUrl: string;
    profilePicture: string | null;
  };
  stats: {
    totalReactions: number;
    reactions: {
      like: number;
      appreciation: number;
      empathy: number;
      interest: number;
      praise: number;
    };
    commentsCount: number;
  };
  replies?: CommentData[]; // Nested replies using same structure
}
```

```typescript
// GET /api/linkedin/commenter/:commenterId
interface CommenterDetailsResponse {
  commenter: {
    id: string;
    name: string;
    headline: string;
    profileUrl: string;
    profilePicture: string;
    location: string;
    connectionDegree: number;
    company: {
      name: string;
      industry: string;
      size: string;
    };
    recentPosts: LinkedInPost[];
    lastUpdated: string;
  };
}

interface LinkedInPost {
  id: string;
  content: string;
  publishedAt: string;
  engagement: {
    likes: number;
    comments: number;
    reposts: number;
  };
  hashtags: string[];
  mentions: string[];
}
```

#### Research Analysis Endpoints

```typescript
// POST /api/analysis/relevance-score
interface RelevanceScoreRequest {
  commenterId: string;
  boostTerms: string[];    // Keywords that increase relevance
  downTerms: string[];     // Keywords that decrease relevance
  analysisDepth: 'basic' | 'detailed'; // Analysis thoroughness
}

interface RelevanceScoreResponse {
  score: number;           // 0-10 relevance score
  explanation: {
    matchedBoostTerms: TermMatch[];
    matchedDownTerms: TermMatch[];
    contentAnalysis: {
      businessRelevant: number;    // % of business-related content
      promotional: number;         // % of promotional content
      personal: number;           // % of personal content
    };
  };
  recommendations: string[]; // Suggested actions based on score
  confidence: number;        // Algorithm confidence 0-1
}

interface TermMatch {
  term: string;
  frequency: number;
  contexts: string[];      // Surrounding text snippets
  weight: number;         // Term importance weight
}
```

#### Feedback Collection Endpoints

```typescript
// POST /api/feedback
interface FeedbackRequest {
  sessionId: string;
  commenterId: string;
  relevanceScore: number;  // Original score 0-10
  userAssessment: 'relevant' | 'not_relevant' | 'partially_relevant';
  userScore?: number;      // User's score 0-10 (optional)
  notes?: string;         // Additional feedback text
  categories?: string[];   // Relevant business categories
}

interface FeedbackResponse {
  feedbackId: string;
  processed: boolean;
  impactOnFutureScoring: 'high' | 'medium' | 'low';
}
```

#### Voice Feedback Endpoints

```typescript
// POST /api/intelligence/feedback/voice?action=submit
interface VoiceFeedbackRequest {
  sessionId?: string;           // Research session identifier
  contextType: string;          // Context of feedback ('voice_feedback', etc.)
  transcript: string;           // Speech-to-text transcript
  confidence?: number;          // Recognition confidence (0-1)
  language: string;            // Language code (e.g., 'en-US')
  recordingDuration: number;    // Recording duration in seconds
  editedTranscript?: string;    // User-edited transcript (optional)
  voiceAnalysis?: Record<string, any>; // Voice analysis data
  contextData?: Record<string, any>;   // Additional context
  profileUrl?: string;          // Profile being researched
}

interface VoiceFeedbackResponse {
  success: boolean;
  data: {
    interactionId: string;      // Feedback interaction ID
    message: string;
    processingStatus: 'completed' | 'processing' | 'failed';
  };
}
```

```typescript
// POST /api/intelligence/feedback/voice?action=upload-audio
interface AudioUploadRequest {
  interactionId: string;        // Associated feedback interaction
  audioData: string;           // Base64 encoded audio data
  audioFormat: string;         // Audio format (e.g., 'audio/wav')
  audioDuration: number;       // Duration in seconds
  sampleRate?: number;         // Sample rate (default 44100)
  channels?: number;           // Audio channels (default 1)
}

interface AudioUploadResponse {
  success: boolean;
  data: {
    voiceRecordingId: string;   // Voice recording ID
    message: string;
    audioSize: number;          // Size in bytes
    duration: number;           // Duration in seconds
  };
}
```

```typescript
// POST /api/intelligence/feedback/voice?action=analytics
interface VoiceAnalyticsRequest {
  startDate?: string;          // ISO date string (default: 1 week ago)
  endDate?: string;           // ISO date string (default: now)
  userId?: string;            // User ID for user-specific analytics
  includeGlobal?: boolean;    // Include global analytics (default: false)
}

interface VoiceAnalyticsResponse {
  success: boolean;
  data: {
    timeRange: {
      start: string;
      end: string;
    };
    analytics: {
      total_voice_feedbacks: number;
      total_recording_time_minutes: number;
      average_recording_duration: number;
      successful_transcriptions: number;
      average_confidence: number;
      languages_used: string[];
      transcriptions_edited: number;
      voice_vs_text_ratio: number;
    };
    userStats: {
      total_voice_feedbacks: number;
      total_recording_minutes: number;
      average_confidence: number;
      preferred_language: string;
      voice_usage_trend: Array<{
        date: string;
        count: number;
      }>;
      quality_improvement: number;
    };
    recentFeedback: Array<{
      id: string;
      voice_transcript: string;
      voice_confidence: number;
      voice_language: string;
      voice_recording_duration: number;
      voice_edited: boolean;
      feedback_timestamp: string;
      context_data: Record<string, any>;
    }>;
    insights: Array<{
      type: string;
      title: string;
      description: string;
      score: number;
      category: string;
    }>;
  };
}
```

```typescript
// GET /api/intelligence/feedback/voice?action=capabilities
interface VoiceCapabilitiesResponse {
  success: boolean;
  data: {
    speechRecognitionSupported: boolean;
    supportedLanguages: string[];        // Supported language codes
    maxRecordingDuration: number;       // Maximum duration in seconds
    audioFormats: string[];             // Supported audio formats
    features: {
      realTimeTranscription: boolean;
      confidenceScoring: boolean;
      transcriptEditing: boolean;
      audioPlayback: boolean;
      multiLanguage: boolean;
    };
  };
}
```

### Voice Feedback Database Schema Extensions

```sql
-- Extensions to feedback_interactions table
ALTER TABLE feedback_interactions 
ADD COLUMN voice_transcript TEXT,
ADD COLUMN voice_confidence DECIMAL(3,2),
ADD COLUMN voice_language VARCHAR(10) DEFAULT 'en-US',
ADD COLUMN voice_recording_duration INTEGER DEFAULT 0,
ADD COLUMN voice_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN audio_data_url TEXT,
ADD COLUMN audio_blob_id UUID,
ADD COLUMN speech_recognition_used BOOLEAN DEFAULT FALSE;

-- Voice recordings table for audio storage
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_interaction_id UUID NOT NULL REFERENCES feedback_interactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Audio file information
    audio_blob BYTEA,                    -- Store small audio files directly
    audio_file_path TEXT,                -- Path for larger files stored on disk/cloud
    audio_format VARCHAR(20) DEFAULT 'audio/wav',
    audio_size_bytes INTEGER,
    audio_duration_ms INTEGER,
    
    -- Recording metadata
    sample_rate INTEGER DEFAULT 44100,
    channels INTEGER DEFAULT 1,
    recording_quality TEXT CHECK (recording_quality IN ('low', 'medium', 'high', 'lossless')),
    
    -- Processing information
    transcription_service VARCHAR(50) DEFAULT 'web_speech_api',
    transcription_confidence DECIMAL(3,2),
    transcription_language VARCHAR(10) DEFAULT 'en-US',
    original_transcript TEXT,
    edited_transcript TEXT,
    
    -- Voice analysis data
    voice_analysis JSONB DEFAULT '{}',   -- For future voice analytics
    speaking_rate DECIMAL(5,2),          -- Words per minute
    pause_analysis JSONB DEFAULT '{}',   -- Analysis of pauses and speech patterns
    sentiment_analysis JSONB DEFAULT '{}', -- Voice sentiment if analyzed
    
    -- Privacy and compliance
    is_processed BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    privacy_compliant BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Voice transcription jobs for async processing
CREATE TABLE voice_transcription_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_recording_id UUID NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    job_status TEXT DEFAULT 'pending' CHECK (job_status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'retrying'
    )),
    
    transcription_service VARCHAR(50) NOT NULL,
    service_config JSONB DEFAULT '{}',
    language_code VARCHAR(10) DEFAULT 'en-US',
    
    transcription_result TEXT,
    confidence_score DECIMAL(3,2),
    processing_error TEXT,
    service_response JSONB DEFAULT '{}',
    
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice analytics table
CREATE TABLE voice_feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type TEXT DEFAULT 'weekly' CHECK (metric_type IN ('daily', 'weekly', 'monthly')),
    
    -- Voice usage metrics
    total_voice_feedbacks INTEGER DEFAULT 0,
    total_recording_time_minutes DECIMAL(8,2) DEFAULT 0,
    average_recording_duration DECIMAL(6,2) DEFAULT 0,
    successful_transcriptions INTEGER DEFAULT 0,
    failed_transcriptions INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_transcription_confidence DECIMAL(3,2) DEFAULT 0,
    transcriptions_edited INTEGER DEFAULT 0,
    edit_percentage DECIMAL(4,3) DEFAULT 0,
    voice_vs_text_preference DECIMAL(4,3) DEFAULT 0,
    
    -- Language and accessibility
    languages_used TEXT[] DEFAULT '{}',
    primary_language VARCHAR(10) DEFAULT 'en-US',
    accessibility_usage BOOLEAN DEFAULT FALSE,
    
    -- User experience metrics
    user_satisfaction_voice DECIMAL(3,2),
    completion_rate DECIMAL(4,3) DEFAULT 0,
    retry_rate DECIMAL(4,3) DEFAULT 0,
    
    -- Performance metrics
    average_processing_time_ms INTEGER DEFAULT 0,
    transcription_accuracy_estimate DECIMAL(4,3) DEFAULT 0,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for voice feedback optimization
CREATE INDEX idx_feedback_interactions_voice_transcript ON feedback_interactions(voice_transcript) WHERE voice_transcript IS NOT NULL;
CREATE INDEX idx_feedback_interactions_speech_recognition ON feedback_interactions(speech_recognition_used) WHERE speech_recognition_used = TRUE;
CREATE INDEX idx_voice_recordings_feedback_id ON voice_recordings(feedback_interaction_id);
CREATE INDEX idx_voice_recordings_processing ON voice_recordings(is_processed) WHERE is_processed = FALSE;
CREATE INDEX idx_voice_transcription_jobs_status ON voice_transcription_jobs(job_status);
CREATE INDEX idx_voice_transcription_jobs_pending ON voice_transcription_jobs(created_at) WHERE job_status = 'pending';
```

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(20) DEFAULT 'free'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

#### Research Sessions Table
```sql
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_post_url TEXT NOT NULL,
  linkedin_post_id VARCHAR(50) NOT NULL,
  post_data JSONB NOT NULL,
  session_metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_sessions_user_id ON research_sessions(user_id);
CREATE INDEX idx_sessions_status ON research_sessions(status);
CREATE INDEX idx_sessions_linkedin_post_id ON research_sessions(linkedin_post_id);
```

#### Commenters Table  
```sql
CREATE TABLE commenters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  headline VARCHAR(500),
  profile_url TEXT,
  profile_data JSONB NOT NULL,
  last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cache_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commenters_linkedin_id ON commenters(linkedin_id);
CREATE INDEX idx_commenters_cache_expires ON commenters(cache_expires_at);
```

#### LinkedIn Comments Table
```sql
CREATE TABLE linkedin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  comment_id VARCHAR(100) NOT NULL, -- LinkedIn's comment_id
  text TEXT NOT NULL,
  posted_at_timestamp BIGINT NOT NULL,
  posted_at_date VARCHAR(50) NOT NULL,
  posted_at_relative VARCHAR(20) NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  comment_url TEXT NOT NULL,
  author_name VARCHAR(200) NOT NULL,
  author_headline VARCHAR(500),
  author_profile_url TEXT,
  author_profile_picture TEXT, -- Can be null
  stats_total_reactions INTEGER DEFAULT 0,
  stats_like INTEGER DEFAULT 0,
  stats_appreciation INTEGER DEFAULT 0,
  stats_empathy INTEGER DEFAULT 0,
  stats_interest INTEGER DEFAULT 0,
  stats_praise INTEGER DEFAULT 0,
  stats_comments_count INTEGER DEFAULT 0,
  parent_comment_id UUID NULL REFERENCES linkedin_comments(id), -- For nested replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_linkedin_comments_session_id ON linkedin_comments(session_id);
CREATE INDEX idx_linkedin_comments_comment_id ON linkedin_comments(comment_id);
CREATE INDEX idx_linkedin_comments_parent_id ON linkedin_comments(parent_comment_id);
CREATE INDEX idx_linkedin_comments_author_name ON linkedin_comments(author_name);
```

#### Analysis Results Table
```sql
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  commenter_id UUID NOT NULL REFERENCES commenters(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,1) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 10),
  analysis_data JSONB NOT NULL,
  algorithm_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, commenter_id)
);

CREATE INDEX idx_analysis_session_id ON analysis_results(session_id);
CREATE INDEX idx_analysis_commenter_id ON analysis_results(commenter_id);
CREATE INDEX idx_analysis_relevance_score ON analysis_results(relevance_score DESC);
```

#### User Feedback Table
```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_result_id UUID NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
  original_score DECIMAL(3,1) NOT NULL,
  user_assessment VARCHAR(20) NOT NULL CHECK (user_assessment IN ('relevant', 'not_relevant', 'partially_relevant')),
  user_score DECIMAL(3,1) CHECK (user_score >= 0 AND user_score <= 10),
  feedback_notes TEXT,
  categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_feedback_analysis_result_id ON user_feedback(analysis_result_id);
CREATE INDEX idx_feedback_user_assessment ON user_feedback(user_assessment);
```

### Business Logic Organization Patterns

#### Service Layer Architecture
```typescript
// services/LinkedInAPIService.ts
export class LinkedInAPIService {
  private rateLimiter: RateLimiter;
  private cache: CacheService;

  async extractComments(postUrl: string): Promise<ExtractCommentsResponse> {
    await this.rateLimiter.waitForCapacity();
    
    const cached = await this.cache.get(`comments:${postUrl}`);
    if (cached) return cached;

    const response = await this.fetchFromLinkedInAPI(postUrl);
    await this.cache.set(`comments:${postUrl}`, response, 3600); // 1 hour cache
    
    return response;
  }

  async getCommenterDetails(commenterId: string): Promise<CommenterDetailsResponse> {
    // Similar pattern with caching and rate limiting
  }
}

// services/RelevanceScoreService.ts
export class RelevanceScoreService {
  async calculateScore(request: RelevanceScoreRequest): Promise<RelevanceScoreResponse> {
    const commenterData = await this.getCommenterData(request.commenterId);
    const analysis = await this.analyzeContent(commenterData, request);
    
    return {
      score: this.computeScore(analysis),
      explanation: this.generateExplanation(analysis),
      recommendations: this.generateRecommendations(analysis),
      confidence: this.calculateConfidence(analysis)
    };
  }

  private computeScore(analysis: ContentAnalysis): number {
    // Weighted scoring algorithm based on boost/down terms and content analysis
  }
}
```

#### Repository Pattern
```typescript
// repositories/ResearchSessionRepository.ts
export class ResearchSessionRepository {
  constructor(private db: Database) {}

  async create(data: CreateSessionData): Promise<ResearchSession> {
    return this.db.query(
      'INSERT INTO research_sessions (user_id, linkedin_post_url, post_data) VALUES ($1, $2, $3) RETURNING *',
      [data.userId, data.postUrl, data.postData]
    );
  }

  async findByUserAndStatus(userId: string, status: string): Promise<ResearchSession[]> {
    return this.db.query(
      'SELECT * FROM research_sessions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
      [userId, status]
    );
  }
}
```

### Authentication and Authorization Implementation Guide

#### JWT Configuration
```typescript
// lib/auth.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: '7d',
  algorithm: 'HS256' as const,
  issuer: 'linkedin-research-tool',
  audience: 'linkedin-research-tool-users'
};

export async function generateToken(payload: TokenPayload): Promise<string> {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  return jwt.verify(token, jwtConfig.secret, {
    algorithms: [jwtConfig.algorithm],
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  }) as TokenPayload;
}
```

#### Authorization Middleware
```typescript
// middleware/auth.ts
export function authMiddleware(requiredRole?: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      const payload = await verifyToken(token);
      
      req.user = payload;
      
      if (requiredRole && !hasRole(payload, requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
```

### Error Handling and Validation Strategies

#### Global Error Handler
```typescript
// lib/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors
    });
  }

  // LinkedIn API specific errors
  if (error.message.includes('rate limit')) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making more requests.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 3600 // 1 hour
    });
  }

  // Fallback for unexpected errors
  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};
```

#### Input Validation
```typescript
// lib/validation.ts
export const linkedInPostUrlSchema = z.string()
  .url("Must be a valid URL")
  .regex(/linkedin\.com\/posts\//, "Must be a LinkedIn post URL")
  .transform(url => url.replace(/\?.*$/, '')); // Remove query parameters

export const relevanceScoreRequestSchema = z.object({
  commenterId: z.string().uuid("Invalid commenter ID"),
  boostTerms: z.array(z.string().min(2).max(50)).min(1).max(20),
  downTerms: z.array(z.string().min(2).max(50)).max(10),
  analysisDepth: z.enum(['basic', 'detailed']).default('basic')
});

export const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  commenterId: z.string().uuid(),
  relevanceScore: z.number().min(0).max(10),
  userAssessment: z.enum(['relevant', 'not_relevant', 'partially_relevant']),
  userScore: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
  categories: z.array(z.string().max(50)).max(5).optional()
});
```

## For Frontend Engineers

### Component Architecture and State Management

#### Next.js App Router Structure
```
app/
├── layout.tsx                 # Root layout with theme provider
├── page.tsx                   # Landing page
├── dashboard/
│   ├── layout.tsx            # Dashboard layout with navigation
│   ├── page.tsx              # Dashboard overview
│   └── research/
│       ├── page.tsx          # Research session list
│       └── [sessionId]/
│           └── page.tsx      # Individual research session
├── api/                      # API routes
│   ├── auth/
│   ├── linkedin/
│   ├── analysis/
│   └── feedback/
└── globals.css               # Extended with grey/teal theme
```

#### State Management with Zustand
```typescript
// stores/researchStore.ts
interface ResearchState {
  // Current session state
  currentSession: ResearchSession | null;
  comments: CommentData[];
  selectedCommenter: string | null;
  
  // Analysis state  
  analysisResults: Map<string, AnalysisResult>;
  loadingStates: Map<string, boolean>;
  
  // UI state
  expandedComments: Set<string>;
  viewMode: 'grid' | 'list';
  
  // Actions
  setCurrentSession: (session: ResearchSession) => void;
  addAnalysisResult: (commenterId: string, result: AnalysisResult) => void;
  toggleCommentExpanded: (commenterId: string) => void;
  setLoadingState: (commenterId: string, loading: boolean) => void;
  submitFeedback: (feedback: FeedbackData) => Promise<void>;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  currentSession: null,
  comments: [],
  selectedCommenter: null,
  analysisResults: new Map(),
  loadingStates: new Map(),
  expandedComments: new Set(),
  viewMode: 'grid',
  
  setCurrentSession: (session) => set({ currentSession: session }),
  
  addAnalysisResult: (commenterId, result) => 
    set((state) => ({
      analysisResults: new Map(state.analysisResults).set(commenterId, result)
    })),
    
  toggleCommentExpanded: (commenterId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedComments);
      if (newExpanded.has(commenterId)) {
        newExpanded.delete(commenterId);
      } else {
        newExpanded.add(commenterId);
      }
      return { expandedComments: newExpanded };
    }),
    
  setLoadingState: (commenterId, loading) =>
    set((state) => ({
      loadingStates: new Map(state.loadingStates).set(commenterId, loading)
    })),
    
  submitFeedback: async (feedback) => {
    await apiService.submitFeedback(feedback);
    // Update local state with feedback confirmation
  }
}));
```

#### Theme Integration with Grey/Teal Palette
```typescript
// lib/theme-config.ts
export const greyTealTheme = {
  light: {
    background: 'oklch(0.98 0.002 247)', // Very light grey with subtle teal tint
    foreground: 'oklch(0.15 0.004 247)', // Dark grey
    primary: 'oklch(0.42 0.08 180)',     // Teal primary
    'primary-foreground': 'oklch(0.98 0.002 180)',
    secondary: 'oklch(0.92 0.004 247)',  // Light grey
    'secondary-foreground': 'oklch(0.25 0.004 247)',
    accent: 'oklch(0.88 0.014 180)',     // Light teal accent
    'accent-foreground': 'oklch(0.25 0.014 180)',
    muted: 'oklch(0.94 0.002 247)',
    'muted-foreground': 'oklch(0.55 0.004 247)',
    border: 'oklch(0.89 0.002 247)',
    input: 'oklch(0.89 0.002 247)',
    ring: 'oklch(0.42 0.08 180)',
  },
  dark: {
    background: 'oklch(0.13 0.004 247)',  // Dark grey with teal undertone
    foreground: 'oklch(0.95 0.002 180)', // Light with teal hint
    primary: 'oklch(0.55 0.12 180)',      // Bright teal
    'primary-foreground': 'oklch(0.13 0.004 247)',
    secondary: 'oklch(0.22 0.004 247)',   // Medium dark grey
    'secondary-foreground': 'oklch(0.85 0.002 180)',
    accent: 'oklch(0.28 0.014 180)',      // Dark teal accent
    'accent-foreground': 'oklch(0.95 0.002 180)',
    muted: 'oklch(0.18 0.002 247)',
    'muted-foreground': 'oklch(0.65 0.004 247)',
    border: 'oklch(0.25 0.004 247)',
    input: 'oklch(0.25 0.004 247)',
    ring: 'oklch(0.55 0.12 180)',
  }
};
```

#### Core Components
```typescript
// components/research/PostUrlInput.tsx
export function PostUrlInput() {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { startNewSession } = useResearchStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    try {
      const session = await apiService.extractComments(url);
      startNewSession(session);
      router.push(`/dashboard/research/${session.sessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          LinkedIn Post URL
        </CardTitle>
        <CardDescription>
          Paste the URL of a LinkedIn post to analyze its commenters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://linkedin.com/posts/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-base"
              required
            />
            <p className="text-sm text-muted-foreground">
              Only public LinkedIn posts can be analyzed
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={isValidating || !url} 
            className="w-full"
          >
            {isValidating ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Extracting Comments...
              </>
            ) : (
              'Analyze Comments'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// components/research/CommenterCard.tsx
interface CommenterCardProps {
  comment: CommentData;
  analysisResult?: AnalysisResult;
  onResearch: (commenterId: string) => void;
  onFeedback: (feedback: FeedbackData) => void;
}

export function CommenterCard({ comment, analysisResult, onResearch, onFeedback }: CommenterCardProps) {
  const { isExpanded, toggleExpanded } = useCommenterCard(comment.id);
  const isLoading = useResearchStore(state => state.loadingStates.get(comment.id));

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={comment.author.profilePicture || undefined} />
            <AvatarFallback>{comment.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {comment.author.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {comment.author.headline}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {analysisResult && (
                  <RelevanceScoreBadge score={analysisResult.score} />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResearch(comment.author.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoaderIcon className="h-3 w-3 animate-spin" />
                  ) : (
                    'Research'
                  )}
                </Button>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm line-clamp-2">
                {comment.text}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{comment.postedAt.relative}</span>
                  <span>•</span>
                  <span>{comment.stats.totalReactions} reactions</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded()}
                  className="h-6 px-2 text-xs"
                >
                  {isExpanded ? 'Less' : 'More'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && analysisResult && (
          <div className="mt-4 pt-4 border-t">
            <AnalysisResultDisplay 
              result={analysisResult} 
              onFeedback={onFeedback}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// components/research/RelevanceScoreBadge.tsx
interface RelevanceScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RelevanceScoreBadge({ score, size = 'md' }: RelevanceScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (score >= 4) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      className={`${getScoreColor(score)} ${sizeClasses[size]} font-medium`}
      variant="secondary"
    >
      {score.toFixed(1)}
    </Badge>
  );
}

// components/feedback/VoiceFeedbackComponent.tsx
interface VoiceFeedbackComponentProps {
  userId: string;
  profileUrl?: string;
  contextType?: string;
  maxRecordingTime?: number;        // Default: 60 seconds
  autoStop?: boolean;              // Default: true
  showTranscriptEdit?: boolean;     // Default: true
  showPlayback?: boolean;          // Default: false
  onVoiceSubmitted?: (data: VoiceFeedbackData) => void;
  onTranscriptChange?: (transcript: string) => void;
  language?: string;               // Default: 'en-US'
  placeholder?: string;
  className?: string;
}

export function VoiceFeedbackComponent({
  userId,
  profileUrl,
  contextType = 'voice_feedback',
  maxRecordingTime = 60,
  autoStop = true,
  showTranscriptEdit = true,
  showPlayback = false,
  onVoiceSubmitted,
  onTranscriptChange,
  language = 'en-US',
  placeholder = "Click record to start speaking your feedback...",
  className = ""
}: VoiceFeedbackComponentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Web Speech API integration with fallback
  const startRecording = async () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Initialize speech recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      
      recognition.onresult = (event) => {
        // Process transcript results
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            setConfidence(event.results[i][0].confidence || 0.5);
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          onTranscriptChange?.(transcript + finalTranscript);
        }
      };
      
      recognition.start();
      setIsRecording(true);
    } else {
      setError('Voice recording not supported in this browser');
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            disabled={!!error}
          >
            {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          
          {isRecording && (
            <div className="flex items-center text-red-600">
              <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse mr-2" />
              <span className="text-sm">Recording...</span>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Live Transcript */}
        {transcript && (
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border-l-4 border-blue-400">
            <p className="text-sm text-blue-800 dark:text-blue-200">{transcript}</p>
            {confidence > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Confidence: {Math.round(confidence * 100)}%
              </p>
            )}
          </div>
        )}
        
        {/* Transcript Editor */}
        {showTranscriptEdit && transcript && (
          <Textarea
            placeholder="Edit the transcript above or add more details..."
            className="mt-3"
            rows={3}
          />
        )}
        
        {/* Submit Button */}
        {transcript && (
          <Button 
            onClick={() => onVoiceSubmitted?.({ 
              transcript, 
              confidence, 
              recordingDuration: 30, // Calculate actual duration
              language 
            })}
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Submit Voice Feedback
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// components/feedback/SmartFeedbackWidget.tsx (Enhanced with Voice)
interface SmartFeedbackWidgetProps {
  profileUrl?: string;
  userId?: string;
  contextData?: Record<string, any>;
  onFeedbackSubmitted?: (feedback: any) => void;
  minimizedByDefault?: boolean;
  triggerOnEvents?: ('scroll' | 'exit_intent' | 'time_threshold' | 'action_completion')[];
  enableVoiceRecording?: boolean;  // New: Enable voice capability
  voiceLanguage?: string;         // New: Voice recognition language
  onVoiceTranscript?: (transcript: string) => void; // New: Voice callback
}

export function SmartFeedbackWidget({
  profileUrl,
  userId,
  contextData = {},
  onFeedbackSubmitted,
  minimizedByDefault = true,
  triggerOnEvents = ['exit_intent', 'time_threshold'],
  enableVoiceRecording = true,     // Default: enabled
  voiceLanguage = 'en-US',
  onVoiceTranscript
}: SmartFeedbackWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  // Voice recording integration
  useEffect(() => {
    if (enableVoiceRecording && typeof window !== 'undefined') {
      const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsVoiceSupported(supported);
    }
  }, [enableVoiceRecording]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardContent className="p-4">
          {/* Voice Recording Section (when enabled and supported) */}
          {enableVoiceRecording && isVoiceSupported && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Record voice feedback:</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                >
                  {isRecording ? <Square className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
                  {isRecording ? 'Stop' : 'Record'}
                </Button>
                
                {isRecording && (
                  <div className="flex items-center text-red-500">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-1" />
                    <span className="text-xs">Listening...</span>
                  </div>
                )}
              </div>
              
              {voiceTranscript && (
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                  <p className="text-gray-700 dark:text-gray-300">{voiceTranscript}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Traditional text feedback */}
          <Textarea
            placeholder={voiceTranscript ? "Edit or add more thoughts (optional)" : "Share your feedback..."}
            className="text-sm resize-none"
            rows={2}
          />
          
          <Button 
            className="w-full mt-3" 
            size="sm"
            onClick={() => submitFeedback()}
          >
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Voice Feedback Integration Patterns

#### Web Speech API Integration
```typescript
// hooks/useVoiceRecording.ts
interface VoiceRecordingHook {
  isRecording: boolean;
  transcript: string;
  confidence: number;
  isSupported: boolean;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export function useVoiceRecording(language: string = 'en-US'): VoiceRecordingHook {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          let totalConfidence = 0;
          let finalResults = 0;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
              totalConfidence += event.results[i][0].confidence || 0.5;
              finalResults++;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
            setConfidence(finalResults > 0 ? totalConfidence / finalResults : 0.5);
          }
        };
        
        recognition.onerror = (event) => {
          setError(`Speech recognition error: ${event.error}`);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          if (isRecording) {
            // Restart if still recording (for continuous recording)
            try {
              recognition.start();
            } catch (error) {
              setIsRecording(false);
            }
          }
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, isRecording]);

  const startRecording = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Voice recording not supported');
      return;
    }
    
    setError(null);
    setTranscript('');
    setConfidence(0);
    setIsRecording(true);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      setError('Failed to start recording');
      setIsRecording(false);
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isRecording,
    transcript,
    confidence,
    isSupported,
    error,
    startRecording,
    stopRecording,
    clearTranscript
  };
}
```

#### Voice Feedback API Integration
```typescript
// lib/voiceApiService.ts
export class VoiceApiService extends APIService {
  async submitVoiceFeedback(data: VoiceFeedbackData): Promise<VoiceFeedbackResponse> {
    return this.post('/api/intelligence/feedback/voice?action=submit', data);
  }

  async uploadAudio(interactionId: string, audioBlob: Blob): Promise<AudioUploadResponse> {
    const audioData = await this.blobToBase64(audioBlob);
    
    return this.post('/api/intelligence/feedback/voice?action=upload-audio', {
      interactionId,
      audioData,
      audioFormat: audioBlob.type,
      audioDuration: await this.getAudioDuration(audioBlob)
    });
  }

  async getVoiceAnalytics(params: VoiceAnalyticsRequest): Promise<VoiceAnalyticsResponse> {
    return this.post('/api/intelligence/feedback/voice?action=analytics', params);
  }

  async getVoiceCapabilities(): Promise<VoiceCapabilitiesResponse> {
    return this.get('/api/intelligence/feedback/voice?action=capabilities');
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]); // Remove data URL prefix
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0); // Default duration on error
      };
      
      audio.src = url;
    });
  }
}
```

### API Integration Patterns and Error Handling

#### API Service Layer
```typescript
// lib/apiService.ts
class APIService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  private async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error || 'Request failed',
          response.status,
          errorData.code || 'UNKNOWN_ERROR',
          errorData.details
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      
      // Network or parsing errors
      throw new APIError(
        'Network error or server unavailable',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async extractComments(postUrl: string): Promise<ExtractCommentsResponse> {
    return this.request('/linkedin/extract-comments', {
      method: 'POST',
      body: JSON.stringify({ postUrl })
    });
  }

  async getCommenterDetails(commenterId: string): Promise<CommenterDetailsResponse> {
    return this.request(`/linkedin/commenter/${commenterId}`);
  }

  async calculateRelevanceScore(request: RelevanceScoreRequest): Promise<RelevanceScoreResponse> {
    return this.request('/analysis/relevance-score', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async submitFeedback(feedback: FeedbackRequest): Promise<FeedbackResponse> {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback)
    });
  }
}

export const apiService = new APIService();

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

#### Error Boundary Component
```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ComponentType<ErrorBoundaryState> },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
    
    this.setState({ errorInfo: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent {...this.state} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, errorInfo }: ErrorBoundaryState) {
  return (
    <Card className="p-6 max-w-lg mx-auto mt-8">
      <CardContent className="text-center space-y-4">
        <div className="text-destructive">
          <AlertTriangleIcon className="h-12 w-12 mx-auto mb-2" />
          <h2 className="text-lg font-semibold">Something went wrong</h2>
        </div>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Refresh Page
        </Button>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mt-4">
            <summary className="text-sm font-medium cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="text-xs bg-muted p-2 rounded mt-2 whitespace-pre-wrap">
              {error.toString()}
              {errorInfo}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
```

### Routing and Navigation Architecture

#### App Router Configuration  
```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        fontSans.variable
      )}>
        <ThemeProvider>
          <ErrorBoundary>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">
                {children}
              </main>
              <SiteFooter />
            </div>
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <DashboardNav />
        </aside>
        <main className="lg:col-span-3">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
```

#### Navigation Components
```typescript
// components/DashboardNav.tsx
const navItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    title: 'Research Sessions',
    href: '/dashboard/research',
    icon: SearchIcon,
  },
  {
    title: 'Feedback History',
    href: '/dashboard/feedback',
    icon: MessageSquareIcon,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: SettingsIcon,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
```

### Performance Optimization Strategies

#### React Query Integration
```typescript
// lib/queries.ts
export function useExtractComments(postUrl: string | null) {
  return useQuery({
    queryKey: ['extract-comments', postUrl],
    queryFn: () => postUrl ? apiService.extractComments(postUrl) : null,
    enabled: !!postUrl,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: (failureCount, error) => {
      if (error instanceof APIError && error.statusCode === 429) {
        return failureCount < 1; // Only retry once for rate limiting
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCommenterDetails(commenterId: string | null) {
  return useQuery({
    queryKey: ['commenter-details', commenterId],
    queryFn: () => commenterId ? apiService.getCommenterDetails(commenterId) : null,
    enabled: !!commenterId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

export function useRelevanceScore(request: RelevanceScoreRequest | null) {
  return useQuery({
    queryKey: ['relevance-score', request],
    queryFn: () => request ? apiService.calculateRelevanceScore(request) : null,
    enabled: !!request,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
```

#### Component Optimization
```typescript
// hooks/useVirtualizedList.ts
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}

// components/VirtualizedCommenterList.tsx
export function VirtualizedCommenterList({ comments }: { comments: CommentData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const itemHeight = 120; // Fixed height per commenter card
  
  const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualizedList(
    comments,
    itemHeight,
    containerHeight
  );
  
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="h-full overflow-auto"
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((comment, index) => (
            <div 
              key={comment.id}
              style={{ height: itemHeight }}
              className="mb-2"
            >
              <CommenterCard comment={comment} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Build and Development Setup Requirements

#### Next.js Configuration
```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    domains: ['media.licdn.com', 'media.licdn.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    LINKEDIN_API_KEY: process.env.LINKEDIN_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@radix-ui/react-icons': '@radix-ui/react-icons/dist/index.js',
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/linkedin/:path*',
        destination: '/api/linkedin/:path*',
      },
    ];
  },
};

export default nextConfig;
```

#### Development Scripts
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test"
  }
}
```

## For QA Engineers

### Testable Component Boundaries and Interfaces

#### API Endpoint Testing
```typescript
// tests/api/linkedin.test.ts
describe('/api/linkedin/extract-comments', () => {
  it('should extract comments from valid LinkedIn post URL', async () => {
    const mockPostData = createMockLinkedInPost();
    mockLinkedInAPI.mockResolvedValue(mockPostData);
    
    const response = await request(app)
      .post('/api/linkedin/extract-comments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ postUrl: 'https://linkedin.com/posts/valid-post' })
      .expect(200);
      
    expect(response.body).toMatchObject({
      sessionId: expect.any(String),
      post: expect.objectContaining({
        id: expect.any(String),
        author: expect.objectContaining({
          name: expect.any(String),
          profileUrl: expect.any(String)
        })
      }),
      comments: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          author: expect.objectContaining({
            name: expect.any(String),
            headline: expect.any(String)
          }),
          content: expect.any(String)
        })
      ])
    });
  });

  it('should reject invalid LinkedIn URLs', async () => {
    const response = await request(app)
      .post('/api/linkedin/extract-comments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ postUrl: 'https://invalid-url.com' })
      .expect(400);
      
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.error).toContain('Must be a LinkedIn post URL');
  });

  it('should handle rate limiting gracefully', async () => {
    mockLinkedInAPI.mockRejectedValue(new Error('rate limit'));
    
    const response = await request(app)
      .post('/api/linkedin/extract-comments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ postUrl: 'https://linkedin.com/posts/valid-post' })
      .expect(429);
      
    expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(response.body.retryAfter).toBe(3600);
  });

  it('should handle private or restricted posts', async () => {
    mockLinkedInAPI.mockRejectedValue(new Error('access denied'));
    
    const response = await request(app)
      .post('/api/linkedin/extract-comments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ postUrl: 'https://linkedin.com/posts/private-post' })
      .expect(403);
      
    expect(response.body.code).toBe('ACCESS_DENIED');
  });
});

describe('/api/analysis/relevance-score', () => {
  it('should calculate relevance score with boost terms', async () => {
    const mockCommenterData = createMockCommenterData({
      recentPosts: [
        { content: 'AI and machine learning trends in 2024' },
        { content: 'Building scalable SaaS applications' }
      ]
    });
    
    const response = await request(app)
      .post('/api/analysis/relevance-score')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        commenterId: 'test-commenter-id',
        boostTerms: ['AI', 'machine learning', 'SaaS'],
        downTerms: ['personal', 'vacation'],
        analysisDepth: 'detailed'
      })
      .expect(200);
      
    expect(response.body).toMatchObject({
      score: expect.any(Number),
      explanation: expect.objectContaining({
        matchedBoostTerms: expect.arrayContaining([
          expect.objectContaining({
            term: expect.any(String),
            frequency: expect.any(Number),
            contexts: expect.any(Array)
          })
        ])
      }),
      confidence: expect.any(Number)
    });
    
    expect(response.body.score).toBeGreaterThanOrEqual(0);
    expect(response.body.score).toBeLessThanOrEqual(10);
  });

  it('should handle missing commenter data', async () => {
    const response = await request(app)
      .post('/api/analysis/relevance-score')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        commenterId: 'non-existent-commenter',
        boostTerms: ['test'],
        downTerms: [],
        analysisDepth: 'basic'
      })
      .expect(404);
      
    expect(response.body.code).toBe('COMMENTER_NOT_FOUND');
  });
});
```

#### Frontend Component Testing
```typescript
// components/__tests__/CommenterCard.test.tsx
describe('CommenterCard', () => {
  const mockComment = createMockCommentData();
  const mockOnResearch = jest.fn();
  const mockOnFeedback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders commenter information correctly', () => {
    render(
      <CommenterCard 
        comment={mockComment}
        onResearch={mockOnResearch}
        onFeedback={mockOnFeedback}
      />
    );
    
    expect(screen.getByText(mockComment.author.name)).toBeInTheDocument();
    expect(screen.getByText(mockComment.author.headline)).toBeInTheDocument();
    expect(screen.getByText(mockComment.text)).toBeInTheDocument();
  });

  it('shows research button and handles click', async () => {
    const user = userEvent.setup();
    
    render(
      <CommenterCard 
        comment={mockComment}
        onResearch={mockOnResearch}
        onFeedback={mockOnFeedback}
      />
    );
    
    const researchButton = screen.getByRole('button', { name: /research/i });
    await user.click(researchButton);
    
    expect(mockOnResearch).toHaveBeenCalledWith(mockComment.id);
  });

  it('displays relevance score when analysis result provided', () => {
    const analysisResult = createMockAnalysisResult({ score: 8.5 });
    
    render(
      <CommenterCard 
        comment={mockComment}
        analysisResult={analysisResult}
        onResearch={mockOnResearch}
        onFeedback={mockOnFeedback}
      />
    );
    
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('shows loading state during research', () => {
    // Mock loading state in store
    useResearchStore.mockReturnValue({
      loadingStates: new Map([[mockComment.id, true]])
    });
    
    render(
      <CommenterCard 
        comment={mockComment}
        onResearch={mockOnResearch}
        onFeedback={mockOnFeedback}
      />
    );
    
    expect(screen.getByRole('button', { name: /research/i })).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('expands to show analysis details', async () => {
    const user = userEvent.setup();
    const analysisResult = createMockAnalysisResult({
      explanation: {
        matchedBoostTerms: [{ term: 'AI', frequency: 3, contexts: ['AI research'] }]
      }
    });
    
    render(
      <CommenterCard 
        comment={mockComment}
        analysisResult={analysisResult}
        onResearch={mockOnResearch}
        onFeedback={mockOnFeedback}
      />
    );
    
    const moreButton = screen.getByRole('button', { name: /more/i });
    await user.click(moreButton);
    
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('AI research')).toBeInTheDocument();
  });
});

// components/__tests__/PostUrlInput.test.tsx
describe('PostUrlInput', () => {
  const mockStartNewSession = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useResearchStore.mockReturnValue({
      startNewSession: mockStartNewSession
    });
  });

  it('validates LinkedIn URL format', async () => {
    const user = userEvent.setup();
    
    render(<PostUrlInput />);
    
    const input = screen.getByPlaceholderText(/linkedin.com\/posts/);
    const submitButton = screen.getByRole('button', { name: /analyze comments/i });
    
    await user.type(input, 'https://invalid-url.com');
    await user.click(submitButton);
    
    expect(screen.getByText(/must be a linkedin post url/i)).toBeInTheDocument();
  });

  it('submits valid URL and navigates to research page', async () => {
    const user = userEvent.setup();
    const mockPush = jest.fn();
    
    useRouter.mockReturnValue({ push: mockPush });
    apiService.extractComments.mockResolvedValue({
      sessionId: 'test-session-id'
    });
    
    render(<PostUrlInput />);
    
    const input = screen.getByPlaceholderText(/linkedin.com\/posts/);
    const submitButton = screen.getByRole('button', { name: /analyze comments/i });
    
    await user.type(input, 'https://linkedin.com/posts/valid-post');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockStartNewSession).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard/research/test-session-id');
    });
  });

  it('shows loading state during comment extraction', async () => {
    const user = userEvent.setup();
    
    apiService.extractComments.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<PostUrlInput />);
    
    const input = screen.getByPlaceholderText(/linkedin.com\/posts/);
    const submitButton = screen.getByRole('button', { name: /analyze comments/i });
    
    await user.type(input, 'https://linkedin.com/posts/valid-post');
    await user.click(submitButton);
    
    expect(screen.getByText(/extracting comments/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
```

### Data Validation Requirements and Edge Cases

#### Input Validation Test Cases
```typescript
describe('Input Validation', () => {
  describe('LinkedIn URL Validation', () => {
    const validUrls = [
      'https://linkedin.com/posts/john-doe-123_activity-456',
      'https://www.linkedin.com/posts/company_activity-789',
      'https://linkedin.com/posts/activity-abc123',
    ];
    
    const invalidUrls = [
      'https://facebook.com/posts/123',
      'https://linkedin.com/profile/john-doe',
      'https://linkedin.com/company/123',
      'not-a-url',
      '',
      'https://linkedin.com/feed',
      'https://linkedin.com/posts/', // Missing post ID
    ];
    
    test.each(validUrls)('should accept valid URL: %s', (url) => {
      const result = linkedInPostUrlSchema.safeParse(url);
      expect(result.success).toBe(true);
    });
    
    test.each(invalidUrls)('should reject invalid URL: %s', (url) => {
      const result = linkedInPostUrlSchema.safeParse(url);
      expect(result.success).toBe(false);
    });
  });

  describe('Relevance Score Request Validation', () => {
    it('should validate boost terms array', () => {
      const validRequest = {
        commenterId: '550e8400-e29b-41d4-a716-446655440000',
        boostTerms: ['AI', 'machine learning', 'SaaS'],
        downTerms: ['personal'],
        analysisDepth: 'detailed' as const
      };
      
      const result = relevanceScoreRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
    
    it('should reject empty boost terms', () => {
      const invalidRequest = {
        commenterId: '550e8400-e29b-41d4-a716-446655440000',
        boostTerms: [],
        downTerms: ['personal'],
        analysisDepth: 'basic' as const
      };
      
      const result = relevanceScoreRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['boostTerms']);
    });
    
    it('should reject too many boost terms', () => {
      const invalidRequest = {
        commenterId: '550e8400-e29b-41d4-a716-446655440000',
        boostTerms: Array(25).fill('term'), // Max is 20
        downTerms: [],
        analysisDepth: 'basic' as const
      };
      
      const result = relevanceScoreRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid commenter ID format', () => {
      const invalidRequest = {
        commenterId: 'not-a-uuid',
        boostTerms: ['AI'],
        downTerms: [],
        analysisDepth: 'basic' as const
      };
      
      const result = relevanceScoreRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Feedback Validation', () => {
    it('should validate complete feedback', () => {
      const validFeedback = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        commenterId: '550e8400-e29b-41d4-a716-446655440001',
        relevanceScore: 7.5,
        userAssessment: 'relevant' as const,
        userScore: 8,
        notes: 'Great candidate for our SaaS product',
        categories: ['B2B SaaS', 'Technology']
      };
      
      const result = feedbackSchema.safeParse(validFeedback);
      expect(result.success).toBe(true);
    });
    
    it('should validate minimal feedback', () => {
      const minimalFeedback = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        commenterId: '550e8400-e29b-41d4-a716-446655440001',
        relevanceScore: 5.0,
        userAssessment: 'not_relevant' as const
      };
      
      const result = feedbackSchema.safeParse(minimalFeedback);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid user assessment', () => {
      const invalidFeedback = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        commenterId: '550e8400-e29b-41d4-a716-446655440001',
        relevanceScore: 5.0,
        userAssessment: 'maybe' // Invalid value
      };
      
      const result = feedbackSchema.safeParse(invalidFeedback);
      expect(result.success).toBe(false);
    });
  });
});
```

#### Edge Case Testing Scenarios
```typescript
describe('Edge Case Testing', () => {
  describe('LinkedIn API Edge Cases', () => {
    it('should handle posts with no comments', async () => {
      mockLinkedInAPI.mockResolvedValue({
        post: createMockPost(),
        comments: [],
        totalComments: 0
      });
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: 'https://linkedin.com/posts/empty-post' })
        .expect(200);
        
      expect(response.body.comments).toEqual([]);
      expect(response.body.totalComments).toBe(0);
    });
    
    it('should handle posts with 500+ comments (pagination)', async () => {
      const mockComments = Array(500).fill(null).map((_, i) => 
        createMockComment({ id: `comment-${i}` })
      );
      
      mockLinkedInAPI.mockResolvedValue({
        post: createMockPost(),
        comments: mockComments.slice(0, 100),
        totalComments: 500,
        hasMore: true,
        nextCursor: 'cursor-100'
      });
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ 
          postUrl: 'https://linkedin.com/posts/large-post',
          maxComments: 100 
        })
        .expect(200);
        
      expect(response.body.comments).toHaveLength(100);
      expect(response.body.hasMore).toBe(true);
      expect(response.body.nextCursor).toBe('cursor-100');
    });
    
    it('should handle deleted or private commenter profiles', async () => {
      const mockComment = createMockComment({
        author: {
          id: 'deleted-user',
          name: 'LinkedIn User',
          profileUrl: null,
          headline: null,
          profilePicture: '/default-avatar.png'
        }
      });
      
      const response = await request(app)
        .get('/api/linkedin/commenter/deleted-user')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
        
      expect(response.body.code).toBe('PROFILE_NOT_ACCESSIBLE');
    });
    
    it('should handle non-English content in posts', async () => {
      const mockCommenterData = createMockCommenterData({
        recentPosts: [
          { content: 'これは日本語のポストです' },
          { content: 'Este es un post en español' },
          { content: 'Ceci est un post en français' }
        ]
      });
      
      const response = await request(app)
        .post('/api/analysis/relevance-score')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          commenterId: 'international-user',
          boostTerms: ['business', 'technology'],
          downTerms: [],
          analysisDepth: 'detailed'
        })
        .expect(200);
        
      // Should still return a score, even if lower due to language mismatch
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.explanation.contentAnalysis).toBeDefined();
    });
  });
  
  describe('Rate Limiting Edge Cases', () => {
    it('should queue requests when rate limit is approached', async () => {
      // Simulate 99 requests already made this hour
      await setRateLimitCount('test-user', 99);
      
      const promises = [1, 2, 3].map(i => 
        request(app)
          .post('/api/linkedin/extract-comments')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ postUrl: `https://linkedin.com/posts/test-${i}` })
      );
      
      const responses = await Promise.all(promises);
      
      // First request should succeed
      expect(responses[0].status).toBe(200);
      
      // Subsequent requests should be rate limited
      expect(responses[1].status).toBe(429);
      expect(responses[2].status).toBe(429);
    });
    
    it('should reset rate limit after time window', async () => {
      await setRateLimitCount('test-user', 100);
      
      // Fast forward time by 1 hour
      jest.advanceTimersByTime(60 * 60 * 1000);
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: 'https://linkedin.com/posts/test-after-reset' })
        .expect(200);
        
      expect(response.body.sessionId).toBeDefined();
    });
  });
  
  describe('Data Integrity Edge Cases', () => {
    it('should handle malformed LinkedIn API responses', async () => {
      mockLinkedInAPI.mockResolvedValue({
        // Missing required fields
        post: { id: 'test' },
        comments: [{ id: 'comment1' }] // Missing author data
      });
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: 'https://linkedin.com/posts/malformed' })
        .expect(500);
        
      expect(response.body.code).toBe('DATA_PROCESSING_ERROR');
    });
    
    it('should handle extremely long comment content', async () => {
      const longContent = 'x'.repeat(10000); // Very long comment
      const mockComment = createMockComment({ content: longContent });
      
      const response = await request(app)
        .post('/api/analysis/relevance-score')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          commenterId: 'long-content-user',
          boostTerms: ['test'],
          downTerms: [],
          analysisDepth: 'detailed'
        })
        .expect(200);
        
      // Should handle gracefully, potentially truncating content
      expect(response.body.score).toBeDefined();
    });
  });
});
```

### Integration Points Requiring Testing

#### LinkedIn API Integration Tests
```typescript
describe('LinkedIn API Integration', () => {
  describe('Real API Testing (with test credentials)', () => {
    // These tests run against LinkedIn's test environment
    it('should successfully fetch comments from test post', async () => {
      const testPostUrl = 'https://linkedin.com/posts/test-account_test-post';
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: testPostUrl });
        
      expect(response.status).toBe(200);
      expect(response.body.post).toBeDefined();
      expect(response.body.comments).toBeDefined();
    }, 30000); // Longer timeout for real API calls
    
    it('should handle API authentication errors', async () => {
      // Temporarily use invalid API key
      process.env.LINKEDIN_API_KEY = 'invalid-key';
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: 'https://linkedin.com/posts/test' });
        
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('LINKEDIN_AUTH_ERROR');
      
      // Restore valid key
      process.env.LINKEDIN_API_KEY = validApiKey;
    });
  });
  
  describe('Cache Integration Tests', () => {
    it('should cache LinkedIn API responses', async () => {
      const testUrl = 'https://linkedin.com/posts/cache-test';
      
      // First request should hit the API
      const response1 = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: testUrl });
        
      // Second request should use cache
      const startTime = Date.now();
      const response2 = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: testUrl });
      const endTime = Date.now();
        
      expect(response2.status).toBe(200);
      expect(response2.body).toEqual(response1.body);
      expect(endTime - startTime).toBeLessThan(100); // Should be much faster
    });
    
    it('should invalidate cache after expiration', async () => {
      const testUrl = 'https://linkedin.com/posts/expiry-test';
      
      // Make initial request
      await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: testUrl });
        
      // Fast forward past cache expiration
      jest.advanceTimersByTime(60 * 60 * 1000 + 1000); // 1 hour + 1 second
      
      // Next request should hit API again
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: testUrl });
        
      expect(response.status).toBe(200);
      // Verify fresh data by checking timestamp or other indicators
    });
  });
});
```

### Performance Benchmarks and Quality Metrics

#### Performance Testing
```typescript
describe('Performance Benchmarks', () => {
  describe('API Response Times', () => {
    it('should extract comments within 10 seconds for 50+ comment posts', async () => {
      const largePostUrl = 'https://linkedin.com/posts/large-test-post';
      
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: largePostUrl });
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(response.body.comments.length).toBeGreaterThanOrEqual(50);
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });
    
    it('should calculate relevance score within 15 seconds', async () => {
      const commenterId = 'active-user-with-many-posts';
      
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/analysis/relevance-score')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          commenterId,
          boostTerms: ['AI', 'SaaS', 'B2B', 'enterprise'],
          downTerms: ['personal', 'vacation'],
          analysisDepth: 'detailed'
        });
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(15000); // 15 seconds
    });
    
    it('should handle concurrent users efficiently', async () => {
      const numberOfConcurrentUsers = 10;
      const promises = Array(numberOfConcurrentUsers).fill(null).map((_, i) => 
        request(app)
          .post('/api/linkedin/extract-comments')
          .set('Authorization', `Bearer ${generateTestToken(i)}`)
          .send({ postUrl: `https://linkedin.com/posts/concurrent-test-${i}` })
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should complete successfully
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status); // 200 or rate limited
      });
      
      // Total time should not exceed 30 seconds for 10 concurrent requests
      expect(endTime - startTime).toBeLessThan(30000);
    });
  });
  
  describe('Memory and CPU Usage', () => {
    it('should maintain reasonable memory usage with large datasets', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process multiple large posts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/linkedin/extract-comments')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ postUrl: `https://linkedin.com/posts/large-post-${i}` });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
    
    it('should efficiently process large numbers of commenters', async () => {
      const sessionWith200Commenters = await createTestSessionWithCommenters(200);
      
      const startTime = Date.now();
      const scores = await Promise.all(
        sessionWith200Commenters.commenters.map(commenter =>
          request(app)
            .post('/api/analysis/relevance-score')
            .set('Authorization', `Bearer ${validToken}`)
            .send({
              commenterId: commenter.id,
              boostTerms: ['business'],
              downTerms: [],
              analysisDepth: 'basic'
            })
        )
      );
      const endTime = Date.now();
      
      // All scores should be calculated successfully
      scores.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within reasonable time (5 minutes for 200 users)
      expect(endTime - startTime).toBeLessThan(300000);
    });
  });
  
  describe('Database Performance', () => {
    it('should handle high-frequency feedback submissions', async () => {
      const feedbackSubmissions = Array(100).fill(null).map((_, i) => ({
        sessionId: testSessionId,
        commenterId: `commenter-${i}`,
        relevanceScore: Math.random() * 10,
        userAssessment: ['relevant', 'not_relevant', 'partially_relevant'][i % 3]
      }));
      
      const startTime = Date.now();
      const responses = await Promise.all(
        feedbackSubmissions.map(feedback =>
          request(app)
            .post('/api/feedback')
            .set('Authorization', `Bearer ${validToken}`)
            .send(feedback)
        )
      );
      const endTime = Date.now();
      
      // All submissions should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});
```

### Security Testing Considerations

#### Authentication and Authorization Tests
```typescript
describe('Security Testing', () => {
  describe('Authentication Security', () => {
    it('should reject requests without valid JWT token', async () => {
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .send({ postUrl: 'https://linkedin.com/posts/test' })
        .expect(401);
        
      expect(response.body.code).toBe('MISSING_TOKEN');
    });
    
    it('should reject expired JWT tokens', async () => {
      const expiredToken = generateExpiredToken();
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ postUrl: 'https://linkedin.com/posts/test' })
        .expect(401);
        
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });
    
    it('should reject tampered JWT tokens', async () => {
      const validToken = generateTestToken();
      const tamperedToken = validToken.slice(0, -10) + 'tampered123';
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .send({ postUrl: 'https://linkedin.com/posts/test' })
        .expect(401);
        
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
    
    it('should prevent access to other users\' data', async () => {
      const user1Token = generateTestToken('user1');
      const user2Token = generateTestToken('user2');
      
      // User 1 creates a session
      const sessionResponse = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ postUrl: 'https://linkedin.com/posts/user1-test' });
      
      const sessionId = sessionResponse.body.sessionId;
      
      // User 2 tries to access User 1's session
      const unauthorizedResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
        
      expect(unauthorizedResponse.body.code).toBe('ACCESS_DENIED');
    });
  });
  
  describe('Input Security', () => {
    it('should sanitize LinkedIn URLs to prevent XSS', async () => {
      const maliciousUrl = 'https://linkedin.com/posts/test<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: maliciousUrl })
        .expect(400);
        
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
    
    it('should prevent SQL injection in feedback notes', async () => {
      const maliciousNotes = "'; DROP TABLE user_feedback; --";
      
      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          sessionId: testSessionId,
          commenterId: testCommenterId,
          relevanceScore: 5,
          userAssessment: 'relevant',
          notes: maliciousNotes
        })
        .expect(200); // Should succeed but sanitize input
      
      // Verify database integrity
      const feedback = await getFeedbackById(response.body.feedbackId);
      expect(feedback.notes).not.toContain('DROP TABLE');
      expect(feedback.notes).toBe(maliciousNotes); // But original text should be preserved
    });
    
    it('should limit request size to prevent DoS', async () => {
      const largePayload = {
        postUrl: 'https://linkedin.com/posts/test',
        boostTerms: Array(10000).fill('x'.repeat(1000)) // Very large array
      };
      
      const response = await request(app)
        .post('/api/analysis/relevance-score')
        .set('Authorization', `Bearer ${validToken}`)
        .send(largePayload)
        .expect(413); // Payload too large
        
      expect(response.body.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });
  
  describe('Rate Limiting Security', () => {
    it('should prevent API abuse through rate limiting', async () => {
      const promises = Array(150).fill(null).map(() => // Exceed rate limit
        request(app)
          .post('/api/linkedin/extract-comments')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ postUrl: 'https://linkedin.com/posts/rate-limit-test' })
      );
      
      const responses = await Promise.all(promises.map(p => p.catch(err => err.response)));
      const rateLimitedResponses = responses.filter(r => r?.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
    
    it('should implement progressive rate limiting for repeated violations', async () => {
      // Simulate multiple rate limit violations
      for (let i = 0; i < 3; i++) {
        await Promise.all(Array(110).fill(null).map(() =>
          request(app)
            .post('/api/linkedin/extract-comments')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postUrl: `https://linkedin.com/posts/progressive-test-${i}` })
            .catch(() => {}) // Ignore failures
        ));
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
      }
      
      // Final request should have longer rate limit
      const response = await request(app)
        .post('/api/linkedin/extract-comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ postUrl: 'https://linkedin.com/posts/final-test' })
        .expect(429);
        
      expect(response.body.retryAfter).toBeGreaterThan(3600); // More than 1 hour
    });
  });
});
```

## For Security Analysts

### Authentication Flow and Security Model

#### JWT Authentication Architecture
The application implements a stateless JWT-based authentication system with the following security features:

**Token Structure and Claims**
- **Algorithm**: HMAC SHA-256 (HS256) for signing
- **Expiration**: 7 days for access tokens, 30 days for refresh tokens
- **Claims**: User ID, email, role, issued at, expiration
- **Issuer/Audience**: Application-specific identifiers for token validation

**Security Features**
- Automatic token rotation on each authenticated request
- Secure HttpOnly cookies for refresh tokens
- XSS protection through token storage strategy
- CSRF protection using double-submit cookie pattern

#### Authentication Implementation
```typescript
// Security configuration
export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET!, // 256-bit secret from environment
    algorithm: 'HS256' as const,
    expiresIn: '7d',
    refreshExpiresIn: '30d',
    issuer: 'linkedin-research-tool',
    audience: 'authenticated-users'
  },
  session: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // 5 failed login attempts
    lockoutDuration: 30 * 60 * 1000 // 30 minutes lockout
  }
};

// Password security requirements
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true
};
```

**Authentication Flow Security**
1. **Registration**: Password hashing with bcrypt (12 rounds), email verification
2. **Login**: Rate limiting, account lockout, secure session establishment
3. **Token Management**: Automatic refresh, secure storage, proper invalidation
4. **Logout**: Token blacklisting, session cleanup, security event logging

#### Session Security
```typescript
// Session management security
export class SessionManager {
  private readonly blacklistedTokens = new Set<string>();
  private readonly activeSessions = new Map<string, SessionData>();
  
  async createSession(user: User): Promise<SessionTokens> {
    const sessionId = generateSecureId();
    const accessToken = await this.generateAccessToken(user, sessionId);
    const refreshToken = await this.generateRefreshToken(user, sessionId);
    
    // Store session metadata for security monitoring
    this.activeSessions.set(sessionId, {
      userId: user.id,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: this.getCurrentIP(),
      userAgent: this.getCurrentUserAgent(),
      isActive: true
    });
    
    return { accessToken, refreshToken, sessionId };
  }
  
  async validateSession(token: string): Promise<ValidationResult> {
    // Check token blacklist first
    if (this.blacklistedTokens.has(token)) {
      throw new AuthError('Token has been revoked', 'TOKEN_REVOKED');
    }
    
    const payload = await this.verifyJWT(token);
    const session = this.activeSessions.get(payload.sessionId);
    
    if (!session || !session.isActive) {
      throw new AuthError('Session not found or inactive', 'INVALID_SESSION');
    }
    
    // Update last activity for session monitoring
    session.lastActivity = new Date();
    
    return { valid: true, payload, session };
  }
  
  async revokeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      // Add all tokens for this session to blacklist
      const tokens = await this.getTokensForSession(sessionId);
      tokens.forEach(token => this.blacklistedTokens.add(token));
    }
  }
}
```

### Data Encryption Strategies

#### Database Encryption
```typescript
// Field-level encryption for sensitive data
export class DataEncryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationRounds = 100000;
  
  // Encrypt sensitive fields before database storage
  async encryptSensitiveData(data: SensitiveData): Promise<EncryptedData> {
    const key = await this.deriveKey(process.env.ENCRYPTION_SALT!);
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('linkedin-research-tool'));
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<SensitiveData> {
    const key = await this.deriveKey(process.env.ENCRYPTION_SALT!);
    const decipher = crypto.createDecipher(this.algorithm, key);
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    decipher.setAAD(Buffer.from('linkedin-research-tool'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  private async deriveKey(salt: string): Promise<Buffer> {
    return crypto.pbkdf2Sync(
      process.env.MASTER_ENCRYPTION_KEY!,
      salt,
      this.keyDerivationRounds,
      32, // 256-bit key
      'sha512'
    );
  }
}

// Database schema with encryption fields
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
  encrypted_preferences JSONB, -- Encrypted with field-level encryption
  encryption_iv VARCHAR(32), -- IV for preference encryption
  encryption_tag VARCHAR(32), -- Auth tag for preference encryption
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Audit fields
  last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  last_login_user_agent TEXT
);
```

#### Application-Level Encryption
```typescript
// Encryption for LinkedIn data cache
export class LinkedInDataEncryption {
  // Encrypt LinkedIn profile data before caching
  async encryptProfileData(profileData: LinkedInProfile): Promise<EncryptedProfile> {
    // Remove or hash PII before encryption
    const sanitizedData = this.sanitizeProfileData(profileData);
    
    // Encrypt the sanitized data
    const encrypted = await this.dataEncryption.encryptSensitiveData(sanitizedData);
    
    return {
      ...encrypted,
      profileId: this.hashProfileId(profileData.linkedInId),
      lastUpdated: new Date(),
      retentionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }
  
  private sanitizeProfileData(profile: LinkedInProfile): SanitizedProfile {
    return {
      // Keep only business-relevant information
      name: this.hashPII(profile.name),
      headline: profile.headline,
      company: profile.company,
      industry: profile.industry,
      location: this.generalizeLocation(profile.location),
      recentPosts: profile.recentPosts.map(post => ({
        content: this.sanitizePostContent(post.content),
        publishedAt: post.publishedAt,
        engagement: post.engagement,
        hashtags: post.hashtags
      })),
      // Remove direct profile URL and other identifiers
      analysisMetadata: {
        profileType: this.classifyProfileType(profile),
        activityLevel: this.calculateActivityLevel(profile.recentPosts),
        topicsOfInterest: this.extractTopics(profile.recentPosts)
      }
    };
  }
  
  private hashPII(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + process.env.PII_SALT!)
      .digest('hex')
      .substring(0, 16); // First 16 chars for anonymization
  }
  
  private generalizeLocation(location: string): string {
    // Generalize location to city/region level only
    const parts = location.split(',').map(s => s.trim());
    return parts.slice(-2).join(', '); // Keep only last two parts (City, Country)
  }
}
```

### Input Validation and Sanitization Requirements

#### Comprehensive Input Validation
```typescript
// Input sanitization middleware
export class InputSanitizer {
  // Sanitize all string inputs to prevent XSS
  sanitizeString(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false
    });
  }
  
  // Validate and sanitize LinkedIn URLs
  validateLinkedInUrl(url: string): ValidatedUrl {
    // Basic URL validation
    if (!validator.isURL(url, {
      protocols: ['https'],
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true
    })) {
      throw new ValidationError('Invalid URL format');
    }
    
    // LinkedIn domain validation
    const parsedUrl = new URL(url);
    const allowedHosts = ['linkedin.com', 'www.linkedin.com'];
    
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      throw new ValidationError('URL must be from linkedin.com domain');
    }
    
    // Post URL pattern validation
    const postPattern = /^\/posts\/[a-zA-Z0-9_-]+_activity-[a-zA-Z0-9]+\/?$/;
    if (!postPattern.test(parsedUrl.pathname)) {
      throw new ValidationError('Invalid LinkedIn post URL format');
    }
    
    // Remove query parameters and fragments for security
    return {
      originalUrl: url,
      sanitizedUrl: `https://${parsedUrl.hostname}${parsedUrl.pathname}`,
      postId: this.extractPostId(parsedUrl.pathname)
    };
  }
  
  // Validate feedback input with content filtering
  validateFeedbackInput(feedback: FeedbackInput): ValidatedFeedback {
    return {
      sessionId: this.validateUUID(feedback.sessionId),
      commenterId: this.validateUUID(feedback.commenterId),
      relevanceScore: this.validateScore(feedback.relevanceScore),
      userAssessment: this.validateAssessment(feedback.userAssessment),
      userScore: feedback.userScore ? this.validateScore(feedback.userScore) : undefined,
      notes: feedback.notes ? this.sanitizeAndValidateNotes(feedback.notes) : undefined,
      categories: feedback.categories ? this.validateCategories(feedback.categories) : undefined
    };
  }
  
  private sanitizeAndValidateNotes(notes: string): string {
    // Sanitize HTML and potential script injection
    let sanitized = this.sanitizeString(notes);
    
    // Remove potential SQL injection patterns
    sanitized = sanitized.replace(/['";\\]|--|\//g, '');
    
    // Limit length to prevent DoS
    if (sanitized.length > 500) {
      throw new ValidationError('Notes exceed maximum length of 500 characters');
    }
    
    // Check for inappropriate content
    if (this.containsInappropriateContent(sanitized)) {
      throw new ValidationError('Notes contain inappropriate content');
    }
    
    return sanitized;
  }
  
  private containsInappropriateContent(text: string): boolean {
    const inappropriatePatterns = [
      /script\s*:/i,
      /javascript\s*:/i,
      /data\s*:/i,
      /vbscript\s*:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /<\s*iframe/i,
      /<\s*object/i,
      /<\s*embed/i
    ];
    
    return inappropriatePatterns.some(pattern => pattern.test(text));
  }
}
```

#### Request Validation Middleware
```typescript
// Comprehensive request validation middleware
export class RequestValidator {
  // Validate content-type and request structure
  validateRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate content-type for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          if (!req.is('application/json')) {
            throw new ValidationError('Content-Type must be application/json');
          }
        }
        
        // Validate request size
        const contentLength = parseInt(req.get('content-length') || '0');
        if (contentLength > 1024 * 1024) { // 1MB limit
          throw new ValidationError('Request payload too large');
        }
        
        // Validate and sanitize request body
        if (req.body) {
          const sanitizedBody = this.deepSanitize(req.body);
          req.body = schema.parse(sanitizedBody);
        }
        
        // Validate query parameters
        if (req.query) {
          req.query = this.sanitizeQueryParams(req.query);
        }
        
        // Validate headers for security
        this.validateSecurityHeaders(req);
        
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors
          });
        }
        
        if (error instanceof ValidationError) {
          return res.status(400).json({
            error: error.message,
            code: 'VALIDATION_ERROR'
          });
        }
        
        next(error);
      }
    };
  };
  
  private deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
      return this.inputSanitizer.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.inputSanitizer.sanitizeString(key);
        sanitized[sanitizedKey] = this.deepSanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  }
  
  private validateSecurityHeaders(req: Request): void {
    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-proto', 'x-real-ip'];
    suspiciousHeaders.forEach(header => {
      if (req.get(header)) {
        console.warn(`Suspicious header detected: ${header}`, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          header: header,
          value: req.get(header)
        });
      }
    });
    
    // Validate user-agent to prevent automated attacks
    const userAgent = req.get('user-agent');
    if (!userAgent || this.isSuspiciousUserAgent(userAgent)) {
      throw new ValidationError('Invalid or suspicious user agent');
    }
  }
  
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}
```

### Security Headers and CORS Policies

#### Security Headers Configuration
```typescript
// Comprehensive security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy - prevent XSS and injection attacks
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://media.licdn.com https://cdn.linkedin.com",
    "connect-src 'self' https://api.linkedin.com https://vercel.live",
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self'"
  ].join('; '));
  
  // Strict Transport Security - enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Frame-Options - prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options - prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection - enable XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy - control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy - restrict browser features
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '));
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

// HSTS preload header for production
export const hstsPreload = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
};
```

#### CORS Configuration
```typescript
// CORS configuration with security considerations
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://linkedin-research-tool.vercel.app',
      'https://www.linkedin-research-tool.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:4000'] : [])
    ];
    
    // Validate origin against whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS: Origin not allowed', { origin, timestamp: new Date() });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  
  credentials: true, // Allow cookies for authentication
  
  maxAge: 86400, // 24 hours preflight cache
  
  // Security: Don't expose sensitive headers
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  
  optionsSuccessStatus: 200 // For legacy browser support
};

// Additional CORS security middleware
export const corsSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Validate request origin matches host header (prevent host header injection)
  const origin = req.get('origin');
  const host = req.get('host');
  
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host && !origin.includes(host)) {
        console.warn('CORS Security: Origin/Host mismatch', {
          origin,
          host,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        
        return res.status(400).json({
          error: 'Invalid origin/host combination',
          code: 'CORS_SECURITY_ERROR'
        });
      }
    } catch (error) {
      console.warn('CORS Security: Invalid origin URL', { origin, error: error.message });
    }
  }
  
  next();
};
```

### Vulnerability Prevention Measures

#### SQL Injection Prevention
```typescript
// Parameterized query builder to prevent SQL injection
export class SecureQueryBuilder {
  private db: Database;
  
  constructor(database: Database) {
    this.db = database;
  }
  
  // Safe query execution with parameter binding
  async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    // Validate query doesn't contain dangerous patterns
    this.validateQuerySafety(query);
    
    // Use parameterized queries exclusively
    try {
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', { query, params: this.sanitizeParams(params), error });
      throw new DatabaseError('Query execution failed');
    }
  }
  
  // Build WHERE clauses safely
  buildWhereClause(conditions: Record<string, any>): { clause: string; params: any[] } {
    const validColumns = this.getValidColumns(); // Whitelist approach
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    for (const [column, value] of Object.entries(conditions)) {
      // Validate column name against whitelist
      if (!validColumns.includes(column)) {
        throw new ValidationError(`Invalid column name: ${column}`);
      }
      
      // Handle different value types safely
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        whereConditions.push(`${column} IN (${placeholders})`);
        params.push(...value);
      } else if (value === null) {
        whereConditions.push(`${column} IS NULL`);
      } else {
        whereConditions.push(`${column} = $${paramIndex++}`);
        params.push(value);
      }
    }
    
    return {
      clause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
      params
    };
  }
  
  private validateQuerySafety(query: string): void {
    // Block dangerous SQL patterns
    const dangerousPatterns = [
      /;\s*(drop|delete|truncate|alter|create|grant|revoke)/i,
      /union\s+select/i,
      /\/\*.*?\*\//g, // Block comments
      /--.*$/gm, // Block SQL comments
      /exec\s*\(/i,
      /sp_/i, // Stored procedures
      /xp_/i, // Extended procedures
    ];
    
    dangerousPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        throw new SecurityError(`Dangerous SQL pattern detected in query`);
      }
    });
  }
  
  private getValidColumns(): string[] {
    // Return whitelist of allowed column names
    return [
      'id', 'user_id', 'email', 'name', 'created_at', 'updated_at',
      'session_id', 'commenter_id', 'relevance_score', 'linkedin_id',
      'status', 'post_url', 'analysis_data', 'feedback_notes'
    ];
  }
  
  private sanitizeParams(params: any[]): any[] {
    // Sanitize parameters for logging (remove sensitive data)
    return params.map(param => {
      if (typeof param === 'string' && param.includes('@')) {
        return '[EMAIL]'; // Hide email addresses
      }
      if (typeof param === 'string' && param.length > 50) {
        return '[LONG_STRING]'; // Hide long strings
      }
      return param;
    });
  }
}
```

#### XSS Prevention
```typescript
// XSS prevention middleware and utilities
export class XSSProtection {
  private allowedTags: string[] = []; // No HTML tags allowed by default
  private allowedAttributes: string[] = [];
  
  // Sanitize all user inputs
  sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeUserInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeUserInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
  
  private sanitizeString(str: string): string {
    // Use DOMPurify for comprehensive XSS prevention
    const sanitized = DOMPurify.sanitize(str, {
      ALLOWED_TAGS: this.allowedTags,
      ALLOWED_ATTR: this.allowedAttributes,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input']
    });
    
    // Additional encoding for special characters
    return sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Validate CSP compliance for dynamic content
  validateCSPCompliance(content: string): boolean {
    const unsafePatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /style\s*=\s*['"]/i
    ];
    
    return !unsafePatterns.some(pattern => pattern.test(content));
  }
}

// Content Security Policy validation
export const validateCSP = (req: Request, res: Response, next: NextFunction) => {
  // Check if request contains inline scripts or styles
  if (req.body && typeof req.body === 'string') {
    const xssProtection = new XSSProtection();
    
    if (!xssProtection.validateCSPCompliance(req.body)) {
      return res.status(400).json({
        error: 'Content violates Content Security Policy',
        code: 'CSP_VIOLATION'
      });
    }
  }
  
  next();
};
```

#### Rate Limiting and DDoS Protection
```typescript
// Comprehensive rate limiting and DDoS protection
export class RateLimitManager {
  private redis: Redis;
  private rateLimitConfig = {
    // Different limits for different endpoints
    global: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 login attempts per 15 minutes  
    api: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 API calls per hour
    feedback: { windowMs: 60 * 60 * 1000, maxRequests: 20 } // 20 feedback submissions per hour
  };
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  async checkRateLimit(
    identifier: string,
    endpointType: keyof typeof this.rateLimitConfig
  ): Promise<RateLimitResult> {
    const config = this.rateLimitConfig[endpointType];
    const key = `rate_limit:${endpointType}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Use Redis sorted set to track requests in time window
    const pipe = this.redis.pipeline();
    
    // Remove expired entries
    pipe.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    pipe.zcard(key);
    
    // Add current request
    pipe.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipe.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipe.exec();
    const currentCount = results![1][1] as number;
    
    if (currentCount >= config.maxRequests) {
      // Check for progressive penalties
      const penaltyLevel = await this.getPenaltyLevel(identifier);
      const penaltyMultiplier = Math.pow(2, penaltyLevel); // Exponential backoff
      
      return {
        allowed: false,
        limit: config.maxRequests,
        current: currentCount + 1,
        resetTime: now + (config.windowMs * penaltyMultiplier),
        penaltyLevel
      };
    }
    
    return {
      allowed: true,
      limit: config.maxRequests,
      current: currentCount + 1,
      resetTime: now + config.windowMs,
      penaltyLevel: 0
    };
  }
  
  // Implement progressive penalties for repeated violations
  async getPenaltyLevel(identifier: string): Promise<number> {
    const penaltyKey = `penalty:${identifier}`;
    const violations = await this.redis.get(penaltyKey);
    return violations ? parseInt(violations) : 0;
  }
  
  async incrementPenalty(identifier: string): Promise<void> {
    const penaltyKey = `penalty:${identifier}`;
    const current = await this.redis.incr(penaltyKey);
    
    // Set exponential expiration: 2^violations hours
    const expirationHours = Math.pow(2, current);
    await this.redis.expire(penaltyKey, expirationHours * 3600);
  }
  
  // DDoS detection based on request patterns
  async detectDDoSPatterns(
    ip: string,
    userAgent: string,
    endpoint: string
  ): Promise<DDosDetectionResult> {
    const patterns = await Promise.all([
      this.checkRequestFrequency(ip),
      this.checkUserAgentSuspicion(userAgent),
      this.checkEndpointAbuse(ip, endpoint),
      this.checkDistributedAttack(ip)
    ]);
    
    const suspicionScore = patterns.reduce((sum, pattern) => sum + pattern.score, 0);
    const threshold = 7; // Suspicion threshold
    
    if (suspicionScore >= threshold) {
      await this.blockIP(ip, suspicionScore);
      
      return {
        isDDoS: true,
        suspicionScore,
        reasons: patterns.filter(p => p.score > 0).map(p => p.reason),
        blockDuration: this.calculateBlockDuration(suspicionScore)
      };
    }
    
    return { isDDoS: false, suspicionScore, reasons: [], blockDuration: 0 };
  }
  
  private async blockIP(ip: string, score: number): Promise<void> {
    const blockKey = `blocked_ip:${ip}`;
    const blockDuration = this.calculateBlockDuration(score);
    
    await this.redis.setex(blockKey, blockDuration, JSON.stringify({
      blockedAt: Date.now(),
      suspicionScore: score,
      blockDuration
    }));
    
    // Log security event
    console.warn('IP blocked due to suspicious activity', {
      ip,
      suspicionScore: score,
      blockDuration,
      timestamp: new Date()
    });
  }
  
  private calculateBlockDuration(suspicionScore: number): number {
    // Progressive blocking: higher scores = longer blocks
    const baseMinutes = 15;
    return baseMinutes * Math.pow(2, Math.floor(suspicionScore / 3)) * 60; // In seconds
  }
}
```

This comprehensive technical architecture document provides detailed blueprints for implementing the LinkedIn Comment Research Tool, ensuring security, performance, and maintainability across all system components. Each section includes implementation-ready specifications that development teams can execute independently while maintaining system cohesion.