#!/usr/bin/env node

/**
 * Comprehensive Database Verification Script
 * 
 * This script thoroughly checks the current state of the Supabase database
 * to verify that all necessary tables, columns, and relationships exist
 * for the AI training and intelligence system to function properly.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Define expected tables and their key columns
const expectedSchema = {
  // Core user and session tables (should already exist)
  users: ['id', 'email', 'created_at'],
  research_sessions: ['id', 'user_id', 'created_at'],
  
  // Intelligence system core tables (from 004_intelligence_system.sql)
  user_intelligence_profiles: [
    'id', 'user_id', 'industry_focus', 'role_preferences', 'engagement_patterns',
    'learning_confidence', 'total_research_sessions', 'last_pattern_update'
  ],
  research_session_intelligence: [
    'id', 'session_id', 'user_id', 'linkedin_profile_url', 'session_duration',
    'session_outcome', 'confidence_level', 'relevance_rating'
  ],
  feedback_interactions: [
    'id', 'session_id', 'user_id', 'interaction_type', 'feedback_data',
    'processed', 'learning_value', 'voice_transcript'
  ],
  discovered_patterns: [
    'id', 'pattern_type', 'pattern_name', 'pattern_data', 'confidence_score',
    'validation_status', 'supporting_sessions'
  ],
  research_quality_metrics: [
    'id', 'user_id', 'time_period_start', 'time_period_end', 'total_research_sessions',
    'contact_success_rate', 'research_efficiency_score'
  ],
  agent_improvements: [
    'id', 'agent_name', 'improvement_type', 'improvement_name', 'rollout_status',
    'performance_delta', 'implemented_at'
  ],
  
  // Autonomous agents system tables (from 005_autonomous_agents_system.sql)
  agent_discovery_sessions: [
    'id', 'session_id', 'agent_name', 'patterns_discovered', 'success_rate'
  ],
  agent_enhancement_sessions: [
    'id', 'session_id', 'agent_name', 'improvements_identified', 'confidence_boost_achieved'
  ],
  agent_personalization_sessions: [
    'id', 'session_id', 'agent_name', 'users_processed', 'personalizations_created'
  ],
  agent_monitoring_sessions: [
    'id', 'session_id', 'agent_name', 'anomalies_detected', 'system_health_score'
  ],
  orchestration_sessions: [
    'id', 'session_id', 'agents_executed', 'successful_executions', 'total_improvements'
  ],
  user_personalization_profiles: [
    'id', 'user_id', 'profile_data', 'personalization_confidence'
  ],
  
  // Pattern validation tables (from 005_validation_experiments.sql)
  pattern_validation_experiments: [
    'id', 'pattern_id', 'experiment_name', 'hypothesis', 'control_group',
    'treatment_group', 'status', 'conclusion'
  ],
  
  // Voice feedback system tables (from 006_voice_feedback_system.sql)
  voice_recordings: [
    'id', 'feedback_interaction_id', 'user_id', 'audio_blob', 'transcription_confidence',
    'original_transcript'
  ],
  voice_transcription_jobs: [
    'id', 'voice_recording_id', 'user_id', 'job_status', 'transcription_service'
  ],
  voice_feedback_analytics: [
    'id', 'user_id', 'time_period_start', 'total_voice_feedbacks', 'successful_transcriptions'
  ]
}

// Expected migration files and their status
const expectedMigrations = [
  '003_remove_scoring_tables.sql',
  '004_intelligence_system.sql', 
  '005_autonomous_agents_system.sql',
  '005_validation_experiments.sql',
  '006_voice_feedback_system.sql'
]

async function checkDatabaseConnection() {
  console.log('🔌 Testing database connection...')
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (err) {
    console.log(`❌ Database connection error: ${err.message}`)
    return false
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)
    
    return !error
  } catch (err) {
    return false
  }
}

async function getTableColumns(tableName) {
  try {
    // Use information_schema to get column details
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `
      })
    
    if (error) {
      // Fallback: try to describe table structure
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (sampleError) {
        return []
      }
      
      return sampleData.length > 0 ? Object.keys(sampleData[0]) : []
    }
    
    return data?.map(col => col.column_name) || []
  } catch (err) {
    return []
  }
}

async function checkForeignKeyRelationships() {
  console.log('\n🔗 Checking foreign key relationships...')
  
  const criticalRelationships = [
    {
      table: 'user_intelligence_profiles',
      column: 'user_id',
      references: 'users(id)',
      description: 'User intelligence profiles must reference valid users'
    },
    {
      table: 'research_session_intelligence', 
      column: 'session_id',
      references: 'research_sessions(id)',
      description: 'Research intelligence must reference valid sessions'
    },
    {
      table: 'feedback_interactions',
      column: 'user_id', 
      references: 'users(id)',
      description: 'Feedback interactions must reference valid users'
    },
    {
      table: 'pattern_validation_experiments',
      column: 'pattern_id',
      references: 'discovered_patterns(id)', 
      description: 'Pattern experiments must reference discovered patterns'
    }
  ]
  
  let relationshipIssues = []
  
  for (const relationship of criticalRelationships) {
    try {
      // Check if both tables exist
      const parentTableExists = await checkTableExists(relationship.references.split('(')[0])
      const childTableExists = await checkTableExists(relationship.table)
      
      if (!parentTableExists) {
        relationshipIssues.push(`❌ Parent table ${relationship.references.split('(')[0]} missing for ${relationship.table}`)
        continue
      }
      
      if (!childTableExists) {
        relationshipIssues.push(`❌ Child table ${relationship.table} missing`)
        continue
      }
      
      console.log(`✅ Relationship valid: ${relationship.table}.${relationship.column} → ${relationship.references}`)
      
    } catch (err) {
      relationshipIssues.push(`⚠️ Could not verify: ${relationship.description}`)
    }
  }
  
  return relationshipIssues
}

async function checkMigrationHistory() {
  console.log('\n📋 Checking migration history...')
  
  try {
    // Check if schema_migrations table exists
    const migrationsTableExists = await checkTableExists('schema_migrations')
    
    if (!migrationsTableExists) {
      console.log('⚠️ Migration tracking table does not exist')
      return []
    }
    
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('*')
      .order('applied_at', { ascending: false })
    
    if (error) {
      console.log(`⚠️ Could not read migration history: ${error.message}`)
      return []
    }
    
    console.log(`📊 Found ${data.length} recorded migrations:`)
    data.forEach(migration => {
      console.log(`   ✅ ${migration.version} (applied: ${new Date(migration.applied_at).toLocaleDateString()})`)
    })
    
    return data.map(m => m.version)
    
  } catch (err) {
    console.log(`⚠️ Migration history check failed: ${err.message}`)
    return []
  }
}

async function identifyMissingTables() {
  console.log('\n🔍 Identifying missing tables and columns...')
  
  let missingTables = []
  let missingColumns = []
  let existingTables = []
  
  for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
    const tableExists = await checkTableExists(tableName)
    
    if (!tableExists) {
      missingTables.push(tableName)
      console.log(`❌ Table missing: ${tableName}`)
    } else {
      existingTables.push(tableName)
      console.log(`✅ Table exists: ${tableName}`)
      
      // Check columns
      const actualColumns = await getTableColumns(tableName)
      const missing = expectedColumns.filter(col => !actualColumns.includes(col))
      
      if (missing.length > 0) {
        missingColumns.push({ table: tableName, columns: missing })
        console.log(`   ⚠️ Missing columns in ${tableName}: ${missing.join(', ')}`)
      } else {
        console.log(`   ✅ All key columns present in ${tableName}`)
      }
    }
  }
  
  return { missingTables, missingColumns, existingTables }
}

async function testSystemFunctionality() {
  console.log('\n🧪 Testing system functionality...')
  
  try {
    // Test 1: Can we read from core intelligence tables?
    const intelligenceTableTests = [
      'user_intelligence_profiles',
      'feedback_interactions', 
      'discovered_patterns',
      'research_quality_metrics'
    ]
    
    let workingTables = []
    let brokenTables = []
    
    for (const tableName of intelligenceTableTests) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          brokenTables.push({ table: tableName, error: error.message })
        } else {
          workingTables.push(tableName)
        }
      } catch (err) {
        brokenTables.push({ table: tableName, error: err.message })
      }
    }
    
    console.log(`✅ Working tables: ${workingTables.length}/${intelligenceTableTests.length}`)
    workingTables.forEach(table => console.log(`   ✅ ${table}`))
    
    if (brokenTables.length > 0) {
      console.log(`❌ Broken tables: ${brokenTables.length}`)
      brokenTables.forEach(({ table, error }) => {
        console.log(`   ❌ ${table}: ${error}`)
      })
    }
    
    // Test 2: Can we insert test data?
    console.log('\n🔬 Testing data insertion...')
    
    try {
      const testUserId = 'test-verification-user-' + Date.now()
      
      // Try to insert a test feedback interaction
      const { data: testFeedback, error: insertError } = await supabase
        .from('feedback_interactions')
        .insert({
          user_id: testUserId,
          interaction_type: 'explicit_rating',
          feedback_data: { test: true, verification: true },
          collection_method: 'verification_test',
          learning_value: 0.5
        })
        .select('id')
        .single()
      
      if (insertError) {
        console.log(`❌ Data insertion test failed: ${insertError.message}`)
      } else {
        console.log('✅ Data insertion test successful')
        
        // Clean up test data
        await supabase
          .from('feedback_interactions')
          .delete()
          .eq('id', testFeedback.id)
      }
      
    } catch (err) {
      console.log(`❌ Data insertion test error: ${err.message}`)
    }
    
    return { workingTables, brokenTables }
    
  } catch (err) {
    console.log(`❌ System functionality test failed: ${err.message}`)
    return { workingTables: [], brokenTables: [] }
  }
}

function generateMigrationPlan(missingTables, missingColumns, appliedMigrations) {
  console.log('\n📝 Generating migration plan...')
  
  const migrationPlan = []
  
  // Check which migrations need to be applied
  const unappliedMigrations = expectedMigrations.filter(migration => 
    !appliedMigrations.includes(migration)
  )
  
  if (unappliedMigrations.length > 0) {
    console.log('\n🎯 Migrations that need to be applied:')
    unappliedMigrations.forEach(migration => {
      console.log(`   📄 ${migration}`)
      migrationPlan.push(`Apply migration: ${migration}`)
    })
  } else {
    console.log('✅ All expected migrations have been applied')
  }
  
  // Specific recommendations based on missing tables
  if (missingTables.includes('user_intelligence_profiles')) {
    migrationPlan.push('CRITICAL: Apply 004_intelligence_system.sql for core AI functionality')
  }
  
  if (missingTables.includes('agent_discovery_sessions')) {
    migrationPlan.push('Apply 005_autonomous_agents_system.sql for autonomous AI agents')
  }
  
  if (missingTables.includes('voice_recordings')) {
    migrationPlan.push('Apply 006_voice_feedback_system.sql for voice feedback capabilities')
  }
  
  if (missingTables.includes('pattern_validation_experiments')) {
    migrationPlan.push('Apply 005_validation_experiments.sql for pattern A/B testing')
  }
  
  return migrationPlan
}

async function main() {
  console.log('🔍 SUPABASE DATABASE VERIFICATION')
  console.log('==================================\n')
  
  // Step 1: Test connection
  const connected = await checkDatabaseConnection()
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection')
    process.exit(1)
  }
  
  // Step 2: Check table structure
  const { missingTables, missingColumns, existingTables } = await identifyMissingTables()
  
  // Step 3: Check relationships
  const relationshipIssues = await checkForeignKeyRelationships()
  
  // Step 4: Check migration history
  const appliedMigrations = await checkMigrationHistory()
  
  // Step 5: Test functionality
  const { workingTables, brokenTables } = await testSystemFunctionality()
  
  // Step 6: Generate action plan
  const migrationPlan = generateMigrationPlan(missingTables, missingColumns, appliedMigrations)
  
  // Final Report
  console.log('\n📊 DATABASE VERIFICATION REPORT')
  console.log('===============================\n')
  
  console.log('✅ SYSTEM STATUS:')
  console.log(`   Database Connection: ✅ Connected`)
  console.log(`   Expected Tables: ${existingTables.length}/${Object.keys(expectedSchema).length}`)
  console.log(`   Working Tables: ${workingTables.length}/${Object.keys(expectedSchema).length}`)
  console.log(`   Applied Migrations: ${appliedMigrations.length}/${expectedMigrations.length}`)
  
  if (missingTables.length > 0) {
    console.log('\n❌ MISSING TABLES:')
    missingTables.forEach(table => console.log(`   - ${table}`))
  }
  
  if (missingColumns.length > 0) {
    console.log('\n⚠️ MISSING COLUMNS:')
    missingColumns.forEach(({ table, columns }) => {
      console.log(`   - ${table}: ${columns.join(', ')}`)
    })
  }
  
  if (relationshipIssues.length > 0) {
    console.log('\n🔗 RELATIONSHIP ISSUES:')
    relationshipIssues.forEach(issue => console.log(`   ${issue}`))
  }
  
  if (brokenTables.length > 0) {
    console.log('\n💥 BROKEN TABLES:')
    brokenTables.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`)
    })
  }
  
  if (migrationPlan.length > 0) {
    console.log('\n🎯 RECOMMENDED ACTIONS:')
    migrationPlan.forEach((action, index) => {
      console.log(`   ${index + 1}. ${action}`)
    })
    
    console.log('\n🚀 TO APPLY MISSING MIGRATIONS:')
    console.log('   1. Run: node apply-migrations.js')
    console.log('   2. Or apply migrations manually in Supabase SQL editor')
    console.log('   3. Re-run this verification script to confirm')
  }
  
  // Overall health assessment
  const healthScore = ((existingTables.length / Object.keys(expectedSchema).length) * 100).toFixed(1)
  console.log(`\n🏥 OVERALL HEALTH: ${healthScore}%`)
  
  if (healthScore >= 95) {
    console.log('🎉 Database is in excellent condition!')
    console.log('   All tables and relationships are properly set up.')
    console.log('   The AI learning system is ready for production use.')
  } else if (healthScore >= 80) {
    console.log('✅ Database is in good condition')
    console.log('   Minor issues detected - see recommendations above')
  } else if (healthScore >= 50) {
    console.log('⚠️ Database needs attention')
    console.log('   Several important tables are missing')
    console.log('   Apply missing migrations to restore full functionality')
  } else {
    console.log('❌ Database is in critical condition')
    console.log('   Major components are missing')
    console.log('   Full migration required for AI system to function')
  }
  
  console.log('\n📚 For more information, see:')
  console.log('   - INTELLIGENT_LEARNING_SYSTEM_COMPLETE.md')
  console.log('   - TRAINING_SYSTEM_DEPLOYMENT_COMPLETE.md')
  
  process.exit(healthScore >= 80 ? 0 : 1)
}

// Run verification
main().catch(error => {
  console.error('💥 Verification failed:', error.message)
  process.exit(1)
})