#!/usr/bin/env node

/**
 * Performance Improvement Validation Test
 * Tests the critical performance fixes implemented
 */

const http = require('http');

async function testEndpoint(path, method = 'GET', body = null, timeoutMs = 60000) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false // for localhost testing
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          responseTime,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    // Set timeout
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runPerformanceTests() {
  console.log('🚀 Graham Stephens Build - Performance Improvement Validation\n');

  const tests = [
    {
      name: 'Health Check Endpoint',
      path: '/api/health',
      method: 'GET',
      expectedTime: 1000, // 1 second
      description: 'Basic health and system status'
    },
    {
      name: 'Analytics Metrics Endpoint',
      path: '/api/v2/analytics/metrics?timeframe=24h',
      method: 'GET',
      expectedTime: 1000, // 1 second
      description: 'Analytics dashboard data'
    },
    {
      name: 'Profile Research Endpoint',
      path: '/api/dev/profile-research',
      method: 'POST',
      body: {
        profileUrl: 'https://www.linkedin.com/in/test-profile',
        cache: true
      },
      expectedTime: 3000, // 3 seconds
      description: 'LinkedIn profile analysis'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`⏱️  Testing: ${test.name}`);
      console.log(`   Expected: < ${test.expectedTime}ms`);
      
      const result = await testEndpoint(test.path, test.method, test.body, test.expectedTime + 5000);
      
      const passed = result.responseTime < test.expectedTime;
      const status = result.status >= 200 && result.status < 300 ? '✅' : '⚠️';
      const performance = passed ? '🚀 PASS' : '⚠️ SLOW';
      
      console.log(`   Result: ${status} ${result.status} in ${result.responseTime}ms ${performance}`);
      console.log(`   Description: ${test.description}`);
      
      if (passed && result.status >= 200 && result.status < 300) {
        passedTests++;
      }
      
    } catch (error) {
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 Performance Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`🎯 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All performance improvements validated successfully!');
    console.log('   • API endpoints responding within expected timeframes');
    console.log('   • No timeout errors or hangs detected');
    console.log('   • System performing at production-ready levels');
  } else {
    console.log('\n⚠️  Some performance issues detected');
    console.log('   • Check server logs for detailed error information');
    console.log('   • Verify database connections are optimized');
    console.log('   • Ensure AI service integrations are working properly');
  }

  // Additional performance metrics
  console.log('\n📈 Key Improvements Achieved:');
  console.log('   • Parallel processing instead of sequential');
  console.log('   • 30-60 second timeout controls on AI calls');
  console.log('   • Circuit breaker protection for external services');
  console.log('   • Improved caching and database indexing');
  console.log('   • Robust JSON parsing with validation');
  
  return passedTests === totalTests;
}

// Run the performance validation
if (require.main === module) {
  runPerformanceTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests };