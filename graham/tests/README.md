# Graham Stephens Build - Testing Framework

## Overview

This comprehensive testing framework validates the performance improvements and optimizations implemented in the Graham Stephens Build application. The tests cover all critical components and ensure the system meets the specified performance requirements.

## Performance Requirements Validated

### API Endpoint Performance
- `/api/v2/prediction/evaluate`: **< 10 seconds** (previously 300+ seconds)
- `/api/dev/profile-research`: **< 3 seconds**  
- `/api/v2/analytics/metrics`: **< 1 second**

### Key Performance Improvements Tested
- **Parallel Processing**: Batch predictions run in parallel instead of sequential
- **Circuit Breakers**: AI service failures handled with 30-60 second timeouts
- **Fallback Logic**: Graceful degradation when AI services are unavailable
- **Memory Optimization**: Efficient processing of large datasets
- **Error Handling**: Robust error recovery without performance degradation

## Test Structure

```
tests/
├── setup.ts                           # Global test configuration
├── unit/                              # Unit tests
│   ├── ai-service-utils.unit.test.ts     # Circuit breakers, timeouts, retries
│   ├── predictive-scoring-engine.unit.test.ts  # Batch processing, experience analysis
│   ├── performance-validation.unit.test.ts     # Performance optimization tests
│   └── simple.test.ts                      # Basic Jest setup validation
├── integration/                       # Integration tests
│   ├── external-services.integration.test.ts   # LinkedIn, Claude AI, OpenAI, Database
│   └── error-handling.integration.test.ts      # JSON parsing, timeouts, rate limiting
├── performance/                       # Performance tests
│   └── api-endpoints.performance.test.ts       # Critical API endpoint performance
├── mocks/                            # Mock services for testing
│   ├── supabase.mock.ts                    # Database mocks
│   └── ai-services.mock.ts                # AI service mocks
└── helpers/
    └── test-data-factory.ts               # Test data generation utilities
```

## Test Categories

### 1. Performance Tests
- **API Endpoint Response Times**: Validates sub-10 second response times
- **Batch Processing**: Confirms parallel execution provides performance gains
- **Memory Efficiency**: Ensures reasonable memory usage under load
- **Concurrent Request Handling**: Tests system behavior under concurrent load

### 2. Integration Tests
- **External Service Integration**: LinkedIn API, Claude AI, OpenAI
- **Database Operations**: Supabase queries, caching, connection handling
- **Service Circuit Breakers**: Failure detection and recovery
- **End-to-End Workflows**: Complete prediction pipeline testing

### 3. Error Handling Tests
- **JSON Parsing Failures**: Malformed AI responses, empty responses
- **AI Service Timeouts**: 30-60 second timeout handling
- **Database Connection Issues**: Connection failures, query timeouts
- **Rate Limiting**: API quota exceeded, rate limit recovery

### 4. Unit Tests
- **Content Intelligence Engine**: Content analysis, fallback logic
- **Predictive Scoring Engine**: Experience analysis, scoring algorithms
- **AI Service Utils**: Circuit breakers, retry logic, error categorization

## Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only  
npm run test:performance    # Performance tests only
npm run test:e2e           # End-to-end tests only

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Test Configuration

### Environment Variables Required
```bash
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key  
RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Test Timeouts
- **Fast operations**: 5 seconds
- **Medium operations**: 15 seconds  
- **Slow operations**: 30 seconds
- **Performance tests**: 60 seconds

## Key Features Tested

### 1. Parallel Processing Implementation
- Batch prediction requests process prospects in parallel
- Performance gains of 2-3x over sequential processing
- Graceful handling of mixed success/failure scenarios

### 2. Circuit Breaker Pattern
- OpenAI and Anthropic service failure detection
- Automatic circuit opening after 3 consecutive failures
- Service recovery and circuit closing on success

### 3. Timeout and Retry Logic
- 30-60 second timeouts for AI service calls
- Exponential backoff retry strategy  
- Fallback to keyword-based analysis when AI fails

### 4. Memory and Performance Optimization
- Efficient processing of large content datasets
- Reasonable memory usage during batch operations
- Fast content analysis using optimized algorithms

### 5. Error Recovery and Resilience
- JSON parsing error handling
- Database connection failure recovery
- Rate limiting and quota management
- Graceful degradation strategies

## Mock Services

### Supabase Mock
- Training decisions, prediction results, decision patterns
- Error simulation for connection and query failures
- Realistic data structure mimicking production

### AI Services Mock  
- OpenAI and Anthropic API response simulation
- Error scenarios: quota exceeded, timeouts, rate limits
- Performance testing with configurable delays

## Coverage Targets

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70% 
- **Statements**: 70%

## Performance Benchmarks

### Before Optimization
- Single prediction: 300+ seconds
- Batch processing: Sequential (N × single time)
- Memory usage: Unbounded growth
- Error handling: Cascading failures

### After Optimization  
- Single prediction: < 10 seconds
- Batch processing: Parallel (significant speedup)
- Memory usage: Controlled and efficient
- Error handling: Graceful degradation with fallbacks

## Continuous Integration

Tests are designed to run in CI/CD environments with:
- Docker container support
- Mock external services (no real API calls in CI)
- Deterministic results with controlled timeouts
- Comprehensive error scenarios covered

## Monitoring and Alerting

Performance tests include monitoring for:
- Response time regressions
- Memory leak detection  
- Error rate increases
- Service availability issues

The testing framework ensures the Graham Stephens Build application maintains its performance improvements and continues to provide reliable service under various conditions.