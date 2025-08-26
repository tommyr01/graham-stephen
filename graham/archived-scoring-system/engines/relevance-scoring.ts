import { TermMatch, RelevanceScore } from './types';

// Graham's M&A/Business Brokerage specific keywords (HIGH VALUE)
const MA_BROKERAGE_KEYWORDS = [
  'business broker', 'business brokerage', 'broker', 'brokerage', 'm&a advisor', 'merger', 'acquisition', 
  'deal flow', 'valuation', 'business valuation', 'due diligence', 'ebitda',
  'sell business', 'buy business', 'business exit', 'exit strategy', 'transaction advisory',
  'investment banker', 'middle market', 'lower middle market', 'deal sourcing',
  'business appraisal', 'earnout', 'asset sale', 'stock sale', 'closing table',
  'sunbelt', 'sunbelt business brokers', 'mergers & acquisitions', 'm&a'
];

// Related professional services (MEDIUM VALUE)  
const RELATED_PROFESSIONAL_KEYWORDS = [
  'business coach', 'business consultant', 'investment advisor', 'private equity',
  'family office', 'wealth management', 'corporate finance', 'investment banking',
  'cpa', 'attorney', 'business attorney', 'tax advisor', 'financial advisor',
  'entrepreneur', 'ceo', 'cfo', 'president', 'owner', 'founder'
];

// Generic business keywords (LOW VALUE)
const GENERIC_BUSINESS_KEYWORDS = [
  'sales', 'marketing', 'business', 'strategy', 'growth', 'revenue', 'profit',
  'client', 'customer', 'lead', 'prospect', 'deal', 'negotiation', 'closing',
  'partnership', 'collaboration', 'networking', 'industry', 'market',
  'solution', 'service', 'product', 'innovation'
];

// RED FLAG keywords (NEGATIVE VALUE)
const RED_FLAG_KEYWORDS = [
  'lead generation', 'lead gen', 'marketing agency', 'content agency', 'social media',
  'influencer', 'guru', 'coach certification', 'recent pivot', 'new venture',
  'startup founder', 'serial entrepreneur', 'just launched', 'exciting opportunity'
];

// Keywords that typically indicate personal/off-topic content
const DEFAULT_PERSONAL_KEYWORDS = [
  'vacation', 'holiday', 'family', 'weekend', 'personal', 'birthday',
  'wedding', 'anniversary', 'cooking', 'recipe', 'sports', 'game',
  'movie', 'music', 'hobby', 'travel', 'pet', 'dog', 'cat',
  'weather', 'politics', 'religion', 'health', 'fitness', 'gym'
];

// Promotional content indicators (usually lower relevance for B2B prospecting)
const PROMOTIONAL_KEYWORDS = [
  'discount', 'sale', 'offer', 'promotion', 'deal', 'free', 'limited time',
  'buy now', 'click here', 'learn more', 'sign up', 'register',
  'webinar', 'ebook', 'whitepaper', 'download', 'subscribe'
];

export interface ScoringWeights {
  boostTermWeight: number;
  downTermWeight: number;
  businessRelevanceWeight: number;
  promotionalPenalty: number;
  personalPenalty: number;
  engagementBonus: number;
  profileCompleteness: number;
  // New professional experience weights
  experienceWeight: number;
  credibilityWeight: number;
  redFlagPenalty: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  boostTermWeight: 2.5,  // Reduced since experience is now primary
  downTermWeight: -2.0,
  businessRelevanceWeight: 1.0,  // Reduced 
  promotionalPenalty: -0.5,
  personalPenalty: -1.0,
  engagementBonus: 0.3,  // Reduced
  profileCompleteness: 0.3,  // Reduced
  // New professional experience weights (PRIMARY FACTORS)
  experienceWeight: 4.0,  // Most important factor
  credibilityWeight: 2.0,  // Second most important
  redFlagPenalty: -3.0,    // Strong negative impact
};

// Extract and analyze text for keyword matches
export function analyzeTextForKeywords(
  text: string,
  keywords: string[],
  caseSensitive: boolean = false
): TermMatch[] {
  if (!text || !keywords.length) return [];

  const processedText = caseSensitive ? text : text.toLowerCase();
  const matches: TermMatch[] = [];

  keywords.forEach(keyword => {
    const processedKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    
    // Use regex to find all matches with word boundaries
    const regex = new RegExp(`\\b${processedKeyword}\\b`, 'gi');
    const keywordMatches = processedText.match(regex);
    
    if (keywordMatches) {
      const frequency = keywordMatches.length;
      
      // Extract contexts (surrounding text)
      const contexts: string[] = [];
      let match;
      const contextRegex = new RegExp(`.{0,30}\\b${processedKeyword}\\b.{0,30}`, 'gi');
      
      while ((match = contextRegex.exec(text)) !== null) {
        contexts.push(match[0].trim());
      }

      matches.push({
        term: keyword,
        frequency,
        contexts: contexts.slice(0, 3), // Limit to first 3 contexts
        weight: calculateKeywordWeight(keyword, frequency),
      });
    }
  });

  return matches;
}

// Calculate weight for a specific keyword based on importance and frequency
function calculateKeywordWeight(keyword: string, frequency: number): number {
  // Base weight starts at 1.0
  let weight = 1.0;
  
  // High-value keywords get higher weights
  const highValueKeywords = ['ceo', 'cto', 'vp', 'director', 'manager', 'lead', 'sales', 'revenue'];
  if (highValueKeywords.some(hvk => keyword.toLowerCase().includes(hvk))) {
    weight += 0.5;
  }
  
  // Frequency multiplier (logarithmic to prevent spam)
  weight *= Math.log(frequency + 1);
  
  return weight;
}

// Analyze content type distribution
export function analyzeContentTypes(
  text: string,
  recentPosts: any[] = []
): { businessRelevant: number; promotional: number; personal: number } {
  const allText = [text, ...recentPosts.map(post => post.content || post.text || '')].join(' ');
  
  const businessMatches = analyzeTextForKeywords(allText, GENERIC_BUSINESS_KEYWORDS);
  const promotionalMatches = analyzeTextForKeywords(allText, PROMOTIONAL_KEYWORDS);
  const personalMatches = analyzeTextForKeywords(allText, DEFAULT_PERSONAL_KEYWORDS);
  
  const totalMatches = businessMatches.length + promotionalMatches.length + personalMatches.length;
  
  if (totalMatches === 0) {
    return { businessRelevant: 0.5, promotional: 0.25, personal: 0.25 };
  }
  
  return {
    businessRelevant: businessMatches.length / totalMatches,
    promotional: promotionalMatches.length / totalMatches,
    personal: personalMatches.length / totalMatches,
  };
}

// Calculate engagement score based on post metrics
export function calculateEngagementScore(stats: any): number {
  if (!stats) return 0;
  
  const likes = stats.totalReactions || stats.likes || 0;
  const comments = stats.commentsCount || stats.comments || 0;
  const shares = stats.shares || stats.reposts || 0;
  
  // Weighted engagement score
  const engagementScore = (likes * 1) + (comments * 3) + (shares * 5);
  
  // Normalize to 0-1 scale (logarithmic)
  return Math.min(Math.log(engagementScore + 1) / Math.log(1000), 1.0);
}

// Calculate profile completeness score
export function calculateProfileCompletenessScore(commenter: any): number {
  let score = 0;
  const maxScore = 6;
  
  if (commenter.name) score++;
  if (commenter.headline) score++;
  if (commenter.company) score++;
  if (commenter.location) score++;
  if (commenter.profilePicture) score++;
  if (commenter.followersCount > 0 || commenter.connectionsCount > 0) score++;
  
  return score / maxScore;
}

// Calculate professional experience score (Graham's primary criteria)
export function calculateExperienceScore(profileData: any): {
  score: number;
  details: {
    yearsInIndustry: number;
    careerConsistency: number;
    relevantExperience: number;
  };
} {
  if (!profileData?.experience) {
    return {
      score: 0,
      details: { yearsInIndustry: 0, careerConsistency: 0, relevantExperience: 0 }
    };
  }

  const experience = Array.isArray(profileData.experience) ? profileData.experience : [];
  
  const currentYear = new Date().getFullYear();
  
  // Calculate years in M&A/deals/brokerage industry (FIXED CALCULATION)
  let yearsInIndustry = 0;
  let relevantPositions = 0;
  let totalPositions = experience.length;
  
  // Track M&A vs related roles separately for better accuracy
  const maRoles: Array<{start: number, end: number, isDirectMA: boolean}> = [];
  
  experience.forEach((job: any) => {
    const title = (job.title || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const allJobText = `${title} ${company} ${description}`;
    
    // Check if this job is DIRECTLY M&A/brokerage focused
    const directMAMatches = MA_BROKERAGE_KEYWORDS.filter(keyword => 
      allJobText.includes(keyword.toLowerCase())
    );
    
    // Check if this job is related but not direct M&A
    const relatedMatches = RELATED_PROFESSIONAL_KEYWORDS.filter(keyword =>
      allJobText.includes(keyword.toLowerCase())
    );
    
    const isDirectMA = directMAMatches.length > 0;
    const isRelated = relatedMatches.length > 0;
    
    if (isDirectMA || isRelated) {
      relevantPositions++;
      
      // Calculate duration for this position
      const startYear = extractYear(job.start_date);
      const endYear = job.end_date ? extractYear(job.end_date) : currentYear;
      
      if (startYear && endYear >= startYear) {
        maRoles.push({
          start: startYear,
          end: endYear,
          isDirectMA: isDirectMA
        });
      }
    }
  });
  
  // Calculate continuous M&A experience more accurately
  if (maRoles.length > 0) {
    // Sort roles by start date
    maRoles.sort((a, b) => a.start - b.start);
    
    // Merge overlapping periods and calculate total time
    const mergedPeriods: Array<{start: number, end: number, hasDirectMA: boolean}> = [];
    
    for (const role of maRoles) {
      const lastPeriod = mergedPeriods[mergedPeriods.length - 1];
      
      if (lastPeriod && role.start <= lastPeriod.end + 1) {
        // Merge overlapping/adjacent periods
        lastPeriod.end = Math.max(lastPeriod.end, role.end);
        lastPeriod.hasDirectMA = lastPeriod.hasDirectMA || role.isDirectMA;
      } else {
        // Start new period
        mergedPeriods.push({
          start: role.start,
          end: role.end,
          hasDirectMA: role.isDirectMA
        });
      }
    }
    
    // Calculate total years, prioritizing direct M&A experience
    yearsInIndustry = mergedPeriods.reduce((total, period) => {
      const periodYears = period.end - period.start + 1;
      // Weight direct M&A experience fully, related experience at 0.5x
      return total + (period.hasDirectMA ? periodYears : periodYears * 0.5);
    }, 0);
    
    // Round to avoid fractional years for display
    yearsInIndustry = Math.round(yearsInIndustry * 10) / 10;
  }

  // Experience scoring based on Graham's criteria
  let experienceScore = 0;
  
  // Years in industry scoring (Graham's key criteria)
  if (yearsInIndustry >= 10) {
    experienceScore += 4.0;  // Gold standard
  } else if (yearsInIndustry >= 5) {
    experienceScore += 2.5;  // Good
  } else if (yearsInIndustry >= 3) {
    experienceScore += 1.0;  // Minimum viable
  } else {
    experienceScore -= 2.0;  // "Not a serious deal maker"
  }
  
  // Enhanced career consistency analysis
  const consistencyRatio = totalPositions > 0 ? relevantPositions / totalPositions : 0;
  
  // Detect major career pivots vs. natural progression
  const careerPivotAnalysis = analyzeCareerProgression(experience);
  
  // Apply consistency scoring with pivot detection
  if (careerPivotAnalysis.hasRecentPivot && yearsInIndustry < 3) {
    experienceScore -= 2.0;  // Major penalty for recent career pivot with minimal experience
  } else if (consistencyRatio >= 0.8 && !careerPivotAnalysis.hasRecentPivot) {
    experienceScore += 1.0;  // Very consistent career
  } else if (consistencyRatio >= 0.5) {
    experienceScore += 0.5;  // Moderately consistent
  } else if (consistencyRatio < 0.3) {
    experienceScore -= 1.0;  // Scattered experience
  }

  
  return {
    score: Math.max(0, experienceScore),
    details: {
      yearsInIndustry,
      careerConsistency: consistencyRatio,
      relevantExperience: relevantPositions
    }
  };
}

// Calculate professional credibility score
export function calculateCredibilityScore(profileData: any): {
  score: number;
  signals: string[];
} {
  let credibilityScore = 0;
  const credibilitySignals: string[] = [];
  
  const experience = Array.isArray(profileData?.experience) ? profileData.experience : [];
  const education = Array.isArray(profileData?.education) ? profileData.education : [];
  
  // Licensed broker/advisor detection
  const licenseKeywords = ['licensed', 'certified', 'registered', 'chartered'];
  experience.forEach((job: any) => {
    const jobText = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
    if (licenseKeywords.some(keyword => jobText.includes(keyword))) {
      credibilityScore += 1.0;
      credibilitySignals.push('Licensed/Certified Professional');
    }
  });
  
  // Established firm associations
  const establishedFirms = [
    'generational equity', 'sunbelt', 'transworld', 'murphy business',
    'goldman sachs', 'jp morgan', 'morgan stanley', 'wells fargo',
    'merrill lynch', 'ubs', 'raymond james'
  ];
  
  experience.forEach((job: any) => {
    const company = (job.company || '').toLowerCase();
    if (establishedFirms.some(firm => company.includes(firm))) {
      credibilityScore += 1.0;
      credibilitySignals.push(`${job.company} (Established Firm)`);
    }
  });
  
  // Teaching/university roles
  experience.forEach((job: any) => {
    const jobText = `${job.title || ''} ${job.company || ''}`.toLowerCase();
    if (jobText.includes('professor') || jobText.includes('instructor') || 
        jobText.includes('lecturer') || jobText.includes('university') ||
        jobText.includes('teaching')) {
      credibilityScore += 1.5;
      credibilitySignals.push('University Teaching/Academic Role');
    }
  });
  
  // Advisory board positions
  experience.forEach((job: any) => {
    const title = (job.title || '').toLowerCase();
    if (title.includes('advisory') || title.includes('board member')) {
      credibilityScore += 1.0;
      credibilitySignals.push('Advisory Board Experience');
    }
  });
  
  // Advanced degrees from quality institutions
  education.forEach((edu: any) => {
    const degree = (edu.degree || '').toLowerCase();
    const school = (edu.school || '').toLowerCase();
    
    if (degree.includes('mba') || degree.includes('master') || degree.includes('phd')) {
      credibilityScore += 0.5;
      credibilitySignals.push(`${edu.degree} - ${edu.school}`);
    }
  });
  
  return {
    score: credibilityScore,
    signals: credibilitySignals
  };
}

// Detect red flags in profile (Graham's disqualifiers)
export function detectRedFlags(profileData: any, recentPosts: any[] = []): {
  score: number;
  flags: string[];
} {
  let redFlagScore = 0;
  const redFlags: string[] = [];
  
  const experience = Array.isArray(profileData?.experience) ? profileData.experience : [];
  const allText = [
    ...(recentPosts || []).map((post: any) => post.content || post.text || ''),
    ...experience.map((job: any) => `${job.title || ''} ${job.company || ''} ${job.description || ''}`)
  ].join(' ').toLowerCase();
  
  // Check for red flag keywords in content
  RED_FLAG_KEYWORDS.forEach(keyword => {
    if (allText.includes(keyword.toLowerCase())) {
      redFlagScore += 1.0;
      redFlags.push(`Contains: "${keyword}"`);
    }
  });
  
  // Serial entrepreneur detection (multiple founder roles in short timespan)
  const founderRoles = experience.filter((job: any) => 
    (job.title || '').toLowerCase().includes('founder')
  );
  
  if (founderRoles.length >= 3) {
    const recentFounderRoles = founderRoles.filter((job: any) => {
      const startYear = extractYear(job.startDate);
      return startYear && (new Date().getFullYear() - startYear) <= 5;
    });
    
    if (recentFounderRoles.length >= 2) {
      redFlagScore += 2.0;
      redFlags.push('Serial Entrepreneur Pattern');
    }
  }
  
  // Recent career pivot detection
  const currentYear = new Date().getFullYear();
  const recentJobs = experience.filter((job: any) => {
    const startYear = extractYear(job.startDate);
    return startYear && (currentYear - startYear) <= 3;
  });
  
  const hasRecentMAExperience = recentJobs.some((job: any) => {
    const jobText = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
    return MA_BROKERAGE_KEYWORDS.some(keyword => jobText.includes(keyword.toLowerCase()));
  });
  
  const hasOnlyRecentMAExperience = hasRecentMAExperience && 
    !experience.some((job: any) => {
      const startYear = extractYear(job.startDate);
      const jobText = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
      const isOldMAJob = startYear && (currentYear - startYear) > 3;
      const isMARelevant = MA_BROKERAGE_KEYWORDS.some(keyword => jobText.includes(keyword.toLowerCase()));
      return isOldMAJob && isMARelevant;
    });
  
  if (hasOnlyRecentMAExperience) {
    redFlagScore += 2.0;
    redFlags.push('Recent Career Pivot to M&A (< 3 years)');
  }
  
  return {
    score: redFlagScore,
    flags: redFlags
  };
}

// Analyze career progression to detect major pivots vs. natural evolution
function analyzeCareerProgression(experience: any[]): {
  hasRecentPivot: boolean;
  pivotDetails: string[];
} {
  const currentYear = new Date().getFullYear();
  const pivotDetails: string[] = [];
  let hasRecentPivot = false;
  
  if (experience.length < 2) {
    return { hasRecentPivot: false, pivotDetails: [] };
  }
  
  // Sort by start date
  const sortedExperience = [...experience].sort((a, b) => {
    const yearA = extractYear(a.start_date) || 0;
    const yearB = extractYear(b.start_date) || 0;
    return yearA - yearB;
  });
  
  // Define industry categories for pivot detection
  const industryCategories = {
    'fitness': ['trainer', 'fitness', 'gym', 'personal training', 'sports', 'athletic'],
    'marketing': ['marketing', 'social media', 'content', 'digital', 'advertising', 'lead gen'],
    'finance': ['finance', 'financial', 'investment', 'banking', 'wealth', 'advisor'],
    'ma': ['m&a', 'merger', 'acquisition', 'broker', 'deal', 'valuation', 'business broker'],
    'tech': ['software', 'developer', 'engineer', 'tech', 'saas', 'startup'],
    'sales': ['sales', 'account', 'business development', 'revenue']
  };
  
  // Categorize each job
  const jobCategories = sortedExperience.map((job, index) => {
    const jobText = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
    const categories: string[] = [];
    
    Object.entries(industryCategories).forEach(([category, keywords]) => {
      if (keywords.some(keyword => jobText.includes(keyword))) {
        categories.push(category);
      }
    });
    
    const startYear = extractYear(job.start_date);
    const endYear = job.end_date ? extractYear(job.end_date) : currentYear;
    
    return {
      index,
      categories,
      startYear,
      endYear,
      isRecent: startYear ? (currentYear - startYear) <= 5 : false
    };
  });
  
  // Check for major career pivots (completely different industries)
  for (let i = 1; i < jobCategories.length; i++) {
    const prevJob = jobCategories[i - 1];
    const currentJob = jobCategories[i];
    
    // Check if there's no overlap in categories (major pivot)
    const hasOverlap = currentJob.categories.some(cat => 
      prevJob.categories.includes(cat)
    );
    
    if (!hasOverlap && prevJob.categories.length > 0 && currentJob.categories.length > 0) {
      const pivotDescription = `${prevJob.categories[0]} → ${currentJob.categories[0]}`;
      pivotDetails.push(pivotDescription);
      
      // Mark as recent pivot if it happened within last 5 years
      if (currentJob.isRecent) {
        hasRecentPivot = true;
      }
    }
  }
  
  // Special case: Fitness → Marketing → M&A (like Daniel Smith)
  const categorySequence = jobCategories.map(job => job.categories[0]).filter(Boolean);
  const hasFitnessToMAPath = categorySequence.includes('fitness') && 
                             categorySequence.includes('marketing') && 
                             categorySequence.includes('ma');
  
  if (hasFitnessToMAPath) {
    hasRecentPivot = true;
    pivotDetails.push('Major career transition: Fitness → Marketing → M&A');
  }
  
  return { hasRecentPivot, pivotDetails };
}

// Helper function to extract year from LinkedIn date objects or strings
function extractYear(dateField: any): number | null {
  if (!dateField) return null;
  
  // Handle LinkedIn API date object structure: {year: 2024, month: "Feb"}
  if (typeof dateField === 'object' && dateField.year) {
    return parseInt(dateField.year);
  }
  
  // Handle string dates
  if (typeof dateField === 'string') {
    // Try to extract 4-digit year
    const yearMatch = dateField.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return parseInt(yearMatch[0]);
    }
  }
  
  return null;
}

// Main relevance scoring function (Enhanced with Professional Analysis)
export function calculateRelevanceScore(
  commenter: any,
  boostTerms: string[] = [],
  downTerms: string[] = [],
  analysisDepth: 'basic' | 'detailed' = 'basic',
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): RelevanceScore {
  // Combine all available text for analysis
  const allText = [
    commenter.commentText || '',
    commenter.headline || '',
    commenter.company || '',
    ...(commenter.recentPosts || []).map((post: any) => post.content || post.text || '')
  ].filter(text => text.length > 0).join(' ');

  // === PROFESSIONAL EXPERIENCE ANALYSIS (Primary Factor) ===
  const experienceAnalysis = calculateExperienceScore(commenter.profileData || commenter);
  const experienceScore = experienceAnalysis.score * weights.experienceWeight;

  // Professional credibility analysis
  const credibilityAnalysis = calculateCredibilityScore(commenter.profileData || commenter);
  const credibilityScore = credibilityAnalysis.score * weights.credibilityWeight;

  // Red flag detection
  const redFlagAnalysis = detectRedFlags(commenter.profileData || commenter, commenter.recentPosts || []);
  const redFlagPenalty = redFlagAnalysis.score * weights.redFlagPenalty;

  // === ENHANCED KEYWORD ANALYSIS ===
  // Use Graham's M&A-specific keywords instead of generic terms
  const allKeywords = [
    ...MA_BROKERAGE_KEYWORDS,
    ...RELATED_PROFESSIONAL_KEYWORDS,
    ...boostTerms
  ];
  
  // Analyze industry-specific terms with different weights
  const maKeywordMatches = analyzeTextForKeywords(allText, MA_BROKERAGE_KEYWORDS);
  const relatedKeywordMatches = analyzeTextForKeywords(allText, RELATED_PROFESSIONAL_KEYWORDS);
  const genericKeywordMatches = analyzeTextForKeywords(allText, GENERIC_BUSINESS_KEYWORDS);
  const customBoostMatches = analyzeTextForKeywords(allText, boostTerms);
  
  // Weight different keyword categories
  const maKeywordScore = maKeywordMatches.reduce((sum, match) => 
    sum + (match.frequency * match.weight * 3.0), 0  // High weight for M&A terms
  );
  const relatedKeywordScore = relatedKeywordMatches.reduce((sum, match) => 
    sum + (match.frequency * match.weight * 2.0), 0  // Medium weight for related terms
  );
  const genericKeywordScore = genericKeywordMatches.reduce((sum, match) => 
    sum + (match.frequency * match.weight * 0.5), 0  // Low weight for generic terms
  );
  const customBoostScore = customBoostMatches.reduce((sum, match) => 
    sum + (match.frequency * match.weight * weights.boostTermWeight), 0
  );

  // Analyze down terms (negative relevance indicators)
  const downTermMatches = analyzeTextForKeywords(allText, [...downTerms, ...RED_FLAG_KEYWORDS]);
  const downScore = downTermMatches.reduce((sum, match) => 
    sum + (match.frequency * match.weight * weights.downTermWeight), 0
  );

  // Content type analysis (reduced importance)
  const contentAnalysis = analyzeContentTypes(allText, commenter.recentPosts || []);
  const businessScore = contentAnalysis.businessRelevant * weights.businessRelevanceWeight;
  const promotionalPenalty = contentAnalysis.promotional * weights.promotionalPenalty;
  const personalPenalty = contentAnalysis.personal * weights.personalPenalty;

  // Engagement and completeness (reduced importance)
  const engagementScore = calculateEngagementScore(commenter.profileData?.stats || commenter.stats);
  const engagementBonus = engagementScore * weights.engagementBonus;
  
  const completenessScore = calculateProfileCompletenessScore(commenter);
  const completenessBonus = completenessScore * weights.profileCompleteness;

  // === CALCULATE FINAL SCORE ===
  let finalScore = 3.0 + // Reduced base score (experience now carries more weight)
    experienceScore +           // PRIMARY FACTOR (weighted 4.0)
    credibilityScore +          // SECONDARY FACTOR (weighted 2.0)
    redFlagPenalty +            // DISQUALIFIER (weighted -3.0)
    maKeywordScore +            // M&A keyword matches (weighted 3.0)
    relatedKeywordScore +       // Related keyword matches (weighted 2.0)
    genericKeywordScore +       // Generic keyword matches (weighted 0.5)
    customBoostScore +          // Custom boost terms
    downScore +                 // Negative terms
    businessScore +             // Content analysis (reduced weight)
    promotionalPenalty +        // Promotional penalty
    personalPenalty +           // Personal penalty
    engagementBonus +           // Engagement bonus (reduced weight)
    completenessBonus;          // Profile completeness (reduced weight)

  // Apply red flag score cap - significant red flags should prevent high scores
  if (redFlagAnalysis.score >= 3) {
    finalScore = Math.min(finalScore, 6.0); // Cap at 6/10 for multiple red flags
  } else if (redFlagAnalysis.score >= 2) {
    finalScore = Math.min(finalScore, 7.5); // Cap at 7.5/10 for moderate red flags
  } else if (redFlagAnalysis.score >= 1) {
    finalScore = Math.min(finalScore, 8.5); // Cap at 8.5/10 for single red flag
  }

  // Clamp score to 0-10 range
  finalScore = Math.max(0, Math.min(10, finalScore));

  // Enhanced confidence calculation
  let confidence = 0.4; // Reduced base confidence
  
  if (experienceAnalysis.details.yearsInIndustry >= 5) confidence += 0.3;
  if (credibilityAnalysis.signals.length > 0) confidence += 0.2;
  if (allText.length > 200) confidence += 0.1;
  if (commenter.recentPosts && commenter.recentPosts.length > 2) confidence += 0.1;
  
  confidence = Math.min(1.0, confidence);

  // Enhanced recommendations
  const recommendations = generateEnhancedRecommendations(
    finalScore, 
    experienceAnalysis, 
    credibilityAnalysis, 
    redFlagAnalysis,
    contentAnalysis,
    [...maKeywordMatches, ...relatedKeywordMatches, ...customBoostMatches],
    downTermMatches
  );

  // Combine all keyword matches for explanation
  const allMatchedTerms = [
    ...maKeywordMatches,
    ...relatedKeywordMatches,
    ...customBoostMatches
  ];

  return {
    score: Math.round(finalScore * 100) / 100,
    explanation: {
      matchedBoostTerms: allMatchedTerms,
      matchedDownTerms: downTermMatches,
      contentAnalysis,
      // NEW: Professional analysis details
      experienceAnalysis: experienceAnalysis.details,
      credibilitySignals: credibilityAnalysis.signals,
      redFlags: redFlagAnalysis.flags,
    },
    recommendations,
    confidence,
  };
}

// Enhanced recommendations based on Graham's criteria
function generateEnhancedRecommendations(
  score: number,
  experienceAnalysis: { score: number; details: { yearsInIndustry: number; careerConsistency: number; relevantExperience: number } },
  credibilityAnalysis: { score: number; signals: string[] },
  redFlagAnalysis: { score: number; flags: string[] },
  contentAnalysis: { businessRelevant: number; promotional: number; personal: number },
  boostMatches: TermMatch[],
  downMatches: TermMatch[]
): string[] {
  const recommendations: string[] = [];
  const { yearsInIndustry, careerConsistency } = experienceAnalysis.details;

  // Primary recommendations based on professional experience
  if (redFlagAnalysis.flags.length > 0) {
    recommendations.push('🚩 RED FLAGS DETECTED - Review carefully before outreach');
    redFlagAnalysis.flags.forEach(flag => {
      recommendations.push(`   ⚠️ ${flag}`);
    });
  }

  if (yearsInIndustry >= 10) {
    recommendations.push('⭐ GOLD STANDARD: 10+ years M&A/brokerage experience');
    recommendations.push('💎 HIGH PRIORITY - Graham would connect immediately');
  } else if (yearsInIndustry >= 5) {
    recommendations.push('✅ EXPERIENCED PROFESSIONAL: 5+ years in industry');
    recommendations.push('👍 GOOD PROSPECT - Worth connecting with');
  } else if (yearsInIndustry >= 3) {
    recommendations.push('⚡ EMERGING PROFESSIONAL: 3+ years experience');
    recommendations.push('📝 RESEARCH MORE - May be worth nurturing');
  } else if (yearsInIndustry < 3 && yearsInIndustry > 0) {
    recommendations.push('⚠️ LIMITED EXPERIENCE: Less than 3 years in M&A');
    recommendations.push('❌ Graham: "Not a serious deal maker yet"');
  } else {
    recommendations.push('❌ NO RELEVANT EXPERIENCE DETECTED');
    recommendations.push('🚫 SKIP - Does not meet Graham\'s criteria');
  }

  // Credibility signals
  if (credibilityAnalysis.signals.length > 0) {
    recommendations.push('🏆 CREDIBILITY SIGNALS:');
    credibilityAnalysis.signals.slice(0, 3).forEach(signal => {
      recommendations.push(`   ✓ ${signal}`);
    });
  }

  // Career consistency feedback
  if (careerConsistency >= 0.8) {
    recommendations.push('📈 CONSISTENT CAREER: Strong M&A focus throughout');
  } else if (careerConsistency < 0.5) {
    recommendations.push('🔄 SCATTERED EXPERIENCE: Mixed career background');
  }

  // Final scoring assessment
  if (score >= 8) {
    recommendations.push('🎯 FINAL VERDICT: Premium prospect for Graham');
    recommendations.push('📞 ACTION: Connect with personalized outreach');
  } else if (score >= 6) {
    recommendations.push('👍 FINAL VERDICT: Quality prospect worth connecting');
    recommendations.push('📋 ACTION: Research posts and find common ground');
  } else if (score >= 4) {
    recommendations.push('⚖️ FINAL VERDICT: Borderline - proceed with caution');
    recommendations.push('🔍 ACTION: Additional qualification needed');
  } else {
    recommendations.push('❌ FINAL VERDICT: Does not meet Graham\'s standards');
    recommendations.push('⏭️ ACTION: Skip and focus on higher-quality prospects');
  }

  // Content quality insights (if relevant)
  if (contentAnalysis.businessRelevant > 0.8 && yearsInIndustry >= 5) {
    recommendations.push('💼 CONTENT QUALITY: Professional, business-focused content');
  }
  
  if (contentAnalysis.promotional > 0.6) {
    recommendations.push('📢 NOTE: High promotional content - may be lead gen service');
  }

  // M&A keyword insights
  const maKeywords = boostMatches.filter(match => 
    MA_BROKERAGE_KEYWORDS.some(keyword => 
      keyword.toLowerCase().includes(match.term.toLowerCase())
    )
  );
  
  if (maKeywords.length > 0) {
    recommendations.push(`🎯 M&A KEYWORDS: ${maKeywords.slice(0, 3).map(m => m.term).join(', ')}`);
  }

  return recommendations;
}

// Keep original function for backward compatibility
function generateRecommendations(
  score: number,
  contentAnalysis: { businessRelevant: number; promotional: number; personal: number },
  boostMatches: TermMatch[],
  downMatches: TermMatch[]
): string[] {
  // Use simplified version for basic analysis
  const recommendations: string[] = [];

  if (score >= 8) {
    recommendations.push('🎯 High-priority prospect');
  } else if (score >= 6) {
    recommendations.push('👍 Good prospect');
  } else if (score >= 4) {
    recommendations.push('⚠️ Medium priority');
  } else {
    recommendations.push('❌ Low priority');
  }

  return recommendations;
}

// Batch scoring for multiple commenters
export function batchCalculateRelevanceScores(
  commenters: any[],
  boostTerms: string[] = [],
  downTerms: string[] = [],
  analysisDepth: 'basic' | 'detailed' = 'basic',
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): Array<{ commenterId: string; score: RelevanceScore }> {
  return commenters.map(commenter => ({
    commenterId: commenter.id,
    score: calculateRelevanceScore(commenter, boostTerms, downTerms, analysisDepth, weights),
  }));
}

// Update scoring weights based on user feedback
export function adjustWeightsFromFeedback(
  currentWeights: ScoringWeights,
  feedback: Array<{ score: number; actualRelevance: number; feedback: any }>
): ScoringWeights {
  // This is a simplified weight adjustment algorithm
  // In production, you might want to use more sophisticated ML techniques
  
  const adjustedWeights = { ...currentWeights };
  
  // Calculate average error
  const errors = feedback.map(f => Math.abs(f.score - f.actualRelevance));
  const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  
  // If average error is high, slightly adjust weights
  if (avgError > 2.0) {
    // Small adjustments to prevent instability
    adjustedWeights.boostTermWeight *= 0.95;
    adjustedWeights.businessRelevanceWeight *= 1.05;
  }
  
  return adjustedWeights;
}