#!/usr/bin/env node

/**
 * Apply Intelligence System Migration
 * Creates all tables needed for the AI-powered feedback and learning system
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

async function applyIntelligenceMigration() {
  console.log('🧠 Applying Intelligence System Migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, 'graham', 'migrations', '004_intelligence_system.sql');
  let migrationSQL = '';

  try {
    migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded successfully');
  } catch (error) {
    console.error('❌ Could not read migration file:', error.message);
    return;
  }

  // Split into individual statements and filter out comments/empty lines
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => 
      stmt && 
      !stmt.startsWith('--') && 
      !stmt.match(/^\s*$/) &&
      stmt !== 'BEGIN' &&
      stmt !== 'COMMIT'
    );

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    try {
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      // Execute the statement using Supabase's SQL function
      const { data, error } = await supabase.rpc('sql', {
        query: statement + ';'
      });

      if (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`⚠️  Statement ${i + 1}: Already exists or dependency issue`);
          skipCount++;
        } else {
          console.error(`❌ Statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✅ Statement ${i + 1}: Success`);
        successCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.error(`❌ Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  // Test the new tables
  console.log('\n🔍 Testing intelligence system tables...');
  const intelligenceTables = [
    'user_intelligence_profiles',
    'research_session_intelligence',
    'feedback_interactions',
    'discovered_patterns',
    'research_quality_metrics',
    'agent_improvements'
  ];

  let workingTables = 0;
  for (const tableName of intelligenceTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${tableName}': ${error.message}`);
      } else {
        console.log(`✅ Table '${tableName}': EXISTS and accessible`);
        workingTables++;
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}': ${err.message}`);
    }
  }

  console.log(`\n📈 Intelligence System Status:`);
  console.log(`✅ Working tables: ${workingTables}/${intelligenceTables.length}`);

  if (workingTables === intelligenceTables.length) {
    console.log('\n🎉 Intelligence System successfully deployed!');
    console.log('\n🚀 What\'s now available:');
    console.log('   • User intelligence profile tracking');
    console.log('   • Detailed research session analytics');
    console.log('   • Comprehensive feedback collection');
    console.log('   • ML pattern discovery system');
    console.log('   • Quality metrics and improvement tracking');
    console.log('   • Autonomous agent improvement logging');
    
    console.log('\n📋 Next steps:');
    console.log('   1. Implement implicit feedback collection');
    console.log('   2. Add explicit feedback UI components');
    console.log('   3. Build pattern discovery algorithms');
    console.log('   4. Deploy learning agents');
  } else {
    console.log('\n⚠️  Some tables may need manual creation in Supabase dashboard');
    console.log('   Go to: https://supabase.com/dashboard/project/ocfnnlsaxhxowmjtquwf/sql');
  }
}

// Run the migration
applyIntelligenceMigration().catch(console.error);