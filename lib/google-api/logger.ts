/**
 * Comprehensive logging and monitoring for Google API interactions
 * Provides structured logging, performance metrics, and audit trails
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface GoogleAPILogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  method?: string;
  endpoint?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  requestId?: string;
  error?: any;
  metadata?: Record<string, any>;
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorsByType: Record<string, number>;
  requestsByEndpoint: Record<string, number>;
  lastUpdated: string;
}

/**
 * Google API Logger with structured logging and metrics collection
 */
import { logger } from '@/lib/logger';

export class GoogleAPILogger {
  private metrics: APIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    errorsByType: {},
    requestsByEndpoint: {},
    lastUpdated: new Date().toISOString()
  };

  private responseTimes: number[] = [];
  private readonly maxResponseTimeHistory = 1000; // Keep last 1000 response times

  /**
   * Log Google API operation start
   */
  logOperationStart(
    operation: string,
    method?: string,
    endpoint?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): string {
    const requestId = this.generateRequestId();
    
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      operation,
      method,
      endpoint,
      userId,
      requestId,
      metadata: {
        ...metadata,
        phase: 'start'
      }
    });

    return requestId;
  }

  /**
   * Log successful Google API operation
   */
  logOperationSuccess(
    operation: string,
    requestId: string,
    duration: number,
    statusCode?: number,
    metadata?: Record<string, any>
  ): void {
    this.updateMetrics(true, duration, operation);
    
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      operation,
      duration,
      statusCode,
      requestId,
      metadata: {
        ...metadata,
        phase: 'success'
      }
    });
  }

  /**
   * Log failed Google API operation
   */
  logOperationError(
    operation: string,
    requestId: string,
    error: any,
    duration?: number,
    statusCode?: number,
    metadata?: Record<string, any>
  ): void {
    this.updateMetrics(false, duration, operation, error);
    
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      operation,
      duration,
      statusCode,
      requestId,
      error: this.sanitizeError(error),
      metadata: {
        ...metadata,
        phase: 'error'
      }
    });
  }

  /**
   * Log authentication events
   */
  logAuthEvent(
    event: 'token_refresh' | 'token_expired' | 'auth_success' | 'auth_failure',
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: event.includes('failure') || event.includes('expired') ? LogLevel.WARN : LogLevel.INFO,
      operation: 'authentication',
      userId,
      metadata: {
        ...metadata,
        event
      }
    });
  }

  /**
   * Log rate limiting events
   */
  logRateLimit(
    operation: string,
    rateLimitType: 'quota_exceeded' | 'rate_limit_hit' | 'circuit_breaker_open',
    retryAfter?: number,
    metadata?: Record<string, any>
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      operation,
      metadata: {
        ...metadata,
        rateLimitType,
        retryAfter
      }
    });
  }

  /**
   * Log performance warnings
   */
  logPerformanceWarning(
    operation: string,
    duration: number,
    threshold: number,
    metadata?: Record<string, any>
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      operation,
      duration,
      metadata: {
        ...metadata,
        performanceIssue: true,
        threshold,
        message: `Operation took ${duration}ms, exceeding threshold of ${threshold}ms`
      }
    });
  }

  /**
   * Get current API metrics
   */
  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorsByType: {},
      requestsByEndpoint: {},
      lastUpdated: new Date().toISOString()
    };
    this.responseTimes = [];
  }

  /**
   * Export metrics for monitoring systems
   */
  exportMetricsForMonitoring(): Record<string, number> {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;

    return {
      'google_api_total_requests': this.metrics.totalRequests,
      'google_api_successful_requests': this.metrics.successfulRequests,
      'google_api_failed_requests': this.metrics.failedRequests,
      'google_api_success_rate_percent': successRate,
      'google_api_average_response_time_ms': this.metrics.averageResponseTime,
      'google_api_p95_response_time_ms': this.calculatePercentile(95),
      'google_api_p99_response_time_ms': this.calculatePercentile(99)
    };
  }

  /**
   * Create a performance timer for operations
   */
  createTimer(): { stop: () => number } {
    const startTime = Date.now();
    
    return {
      stop: () => Date.now() - startTime
    };
  }

  private log(entry: GoogleAPILogEntry): void {
    // In production, you might want to send this to a logging service
    // For now, we'll use console with structured output
    const logMessage = {
      ...entry,
      service: 'google-api',
      environment: process.env.NODE_ENV || 'development'
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        logger.debug(JSON.stringify(logMessage));
        break;
      case LogLevel.INFO:
        logger.info(JSON.stringify(logMessage));
        break;
      case LogLevel.WARN:
        logger.warn(JSON.stringify(logMessage));
        break;
      case LogLevel.ERROR:
        logger.error(JSON.stringify(logMessage));
        break;
    }
  }

  private updateMetrics(
    success: boolean, 
    duration?: number, 
    operation?: string, 
    error?: any
  ): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      
      if (error?.type) {
        this.metrics.errorsByType[error.type] = (this.metrics.errorsByType[error.type] || 0) + 1;
      }
    }

    if (operation) {
      this.metrics.requestsByEndpoint[operation] = (this.metrics.requestsByEndpoint[operation] || 0) + 1;
    }

    if (duration !== undefined) {
      this.responseTimes.push(duration);
      
      // Keep only recent response times
      if (this.responseTimes.length > this.maxResponseTimeHistory) {
        this.responseTimes = this.responseTimes.slice(-this.maxResponseTimeHistory);
      }
      
      // Update average response time
      this.metrics.averageResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    }

    this.metrics.lastUpdated = new Date().toISOString();
  }

  private calculatePercentile(percentile: number): number {
    if (this.responseTimes.length === 0) return 0;
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeError(error: any): any {
    if (!error) return null;
    
    // Remove sensitive information from error logs
    const sanitized = {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    // Remove any potential sensitive data
    if (error.response?.data) {
      sanitized.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        // Don't log response data as it might contain sensitive information
      };
    }

    return sanitized;
  }
}

/**
 * Singleton logger instance
 */
export const googleAPILogger = new GoogleAPILogger();

/**
 * Decorator for automatic logging of Google API operations
 */
export function logGoogleAPIOperation(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = googleAPILogger.createTimer();
      const requestId = googleAPILogger.logOperationStart(
        operationName,
        propertyName,
        undefined,
        undefined,
        { args: args.length }
      );

      try {
        const result = await method.apply(this, args);
        const duration = timer.stop();
        
        googleAPILogger.logOperationSuccess(
          operationName,
          requestId,
          duration,
          200,
          { resultType: typeof result }
        );

        // Log performance warning if operation is slow
        if (duration > 5000) { // 5 seconds threshold
          googleAPILogger.logPerformanceWarning(operationName, duration, 5000);
        }

        return result;
      } catch (error) {
        const duration = timer.stop();
        googleAPILogger.logOperationError(
          operationName,
          requestId,
          error,
          duration
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility function to create operation-specific loggers
 */
export function createOperationLogger(operationName: string) {
  return {
    start: (metadata?: Record<string, any>) => 
      googleAPILogger.logOperationStart(operationName, undefined, undefined, undefined, metadata),
    
    success: (requestId: string, duration: number, metadata?: Record<string, any>) =>
      googleAPILogger.logOperationSuccess(operationName, requestId, duration, 200, metadata),
    
    error: (requestId: string, error: any, duration?: number, metadata?: Record<string, any>) =>
      googleAPILogger.logOperationError(operationName, requestId, error, duration, undefined, metadata),
    
    timer: () => googleAPILogger.createTimer()
  };
}