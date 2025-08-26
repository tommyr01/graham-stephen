/**
 * Create test user and session for MVP learning loop testing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testEmail = 'test-mvp-learning@example.com';
  
  try {
    // Try to create user in auth.users table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        email: testEmail,
        name: 'Test MVP Learning User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error creating test user:', error);
    } else {
      console.log('✅ Test user created/updated successfully');
      console.log('User ID:', testUserId);
      console.log('Email:', testEmail);
    }

    // Initialize user intelligence profile
    const { data: profileData, error: profileError } = await supabase
      .rpc('initialize_user_intelligence_profile', { target_user_id: testUserId });

    if (profileError) {
      console.error('Error creating intelligence profile:', profileError);
    } else {
      console.log('✅ User intelligence profile initialized');
    }

    return testUserId;

  } catch (error) {
    console.error('Error in createTestUser:', error);
  }
}

if (require.main === module) {
  createTestUser().catch(console.error);
}

module.exports = { createTestUser };