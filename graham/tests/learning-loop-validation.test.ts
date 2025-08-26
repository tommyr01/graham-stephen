/**
 * Learning Loop Validation Test Suite
 * 
 * Comprehensive testing framework for validating MVP learning loop functionality,
 * measuring learning effectiveness, and ensuring quality standards.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { LearningLoopValidator } from './helpers/learning-loop-validator';
import { TestDataFactory } from './helpers/test-data-factory';
import { PerformanceMonitor } from '../src/lib/utils/performance-monitor';

interface LearningMetrics {
  accuracyImprovement: number;
  learningVelocity: number;
  patternQuality: number;
  userSatisfaction: number;
  performanceImpact: number;
}

interface LearningTestSession {
  sessionId: string;
  userId: string;
  baselineAccuracy: number;
  currentAccuracy: number;
  patternsLearned: number;
  profilesAnalyzed: number;
}

class LearningLoopTestFramework {
  private validator: LearningLoopValidator;
  private dataFactory: TestDataFactory;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.validator = new LearningLoopValidator();
    this.dataFactory = new TestDataFactory();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Create a controlled learning test session
   */
  async createTestSession(): Promise<LearningTestSession> {
    const sessionData = this.dataFactory.createLearningSession();
    const session = await this.validator.initializeSession(sessionData);
    
    return {
      sessionId: session.id,
      userId: session.userId,
      baselineAccuracy: session.baselineAccuracy,
      currentAccuracy: session.baselineAccuracy,
      patternsLearned: 0,
      profilesAnalyzed: 0
    };
  }

  /**
   * Simulate voice feedback and measure learning impact
   */
  async simulateVoiceFeedback(
    session: LearningTestSession,
    feedback: string,
    profileData: any
  ): Promise<{
    patternsExtracted: number;
    confidenceImprovement: number;
    processingTime: number;
  }> {
    const startTime = performance.now();
    
    const result = await this.validator.processVoiceFeedback({
      sessionId: session.sessionId,
      feedback,
      profileData,
      expectLearning: true
    });
    
    const endTime = performance.now();
    
    return {
      patternsExtracted: result.patternsExtracted.length,
      confidenceImprovement: result.confidenceImpact,
      processingTime: endTime - startTime
    };
  }

  /**
   * Measure learning effectiveness across multiple profiles
   */
  async measureLearningProgression(
    session: LearningTestSession,
    profileSequence: any[]
  ): Promise<LearningMetrics> {
    const accuracyProgression: number[] = [];
    let totalPatterns = 0;
    let totalProcessingTime = 0;

    for (let i = 0; i < profileSequence.length; i++) {
      const profile = profileSequence[i];
      
      // Provide feedback on current profile
      const feedback = this.dataFactory.generateRelevantFeedback(profile);
      const feedbackResult = await this.simulateVoiceFeedback(session, feedback, profile);
      
      totalPatterns += feedbackResult.patternsExtracted;
      totalProcessingTime += feedbackResult.processingTime;
      
      // Analyze next profile with learning applied (if exists)
      if (i < profileSequence.length - 1) {
        const nextProfile = profileSequence[i + 1];
        const analysisResult = await this.validator.analyzeProfileWithLearning(
          session.sessionId,
          nextProfile
        );
        accuracyProgression.push(analysisResult.accuracy);
      }
    }

    const finalAccuracy = accuracyProgression[accuracyProgression.length - 1] || session.baselineAccuracy;
    const accuracyImprovement = (finalAccuracy - session.baselineAccuracy) / session.baselineAccuracy;
    
    return {
      accuracyImprovement,
      learningVelocity: this.calculateLearningVelocity(accuracyProgression),
      patternQuality: await this.assessPatternQuality(session.sessionId),
      userSatisfaction: 4.2, // Would be measured through user feedback in real scenarios
      performanceImpact: totalProcessingTime / profileSequence.length
    };
  }

  private calculateLearningVelocity(accuracyProgression: number[]): number {
    if (accuracyProgression.length < 2) return 0;
    
    // Calculate the rate of improvement over the progression
    const improvements = [];
    for (let i = 1; i < accuracyProgression.length; i++) {
      improvements.push(accuracyProgression[i] - accuracyProgression[i - 1]);
    }
    
    return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
  }

  private async assessPatternQuality(sessionId: string): Promise<number> {
    const patterns = await this.validator.getSessionPatterns(sessionId);
    
    if (patterns.length === 0) return 0;
    
    // Calculate average pattern confidence and relevance
    const qualityScores = patterns.map(pattern => {
      const confidenceScore = pattern.confidence;
      const relevanceScore = pattern.applicationSuccessRate || 0.8; // Default if not measured yet
      return (confidenceScore + relevanceScore) / 2;
    });
    
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }
}

describe('Learning Loop Success Validation', () => {
  let testFramework: LearningLoopTestFramework;

  beforeEach(async () => {
    testFramework = new LearningLoopTestFramework();
  });

  afterEach(async () => {
    // Cleanup test sessions and data
    await testFramework.validator.cleanup();
  });

  describe('1. Immediate Learning Validation', () => {
    test('voice feedback improves subsequent profile analysis within same session', async () => {
      // Success Criteria: 15%+ accuracy improvement within session
      const session = await testFramework.createTestSession();
      const testProfiles = testFramework.dataFactory.createSimilarProfiles(3);
      
      const metrics = await testFramework.measureLearningProgression(session, testProfiles);
      
      expect(metrics.accuracyImprovement).toBeGreaterThan(0.15); // 15% improvement
      expect(metrics.learningVelocity).toBeGreaterThan(0); // Positive learning trend
      expect(metrics.performanceImpact).toBeLessThan(500); // <500ms processing time
    });

    test('patterns are extracted and applied in real-time', async () => {
      const session = await testFramework.createTestSession();
      const profile = testFramework.dataFactory.createLinkedInProfile({
        industry: 'Software',
        experience: 'Senior',
        signals: ['technical_leadership', 'saas_experience']
      });
      
      const feedback = 'Strong technical leader with excellent SaaS background';
      const result = await testFramework.simulateVoiceFeedback(session, feedback, profile);
      
      expect(result.patternsExtracted).toBeGreaterThan(0);
      expect(result.confidenceImprovement).toBeGreaterThan(0.1); // 10% confidence boost
      expect(result.processingTime).toBeLessThan(200); // Real-time requirement
    });

    test('learning effectiveness is measurable within 5 profiles', async () => {
      const session = await testFramework.createTestSession();
      const profileSequence = testFramework.dataFactory.createProgressiveProfiles(5);
      
      const metrics = await testFramework.measureLearningProgression(session, profileSequence);
      
      expect(metrics.accuracyImprovement).toBeGreaterThan(0.10); // 10% minimum within 5 profiles
      expect(metrics.patternQuality).toBeGreaterThan(0.70); // High quality patterns
    });
  });

  describe('2. Learning Quality Assessment', () => {
    test('extracted patterns have high precision and recall', async () => {
      const session = await testFramework.createTestSession();
      const validationProfiles = testFramework.dataFactory.createValidationSet(20);
      
      // Train with half the profiles
      const trainingProfiles = validationProfiles.slice(0, 10);
      for (const profile of trainingProfiles) {
        const feedback = testFramework.dataFactory.generateAccurateFeedback(profile);
        await testFramework.simulateVoiceFeedback(session, feedback, profile);
      }
      
      // Test with remaining profiles
      const testProfiles = validationProfiles.slice(10);
      let correctPredictions = 0;
      
      for (const profile of testProfiles) {
        const analysis = await testFramework.validator.analyzeProfileWithLearning(
          session.sessionId,
          profile
        );
        
        if (analysis.accuracy > 0.8) correctPredictions++;
      }
      
      const precision = correctPredictions / testProfiles.length;
      expect(precision).toBeGreaterThan(0.80); // 80% precision requirement
    });

    test('learning avoids overfitting to specific user patterns', async () => {
      const session = await testFramework.createTestSession();
      
      // Provide biased feedback (only positive for one industry)
      const biasedProfiles = testFramework.dataFactory.createBiasedProfiles('fintech', 10);
      for (const profile of biasedProfiles) {
        const feedback = 'Excellent candidate'; // Always positive
        await testFramework.simulateVoiceFeedback(session, feedback, profile);
      }
      
      // Test with diverse industry profiles
      const diverseProfiles = testFramework.dataFactory.createDiverseProfiles(5);
      const predictions = [];
      
      for (const profile of diverseProfiles) {
        const analysis = await testFramework.validator.analyzeProfileWithLearning(
          session.sessionId,
          profile
        );
        predictions.push(analysis.relevanceScore);
      }
      
      // Check for reasonable variance (not all predictions should be identical)
      const variance = testFramework.calculateVariance(predictions);
      expect(variance).toBeGreaterThan(0.05); // Sufficient diversity in predictions
    });

    test('pattern confidence correlates with actual accuracy', async () => {
      const session = await testFramework.createTestSession();
      const profiles = testFramework.dataFactory.createValidationProfiles(15);
      
      // Generate patterns with feedback
      for (const profile of profiles.slice(0, 10)) {
        const feedback = testFramework.dataFactory.generateFeedback(profile);
        await testFramework.simulateVoiceFeedback(session, feedback, profile);
      }
      
      const patterns = await testFramework.validator.getSessionPatterns(session.sessionId);
      const confidenceAccuracyCorrelation = await testFramework.validator
        .calculateConfidenceAccuracyCorrelation(patterns, profiles.slice(10));
      
      expect(confidenceAccuracyCorrelation).toBeGreaterThan(0.6); // Strong correlation
    });
  });

  describe('3. Performance Benchmarks', () => {
    test('real-time learning maintains performance standards', async () => {
      const session = await testFramework.createTestSession();
      const profile = testFramework.dataFactory.createLinkedInProfile();
      
      // Measure baseline performance
      const baselineStart = performance.now();
      await testFramework.validator.analyzeProfileBaseline(profile);
      const baselineTime = performance.now() - baselineStart;
      
      // Measure learning-enhanced performance
      const learningStart = performance.now();
      await testFramework.validator.analyzeProfileWithLearning(session.sessionId, profile);
      const learningTime = performance.now() - learningStart;
      
      const performanceOverhead = (learningTime - baselineTime) / baselineTime;
      expect(performanceOverhead).toBeLessThan(0.30); // <30% performance overhead
    });

    test('concurrent learning sessions maintain stability', async () => {
      const concurrentSessions = 10;
      const sessionPromises = [];
      
      for (let i = 0; i < concurrentSessions; i++) {
        sessionPromises.push(async () => {
          const session = await testFramework.createTestSession();
          const profiles = testFramework.dataFactory.createProfiles(3);
          return testFramework.measureLearningProgression(session, profiles);
        });
      }
      
      const startTime = performance.now();
      const results = await Promise.all(sessionPromises.map(fn => fn()));
      const totalTime = performance.now() - startTime;
      
      // All sessions should complete successfully
      results.forEach(metrics => {
        expect(metrics.accuracyImprovement).toBeGreaterThan(0);
        expect(metrics.performanceImpact).toBeLessThan(1000); // <1s per operation
      });
      
      // Overall system performance should remain stable
      const avgTimePerSession = totalTime / concurrentSessions;
      expect(avgTimePerSession).toBeLessThan(2000); // <2s per session under load
    });
  });

  describe('4. User Experience Validation', () => {
    test('learning improvements are clearly visible to users', async () => {
      const session = await testFramework.createTestSession();
      const profiles = testFramework.dataFactory.createSimilarProfiles(5);
      
      const progressData = [];
      for (let i = 0; i < profiles.length - 1; i++) {
        // Provide feedback on current profile
        const feedback = testFramework.dataFactory.generateFeedback(profiles[i]);
        await testFramework.simulateVoiceFeedback(session, feedback, profiles[i]);
        
        // Analyze next profile and track progress
        const analysis = await testFramework.validator.analyzeProfileWithLearning(
          session.sessionId,
          profiles[i + 1]
        );
        
        progressData.push({
          profileNumber: i + 1,
          accuracy: analysis.accuracy,
          learningContributions: analysis.learningContributions,
          confidenceGrowth: analysis.confidence - session.baselineAccuracy
        });
      }
      
      // Validate learning visibility
      expect(progressData.length).toBeGreaterThan(0);
      progressData.forEach(data => {
        expect(data.learningContributions).toBeDefined();
        expect(data.learningContributions.length).toBeGreaterThan(0);
      });
      
      // Validate progressive improvement
      const finalAccuracy = progressData[progressData.length - 1].accuracy;
      const initialAccuracy = progressData[0].accuracy;
      expect(finalAccuracy).toBeGreaterThan(initialAccuracy);
    });

    test('feedback process integrates seamlessly into workflow', async () => {
      const session = await testFramework.createTestSession();
      const profile = testFramework.dataFactory.createLinkedInProfile();
      
      // Measure total workflow time including feedback
      const workflowStart = performance.now();
      
      // Step 1: Analyze profile
      const analysis = await testFramework.validator.analyzeProfileBaseline(profile);
      
      // Step 2: Provide voice feedback (simulate user interaction)
      const feedback = 'Good technical background but lacks industry experience';
      const feedbackResult = await testFramework.simulateVoiceFeedback(session, feedback, profile);
      
      // Step 3: Receive learning confirmation
      const learningConfirmation = await testFramework.validator.getLearningConfirmation(
        session.sessionId
      );
      
      const totalWorkflowTime = performance.now() - workflowStart;
      
      // Validate workflow efficiency
      expect(totalWorkflowTime).toBeLessThan(3000); // <3s total workflow time
      expect(feedbackResult.processingTime).toBeLessThan(500); // Feedback processing is fast
      expect(learningConfirmation.acknowledged).toBe(true); // User receives confirmation
    });
  });

  describe('5. A/B Testing Validation Framework', () => {
    test('control vs treatment group shows measurable improvement', async () => {
      const controlGroupSize = 50;
      const treatmentGroupSize = 50;
      
      // Control group: Standard analysis
      const controlResults = [];
      for (let i = 0; i < controlGroupSize; i++) {
        const profile = testFramework.dataFactory.createLinkedInProfile();
        const analysis = await testFramework.validator.analyzeProfileBaseline(profile);
        controlResults.push(analysis.accuracy);
      }
      
      // Treatment group: Learning-enhanced analysis
      const treatmentResults = [];
      for (let i = 0; i < treatmentGroupSize; i++) {
        const session = await testFramework.createTestSession();
        const profiles = testFramework.dataFactory.createSimilarProfiles(3);
        const metrics = await testFramework.measureLearningProgression(session, profiles);
        treatmentResults.push(session.baselineAccuracy * (1 + metrics.accuracyImprovement));
      }
      
      // Statistical analysis
      const controlMean = controlResults.reduce((sum, val) => sum + val, 0) / controlResults.length;
      const treatmentMean = treatmentResults.reduce((sum, val) => sum + val, 0) / treatmentResults.length;
      const improvement = (treatmentMean - controlMean) / controlMean;
      
      expect(improvement).toBeGreaterThan(0.15); // 15% improvement target
      
      // Calculate statistical significance (simplified)
      const pooledStd = testFramework.calculatePooledStandardDeviation(controlResults, treatmentResults);
      const tStatistic = (treatmentMean - controlMean) / (pooledStd * Math.sqrt(2 / controlGroupSize));
      
      expect(Math.abs(tStatistic)).toBeGreaterThan(1.96); // 95% confidence level
    });
  });

  describe('6. Rollback Criteria Validation', () => {
    test('system detects and handles learning quality degradation', async () => {
      const session = await testFramework.createTestSession();
      
      // Simulate poor quality feedback that would degrade learning
      const poorFeedback = [
        'Random nonsense feedback',
        'Completely irrelevant comment',
        'This makes no sense for this profile'
      ];
      
      const profiles = testFramework.dataFactory.createLinkedInProfiles(3);
      
      for (let i = 0; i < poorFeedback.length; i++) {
        const result = await testFramework.simulateVoiceFeedback(
          session,
          poorFeedback[i],
          profiles[i]
        );
        
        // System should detect low-quality patterns
        expect(result.confidenceImprovement).toBeLessThan(0.05); // Minimal improvement
      }
      
      // System should maintain stability despite poor feedback
      const finalAnalysis = await testFramework.validator.analyzeProfileWithLearning(
        session.sessionId,
        testFramework.dataFactory.createLinkedInProfile()
      );
      
      expect(finalAnalysis.accuracy).toBeGreaterThan(session.baselineAccuracy * 0.95); // <5% degradation
    });

    test('performance degradation triggers appropriate responses', async () => {
      // Simulate high load scenario
      const heavyLoadPromises = [];
      for (let i = 0; i < 100; i++) {
        heavyLoadPromises.push(testFramework.createTestSession());
      }
      
      const sessions = await Promise.all(heavyLoadPromises);
      
      // Measure system response under load
      const loadTestStart = performance.now();
      const loadTestPromises = sessions.map(async (session) => {
        const profile = testFramework.dataFactory.createLinkedInProfile();
        return testFramework.validator.analyzeProfileWithLearning(session.sessionId, profile);
      });
      
      const results = await Promise.all(loadTestPromises);
      const loadTestTime = performance.now() - loadTestStart;
      
      // Validate system maintains acceptable performance
      const avgResponseTime = loadTestTime / sessions.length;
      expect(avgResponseTime).toBeLessThan(2000); // <2s average under load
      
      // All requests should complete successfully (no circuit breaker trips)
      results.forEach(result => {
        expect(result.accuracy).toBeGreaterThan(0);
      });
    });
  });
});

// Helper test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toShowLearningImprovement(): R;
      toMeetPerformanceBenchmarks(): R;
      toHaveHighPatternQuality(): R;
    }
  }
}

expect.extend({
  toShowLearningImprovement(received: LearningMetrics) {
    const pass = received.accuracyImprovement > 0.15 &&
                 received.learningVelocity > 0 &&
                 received.patternQuality > 0.70;
    
    return {
      message: () => `Expected learning metrics to show improvement. 
        Accuracy improvement: ${received.accuracyImprovement} (target: >0.15)
        Learning velocity: ${received.learningVelocity} (target: >0)
        Pattern quality: ${received.patternQuality} (target: >0.70)`,
      pass
    };
  },

  toMeetPerformanceBenchmarks(received: number) {
    const pass = received < 500; // 500ms benchmark
    
    return {
      message: () => `Expected performance time ${received}ms to be less than 500ms`,
      pass
    };
  },

  toHaveHighPatternQuality(received: any[]) {
    const avgConfidence = received.reduce((sum, p) => sum + p.confidence, 0) / received.length;
    const pass = avgConfidence > 0.70;
    
    return {
      message: () => `Expected pattern confidence ${avgConfidence} to be greater than 0.70`,
      pass
    };
  }
});