/**
 * Test Data Factory
 * Generates consistent test data for various test scenarios
 */

import type { ProspectData, ContentQualityAssessment, GrahamPrediction } from '@/lib/services/predictive-scoring-engine';

// Base prospect data templates
export const createHighQualityProspect = (overrides: Partial<ProspectData> = {}): ProspectData => ({
  id: 'high-quality-prospect-1',
  name: 'Sarah Johnson',
  headline: 'Senior M&A Director at Goldman Sachs',
  company: 'Goldman Sachs',
  location: 'New York, NY',
  industry: 'Investment Banking',
  role: 'Senior M&A Director',
  experience: [
    {
      title: 'Senior M&A Director',
      company: 'Goldman Sachs',
      start_date: { year: 2019 },
      end_date: { year: 2024 },
      description: 'Leading M&A transactions across multiple sectors, managed $2B+ in deal flow annually'
    },
    {
      title: 'M&A Vice President',
      company: 'JPMorgan Chase',
      start_date: { year: 2016 },
      end_date: { year: 2019 },
      description: 'Executed middle-market M&A deals in technology and healthcare sectors'
    },
    {
      title: 'Investment Banking Analyst',
      company: 'Morgan Stanley',
      start_date: { year: 2012 },
      end_date: { year: 2016 },
      description: 'Financial modeling, due diligence, and deal execution support'
    }
  ],
  recentPosts: [
    {
      id: 'hq-post-1',
      content: 'Delighted to announce the successful completion of our latest tech acquisition. The due diligence process revealed strong synergies and compelling value creation opportunities.',
      publishedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'hq-post-2', 
      content: 'Key trends I\'m seeing in the M&A market: increased focus on ESG factors, more competitive bidding processes, and growing importance of cultural fit in deal success.',
      publishedAt: '2024-01-12T14:30:00Z'
    },
    {
      id: 'hq-post-3',
      content: 'After 12 years in investment banking, I still find each M&A transaction uniquely challenging. The combination of financial analysis, strategic thinking, and relationship management never gets old.',
      publishedAt: '2024-01-08T09:15:00Z'
    }
  ],
  profileUrl: 'https://linkedin.com/in/sarahjohnson-ma',
  profilePicture: 'https://example.com/sarah-photo.jpg',
  ...overrides
});

export const createMediumQualityProspect = (overrides: Partial<ProspectData> = {}): ProspectData => ({
  id: 'medium-quality-prospect-1',
  name: 'Mike Thompson',
  headline: 'Business Development Manager at Tech Consulting Firm',
  company: 'TechConsult Solutions',
  location: 'Austin, TX',
  industry: 'Technology Consulting',
  role: 'Business Development Manager',
  experience: [
    {
      title: 'Business Development Manager',
      company: 'TechConsult Solutions',
      start_date: { year: 2021 },
      end_date: { year: 2024 },
      description: 'Driving business growth through strategic partnerships and client acquisition'
    },
    {
      title: 'Account Manager',
      company: 'Software Solutions Inc',
      start_date: { year: 2018 },
      end_date: { year: 2021 },
      description: 'Managing key client relationships and expansion opportunities'
    }
  ],
  recentPosts: [
    {
      id: 'mq-post-1',
      content: 'Excited about the growth opportunities in the tech consulting space. Always looking for ways to help our clients achieve their strategic goals.',
      publishedAt: '2024-01-14T11:00:00Z'
    },
    {
      id: 'mq-post-2',
      content: 'Great networking event last week! Met some incredible entrepreneurs building amazing companies. The innovation in our industry continues to impress.',
      publishedAt: '2024-01-09T16:45:00Z'
    }
  ],
  profileUrl: 'https://linkedin.com/in/mikethompson-biz',
  ...overrides
});

export const createLowQualityProspect = (overrides: Partial<ProspectData> = {}): ProspectData => ({
  id: 'low-quality-prospect-1',
  name: 'Marketing Guru Max',
  headline: 'Digital Marketing Ninja 🥷 | Lead Generation Expert | Passive Income Coach',
  company: 'Elite Marketing Solutions & Passive Income Academy',
  location: 'Remote (Traveling the World)',
  industry: 'Marketing Services',
  role: 'Marketing Consultant & Coach',
  experience: [
    {
      title: 'Digital Marketing Guru',
      company: 'Elite Marketing Solutions',
      start_date: { year: 2022 },
      end_date: { year: 2024 },
      description: 'Helping entrepreneurs make money fast through proven marketing strategies and lead generation systems'
    },
    {
      title: 'Social Media Marketing Specialist',
      company: 'Marketing Agency Pro',
      start_date: { year: 2020 },
      end_date: { year: 2022 },
      description: 'Generated thousands of leads for clients using secret marketing formulas'
    }
  ],
  recentPosts: [
    {
      id: 'lq-post-1',
      content: '🔥 ATTENTION ENTREPRENEURS! 🔥 Want to make money fast? My secret marketing formula GUARANTEES results! Limited time offer - DM me now! #PassiveIncome #MakeMoneyFast #MarketingGuru',
      publishedAt: '2024-01-15T08:00:00Z'
    },
    {
      id: 'lq-post-2',
      content: 'As a marketing ninja and lead generation rockstar, I help entrepreneurs achieve financial freedom! Work from home and earn $10K per month guaranteed! Act now! 💰💰💰',
      publishedAt: '2024-01-13T20:30:00Z'
    },
    {
      id: 'lq-post-3',
      content: 'Just closed another 6-figure deal using my exclusive marketing system! DM me to learn the secret formula that marketing agencies don\'t want you to know! Limited spots available!',
      publishedAt: '2024-01-11T19:15:00Z'
    }
  ],
  profileUrl: 'https://linkedin.com/in/marketinggurumax',
  ...overrides
});

// Content quality assessment factories
export const createHighQualityContentAnalysis = (overrides: Partial<ContentQualityAssessment> = {}): ContentQualityAssessment => ({
  overallQuality: 'high',
  authenticityScore: 8.5,
  expertiseLevel: 8.2,
  aiContentPercentage: 10,
  redFlagCount: 0,
  ...overrides
});

export const createMediumQualityContentAnalysis = (overrides: Partial<ContentQualityAssessment> = {}): ContentQualityAssessment => ({
  overallQuality: 'medium',
  authenticityScore: 6.2,
  expertiseLevel: 6.8,
  aiContentPercentage: 30,
  redFlagCount: 1,
  ...overrides
});

export const createLowQualityContentAnalysis = (overrides: Partial<ContentQualityAssessment> = {}): ContentQualityAssessment => ({
  overallQuality: 'low',
  authenticityScore: 3.5,
  expertiseLevel: 3.0,
  aiContentPercentage: 75,
  redFlagCount: 5,
  ...overrides
});

// Batch data generators
export const createProspectBatch = (count: number, quality: 'high' | 'medium' | 'low' | 'mixed' = 'mixed') => {
  const generators = {
    high: createHighQualityProspect,
    medium: createMediumQualityProspect,
    low: createLowQualityProspect
  };

  return Array.from({ length: count }, (_, index) => {
    let selectedQuality = quality;
    
    if (quality === 'mixed') {
      const qualityOptions = ['high', 'medium', 'low'] as const;
      selectedQuality = qualityOptions[index % 3];
    }
    
    const generator = generators[selectedQuality];
    return generator({
      id: `batch-prospect-${index + 1}`,
      name: `Batch User ${index + 1}`,
      profileUrl: `https://linkedin.com/in/batchuser${index + 1}`
    });
  });
};

// Specific test scenarios
export const createTimeoutTestProspect = (): ProspectData => ({
  ...createHighQualityProspect(),
  id: 'timeout-test-prospect',
  name: 'Timeout Test User',
  // Large amount of content that might cause processing delays
  recentPosts: Array.from({ length: 50 }, (_, index) => ({
    id: `timeout-post-${index}`,
    content: `This is a very long post content designed to test timeout scenarios. `.repeat(100),
    publishedAt: `2024-01-${String(Math.floor(index / 2) + 1).padStart(2, '0')}T10:00:00Z`
  }))
});

export const createMemoryTestProspect = (): ProspectData => ({
  ...createHighQualityProspect(),
  id: 'memory-test-prospect',
  name: 'Memory Test User',
  experience: Array.from({ length: 30 }, (_, index) => ({
    title: `Position ${index + 1}`,
    company: `Company ${index + 1}`,
    start_date: { year: 2024 - index },
    end_date: { year: 2024 - index + 1 },
    description: `This is a detailed description of role ${index + 1}. `.repeat(50)
  })),
  recentPosts: Array.from({ length: 100 }, (_, index) => ({
    id: `memory-post-${index}`,
    content: `Memory test post ${index + 1} with substantial content. `.repeat(20),
    publishedAt: `2024-01-${String(Math.floor(index / 4) + 1).padStart(2, '0')}T10:00:00Z`
  }))
});

// Error scenario data
export const createDatabaseErrorProspect = (): ProspectData => ({
  ...createHighQualityProspect(),
  id: 'database-error-test',
  name: 'Database Error Test'
});

export const createAIServiceErrorProspect = (): ProspectData => ({
  ...createHighQualityProspect(),
  id: 'ai-service-error-test',
  name: 'AI Service Error Test'
});

// Performance test data
export const createConcurrencyTestBatch = (concurrentRequests: number = 5) => {
  return Array.from({ length: concurrentRequests }, (_, index) => ({
    ...createHighQualityProspect({
      id: `concurrency-test-${index}`,
      name: `Concurrent User ${index + 1}`,
      recentPosts: [
        {
          id: `concurrent-post-${index}`,
          content: `M&A analysis content for concurrent test ${index + 1}. This content should be processed in parallel with other requests.`,
          publishedAt: '2024-01-15T10:00:00Z'
        }
      ]
    })
  }));
};

// Edge case data
export const createEmptyDataProspect = (): ProspectData => ({
  id: 'empty-data-prospect',
  name: '',
  headline: '',
  company: '',
  location: '',
  industry: '',
  role: '',
  experience: [],
  recentPosts: [],
  profileUrl: ''
});

export const createNullDataProspect = (): ProspectData => ({
  id: 'null-data-prospect',
  name: null as any,
  headline: null as any,
  company: null as any,
  location: null as any,
  industry: null as any,
  role: null as any,
  experience: null as any,
  recentPosts: null as any,
  profileUrl: null as any
});

export const createLargeContentProspect = (): ProspectData => ({
  ...createHighQualityProspect(),
  id: 'large-content-prospect',
  name: 'Large Content Test',
  recentPosts: [
    {
      id: 'large-post-1',
      content: 'M&A transaction analysis with extensive detail. '.repeat(1000),
      publishedAt: '2024-01-15T10:00:00Z'
    }
  ]
});

// Mock prediction results
export const createMockPrediction = (decision: 'contact' | 'skip' = 'contact', confidence: number = 75): GrahamPrediction => ({
  predictedDecision: decision,
  confidence,
  reasoning: {
    primaryFactors: decision === 'contact' ? 
      ['Strong M&A experience', 'High-quality professional content'] :
      ['Limited relevant experience', 'Low-quality content detected'],
    concerningSignals: decision === 'contact' ? 
      [] : 
      ['Marketing-heavy background', 'Multiple red flags in content'],
    contentQuality: decision === 'contact' ? 
      createHighQualityContentAnalysis() :
      createLowQualityContentAnalysis(),
    experienceMatch: {
      yearsInIndustry: decision === 'contact' ? 8 : 2,
      relevancyScore: decision === 'contact' ? 0.9 : 0.3,
      careerConsistency: decision === 'contact' ? 0.85 : 0.4,
      credibilitySignals: decision === 'contact' ? 
        ['Investment banking experience', 'Large deal experience'] :
        ['Limited professional experience'],
      analysisMethod: 'AI'
    },
    similarProspects: []
  },
  scoreBreakdown: {
    patternMatchScore: decision === 'contact' ? 2.5 : -1.5,
    similarityScore: decision === 'contact' ? 1.8 : -0.8,
    contentIntelligenceScore: decision === 'contact' ? 2.0 : -2.0,
    experienceScore: decision === 'contact' ? 3.0 : -2.0,
    redFlagPenalty: decision === 'contact' ? 0 : -2.5,
    finalScore: decision === 'contact' ? 9.3 : -8.8
  },
  learningMetadata: {
    patternsUsed: decision === 'contact' ? 3 : 2,
    similarProspectsFound: decision === 'contact' ? 5 : 2,
    dataQuality: decision === 'contact' ? 'high' : 'low',
    modelVersion: 'v2.0',
    predictionId: `pred_${Date.now()}_test`
  }
});

// Learning Loop Test Data Factories
export interface LearningSessionData {
  userId?: string;
  baselineAccuracy?: number;
  learningEnabled?: boolean;
}

export interface LinkedInProfileData {
  id?: string;
  name?: string;
  industry?: string;
  experience?: string;
  signals?: string[];
  background?: any;
}

export class TestDataFactory {
  /**
   * Create a learning session configuration
   */
  createLearningSession(overrides: Partial<LearningSessionData> = {}): LearningSessionData {
    return {
      userId: `test-user-${Date.now()}`,
      baselineAccuracy: 0.72,
      learningEnabled: true,
      ...overrides
    };
  }

  /**
   * Create LinkedIn profile data for learning tests
   */
  createLinkedInProfile(overrides: Partial<LinkedInProfileData> = {}): LinkedInProfileData {
    return {
      id: `profile-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: 'Test Professional',
      industry: 'Software',
      experience: 'Senior',
      signals: ['technical_expertise', 'leadership_experience'],
      background: {
        years_experience: 8,
        education: 'Computer Science',
        certifications: ['AWS', 'PMI'],
        company_size: 'Enterprise'
      },
      ...overrides
    };
  }

  /**
   * Create multiple LinkedIn profiles for testing
   */
  createLinkedInProfiles(count: number): LinkedInProfileData[] {
    return Array.from({ length: count }, (_, index) => 
      this.createLinkedInProfile({
        id: `profile-batch-${index}`,
        name: `Test Professional ${index + 1}`
      })
    );
  }

  /**
   * Create similar profiles for cross-profile learning tests
   */
  createSimilarProfiles(count: number): LinkedInProfileData[] {
    const baseProfile = {
      industry: 'Software',
      experience: 'Senior',
      signals: ['technical_leadership', 'saas_experience']
    };

    return Array.from({ length: count }, (_, index) => 
      this.createLinkedInProfile({
        ...baseProfile,
        id: `similar-profile-${index}`,
        name: `Similar Professional ${index + 1}`,
        // Add slight variations to test pattern generalization
        signals: [...baseProfile.signals, `variation_signal_${index}`]
      })
    );
  }

  /**
   * Create progressive profiles that should show learning improvement
   */
  createProgressiveProfiles(count: number): LinkedInProfileData[] {
    const industries = ['Software', 'Technology', 'SaaS', 'Cloud Computing', 'AI/ML'];
    const experiences = ['Senior', 'Lead', 'Principal', 'VP', 'Director'];
    
    return Array.from({ length: count }, (_, index) => 
      this.createLinkedInProfile({
        id: `progressive-profile-${index}`,
        name: `Progressive Professional ${index + 1}`,
        industry: industries[index % industries.length],
        experience: experiences[index % experiences.length],
        signals: [
          'technical_expertise',
          'leadership_experience',
          index > 1 ? 'innovation_focus' : 'team_management',
          index > 2 ? 'strategic_thinking' : 'project_delivery'
        ]
      })
    );
  }

  /**
   * Create validation profiles with known outcomes
   */
  createValidationProfiles(count: number): LinkedInProfileData[] {
    return Array.from({ length: count }, (_, index) => {
      const isHighQuality = index % 3 === 0; // Every 3rd profile is high quality
      
      return this.createLinkedInProfile({
        id: `validation-profile-${index}`,
        name: `Validation Professional ${index + 1}`,
        industry: isHighQuality ? 'Software' : 'Marketing',
        experience: isHighQuality ? 'Senior' : 'Junior',
        signals: isHighQuality 
          ? ['technical_expertise', 'leadership_experience', 'innovation_focus']
          : ['basic_experience', 'marketing_focus'],
        background: {
          ...this.createLinkedInProfile().background,
          expected_outcome: isHighQuality ? 'contact' : 'skip',
          confidence_level: isHighQuality ? 0.85 : 0.35
        }
      });
    });
  }

  /**
   * Create validation set for pattern testing
   */
  createValidationSet(count: number): LinkedInProfileData[] {
    return this.createValidationProfiles(count);
  }

  /**
   * Create biased profiles for overfitting tests
   */
  createBiasedProfiles(favoredIndustry: string, count: number): LinkedInProfileData[] {
    return Array.from({ length: count }, (_, index) => 
      this.createLinkedInProfile({
        id: `biased-profile-${index}`,
        name: `Biased Professional ${index + 1}`,
        industry: favoredIndustry,
        experience: 'Senior', // All have same experience level
        signals: ['industry_specific_signal', 'uniform_background'],
        background: {
          ...this.createLinkedInProfile().background,
          bias_indicator: true,
          industry: favoredIndustry
        }
      })
    );
  }

  /**
   * Create diverse profiles to test generalization
   */
  createDiverseProfiles(count: number): LinkedInProfileData[] {
    const industries = ['Fintech', 'Healthcare', 'Education', 'Retail', 'Manufacturing'];
    const experiences = ['Junior', 'Mid-level', 'Senior', 'Executive', 'Founder'];
    const signalSets = [
      ['technical_skills', 'problem_solving'],
      ['leadership', 'team_building'],
      ['innovation', 'strategic_thinking'],
      ['communication', 'client_focus'],
      ['operations', 'process_improvement']
    ];

    return Array.from({ length: count }, (_, index) => 
      this.createLinkedInProfile({
        id: `diverse-profile-${index}`,
        name: `Diverse Professional ${index + 1}`,
        industry: industries[index % industries.length],
        experience: experiences[index % experiences.length],
        signals: signalSets[index % signalSets.length],
        background: {
          ...this.createLinkedInProfile().background,
          diversity_factor: index / count
        }
      })
    );
  }

  /**
   * Generate relevant feedback for a profile
   */
  generateRelevantFeedback(profile: LinkedInProfileData): string {
    const feedbackTemplates = {
      Software: [
        "Strong technical background with solid software engineering experience",
        "Excellent SaaS experience and understanding of scalable architectures",
        "Good technical leadership skills and team management experience"
      ],
      Technology: [
        "Impressive technology background with innovative problem-solving",
        "Strong technical expertise in emerging technologies",
        "Good balance of technical depth and business understanding"
      ],
      Marketing: [
        "Limited technical background but strong marketing skills",
        "Focuses more on marketing and less on technical implementation",
        "Marketing-heavy profile without deep technical expertise"
      ]
    };

    const templates = feedbackTemplates[profile.industry as keyof typeof feedbackTemplates] || 
                     feedbackTemplates.Technology;
    
    const baseTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Add experience-specific feedback
    if (profile.experience === 'Senior') {
      return `${baseTemplate}. Strong senior-level experience with proven track record.`;
    } else if (profile.experience === 'Lead') {
      return `${baseTemplate}. Excellent leadership experience and team guidance skills.`;
    }
    
    return baseTemplate;
  }

  /**
   * Generate accurate feedback for training
   */
  generateAccurateFeedback(profile: LinkedInProfileData): string {
    const isHighQuality = profile.industry === 'Software' && 
                         profile.experience === 'Senior' &&
                         profile.signals?.includes('technical_expertise');

    if (isHighQuality) {
      return "Excellent candidate with strong technical background and proven leadership experience in software development";
    } else {
      return "Limited technical experience, may not be the best fit for our technical requirements";
    }
  }

  /**
   * Generate general feedback for testing
   */
  generateFeedback(profile: LinkedInProfileData): string {
    return this.generateRelevantFeedback(profile);
  }

  /**
   * Create profiles for testing purposes
   */
  createProfiles(count: number): LinkedInProfileData[] {
    return this.createLinkedInProfiles(count);
  }
}

// Test scenario configurations
export const TEST_SCENARIOS = {
  PERFORMANCE: {
    FAST_RESPONSE: { timeoutMs: 1000, expectedResponseTime: 800 },
    MEDIUM_RESPONSE: { timeoutMs: 5000, expectedResponseTime: 3000 },
    SLOW_RESPONSE: { timeoutMs: 15000, expectedResponseTime: 10000 }
  },
  BATCH_PROCESSING: {
    SMALL_BATCH: { size: 3, expectedParallelSpeedup: 1.5 },
    MEDIUM_BATCH: { size: 5, expectedParallelSpeedup: 2.0 },
    LARGE_BATCH: { size: 10, expectedParallelSpeedup: 3.0 }
  },
  ERROR_HANDLING: {
    QUOTA_EXCEEDED: 'quota_exceeded',
    SERVICE_TIMEOUT: 'service_timeout',
    NETWORK_ERROR: 'network_error',
    DATABASE_ERROR: 'database_error'
  },
  LEARNING_LOOP: {
    SUCCESS_METRICS: {
      MIN_ACCURACY_IMPROVEMENT: 0.15,
      MIN_PATTERN_QUALITY: 0.70,
      MAX_PROCESSING_TIME: 500,
      MIN_USER_SATISFACTION: 4.0
    },
    PERFORMANCE_BENCHMARKS: {
      REAL_TIME_LEARNING: 200,      // milliseconds
      VOICE_FEEDBACK_PROCESSING: 500, // milliseconds
      SESSION_LEARNING_UPDATE: 100,   // milliseconds
      ENHANCED_ANALYSIS_OVERHEAD: 300 // milliseconds
    },
    VALIDATION_THRESHOLDS: {
      PATTERN_CONFIDENCE: 0.70,
      LEARNING_VELOCITY: 0.10,
      CROSS_PROFILE_SUCCESS: 0.80,
      OVERFITTING_DETECTION: 0.05
    }
  }
} as const;