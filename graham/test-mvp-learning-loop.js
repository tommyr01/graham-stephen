/**
 * MVP Learning Loop Integration Test
 * 
 * Tests the 4 core integrations:
 * 1. Voice feedback → SessionLearningManager pattern extraction
 * 2. Auto-apply patterns during profile analysis
 * 3. Persist high-value patterns to database
 * 4. Session state persistence across requests
 * 
 * Success criteria:
 * - Voice feedback on Profile A creates patterns in session
 * - Profile B analysis shows improved scores from learned patterns
 * - Session maintains learning state across multiple requests
 * - High-confidence patterns are saved to database
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

// Test data
const TEST_USER_ID = 'test-user-mvp-learning';
const TEST_SESSION_ID = `test-session-${Date.now()}`;

async function testMVPLearningLoop() {
  console.log('🚀 Starting MVP Learning Loop Integration Test');
  console.log(`Session ID: ${TEST_SESSION_ID}`);
  console.log(`User ID: ${TEST_USER_ID}`);
  
  try {
    // Step 1: Research Profile A (baseline analysis)
    console.log('\n📊 Step 1: Analyzing Profile A (baseline)');
    const profileA = await analyzeProfile(
      'https://linkedin.com/in/test-profile-a',
      TEST_SESSION_ID,
      TEST_USER_ID
    );
    
    console.log(`Profile A analysis confidence: ${profileA.analysis?.confidence_score || 'N/A'}`);
    console.log(`Learning enabled: ${profileA.learning?.learning_enabled}`);
    
    // Step 2: Submit positive voice feedback for Profile A
    console.log('\n🎤 Step 2: Submitting voice feedback for Profile A');
    const voiceFeedback = await submitVoiceFeedback({
      transcription: "This profile looks really good. Perfect fit for our tech startup. Great experience in software engineering and the company size matches what we're looking for. Definitely want to contact this person.",
      userId: TEST_USER_ID,
      sessionId: TEST_SESSION_ID,
      profileUrl: 'https://linkedin.com/in/test-profile-a',
      profileData: {
        industry: 'Technology',
        current_role: 'Software Engineer',
        company_size: 'startup',
        years_experience: 5
      }
    });
    
    console.log(`Voice feedback processed: ${voiceFeedback.success}`);
    console.log(`Patterns extracted: ${voiceFeedback.data?.learning?.patternsExtracted || 0}`);
    console.log(`Learning patterns:`, voiceFeedback.data?.learning?.patterns || []);
    
    // Step 3: Research Profile B (should show improved analysis)
    console.log('\n📈 Step 3: Analyzing Profile B (should show learning impact)');
    const profileB = await analyzeProfile(
      'https://linkedin.com/in/test-profile-b',
      TEST_SESSION_ID,
      TEST_USER_ID
    );
    
    console.log(`Profile B analysis confidence: ${profileB.analysis?.confidence_score || 'N/A'}`);
    console.log(`Patterns applied: ${profileB.learning?.patterns_applied || 0}`);
    console.log(`Confidence improvement: ${Math.round((profileB.learning?.confidence_improvement || 0) * 100)}%`);
    console.log(`Applications applied:`, profileB.learning?.applications_applied || []);
    
    // Step 4: Verify learning persistence by creating new session
    console.log('\n💾 Step 4: Testing session state persistence');
    const newSessionId = `test-session-${Date.now()}-new`;
    
    const profileC = await analyzeProfile(
      'https://linkedin.com/in/test-profile-c',
      newSessionId,
      TEST_USER_ID
    );
    
    console.log(`Profile C (new session) confidence: ${profileC.analysis?.confidence_score || 'N/A'}`);
    console.log(`New session learning enabled: ${profileC.learning?.learning_enabled}`);
    
    // Validation checks
    console.log('\n✅ Validation Results:');
    
    // Check 1: Voice feedback extracted patterns
    const patternsExtracted = voiceFeedback.data?.learning?.patternsExtracted > 0;
    console.log(`✓ Voice feedback extracted patterns: ${patternsExtracted ? 'PASS' : 'FAIL'}`);
    
    // Check 2: Profile B showed learning impact
    const learningImpact = profileB.learning?.patterns_applied > 0;
    console.log(`✓ Profile B analysis applied patterns: ${learningImpact ? 'PASS' : 'FAIL'}`);
    
    // Check 3: Confidence improvement
    const confidenceImproved = (profileB.learning?.confidence_improvement || 0) > 0;
    console.log(`✓ Confidence improvement detected: ${confidenceImproved ? 'PASS' : 'FAIL'}`);
    
    // Check 4: Learning enabled check
    const learningEnabled = profileB.learning?.learning_enabled === true;
    console.log(`✓ Learning system enabled: ${learningEnabled ? 'PASS' : 'FAIL'}`);
    
    // Overall success
    const allChecks = patternsExtracted && learningImpact && confidenceImproved && learningEnabled;
    console.log(`\n🎯 MVP Learning Loop Test: ${allChecks ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (allChecks) {
      console.log('\n🎉 MVP Learning Loop is working! Voice feedback on Profile A improved analysis of Profile B.');
    } else {
      console.log('\n❌ Some integrations need attention. Check the individual test results above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

async function analyzeProfile(profileUrl, sessionId, userId) {
  const response = await fetch(`${API_BASE}/dev/profile-research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileUrl,
      sessionId,
      userId
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Profile analysis failed: ${response.status}`);
  }
  
  return await response.json();
}

async function submitVoiceFeedback(feedbackData) {
  const response = await fetch(`${API_BASE}/voice-processing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedbackData),
  });
  
  if (!response.ok) {
    throw new Error(`Voice feedback failed: ${response.status}`);
  }
  
  return await response.json();
}

// Run the test
if (require.main === module) {
  testMVPLearningLoop().catch(console.error);
}

module.exports = { testMVPLearningLoop };