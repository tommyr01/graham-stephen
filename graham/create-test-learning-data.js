#!/usr/bin/env node

/**
 * Create Test Learning Data
 * 
 * This script creates realistic test feedback interactions and research sessions
 * to bootstrap the AI learning system with meaningful data for pattern discovery.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test user ID (we'll create or use existing)
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

// Sample profile data for testing
const SAMPLE_PROFILES = [
  {
    name: 'Sarah Chen',
    title: 'VP Engineering',
    company: 'TechFlow Inc',
    industry: 'Software',
    company_size: 'medium',
    seniority: 'senior',
    location: 'San Francisco',
    linkedin_url: 'https://linkedin.com/in/sarah-chen-vp-eng'
  },
  {
    name: 'Marcus Rodriguez',
    title: 'Senior Software Engineer',
    company: 'DataScale',
    industry: 'Software',
    company_size: 'startup',
    seniority: 'senior',
    location: 'Austin',
    linkedin_url: 'https://linkedin.com/in/marcus-rodriguez-eng'
  },
  {
    name: 'Jennifer Park',
    title: 'Engineering Manager',
    company: 'CloudNext',
    industry: 'Cloud Computing',
    company_size: 'large',
    seniority: 'senior',
    location: 'Seattle',
    linkedin_url: 'https://linkedin.com/in/jennifer-park-mgr'
  },
  {
    name: 'Alex Johnson',
    title: 'Junior Developer',
    company: 'StartupX',
    industry: 'Software',
    company_size: 'startup',
    seniority: 'junior',
    location: 'New York',
    linkedin_url: 'https://linkedin.com/in/alex-johnson-dev'
  },
  {
    name: 'David Miller',
    title: 'Marketing Coordinator',
    company: 'GrowthCorp',
    industry: 'Marketing',
    company_size: 'small',
    seniority: 'junior',
    location: 'Chicago',
    linkedin_url: 'https://linkedin.com/in/david-miller-marketing'
  },
  {
    name: 'Emily Watson',
    title: 'CTO',
    company: 'InnovateLabs',
    industry: 'Software',
    company_size: 'startup',
    seniority: 'executive',
    location: 'San Francisco',
    linkedin_url: 'https://linkedin.com/in/emily-watson-cto'
  },
  {
    name: 'Tom Wilson',
    title: 'Principal Engineer',
    company: 'MegaTech',
    industry: 'Technology',
    company_size: 'large',
    seniority: 'senior',
    location: 'Boston',
    linkedin_url: 'https://linkedin.com/in/tom-wilson-principal'
  },
  {
    name: 'Lisa Brown',
    title: 'Technical Lead',
    company: 'DevStudio',
    industry: 'Software',
    company_size: 'medium',
    seniority: 'senior',
    location: 'Portland',
    linkedin_url: 'https://linkedin.com/in/lisa-brown-tech-lead'
  }
];

// Voice feedback samples
const VOICE_FEEDBACK_SAMPLES = [
  "This person looks really promising. They have solid experience in React and Node.js, which is exactly what we need for our team. I especially like their work at their previous startup - shows they can handle the fast-paced environment.",
  "Not a great fit for us. Their background is mostly in marketing and they don't have the technical skills we're looking for. Probably better to skip this one.",
  "Interesting profile. They're currently at a big tech company but their LinkedIn shows they're interested in startups. Could be worth reaching out to see if they'd be interested in a change.",
  "This person seems overqualified for what we're offering. They're already a VP at a large company, doubt they'd be interested in a senior engineer role at our startup.",
  "Perfect match! They have the exact same tech stack we use and they're in our target location. Definitely going to reach out to this one.",
  "Mixed feelings about this profile. Good technical background but they've job-hopped a lot in the past two years. Might be a red flag for team stability.",
  "Love this profile! They've contributed to several open source projects I recognize and their blog posts show deep technical knowledge. This is exactly the kind of person we want.",
  "Skip this one. The profile looks outdated and they haven't posted anything technical in months. Doesn't seem like they're actively engaged in the community."
];

// Function to generate patterns from feedback data
async function generatePatternsFromFeedback(feedbackData) {
  const patterns = [];
  
  // Analyze feedback for industry patterns
  const industryOutcomes = {};
  const seniorityOutcomes = {};
  const positiveProfiles = [];
  
  feedbackData.forEach(feedback => {
    const profileData = feedback.feedback_data?.profile_data;
    const outcome = feedback.feedback_data?.session_outcome;
    const relevanceRating = feedback.feedback_data?.relevance_rating || 0;
    const sentiment = feedback.feedback_data?.voice_analysis?.sentiment;
    
    if (profileData) {
      // Track industry success rates
      const industry = profileData.industry;
      if (!industryOutcomes[industry]) {
        industryOutcomes[industry] = { contacted: 0, total: 0 };
      }
      industryOutcomes[industry].total++;
      if (outcome === 'contacted') {
        industryOutcomes[industry].contacted++;
      }
      
      // Track seniority success rates
      const seniority = profileData.seniority;
      if (!seniorityOutcomes[seniority]) {
        seniorityOutcomes[seniority] = { contacted: 0, total: 0 };
      }
      seniorityOutcomes[seniority].total++;
      if (outcome === 'contacted') {
        seniorityOutcomes[seniority].contacted++;
      }
      
      // Track positive profiles
      if (relevanceRating >= 8 || sentiment === 'positive') {
        positiveProfiles.push(profileData);
      }
    }
  });
  
  // Generate industry success patterns
  Object.entries(industryOutcomes).forEach(([industry, data]) => {
    if (data.total >= 2 && data.contacted / data.total > 0.6) {
      patterns.push({
        pattern_type: 'industry_signal',
        pattern_name: `High Success Rate in ${industry}`,
        pattern_description: `Profiles in ${industry} industry show high contact success rate (${Math.round(data.contacted / data.total * 100)}%)`,
        pattern_data: {
          industry,
          success_rate: data.contacted / data.total,
          supporting_interactions: data.total,
          contacted: data.contacted,
          evidence: feedbackData.filter(f => f.feedback_data?.profile_data?.industry === industry).map(f => ({
            commenterId: `profile-${Math.random().toString(36).substr(2, 9)}`,
            name: f.feedback_data?.profile_data?.name || 'Unknown',
            score: f.feedback_data?.relevance_rating || 5,
            actualOutcome: f.feedback_data?.session_outcome === 'contacted'
          }))
        },
        trigger_conditions: {
          profile_industry: industry
        },
        expected_outcome: 'High likelihood of successful contact',
        confidence_score: Math.min(0.95, (data.contacted / data.total) * 0.8 + 0.2),
        supporting_sessions: data.total,
        discovery_method: 'feedback_industry_analysis',
        applies_to_industries: [industry],
        validation_status: 'discovered',
        discovery_agent: 'feedback_analyzer',
        discovered_at: new Date().toISOString()
      });
    }
  });
  
  // Generate seniority patterns
  Object.entries(seniorityOutcomes).forEach(([seniority, data]) => {
    if (data.total >= 2 && data.contacted / data.total > 0.6) {
      patterns.push({
        pattern_type: 'success_indicator',
        pattern_name: `${seniority.charAt(0).toUpperCase() + seniority.slice(1)} Level Success Pattern`,
        pattern_description: `${seniority.charAt(0).toUpperCase() + seniority.slice(1)} level professionals show high engagement rates`,
        pattern_data: {
          seniority,
          success_rate: data.contacted / data.total,
          supporting_interactions: data.total,
          evidence: feedbackData.filter(f => f.feedback_data?.profile_data?.seniority === seniority).map(f => ({
            commenterId: `profile-${Math.random().toString(36).substr(2, 9)}`,
            name: f.feedback_data?.profile_data?.name || 'Unknown',
            score: f.feedback_data?.relevance_rating || 5,
            actualOutcome: f.feedback_data?.session_outcome === 'contacted'
          }))
        },
        trigger_conditions: {
          profile_seniority: seniority
        },
        expected_outcome: 'Higher contact success rate',
        confidence_score: Math.min(0.9, (data.contacted / data.total) * 0.7 + 0.25),
        supporting_sessions: data.total,
        discovery_method: 'feedback_seniority_analysis',
        validation_status: 'discovered',
        discovery_agent: 'feedback_analyzer',
        discovered_at: new Date().toISOString()
      });
    }
  });
  
  // Generate quality indicator pattern
  if (positiveProfiles.length >= 3) {
    const commonIndustries = positiveProfiles.reduce((acc, profile) => {
      acc[profile.industry] = (acc[profile.industry] || 0) + 1;
      return acc;
    }, {});
    
    const topIndustry = Object.entries(commonIndustries).sort(([,a], [,b]) => b - a)[0];
    
    if (topIndustry && topIndustry[1] >= 2) {
      patterns.push({
        pattern_type: 'quality_indicator',
        pattern_name: 'High-Quality Profile Pattern',
        pattern_description: `Profiles with technical expertise in ${topIndustry[0]} consistently receive high relevance ratings`,
        pattern_data: {
          quality_threshold: 8,
          common_industry: topIndustry[0],
          high_quality_count: positiveProfiles.length,
          evidence: positiveProfiles.slice(0, 5).map(profile => ({
            commenterId: `profile-${Math.random().toString(36).substr(2, 9)}`,
            name: profile.name || 'Unknown',
            score: 8.5,
            actualOutcome: true
          }))
        },
        trigger_conditions: {
          relevance_rating_min: 8,
          industry: topIndustry[0]
        },
        expected_outcome: 'High relevance rating',
        confidence_score: 0.85,
        supporting_sessions: positiveProfiles.length,
        discovery_method: 'quality_indicator_analysis',
        validation_status: 'discovered',
        discovery_agent: 'feedback_analyzer',
        discovered_at: new Date().toISOString()
      });
    }
  }
  
  return patterns;
}

async function createTestLearningData() {
  console.log('🚀 Creating test learning data for AI system...\n');
  
  try {
    // Step 1: Create test user with proper auth
    console.log('👤 Setting up test user...');
    
    // Create a simple test user ID (UUID format)
    const actualTestUserId = '550e8400-e29b-41d4-a716-446655440001';
    
    console.log('✅ Using test user ID:', actualTestUserId);

    // Step 2: Skip user profile initialization for now, just create feedback data
    console.log('\n📊 Creating feedback interactions directly...');
    
    const createdFeedback = [];
    
    for (let i = 0; i < SAMPLE_PROFILES.length; i++) {
      const profile = SAMPLE_PROFILES[i];
      const voiceFeedback = VOICE_FEEDBACK_SAMPLES[i];
      
      // Determine realistic outcomes based on profile quality
      const isHighQuality = ['Software', 'Technology', 'Cloud Computing'].includes(profile.industry) && 
                           ['senior', 'executive'].includes(profile.seniority);
      
      const sessionOutcome = isHighQuality ? 'contacted' : 
                            Math.random() > 0.7 ? 'contacted' : 'skipped';
      
      const relevanceRating = isHighQuality ? 
                             Math.floor(Math.random() * 3) + 8 : // 8-10 for high quality
                             Math.floor(Math.random() * 5) + 3;  // 3-7 for others
      
      const confidenceLevel = Math.floor(Math.random() * 3) + 8; // 8-10
      
      // Create feedback interaction directly (without research session dependency)
      const feedbackData = {
        user_id: actualTestUserId,
        interaction_type: 'explicit_rating',
        feedback_data: {
          voice_feedback: true,
          transcript: voiceFeedback,
          confidence: 0.95,
          language: 'en-US',
          recording_duration: voiceFeedback.length * 0.1,
          context_type: 'profile_evaluation',
          edited: false,
          original_length: voiceFeedback.length,
          final_length: voiceFeedback.length,
          voice_analysis: {
            sentiment: isHighQuality ? 'positive' : 'neutral',
            enthusiasm_level: isHighQuality ? 0.8 : 0.4
          },
          // Include profile context in feedback
          profile_data: profile,
          session_outcome: sessionOutcome,
          relevance_rating: relevanceRating,
          confidence_level: confidenceLevel,
          session_duration: Math.floor(Math.random() * 300) + 60,
          sections_viewed: isHighQuality ? 
                          ['experience', 'skills', 'recommendations', 'activity'] :
                          ['experience', 'skills']
        },
        context_data: {
          profileUrl: profile.linkedin_url,
          voice_language: 'en-US',
          recording_duration: voiceFeedback.length * 0.1,
          confidence_score: 0.95,
          submission_method: 'voice_api',
          collection_timestamp: new Date().toISOString(),
          profile_context: profile,
          research_context: {
            purpose: 'team_building',
            target_role: 'software_engineer',
            urgency: 'medium'
          }
        },
        collection_method: 'voluntary',
        ui_component: 'voice_feedback_system',
        learning_value: isHighQuality ? 0.9 : 0.6,
        feedback_timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback_interactions')
        .insert(feedbackData)
        .select('id')
        .single();

      if (feedbackError) {
        console.error(`Error creating feedback for ${profile.name}:`, feedbackError);
      } else {
        createdFeedback.push(feedback.id);
        console.log(`✅ Created feedback for ${profile.name}`);
      }
    }

    console.log(`\n📈 Created ${createdFeedback.length} feedback interactions`);

    // Step 3: Create some basic patterns from the feedback data
    console.log('\n🔍 Creating discovered patterns from feedback data...');
    
    // Analyze the created feedback to generate patterns
    const { data: allFeedback, error: analysisError } = await supabase
      .from('feedback_interactions')
      .select('feedback_data, context_data')
      .eq('user_id', actualTestUserId);
    
    if (analysisError) {
      console.error('Error fetching feedback for analysis:', analysisError);
    } else {
      // Generate patterns based on the feedback
      const patterns = await generatePatternsFromFeedback(allFeedback);
      
      // Save patterns to database
      let savedPatterns = 0;
      for (const pattern of patterns) {
        const { error: patternError } = await supabase
          .from('discovered_patterns')
          .insert(pattern);
        
        if (!patternError) {
          savedPatterns++;
          console.log(`✅ Saved pattern: ${pattern.pattern_name}`);
        }
      }
      
      console.log(`📊 Generated and saved ${savedPatterns} patterns from feedback data`);
    }

    // Step 5: Verify data creation
    console.log('\n✅ Verifying created data...');
    
    // Check feedback interactions
    const { data: feedback, error: feedbackCheckError } = await supabase
      .from('feedback_interactions')
      .select('id')
      .eq('user_id', actualTestUserId);
    
    if (!feedbackCheckError) {
      console.log(`📊 Created ${feedback.length} feedback interactions`);
    }

    // Check patterns
    const { data: patterns, error: patternsCheckError } = await supabase
      .from('discovered_patterns')
      .select('id, pattern_name, confidence_score');
    
    if (!patternsCheckError) {
      console.log(`🔍 Database contains ${patterns.length} discovered patterns`);
      if (patterns.length > 0) {
        console.log('   Recent patterns:');
        patterns.slice(0, 3).forEach(p => {
          console.log(`   - ${p.pattern_name} (confidence: ${p.confidence_score})`);
        });
      }
    }

    console.log('\n🎉 Test learning data creation completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Visit http://localhost:3000/training to see the training dashboard');
    console.log('2. The dashboard should now show real patterns instead of fallback data');
    console.log('3. Use the voice feedback system to add more data');
    console.log('4. Watch as new patterns are discovered automatically');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createTestLearningData();
}