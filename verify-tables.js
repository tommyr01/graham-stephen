#!/usr/bin/env node

/**
 * Verify Supabase Tables
 * Checks if all required tables were created successfully
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ocfnnlsaxhxowmjtquwf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZm5ubHNheGh4b3dtanRxdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2NTM4MiwiZXhwIjoyMDcwNzQxMzgyfQ.PuigWslKANTgim5dx_Hjeij2b0fn0LwpyGVprwXe2hs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const REQUIRED_TABLES = [
  'users',
  'research_sessions',
  'commenters', 
  'user_feedback',
  'api_rate_limits',
  'linkedin_cache',
  'scoring_events'
];

async function verifyTables() {
  console.log('🔍 Verifying Supabase tables...\n');
  
  let successCount = 0;
  let totalTables = REQUIRED_TABLES.length;
  
  for (const tableName of REQUIRED_TABLES) {
    try {
      // Try to query the table (this will fail if table doesn't exist)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${tableName}': ${error.message}`);
      } else {
        console.log(`✅ Table '${tableName}': EXISTS`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}': ${err.message}`);
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${totalTables} tables verified\n`);
  
  if (successCount === totalTables) {
    console.log('🎉 All tables created successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your backend: cd graham && npm run dev');
    console.log('2. Test the API: npm run test-api');
    console.log('3. Visit health check: http://localhost:3000/api/health');
    return true;
  } else {
    console.log('⚠️  Some tables are missing. You may need to:');
    console.log('1. Run the SQL manually in your Supabase dashboard');
    console.log('2. Check the SQL Editor for any errors');
    console.log('3. Go to: https://supabase.com/dashboard/project/ocfnnlsaxhxowmjtquwf/sql');
    return false;
  }
}

async function testBasicOperations() {
  console.log('\n🧪 Testing basic database operations...\n');
  
  try {
    // Test user creation (this will test the full schema)
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password_hash: 'dummy_hash_for_test',
      first_name: 'Test',
      last_name: 'User'
    };
    
    console.log('Creating test user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
      
    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return false;
    }
    
    console.log('✅ Test user created');
    
    // Test research session creation
    console.log('Creating test research session...');
    const { data: session, error: sessionError } = await supabase
      .from('research_sessions')
      .insert({
        user_id: user.id,
        post_url: 'https://linkedin.com/test',
        session_name: 'Test Session'
      })
      .select()
      .single();
      
    if (sessionError) {
      console.log('❌ Session creation failed:', sessionError.message);
      return false;
    }
    
    console.log('✅ Test session created');
    
    // Clean up test data
    console.log('Cleaning up test data...');
    await supabase.from('research_sessions').delete().eq('id', session.id);
    await supabase.from('users').delete().eq('id', user.id);
    
    console.log('✅ Database operations test passed!');
    return true;
    
  } catch (error) {
    console.log('❌ Database operations test failed:', error.message);
    return false;
  }
}

// Run verification
verifyTables()
  .then(tablesOk => {
    if (tablesOk) {
      return testBasicOperations();
    }
    return false;
  })
  .then(opsOk => {
    if (opsOk) {
      console.log('\n🎉 Database setup verification complete!');
      console.log('Your backend is ready to use.');
    } else {
      console.log('\n⚠️  Database verification had issues.');
    }
  })
  .catch(error => {
    console.error('Verification failed:', error);
  });