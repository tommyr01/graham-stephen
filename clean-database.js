#!/usr/bin/env node

/**
 * Clean Database - Remove All Scoring System Tables
 * Removes all lead scoring related tables and functions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ocfnnlsaxhxowmjtquwf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZm5ubHNheGh4b3dtanRxdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2NTM4MiwiZXhwIjoyMDcwNzQxMzgyfQ.PuigWslKANTgim5dx_Hjeij2b0fn0LwpyGVprwXe2hs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanDatabase() {
  console.log('🧹 Cleaning database - Removing all lead scoring system tables...\n');
  
  const cleanupStatements = [
    // Drop prediction/scoring tables
    'DROP TABLE IF EXISTS prediction_results CASCADE;',
    'DROP TABLE IF EXISTS decision_patterns CASCADE;',
    'DROP TABLE IF EXISTS training_decisions CASCADE;',
    'DROP TABLE IF EXISTS content_analysis CASCADE;',
    'DROP TABLE IF EXISTS prospect_content_summary CASCADE;',
    
    // Drop feedback loop tables
    'DROP TABLE IF EXISTS user_feedback_enhanced CASCADE;',
    'DROP TABLE IF EXISTS team_learning_patterns CASCADE;',
    'DROP TABLE IF EXISTS user_preference_profiles CASCADE;',
    'DROP TABLE IF EXISTS learning_pipeline_jobs CASCADE;',
    'DROP TABLE IF EXISTS outcome_tracking CASCADE;',
    'DROP TABLE IF EXISTS model_performance_metrics CASCADE;',
    'DROP TABLE IF EXISTS batch_feedback_sessions CASCADE;',
    'DROP TABLE IF EXISTS user_privacy_settings CASCADE;',
    
    // Drop custom types
    'DROP TYPE IF EXISTS feedback_type CASCADE;',
    'DROP TYPE IF EXISTS feedback_status CASCADE;',
    'DROP TYPE IF EXISTS learning_stage CASCADE;',
    'DROP TYPE IF EXISTS preference_weight CASCADE;',
    
    // Drop functions
    'DROP FUNCTION IF EXISTS clean_expired_prediction_cache();',
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < cleanupStatements.length; i++) {
    const statement = cleanupStatements[i];
    
    try {
      console.log(`Executing cleanup ${i + 1}/${cleanupStatements.length}...`);
      
      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('sql', {
        query: statement
      });
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('Could not find')) {
          console.log(`⚠️  Statement ${i + 1}: Already removed or doesn't exist`);
        } else {
          console.error(`❌ Statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✅ Statement ${i + 1}: Success`);
        successCount++;
      }
    } catch (err) {
      if (err.message.includes('does not exist') || err.message.includes('Could not find')) {
        console.log(`⚠️  Statement ${i + 1}: Already removed or doesn't exist`);
      } else {
        console.error(`❌ Statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
  }
  
  console.log('\n📊 Database Cleanup Summary:');
  console.log(`✅ Successful cleanups: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  // Verify remaining tables
  console.log('\n🔍 Verifying core tables still exist...');
  const coreTables = [
    'users',
    'research_sessions',
    'commenters', 
    'user_feedback',
    'api_rate_limits',
    'linkedin_cache',
    'scoring_events'
  ];
  
  let coreTableCount = 0;
  for (const tableName of coreTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`⚠️  Core table '${tableName}': ${error.message}`);
      } else {
        console.log(`✅ Core table '${tableName}': EXISTS and accessible`);
        coreTableCount++;
      }
    } catch (err) {
      console.log(`⚠️  Core table '${tableName}': ${err.message}`);
    }
  }
  
  console.log('\n🎉 Database cleanup complete!');
  console.log(`✅ Core tables preserved: ${coreTableCount}/${coreTables.length}`);
  console.log('🚀 The application is now clean and ready for fresh lead scoring development');
  
  console.log('\n📋 What remains:');
  console.log('   • LinkedIn profile research functionality');
  console.log('   • Comment extraction and analysis');
  console.log('   • User management and sessions');
  console.log('   • API rate limiting and caching');
  console.log('   • Basic scoring events (if needed)');
  
  console.log('\n🗑️  What was removed:');
  console.log('   • AI prediction and scoring engines');
  console.log('   • Content intelligence analysis');
  console.log('   • Training decisions and patterns');
  console.log('   • Feedback loop and learning systems');
  console.log('   • Performance monitoring for scoring');
}

cleanDatabase().catch(console.error);