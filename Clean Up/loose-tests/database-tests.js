#!/usr/bin/env node

/**
 * Database Integration Tests for Graham Stephens Build Backend
 * 
 * Tests all 7 database tables, relationships, constraints, and operations:
 * 1. users - User authentication and profiles
 * 2. research_sessions - LinkedIn post analysis sessions  
 * 3. commenters - Individual commenter data and analysis
 * 4. user_feedback - User feedback on relevance scores
 * 5. api_rate_limits - Rate limiting and API protection
 * 6. linkedin_cache - LinkedIn API response caching
 * 7. scoring_events - Analytics and scoring history
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration from environment or defaults
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BASE_URL = 'http://localhost:3001';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test results tracking
const dbTestResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  tableTests: {}
};

// Test data
const testData = {
  user: {
    id: null, // Will be set after creation
    email: `db-test-${Date.now()}@example.com`,
    password_hash: '$2b$12$dummy.hash.for.testing',
    first_name: 'Database',
    last_name: 'Test User'
  },
  session: {
    id: null,
    post_url: 'https://www.linkedin.com/posts/test_database-testing-activity-123456789',
    session_name: 'Database Test Session',
    boost_terms: ['test', 'database', 'backend']
  },
  commenter: {
    id: null,
    linkedin_id: 'test-linkedin-user',
    comment_id: 'test-comment-123',
    name: 'Test Commenter',
    headline: 'Software Engineer at TestCorp',
    profile_url: 'https://linkedin.com/in/test-commenter',
    comment_text: 'This is a test comment for database testing'
  }
};

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

function logError(test, error) {
  log(`❌ FAILED: ${test} - ${error.message}`, 'ERROR');
  dbTestResults.errors.push({ test, error: error.message });
}

function logSuccess(test) {
  log(`✅ PASSED: ${test}`, 'SUCCESS');
}

/**
 * 1. USERS TABLE TESTS
 */
async function testUsersTable() {
  log('Testing Users Table...');
  const usersResults = { passed: 0, total: 0 };

  // Test 1.1: Create User
  try {
    usersResults.total++;
    const { data, error } = await supabase
      .from('users')
      .insert(testData.user)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (!data.id || !data.email || !data.created_at) {
      throw new Error('User record missing required fields');
    }

    testData.user.id = data.id;
    logSuccess('Users Table - Create User');
    usersResults.passed++;
  } catch (error) {
    logError('Users Table - Create User', error);
  }

  // Test 1.2: Read User by Email
  try {
    usersResults.total++;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testData.user.email)
      .single();

    if (error) {
      throw new Error(`Failed to read user: ${error.message}`);
    }

    if (data.email !== testData.user.email) {
      throw new Error('Email mismatch in retrieved user');
    }

    logSuccess('Users Table - Read User by Email');
    usersResults.passed++;
  } catch (error) {
    logError('Users Table - Read User by Email', error);
  }

  // Test 1.3: Update User
  try {
    usersResults.total++;
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', testData.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (data.is_active !== false) {
      throw new Error('User update failed - is_active not changed');
    }

    logSuccess('Users Table - Update User');
    usersResults.passed++;
  } catch (error) {
    logError('Users Table - Update User', error);
  }

  // Test 1.4: Email Unique Constraint
  try {
    usersResults.total++;
    const { error } = await supabase
      .from('users')
      .insert({
        email: testData.user.email, // Duplicate email
        password_hash: 'another_hash',
        first_name: 'Another',
        last_name: 'User'
      });

    if (!error) {
      throw new Error('Duplicate email should be rejected by unique constraint');
    }

    if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
      throw new Error(`Expected unique constraint error, got: ${error.message}`);
    }

    logSuccess('Users Table - Email Unique Constraint');
    usersResults.passed++;
  } catch (error) {
    logError('Users Table - Email Unique Constraint', error);
  }

  dbTestResults.total += usersResults.total;
  dbTestResults.passed += usersResults.passed;
  dbTestResults.failed += (usersResults.total - usersResults.passed);
  dbTestResults.tableTests.users = usersResults;

  return usersResults;
}

/**
 * 2. RESEARCH_SESSIONS TABLE TESTS
 */
async function testResearchSessionsTable() {
  log('Testing Research Sessions Table...');
  const sessionsResults = { passed: 0, total: 0 };

  // Test 2.1: Create Research Session
  try {
    sessionsResults.total++;
    const sessionData = {
      ...testData.session,
      user_id: testData.user.id
    };

    const { data, error } = await supabase
      .from('research_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create research session: ${error.message}`);
    }

    if (!data.id || !data.user_id || !data.post_url) {
      throw new Error('Research session missing required fields');
    }

    testData.session.id = data.id;
    logSuccess('Research Sessions Table - Create Session');
    sessionsResults.passed++;
  } catch (error) {
    logError('Research Sessions Table - Create Session', error);
  }

  // Test 2.2: Read Sessions by User
  try {
    sessionsResults.total++;
    const { data, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('user_id', testData.user.id);

    if (error) {
      throw new Error(`Failed to read research sessions: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No research sessions found for user');
    }

    const session = data.find(s => s.id === testData.session.id);
    if (!session) {
      throw new Error('Created session not found in user sessions');
    }

    logSuccess('Research Sessions Table - Read Sessions by User');
    sessionsResults.passed++;
  } catch (error) {
    logError('Research Sessions Table - Read Sessions by User', error);
  }

  // Test 2.3: Update Session Status
  try {
    sessionsResults.total++;
    const { data, error } = await supabase
      .from('research_sessions')
      .update({ 
        status: 'completed',
        total_comments: 25,
        analyzed_commenters: 20
      })
      .eq('id', testData.session.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update research session: ${error.message}`);
    }

    if (data.status !== 'completed' || data.total_comments !== 25) {
      throw new Error('Research session update failed');
    }

    logSuccess('Research Sessions Table - Update Session Status');
    sessionsResults.passed++;
  } catch (error) {
    logError('Research Sessions Table - Update Session Status', error);
  }

  // Test 2.4: Foreign Key Constraint
  try {
    sessionsResults.total++;
    const { error } = await supabase
      .from('research_sessions')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent user
        post_url: 'https://linkedin.com/posts/test',
        session_name: 'Invalid Session'
      });

    if (!error) {
      throw new Error('Session with invalid user_id should be rejected');
    }

    if (!error.message.includes('foreign key') && !error.message.includes('violates')) {
      // Some databases may return different error messages
      log('Note: Foreign key constraint error format may vary');
    }

    logSuccess('Research Sessions Table - Foreign Key Constraint');
    sessionsResults.passed++;
  } catch (error) {
    logError('Research Sessions Table - Foreign Key Constraint', error);
  }

  dbTestResults.total += sessionsResults.total;
  dbTestResults.passed += sessionsResults.passed;
  dbTestResults.failed += (sessionsResults.total - sessionsResults.passed);
  dbTestResults.tableTests.research_sessions = sessionsResults;

  return sessionsResults;
}

/**
 * 3. COMMENTERS TABLE TESTS
 */
async function testCommentersTable() {
  log('Testing Commenters Table...');
  const commentersResults = { passed: 0, total: 0 };

  // Test 3.1: Create Commenter
  try {
    commentersResults.total++;
    const commenterData = {
      ...testData.commenter,
      session_id: testData.session.id
    };

    const { data, error } = await supabase
      .from('commenters')
      .insert(commenterData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create commenter: ${error.message}`);
    }

    if (!data.id || !data.session_id || !data.linkedin_id) {
      throw new Error('Commenter record missing required fields');
    }

    testData.commenter.id = data.id;
    logSuccess('Commenters Table - Create Commenter');
    commentersResults.passed++;
  } catch (error) {
    logError('Commenters Table - Create Commenter', error);
  }

  // Test 3.2: Read Commenters by Session
  try {
    commentersResults.total++;
    const { data, error } = await supabase
      .from('commenters')
      .select('*')
      .eq('session_id', testData.session.id)
      .order('relevance_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to read commenters: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No commenters found for session');
    }

    const commenter = data.find(c => c.id === testData.commenter.id);
    if (!commenter) {
      throw new Error('Created commenter not found in session');
    }

    logSuccess('Commenters Table - Read Commenters by Session');
    commentersResults.passed++;
  } catch (error) {
    logError('Commenters Table - Read Commenters by Session', error);
  }

  // Test 3.3: Update Relevance Score
  try {
    commentersResults.total++;
    const newScore = 7.5;
    const { data, error } = await supabase
      .from('commenters')
      .update({ relevance_score: newScore })
      .eq('id', testData.commenter.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update relevance score: ${error.message}`);
    }

    if (parseFloat(data.relevance_score) !== newScore) {
      throw new Error('Relevance score update failed');
    }

    logSuccess('Commenters Table - Update Relevance Score');
    commentersResults.passed++;
  } catch (error) {
    logError('Commenters Table - Update Relevance Score', error);
  }

  // Test 3.4: JSON Data Storage
  try {
    commentersResults.total++;
    const profileData = {
      location: 'San Francisco, CA',
      connections: 500,
      industry: 'Technology'
    };

    const { data, error } = await supabase
      .from('commenters')
      .update({ profile_data: profileData })
      .eq('id', testData.commenter.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile data: ${error.message}`);
    }

    if (!data.profile_data || data.profile_data.industry !== 'Technology') {
      throw new Error('JSON profile data not stored correctly');
    }

    logSuccess('Commenters Table - JSON Data Storage');
    commentersResults.passed++;
  } catch (error) {
    logError('Commenters Table - JSON Data Storage', error);
  }

  // Test 3.5: Unique Constraint (session_id + comment_id)
  try {
    commentersResults.total++;
    const { error } = await supabase
      .from('commenters')
      .insert({
        session_id: testData.session.id,
        linkedin_id: 'another-user',
        comment_id: testData.commenter.comment_id, // Duplicate within same session
        name: 'Another Commenter'
      });

    if (!error) {
      throw new Error('Duplicate comment_id in same session should be rejected');
    }

    logSuccess('Commenters Table - Unique Constraint');
    commentersResults.passed++;
  } catch (error) {
    logError('Commenters Table - Unique Constraint', error);
  }

  dbTestResults.total += commentersResults.total;
  dbTestResults.passed += commentersResults.passed;
  dbTestResults.failed += (commentersResults.total - commentersResults.passed);
  dbTestResults.tableTests.commenters = commentersResults;

  return commentersResults;
}

/**
 * 4. USER_FEEDBACK TABLE TESTS
 */
async function testUserFeedbackTable() {
  log('Testing User Feedback Table...');
  const feedbackResults = { passed: 0, total: 0 };

  // Test 4.1: Create User Feedback
  try {
    feedbackResults.total++;
    const feedbackData = {
      session_id: testData.session.id,
      commenter_id: testData.commenter.id,
      user_id: testData.user.id,
      rating: 4,
      feedback_text: 'Good relevance analysis for testing',
      is_relevant: true,
      notes: 'Database test feedback'
    };

    const { data, error } = await supabase
      .from('user_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user feedback: ${error.message}`);
    }

    if (!data.id || data.rating !== 4 || !data.is_relevant) {
      throw new Error('User feedback record missing or incorrect data');
    }

    logSuccess('User Feedback Table - Create Feedback');
    feedbackResults.passed++;
  } catch (error) {
    logError('User Feedback Table - Create Feedback', error);
  }

  // Test 4.2: Read Feedback by Session
  try {
    feedbackResults.total++;
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('session_id', testData.session.id);

    if (error) {
      throw new Error(`Failed to read user feedback: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No feedback found for session');
    }

    logSuccess('User Feedback Table - Read Feedback by Session');
    feedbackResults.passed++;
  } catch (error) {
    logError('User Feedback Table - Read Feedback by Session', error);
  }

  // Test 4.3: Rating Check Constraint
  try {
    feedbackResults.total++;
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        session_id: testData.session.id,
        commenter_id: testData.commenter.id,
        user_id: testData.user.id,
        rating: 6 // Invalid - should be 1-5
      });

    if (!error) {
      throw new Error('Invalid rating should be rejected by check constraint');
    }

    logSuccess('User Feedback Table - Rating Check Constraint');
    feedbackResults.passed++;
  } catch (error) {
    logError('User Feedback Table - Rating Check Constraint', error);
  }

  dbTestResults.total += feedbackResults.total;
  dbTestResults.passed += feedbackResults.passed;
  dbTestResults.failed += (feedbackResults.total - feedbackResults.passed);
  dbTestResults.tableTests.user_feedback = feedbackResults;

  return feedbackResults;
}

/**
 * 5. API_RATE_LIMITS TABLE TESTS
 */
async function testApiRateLimitsTable() {
  log('Testing API Rate Limits Table...');
  const rateLimitsResults = { passed: 0, total: 0 };

  // Test 5.1: Create Rate Limit Entry
  try {
    rateLimitsResults.total++;
    const rateLimitData = {
      user_id: testData.user.id,
      ip_address: '127.0.0.1',
      endpoint: '/api/linkedin/extract-comments',
      request_count: 1,
      window_start: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('api_rate_limits')
      .insert(rateLimitData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create rate limit entry: ${error.message}`);
    }

    if (!data.id || data.request_count !== 1) {
      throw new Error('Rate limit record missing or incorrect data');
    }

    logSuccess('API Rate Limits Table - Create Rate Limit Entry');
    rateLimitsResults.passed++;
  } catch (error) {
    logError('API Rate Limits Table - Create Rate Limit Entry', error);
  }

  // Test 5.2: Update Request Count
  try {
    rateLimitsResults.total++;
    const { data, error } = await supabase
      .from('api_rate_limits')
      .update({ request_count: 5 })
      .eq('user_id', testData.user.id)
      .eq('endpoint', '/api/linkedin/extract-comments')
      .select();

    if (error) {
      throw new Error(`Failed to update request count: ${error.message}`);
    }

    if (!data.length || data[0].request_count !== 5) {
      throw new Error('Request count update failed');
    }

    logSuccess('API Rate Limits Table - Update Request Count');
    rateLimitsResults.passed++;
  } catch (error) {
    logError('API Rate Limits Table - Update Request Count', error);
  }

  dbTestResults.total += rateLimitsResults.total;
  dbTestResults.passed += rateLimitsResults.passed;
  dbTestResults.failed += (rateLimitsResults.total - rateLimitsResults.passed);
  dbTestResults.tableTests.api_rate_limits = rateLimitsResults;

  return rateLimitsResults;
}

/**
 * 6. LINKEDIN_CACHE TABLE TESTS
 */
async function testLinkedInCacheTable() {
  log('Testing LinkedIn Cache Table...');
  const cacheResults = { passed: 0, total: 0 };

  // Test 6.1: Create Cache Entry
  try {
    cacheResults.total++;
    const cacheData = {
      cache_key: 'test_cache_key_123',
      data: { 
        comments: ['test comment 1', 'test comment 2'],
        metadata: { cached_at: new Date().toISOString() }
      },
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };

    const { data, error } = await supabase
      .from('linkedin_cache')
      .insert(cacheData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create cache entry: ${error.message}`);
    }

    if (!data.id || !data.cache_key || !data.data) {
      throw new Error('Cache record missing required data');
    }

    if (!data.data.comments || data.data.comments.length !== 2) {
      throw new Error('Cache JSON data not stored correctly');
    }

    logSuccess('LinkedIn Cache Table - Create Cache Entry');
    cacheResults.passed++;
  } catch (error) {
    logError('LinkedIn Cache Table - Create Cache Entry', error);
  }

  // Test 6.2: Read Cache Entry
  try {
    cacheResults.total++;
    const { data, error } = await supabase
      .from('linkedin_cache')
      .select('*')
      .eq('cache_key', 'test_cache_key_123')
      .single();

    if (error) {
      throw new Error(`Failed to read cache entry: ${error.message}`);
    }

    if (data.cache_key !== 'test_cache_key_123') {
      throw new Error('Cache key mismatch');
    }

    logSuccess('LinkedIn Cache Table - Read Cache Entry');
    cacheResults.passed++;
  } catch (error) {
    logError('LinkedIn Cache Table - Read Cache Entry', error);
  }

  // Test 6.3: Cache Key Unique Constraint
  try {
    cacheResults.total++;
    const { error } = await supabase
      .from('linkedin_cache')
      .insert({
        cache_key: 'test_cache_key_123', // Duplicate key
        data: { test: 'duplicate' },
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

    if (!error) {
      throw new Error('Duplicate cache key should be rejected');
    }

    logSuccess('LinkedIn Cache Table - Cache Key Unique Constraint');
    cacheResults.passed++;
  } catch (error) {
    logError('LinkedIn Cache Table - Cache Key Unique Constraint', error);
  }

  dbTestResults.total += cacheResults.total;
  dbTestResults.passed += cacheResults.passed;
  dbTestResults.failed += (cacheResults.total - cacheResults.passed);
  dbTestResults.tableTests.linkedin_cache = cacheResults;

  return cacheResults;
}

/**
 * 7. SCORING_EVENTS TABLE TESTS
 */
async function testScoringEventsTable() {
  log('Testing Scoring Events Table...');
  const scoringResults = { passed: 0, total: 0 };

  // Test 7.1: Create Scoring Event
  try {
    scoringResults.total++;
    const scoringData = {
      commenter_id: testData.commenter.id,
      user_id: testData.user.id,
      score: 8.5,
      boost_terms: ['test', 'database', 'backend'],
      down_terms: ['personal', 'vacation'],
      analysis_depth: 'detailed',
      confidence: 0.85
    };

    const { data, error } = await supabase
      .from('scoring_events')
      .insert(scoringData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create scoring event: ${error.message}`);
    }

    if (!data.id || data.score !== 8.5 || data.confidence !== 0.85) {
      throw new Error('Scoring event record missing or incorrect data');
    }

    logSuccess('Scoring Events Table - Create Scoring Event');
    scoringResults.passed++;
  } catch (error) {
    logError('Scoring Events Table - Create Scoring Event', error);
  }

  // Test 7.2: Read Scoring Events by Commenter
  try {
    scoringResults.total++;
    const { data, error } = await supabase
      .from('scoring_events')
      .select('*')
      .eq('commenter_id', testData.commenter.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to read scoring events: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No scoring events found for commenter');
    }

    if (!data[0].boost_terms || !Array.isArray(data[0].boost_terms)) {
      throw new Error('Boost terms array not stored correctly');
    }

    logSuccess('Scoring Events Table - Read Scoring Events by Commenter');
    scoringResults.passed++;
  } catch (error) {
    logError('Scoring Events Table - Read Scoring Events by Commenter', error);
  }

  dbTestResults.total += scoringResults.total;
  dbTestResults.passed += scoringResults.passed;
  dbTestResults.failed += (scoringResults.total - scoringResults.passed);
  dbTestResults.tableTests.scoring_events = scoringResults;

  return scoringResults;
}

/**
 * 8. RELATIONSHIP & CASCADE TESTS
 */
async function testRelationshipsAndCascades() {
  log('Testing Table Relationships and Cascades...');
  const relationshipResults = { passed: 0, total: 0 };

  // Test 8.1: JOIN Operations
  try {
    relationshipResults.total++;
    const { data, error } = await supabase
      .from('research_sessions')
      .select(`
        *,
        users!inner(id, email, first_name, last_name),
        commenters(id, name, headline, relevance_score)
      `)
      .eq('id', testData.session.id)
      .single();

    if (error) {
      throw new Error(`Failed to perform JOIN operation: ${error.message}`);
    }

    if (!data.users || !data.commenters) {
      throw new Error('JOIN operation missing related data');
    }

    if (data.users.email !== testData.user.email) {
      throw new Error('JOIN returned incorrect user data');
    }

    logSuccess('Table Relationships - JOIN Operations');
    relationshipResults.passed++;
  } catch (error) {
    logError('Table Relationships - JOIN Operations', error);
  }

  // Test 8.2: Cascade Delete (Test with caution)
  // Note: This is a destructive test - we'll create separate test data
  try {
    relationshipResults.total++;
    
    // Create a temporary user for cascade testing
    const { data: tempUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: `cascade-test-${Date.now()}@example.com`,
        password_hash: 'test_hash',
        first_name: 'Cascade',
        last_name: 'Test'
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create temp user for cascade test: ${userError.message}`);
    }

    // Create a session for this user
    const { data: tempSession, error: sessionError } = await supabase
      .from('research_sessions')
      .insert({
        user_id: tempUser.id,
        post_url: 'https://linkedin.com/posts/cascade-test',
        session_name: 'Cascade Test Session'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create temp session: ${sessionError.message}`);
    }

    // Delete the user - should cascade to sessions
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', tempUser.id);

    if (deleteError) {
      throw new Error(`Failed to delete temp user: ${deleteError.message}`);
    }

    // Check that session was also deleted
    const { data: remainingSession } = await supabase
      .from('research_sessions')
      .select('id')
      .eq('id', tempSession.id)
      .single();

    if (remainingSession) {
      throw new Error('Session was not cascade deleted when user was deleted');
    }

    logSuccess('Table Relationships - Cascade Delete');
    relationshipResults.passed++;
  } catch (error) {
    logError('Table Relationships - Cascade Delete', error);
  }

  dbTestResults.total += relationshipResults.total;
  dbTestResults.passed += relationshipResults.passed;
  dbTestResults.failed += (relationshipResults.total - relationshipResults.passed);
  dbTestResults.tableTests.relationships = relationshipResults;

  return relationshipResults;
}

/**
 * CLEANUP TEST DATA
 */
async function cleanupTestData() {
  log('Cleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    await supabase.from('scoring_events').delete().eq('user_id', testData.user.id);
    await supabase.from('user_feedback').delete().eq('user_id', testData.user.id);
    await supabase.from('commenters').delete().eq('session_id', testData.session.id);
    await supabase.from('research_sessions').delete().eq('user_id', testData.user.id);
    await supabase.from('api_rate_limits').delete().eq('user_id', testData.user.id);
    await supabase.from('linkedin_cache').delete().eq('cache_key', 'test_cache_key_123');
    await supabase.from('users').delete().eq('id', testData.user.id);
    
    log('✅ Test data cleaned up successfully');
  } catch (error) {
    log(`⚠️ Warning: Failed to cleanup some test data: ${error.message}`, 'WARN');
  }
}

/**
 * MAIN DATABASE TEST EXECUTION
 */
async function runDatabaseTests() {
  const startTime = Date.now();
  
  log('🗄️  Starting Database Integration Tests');
  log('='.repeat(50));

  try {
    // Test database connection
    const { error: connectionError } = await supabase.from('users').select('count').limit(1);
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    
    log('✅ Database connection established');
    log('');

    // Run all table tests
    await testUsersTable();
    log('');
    
    await testResearchSessionsTable();
    log('');
    
    await testCommentersTable();
    log('');
    
    await testUserFeedbackTable();
    log('');
    
    await testApiRateLimitsTable();
    log('');
    
    await testLinkedInCacheTable();
    log('');
    
    await testScoringEventsTable();
    log('');
    
    await testRelationshipsAndCascades();
    log('');

  } catch (error) {
    log(`❌ Database test suite execution failed: ${error.message}`, 'ERROR');
    dbTestResults.errors.push({ test: 'Database Test Suite Execution', error: error.message });
  } finally {
    // Always try to cleanup
    await cleanupTestData();
  }

  // Generate final report
  const executionTime = Date.now() - startTime;
  generateDatabaseTestReport(executionTime);
}

/**
 * GENERATE DATABASE TEST REPORT
 */
function generateDatabaseTestReport(executionTime) {
  log('='.repeat(50));
  log('📊 DATABASE INTEGRATION TEST REPORT');
  log('='.repeat(50));
  
  const passRate = dbTestResults.total > 0 ? (dbTestResults.passed / dbTestResults.total * 100).toFixed(2) : 0;
  
  log(`Total Database Tests: ${dbTestResults.total}`);
  log(`Passed: ${dbTestResults.passed} (${passRate}%)`);
  log(`Failed: ${dbTestResults.failed}`);
  log(`Execution Time: ${(executionTime / 1000).toFixed(2)} seconds`);
  log('');
  
  // Table-by-table breakdown
  log('📋 DATABASE COVERAGE BY TABLE:');
  log('-'.repeat(35));
  
  const tableNames = {
    users: 'Users',
    research_sessions: 'Research Sessions',
    commenters: 'Commenters',
    user_feedback: 'User Feedback',
    api_rate_limits: 'API Rate Limits',
    linkedin_cache: 'LinkedIn Cache',
    scoring_events: 'Scoring Events',
    relationships: 'Relationships & Cascades'
  };

  Object.entries(dbTestResults.tableTests).forEach(([table, results]) => {
    if (results && results.total) {
      const tablePassRate = (results.passed / results.total * 100).toFixed(1);
      const displayName = tableNames[table] || table;
      log(`${displayName.padEnd(25)}: ${results.passed}/${results.total} (${tablePassRate}%)`);
    }
  });
  log('');
  
  // Error details
  if (dbTestResults.errors.length > 0) {
    log('❌ FAILED DATABASE TESTS:');
    log('-'.repeat(30));
    dbTestResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}`);
      log(`   Error: ${error.error}`);
      log('');
    });
  }
  
  // Database quality assessment
  log('🎯 DATABASE QUALITY ASSESSMENT:');
  log('-'.repeat(35));
  
  if (passRate >= 95) {
    log('✅ EXCELLENT - Database schema and operations are production-ready');
  } else if (passRate >= 85) {
    log('🟡 GOOD - Minor database issues need attention');  
  } else if (passRate >= 70) {
    log('🟠 FAIR - Several database issues require fixes');
  } else {
    log('🔴 POOR - Major database issues require immediate attention');
  }
  
  // Database feature compliance
  log('');
  log('📋 DATABASE FEATURE COMPLIANCE:');
  log('-'.repeat(35));
  log(`✅ User Management: ${dbTestResults.tableTests.users ? 'TESTED' : 'MISSING'}`);
  log(`✅ Research Sessions: ${dbTestResults.tableTests.research_sessions ? 'TESTED' : 'MISSING'}`);
  log(`✅ Commenter Storage: ${dbTestResults.tableTests.commenters ? 'TESTED' : 'MISSING'}`);
  log(`✅ User Feedback: ${dbTestResults.tableTests.user_feedback ? 'TESTED' : 'MISSING'}`);
  log(`✅ Rate Limiting: ${dbTestResults.tableTests.api_rate_limits ? 'TESTED' : 'MISSING'}`);
  log(`✅ Caching System: ${dbTestResults.tableTests.linkedin_cache ? 'TESTED' : 'MISSING'}`);
  log(`✅ Analytics/Scoring: ${dbTestResults.tableTests.scoring_events ? 'TESTED' : 'MISSING'}`);
  log(`✅ Data Relationships: ${dbTestResults.tableTests.relationships ? 'TESTED' : 'MISSING'}`);
  
  log('='.repeat(50));
  log(`🏁 Database tests completed with ${passRate}% pass rate`);
  
  return {
    total: dbTestResults.total,
    passed: dbTestResults.passed,
    failed: dbTestResults.failed,
    passRate: parseFloat(passRate),
    executionTime,
    tableResults: dbTestResults.tableTests,
    errors: dbTestResults.errors
  };
}

// Run the database tests
if (require.main === module) {
  runDatabaseTests();
}

module.exports = {
  runDatabaseTests,
  dbTestResults
};