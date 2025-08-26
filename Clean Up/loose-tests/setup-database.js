#!/usr/bin/env node

/**
 * Database Setup Script for Graham Stephens Build
 * 
 * This script creates the necessary tables in your Supabase database
 * using your existing environment configuration.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Setting up Graham Stephens Build database...\n');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('   - SUPABASE_URL');
    if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Connected to Supabase');
  console.log(`   Project: ${supabaseUrl.split('//')[1].split('.')[0]}`);

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'supabase-schema-fixed.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');

    // Execute the schema
    console.log('🔄 Creating database tables...');
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: schemaSql });
    
    if (error) {
      // Try direct execution if RPC fails
      console.log('📋 Attempting direct SQL execution...');
      
      // Split the SQL into individual statements
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        try {
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          
          if (stmtError) {
            if (stmtError.message.includes('already exists')) {
              console.log(`⚠️  Skipped (already exists): Statement ${i + 1}`);
              skipCount++;
            } else {
              console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
              console.log(`   SQL: ${statement.substring(0, 100)}...`);
            }
          } else {
            successCount++;
          }
        } catch (directError) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, directError.message);
        }
      }

      console.log(`\n📊 Execution Summary:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ⚠️  Skipped: ${skipCount}`);
      console.log(`   ❌ Failed: ${statements.length - successCount - skipCount}`);
      
    } else {
      console.log('✅ Database schema created successfully');
    }

    // Test the database connection with a simple query
    console.log('\n🔍 Testing database connection...');
    
    const { data, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.warn('⚠️  Database test query failed:', testError.message);
      console.log('   This might mean the tables weren\'t created properly.');
    } else {
      console.log('✅ Database connection test passed');
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Check your Supabase dashboard to verify tables were created');
    console.log('2. Run: npm run dev');
    console.log('3. Test the API endpoints');
    console.log('4. Visit: http://localhost:3000/api/health');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Verify your SUPABASE_SERVICE_ROLE_KEY has admin privileges');
    console.error('2. Check your network connection to Supabase');
    console.error('3. Try running the SQL manually in your Supabase SQL editor');
    process.exit(1);
  }
}

// Manual SQL execution instructions
function printManualInstructions() {
  console.log('\n📋 MANUAL SETUP INSTRUCTIONS:');
  console.log('If the automatic setup failed, you can run the SQL manually:');
  console.log('');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy the contents of: supabase-schema-fixed.sql');
  console.log('4. Paste and run the SQL in the editor');
  console.log('');
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      printManualInstructions();
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      printManualInstructions();
      process.exit(1);
    });
}

module.exports = { setupDatabase };