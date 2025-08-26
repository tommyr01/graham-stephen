#!/usr/bin/env node

/**
 * API Testing Script for Graham Stephens Build
 * 
 * This script tests the LinkedIn API integration and database connectivity
 * to ensure everything is working correctly.
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000';
const LINKEDIN_POST_URL = 'https://www.linkedin.com/posts/satyanadella_mayo-clinic-accelerates-personalized-medicine-activity-7285003244957773826-TrmI/';

async function testAPI() {
  console.log('🔍 Testing Graham Stephens Build API...\n');

  let testResults = {
    health: false,
    auth: false,
    linkedin: false,
    database: false,
  };

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/api/health`);
    
    if (healthResponse.status === 200) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${healthResponse.data.status}`);
      console.log(`   Database: ${healthResponse.data.services?.database || 'unknown'}`);
      console.log(`   LinkedIn API: ${healthResponse.data.services?.linkedin_api || 'unknown'}`);
      testResults.health = true;
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('   Make sure the server is running with: npm run dev');
  }

  try {
    // Test 2: User Registration
    console.log('\n2. Testing User Registration...');
    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    });

    if (registerResponse.status === 201) {
      console.log('✅ User registration passed');
      const token = registerResponse.data.token;
      
      // Test 3: User Authentication
      console.log('\n3. Testing User Authentication...');
      const meResponse = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (meResponse.status === 200) {
        console.log('✅ User authentication passed');
        console.log(`   User: ${meResponse.data.user.email}`);
        testResults.auth = true;

        // Test 4: LinkedIn URL Validation
        console.log('\n4. Testing LinkedIn URL Validation...');
        const validateResponse = await axios.post(`${API_BASE}/api/linkedin/validate-url`, {
          postUrl: LINKEDIN_POST_URL
        });

        if (validateResponse.status === 200 && validateResponse.data.valid) {
          console.log('✅ LinkedIn URL validation passed');
          console.log(`   Post ID: ${validateResponse.data.postId}`);
          
          // Test 5: LinkedIn Comment Extraction (This will test the actual LinkedIn API)
          console.log('\n5. Testing LinkedIn Comment Extraction...');
          console.log('   This tests your RapidAPI integration...');
          
          const extractResponse = await axios.post(`${API_BASE}/api/linkedin/extract-comments`, {
            postUrl: LINKEDIN_POST_URL,
            pageNumber: 1,
            sortOrder: 'Most relevant'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 60000 // 60 second timeout for LinkedIn API
          });

          if (extractResponse.status === 200) {
            console.log('✅ LinkedIn comment extraction passed');
            console.log(`   Session ID: ${extractResponse.data.sessionId}`);
            console.log(`   Comments found: ${extractResponse.data.totalComments}`);
            testResults.linkedin = true;
            testResults.database = true;
          }
          
        } else {
          console.log('❌ LinkedIn URL validation failed');
          console.log('   Response:', validateResponse.data);
        }
      }
    }
  } catch (error) {
    console.log('❌ Authentication/LinkedIn test failed:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data);
      
      if (error.response.status === 429) {
        console.log('   This might be a rate limit. Try again in a few minutes.');
      } else if (error.response.status === 403) {
        console.log('   Check your RAPIDAPI_KEY in the .env file.');
      }
    }
  }

  // Print Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  console.log(`Health Check:      ${testResults.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication:    ${testResults.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`LinkedIn API:      ${testResults.linkedin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database:          ${testResults.database ? '✅ PASS' : '❌ FAIL'}`);

  const passCount = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;

  console.log(`\nOverall: ${passCount}/${totalTests} tests passed`);

  if (passCount === totalTests) {
    console.log('\n🎉 All tests passed! Your backend is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above and:');
    console.log('1. Ensure the server is running: npm run dev');
    console.log('2. Verify your environment variables in .env.local');
    console.log('3. Check your Supabase database setup');
    console.log('4. Verify your RapidAPI key and subscription');
  }

  return passCount === totalTests;
}

// Direct LinkedIn API test (bypasses our backend)
async function testLinkedInAPIDirect() {
  console.log('\n🔗 Testing LinkedIn API directly...');
  
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    console.log('❌ Missing RAPIDAPI_KEY or RAPIDAPI_HOST in environment');
    return false;
  }

  try {
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/post/comments`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
        params: {
          post_url: LINKEDIN_POST_URL,
          page_number: 1,
          sort_order: 'Most relevant',
        },
        timeout: 30000,
      }
    );

    if (response.data.success) {
      console.log('✅ Direct LinkedIn API test passed');
      console.log(`   Comments found: ${response.data.data.comments?.length || 0}`);
      return true;
    } else {
      console.log('❌ Direct LinkedIn API test failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Direct LinkedIn API test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Response:', error.response.data);
    }
    return false;
  }
}

// Run tests
if (require.main === module) {
  console.log('Starting API tests...\n');
  console.log('Make sure your server is running: npm run dev\n');
  
  testLinkedInAPIDirect()
    .then(() => testAPI())
    .then((success) => {
      if (success) {
        console.log('\n✅ All systems operational!');
        process.exit(0);
      } else {
        console.log('\n❌ Some tests failed.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPI, testLinkedInAPIDirect };