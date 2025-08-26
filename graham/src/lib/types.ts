// Type definitions for the LinkedIn Comment Research Tool

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchSession {
  id: string;
  userId: string;
  postUrl: string;
  sessionName?: string;
  status: 'active' | 'completed' | 'paused';
  totalComments: number;
  analyzedCommenters: number;
  boostTerms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentData {
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
  replies?: CommentData[];
}

export interface LinkedInComment {
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
  replies?: LinkedInComment[];
}

export interface LinkedInAPIResponse {
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

export interface Commenter {
  id: string;
  sessionId: string;
  linkedinId: string;
  name?: string;
  headline?: string;
  profileUrl?: string;
  company?: string;
  location?: string;
  followersCount?: number;
  connectionsCount?: number;
  commentText?: string;
  commentDate?: string;
  relevanceScore: number;
  profileData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInPost {
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
  images?: string[]; // Array of image URLs
  postType?: string; // Type of post (text, image, video, etc.)
  url?: string; // LinkedIn post URL
}

export interface CommenterDetails {
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
}

export interface TermMatch {
  term: string;
  frequency: number;
  contexts: string[];
  weight: number;
}

export interface RelevanceScore {
  score: number;
  explanation: {
    matchedBoostTerms: TermMatch[];
    matchedDownTerms: TermMatch[];
    contentAnalysis: {
      businessRelevant: number;
      promotional: number;
      personal: number;
    };
    // New professional analysis fields
    experienceAnalysis?: {
      yearsInIndustry: number;
      careerConsistency: number;
      relevantExperience: number;
    };
    credibilitySignals?: string[];
    redFlags?: string[];
  };
  recommendations: string[];
  confidence: number;
}

export interface UserFeedback {
  id: string;
  sessionId: string;
  commenterId: string;
  userId: string;
  rating: number;
  feedbackText?: string;
  isRelevant?: boolean;
  notes?: string;
  createdAt: string;
}

export interface APIRateLimit {
  id: string;
  userId?: string;
  ipAddress?: string;
  endpoint: string;
  requestCount: number;
  windowStart: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInCache {
  id: string;
  cacheKey: string;
  data: any;
  expiresAt: string;
  createdAt: string;
}

// API Request/Response Types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    lastLoginAt: string;
  };
  token: string;
  refreshToken: string;
}

export interface ExtractCommentsRequest {
  postUrl: string;
  maxComments?: number;
}

export interface ExtractCommentsResponse {
  sessionId: string;
  post: {
    id: string;
    url: string;
  };
  comments: CommentData[];
  totalComments: number;
}

export interface RelevanceScoreRequest {
  commenterId: string;
  boostTerms: string[];
  downTerms: string[];
  analysisDepth: 'basic' | 'detailed';
}

export interface RelevanceScoreResponse {
  score: number;
  explanation: {
    matchedBoostTerms: TermMatch[];
    matchedDownTerms: TermMatch[];
    contentAnalysis: {
      businessRelevant: number;
      promotional: number;
      personal: number;
    };
    // New professional analysis fields
    experienceAnalysis?: {
      yearsInIndustry: number;
      careerConsistency: number;
      relevantExperience: number;
    };
    credibilitySignals?: string[];
    redFlags?: string[];
  };
  recommendations: string[];
  confidence: number;
}

export interface CommenterDetailsResponse {
  commenter: CommenterDetails;
}

export interface FeedbackRequest {
  sessionId: string;
  commenterId: string;
  rating: number;
  feedbackText?: string;
  isRelevant?: boolean;
  notes?: string;
}

export interface FeedbackResponse {
  feedback: UserFeedback;
}

// Enhanced Feedback Loop Types

export type FeedbackType = 'binary' | 'detailed' | 'outcome' | 'bulk' | 'implicit';
export type FeedbackStatus = 'pending' | 'processed' | 'incorporated' | 'rejected';
export type LearningStage = 'collecting' | 'processing' | 'validating' | 'deploying' | 'monitoring';
export type PreferenceWeight = 'low' | 'medium' | 'high' | 'critical';

export interface EnhancedUserFeedback {
  id: string;
  userId: string;
  teamId?: string;
  sessionId?: string;
  commenterId?: string;
  analysisId?: string;
  
  // Feedback metadata
  feedbackType: FeedbackType;
  feedbackStatus: FeedbackStatus;
  priority: number;
  
  // Core feedback data
  overallRating?: number; // 1-10 scale
  isRelevant?: boolean;
  confidenceScore?: number; // 0-1 scale
  
  // Factor-specific ratings for detailed feedback
  factorRatings?: {
    contentRelevance?: number;
    professionalFit?: number;
    timing?: number;
    companyMatch?: number;
    roleMatch?: number;
    [key: string]: number | undefined;
  };
  correctionFlags?: string[]; // ["industry_classification", "seniority_level"]
  
  // Text feedback
  feedbackText?: string;
  improvementSuggestions?: string;
  additionalNotes?: string;
  
  // Outcome-based tracking
  outcomeData?: {
    contacted?: boolean;
    contactMethod?: string;
    responded?: boolean;
    responseTime?: number; // hours
    responseQuality?: number; // 1-5
    meetingScheduled?: boolean;
    meetingCompleted?: boolean;
    opportunityCreated?: boolean;
    dealClosed?: boolean;
    actualValue?: number;
    outcome?: string; // 'great_conversation' | 'not_a_fit' | 'no_response' | 'haven_not_reached_out'
  };
  successIndicators?: {
    conversationQuality?: number;
    opportunityPotential?: number;
    followUpLikelihood?: number;
  };
  
  // Context preservation
  analysisContext?: {
    originalScore?: number;
    scoringFactors?: any;
    boostTermsUsed?: string[];
    downTermsUsed?: string[];
    modelVersion?: string;
  };
  userContext?: {
    preferencesAtTime?: any;
    userState?: string;
    sessionContext?: any;
  };
  
  // Processing metadata
  processingAttempts: number;
  lastProcessedAt?: string;
  processingError?: string;
  learningWeight: number;
  
  // Device and source info
  sourceIp?: string;
  userAgent?: string;
  deviceInfo?: any;
  
  // Timestamps
  submittedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferenceProfile {
  id: string;
  userId: string;
  teamId?: string;
  
  // Learned preferences from feedback
  industryWeights: {
    [industry: string]: {
      weight: number;
      confidence: number;
      sampleSize: number;
      lastUpdated: string;
    };
  };
  rolePreferences: {
    [role: string]: {
      positiveRate: number;
      totalSamples: number;
      averageRating: number;
    };
  };
  companySizePreferences: {
    [size: string]: {
      weight: number;
      confidence: number;
    };
  };
  
  // Content and style preferences
  contentPreferences: {
    [contentType: string]: number; // Modifier values like +0.3, -0.2
  };
  communicationStyleWeights: {
    formal?: number;
    casual?: number;
    technical?: number;
    business?: number;
  };
  timingPreferences: {
    [timingFactor: string]: number;
  };
  
  // Success and failure patterns
  successPatterns: {
    commonCharacteristics?: string[];
    keyIndicators?: string[];
    optimalScoreRange?: [number, number];
  };
  failurePatterns: {
    warningSignals?: string[];
    commonMistakes?: string[];
    avoidanceRules?: string[];
  };
  
  // Profile metadata
  totalFeedbackCount: number;
  lastSignificantUpdate?: string;
  learningConfidence: number; // 0-1
  modelVersion: string;
  
  // Performance tracking
  accuracyTrend: Array<{
    date: string;
    accuracy: number;
    sampleSize: number;
  }>;
  recentPerformance?: number;
  improvementRate?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface TeamLearningProfile {
  id: string;
  teamId: string;
  organizationId?: string;
  
  // Team metadata
  teamName?: string;
  teamType?: string; // 'sales', 'marketing', 'recruiting'
  teamSize: number;
  activeMembers: number;
  
  // Aggregated learning data
  collectivePreferences: {
    [key: string]: any; // Merged preferences from team members
  };
  consensusPatterns: {
    [key: string]: any; // Patterns agreed upon by majority
  };
  diversePerspectives: {
    [key: string]: any; // Areas where team members differ
  };
  
  // Performance metrics
  teamAccuracy?: number;
  individualVsTeamBenefit?: number;
  knowledgeTransferRate?: number;
  
  // Quality assurance
  outlierDetection: {
    detectedOutliers?: string[];
    patterns?: any;
  };
  qualityScores: {
    overallQuality?: number;
    consistencyScore?: number;
    contributionBalance?: number;
  };
  
  // Collaboration metrics
  feedbackDistribution: {
    [userId: string]: {
      count: number;
      quality: number;
      lastContribution: string;
    };
  };
  expertiseAreas: {
    [userId: string]: string[]; // Areas where each member excels
  };
  
  lastAggregation?: string;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPipelineRun {
  id: string;
  runType: 'individual' | 'team' | 'global';
  stage: LearningStage;
  
  // Target identification
  userId?: string; // For individual learning
  teamId?: string; // For team learning
  
  // Processing data
  feedbackCount: number;
  feedbackIds: string[];
  newPatternsDiscovered: number;
  patternsUpdated: number;
  
  // Model updates
  modelChanges: {
    weightsUpdated?: string[];
    rulesAdded?: string[];
    rulesRemoved?: string[];
    accuracyImpact?: number;
  };
  previousAccuracy?: number;
  predictedAccuracy?: number;
  actualAccuracy?: number;
  
  // Performance and validation
  validationResults: {
    testSetAccuracy?: number;
    crossValidationScore?: number;
    aBTestResults?: any;
  };
  rollbackData?: any; // Data needed for rollback
  
  // Processing metadata
  processingDuration?: number; // seconds
  resourcesUsed?: {
    cpuTime?: number;
    memoryUsed?: number;
    diskUsed?: number;
  };
  errorLog?: Array<{
    timestamp: string;
    level: 'warning' | 'error' | 'info';
    message: string;
    details?: any;
  }>;
  
  // Status and timing
  startedAt: string;
  completedAt?: string;
  deployedAt?: string;
  nextScheduledRun?: string;
  
  // Flags
  isSuccessful: boolean;
  requiresManualReview: boolean;
  autoRollbackEnabled: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisSnapshot {
  id: string;
  analysisId: string;
  sessionId: string;
  commenterId: string;
  userId: string;
  
  // Analysis data at time of scoring
  originalScore: number;
  scoringFactors: {
    [factor: string]: {
      value: number;
      weight: number;
      contribution: number;
    };
  };
  boostTermsUsed: string[];
  downTermsUsed: string[];
  modelVersion: string;
  
  // Context snapshots
  userPreferencesSnapshot?: UserPreferenceProfile;
  teamPreferencesSnapshot?: TeamLearningProfile;
  algorithmVersion: string;
  
  // Detailed analysis results
  contentAnalysis: {
    businessRelevance: number;
    technicalDepth: number;
    sentimentScore: number;
    keywordMatches: string[];
    topics: string[];
  };
  profileAnalysis: {
    roleMatch: number;
    industryMatch: number;
    seniorityMatch: number;
    companyMatch: number;
    networkStrength: number;
  };
  timingAnalysis: {
    recentActivityScore: number;
    engagementTrend: number;
    responseLikelihood: number;
  };
  
  // Processing metadata
  analysisDuration?: number; // milliseconds
  confidenceMetrics: {
    overallConfidence: number;
    factorConfidence: { [key: string]: number };
    uncertaintyAreas: string[];
  };
  
  createdAt: string;
}

export interface OutcomeTracking {
  id: string;
  feedbackId: string;
  commenterId: string;
  userId: string;
  
  // Contact and outreach results
  contacted: boolean;
  contactMethod?: string;
  initialResponse: boolean;
  responseTime?: number; // hours
  responseQuality?: number; // 1-5
  
  // Meeting and engagement outcomes
  meetingRequested: boolean;
  meetingScheduled: boolean;
  meetingCompleted: boolean;
  meetingOutcome?: string;
  
  // Business outcomes
  opportunityCreated: boolean;
  opportunityValue?: number;
  dealClosed: boolean;
  closeDate?: string;
  actualDealValue?: number;
  
  // Retrospective assessment
  originalPredictionAccuracy?: number; // 1-10
  factorsMostPredictive: string[];
  factorsLeastPredictive: string[];
  
  // Learning insights
  unexpectedOutcomes?: string;
  improvementSuggestions?: string;
  
  // Timeline
  contactDate?: string;
  firstResponseDate?: string;
  lastInteractionDate?: string;
  outcomeRecordedDate: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface DataPrivacyControls {
  id: string;
  userId: string;
  teamId?: string;
  
  // Consent and permissions
  learningConsentGiven: boolean;
  teamSharingEnabled: boolean;
  outcomeTrackingEnabled: boolean;
  dataRetentionPreference: number; // days
  
  // Privacy settings
  anonymizeInTeamLearning: boolean;
  excludeFromGlobalLearning: boolean;
  feedbackVisibility: 'private' | 'team' | 'organisation';
  
  // Data control requests
  dataExportRequested: boolean;
  dataExportCompletedAt?: string;
  dataDeletionRequested: boolean;
  dataDeletionScheduledAt?: string;
  
  // Audit trail
  consentUpdatedAt?: string;
  privacyPolicyVersion?: string;
  gdprComplianceVerified: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackProcessingCache {
  id: string;
  cacheKey: string;
  cacheType: string; // 'user_preferences', 'team_patterns', 'model_predictions'
  
  // Cached data
  cachedData: any;
  dataVersion?: string;
  dependencies?: string[]; // IDs this cache depends on
  
  // Cache metadata
  computationCost?: number;
  accessFrequency: number;
  lastAccessed: string;
  
  // Expiration and invalidation
  expiresAt: string;
  invalidated: boolean;
  invalidationReason?: string;
  
  createdAt: string;
}

// Request/Response types for enhanced feedback APIs

export interface BinaryFeedbackRequest {
  sessionId?: string;
  commenterId?: string;
  analysisId?: string;
  isRelevant: boolean;
  confidenceScore?: number;
  notes?: string;
}

export interface DetailedFeedbackRequest {
  sessionId?: string;
  commenterId?: string;
  analysisId?: string;
  overallRating: number; // 1-10
  factorRatings: {
    contentRelevance?: number;
    professionalFit?: number;
    timing?: number;
    companyMatch?: number;
    roleMatch?: number;
  };
  correctionFlags?: string[];
  feedbackText?: string;
  improvementSuggestions?: string;
}

export interface OutcomeFeedbackRequest {
  feedbackId: string;
  outcomeData: {
    contacted: boolean;
    contactMethod?: string;
    responded: boolean;
    responseTime?: number;
    responseQuality?: number;
    meetingScheduled: boolean;
    meetingCompleted?: boolean;
    meetingOutcome?: string;
    opportunityCreated: boolean;
    opportunityValue?: number;
    dealClosed?: boolean;
    actualDealValue?: number;
  };
  retrospectiveNotes?: string;
}

export interface BulkFeedbackRequest {
  feedback: Array<{
    commenterId: string;
    isRelevant: boolean;
    rating?: number;
    notes?: string;
  }>;
  sessionId: string;
}

export interface LearningStatusResponse {
  userId: string;
  teamId?: string;
  personalLearning: {
    feedbackCount: number;
    recentFeedbackCount: number;
    learningConfidence: number;
    readyForUpdate: boolean;
    lastUpdate?: string;
  };
  teamLearning?: {
    teamAccuracy?: number;
    contributionRank?: number;
    benefitFromTeam?: number;
  };
  improvementMetrics: {
    accuracyTrend: number[];
    recentImprovement: number;
    predictiveFactors: string[];
  };
}

export interface FeedbackAnalyticsResponse {
  userId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalFeedback: number;
    feedbackByType: { [type: string]: number };
    averageRating: number;
    accuracyImprovement: number;
    responseTime: number; // average response time in hours
  };
  insights: {
    topPerformingFactors: string[];
    areasForImprovement: string[];
    recommendedActions: string[];
  };
  trends: {
    feedbackFrequency: Array<{ date: string; count: number }>;
    accuracyOverTime: Array<{ date: string; accuracy: number }>;
  };
}

// Error types
export interface APIError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}