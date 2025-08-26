const https = require('https');
const http = require('http');

const profileUrl = 'https://www.linkedin.com/in/rjsolorzano/';

async function makeApiCall(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function analyzeRJSolorzano() {
  console.log('🔍 LINKEDIN PROFILE ANALYSIS - IMPROVED M&A EXPERIENCE CALCULATION');
  console.log('Profile:', profileUrl);
  console.log('='.repeat(70));
  
  try {
    // Step 1: Get profile data
    console.log('\n📊 Step 1: Fetching LinkedIn profile data...');
    const profileResponse = await makeApiCall('/api/dev/profile-research', {
      profileUrl: profileUrl
    });
    
    if (profileResponse.status !== 200) {
      console.error('❌ Profile research failed:', profileResponse.data);
      return;
    }
    
    console.log('✅ Profile data retrieved successfully');
    const profileData = profileResponse.data;
    
    // Display profile information
    console.log('\n👤 PROFILE INFORMATION:');
    console.log('-'.repeat(50));
    console.log(`Name: ${profileData.commenter?.name || 'N/A'}`);
    console.log(`Headline: ${profileData.commenter?.headline || 'N/A'}`);
    console.log(`Company: ${profileData.commenter?.company?.name || profileData.commenter?.company || 'N/A'}`);
    console.log(`Location: ${profileData.commenter?.location || 'N/A'}`);
    console.log(`Experience: ${profileData.commenter?.experience?.length || 0} positions`);
    console.log(`Recent Posts: ${profileData.commenter?.recentPosts?.length || 0} posts analyzed`);
    
    // Display experience breakdown for debugging
    if (profileData.commenter?.experience?.length > 0) {
      console.log('\n💼 DETAILED EXPERIENCE BREAKDOWN:');
      console.log('-'.repeat(50));
      profileData.commenter.experience.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title || 'Unknown Title'} at ${job.company || 'Unknown Company'}`);
        console.log(`   Duration: ${job.start_date || job.startDate || 'Unknown'} - ${job.end_date || job.endDate || 'Present'}`);
        if (job.description) {
          console.log(`   Description: ${job.description.substring(0, 100)}...`);
        }
        console.log('');
      });
    }
    
    // Display initial scoring
    console.log('\n📈 INITIAL ANALYSIS (Legacy System):');
    console.log('-'.repeat(50));
    console.log(`Relevance Score: ${profileData.score}/10`);
    console.log(`Confidence: ${(profileData.confidence * 100).toFixed(1)}%`);
    
    // Step 2: Generate V2.0 AI prediction with improved experience calculation
    console.log('\n🤖 Step 2: Generating prediction with IMPROVED M&A experience calculation...');
    
    const prospectData = {
      id: profileData.commenter.id,
      name: profileData.commenter.name,
      headline: profileData.commenter.headline,
      company: profileData.commenter.company?.name || profileData.commenter.company || '',
      location: profileData.commenter.location,
      industry: profileData.commenter.industry || 'Unknown',
      role: profileData.commenter.headline || 'Unknown',
      experience: profileData.commenter.experience || [],
      recentPosts: profileData.commenter.recentPosts || [],
      profileUrl: profileData.commenter.profileUrl,
      profilePicture: profileData.commenter.profilePicture
    };
    
    const startTime = Date.now();
    const predictionResponse = await makeApiCall('/api/v2/prediction/evaluate', {
      prospectId: profileData.commenter.id,
      forceRefresh: true, // Force fresh analysis with new calculation
      prospectData: prospectData
    });
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️  Analysis completed in ${(totalTime / 1000).toFixed(1)} seconds`);
    
    if (predictionResponse.status !== 200) {
      console.error('❌ AI prediction failed:', predictionResponse.data);
      return;
    }
    
    console.log('✅ Improved M&A experience calculation completed successfully');
    const aiPrediction = predictionResponse.data.data.prediction;
    
    // Display comprehensive results with focus on experience calculation
    console.log('\n🧠 IMPROVED PREDICTION RESULTS:');
    console.log('='.repeat(70));
    
    console.log(`\n📊 FINAL DECISION: ${aiPrediction.predictedDecision.toUpperCase()}`);
    console.log(`🎯 CONFIDENCE: ${aiPrediction.confidence}%`);
    console.log(`📈 FINAL SCORE: ${(aiPrediction.scoreBreakdown?.finalScore || 0).toFixed(2)}`);
    console.log(`🤖 MODEL: ${predictionResponse.data.modelVersion || 'Claude 3.5 Sonnet'} with Improved Experience Calc`);
    
    // Experience analysis - the key fix we're testing
    const experienceMatch = aiPrediction.reasoning?.experienceMatch || {};
    console.log('\n💼 IMPROVED M&A EXPERIENCE ANALYSIS:');
    console.log('-'.repeat(50));
    console.log(`🎯 M&A-Weighted Experience: ${experienceMatch.yearsInIndustry || 0} years`);
    console.log(`🧠 Analysis Method: ${experienceMatch.analysisMethod || 'Unknown'}`);
    console.log(`📊 Relevancy Score: ${(experienceMatch.relevancyScore || 0).toFixed(2)}`);
    console.log(`🔄 Career Consistency: ${(experienceMatch.careerConsistency || 0).toFixed(2)}`);
    
    // Show detailed role breakdown if available
    if (experienceMatch.roleBreakdown && experienceMatch.roleBreakdown.length > 0) {
      console.log('\n📋 DETAILED ROLE ANALYSIS:');
      console.log('-'.repeat(50));
      experienceMatch.roleBreakdown.forEach((role, index) => {
        console.log(`${index + 1}. ${role.title} at ${role.company}`);
        console.log(`   Duration: ${role.years} years | Relevance: ${(role.relevanceScore * 100).toFixed(0)}%`);
        console.log(`   AI Reasoning: ${role.reasoning}`);
        console.log('');
      });
    }
    
    // Score breakdown
    const breakdown = aiPrediction.scoreBreakdown || {};
    console.log('\n📋 DETAILED SCORE BREAKDOWN:');
    console.log('-'.repeat(50));
    console.log(`Pattern Match Score: ${(breakdown.patternMatchScore || 0).toFixed(2)}`);
    console.log(`Similarity Score: ${(breakdown.similarityScore || 0).toFixed(2)}`);
    console.log(`Content Intelligence Score: ${(breakdown.contentIntelligenceScore || 0).toFixed(2)}`);
    console.log(`🎯 Experience Score: ${(breakdown.experienceScore || 0).toFixed(2)} (NEW CALCULATION)`);
    console.log(`Red Flag Penalty: ${(breakdown.redFlagPenalty || 0).toFixed(2)}`);
    
    // Content quality analysis
    const contentQuality = aiPrediction.reasoning?.contentQuality || {};
    console.log('\n📝 CONTENT QUALITY ANALYSIS:');
    console.log('-'.repeat(50));
    console.log(`Overall Quality: ${contentQuality.overallQuality || 'N/A'}`);
    console.log(`Authenticity Score: ${(contentQuality.authenticityScore || 0).toFixed(1)}/10`);
    console.log(`Expertise Level: ${(contentQuality.expertiseLevel || 0).toFixed(1)}/10`);
    console.log(`🚨 Red Flag Count: ${contentQuality.redFlagCount || 0}`);
    
    // Primary factors (positive indicators)
    if (aiPrediction.reasoning?.primaryFactors?.length > 0) {
      console.log('\n✅ PRIMARY FACTORS (Positive Indicators):');
      console.log('-'.repeat(50));
      aiPrediction.reasoning.primaryFactors.forEach(factor => {
        console.log(`  • ${factor}`);
      });
    }
    
    // Concerning signals (negative indicators)
    if (aiPrediction.reasoning?.concerningSignals?.length > 0) {
      console.log('\n⚠️  CONCERNING SIGNALS (Negative Indicators):');
      console.log('-'.repeat(50));
      aiPrediction.reasoning.concerningSignals.forEach(signal => {
        console.log(`  • ${signal}`);
      });
    }
    
    // Analysis summary
    console.log('\n📊 EXPERIENCE CALCULATION VERIFICATION:');
    console.log('='.repeat(70));
    
    const decision = aiPrediction.predictedDecision.toUpperCase();
    const confidence = aiPrediction.confidence;
    const maYears = experienceMatch.yearsInIndustry || 0;
    
    console.log('🔍 KEY VALIDATION POINTS:');
    console.log(`- M&A Experience Calculation: ${maYears} years (weighted by relevance)`);
    console.log(`- Experience excludes non-M&A roles (marketing, fitness, etc.)`);
    console.log(`- Direct M&A = 1.0x weight, Finance = 0.7x, Consulting = 0.4x, Generic CEO = 0.1x`);
    console.log(`- Marketing/advertising roles are completely excluded`);
    console.log(`- Final Decision: ${decision} (${confidence}% confidence)`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ IMPROVED EXPERIENCE CALCULATION TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
analyzeRJSolorzano();