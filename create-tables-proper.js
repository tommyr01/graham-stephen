#!/usr/bin/env node

/**
 * Proper Supabase Table Creation
 * Creates tables using the official Supabase management API
 */

const https = require('https');

const SUPABASE_PROJECT_REF = 'ocfnnlsaxhxowmjtquwf';
const SUPABASE_ACCESS_TOKEN = 'sbp_759d15a7e4c5cb72763b5809a46573d9fc714df9';

const SQL_QUERY = `
-- Graham Stephens Build Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research sessions table
CREATE TABLE IF NOT EXISTS research_sessions (
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
);

-- Commenters table (updated schema)
CREATE TABLE IF NOT EXISTS commenters (
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
);

-- User feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES commenters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_relevant BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limits table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LinkedIn cache table
CREATE TABLE IF NOT EXISTS linkedin_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scoring events table
CREATE TABLE IF NOT EXISTS scoring_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commenter_id UUID NOT NULL REFERENCES commenters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    boost_terms TEXT[],
    down_terms TEXT[],
    analysis_depth VARCHAR(20),
    confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_commenters_session_id ON commenters(session_id);
CREATE INDEX IF NOT EXISTS idx_commenters_linkedin_id ON commenters(linkedin_id);
CREATE INDEX IF NOT EXISTS idx_commenters_comment_id ON commenters(comment_id);
CREATE INDEX IF NOT EXISTS idx_commenters_relevance_score ON commenters(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_session_id ON user_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_commenter_id ON user_feedback(commenter_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_id ON api_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_address ON api_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_endpoint ON api_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_linkedin_cache_key ON linkedin_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_linkedin_cache_expires_at ON linkedin_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_scoring_events_commenter_id ON scoring_events(commenter_id);
CREATE INDEX IF NOT EXISTS idx_scoring_events_created_at ON scoring_events(created_at);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_sessions_updated_at ON research_sessions;
CREATE TRIGGER update_research_sessions_updated_at BEFORE UPDATE ON research_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commenters_updated_at ON commenters;
CREATE TRIGGER update_commenters_updated_at BEFORE UPDATE ON commenters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON api_rate_limits;
CREATE TRIGGER update_api_rate_limits_updated_at BEFORE UPDATE ON api_rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup functions
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM linkedin_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clean_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM api_rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
`;

function makeHttpsRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function createTablesViaAPI() {
  console.log('🚀 Creating Supabase tables via Management API...\n');

  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const requestData = JSON.stringify({
    query: SQL_QUERY
  });

  try {
    const response = await makeHttpsRequest(options, requestData);
    
    if (response.status === 200) {
      console.log('✅ Tables created successfully!');
      console.log('Response:', response.data);
    } else {
      console.error('❌ Failed to create tables');
      console.error('Status:', response.status);
      console.error('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('\n📋 Manual Instructions:');
    console.error('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ocfnnlsaxhxowmjtquwf');
    console.error('2. Click on SQL Editor');
    console.error('3. Copy and paste the SQL from supabase-schema-fixed.sql');
    console.error('4. Click RUN to execute the SQL');
  }
}

createTablesViaAPI();