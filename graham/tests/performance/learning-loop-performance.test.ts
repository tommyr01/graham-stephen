/**
 * Learning Loop Performance Test Suite
 * 
 * Performance-focused testing for learning loop components to ensure
 * real-time learning doesn't degrade system performance beyond acceptable limits.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { LearningLoopValidator } from '../helpers/learning-loop-validator';
import { TestDataFactory, TEST_SCENARIOS } from '../helpers/test-data-factory';
import { PerformanceMonitor } from '../../src/lib/utils/performance-monitor';

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  concurrentSessions: number;
}

interface LoadTestResult {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  errorRate: number;
  throughputPerSecond: number;
}

class LearningLoopPerformanceTester {
  private validator: LearningLoopValidator;
  private dataFactory: TestDataFactory;
  private performanceMonitor: PerformanceMonitor;
  private activeSessions: Set<string> = new Set();

  constructor() {
    this.validator = new LearningLoopValidator();
    this.dataFactory = new TestDataFactory();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Measure baseline performance without learning
   */
  async measureBaselinePerformance(profileCount: number = 10): Promise<PerformanceMetrics> {
    const profiles = this.dataFactory.createLinkedInProfiles(profileCount);
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    const results = [];
    for (const profile of profiles) {
      const result = await this.validator.analyzeProfileBaseline(profile);
      results.push(result);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    return {
      responseTime: (endTime - startTime) / profileCount,
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      cpuUsage: 0, // Would be measured in real implementation
      throughput: profileCount / ((endTime - startTime) / 1000),
      concurrentSessions: 0
    };
  }

  /**
   * Measure learning-enhanced performance
   */
  async measureLearningPerformance(
    profileCount: number = 10,
    feedbackFrequency: number = 3
  ): Promise<PerformanceMetrics> {
    const session = await this.validator.initializeSession({});
    const profiles = this.dataFactory.createLinkedInProfiles(profileCount);
    
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    const results = [];
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      
      // Provide feedback every few profiles
      if (i % feedbackFrequency === 0 && i > 0) {
        const feedback = this.dataFactory.generateRelevantFeedback(profile);
        await this.validator.processVoiceFeedback({
          sessionId: session.id,
          feedback,
          profileData: profile,
          expectLearning: true
        });
      }
      
      const result = await this.validator.analyzeProfileWithLearning(session.id, profile);
      results.push(result);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    return {
      responseTime: (endTime - startTime) / profileCount,
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      cpuUsage: 0, // Would be measured in real implementation
      throughput: profileCount / ((endTime - startTime) / 1000),
      concurrentSessions: 1
    };
  }

  /**
   * Perform concurrent load testing
   */
  async performLoadTest(
    concurrentSessions: number,
    profilesPerSession: number
  ): Promise<LoadTestResult> {
    const sessionPromises = [];
    const responseTimes: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    const startTime = performance.now();

    for (let i = 0; i < concurrentSessions; i++) {
      sessionPromises.push(this.runConcurrentSession(i, profilesPerSession));
    }

    const sessionResults = await Promise.allSettled(sessionPromises);

    sessionResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
        responseTimes.push(...result.value.responseTimes);
      } else {
        errorCount++;
        console.error(`Session ${index} failed:`, result.reason);
      }
    });

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalOperations = concurrentSessions * profilesPerSession;

    return {
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      successRate: successCount / concurrentSessions,
      errorRate: errorCount / concurrentSessions,
      throughputPerSecond: totalOperations / (totalTime / 1000)
    };
  }

  private async runConcurrentSession(
    sessionIndex: number,
    profileCount: number
  ): Promise<{ responseTimes: number[] }> {
    const session = await this.validator.initializeSession({
      userId: `concurrent-user-${sessionIndex}`
    });
    
    this.activeSessions.add(session.id);
    
    const profiles = this.dataFactory.createLinkedInProfiles(profileCount);
    const responseTimes: number[] = [];

    try {
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        const operationStart = performance.now();

        // Add learning feedback occasionally
        if (i % 3 === 0 && i > 0) {
          const feedback = this.dataFactory.generateRelevantFeedback(profile);
          await this.validator.processVoiceFeedback({
            sessionId: session.id,
            feedback,
            profileData: profile,
            expectLearning: true
          });
        }

        await this.validator.analyzeProfileWithLearning(session.id, profile);
        
        const operationEnd = performance.now();
        responseTimes.push(operationEnd - operationStart);
      }

      return { responseTimes };
    } finally {
      this.activeSessions.delete(session.id);
    }
  }

  /**
   * Test memory usage over extended session
   */
  async testMemoryUsage(duration: number = 60000): Promise<{
    initialMemory: number;
    finalMemory: number;
    peakMemory: number;
    memoryGrowth: number;
  }> {
    const session = await this.validator.initializeSession({});
    const profiles = this.dataFactory.createLinkedInProfiles(100); // Large set for testing
    
    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;
    const startTime = Date.now();

    let profileIndex = 0;
    
    while (Date.now() - startTime < duration) {
      const profile = profiles[profileIndex % profiles.length];
      
      // Simulate continuous learning
      const feedback = this.dataFactory.generateRelevantFeedback(profile);
      await this.validator.processVoiceFeedback({
        sessionId: session.id,
        feedback,
        profileData: profile,
        expectLearning: true
      });

      await this.validator.analyzeProfileWithLearning(session.id, profile);
      
      const currentMemory = process.memoryUsage().heapUsed;
      peakMemory = Math.max(peakMemory, currentMemory);
      
      profileIndex++;
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const finalMemory = process.memoryUsage().heapUsed;

    return {
      initialMemory,
      finalMemory,
      peakMemory,
      memoryGrowth: finalMemory - initialMemory
    };
  }

  async cleanup(): Promise<void> {
    for (const sessionId of this.activeSessions) {
      // Cleanup would be implemented here
    }
    this.activeSessions.clear();
    await this.validator.cleanup();
  }
}

describe('Learning Loop Performance Testing', () => {
  let performanceTester: LearningLoopPerformanceTester;

  beforeEach(async () => {
    performanceTester = new LearningLoopPerformanceTester();
  });

  afterEach(async () => {
    await performanceTester.cleanup();
  });

  describe('1. Response Time Performance', () => {
    test('real-time pattern application meets latency requirements', async () => {
      const session = await performanceTester.validator.initializeSession({});
      const profile = performanceTester.dataFactory.createLinkedInProfile();
      
      // Add some patterns first
      const feedback = 'Strong technical background with excellent SaaS experience';
      await performanceTester.validator.processVoiceFeedback({
        sessionId: session.id,
        feedback,
        profileData: profile,
        expectLearning: true
      });
      
      // Measure pattern application time
      const startTime = performance.now();
      await performanceTester.validator.analyzeProfileWithLearning(session.id, profile);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(TEST_SCENARIOS.LEARNING_LOOP.PERFORMANCE_BENCHMARKS.REAL_TIME_LEARNING);
    });

    test('voice feedback processing meets time requirements', async () => {
      const session = await performanceTester.validator.initializeSession({});
      const profile = performanceTester.dataFactory.createLinkedInProfile();
      const feedback = 'Excellent technical leadership with strong software development background';
      
      const startTime = performance.now();
      const result = await performanceTester.validator.processVoiceFeedback({
        sessionId: session.id,
        feedback,
        profileData: profile,
        expectLearning: true
      });
      const endTime = performance.now();
      
      expect(result.processingTime).toBeLessThan(
        TEST_SCENARIOS.LEARNING_LOOP.PERFORMANCE_BENCHMARKS.VOICE_FEEDBACK_PROCESSING
      );
      expect(endTime - startTime).toBeLessThan(
        TEST_SCENARIOS.LEARNING_LOOP.PERFORMANCE_BENCHMARKS.VOICE_FEEDBACK_PROCESSING
      );
    });

    test('session learning updates are fast', async () => {
      const session = await performanceTester.validator.initializeSession({});
      const profile = performanceTester.dataFactory.createLinkedInProfile();
      
      // Process feedback and measure update time
      const feedback = 'Strong technical background';
      const startTime = performance.now();
      
      await performanceTester.validator.processVoiceFeedback({
        sessionId: session.id,
        feedback,
        profileData: profile,
        expectLearning: true
      });
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      expect(updateTime).toBeLessThan(
        TEST_SCENARIOS.LEARNING_LOOP.PERFORMANCE_BENCHMARKS.SESSION_LEARNING_UPDATE
      );
    });
  });

  describe('2. Performance Overhead Analysis', () => {
    test('learning enhancement adds acceptable overhead', async () => {
      const profileCount = 10;
      
      // Measure baseline performance
      const baselineMetrics = await performanceTester.measureBaselinePerformance(profileCount);
      
      // Measure learning-enhanced performance
      const learningMetrics = await performanceTester.measureLearningPerformance(profileCount);
      
      // Calculate overhead
      const responseTimeOverhead = learningMetrics.responseTime - baselineMetrics.responseTime;
      const memoryOverhead = learningMetrics.memoryUsage - baselineMetrics.memoryUsage;
      
      // Validate overhead is within acceptable limits
      expect(responseTimeOverhead).toBeLessThan(
        TEST_SCENARIOS.LEARNING_LOOP.PERFORMANCE_BENCHMARKS.ENHANCED_ANALYSIS_OVERHEAD
      );
      
      // Memory overhead should be reasonable (less than 50% increase)
      const memoryOverheadPercentage = memoryOverhead / baselineMetrics.memoryUsage;
      expect(memoryOverheadPercentage).toBeLessThan(0.5); // 50% max overhead
      
      // Throughput should not degrade significantly
      const throughputDegradation = (baselineMetrics.throughput - learningMetrics.throughput) / baselineMetrics.throughput;
      expect(throughputDegradation).toBeLessThan(0.3); // Max 30% throughput loss
    });

    test('learning accuracy improvement justifies performance cost', async () => {
      const session = await performanceTester.validator.initializeSession({});
      const profiles = performanceTester.dataFactory.createSimilarProfiles(5);
      
      const baselineAccuracies: number[] = [];
      const learningAccuracies: number[] = [];
      const performanceCosts: number[] = [];
      
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        
        // Measure baseline
        const baselineStart = performance.now();
        const baselineResult = await performanceTester.validator.analyzeProfileBaseline(profile);
        const baselineTime = performance.now() - baselineStart;
        baselineAccuracies.push(baselineResult.accuracy);
        
        // Add feedback
        if (i > 0) {
          const feedback = performanceTester.dataFactory.generateRelevantFeedback(profile);
          await performanceTester.validator.processVoiceFeedback({
            sessionId: session.id,
            feedback,
            profileData: profile,
            expectLearning: true
          });
        }
        
        // Measure learning-enhanced
        const learningStart = performance.now();
        const learningResult = await performanceTester.validator.analyzeProfileWithLearning(
          session.id, 
          profile
        );
        const learningTime = performance.now() - learningStart;
        
        learningAccuracies.push(learningResult.accuracy);
        performanceCosts.push(learningTime - baselineTime);
      }
      
      // Calculate improvements
      const avgBaselineAccuracy = baselineAccuracies.reduce((sum, acc) => sum + acc, 0) / baselineAccuracies.length;
      const avgLearningAccuracy = learningAccuracies.reduce((sum, acc) => sum + acc, 0) / learningAccuracies.length;
      const accuracyImprovement = (avgLearningAccuracy - avgBaselineAccuracy) / avgBaselineAccuracy;
      const avgPerformanceCost = performanceCosts.reduce((sum, cost) => sum + cost, 0) / performanceCosts.length;
      
      // Performance cost should be justified by accuracy improvement
      expect(accuracyImprovement).toBeGreaterThan(0.1); // At least 10% improvement
      expect(avgPerformanceCost).toBeLessThan(500); // Cost should be reasonable
      
      // ROI calculation: improvement per millisecond
      const improvementPerMs = accuracyImprovement / avgPerformanceCost;
      expect(improvementPerMs).toBeGreaterThan(0.0002); // Minimum ROI threshold
    });
  });

  describe('3. Concurrent Load Testing', () => {
    test('system handles concurrent learning sessions', async () => {
      const concurrentSessions = 10;
      const profilesPerSession = 5;
      
      const loadTestResult = await performanceTester.performLoadTest(
        concurrentSessions,
        profilesPerSession
      );
      
      // Validate load test results
      expect(loadTestResult.successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(loadTestResult.errorRate).toBeLessThan(0.05); // <5% error rate
      expect(loadTestResult.averageResponseTime).toBeLessThan(2000); // <2s average under load
      expect(loadTestResult.maxResponseTime).toBeLessThan(5000); // <5s max response time
      
      // Throughput should be reasonable
      expect(loadTestResult.throughputPerSecond).toBeGreaterThan(1); // At least 1 operation/second
    });

    test('performance degrades gracefully under increasing load', async () => {
      const loadLevels = [5, 10, 20]; // Increasing concurrent sessions
      const results: LoadTestResult[] = [];
      
      for (const sessionCount of loadLevels) {
        const result = await performanceTester.performLoadTest(sessionCount, 3);
        results.push(result);
        
        // Allow system to recover between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Validate graceful degradation
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];
        
        // Response time should increase but remain reasonable
        expect(current.averageResponseTime).toBeGreaterThanOrEqual(previous.averageResponseTime);
        expect(current.averageResponseTime).toBeLessThan(previous.averageResponseTime * 3); // Max 3x increase
        
        // Success rate should remain high
        expect(current.successRate).toBeGreaterThan(0.90); // 90% success rate minimum
        
        // Throughput per session should not degrade too much
        const currentThroughputPerSession = current.throughputPerSecond / loadLevels[i];
        const previousThroughputPerSession = previous.throughputPerSecond / loadLevels[i - 1];
        const throughputDegradation = (previousThroughputPerSession - currentThroughputPerSession) / previousThroughputPerSession;
        expect(throughputDegradation).toBeLessThan(0.5); // Max 50% throughput degradation per session
      }
    });
  });

  describe('4. Memory and Resource Management', () => {
    test('memory usage remains stable during extended learning sessions', async () => {
      const memoryTest = await performanceTester.testMemoryUsage(30000); // 30 seconds
      
      // Memory growth should be reasonable
      const memoryGrowthMB = memoryTest.memoryGrowth / (1024 * 1024);
      expect(memoryGrowthMB).toBeLessThan(50); // Less than 50MB growth
      
      // Peak memory should not be excessive
      const peakMemoryMB = memoryTest.peakMemory / (1024 * 1024);
      const initialMemoryMB = memoryTest.initialMemory / (1024 * 1024);
      const peakIncrease = (peakMemoryMB - initialMemoryMB) / initialMemoryMB;
      expect(peakIncrease).toBeLessThan(2.0); // Max 200% memory increase
    });

    test('pattern cache performs efficiently', async () => {
      const session = await performanceTester.validator.initializeSession({});
      const profiles = performanceTester.dataFactory.createLinkedInProfiles(50);
      
      // Warm up the cache
      for (let i = 0; i < 10; i++) {
        const feedback = performanceTester.dataFactory.generateRelevantFeedback(profiles[i]);
        await performanceTester.validator.processVoiceFeedback({
          sessionId: session.id,
          feedback,
          profileData: profiles[i],
          expectLearning: true
        });
      }
      
      // Measure cache performance
      const cacheTestStart = performance.now();
      for (let i = 10; i < profiles.length; i++) {
        await performanceTester.validator.analyzeProfileWithLearning(session.id, profiles[i]);
      }
      const cacheTestEnd = performance.now();
      
      const averageTimeWithCache = (cacheTestEnd - cacheTestStart) / (profiles.length - 10);
      expect(averageTimeWithCache).toBeLessThan(100); // <100ms with cache
    });
  });

  describe('5. Performance Regression Detection', () => {
    test('learning loop performance meets baseline requirements', async () => {
      const baselineMetrics = await performanceTester.measureBaselinePerformance(20);
      const learningMetrics = await performanceTester.measureLearningPerformance(20, 5);
      
      // Core performance requirements
      expect(learningMetrics.responseTime).toBeLessThan(1000); // <1s average response
      expect(learningMetrics.throughput).toBeGreaterThan(1); // >1 operation/second
      
      // Learning overhead should be justified
      const performanceRatio = learningMetrics.responseTime / baselineMetrics.responseTime;
      expect(performanceRatio).toBeLessThan(2.0); // Max 2x slowdown
      
      // Memory usage should be reasonable
      const memoryRatioMB = learningMetrics.memoryUsage / (1024 * 1024);
      expect(memoryRatioMB).toBeLessThan(100); // <100MB for learning session
    });

    test('performance scales linearly with session complexity', async () => {
      const complexities = [5, 10, 20]; // Number of profiles
      const performanceResults: number[] = [];
      
      for (const complexity of complexities) {
        const metrics = await performanceTester.measureLearningPerformance(complexity, 3);
        performanceResults.push(metrics.responseTime);
      }
      
      // Performance should scale roughly linearly
      for (let i = 1; i < performanceResults.length; i++) {
        const scalingFactor = complexities[i] / complexities[i - 1];
        const performanceIncrease = performanceResults[i] / performanceResults[i - 1];
        
        // Performance increase should be proportional to complexity increase
        expect(performanceIncrease).toBeGreaterThan(scalingFactor * 0.8); // At least 80% efficiency
        expect(performanceIncrease).toBeLessThan(scalingFactor * 1.5); // Not more than 150% of expected
      }
    });
  });
});

// Custom Jest matchers for performance testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toMeetPerformanceBenchmark(benchmarkMs: number): R;
      toHaveAcceptableMemoryUsage(maxMB: number): R;
      toShowLinearScaling(expectedScaling: number): R;
    }
  }
}

expect.extend({
  toMeetPerformanceBenchmark(received: number, benchmarkMs: number) {
    const pass = received <= benchmarkMs;
    return {
      message: () => `Expected ${received}ms to ${pass ? 'not ' : ''}meet benchmark of ${benchmarkMs}ms`,
      pass
    };
  },

  toHaveAcceptableMemoryUsage(received: number, maxMB: number) {
    const receivedMB = received / (1024 * 1024);
    const pass = receivedMB <= maxMB;
    return {
      message: () => `Expected ${receivedMB.toFixed(2)}MB to ${pass ? 'not ' : ''}be less than ${maxMB}MB`,
      pass
    };
  },

  toShowLinearScaling(received: number[], expectedScaling: number) {
    if (received.length < 2) return { message: () => 'Need at least 2 data points', pass: false };
    
    const actualScaling = received[received.length - 1] / received[0];
    const scalingError = Math.abs(actualScaling - expectedScaling) / expectedScaling;
    const pass = scalingError < 0.5; // Within 50% of expected scaling
    
    return {
      message: () => `Expected scaling ${actualScaling.toFixed(2)} to ${pass ? 'not ' : ''}be close to ${expectedScaling}`,
      pass
    };
  }
});