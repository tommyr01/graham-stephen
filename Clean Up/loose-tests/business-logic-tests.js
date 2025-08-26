#!/usr/bin/env node

/**
 * Business Logic Tests for Graham Stephens Build Backend
 * 
 * Tests core business logic components without relying on external APIs:
 * 1. Relevance Scoring Algorithm
 * 2. LinkedIn URL Validation
 * 3. Text Analysis & Keyword Matching
 * 4. Content Categorization
 * 5. Confidence Calculation
 * 6. Recommendation Generation
 */

const path = require('path');

// Import business logic modules directly
const {
  calculateRelevanceScore,
  analyzeTextForKeywords,
  analyzeContentTypes,
  calculateEngagementScore,
  calculateProfileCompletenessScore,
  DEFAULT_SCORING_WEIGHTS,
  batchCalculateRelevanceScores
} = require('./src/lib/relevance-scoring');

const {
  validateLinkedInPostUrl,
  extractPostIdFromUrl,
  extractUsernameFromProfileUrl,
  cleanProfileUrl,
  transformLinkedInComment
} = require('./src/lib/linkedin');

// Test results tracking
const businessLogicResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  categories: {}
};

// Test data
const testData = {
  // Sample commenters for testing
  highRelevanceCommenter: {
    id: 'test-high-relevance',
    commentText: 'Great insights on B2B sales automation! Our team has been implementing CRM solutions and lead generation tools to scale our SaaS business. The ROI on marketing automation has been incredible.',
    headline: 'VP of Sales at TechCorp - B2B SaaS Solutions',
    company: 'TechCorp Inc',
    name: 'John Smith',
    location: 'San Francisco, CA',
    followersCount: 2500,
    connectionsCount: 1500,
    profilePicture: 'https://example.com/profile.jpg',
    recentPosts: [
      { 
        content: 'Just closed our biggest enterprise deal using sales automation! The future is bright for B2B tech.',
        engagement: { likes: 45, comments: 12, shares: 8 }
      },
      {
        content: 'Sharing insights on CRM integration strategies for growing SaaS companies.',
        engagement: { likes: 38, comments: 15, shares: 5 }
      }
    ]
  },

  lowRelevanceCommenter: {
    id: 'test-low-relevance',
    commentText: 'Had a great vacation with my family last weekend! The weather was perfect for hiking and we saw some amazing wildlife.',
    headline: 'Travel Blogger and Nature Enthusiast',
    company: 'Personal Blog',
    name: 'Jane Doe',
    location: 'Denver, CO',
    followersCount: 150,
    connectionsCount: 400,
    recentPosts: [
      {
        content: 'Amazing sunset from our camping trip! Nature photography is my passion.',
        engagement: { likes: 12, comments: 3, shares: 1 }
      },
      {
        content: 'Recipe for the best hiking trail mix - perfect for outdoor adventures!',
        engagement: { likes: 8, comments: 2, shares: 0 }
      }
    ]
  },

  mixedRelevanceCommenter: {
    id: 'test-mixed-relevance',
    commentText: 'Interesting perspective on business growth. In our startup journey, we\'ve learned that customer acquisition costs can make or break your business model.',
    headline: 'Entrepreneur and Weekend Chef',
    company: 'My Startup',
    name: 'Alex Johnson',
    location: 'Austin, TX',
    followersCount: 800,
    connectionsCount: 600,
    recentPosts: [
      {
        content: 'Launched our new product today! Excited to see how the market responds to our innovation.',
        engagement: { likes: 25, comments: 8, shares: 3 }
      },
      {
        content: 'Made the most amazing pasta dish this weekend. Cooking is my stress relief after long work days.',
        engagement: { likes: 15, comments: 5, shares: 1 }
      }
    ]
  },

  // Test terms
  boostTerms: ['sales', 'B2B', 'SaaS', 'automation', 'CRM', 'lead generation', 'marketing', 'revenue', 'enterprise'],
  downTerms: ['vacation', 'personal', 'family', 'cooking', 'travel', 'recipe', 'hiking', 'photography'],

  // LinkedIn URLs for testing
  linkedinUrls: {
    valid: [
      'https://www.linkedin.com/posts/johndoe_great-insights-on-sales-activity-7123456789012345678-abcd/',
      'https://linkedin.com/posts/company_amazing-product-launch-activity-9876543210987654321-wxyz/',
      'http://www.linkedin.com/posts/janedoe_business-growth-tips-activity-1111222233334444555-efgh/'
    ],
    invalid: [
      'https://facebook.com/posts/invalid',
      'https://twitter.com/status/123456',
      'https://linkedin.com/invalid-path',
      'not-a-url-at-all',
      'https://linkedin.com/posts/', // Missing parts
      'mailto:test@linkedin.com'
    ]
  },

  profileUrls: {
    valid: [
      'https://www.linkedin.com/in/johndoe/',
      'https://linkedin.com/in/jane-smith',
      'http://www.linkedin.com/in/alex-johnson-123/',
      'https://www.linkedin.com/profile/view?id=12345'
    ]
  }
};

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

function logError(test, error) {
  log(`❌ FAILED: ${test} - ${error.message}`, 'ERROR');
  businessLogicResults.errors.push({ test, error: error.message });
}

function logSuccess(test) {
  log(`✅ PASSED: ${test}`, 'SUCCESS');
}

/**
 * 1. RELEVANCE SCORING ALGORITHM TESTS
 */
async function testRelevanceScoringAlgorithm() {
  log('Testing Relevance Scoring Algorithm...');
  const scoringResults = { passed: 0, total: 0 };

  // Test 1.1: High Relevance Commenter
  try {
    scoringResults.total++;
    const score = calculateRelevanceScore(
      testData.highRelevanceCommenter,
      testData.boostTerms,
      testData.downTerms,
      'detailed'
    );

    // Validate score structure
    if (!score || typeof score !== 'object') {
      throw new Error('Score result should be an object');
    }

    if (!score.hasOwnProperty('score') || !score.hasOwnProperty('confidence') || !score.hasOwnProperty('explanation')) {
      throw new Error('Score result missing required properties');
    }

    // Validate score range
    if (score.score < 0 || score.score > 10) {
      throw new Error(`Score should be 0-10, got ${score.score}`);
    }

    // Validate confidence range
    if (score.confidence < 0 || score.confidence > 1) {
      throw new Error(`Confidence should be 0-1, got ${score.confidence}`);
    }

    // High relevance commenter should score above 6
    if (score.score < 6) {
      throw new Error(`High relevance commenter should score >6, got ${score.score}`);
    }

    // Should have matched boost terms
    if (!score.explanation.matchedBoostTerms || score.explanation.matchedBoostTerms.length === 0) {
      throw new Error('High relevance commenter should match boost terms');
    }

    logSuccess('Relevance Scoring - High Relevance Commenter');
    scoringResults.passed++;
  } catch (error) {
    logError('Relevance Scoring - High Relevance Commenter', error);
  }

  // Test 1.2: Low Relevance Commenter
  try {
    scoringResults.total++;
    const score = calculateRelevanceScore(
      testData.lowRelevanceCommenter,
      testData.boostTerms,
      testData.downTerms,
      'basic'
    );

    // Low relevance commenter should score below 5
    if (score.score > 5) {
      throw new Error(`Low relevance commenter should score <5, got ${score.score}`);
    }

    // Should have matched down terms or few boost terms
    const hasDownTerms = score.explanation.matchedDownTerms && score.explanation.matchedDownTerms.length > 0;
    const fewBoostTerms = !score.explanation.matchedBoostTerms || score.explanation.matchedBoostTerms.length <= 1;

    if (!hasDownTerms && !fewBoostTerms) {
      throw new Error('Low relevance commenter should match down terms or have few boost terms');
    }

    logSuccess('Relevance Scoring - Low Relevance Commenter');
    scoringResults.passed++;
  } catch (error) {
    logError('Relevance Scoring - Low Relevance Commenter', error);
  }

  // Test 1.3: Mixed Relevance Commenter
  try {
    scoringResults.total++;
    const score = calculateRelevanceScore(
      testData.mixedRelevanceCommenter,
      testData.boostTerms,
      testData.downTerms,
      'detailed'
    );

    // Mixed relevance should be in middle range (4-7)
    if (score.score < 4 || score.score > 7) {
      throw new Error(`Mixed relevance commenter should score 4-7, got ${score.score}`);
    }

    logSuccess('Relevance Scoring - Mixed Relevance Commenter');
    scoringResults.passed++;
  } catch (error) {
    logError('Relevance Scoring - Mixed Relevance Commenter', error);
  }

  // Test 1.4: Batch Scoring
  try {
    scoringResults.total++;
    const commenters = [
      testData.highRelevanceCommenter,
      testData.lowRelevanceCommenter,
      testData.mixedRelevanceCommenter
    ];

    const batchResults = batchCalculateRelevanceScores(
      commenters,
      testData.boostTerms,
      testData.downTerms
    );

    if (!Array.isArray(batchResults) || batchResults.length !== 3) {
      throw new Error('Batch scoring should return array with 3 results');
    }

    // Verify all results have required structure
    batchResults.forEach((result, index) => {
      if (!result.commenterId || !result.score) {
        throw new Error(`Batch result ${index} missing required properties`);
      }
    });

    logSuccess('Relevance Scoring - Batch Processing');
    scoringResults.passed++;
  } catch (error) {
    logError('Relevance Scoring - Batch Processing', error);
  }

  // Test 1.5: Edge Cases - Empty Data
  try {
    scoringResults.total++;
    const emptyCommenter = {
      id: 'empty-test',
      commentText: '',
      headline: '',
      company: '',
      recentPosts: []
    };

    const score = calculateRelevanceScore(emptyCommenter, [], []);

    if (score.score < 0 || score.score > 10) {
      throw new Error('Empty commenter score should still be in valid range');
    }

    if (score.confidence > 0.5) {
      throw new Error('Empty commenter should have low confidence');
    }

    logSuccess('Relevance Scoring - Empty Data Edge Case');
    scoringResults.passed++;
  } catch (error) {
    logError('Relevance Scoring - Empty Data Edge Case', error);
  }

  businessLogicResults.total += scoringResults.total;
  businessLogicResults.passed += scoringResults.passed;
  businessLogicResults.failed += (scoringResults.total - scoringResults.passed);
  businessLogicResults.categories.relevanceScoring = scoringResults;

  return scoringResults;
}

/**
 * 2. TEXT ANALYSIS & KEYWORD MATCHING TESTS
 */
async function testTextAnalysis() {
  log('Testing Text Analysis & Keyword Matching...');
  const textResults = { passed: 0, total: 0 };

  // Test 2.1: Keyword Detection
  try {
    textResults.total++;
    const text = 'Our B2B SaaS company has seen incredible ROI from sales automation and CRM integration. Lead generation has improved 300% this quarter.';
    const keywords = ['B2B', 'SaaS', 'sales', 'CRM', 'lead generation', 'automation'];

    const matches = analyzeTextForKeywords(text, keywords);

    if (!Array.isArray(matches)) {
      throw new Error('Keyword analysis should return an array');
    }

    // Should find most of the keywords
    if (matches.length < 4) {
      throw new Error(`Expected to find at least 4 keywords, found ${matches.length}`);
    }

    // Check match structure
    matches.forEach(match => {
      if (!match.term || !match.hasOwnProperty('frequency') || !match.contexts) {
        throw new Error('Match object missing required properties');
      }
    });

    logSuccess('Text Analysis - Keyword Detection');
    textResults.passed++;
  } catch (error) {
    logError('Text Analysis - Keyword Detection', error);
  }

  // Test 2.2: Case Insensitive Matching
  try {
    textResults.total++;
    const text = 'Our b2b SAAS Company Uses sales AUTOMATION and crm tools.';
    const keywords = ['B2B', 'SaaS', 'sales', 'automation', 'CRM'];

    const matches = analyzeTextForKeywords(text, keywords, false); // Case insensitive

    if (matches.length !== 5) {
      throw new Error(`Expected 5 matches with case insensitive search, got ${matches.length}`);
    }

    logSuccess('Text Analysis - Case Insensitive Matching');
    textResults.passed++;
  } catch (error) {
    logError('Text Analysis - Case Insensitive Matching', error);
  }

  // Test 2.3: Content Type Analysis
  try {
    textResults.total++;
    const businessText = 'Discussing B2B sales strategies, CRM automation, and lead generation tactics for enterprise clients.';
    const personalText = 'Had a wonderful vacation with family, great weather for hiking and personal relaxation.';
    const mixedText = businessText + ' ' + personalText;

    const businessAnalysis = analyzeContentTypes(businessText);
    const personalAnalysis = analyzeContentTypes(personalText);
    const mixedAnalysis = analyzeContentTypes(mixedText);

    // Validate analysis structure
    ['businessRelevant', 'promotional', 'personal'].forEach(key => {
      if (!businessAnalysis.hasOwnProperty(key) || !personalAnalysis.hasOwnProperty(key) || !mixedAnalysis.hasOwnProperty(key)) {
        throw new Error(`Content analysis missing ${key} property`);
      }
    });

    // Business text should be primarily business relevant
    if (businessAnalysis.businessRelevant < 0.5) {
      throw new Error('Business text should be classified as business relevant');
    }

    // Personal text should be primarily personal
    if (personalAnalysis.personal < 0.5) {
      throw new Error('Personal text should be classified as personal');
    }

    logSuccess('Text Analysis - Content Type Classification');
    textResults.passed++;
  } catch (error) {
    logError('Text Analysis - Content Type Classification', error);
  }

  businessLogicResults.total += textResults.total;
  businessLogicResults.passed += textResults.passed;
  businessLogicResults.failed += (textResults.total - textResults.passed);
  businessLogicResults.categories.textAnalysis = textResults;

  return textResults;
}

/**
 * 3. LINKEDIN URL VALIDATION TESTS
 */
async function testLinkedInUrlValidation() {
  log('Testing LinkedIn URL Validation...');
  const urlResults = { passed: 0, total: 0 };

  // Test 3.1: Valid URLs
  try {
    urlResults.total++;
    let validCount = 0;

    testData.linkedinUrls.valid.forEach(url => {
      const validation = validateLinkedInPostUrl(url);
      if (validation.isValid) {
        validCount++;
      } else {
        throw new Error(`Valid URL marked as invalid: ${url}`);
      }

      // Should also extract post ID
      if (!validation.postId) {
        throw new Error(`Valid URL should have post ID: ${url}`);
      }
    });

    if (validCount !== testData.linkedinUrls.valid.length) {
      throw new Error(`Expected ${testData.linkedinUrls.valid.length} valid URLs, got ${validCount}`);
    }

    logSuccess('LinkedIn URL Validation - Valid URLs');
    urlResults.passed++;
  } catch (error) {
    logError('LinkedIn URL Validation - Valid URLs', error);
  }

  // Test 3.2: Invalid URLs
  try {
    urlResults.total++;
    let invalidCount = 0;

    testData.linkedinUrls.invalid.forEach(url => {
      const validation = validateLinkedInPostUrl(url);
      if (!validation.isValid) {
        invalidCount++;
      } else {
        throw new Error(`Invalid URL marked as valid: ${url}`);
      }
    });

    if (invalidCount !== testData.linkedinUrls.invalid.length) {
      throw new Error(`Expected ${testData.linkedinUrls.invalid.length} invalid URLs, got ${invalidCount}`);
    }

    logSuccess('LinkedIn URL Validation - Invalid URLs');
    urlResults.passed++;
  } catch (error) {
    logError('LinkedIn URL Validation - Invalid URLs', error);
  }

  // Test 3.3: Post ID Extraction
  try {
    urlResults.total++;
    const testUrl = 'https://www.linkedin.com/posts/johndoe_test-activity-7123456789012345678-abcd/';
    const postId = extractPostIdFromUrl(testUrl);

    if (!postId) {
      throw new Error('Should extract post ID from valid URL');
    }

    if (postId !== '7123456789012345678-abcd') {
      throw new Error(`Extracted post ID incorrect: expected 7123456789012345678-abcd, got ${postId}`);
    }

    logSuccess('LinkedIn URL Validation - Post ID Extraction');
    urlResults.passed++;
  } catch (error) {
    logError('LinkedIn URL Validation - Post ID Extraction', error);
  }

  // Test 3.4: Profile URL Processing
  try {
    urlResults.total++;
    testData.profileUrls.valid.forEach(profileUrl => {
      const username = extractUsernameFromProfileUrl(profileUrl);
      if (!username) {
        throw new Error(`Should extract username from profile URL: ${profileUrl}`);
      }

      const cleanedUrl = cleanProfileUrl(profileUrl);
      if (!cleanedUrl || !cleanedUrl.startsWith('http')) {
        throw new Error(`URL cleaning failed for: ${profileUrl}`);
      }
    });

    logSuccess('LinkedIn URL Validation - Profile URL Processing');
    urlResults.passed++;
  } catch (error) {
    logError('LinkedIn URL Validation - Profile URL Processing', error);
  }

  businessLogicResults.total += urlResults.total;
  businessLogicResults.passed += urlResults.passed;
  businessLogicResults.failed += (urlResults.total - urlResults.passed);
  businessLogicResults.categories.urlValidation = urlResults;

  return urlResults;
}

/**
 * 4. ENGAGEMENT & PROFILE SCORING TESTS
 */
async function testEngagementScoring() {
  log('Testing Engagement & Profile Scoring...');
  const engagementResults = { passed: 0, total: 0 };

  // Test 4.1: Engagement Score Calculation
  try {
    engagementResults.total++;

    // High engagement
    const highEngagement = { totalReactions: 100, commentsCount: 25, shares: 10 };
    const highScore = calculateEngagementScore(highEngagement);

    // Low engagement
    const lowEngagement = { totalReactions: 2, commentsCount: 0, shares: 0 };
    const lowScore = calculateEngagementScore(lowEngagement);

    // No engagement
    const noEngagement = null;
    const noScore = calculateEngagementScore(noEngagement);

    if (highScore < 0 || highScore > 1 || lowScore < 0 || lowScore > 1 || noScore < 0 || noScore > 1) {
      throw new Error('Engagement scores should be between 0 and 1');
    }

    if (highScore <= lowScore) {
      throw new Error('Higher engagement should result in higher score');
    }

    if (noScore !== 0) {
      throw new Error('No engagement data should result in score of 0');
    }

    logSuccess('Engagement Scoring - Score Calculation');
    engagementResults.passed++;
  } catch (error) {
    logError('Engagement Scoring - Score Calculation', error);
  }

  // Test 4.2: Profile Completeness Scoring
  try {
    engagementResults.total++;

    // Complete profile
    const completeProfile = {
      name: 'John Doe',
      headline: 'VP of Sales',
      company: 'TechCorp',
      location: 'San Francisco',
      profilePicture: 'https://example.com/pic.jpg',
      followersCount: 1000
    };

    // Incomplete profile
    const incompleteProfile = {
      name: 'Jane Smith',
      headline: null,
      company: '',
      location: undefined
    };

    const completeScore = calculateProfileCompletenessScore(completeProfile);
    const incompleteScore = calculateProfileCompletenessScore(incompleteProfile);

    if (completeScore < 0 || completeScore > 1 || incompleteScore < 0 || incompleteScore > 1) {
      throw new Error('Profile completeness scores should be between 0 and 1');
    }

    if (completeScore <= incompleteScore) {
      throw new Error('Complete profile should have higher score than incomplete');
    }

    logSuccess('Engagement Scoring - Profile Completeness');
    engagementResults.passed++;
  } catch (error) {
    logError('Engagement Scoring - Profile Completeness', error);
  }

  businessLogicResults.total += engagementResults.total;
  businessLogicResults.passed += engagementResults.passed;
  businessLogicResults.failed += (engagementResults.total - engagementResults.passed);
  businessLogicResults.categories.engagementScoring = engagementResults;

  return engagementResults;
}

/**
 * 5. SCORING WEIGHTS & CONFIGURATION TESTS
 */
async function testScoringConfiguration() {
  log('Testing Scoring Configuration & Weights...');
  const configResults = { passed: 0, total: 0 };

  // Test 5.1: Default Weights Structure
  try {
    configResults.total++;

    const requiredWeights = [
      'boostTermWeight',
      'downTermWeight', 
      'businessRelevanceWeight',
      'promotionalPenalty',
      'personalPenalty',
      'engagementBonus',
      'profileCompleteness'
    ];

    requiredWeights.forEach(weight => {
      if (!DEFAULT_SCORING_WEIGHTS.hasOwnProperty(weight)) {
        throw new Error(`Missing required weight: ${weight}`);
      }

      if (typeof DEFAULT_SCORING_WEIGHTS[weight] !== 'number') {
        throw new Error(`Weight ${weight} should be a number`);
      }
    });

    logSuccess('Scoring Configuration - Default Weights Structure');
    configResults.passed++;
  } catch (error) {
    logError('Scoring Configuration - Default Weights Structure', error);
  }

  // Test 5.2: Custom Weights Application
  try {
    configResults.total++;

    const customWeights = {
      ...DEFAULT_SCORING_WEIGHTS,
      boostTermWeight: 5.0, // Higher than default
      downTermWeight: -3.0  // More negative than default
    };

    // Same commenter with different weights should give different scores
    const defaultScore = calculateRelevanceScore(testData.highRelevanceCommenter, testData.boostTerms, testData.downTerms, 'basic');
    const customScore = calculateRelevanceScore(testData.highRelevanceCommenter, testData.boostTerms, testData.downTerms, 'basic', customWeights);

    // Custom weights should change the score
    if (Math.abs(defaultScore.score - customScore.score) < 0.1) {
      throw new Error('Custom weights should significantly change the score');
    }

    logSuccess('Scoring Configuration - Custom Weights Application');
    configResults.passed++;
  } catch (error) {
    logError('Scoring Configuration - Custom Weights Application', error);
  }

  businessLogicResults.total += configResults.total;
  businessLogicResults.passed += configResults.passed;
  businessLogicResults.failed += (configResults.total - configResults.passed);
  businessLogicResults.categories.scoringConfiguration = configResults;

  return configResults;
}

/**
 * MAIN BUSINESS LOGIC TEST EXECUTION
 */
async function runBusinessLogicTests() {
  const startTime = Date.now();
  
  log('🧠 Starting Business Logic Tests');
  log('='.repeat(50));

  try {
    await testRelevanceScoringAlgorithm();
    log('');
    
    await testTextAnalysis();
    log('');
    
    await testLinkedInUrlValidation();
    log('');
    
    await testEngagementScoring();
    log('');
    
    await testScoringConfiguration();
    log('');

  } catch (error) {
    log(`❌ Business logic test suite execution failed: ${error.message}`, 'ERROR');
    businessLogicResults.errors.push({ test: 'Business Logic Test Suite Execution', error: error.message });
  }

  // Generate final report
  const executionTime = Date.now() - startTime;
  generateBusinessLogicReport(executionTime);
}

/**
 * GENERATE BUSINESS LOGIC TEST REPORT
 */
function generateBusinessLogicReport(executionTime) {
  log('='.repeat(50));
  log('📊 BUSINESS LOGIC TEST REPORT');
  log('='.repeat(50));
  
  const passRate = businessLogicResults.total > 0 ? (businessLogicResults.passed / businessLogicResults.total * 100).toFixed(2) : 0;
  
  log(`Total Business Logic Tests: ${businessLogicResults.total}`);
  log(`Passed: ${businessLogicResults.passed} (${passRate}%)`);
  log(`Failed: ${businessLogicResults.failed}`);
  log(`Execution Time: ${(executionTime / 1000).toFixed(2)} seconds`);
  log('');
  
  // Category breakdown
  log('📋 BUSINESS LOGIC COVERAGE BY CATEGORY:');
  log('-'.repeat(40));
  
  const categoryNames = {
    relevanceScoring: 'Relevance Scoring Algorithm',
    textAnalysis: 'Text Analysis & Keywords',
    urlValidation: 'LinkedIn URL Validation',
    engagementScoring: 'Engagement & Profile Scoring',
    scoringConfiguration: 'Scoring Configuration'
  };

  Object.entries(businessLogicResults.categories).forEach(([category, results]) => {
    if (results && results.total) {
      const categoryPassRate = (results.passed / results.total * 100).toFixed(1);
      const displayName = categoryNames[category] || category;
      log(`${displayName.padEnd(30)}: ${results.passed}/${results.total} (${categoryPassRate}%)`);
    }
  });
  log('');
  
  // Error details
  if (businessLogicResults.errors.length > 0) {
    log('❌ FAILED BUSINESS LOGIC TESTS:');
    log('-'.repeat(35));
    businessLogicResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}`);
      log(`   Error: ${error.error}`);
      log('');
    });
  }
  
  // Business logic quality assessment
  log('🎯 BUSINESS LOGIC QUALITY ASSESSMENT:');
  log('-'.repeat(40));
  
  if (passRate >= 95) {
    log('✅ EXCELLENT - Business logic is robust and production-ready');
  } else if (passRate >= 85) {
    log('🟡 GOOD - Minor business logic issues need attention');  
  } else if (passRate >= 70) {
    log('🟠 FAIR - Several business logic issues require fixes');
  } else {
    log('🔴 POOR - Major business logic issues require immediate attention');
  }
  
  // Algorithm compliance
  log('');
  log('📋 ALGORITHM SPECIFICATION COMPLIANCE:');
  log('-'.repeat(40));
  log(`✅ Relevance Scoring: ${businessLogicResults.categories.relevanceScoring ? 'TESTED' : 'MISSING'}`);
  log(`✅ Text Analysis: ${businessLogicResults.categories.textAnalysis ? 'TESTED' : 'MISSING'}`);
  log(`✅ URL Validation: ${businessLogicResults.categories.urlValidation ? 'TESTED' : 'MISSING'}`);
  log(`✅ Engagement Scoring: ${businessLogicResults.categories.engagementScoring ? 'TESTED' : 'MISSING'}`);
  log(`✅ Configuration Management: ${businessLogicResults.categories.scoringConfiguration ? 'TESTED' : 'MISSING'}`);
  
  // Recommendations
  log('');
  log('💡 BUSINESS LOGIC RECOMMENDATIONS:');
  log('-'.repeat(35));
  
  if (businessLogicResults.failed > 0) {
    log('• Fix failed business logic tests before deployment');
  }
  
  if (businessLogicResults.categories.relevanceScoring && businessLogicResults.categories.relevanceScoring.passed < 4) {
    log('• Review relevance scoring algorithm for accuracy and edge cases');
  }
  
  if (businessLogicResults.categories.textAnalysis && businessLogicResults.categories.textAnalysis.passed < 2) {
    log('• Improve text analysis and keyword matching algorithms');
  }
  
  log('• Consider A/B testing different scoring weights in production');
  log('• Monitor algorithm performance with real user feedback');
  log('• Implement machine learning improvements based on user feedback');
  
  log('='.repeat(50));
  log(`🏁 Business logic tests completed with ${passRate}% pass rate`);
  
  return {
    total: businessLogicResults.total,
    passed: businessLogicResults.passed,
    failed: businessLogicResults.failed,
    passRate: parseFloat(passRate),
    executionTime,
    categoryResults: businessLogicResults.categories,
    errors: businessLogicResults.errors
  };
}

// Run the business logic tests
if (require.main === module) {
  runBusinessLogicTests();
}

module.exports = {
  runBusinessLogicTests,
  businessLogicResults
};