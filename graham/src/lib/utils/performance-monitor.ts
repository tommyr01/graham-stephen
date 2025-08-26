/**
 * Performance Monitoring Utilities
 * Track API response times and identify bottlenecks
 */

interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private aggregateStats: Map<string, {
    totalCalls: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    errorCount: number;
    successRate: number;
  }> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(operationId: string, operationName: string, metadata?: Record<string, any>): void {
    this.metrics.set(operationId, {
      operation: operationName,
      startTime: Date.now(),
      success: false,
      metadata
    });
  }

  /**
   * End timing an operation
   */
  endTimer(operationId: string, success: boolean = true, error?: string): number | null {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      console.warn(`No timer found for operation: ${operationId}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    metric.success = success;
    metric.error = error;

    // Update aggregate statistics
    this.updateAggregateStats(metric.operation, duration, success);

    // Log slow operations (over 10 seconds)
    if (duration > 10000) {
      console.warn(`🐌 SLOW OPERATION: ${metric.operation} took ${duration}ms`, {
        operationId,
        metadata: metric.metadata,
        error
      });
    } else if (duration > 5000) {
      console.log(`⚠️ MODERATE DELAY: ${metric.operation} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * Update aggregate statistics for operation types
   */
  private updateAggregateStats(operation: string, duration: number, success: boolean): void {
    const existing = this.aggregateStats.get(operation) || {
      totalCalls: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errorCount: 0,
      successRate: 0
    };

    existing.totalCalls++;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.totalCalls;
    existing.minDuration = Math.min(existing.minDuration, duration);
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    
    if (!success) {
      existing.errorCount++;
    }
    
    existing.successRate = ((existing.totalCalls - existing.errorCount) / existing.totalCalls) * 100;

    this.aggregateStats.set(operation, existing);
  }

  /**
   * Get performance statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.aggregateStats.forEach((value, key) => {
      stats[key] = {
        ...value,
        minDuration: value.minDuration === Infinity ? 0 : value.minDuration
      };
    });

    return stats;
  }

  /**
   * Get recent slow operations
   */
  getSlowOperations(thresholdMs: number = 5000): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .filter(metric => metric.duration && metric.duration > thresholdMs)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.aggregateStats.clear();
  }

  /**
   * Clean up old metrics (keep last 1000 operations)
   */
  cleanup(): void {
    if (this.metrics.size <= 1000) return;

    const sortedEntries = Array.from(this.metrics.entries())
      .sort((a, b) => (b[1].startTime) - (a[1].startTime));
    
    // Keep only the most recent 1000 operations
    this.metrics.clear();
    sortedEntries.slice(0, 1000).forEach(([key, value]) => {
      this.metrics.set(key, value);
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function to automatically monitor async function performance
 */
export function monitorPerformance<T extends (...args: any[]) => Promise<any>>(
  operationName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    performanceMonitor.startTimer(operationId, operationName, {
      argsCount: args.length,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await fn(...args);
      performanceMonitor.endTimer(operationId, true);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }) as T;
}

/**
 * Helper to measure a block of code
 */
export async function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<{ result: T; duration: number }> {
  const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  performanceMonitor.startTimer(operationId, operationName, metadata);

  try {
    const result = await operation();
    const duration = performanceMonitor.endTimer(operationId, true) || 0;
    return { result, duration };
  } catch (error) {
    const duration = performanceMonitor.endTimer(operationId, false, error instanceof Error ? error.message : 'Unknown error') || 0;
    throw error;
  }
}

/**
 * Log performance summary for debugging
 */
export function logPerformanceSummary(): void {
  const stats = performanceMonitor.getStats();
  const slowOps = performanceMonitor.getSlowOperations(3000);

  console.group('🚀 Performance Summary');
  
  console.table(stats);
  
  if (slowOps.length > 0) {
    console.warn('⚠️ Slow Operations (>3s):', slowOps.slice(0, 10));
  }
  
  console.groupEnd();
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  performanceMonitor.cleanup();
}, 5 * 60 * 1000);