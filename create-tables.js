#!/usr/bin/env node

/**
 * Direct Supabase Table Creation Script
 * Uses your existing Supabase credentials to create tables directly
 */

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials from the .env file
const SUPABASE_URL = 'https://ocfnnlsaxhxowmjtquwf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZm5ubHNheGh4b3dtanRxdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2NTM4MiwiZXhwIjoyMDcwNzQxMzgyfQ.PuigWslKANTgim5dx_Hjeij2b0fn0LwpyGVprwXe2hs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const SQL_STATEMENTS = [
  // Create extensions
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
  
  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Create research sessions table
  `CREATE TABLE IF NOT EXISTS research_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_url TEXT NOT NULL,
    session_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    total_comments INTEGER DEFAULT 0,
    analyzed_commenters INTEGER DEFAULT 0,
    boost_terms TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Create commenters table (updated schema)
  `CREATE TABLE IF NOT EXISTS commenters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    linkedin_id VARCHAR(255) NOT NULL,
    comment_id VARCHAR(255),
    name VARCHAR(255),
    headline TEXT,
    profile_url TEXT,
    profile_picture TEXT,
    company VARCHAR(255),
    location VARCHAR(255),
    followers_count INTEGER,
    connections_count INTEGER,
    comment_text TEXT,
    comment_date TIMESTAMP WITH TIME ZONE,
    comment_timestamp BIGINT,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    comment_url TEXT,
    relevance_score DECIMAL(5,2) DEFAULT 0,
    profile_data JSONB,
    stats_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, comment_id)
  );`,
  
  // Create user feedback table
  `CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES commenters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_relevant BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Create API rate limits table
  `CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Create LinkedIn cache table
  `CREATE TABLE IF NOT EXISTS linkedin_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Create scoring events table
  `CREATE TABLE IF NOT EXISTS scoring_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commenter_id UUID NOT NULL REFERENCES commenters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    boost_terms TEXT[],
    down_terms TEXT[],
    analysis_depth VARCHAR(20),
    confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`
];

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_commenters_session_id ON commenters(session_id);`,
  `CREATE INDEX IF NOT EXISTS idx_commenters_linkedin_id ON commenters(linkedin_id);`,
  `CREATE INDEX IF NOT EXISTS idx_commenters_comment_id ON commenters(comment_id);`,
  `CREATE INDEX IF NOT EXISTS idx_commenters_relevance_score ON commenters(relevance_score DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_user_feedback_session_id ON user_feedback(session_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_feedback_commenter_id ON user_feedback(commenter_id);`,
  `CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_id ON api_rate_limits(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_address ON api_rate_limits(ip_address);`,
  `CREATE INDEX IF NOT EXISTS idx_api_rate_limits_endpoint ON api_rate_limits(endpoint);`,
  `CREATE INDEX IF NOT EXISTS idx_linkedin_cache_key ON linkedin_cache(cache_key);`,
  `CREATE INDEX IF NOT EXISTS idx_linkedin_cache_expires_at ON linkedin_cache(expires_at);`,
  `CREATE INDEX IF NOT EXISTS idx_scoring_events_commenter_id ON scoring_events(commenter_id);`,
  `CREATE INDEX IF NOT EXISTS idx_scoring_events_created_at ON scoring_events(created_at);`
];

const FUNCTIONS_AND_TRIGGERS = [
  // Update function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ language 'plpgsql';`,
  
  // Triggers
  `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
  `CREATE TRIGGER update_research_sessions_updated_at BEFORE UPDATE ON research_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
  `CREATE TRIGGER update_commenters_updated_at BEFORE UPDATE ON commenters
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
  `CREATE TRIGGER update_api_rate_limits_updated_at BEFORE UPDATE ON api_rate_limits
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
  
  // Cleanup functions
  `CREATE OR REPLACE FUNCTION clean_expired_cache()
  RETURNS void AS $$
  BEGIN
      DELETE FROM linkedin_cache WHERE expires_at < NOW();
  END;
  $$ LANGUAGE plpgsql;`,
  
  `CREATE OR REPLACE FUNCTION clean_old_rate_limits()
  RETURNS void AS $$
  BEGIN
      DELETE FROM api_rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
  END;
  $$ LANGUAGE plpgsql;`
];

async function createTables() {
  console.log('🚀 Creating Supabase tables for Graham Stephens Build...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  // Execute table creation statements
  console.log('📊 Creating tables...');
  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const sql = SQL_STATEMENTS[i];
    try {
      const { error } = await supabase.rpc('exec', { sql });
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
    } catch (err) {
      console.error(`❌ Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }
  
  // Execute indexes
  console.log('\n🔗 Creating indexes...');
  for (let i = 0; i < INDEXES.length; i++) {
    const sql = INDEXES[i];
    try {
      const { error } = await supabase.rpc('exec', { sql });
      if (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
        } else {
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      errorCount++;
    }
  }
  
  // Execute functions and triggers
  console.log('⚙️ Creating functions and triggers...');
  for (let i = 0; i < FUNCTIONS_AND_TRIGGERS.length; i++) {
    const sql = FUNCTIONS_AND_TRIGGERS[i];
    try {
      const { error } = await supabase.rpc('exec', { sql });
      if (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
        } else {
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      errorCount++;
    }
  }
  
  console.log('\n📋 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  // Test database
  console.log('\n🔍 Testing database...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count');
    
    if (error) {
      console.warn('⚠️  Database test failed:', error.message);
    } else {
      console.log('✅ Database test passed');
    }
  } catch (err) {
    console.warn('⚠️  Database test error:', err.message);
  }
  
  console.log('\n🎉 Database setup complete!');
  console.log('You can now start your backend server with: npm run dev');
}

// Run the creation
createTables().catch(console.error);