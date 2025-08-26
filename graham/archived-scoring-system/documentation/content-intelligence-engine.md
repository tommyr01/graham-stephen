# Content Intelligence Engine - Technical Specification

## Overview
The Content Intelligence Engine is a core component of the AI-powered scoring system that analyzes LinkedIn posts for authenticity, expertise, and quality signals that Graham naturally recognizes in his prospect evaluation process.

## Core Components

### 1. AI Content Analysis Service

**Purpose**: Integrate with AI providers to analyze LinkedIn post content for authenticity and quality metrics.

**Technical Implementation**:
```typescript
// New service file: src/lib/services/content-intelligence.ts

interface ContentAnalysisConfig {
  aiProvider: 'openai' | 'anthropic';
  model: string;
  maxTokens: number;
  temperature: number;
}

interface ContentAnalysisResult {
  authenticityScore: number;      // 1-10 scale
  expertiseLevel: number;         // 1-10 scale  
  specificityScore: number;       // 1-10 scale
  professionalismScore: number;   // 1-10 scale
  redFlags: string[];
  reasoning: string;
  processingTime: number;
}

class ContentIntelligenceEngine {
  async analyzePost(post: LinkedInPost): Promise<ContentAnalysisResult>;
  async batchAnalyzePosts(posts: LinkedInPost[]): Promise<ContentAnalysisResult[]>;
  async detectAIGenerated(content: string): Promise<boolean>;
  async assessIndustryExpertise(content: string, industry: string): Promise<number>;
}
```

### 2. Content Authenticity Detection

**M&A Industry Authenticity Signals**:
- Specific deal value references ($2.5M acquisition, etc.)
- Actual client situation descriptions
- Industry-specific terminology usage
- Concrete business metrics and outcomes
- Personal experience narratives

**AI-Generated Content Red Flags**:
- Generic motivational language patterns
- Excessive use of buzzwords
- Lack of personal voice/style consistency
- Perfect grammar with no personality
- Repetitive sentence structures

**Implementation**:
```typescript
// Analysis prompts for AI providers
const AUTHENTICITY_ANALYSIS_PROMPT = `
Analyze this LinkedIn post for authenticity in the M&A/Business Brokerage industry:

POST CONTENT: {content}

Rate 1-10 for each factor:
1. AUTHENTICITY: Does this sound human-written vs AI-generated?
   - Look for: Personal voice, specific details, natural imperfections
   - Red flags: Generic phrases, perfect structure, buzzword overuse

2. INDUSTRY EXPERTISE: Does this show real M&A/brokerage knowledge?
   - Look for: Specific deal values, actual processes, industry terminology
   - Red flags: Surface-level business speak, vague references

3. SPECIFICITY: Concrete details vs generic business content?
   - Look for: Actual numbers, client situations, specific outcomes
   - Red flags: Vague statements, motivational platitudes

4. PROFESSIONALISM: Quality of business communication?
   - Look for: Clear communication, professional tone, value-driven content
   - Red flags: Poor grammar, unprofessional language

Return JSON format with scores and brief reasoning for each factor.
`;
```

### 3. Expertise Level Assessment

**Industry Knowledge Indicators**:
- Correct usage of M&A terminology
- Understanding of deal structures
- Knowledge of valuation methods
- Familiarity with regulatory requirements
- Experience with due diligence processes

**Content Quality Metrics**:
- Depth of analysis in posts
- Consistency of expertise demonstration
- Ability to explain complex concepts
- Practical experience examples
- Industry trend awareness

### 4. Caching and Performance Layer

**Content Analysis Caching**:
```typescript
interface AnalysisCache {
  postId: string;
  contentHash: string;
  analysisResult: ContentAnalysisResult;
  cachedAt: Date;
  expiresAt: Date;
}

class ContentAnalysisCache {
  async getCachedAnalysis(post: LinkedInPost): Promise<ContentAnalysisResult | null>;
  async setCachedAnalysis(post: LinkedInPost, result: ContentAnalysisResult): Promise<void>;
  async invalidateCache(postId: string): Promise<void>;
  async batchInvalidate(postIds: string[]): Promise<void>;
}
```

**Performance Optimization**:
- Cache analysis results for 30 days
- Batch API calls for multiple posts
- Rate limiting to stay within API quotas
- Fallback to previous analysis if API unavailable
- Background processing for non-urgent analysis

## API Integration Layer

### 1. OpenAI Integration
```typescript
class OpenAIContentAnalyzer implements ContentAnalyzer {
  private client: OpenAI;
  
  async analyzeContent(content: string): Promise<ContentAnalysisResult> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: AUTHENTICITY_ANALYSIS_PROMPT
        },
        {
          role: 'user', 
          content: content
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    
    return this.parseAnalysisResponse(response.choices[0].message.content);
  }
}
```

### 2. Anthropic Claude Integration
```typescript
class ClaudeContentAnalyzer implements ContentAnalyzer {
  private client: Anthropic;
  
  async analyzeContent(content: string): Promise<ContentAnalysisResult> {
    const response = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `${AUTHENTICITY_ANALYSIS_PROMPT}\n\nPOST CONTENT: ${content}`
        }
      ]
    });
    
    return this.parseAnalysisResponse(response.content[0].text);
  }
}
```

## Database Schema Extensions

```sql
-- Content analysis results storage
CREATE TABLE content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id VARCHAR NOT NULL,
  prospect_id UUID NOT NULL,
  content_hash VARCHAR(64) NOT NULL, -- SHA-256 of content
  
  -- Analysis scores
  authenticity_score DECIMAL(3,1) CHECK (authenticity_score >= 1 AND authenticity_score <= 10),
  expertise_level DECIMAL(3,1) CHECK (expertise_level >= 1 AND expertise_level <= 10),
  specificity_score DECIMAL(3,1) CHECK (specificity_score >= 1 AND specificity_score <= 10),
  professionalism_score DECIMAL(3,1) CHECK (professionalism_score >= 1 AND professionalism_score <= 10),
  
  -- Analysis details
  red_flags TEXT[],
  reasoning TEXT,
  ai_provider VARCHAR(20) NOT NULL,
  model_version VARCHAR(50),
  processing_time_ms INTEGER,
  
  -- Metadata
  analyzed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Indexes
  INDEX idx_content_analysis_prospect (prospect_id),
  INDEX idx_content_analysis_hash (content_hash),
  INDEX idx_content_analysis_expires (expires_at)
);

-- Aggregate content scores per prospect
CREATE TABLE prospect_content_summary (
  prospect_id UUID PRIMARY KEY,
  
  -- Aggregate scores
  avg_authenticity_score DECIMAL(3,1),
  avg_expertise_level DECIMAL(3,1),
  avg_specificity_score DECIMAL(3,1),
  avg_professionalism_score DECIMAL(3,1),
  
  -- Content patterns
  total_posts_analyzed INTEGER DEFAULT 0,
  ai_generated_posts INTEGER DEFAULT 0,
  high_expertise_posts INTEGER DEFAULT 0,
  red_flag_count INTEGER DEFAULT 0,
  
  -- Quality trends
  content_consistency_score DECIMAL(3,1), -- How consistent is their content quality
  authenticity_trend VARCHAR(20), -- 'improving' | 'declining' | 'stable'
  
  last_analyzed TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_prospect_content_authenticity (avg_authenticity_score),
  INDEX idx_prospect_content_expertise (avg_expertise_level)
);
```

## API Endpoints

### Content Analysis Endpoints
```typescript
// Single post analysis
POST /api/v2/content/analyze
{
  "postId": "string",
  "content": "string",
  "prospectId": "string"
}

// Batch post analysis
POST /api/v2/content/batch-analyze
{
  "posts": [
    {
      "postId": "string",
      "content": "string",
      "prospectId": "string"
    }
  ]
}

// Get cached analysis
GET /api/v2/content/analysis/:prospectId

// Content authenticity check
POST /api/v2/content/authenticity-check
{
  "content": "string"
}
```

### Response Formats
```typescript
interface ContentAnalysisResponse {
  success: boolean;
  data: {
    postId: string;
    analysisResult: ContentAnalysisResult;
    cached: boolean;
    processingTime: number;
  };
  error?: string;
}

interface BatchAnalysisResponse {
  success: boolean;
  data: {
    totalProcessed: number;
    results: ContentAnalysisResult[];
    fromCache: number;
    newAnalysis: number;
    failed: number;
  };
  errors?: string[];
}
```

## Integration with Profile Research Page

### Enhanced Analysis Results
When training mode is enabled, the Profile Research page will show enhanced analysis results that include content intelligence scoring alongside the existing analysis.

```typescript
// Enhanced analysis results for Profile Research page
interface EnhancedAnalysisResult extends CurrentAnalysisResult {
  contentIntelligence: {
    overallAuthenticity: number;
    expertiseLevel: number;
    contentQuality: number;
    aiGeneratedContent: number; // Percentage of posts that appear AI-generated
    redFlags: string[];
  };
  systemPrediction?: {
    predictedDecision: 'contact' | 'skip';
    confidence: number;
    reasoning: string[];
  };
}

// New scoring factors
export const CONTENT_INTELLIGENCE_WEIGHTS = {
  authenticityWeight: 1.5,      // High weight for authentic content
  expertiseWeight: 2.0,         // Very high weight for demonstrated expertise
  specificityWeight: 1.0,       // Medium weight for specific vs generic content
  aiContentPenalty: -2.0,       // Strong penalty for AI-generated content
  consistencyBonus: 0.5,        // Bonus for consistent content quality
};
```

### Updated Scoring Algorithm
```typescript
export function calculateEnhancedRelevanceScore(
  commenter: any,
  contentAnalysis: ContentAnalysisResult[],
  boostTerms: string[] = [],
  downTerms: string[] = [],
  weights: EnhancedScoringWeights = DEFAULT_ENHANCED_WEIGHTS
): EnhancedRelevanceScore {
  
  // Existing scoring logic...
  const baseScore = calculateRelevanceScore(commenter, boostTerms, downTerms);
  
  // Add content intelligence scoring
  const contentScore = calculateContentIntelligenceScore(contentAnalysis, weights);
  
  // Combine scores with proper weighting
  const finalScore = combineScores(baseScore, contentScore, weights);
  
  return {
    ...baseScore,
    score: finalScore,
    contentIntelligence: contentScore,
    explanation: {
      ...baseScore.explanation,
      contentAnalysis: generateContentExplanation(contentAnalysis)
    }
  };
}
```

## Testing Strategy

### Unit Tests
- AI provider integration tests
- Content analysis algorithm tests
- Caching layer tests
- Database operation tests

### Integration Tests
- End-to-end content analysis workflow
- API endpoint testing
- Performance testing with large datasets
- Error handling and fallback scenarios

### Quality Assurance
- Manual review of AI analysis accuracy
- False positive/negative rate tracking
- Performance benchmarking
- Cost monitoring for AI API usage

## Monitoring and Observability

### Key Metrics
- Content analysis accuracy rate
- AI API response times and costs
- Cache hit ratios
- False positive detection rates
- System throughput and performance

### Alerting
- AI API quota exhaustion warnings
- Analysis accuracy degradation alerts
- Performance threshold violations
- Cache invalidation monitoring

## Security and Privacy

### Data Protection
- Encrypt cached analysis results
- Secure AI API key management
- GDPR compliance for content storage
- Data retention policy enforcement

### Rate Limiting
- AI API call rate limiting
- User request throttling
- Cost control mechanisms
- Fair usage policies

This Content Intelligence Engine provides the AI foundation for the enhanced Profile Research page, analyzing LinkedIn content for authenticity and quality signals while seamlessly integrating with Graham's familiar workflow. The content analysis runs automatically in the background, enhancing the existing scoring system without requiring any changes to Graham's current process.