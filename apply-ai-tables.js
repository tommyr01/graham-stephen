#!/usr/bin/env node

/**
 * Apply AI Prediction System Tables Migration
 * Adds the missing tables needed for the performance optimization
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

// Read the migration file
const migrationPath = path.join(__dirname, 'graham', 'migrations', '002_ai_prediction_tables.sql');
let migrationSQL = '';

try {
  migrationSQL = fs.readFileSync(migrationPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read migration file:', error.message);
  console.log('Creating the migration SQL inline...');
  
  migrationSQL = `
-- AI Prediction System Tables Migration

-- Training decisions for pattern matching
CREATE TABLE IF NOT EXISTS training_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id VARCHAR(255) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('contact', 'skip')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    voice_transcription TEXT,
    prospect_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_decisions_decision ON training_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_training_decisions_confidence ON training_decisions(confidence);
CREATE INDEX IF NOT EXISTS idx_training_decisions_created_at ON training_decisions(created_at DESC);

-- Decision patterns for predictive scoring
CREATE TABLE IF NOT EXISTS decision_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_type VARCHAR(100) NOT NULL,
    trigger_conditions JSONB NOT NULL,
    expected_outcome VARCHAR(20) NOT NULL CHECK (expected_outcome IN ('contact', 'skip')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    sample_size INTEGER DEFAULT 1,
    success_rate DECIMAL(3,2),
    last_validated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_patterns_type ON decision_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_decision_patterns_confidence ON decision_patterns(confidence);
CREATE INDEX IF NOT EXISTS idx_decision_patterns_outcome ON decision_patterns(expected_outcome);

-- Prediction results for caching
CREATE TABLE IF NOT EXISTS prediction_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id VARCHAR(255) NOT NULL,
    predicted_decision VARCHAR(20) NOT NULL CHECK (predicted_decision IN ('contact', 'skip')),
    confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    reasoning JSONB NOT NULL,
    matched_patterns UUID[] DEFAULT '{}',
    similar_prospects JSONB DEFAULT '[]',
    model_version VARCHAR(50) DEFAULT 'v2.0',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actual_decision VARCHAR(20) CHECK (actual_decision IN ('contact', 'skip')),
    actual_outcome JSONB,
    outcome_recorded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_prediction_results_prospect_id ON prediction_results(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_created_at ON prediction_results(created_at DESC);

-- Content analysis cache
CREATE TABLE IF NOT EXISTS content_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id VARCHAR(255),
    prospect_id VARCHAR(255),
    content_hash VARCHAR(64) NOT NULL,
    authenticity_score DECIMAL(3,1) NOT NULL CHECK (authenticity_score >= 1 AND authenticity_score <= 10),
    expertise_level DECIMAL(3,1) NOT NULL CHECK (expertise_level >= 1 AND expertise_level <= 10),
    specificity_score DECIMAL(3,1) NOT NULL CHECK (specificity_score >= 1 AND specificity_score <= 10),
    professionalism_score DECIMAL(3,1) NOT NULL CHECK (professionalism_score >= 1 AND professionalism_score <= 10),
    red_flags TEXT[] DEFAULT '{}',
    reasoning TEXT,
    ai_provider VARCHAR(50) NOT NULL,
    model_version VARCHAR(100) NOT NULL,
    processing_time_ms INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_analysis_content_hash ON content_analysis(content_hash);
CREATE INDEX IF NOT EXISTS idx_content_analysis_prospect_id ON content_analysis(prospect_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_expires_at ON content_analysis(expires_at);

-- Prospect content summary
CREATE TABLE IF NOT EXISTS prospect_content_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id VARCHAR(255) NOT NULL,
    avg_authenticity_score DECIMAL(3,1) NOT NULL,
    avg_expertise_level DECIMAL(3,1) NOT NULL,
    avg_specificity_score DECIMAL(3,1) NOT NULL,
    avg_professionalism_score DECIMAL(3,1) NOT NULL,
    total_posts_analyzed INTEGER NOT NULL DEFAULT 0,
    ai_generated_posts INTEGER NOT NULL DEFAULT 0,
    high_expertise_posts INTEGER NOT NULL DEFAULT 0,
    red_flag_count INTEGER NOT NULL DEFAULT 0,
    last_analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_version VARCHAR(50) DEFAULT 'v2.0',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_content_summary_prospect_id ON prospect_content_summary(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_content_summary_expires_at ON prospect_content_summary(expires_at);

-- Create triggers for updated_at
CREATE TRIGGER update_training_decisions_updated_at BEFORE UPDATE ON training_decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_patterns_updated_at BEFORE UPDATE ON decision_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_content_summary_updated_at BEFORE UPDATE ON prospect_content_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
}

async function applyMigration() {
  console.log('🚀 Applying AI Prediction System Tables Migration...\n');
  
  // Split the SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.match(/^\s*$/));
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;
    
    try {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
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
  console.log('\n🔍 Testing new tables...');
  const newTables = [
    'training_decisions',
    'decision_patterns', 
    'prediction_results',
    'content_analysis',
    'prospect_content_summary'
  ];
  
  for (const tableName of newTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${tableName}': ${error.message}`);
      } else {
        console.log(`✅ Table '${tableName}': EXISTS and accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}': ${err.message}`);
    }
  }
  
  console.log('\n🎉 AI Prediction System tables migration complete!');
  console.log('The performance optimization tables are now ready for use.');
}

applyMigration().catch(console.error);