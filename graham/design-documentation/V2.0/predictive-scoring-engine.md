# Predictive Scoring Engine - Technical Specification

## Overview
The Predictive Scoring Engine is the core AI component that learns from Graham's training decisions to predict his evaluation of new prospects. It combines content intelligence, similarity matching, and adaptive learning to replicate Graham's expert decision-making patterns.

## Core Architecture

### 1. Prediction Pipeline

**High-Level Flow**:
```
New Prospect → Content Analysis → Similar Prospect Matching → Pattern Recognition → Confidence-Rated Prediction → Learning Feedback Loop
```

**Technical Implementation**:
```typescript
interface PredictionPipeline {
  analyzeProspect(prospect: ProspectData): Promise<ProspectAnalysis>;
  findSimilarProspects(analysis: ProspectAnalysis): Promise<SimilarProspect[]>;
  applyLearningPatterns(analysis: ProspectAnalysis, similar: SimilarProspect[]): Promise<PatternMatchResult>;
  generatePrediction(patternResult: PatternMatchResult): Promise<GrahamPrediction>;
  updateLearningModel(prediction: GrahamPrediction, actualDecision?: TrainingDecision): Promise<void>;
}

interface GrahamPrediction {
  predictedDecision: 'contact' | 'skip';
  confidence: number; // 0-100%
  reasoning: {
    primaryFactors: string[]; // Top 3 decision drivers
    concerningSignals: string[]; // Potential red flags
    contentQuality: ContentQualityAssessment;
    experienceMatch: ExperienceMatchAssessment;
    similarProspects: SimilarProspectMatch[];
  };
  scoreBreakdown: DetailedScoreBreakdown;
  learningMetadata: LearningMetadata;
}
```

### 2. Similar Prospect Matching Engine

**Similarity Calculation**:
```typescript
interface ProspectSimilarity {
  // Core demographic similarity
  industryMatch: number; // 0-1 scale
  roleMatch: number; // 0-1 scale
  experienceLevel: number; // 0-1 scale
  companySize: number; // 0-1 scale
  geography: number; // 0-1 scale
  
  // Content similarity
  contentStyle: number; // Writing style and quality
  topicAlignment: number; // Subject matter expertise
  authenticityLevel: number; // Human vs AI content patterns
  expertiseDepth: number; // Industry knowledge demonstration
  
  // Behavioral patterns
  postingFrequency: number; // LinkedIn activity patterns
  engagementStyle: number; // How they interact with content
  professionalNetwork: number; // Connection quality indicators
  
  // Composite scores
  overallSimilarity: number; // Weighted combination
  confidenceLevel: number; // How confident we are in similarity
}

class SimilarProspectMatcher {
  async findSimilarProspects(
    targetProspect: ProspectData,
    trainingDataset: TrainingDecision[],
    topK: number = 10
  ): Promise<SimilarProspectMatch[]> {
    
    const similarities = await Promise.all(
      trainingDataset.map(async (decision) => {
        const similarity = await this.calculateSimilarity(
          targetProspect,
          decision.prospectSnapshot
        );
        
        return {
          trainingDecisionId: decision.id,
          prospectSnapshot: decision.prospectSnapshot,
          similarity,
          grahamDecision: decision.decision,
          grahamConfidence: decision.confidence,
          decisionReasoning: decision.voiceNote?.transcription,
          outcome: await this.getProspectOutcome(decision.prospectId)
        };
      })
    );
    
    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity.overallSimilarity - a.similarity.overallSimilarity)
      .slice(0, topK);
  }
  
  private async calculateSimilarity(
    prospect1: ProspectData,
    prospect2: ProspectSnapshot
  ): Promise<ProspectSimilarity> {
    
    // Industry and role matching
    const industryMatch = this.calculateIndustryMatch(prospect1.industry, prospect2.industry);
    const roleMatch = this.calculateRoleMatch(prospect1.role, prospect2.role);
    
    // Content similarity using embeddings
    const contentSimilarity = await this.calculateContentSimilarity(
      prospect1.recentPosts,
      prospect2.recentPosts
    );
    
    // Experience level comparison
    const experienceMatch = this.calculateExperienceMatch(
      prospect1.experience,
      prospect2.experience
    );
    
    // Company characteristics
    const companyMatch = this.calculateCompanyMatch(
      prospect1.company,
      prospect2.company
    );
    
    // Geographic proximity
    const geoMatch = this.calculateGeographicMatch(
      prospect1.location,
      prospect2.location
    );
    
    // Weighted combination
    const overallSimilarity = (
      industryMatch * 0.25 +
      roleMatch * 0.20 +
      contentSimilarity * 0.20 +
      experienceMatch * 0.15 +
      companyMatch * 0.10 +
      geoMatch * 0.10
    );
    
    return {
      industryMatch,
      roleMatch,
      experienceLevel: experienceMatch,
      companySize: companyMatch,
      geography: geoMatch,
      contentStyle: contentSimilarity,
      overallSimilarity,
      confidenceLevel: this.calculateConfidence(overallSimilarity)
    };
  }
}
```

### 3. Pattern Recognition Engine

**Learning Pattern Types**:
```typescript
interface LearningPattern {
  patternId: string;
  patternType: 'content_authenticity' | 'experience_threshold' | 'industry_preference' | 'red_flag_detection' | 'company_type_preference';
  
  // Pattern definition
  triggerConditions: PatternCondition[];
  expectedOutcome: 'contact' | 'skip';
  confidence: number; // 0-1 based on training data consistency
  
  // Supporting evidence
  supportingDecisions: string[]; // Training decision IDs
  contradictoryDecisions: string[]; // Decisions that contradict this pattern
  strengthScore: number; // How reliable this pattern is
  
  // Pattern evolution
  discoveredAt: Date;
  lastValidatedAt: Date;
  usageCount: number;
  accuracyRate: number;
  
  // Contextual factors
  contextualModifiers: ContextModifier[];
  timeBasedFactors: TimeBasedFactor[];
}

interface PatternCondition {
  field: string; // e.g., 'contentAuthenticity', 'yearsExperience'
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains' | 'matches_pattern';
  value: any;
  weight: number; // Importance of this condition
}

class PatternRecognitionEngine {
  async extractPatternsFromTrainingData(
    trainingDecisions: TrainingDecision[]
  ): Promise<LearningPattern[]> {
    
    const patterns: LearningPattern[] = [];
    
    // Group decisions by outcome
    const contactDecisions = trainingDecisions.filter(d => d.decision === 'contact');
    const skipDecisions = trainingDecisions.filter(d => d.decision === 'skip');
    
    // Extract content authenticity patterns
    patterns.push(...await this.extractContentAuthenticityPatterns(contactDecisions, skipDecisions));
    
    // Extract experience level patterns
    patterns.push(...await this.extractExperiencePatterns(contactDecisions, skipDecisions));
    
    // Extract industry preference patterns
    patterns.push(...await this.extractIndustryPatterns(contactDecisions, skipDecisions));
    
    // Extract red flag patterns
    patterns.push(...await this.extractRedFlagPatterns(skipDecisions));
    
    // Extract company type patterns
    patterns.push(...await this.extractCompanyTypePatterns(contactDecisions, skipDecisions));
    
    // Validate pattern consistency
    return await this.validatePatternConsistency(patterns, trainingDecisions);
  }
  
  private async extractContentAuthenticityPatterns(
    contactDecisions: TrainingDecision[],
    skipDecisions: TrainingDecision[]
  ): Promise<LearningPattern[]> {
    
    const patterns: LearningPattern[] = [];
    
    // Analyze content authenticity thresholds
    const contactAuthenticityScores = contactDecisions.map(d => 
      d.prospectSnapshot.contentAnalysis?.authenticityScore || 0
    );
    const skipAuthenticityScores = skipDecisions.map(d => 
      d.prospectSnapshot.contentAnalysis?.authenticityScore || 0
    );
    
    // Find threshold where Graham typically switches from contact to skip
    const authenticityThreshold = this.findOptimalThreshold(
      contactAuthenticityScores,
      skipAuthenticityScores
    );
    
    if (authenticityThreshold.confidence > 0.7) {
      patterns.push({
        patternId: `authenticity_threshold_${Date.now()}`,
        patternType: 'content_authenticity',
        triggerConditions: [{
          field: 'contentAuthenticity',
          operator: 'less_than',
          value: authenticityThreshold.value,
          weight: 1.0
        }],
        expectedOutcome: 'skip',
        confidence: authenticityThreshold.confidence,
        supportingDecisions: skipDecisions
          .filter(d => (d.prospectSnapshot.contentAnalysis?.authenticityScore || 0) < authenticityThreshold.value)
          .map(d => d.id),
        // ... other pattern properties
      });
    }
    
    return patterns;
  }
  
  async applyPatternsToProspect(
    prospect: ProspectData,
    patterns: LearningPattern[]
  ): Promise<PatternMatchResult> {
    
    const matchedPatterns: PatternMatch[] = [];
    
    for (const pattern of patterns) {
      const matchResult = await this.evaluatePattern(prospect, pattern);
      if (matchResult.matches) {
        matchedPatterns.push({
          pattern,
          matchStrength: matchResult.strength,
          triggeredConditions: matchResult.triggeredConditions
        });
      }
    }
    
    // Calculate overall prediction based on matched patterns
    const prediction = this.aggregatePatternResults(matchedPatterns);
    
    return {
      matchedPatterns,
      prediction,
      confidence: this.calculatePatternConfidence(matchedPatterns)
    };
  }
}
```

### 4. Adaptive Learning System

**Real-time Model Updates**:
```typescript
interface AdaptiveLearningSystem {
  // Immediate learning from new training decisions
  processNewTrainingDecision(decision: TrainingDecision): Promise<LearningUpdate>;
  
  // Batch learning from multiple decisions
  batchUpdateModel(decisions: TrainingDecision[]): Promise<ModelUpdate>;
  
  // Validation against held-out test set
  validateModelPerformance(): Promise<ValidationMetrics>;
  
  // Rollback to previous model version if performance degrades
  rollbackModel(version: string): Promise<void>;
  
  // A/B testing for model improvements
  deployModelVariant(variant: ModelVariant, trafficPercentage: number): Promise<void>;
}

interface LearningUpdate {
  patternsUpdated: string[];
  newPatternsDiscovered: string[];
  obsoletePatternsRemoved: string[];
  confidenceAdjustments: { [patternId: string]: number };
  modelAccuracyImpact: number;
}

class AdaptiveLearningEngine {
  async processNewTrainingDecision(decision: TrainingDecision): Promise<LearningUpdate> {
    // Get current prediction for this prospect
    const currentPrediction = await this.predictDecision(decision.prospectSnapshot);
    
    // Calculate prediction accuracy
    const isAccurate = currentPrediction.predictedDecision === decision.decision;
    const confidenceError = Math.abs(currentPrediction.confidence - decision.confidence * 10);
    
    // Update pattern strengths based on accuracy
    const patternUpdates = await this.updatePatternStrengths(
      currentPrediction.matchedPatterns,
      isAccurate,
      confidenceError
    );
    
    // Look for new patterns in this decision
    const newPatterns = await this.discoverNewPatterns(decision, this.trainingDataset);
    
    // Remove patterns that are no longer reliable
    const obsoletePatterns = await this.identifyObsoletePatterns();
    
    return {
      patternsUpdated: patternUpdates.map(p => p.patternId),
      newPatternsDiscovered: newPatterns.map(p => p.patternId),
      obsoletePatternsRemoved: obsoletePatterns,
      confidenceAdjustments: patternUpdates.reduce((acc, p) => {
        acc[p.patternId] = p.newConfidence;
        return acc;
      }, {}),
      modelAccuracyImpact: this.calculateAccuracyImpact(isAccurate, confidenceError)
    };
  }
  
  private async updatePatternStrengths(
    matchedPatterns: PatternMatch[],
    isAccurate: boolean,
    confidenceError: number
  ): Promise<PatternUpdate[]> {
    
    const updates: PatternUpdate[] = [];
    
    for (const match of matchedPatterns) {
      const currentConfidence = match.pattern.confidence;
      let newConfidence = currentConfidence;
      
      if (isAccurate) {
        // Increase confidence for accurate predictions
        newConfidence = Math.min(1.0, currentConfidence + 0.01);
      } else {
        // Decrease confidence for inaccurate predictions
        newConfidence = Math.max(0.0, currentConfidence - 0.02);
      }
      
      // Adjust based on confidence error
      const confidenceAdjustment = Math.max(-0.01, Math.min(0.01, (100 - confidenceError) / 10000));
      newConfidence += confidenceAdjustment;
      
      updates.push({
        patternId: match.pattern.patternId,
        oldConfidence: currentConfidence,
        newConfidence: Math.max(0.0, Math.min(1.0, newConfidence)),
        accuracyContribution: isAccurate ? 1 : -1
      });
    }
    
    return updates;
  }
}
```

### 5. Prediction Generation

**Final Prediction Assembly**:
```typescript
class PredictionGenerator {
  async generateGrahamPrediction(
    prospect: ProspectData,
    contentAnalysis: ContentAnalysisResult[],
    similarProspects: SimilarProspectMatch[],
    patternMatches: PatternMatch[]
  ): Promise<GrahamPrediction> {
    
    // Calculate base prediction from patterns
    const patternPrediction = this.aggregatePatternPredictions(patternMatches);
    
    // Weight by similar prospect outcomes
    const similarityPrediction = this.aggregateSimilarityPredictions(similarProspects);
    
    // Combine predictions with confidence weighting
    const combinedPrediction = this.combinePredict
    ions([
      { prediction: patternPrediction, weight: 0.6 },
      { prediction: similarityPrediction, weight: 0.4 }
    ]);
    
    // Generate human-readable reasoning
    const reasoning = await this.generateReasoningExplanation(
      patternMatches,
      similarProspects,
      contentAnalysis
    );
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(
      patternPrediction.confidence,
      similarityPrediction.confidence,
      similarProspects.length
    );
    
    return {
      predictedDecision: combinedPrediction.decision,
      confidence,
      reasoning: {
        primaryFactors: reasoning.primaryFactors,
        concerningSignals: reasoning.concerningSignals,
        contentQuality: this.assessContentQuality(contentAnalysis),
        experienceMatch: this.assessExperienceMatch(prospect),
        similarProspects: similarProspects.slice(0, 3) // Top 3 most similar
      },
      scoreBreakdown: this.generateScoreBreakdown(patternMatches, contentAnalysis),
      learningMetadata: {
        patternsUsed: patternMatches.length,
        similarProspectsFound: similarProspects.length,
        dataQuality: this.assessPredictionDataQuality(prospect),
        modelVersion: this.getCurrentModelVersion()
      }
    };
  }
  
  private async generateReasoningExplanation(
    patternMatches: PatternMatch[],
    similarProspects: SimilarProspectMatch[],
    contentAnalysis: ContentAnalysisResult[]
  ): Promise<{
    primaryFactors: string[];
    concerningSignals: string[];
  }> {
    
    const primaryFactors: string[] = [];
    const concerningSignals: string[] = [];
    
    // Extract primary positive factors
    const positivePatterns = patternMatches.filter(p => p.pattern.expectedOutcome === 'contact');
    for (const pattern of positivePatterns.slice(0, 3)) {
      primaryFactors.push(this.translatePatternToReasoning(pattern.pattern));
    }
    
    // Extract concerning signals
    const negativePatterns = patternMatches.filter(p => p.pattern.expectedOutcome === 'skip');
    for (const pattern of negativePatterns.slice(0, 3)) {
      concerningSignals.push(this.translatePatternToWarning(pattern.pattern));
    }
    
    // Add content quality concerns
    const lowQualityContent = contentAnalysis.filter(c => c.authenticityScore < 6);
    if (lowQualityContent.length > 0) {
      concerningSignals.push(`${lowQualityContent.length} posts show low authenticity scores`);
    }
    
    // Add similar prospect insights
    const similarSuccesses = similarProspects.filter(s => s.grahamDecision === 'contact');
    if (similarSuccesses.length > 0) {
      primaryFactors.push(`Similar to ${similarSuccesses.length} prospects Graham previously contacted`);
    }
    
    return { primaryFactors, concerningSignals };
  }
}
```

## Performance Optimization

### 1. Caching Strategy

**Multi-level Caching**:
```typescript
interface PredictionCache {
  // Prospect-level cache (24 hours)
  prospectPredictions: Map<string, CachedPrediction>;
  
  // Pattern match cache (1 hour)
  patternMatches: Map<string, PatternMatchResult>;
  
  // Similar prospect cache (6 hours)
  similarityMatches: Map<string, SimilarProspectMatch[]>;
  
  // Content analysis cache (7 days)
  contentAnalysis: Map<string, ContentAnalysisResult[]>;
}

class PredictionCacheManager {
  async getCachedPrediction(prospectId: string): Promise<GrahamPrediction | null> {
    const cached = this.cache.prospectPredictions.get(prospectId);
    
    if (cached && !this.isExpired(cached)) {
      return cached.prediction;
    }
    
    return null;
  }
  
  async setCachedPrediction(
    prospectId: string,
    prediction: GrahamPrediction
  ): Promise<void> {
    this.cache.prospectPredictions.set(prospectId, {
      prediction,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  }
  
  invalidateCache(prospectId: string): void {
    this.cache.prospectPredictions.delete(prospectId);
    // Also invalidate related caches
    this.invalidateRelatedCaches(prospectId);
  }
}
```

### 2. Batch Processing

**Efficient Batch Predictions**:
```typescript
class BatchPredictionProcessor {
  async batchPredict(prospects: ProspectData[]): Promise<GrahamPrediction[]> {
    // Group by similar characteristics for efficient processing
    const prospectGroups = this.groupSimilarProspects(prospects);
    
    const results: GrahamPrediction[] = [];
    
    for (const group of prospectGroups) {
      // Batch process similar prospects together
      const groupPredictions = await this.processSimilarProspectGroup(group);
      results.push(...groupPredictions);
    }
    
    return results;
  }
  
  private async processSimilarProspectGroup(
    prospects: ProspectData[]
  ): Promise<GrahamPrediction[]> {
    
    // Batch content analysis
    const allPosts = prospects.flatMap(p => p.recentPosts);
    const contentAnalysis = await this.contentIntelligence.batchAnalyze(allPosts);
    
    // Batch similarity matching (shared similar prospects)
    const baseSimilarProspects = await this.findBaseSimilarProspects(prospects[0]);
    
    // Generate predictions for each prospect
    const predictions = await Promise.all(
      prospects.map(async (prospect, index) => {
        const prospectContentAnalysis = contentAnalysis.filter(c => 
          prospect.recentPosts.some(p => p.id === c.postId)
        );
        
        // Refine similar prospects for this specific prospect
        const refinedSimilarProspects = await this.refineSimilarityMatches(
          prospect,
          baseSimilarProspects
        );
        
        return this.generatePrediction(
          prospect,
          prospectContentAnalysis,
          refinedSimilarProspects
        );
      })
    );
    
    return predictions;
  }
}
```

## API Endpoints

### Prediction APIs
```typescript
// Generate prediction for single prospect
POST /api/v2/prediction/evaluate
{
  "prospectId": "string",
  "forceRefresh": boolean // Skip cache
}

// Batch prediction for multiple prospects
POST /api/v2/prediction/batch-evaluate
{
  "prospectIds": ["string"],
  "options": {
    "includeReasoningDetails": boolean,
    "includeSimilarProspects": boolean,
    "maxSimilarProspects": number
  }
}

// Get similar prospects
GET /api/v2/prediction/similar/:prospectId?limit=10

// Provide prediction feedback
POST /api/v2/prediction/feedback
{
  "predictionId": "string",
  "actualDecision": "contact" | "skip",
  "actualConfidence": number,
  "feedbackNotes": "string"
}

// Get prediction performance metrics
GET /api/v2/prediction/metrics
{
  "timeRange": "24h" | "7d" | "30d",
  "includePatternMetrics": boolean
}
```

### Response Formats
```typescript
interface PredictionResponse {
  success: boolean;
  data: {
    predictionId: string;
    prediction: GrahamPrediction;
    processingTime: number;
    cached: boolean;
    modelVersion: string;
  };
  error?: string;
}

interface BatchPredictionResponse {
  success: boolean;
  data: {
    predictions: Array<{
      prospectId: string;
      prediction: GrahamPrediction;
      processingTime: number;
    }>;
    totalProcessed: number;
    averageProcessingTime: number;
    cacheHitRate: number;
  };
  errors?: Array<{
    prospectId: string;
    error: string;
  }>;
}
```

## Monitoring and Analytics

### Performance Metrics
```typescript
interface PredictionMetrics {
  // Accuracy metrics
  overallAccuracy: number; // % of correct predictions
  confidenceCalibration: number; // How well confidence matches accuracy
  precisionByConfidence: { [confidenceRange: string]: number };
  
  // Performance metrics
  averageProcessingTime: number;
  cacheHitRate: number;
  throughput: number; // Predictions per minute
  
  // Learning metrics
  patternsActive: number;
  patternsUpdatedToday: number;
  newPatternsDiscovered: number;
  modelVersionsDeployed: number;
  
  // Quality metrics
  reasoningQuality: number; // Based on user feedback
  similarProspectRelevance: number;
  patternMatchReliability: number;
}
```

This Predictive Scoring Engine provides the intelligence layer that learns from Graham's training feedback to predict his decisions on new prospects. It integrates seamlessly with the Profile Research page, showing predictions alongside the normal analysis results while learning and improving from each training interaction Graham provides through the optional training mode toggle.