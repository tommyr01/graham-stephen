const https = require('https');
const http = require('http');

const profileUrl = 'https://www.linkedin.com/in/daniel-smith-deal-engines/';

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

async function analyzeDanielSmith() {
  console.log('🔍 LINKEDIN PROFILE ANALYSIS - CLAUDE 3.5 SONNET');
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
    
    // Display initial scoring
    console.log('\n📈 INITIAL ANALYSIS (Legacy System):');
    console.log('-'.repeat(50));
    console.log(`Relevance Score: ${profileData.score}/10`);
    console.log(`Confidence: ${(profileData.confidence * 100).toFixed(1)}%`);
    
    if (profileData.explanation?.matchedBoostTerms?.length > 0) {
      console.log('\n🎯 Matched M&A Terms:');
      profileData.explanation.matchedBoostTerms.slice(0, 8).forEach(term => {
        console.log(`  • ${term.term} (weight: ${term.weight.toFixed(2)})`);
      });
      if (profileData.explanation.matchedBoostTerms.length > 8) {
        console.log(`  ... and ${profileData.explanation.matchedBoostTerms.length - 8} more terms`);
      }
    }
    
    // Step 2: Generate V2.0 AI prediction with Claude
    console.log('\n🤖 Step 2: Generating Claude 3.5 Sonnet prediction...');
    
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
      forceRefresh: true, // Force fresh analysis
      prospectData: prospectData
    });
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️  Analysis completed in ${(totalTime / 1000).toFixed(1)} seconds`);
    
    if (predictionResponse.status !== 200) {
      console.error('❌ AI prediction failed:', predictionResponse.data);
      return;
    }
    
    console.log('✅ Claude 3.5 Sonnet analysis completed successfully');
    const aiPrediction = predictionResponse.data.data.prediction;
    
    // Display comprehensive results
    console.log('\n🧠 CLAUDE 3.5 SONNET PREDICTION RESULTS:');
    console.log('='.repeat(70));
    
    console.log(`\n📊 FINAL DECISION: ${aiPrediction.predictedDecision.toUpperCase()}`);
    console.log(`🎯 CONFIDENCE: ${aiPrediction.confidence}%`);
    console.log(`📈 FINAL SCORE: ${(aiPrediction.scoreBreakdown?.finalScore || 0).toFixed(2)}`);
    console.log(`🤖 MODEL: ${predictionResponse.data.modelVersion || 'Claude 3.5 Sonnet'}`);
    console.log(`🔄 CACHED: ${predictionResponse.data.cached ? 'Yes' : 'No'}`);
    
    // Score breakdown
    const breakdown = aiPrediction.scoreBreakdown || {};
    console.log('\n📋 DETAILED SCORE BREAKDOWN:');
    console.log('-'.repeat(50));
    console.log(`Pattern Match Score: ${(breakdown.patternMatchScore || 0).toFixed(2)}`);
    console.log(`Similarity Score: ${(breakdown.similarityScore || 0).toFixed(2)}`);
    console.log(`Content Intelligence Score: ${(breakdown.contentIntelligenceScore || 0).toFixed(2)}`);
    console.log(`Experience Score: ${(breakdown.experienceScore || 0).toFixed(2)}`);
    console.log(`Red Flag Penalty: ${(breakdown.redFlagPenalty || 0).toFixed(2)}`);
    
    // Content quality analysis
    const contentQuality = aiPrediction.reasoning?.contentQuality || {};
    console.log('\n📝 CONTENT QUALITY ANALYSIS:');
    console.log('-'.repeat(50));
    console.log(`Overall Quality: ${contentQuality.overallQuality || 'N/A'}`);
    console.log(`Authenticity Score: ${(contentQuality.authenticityScore || 0).toFixed(1)}/10`);
    console.log(`Expertise Level: ${(contentQuality.expertiseLevel || 0).toFixed(1)}/10`);
    console.log(`AI Content Percentage: ${(contentQuality.aiContentPercentage || 0).toFixed(1)}%`);
    console.log(`🚨 Red Flag Count: ${contentQuality.redFlagCount || 0}`);
    
    // Experience analysis
    const experienceMatch = aiPrediction.reasoning?.experienceMatch || {};
    console.log('\n💼 EXPERIENCE ANALYSIS:');
    console.log('-'.repeat(50));
    console.log(`Years in Industry: ${experienceMatch.yearsInIndustry || 0}`);
    console.log(`Relevancy Score: ${(experienceMatch.relevancyScore || 0).toFixed(2)}`);
    console.log(`Career Consistency: ${(experienceMatch.careerConsistency || 0).toFixed(2)}`);
    
    if (experienceMatch.credibilitySignals && experienceMatch.credibilitySignals.length > 0) {
      console.log('Credibility Signals:');
      experienceMatch.credibilitySignals.forEach(signal => {
        console.log(`  • ${signal}`);
      });
    }
    
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
    
    // Similar prospects analysis
    if (aiPrediction.reasoning?.similarProspects?.length > 0) {
      console.log('\n👥 SIMILAR PROSPECTS COMPARISON:');
      console.log('-'.repeat(50));
      aiPrediction.reasoning.similarProspects.slice(0, 3).forEach((prospect, index) => {
        console.log(`${index + 1}. Similarity: ${(prospect.similarity * 100).toFixed(1)}% | Graham's Decision: ${prospect.grahamDecision} | Confidence: ${prospect.grahamConfidence}%`);
        if (prospect.matchingFactors && prospect.matchingFactors.length > 0) {
          console.log(`   Matching Factors: ${prospect.matchingFactors.join(', ')}`);
        }
      });
    }
    
    // Analysis summary
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('='.repeat(70));
    
    const decision = aiPrediction.predictedDecision.toUpperCase();
    const confidence = aiPrediction.confidence;
    const redFlags = contentQuality.redFlagCount || 0;
    
    if (decision === 'CONTACT') {
      console.log('🎉 RECOMMENDATION: CONTACT this prospect');
      console.log(`✅ Graham should reach out to this person (${confidence}% confidence)`);
    } else {
      console.log('❌ RECOMMENDATION: SKIP this prospect');
      console.log(`⏭️  Graham should not pursue this person (${confidence}% confidence)`);
    }
    
    console.log(`\n🔍 KEY INSIGHTS:`);
    console.log(`- Content Quality: ${contentQuality.overallQuality || 'Medium'}`);
    console.log(`- Industry Experience: ${experienceMatch.yearsInIndustry || 0} years`);
    console.log(`- Red Flags Detected: ${redFlags}`);
    console.log(`- Legacy Score: ${profileData.score}/10`);
    console.log(`- Analysis Method: Claude 3.5 Sonnet batch processing`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
analyzeDanielSmith();