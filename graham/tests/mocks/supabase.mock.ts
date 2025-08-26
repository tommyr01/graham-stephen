/**
 * Supabase Mock for Testing
 * Provides mock database responses for test scenarios
 */

export const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  
  // Auth mock
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },

  // Storage mock
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn().mockResolvedValue({ data: null, error: null }),
    download: jest.fn().mockResolvedValue({ data: null, error: null }),
    remove: jest.fn().mockResolvedValue({ data: null, error: null }),
    list: jest.fn().mockResolvedValue({ data: [], error: null }),
  }
};

// Mock data factories
export const mockTrainingDecision = {
  id: 'training-123',
  prospect_id: 'prospect-123',
  decision: 'contact',
  confidence: 85,
  voice_transcription: 'This prospect looks great - strong M&A background',
  reasoning: 'High relevance score and quality content',
  prospect_snapshot: {
    basicInfo: {
      name: 'John Doe',
      industry: 'Investment Banking',
      role: 'M&A Advisor',
      company: 'Elite Partners'
    },
    experienceAnalysis: [
      {
        title: 'M&A Advisor',
        years: 6,
        relevanceScore: 0.95
      }
    ],
    contentAnalysis: {
      avgAuthenticity: 8.2,
      avgExpertise: 8.5,
      redFlagCount: 0
    }
  },
  created_at: '2024-01-15T10:00:00Z'
};

export const mockPredictionResult = {
  id: 'prediction-456',
  prospect_id: 'prospect-456',
  predicted_decision: 'contact',
  confidence_score: 78,
  reasoning: {
    primaryFactors: ['Strong M&A experience', 'High-quality content'],
    concerningSignals: [],
    contentQuality: {
      overallQuality: 'high',
      authenticityScore: 8.2,
      expertiseLevel: 8.5,
      aiContentPercentage: 15,
      redFlagCount: 0
    }
  },
  matched_patterns: ['high_experience_contact'],
  similar_prospects: [],
  model_version: 'v2.0',
  processing_time_ms: 2500,
  created_at: '2024-01-15T11:00:00Z'
};

export const mockDecisionPattern = {
  id: 'pattern-789',
  pattern_type: 'experience_threshold',
  trigger_conditions: {
    field: 'yearsInIndustry',
    operator: 'greater_than_equal',
    value: 5
  },
  expected_outcome: 'contact',
  confidence: 0.85,
  created_from_decisions: ['training-123', 'training-124'],
  created_at: '2024-01-10T09:00:00Z'
};

// Mock response generators
export const generateMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error
});

export const generateMockTrainingDecisions = (count: number = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockTrainingDecision,
    id: `training-${100 + index}`,
    prospect_id: `prospect-${100 + index}`,
    decision: index % 3 === 0 ? 'skip' : 'contact',
    confidence: 70 + (index * 5),
    prospect_snapshot: {
      ...mockTrainingDecision.prospect_snapshot,
      basicInfo: {
        ...mockTrainingDecision.prospect_snapshot.basicInfo,
        name: `Test User ${index + 1}`
      }
    }
  }));
};

export const generateMockPredictionResults = (count: number = 3) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockPredictionResult,
    id: `prediction-${200 + index}`,
    prospect_id: `prospect-${200 + index}`,
    confidence_score: 60 + (index * 10),
    processing_time_ms: 2000 + (index * 500)
  }));
};

// Configure mock responses for different scenarios
export const setupMockSupabaseResponses = () => {
  // Training decisions mock
  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === 'training_decisions') {
      return {
        ...mockSupabaseClient,
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(
          generateMockSupabaseResponse(generateMockTrainingDecisions())
        )
      };
    }
    
    if (table === 'prediction_results') {
      return {
        ...mockSupabaseClient,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          generateMockSupabaseResponse(null) // No cached prediction by default
        ),
        insert: jest.fn().mockResolvedValue(
          generateMockSupabaseResponse({ id: 'new-prediction' })
        )
      };
    }
    
    if (table === 'decision_patterns') {
      return {
        ...mockSupabaseClient,
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(
          generateMockSupabaseResponse([mockDecisionPattern])
        )
      };
    }

    // Default empty response
    return {
      ...mockSupabaseClient,
      select: jest.fn().mockResolvedValue(generateMockSupabaseResponse([]))
    };
  });
};

// Error simulation helpers
export const simulateSupabaseError = (errorMessage: string, code?: string) => ({
  data: null,
  error: {
    message: errorMessage,
    code: code || 'PGRST301',
    details: null,
    hint: null
  }
});

export const simulateSupabaseTimeout = () => simulateSupabaseError('Connection timeout', 'PGRST301');
export const simulateSupabaseConnectionError = () => simulateSupabaseError('Connection failed', 'PGRST116');
export const simulateSupabaseTableNotFound = () => simulateSupabaseError('Table not found', 'PGRST204');

// Reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach(method => {
    if (typeof method === 'function') {
      method.mockClear();
    }
  });
  
  if (mockSupabaseClient.auth) {
    Object.values(mockSupabaseClient.auth).forEach(method => {
      if (typeof method === 'function') {
        method.mockClear();
      }
    });
  }
  
  if (mockSupabaseClient.storage) {
    Object.values(mockSupabaseClient.storage).forEach(method => {
      if (typeof method === 'function') {
        method.mockClear();
      }
    });
  }
};