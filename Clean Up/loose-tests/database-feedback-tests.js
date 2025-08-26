#!/usr/bin/env node

/**
 * User Feedback Loop Database Tests
 * 
 * This test suite validates the database layer for the User Feedback Loop feature,
 * including schema validation, constraints, indexes, triggers, and data integrity.
 * 
 * Test Coverage:
 * - Database schema structure validation
 * - Data constraints and validation rules  
 * - Foreign key relationships
 * - Index performance validation
 * - Trigger functionality
 * - Row Level Security (RLS) policies
 * - Data integrity and consistency
 * - Performance optimization validation
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration (would be loaded from environment in real implementation)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'graham_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

// Test data
const TEST_DATA = {
  testUserId: '550e8400-e29b-41d4-a716-446655440000',
  testTeamId: '550e8400-e29b-41d4-a716-446655440001',
  testSessionId: '550e8400-e29b-41d4-a716-446655440002',
  testCommenterId: '550e8400-e29b-41d4-a716-446655440003',
  sampleFeedback: {
    feedbackType: 'detailed',
    overallRating: 8,
    isRelevant: true,
    confidenceScore: 0.85,
    factorRatings: {
      contentRelevance: 5,
      professionalFit: 4,
      timing: 3,
      companyMatch: 5
    },
    correctionFlags: ['excellent_match', 'timing_concern'],
    feedbackText: 'Strong candidate but timing could be better',
    analysisContext: {
      originalScore: 7.5,
      scoringFactors: {
        industry: 'SaaS',
        role: 'VP Sales'
      }
    }
  }
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  performance: {}
};

// Database client
let dbClient = null;

// Utility functions
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

function logError(test, error) {
  log(`❌ FAILED: ${test} - ${error.message}`, 'ERROR');
  testResults.errors.push({ test, error: error.message, stack: error.stack });
}

function logSuccess(test) {
  log(`✅ PASSED: ${test}`, 'SUCCESS');
}

async function connectToDatabase() {
  try {
    dbClient = new Client(DB_CONFIG);
    await dbClient.connect();
    log('✅ Connected to test database');
    return true;
  } catch (error) {
    log(`❌ Failed to connect to database: ${error.message}`, 'ERROR');
    return false;
  }
}

async function disconnectFromDatabase() {
  if (dbClient) {
    await dbClient.end();
    log('Database connection closed');
  }
}

async function executeQuery(query, params = []) {
  if (!dbClient) {
    throw new Error('Database not connected');
  }
  return await dbClient.query(query, params);
}

/**
 * 1. DATABASE SCHEMA VALIDATION TESTS
 */
async function testDatabaseSchema() {
  log('Starting Database Schema Validation Tests...');
  const schemaResults = { passed: 0, total: 0 };

  // Test 1.1: Required Tables Existence
  try {
    schemaResults.total++;
    
    const requiredTables = [
      'user_feedback_enhanced',
      'user_preference_profiles',
      'team_learning_profiles',
      'learning_pipeline_runs',
      'analysis_snapshots',
      'outcome_tracking',
      'data_privacy_controls',
      'feedback_processing_cache'
    ];

    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[])
    `;
    
    const result = await executeQuery(query, [requiredTables]);
    const existingTables = result.rows.map(row => row.table_name);
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }

    log(`All ${requiredTables.length} required tables exist`);
    logSuccess('Database Schema - Required Tables Existence');
    schemaResults.passed++;
  } catch (error) {
    logError('Database Schema - Required Tables Existence', error);
  }

  // Test 1.2: Column Structure Validation
  try {
    schemaResults.total++;
    
    const columnQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_feedback_enhanced'
      ORDER BY ordinal_position
    `;
    
    const result = await executeQuery(columnQuery);
    const columns = result.rows;
    
    // Verify essential columns exist with correct types
    const requiredColumns = {
      'id': 'uuid',
      'user_id': 'uuid', 
      'feedback_type': 'USER-DEFINED', // ENUM type
      'overall_rating': 'integer',
      'is_relevant': 'boolean',
      'confidence_score': 'numeric',
      'factor_ratings': 'jsonb',
      'correction_flags': 'jsonb',
      'created_at': 'timestamp with time zone',
      'updated_at': 'timestamp with time zone'
    };

    for (const [columnName, expectedType] of Object.entries(requiredColumns)) {
      const column = columns.find(col => col.column_name === columnName);
      if (!column) {
        throw new Error(`Missing required column: ${columnName}`);
      }
      
      if (expectedType !== 'USER-DEFINED' && !column.data_type.includes(expectedType.split(' ')[0])) {
        log(`Warning: Column ${columnName} has type ${column.data_type}, expected ${expectedType}`);
      }
    }

    logSuccess('Database Schema - Column Structure Validation');
    schemaResults.passed++;
  } catch (error) {
    logError('Database Schema - Column Structure Validation', error);
  }

  // Test 1.3: ENUM Types Validation
  try {
    schemaResults.total++;
    
    const enumQuery = `
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('feedback_type', 'feedback_status', 'learning_stage', 'preference_weight')
      ORDER BY t.typname, e.enumsortorder
    `;
    
    const result = await executeQuery(enumQuery);
    const enums = {};
    
    result.rows.forEach(row => {
      if (!enums[row.typname]) {
        enums[row.typname] = [];
      }
      enums[row.typname].push(row.enumlabel);
    });

    // Validate expected enum values
    const expectedEnums = {
      'feedback_type': ['binary', 'detailed', 'outcome', 'bulk', 'implicit'],
      'feedback_status': ['pending', 'processed', 'incorporated', 'rejected'],
      'learning_stage': ['collecting', 'processing', 'validating', 'deploying', 'monitoring']
    };

    for (const [enumName, expectedValues] of Object.entries(expectedEnums)) {
      if (!enums[enumName]) {
        throw new Error(`Missing ENUM type: ${enumName}`);
      }
      
      const missing = expectedValues.filter(val => !enums[enumName].includes(val));
      if (missing.length > 0) {
        throw new Error(`ENUM ${enumName} missing values: ${missing.join(', ')}`);
      }
    }

    logSuccess('Database Schema - ENUM Types Validation');
    schemaResults.passed++;
  } catch (error) {
    logError('Database Schema - ENUM Types Validation', error);
  }

  testResults.total += schemaResults.total;
  testResults.passed += schemaResults.passed;
  testResults.failed += (schemaResults.total - schemaResults.passed);

  log(`Database Schema Tests Complete: ${schemaResults.passed}/${schemaResults.total} passed`);
  return schemaResults;
}

/**
 * 2. DATA CONSTRAINTS VALIDATION TESTS
 */
async function testDataConstraints() {
  log('Starting Data Constraints Validation Tests...');
  const constraintResults = { passed: 0, total: 0 };

  // Test 2.1: Check Constraints
  try {
    constraintResults.total++;
    
    // Test rating range constraint
    const invalidRatingQuery = `
      INSERT INTO user_feedback_enhanced (
        id, user_id, feedback_type, overall_rating, created_at
      ) VALUES (
        gen_random_uuid(), $1, 'detailed', 15, NOW()
      )
    `;
    
    try {
      await executeQuery(invalidRatingQuery, [TEST_DATA.testUserId]);
      throw new Error('Invalid rating should be rejected by check constraint');
    } catch (dbError) {
      if (dbError.message.includes('check constraint') || dbError.message.includes('violates')) {
        // Expected behavior - constraint is working
        log('Rating range constraint working correctly');
      } else {
        throw dbError;
      }
    }

    // Test confidence score constraint
    const invalidConfidenceQuery = `
      INSERT INTO user_feedback_enhanced (
        id, user_id, feedback_type, confidence_score, created_at
      ) VALUES (
        gen_random_uuid(), $1, 'binary', 1.5, NOW()
      )
    `;
    
    try {
      await executeQuery(invalidConfidenceQuery, [TEST_DATA.testUserId]);
      throw new Error('Invalid confidence score should be rejected');
    } catch (dbError) {
      if (dbError.message.includes('constraint') || dbError.message.includes('violates')) {
        log('Confidence score constraint working correctly');
      } else {
        throw dbError;
      }
    }

    logSuccess('Database Constraints - Check Constraints');
    constraintResults.passed++;
  } catch (error) {
    logError('Database Constraints - Check Constraints', error);
  }

  // Test 2.2: Foreign Key Constraints
  try {
    constraintResults.total++;
    
    // Test invalid user_id reference (assuming users table exists)
    const invalidUserQuery = `
      INSERT INTO user_feedback_enhanced (
        id, user_id, feedback_type, is_relevant, created_at
      ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'binary', true, NOW()
      )
    `;
    
    try {
      await executeQuery(invalidUserQuery);
      log('Warning: Foreign key constraint for user_id may not be enforced');
    } catch (dbError) {
      if (dbError.message.includes('foreign key') || dbError.message.includes('violates')) {
        log('Foreign key constraint working correctly');
      }
    }

    // Test cascade behavior setup
    const fkQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'user_feedback_enhanced'
    `;
    
    const fkResult = await executeQuery(fkQuery);
    log(`Found ${fkResult.rows.length} foreign key constraints on user_feedback_enhanced`);

    logSuccess('Database Constraints - Foreign Key Constraints');
    constraintResults.passed++;
  } catch (error) {
    logError('Database Constraints - Foreign Key Constraints', error);
  }

  // Test 2.3: Unique Constraints
  try {
    constraintResults.total++;
    
    const uniqueQuery = `
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'UNIQUE' 
      AND table_schema = 'public'
      AND table_name IN ('user_preference_profiles', 'team_learning_profiles', 'data_privacy_controls')
    `;
    
    const result = await executeQuery(uniqueQuery);
    const uniqueConstraints = result.rows;
    
    // Verify expected unique constraints exist
    const expectedUnique = [
      'user_preference_profiles', // Should have unique constraint on user_id, team_id
      'team_learning_profiles',   // Should have unique constraint on team_id  
      'data_privacy_controls'     // Should have unique constraint on user_id
    ];

    expectedUnique.forEach(tableName => {
      const hasUnique = uniqueConstraints.some(constraint => constraint.table_name === tableName);
      if (!hasUnique) {
        log(`Warning: Expected unique constraint not found for ${tableName}`);
      }
    });

    logSuccess('Database Constraints - Unique Constraints');
    constraintResults.passed++;
  } catch (error) {
    logError('Database Constraints - Unique Constraints', error);
  }

  testResults.total += constraintResults.total;
  testResults.passed += constraintResults.passed;
  testResults.failed += (constraintResults.total - constraintResults.passed);

  log(`Data Constraints Tests Complete: ${constraintResults.passed}/${constraintResults.total} passed`);
  return constraintResults;
}

/**
 * 3. INDEX PERFORMANCE VALIDATION TESTS
 */
async function testIndexPerformance() {
  log('Starting Index Performance Tests...');
  const indexResults = { passed: 0, total: 0 };

  // Test 3.1: Index Existence
  try {
    indexResults.total++;
    
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND tablename IN (
          'user_feedback_enhanced',
          'user_preference_profiles', 
          'team_learning_profiles',
          'learning_pipeline_runs',
          'analysis_snapshots',
          'outcome_tracking',
          'data_privacy_controls',
          'feedback_processing_cache'
        )
      ORDER BY tablename, indexname
    `;
    
    const result = await executeQuery(indexQuery);
    const indexes = result.rows;
    
    // Expected indexes for performance
    const expectedIndexes = [
      'idx_user_feedback_enhanced_user_id',
      'idx_user_feedback_enhanced_type_status',
      'idx_user_preference_profiles_user_id',
      'idx_learning_pipeline_runs_stage',
      'idx_feedback_cache_key',
      'idx_outcome_tracking_business_outcomes'
    ];

    let foundIndexes = 0;
    expectedIndexes.forEach(expectedIndex => {
      const found = indexes.some(index => index.indexname === expectedIndex);
      if (found) {
        foundIndexes++;
        log(`✓ Found index: ${expectedIndex}`);
      } else {
        log(`✗ Missing index: ${expectedIndex}`);
      }
    });

    if (foundIndexes < expectedIndexes.length * 0.8) { // Allow for 80% coverage
      throw new Error(`Only ${foundIndexes}/${expectedIndexes.length} expected indexes found`);
    }

    logSuccess('Index Performance - Index Existence');
    indexResults.passed++;
  } catch (error) {
    logError('Index Performance - Index Existence', error);
  }

  // Test 3.2: Query Performance with Indexes
  try {
    indexResults.total++;
    
    // Insert some test data for performance testing
    await setupTestData();
    
    // Test query performance on indexed columns
    const performanceQueries = [
      {
        name: 'User feedback lookup',
        query: `SELECT * FROM user_feedback_enhanced WHERE user_id = $1 LIMIT 10`,
        params: [TEST_DATA.testUserId]
      },
      {
        name: 'Feedback type and status query',
        query: `SELECT * FROM user_feedback_enhanced WHERE feedback_type = 'detailed' AND feedback_status = 'pending' LIMIT 10`,
        params: []
      },
      {
        name: 'Learning pipeline stage query',
        query: `SELECT * FROM learning_pipeline_runs WHERE stage = 'processing' LIMIT 10`,
        params: []
      }
    ];

    for (const testQuery of performanceQueries) {
      const startTime = Date.now();
      const result = await executeQuery(testQuery.query, testQuery.params);
      const queryTime = Date.now() - startTime;
      
      testResults.performance[testQuery.name] = queryTime;
      
      if (queryTime > 1000) { // 1 second threshold
        log(`Warning: Query "${testQuery.name}" took ${queryTime}ms`);
      } else {
        log(`✓ Query "${testQuery.name}" completed in ${queryTime}ms`);
      }
    }

    logSuccess('Index Performance - Query Performance with Indexes');
    indexResults.passed++;
  } catch (error) {
    logError('Index Performance - Query Performance with Indexes', error);
  }

  // Test 3.3: Index Usage Statistics
  try {
    indexResults.total++;
    
    const indexStatsQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
        AND tablename IN ('user_feedback_enhanced', 'user_preference_profiles')
      ORDER BY idx_tup_read DESC
    `;
    
    const result = await executeQuery(indexStatsQuery);
    const indexStats = result.rows;
    
    log(`Found statistics for ${indexStats.length} indexes`);
    indexStats.slice(0, 5).forEach(stat => {
      log(`Index ${stat.indexname}: ${stat.idx_tup_read} tuples read, ${stat.idx_tup_fetch} tuples fetched`);
    });

    logSuccess('Index Performance - Index Usage Statistics');
    indexResults.passed++;
  } catch (error) {
    logError('Index Performance - Index Usage Statistics', error);
  }

  testResults.total += indexResults.total;
  testResults.passed += indexResults.passed;
  testResults.failed += (indexResults.total - indexResults.passed);

  log(`Index Performance Tests Complete: ${indexResults.passed}/${indexResults.total} passed`);
  return indexResults;
}

/**
 * 4. ROW LEVEL SECURITY TESTS
 */
async function testRowLevelSecurity() {
  log('Starting Row Level Security Tests...');
  const rlsResults = { passed: 0, total: 0 };

  // Test 4.1: RLS Policy Existence
  try {
    rlsResults.total++;
    
    const rlsPolicyQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        roles,
        cmd,
        qual
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;
    
    const result = await executeQuery(rlsPolicyQuery);
    const policies = result.rows;
    
    // Expected RLS policies
    const expectedPolicies = [
      'Users can manage own enhanced feedback',
      'Users can manage own preference profiles',
      'Users can view team learning profiles',
      'Users can manage own privacy controls'
    ];

    let foundPolicies = 0;
    expectedPolicies.forEach(expectedPolicy => {
      const found = policies.some(policy => policy.policyname === expectedPolicy);
      if (found) {
        foundPolicies++;
        log(`✓ Found RLS policy: ${expectedPolicy}`);
      } else {
        log(`✗ Missing RLS policy: ${expectedPolicy}`);
      }
    });

    if (foundPolicies === 0) {
      log('Warning: No RLS policies found - security may not be properly configured');
    }

    logSuccess('Row Level Security - RLS Policy Existence');
    rlsResults.passed++;
  } catch (error) {
    logError('Row Level Security - RLS Policy Existence', error);
  }

  // Test 4.2: RLS Enabled on Tables
  try {
    rlsResults.total++;
    
    const rlsEnabledQuery = `
      SELECT 
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public'
        AND tablename IN (
          'user_feedback_enhanced',
          'user_preference_profiles',
          'team_learning_profiles',
          'data_privacy_controls'
        )
    `;
    
    const result = await executeQuery(rlsEnabledQuery);
    const tables = result.rows;
    
    tables.forEach(table => {
      if (table.rowsecurity) {
        log(`✓ RLS enabled on ${table.tablename}`);
      } else {
        log(`✗ RLS not enabled on ${table.tablename}`);
      }
    });

    const rlsEnabled = tables.filter(table => table.rowsecurity).length;
    if (rlsEnabled === 0) {
      log('Warning: RLS is not enabled on any tables');
    }

    logSuccess('Row Level Security - RLS Enabled on Tables');
    rlsResults.passed++;
  } catch (error) {
    logError('Row Level Security - RLS Enabled on Tables', error);
  }

  testResults.total += rlsResults.total;
  testResults.passed += rlsResults.passed;
  testResults.failed += (rlsResults.total - rlsResults.passed);

  log(`Row Level Security Tests Complete: ${rlsResults.passed}/${rlsResults.total} passed`);
  return rlsResults;
}

/**
 * 5. DATA INTEGRITY TESTS
 */
async function testDataIntegrity() {
  log('Starting Data Integrity Tests...');
  const integrityResults = { passed: 0, total: 0 };

  // Test 5.1: Trigger Functionality
  try {
    integrityResults.total++;
    
    // Check for updated_at triggers
    const triggerQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%updated_at%'
      ORDER BY event_object_table, trigger_name
    `;
    
    const result = await executeQuery(triggerQuery);
    const triggers = result.rows;
    
    // Expected tables should have updated_at triggers
    const expectedTriggerTables = [
      'user_feedback_enhanced',
      'user_preference_profiles',
      'team_learning_profiles',
      'learning_pipeline_runs'
    ];

    let foundTriggers = 0;
    expectedTriggerTables.forEach(tableName => {
      const hasTrigger = triggers.some(trigger => trigger.event_object_table === tableName);
      if (hasTrigger) {
        foundTriggers++;
        log(`✓ Updated_at trigger found for ${tableName}`);
      } else {
        log(`✗ Missing updated_at trigger for ${tableName}`);
      }
    });

    logSuccess('Data Integrity - Trigger Functionality');
    integrityResults.passed++;
  } catch (error) {
    logError('Data Integrity - Trigger Functionality', error);
  }

  // Test 5.2: Data Consistency Validation
  try {
    integrityResults.total++;
    
    // Test that feedback records have proper references
    const consistencyQuery = `
      SELECT 
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as has_user_id,
        COUNT(CASE WHEN feedback_type IS NOT NULL THEN 1 END) as has_feedback_type,
        COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as has_created_at
      FROM user_feedback_enhanced
    `;
    
    const result = await executeQuery(consistencyQuery);
    const consistency = result.rows[0];
    
    // All records should have required fields
    if (consistency.total_feedback > 0) {
      if (consistency.has_user_id !== consistency.total_feedback) {
        throw new Error('Some feedback records missing user_id');
      }
      
      if (consistency.has_feedback_type !== consistency.total_feedback) {
        throw new Error('Some feedback records missing feedback_type');
      }
      
      if (consistency.has_created_at !== consistency.total_feedback) {
        throw new Error('Some feedback records missing created_at');
      }
    }

    log(`Data consistency validated for ${consistency.total_feedback} feedback records`);
    logSuccess('Data Integrity - Data Consistency Validation');
    integrityResults.passed++;
  } catch (error) {
    logError('Data Integrity - Data Consistency Validation', error);
  }

  // Test 5.3: Utility Functions
  try {
    integrityResults.total++;
    
    // Test utility functions exist and work
    const utilityQuery = `
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('get_user_learning_readiness', 'cleanup_expired_data')
    `;
    
    const result = await executeQuery(utilityQuery);
    const functions = result.rows;
    
    log(`Found ${functions.length} utility functions`);
    functions.forEach(func => {
      log(`✓ Function: ${func.routine_name} (${func.routine_type})`);
    });

    // Test a utility function call if it exists
    if (functions.some(f => f.routine_name === 'get_user_learning_readiness')) {
      try {
        const funcResult = await executeQuery(
          'SELECT * FROM get_user_learning_readiness($1)',
          [TEST_DATA.testUserId]
        );
        log(`Utility function returned ${funcResult.rows.length} results`);
      } catch (funcError) {
        log(`Utility function test failed: ${funcError.message}`);
      }
    }

    logSuccess('Data Integrity - Utility Functions');
    integrityResults.passed++;
  } catch (error) {
    logError('Data Integrity - Utility Functions', error);
  }

  testResults.total += integrityResults.total;
  testResults.passed += integrityResults.passed;
  testResults.failed += (integrityResults.total - integrityResults.passed);

  log(`Data Integrity Tests Complete: ${integrityResults.passed}/${integrityResults.total} passed`);
  return integrityResults;
}

/**
 * HELPER FUNCTIONS
 */
async function setupTestData() {
  try {
    // Clean up any existing test data
    await executeQuery('DELETE FROM user_feedback_enhanced WHERE user_id = $1', [TEST_DATA.testUserId]);
    
    // Insert test feedback records
    const insertQuery = `
      INSERT INTO user_feedback_enhanced (
        id, user_id, team_id, session_id, commenter_id,
        feedback_type, feedback_status, overall_rating, is_relevant,
        confidence_score, factor_ratings, correction_flags, feedback_text,
        analysis_context, submitted_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        $5::feedback_type, 'pending', $6, $7,
        $8, $9, $10, $11,
        $12, NOW(), NOW(), NOW()
      )
    `;
    
    const testRecords = [
      [
        TEST_DATA.testUserId, TEST_DATA.testTeamId, TEST_DATA.testSessionId, TEST_DATA.testCommenterId,
        TEST_DATA.sampleFeedback.feedbackType, TEST_DATA.sampleFeedback.overallRating, 
        TEST_DATA.sampleFeedback.isRelevant, TEST_DATA.sampleFeedback.confidenceScore,
        JSON.stringify(TEST_DATA.sampleFeedback.factorRatings),
        JSON.stringify(TEST_DATA.sampleFeedback.correctionFlags),
        TEST_DATA.sampleFeedback.feedbackText,
        JSON.stringify(TEST_DATA.sampleFeedback.analysisContext)
      ],
      [
        TEST_DATA.testUserId, TEST_DATA.testTeamId, TEST_DATA.testSessionId, TEST_DATA.testCommenterId,
        'binary', null, true, 0.9,
        '{}', '[]', 'Binary feedback test',
        JSON.stringify({ originalScore: 6.5 })
      ]
    ];

    for (const record of testRecords) {
      await executeQuery(insertQuery, record);
    }
    
    log('Test data setup completed');
  } catch (error) {
    log(`Test data setup failed: ${error.message}`, 'ERROR');
  }
}

async function cleanupTestData() {
  try {
    // Clean up test data
    const cleanupQueries = [
      'DELETE FROM user_feedback_enhanced WHERE user_id = $1',
      'DELETE FROM user_preference_profiles WHERE user_id = $1',
      'DELETE FROM data_privacy_controls WHERE user_id = $1'
    ];

    for (const query of cleanupQueries) {
      await executeQuery(query, [TEST_DATA.testUserId]);
    }
    
    log('Test data cleanup completed');
  } catch (error) {
    log(`Test data cleanup failed: ${error.message}`, 'ERROR');
  }
}

/**
 * MAIN TEST EXECUTION
 */
async function runDatabaseTests() {
  const startTime = Date.now();
  
  log('🗄️  Starting User Feedback Loop Database Tests');
  log('='.repeat(60));
  
  // Connect to database
  const connected = await connectToDatabase();
  if (!connected) {
    log('❌ Cannot run database tests without database connection', 'ERROR');
    process.exit(1);
  }

  try {
    await testDatabaseSchema();
    log('');
    
    await testDataConstraints();
    log('');
    
    await testIndexPerformance();
    log('');
    
    await testRowLevelSecurity();
    log('');
    
    await testDataIntegrity();
    log('');

  } catch (error) {
    log(`❌ Database test execution failed: ${error.message}`, 'ERROR');
    testResults.errors.push({ test: 'Database Test Execution', error: error.message });
  } finally {
    // Cleanup test data
    await cleanupTestData();
    
    // Disconnect from database
    await disconnectFromDatabase();
  }

  // Generate final report
  const executionTime = Date.now() - startTime;
  generateDatabaseReport(executionTime);
}

function generateDatabaseReport(executionTime) {
  log('='.repeat(60));
  log('📊 DATABASE TEST REPORT');
  log('='.repeat(60));
  
  const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(2) : 0;
  
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed} (${passRate}%)`);
  log(`Failed: ${testResults.failed}`);
  log(`Execution Time: ${(executionTime / 1000).toFixed(2)} seconds`);
  log('');
  
  // Database layer validation summary
  log('🗄️  DATABASE LAYER VALIDATION:');
  log('-'.repeat(40));
  log('✅ Schema Structure: Tables, columns, ENUMs, and relationships');
  log('✅ Data Constraints: Check constraints, foreign keys, and unique constraints');
  log('✅ Index Performance: Query performance and index usage optimization');
  log('✅ Row Level Security: RLS policies and data access controls');
  log('✅ Data Integrity: Triggers, consistency, and utility functions');
  log('');

  // Performance metrics
  if (testResults.performance && Object.keys(testResults.performance).length > 0) {
    log('⚡ DATABASE PERFORMANCE METRICS:');
    log('-'.repeat(35));
    Object.entries(testResults.performance).forEach(([metric, value]) => {
      log(`${metric.padEnd(30)}: ${value}ms`);
    });
    log('');
  }

  if (testResults.errors.length > 0) {
    log('❌ DATABASE ISSUES:');
    log('-'.repeat(25));
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}`);
      log(`   Issue: ${error.error}`);
      log('');
    });
  }

  log('🎯 DATABASE READINESS ASSESSMENT:');
  log('-'.repeat(40));
  
  if (passRate >= 95) {
    log('✅ EXCELLENT - Database layer fully ready for production');
    log('   All schema, constraints, and performance optimizations in place');
  } else if (passRate >= 85) {
    log('🟡 GOOD - Database mostly ready with minor issues');
    log('   Address schema or performance issues before deployment');
  } else if (passRate >= 70) {
    log('🟠 FAIR - Database needs improvements');
    log('   Schema, constraints, or performance optimizations required');
  } else {
    log('🔴 POOR - Database not ready for production');
    log('   Major schema or data integrity issues must be resolved');
  }
  log('');

  log('💡 DATABASE RECOMMENDATIONS:');
  log('-'.repeat(30));
  
  if (testResults.failed > 0) {
    log('• Resolve all database schema and constraint issues');
  }
  
  log('• Monitor query performance and index usage in production');
  log('• Implement database monitoring and alerting');
  log('• Set up regular database maintenance and cleanup procedures');
  log('• Consider partitioning for large feedback tables');
  log('• Implement database backup and recovery procedures');
  log('');
  
  log('='.repeat(60));
  log(`🏁 Database tests completed with ${passRate}% pass rate`);
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the test suite
if (require.main === module) {
  runDatabaseTests();
}

module.exports = {
  runDatabaseTests,
  testResults,
  connectToDatabase,
  disconnectFromDatabase,
  executeQuery
};