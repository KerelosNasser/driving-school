/**
 * Calendar Error Handling System
 * Provides comprehensive error handling, recovery strategies, and logging
 * for all calendar-related operations
 */

export enum CalendarErrorType {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // API errors
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  API_TIMEOUT = 'API_TIMEOUT',
  API_ERROR = 'API_ERROR',

  // Validation errors
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_DURATION = 'INVALID_DURATION',
  INVALID_EVENT_DATA = 'INVALID_EVENT_DATA',
  SCHEDULING_CONFLICT = 'SCHEDULING_CONFLICT',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Business logic errors
  BOOKING_UNAVAILABLE = 'BOOKING_UNAVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  OUTSIDE_OPERATING_HOURS = 'OUTSIDE_OPERATING_HOURS',
  INSUFFICIENT_BUFFER_TIME = 'INSUFFICIENT_BUFFER_TIME',
  ADVANCE_BOOKING_VIOLATION = 'ADVANCE_BOOKING_VIOLATION',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum CalendarErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface CalendarErrorContext {
  userId?: string;
  eventId?: string;
  operation?: string;
  timestamp?: Date;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  additionalData?: Record<string, any>;
}

export interface CalendarErrorRecovery {
  canRetry: boolean;
  retryAfter?: number; // milliseconds
  maxRetries?: number;
  backoffStrategy?: 'linear' | 'exponential' | 'fixed';
  alternativeAction?: string;
  userMessage?: string;
}

export class CalendarError extends Error {
  public readonly type: CalendarErrorType;
  public readonly severity: CalendarErrorSeverity;
  public readonly context: CalendarErrorContext;
  public readonly recovery: CalendarErrorRecovery;
  public readonly originalError?: Error;
  public readonly errorId: string;

  constructor(
    type: CalendarErrorType,
    message: string,
    options: {
      severity?: CalendarErrorSeverity;
      context?: CalendarErrorContext;
      recovery?: Partial<CalendarErrorRecovery>;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    
    this.name = 'CalendarError';
    this.type = type;
    this.severity = options.severity || this.getDefaultSeverity(type);
    this.context = {
      timestamp: new Date(),
      ...options.context
    };
    this.recovery = {
      ...this.getDefaultRecovery(type),
      ...options.recovery
    };
    this.originalError = options.originalError;
    this.errorId = this.generateErrorId();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CalendarError);
    }
  }

  private generateErrorId(): string {
    return `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultSeverity(type: CalendarErrorType): CalendarErrorSeverity {
    const severityMap: Record<CalendarErrorType, CalendarErrorSeverity> = {
      [CalendarErrorType.UNAUTHORIZED]: CalendarErrorSeverity.HIGH,
      [CalendarErrorType.TOKEN_EXPIRED]: CalendarErrorSeverity.MEDIUM,
      [CalendarErrorType.TOKEN_INVALID]: CalendarErrorSeverity.HIGH,
      [CalendarErrorType.INSUFFICIENT_PERMISSIONS]: CalendarErrorSeverity.HIGH,
      
      [CalendarErrorType.API_RATE_LIMIT]: CalendarErrorSeverity.MEDIUM,
      [CalendarErrorType.API_QUOTA_EXCEEDED]: CalendarErrorSeverity.HIGH,
      [CalendarErrorType.API_UNAVAILABLE]: CalendarErrorSeverity.HIGH,
      [CalendarErrorType.API_TIMEOUT]: CalendarErrorSeverity.MEDIUM,
      [CalendarErrorType.API_ERROR]: CalendarErrorSeverity.MEDIUM,
      
      [CalendarErrorType.INVALID_DATE_RANGE]: CalendarErrorSeverity.LOW,
      [CalendarErrorType.INVALID_DURATION]: CalendarErrorSeverity.LOW,
      [CalendarErrorType.INVALID_EVENT_DATA]: CalendarErrorSeverity.LOW,
      [CalendarErrorType.SCHEDULING_CONFLICT]: CalendarErrorSeverity.MEDIUM,
      [CalendarErrorType.CONSTRAINT_VIOLATION]: CalendarErrorSeverity.MEDIUM,
      
      [CalendarErrorType.BOOKING_UNAVAILABLE]: CalendarErrorSeverity.LOW,
      [CalendarErrorType.QUOTA_EXCEEDED]: CalendarErrorSeverity.MEDIUM,
      [CalendarErrorType.OUTSIDE_OPERATING_HOURS]: CalendarErrorSeverity.LOW,
      [CalendarErrorType.INSUFFICIENT_BUFFER_TIME]: CalendarErrorSeverity.LOW,
      [CalendarErrorType.ADVANCE_BOOKING_VIOLATION]: CalendarErrorSeverity.LOW,
      
      [CalendarErrorType.DATABASE_ERROR]: CalendarErrorSeverity.CRITICAL,
      [CalendarErrorType.NETWORK_ERROR]: CalendarErrorSeverity.MEDIUM,
      [CalendarErrorType.CACHE_ERROR]: CalendarErrorSeverity.LOW,
      [CalendarErrorType.CONFIGURATION_ERROR]: CalendarErrorSeverity.CRITICAL,
      [CalendarErrorType.UNKNOWN_ERROR]: CalendarErrorSeverity.HIGH
    };

    return severityMap[type] || CalendarErrorSeverity.MEDIUM;
  }

  private getDefaultRecovery(type: CalendarErrorType): CalendarErrorRecovery {
    const recoveryMap: Record<CalendarErrorType, CalendarErrorRecovery> = {
      [CalendarErrorType.UNAUTHORIZED]: {
        canRetry: false,
        userMessage: 'Please reconnect your calendar to continue booking lessons.'
      },
      [CalendarErrorType.TOKEN_EXPIRED]: {
        canRetry: true,
        maxRetries: 1,
        alternativeAction: 'refresh_token',
        userMessage: 'Your calendar connection has expired. Please reconnect.'
      },
      [CalendarErrorType.TOKEN_INVALID]: {
        canRetry: false,
        userMessage: 'Calendar connection is invalid. Please reconnect your calendar.'
      },
      [CalendarErrorType.INSUFFICIENT_PERMISSIONS]: {
        canRetry: false,
        userMessage: 'Insufficient calendar permissions. Please reconnect with full access.'
      },
      
      [CalendarErrorType.API_RATE_LIMIT]: {
        canRetry: true,
        retryAfter: 60000, // 1 minute
        maxRetries: 3,
        backoffStrategy: 'exponential',
        userMessage: 'Calendar service is busy. Please try again in a moment.'
      },
      [CalendarErrorType.API_QUOTA_EXCEEDED]: {
        canRetry: true,
        retryAfter: 3600000, // 1 hour
        maxRetries: 1,
        userMessage: 'Calendar service quota exceeded. Please try again later.'
      },
      [CalendarErrorType.API_UNAVAILABLE]: {
        canRetry: true,
        retryAfter: 30000, // 30 seconds
        maxRetries: 3,
        backoffStrategy: 'exponential',
        userMessage: 'Calendar service is temporarily unavailable. Please try again.'
      },
      [CalendarErrorType.API_TIMEOUT]: {
        canRetry: true,
        retryAfter: 5000, // 5 seconds
        maxRetries: 2,
        backoffStrategy: 'linear',
        userMessage: 'Calendar request timed out. Please try again.'
      },
      [CalendarErrorType.API_ERROR]: {
        canRetry: true,
        retryAfter: 1000, // 1 second
        maxRetries: 2,
        userMessage: 'Calendar service error. Please try again.'
      },
      
      [CalendarErrorType.INVALID_DATE_RANGE]: {
        canRetry: false,
        userMessage: 'Please select a valid date range.'
      },
      [CalendarErrorType.INVALID_DURATION]: {
        canRetry: false,
        userMessage: 'Please select a valid lesson duration.'
      },
      [CalendarErrorType.INVALID_EVENT_DATA]: {
        canRetry: false,
        userMessage: 'Invalid booking information. Please check your details.'
      },
      [CalendarErrorType.SCHEDULING_CONFLICT]: {
        canRetry: false,
        alternativeAction: 'suggest_alternatives',
        userMessage: 'This time slot conflicts with an existing booking. Please choose another time.'
      },
      [CalendarErrorType.CONSTRAINT_VIOLATION]: {
        canRetry: false,
        alternativeAction: 'show_constraints',
        userMessage: 'This booking violates scheduling constraints. Please see available options.'
      },
      
      [CalendarErrorType.BOOKING_UNAVAILABLE]: {
        canRetry: false,
        alternativeAction: 'suggest_alternatives',
        userMessage: 'This time slot is no longer available. Please choose another time.'
      },
      [CalendarErrorType.QUOTA_EXCEEDED]: {
        canRetry: false,
        alternativeAction: 'show_quota_info',
        userMessage: 'You have reached your booking limit. Please contact support for more lessons.'
      },
      [CalendarErrorType.OUTSIDE_OPERATING_HOURS]: {
        canRetry: false,
        alternativeAction: 'show_operating_hours',
        userMessage: 'Bookings are only available during operating hours.'
      },
      [CalendarErrorType.INSUFFICIENT_BUFFER_TIME]: {
        canRetry: false,
        alternativeAction: 'suggest_alternatives',
        userMessage: 'Insufficient time between lessons. Please choose a different time.'
      },
      [CalendarErrorType.ADVANCE_BOOKING_VIOLATION]: {
        canRetry: false,
        alternativeAction: 'show_booking_policy',
        userMessage: 'Bookings must be made within the allowed advance booking period.'
      },
      
      [CalendarErrorType.DATABASE_ERROR]: {
        canRetry: true,
        retryAfter: 1000,
        maxRetries: 2,
        userMessage: 'A system error occurred. Please try again or contact support.'
      },
      [CalendarErrorType.NETWORK_ERROR]: {
        canRetry: true,
        retryAfter: 2000,
        maxRetries: 3,
        backoffStrategy: 'exponential',
        userMessage: 'Network error. Please check your connection and try again.'
      },
      [CalendarErrorType.CACHE_ERROR]: {
        canRetry: true,
        retryAfter: 500,
        maxRetries: 1,
        userMessage: 'Please refresh the page and try again.'
      },
      [CalendarErrorType.CONFIGURATION_ERROR]: {
        canRetry: false,
        userMessage: 'System configuration error. Please contact support.'
      },
      [CalendarErrorType.UNKNOWN_ERROR]: {
        canRetry: true,
        retryAfter: 1000,
        maxRetries: 1,
        userMessage: 'An unexpected error occurred. Please try again or contact support.'
      }
    };

    return recoveryMap[type] || { canRetry: false };
  }

  toJSON() {
    return {
      errorId: this.errorId,
      type: this.type,
      message: this.message,
      severity: this.severity,
      context: this.context,
      recovery: this.recovery,
      stack: this.stack,
      originalError: this.originalError?.message
    };
  }
}

export interface ErrorLogEntry {
  errorId: string;
  type: CalendarErrorType;
  severity: CalendarErrorSeverity;
  message: string;
  context: CalendarErrorContext;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

export class CalendarErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 1000;

  log(error: CalendarError): void {
    const entry: ErrorLogEntry = {
      errorId: error.errorId,
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: new Date(),
      resolved: false
    };

    this.logs.unshift(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console based on severity
    this.consoleLog(error);

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(entry);
    }
  }

  markResolved(errorId: string, resolution: string): void {
    const entry = this.logs.find(log => log.errorId === errorId);
    if (entry) {
      entry.resolved = true;
      entry.resolvedAt = new Date();
      entry.resolution = resolution;
    }
  }

  getLogs(filters?: {
    type?: CalendarErrorType;
    severity?: CalendarErrorSeverity;
    userId?: string;
    resolved?: boolean;
    since?: Date;
  }): ErrorLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.type) {
        filteredLogs = filteredLogs.filter(log => log.type === filters.type);
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.context.userId === filters.userId);
      }
      if (filters.resolved !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.resolved === filters.resolved);
      }
      if (filters.since) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since!);
      }
    }

    return filteredLogs;
  }

  getErrorStats(): {
    total: number;
    byType: Record<CalendarErrorType, number>;
    bySeverity: Record<CalendarErrorSeverity, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: this.logs.length,
      byType: {} as Record<CalendarErrorType, number>,
      bySeverity: {} as Record<CalendarErrorSeverity, number>,
      resolved: 0,
      unresolved: 0
    };

    this.logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      if (log.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }

  clearLogs(): void {
    this.logs = [];
  }

  private consoleLog(error: CalendarError): void {
    const logData = {
      errorId: error.errorId,
      type: error.type,
      message: error.message,
      context: error.context
    };

    switch (error.severity) {
      case CalendarErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL Calendar Error:', logData);
        break;
      case CalendarErrorSeverity.HIGH:
        console.error('❌ High Priority Calendar Error:', logData);
        break;
      case CalendarErrorSeverity.MEDIUM:
        console.warn('⚠️ Medium Priority Calendar Error:', logData);
        break;
      case CalendarErrorSeverity.LOW:
        console.info('ℹ️ Low Priority Calendar Error:', logData);
        break;
    }
  }

  private sendToExternalLogger(entry: ErrorLogEntry): void {
    // Implement external logging service integration
    // e.g., Sentry, LogRocket, DataDog, etc.
    console.log('Sending to external logger:', entry.errorId);
  }
}

export class CalendarErrorHandler {
  private logger = new CalendarErrorLogger();
  private retryAttempts = new Map<string, number>();

  async handle<T>(
    operation: () => Promise<T>,
    context: CalendarErrorContext = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const calendarError = this.normalizeError(error, context);
      this.logger.log(calendarError);
      
      if (calendarError.recovery.canRetry) {
        return this.handleRetry(operation, calendarError, context);
      }
      
      throw calendarError;
    }
  }

  private async handleRetry<T>(
    operation: () => Promise<T>,
    error: CalendarError,
    context: CalendarErrorContext
  ): Promise<T> {
    const retryKey = `${context.operation || 'unknown'}_${context.userId || 'anonymous'}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    const maxRetries = error.recovery.maxRetries || 1;

    if (currentAttempts >= maxRetries) {
      this.retryAttempts.delete(retryKey);
      throw error;
    }

    this.retryAttempts.set(retryKey, currentAttempts + 1);

    // Calculate delay based on backoff strategy
    const delay = this.calculateRetryDelay(
      error.recovery.retryAfter || 1000,
      currentAttempts,
      error.recovery.backoffStrategy || 'linear'
    );

    await this.sleep(delay);

    try {
      const result = await operation();
      this.retryAttempts.delete(retryKey);
      this.logger.markResolved(error.errorId, `Resolved after ${currentAttempts + 1} attempts`);
      return result;
    } catch (retryError) {
      if (currentAttempts + 1 >= maxRetries) {
        this.retryAttempts.delete(retryKey);
        throw this.normalizeError(retryError, context);
      }
      
      return this.handleRetry(operation, error, context);
    }
  }

  private calculateRetryDelay(
    baseDelay: number,
    attempt: number,
    strategy: 'linear' | 'exponential' | 'fixed'
  ): number {
    switch (strategy) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt);
      case 'linear':
        return baseDelay * (attempt + 1);
      case 'fixed':
      default:
        return baseDelay;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private normalizeError(error: any, context: CalendarErrorContext): CalendarError {
    if (error instanceof CalendarError) {
      return error;
    }

    // Map common error patterns to CalendarError types
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return new CalendarError(
        CalendarErrorType.UNAUTHORIZED,
        'Authentication required',
        { context, originalError: error }
      );
    }

    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return new CalendarError(
        CalendarErrorType.INSUFFICIENT_PERMISSIONS,
        'Insufficient permissions',
        { context, originalError: error }
      );
    }

    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return new CalendarError(
        CalendarErrorType.API_RATE_LIMIT,
        'API rate limit exceeded',
        { context, originalError: error }
      );
    }

    if (error.message?.includes('timeout')) {
      return new CalendarError(
        CalendarErrorType.API_TIMEOUT,
        'Request timeout',
        { context, originalError: error }
      );
    }

    if (error.message?.includes('network') || error.code === 'ENOTFOUND') {
      return new CalendarError(
        CalendarErrorType.NETWORK_ERROR,
        'Network error',
        { context, originalError: error }
      );
    }

    // Default to unknown error
    return new CalendarError(
      CalendarErrorType.UNKNOWN_ERROR,
      error.message || 'An unknown error occurred',
      { context, originalError: error }
    );
  }

  getLogger(): CalendarErrorLogger {
    return this.logger;
  }
}

// Export singleton instances
export const calendarErrorHandler = new CalendarErrorHandler();
export const calendarErrorLogger = calendarErrorHandler.getLogger();

// Utility functions for creating specific errors
export const createCalendarError = {
  unauthorized: (message?: string, context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.UNAUTHORIZED, message || 'Authentication required', { context }),

  tokenExpired: (context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.TOKEN_EXPIRED, 'Access token has expired', { context }),

  rateLimited: (retryAfter?: number, context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.API_RATE_LIMIT, 'API rate limit exceeded', {
      context,
      recovery: { retryAfter }
    }),

  schedulingConflict: (message?: string, context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.SCHEDULING_CONFLICT, message || 'Scheduling conflict detected', { context }),

  constraintViolation: (message?: string, context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.CONSTRAINT_VIOLATION, message || 'Scheduling constraint violated', { context }),

  quotaExceeded: (context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.QUOTA_EXCEEDED, 'Booking quota exceeded', { context }),

  invalidDateRange: (context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.INVALID_DATE_RANGE, 'Invalid date range provided', { context }),

  apiUnavailable: (context?: CalendarErrorContext) =>
    new CalendarError(CalendarErrorType.API_UNAVAILABLE, 'Calendar service is unavailable', { context })
};