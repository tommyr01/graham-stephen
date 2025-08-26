# User Feedback Loop Feature - Testing Guide

## Overview

This document provides instructions for running the comprehensive test suite for the User Feedback Loop feature. The test suite validates all aspects of the feature implementation including API endpoints, business logic, database layer, integration, performance, and security.

## Test Suite Architecture

### 🎯 **Master Test Orchestrator**
- **Command**: `npm run test-feedback-loop`
- **File**: `run-feedback-loop-tests.js`
- **Purpose**: Runs all feedback loop tests and generates comprehensive reports

### 📋 **Individual Test Suites**

#### 1. API Endpoint Tests
- **Command**: `npm run test-feedback-api`
- **File**: `feedback-loop-tests.js`
- **Coverage**: All feedback types, rate limiting, security, validation
- **Duration**: ~60 seconds

#### 2. Business Logic Tests
- **Command**: `npm run test-business-logic`  
- **File**: `business-logic-feedback-tests.js`
- **Coverage**: Learning algorithms, preference adaptation, team aggregation
- **Duration**: ~30 seconds

#### 3. Database Tests
- **Command**: `npm run test-database`
- **File**: `database-feedback-tests.js`
- **Coverage**: Schema validation, constraints, performance, security
- **Duration**: ~45 seconds
- **Requirements**: PostgreSQL database connection

### 🔄 **Legacy Tests**
- **Command**: `npm run test-suite` or `npm run test-api`
- **Purpose**: Existing comprehensive backend tests for broader validation

## Prerequisites

### 1. Environment Setup
```bash
# Install dependencies (includes new test dependencies)
npm install

# Ensure backend server is running
npm run dev
# Server should be available at http://localhost:3001
```

### 2. Database Setup (for database tests)
```bash
# Setup database with migrations
npm run setup-db

# Or ensure PostgreSQL is running with the feedback loop schema
# Check migrations/001_feedback_loop_schema.sql has been applied
```

### 3. Environment Variables
```bash
# For database tests (optional - defaults provided)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=graham_test
DB_USER=postgres
DB_PASSWORD=postgres
```

## Running Tests

### 🚀 **Quick Start - Run All Tests**
```bash
# Complete feedback loop test suite with reporting
npm run test-feedback-loop

# Run all tests (legacy + feedback loop)
npm run test-all
```

### 🎯 **Individual Test Categories**
```bash
# API endpoints only
npm run test-feedback-api

# Business logic only  
npm run test-business-logic

# Database layer only
npm run test-database

# Legacy backend tests
npm run test-api
```

### 🔧 **Direct Execution**
```bash
# Run with detailed output
node run-feedback-loop-tests.js

# Individual suites
node feedback-loop-tests.js
node business-logic-feedback-tests.js
node database-feedback-tests.js
```

## Understanding Test Output

### ✅ **Success Indicators**
- `✅ PASSED:` - Individual test passed
- `✅ Feature ready for production` - Overall assessment  
- Exit code 0 - All critical tests passed

### ❌ **Failure Indicators**
- `❌ FAILED:` - Individual test failed
- `🔴 NOT READY FOR DEPLOYMENT` - Overall assessment
- Exit code 1 - Critical failures detected

### 📊 **Test Reports**

#### Automatic Report Generation
Tests generate comprehensive reports:

1. **Console Output**: Real-time progress and summary
2. **JSON Report**: `feedback-loop-master-report.json` - Detailed metrics
3. **Text Summary**: `feedback-loop-test-summary.txt` - Quick overview
4. **Individual Reports**: Suite-specific result files

#### Report Interpretation
```
Total Tests: 85
Passed: 82 (96.47%)
Failed: 3
Overall Pass Rate: 96.47%

✅ API Endpoints: 25/26 (96%)
✅ Business Logic: 20/20 (100%) 
⚠️ Database Layer: 12/15 (80%)
✅ Integration: 15/15 (100%)
✅ Security: 10/10 (100%)
```

### 🎯 **Acceptance Criteria Validation**

The tests validate all four acceptance criteria:

1. **✅ Simple Feedback Collection** - Unobtrusive workflow integration
2. **✅ Algorithm Adaptation** - Learning without performance degradation  
3. **✅ Feedback Value Communication** - Impact visibility and progress tracking
4. **✅ Edge Case Management** - Graceful handling of conflicts and transitions

## Troubleshooting

### Common Issues

#### 🔴 **Server Not Available**
```
Error: Backend server is not available
Solution: Start the development server with `npm run dev`
```

#### 🔴 **Database Connection Failed**
```
Error: Failed to connect to database
Solutions:
1. Ensure PostgreSQL is running
2. Check database credentials in environment
3. Apply migrations: npm run setup-db
4. Skip database tests if not needed for API validation
```

#### 🔴 **Rate Limiting Triggered**
```
Error: Too many requests
Solution: Wait 1 hour or restart server to reset rate limits
```

#### 🔴 **Test Timeouts**
```
Error: Test suite timed out
Solutions:
1. Increase timeout in test configuration
2. Check for infinite loops in business logic
3. Verify database performance
```

### Debug Mode

For detailed debugging, run tests with verbose output:

```bash
# Enable debug logging
DEBUG=true node run-feedback-loop-tests.js

# Run individual test with full output
node feedback-loop-tests.js 2>&1 | tee test-debug.log
```

## Performance Benchmarks

### Expected Performance
| Test Category | Duration | Pass Threshold |
|---------------|----------|----------------|
| API Tests | ~60s | 95%+ |
| Business Logic | ~30s | 90%+ |
| Database Tests | ~45s | 85%+ |
| Total Suite | ~3-5min | 90%+ overall |

### Response Time Targets
| Operation | Target | Typical |
|-----------|--------|---------|
| Binary Feedback | < 1s | ~0.8s |
| Detailed Feedback | < 2s | ~1.2s |
| Bulk Processing | < 5s | ~3.8s |
| Learning Trigger | < 3s | ~2.1s |

## CI/CD Integration

### Automated Testing
```yaml
# Example GitHub Actions workflow
name: Feedback Loop Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run setup-db
      - run: npm run dev &
      - run: sleep 10  # Wait for server
      - run: npm run test-feedback-loop
```

### Quality Gates
- **Pass Rate**: ≥ 90% for deployment approval
- **Performance**: All response times within targets
- **Critical Tests**: 100% pass rate for API and business logic
- **Security**: 100% pass rate for authentication and privacy tests

## Test Development

### Adding New Tests

#### API Endpoint Tests
Add to `feedback-loop-tests.js`:
```javascript
// Test X.Y: New Feature Test
try {
  testResults.total++;
  
  // Test implementation
  const response = await makeRequest('POST', '/api/new-endpoint', testData);
  
  // Validations
  validateResponseSchema(response.data, expectedSchema);
  
  logSuccess('New Feature Test');
  testResults.passed++;
} catch (error) {
  logError('New Feature Test', error);
}
```

#### Business Logic Tests
Add to `business-logic-feedback-tests.js`:
```javascript
function testNewAlgorithm() {
  try {
    algorithmResults.total++;
    
    // Algorithm validation logic
    const result = newAlgorithmFunction(testInput);
    assert(result.isValid, 'Algorithm should produce valid results');
    
    logSuccess('New Algorithm Test');
    algorithmResults.passed++;
  } catch (error) {
    logError('New Algorithm Test', error);
  }
}
```

### Test Data Management

Use consistent test data patterns:
```javascript
const TEST_DATA = {
  testUserId: '550e8400-e29b-41d4-a716-446655440000',
  testSessionId: '550e8400-e29b-41d4-a716-446655440002',
  sampleFeedback: {
    feedbackType: 'detailed',
    overallRating: 8,
    // ... other test data
  }
};
```

## Support

### Getting Help
1. **Check test output** for specific error messages
2. **Review logs** in generated report files
3. **Verify prerequisites** are met (server, database, dependencies)
4. **Run individual suites** to isolate issues
5. **Check existing issues** in the project documentation

### Contact Information
- **QA Framework**: Built by Claude AI Assistant
- **Feature Implementation**: Graham Stephens Build Team
- **Documentation**: This testing guide and QA report

---

**Last Updated**: 2025-01-14  
**Test Framework Version**: 1.0.0  
**Compatible with**: Node.js 16+, PostgreSQL 12+