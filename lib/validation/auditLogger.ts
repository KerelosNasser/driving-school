/**
 * Audit logging for administrative actions
 */

import { AuditLogEntry } from './types';

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  /**
   * Log an administrative action
   */
  async logAction(
    userId: string,
    action: string,
    resource: string,
    options: {
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      resourceId: options.resourceId,
      timestamp: new Date().toISOString(),
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.metadata,
      success: options.success ?? true,
      errorMessage: options.errorMessage
    };

    // Add to in-memory store
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In a real implementation, this would also persist to database
    await this.persistToDatabase(entry);

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${entry.timestamp} - ${userId} ${action} ${resource}${entry.resourceId ? ` (${entry.resourceId})` : ''} - ${entry.success ? 'SUCCESS' : 'FAILED'}`);
    }
  }

  /**
   * Log content change
   */
  async logContentChange(
    userId: string,
    contentKey: string,
    oldValue: any,
    newValue: any,
    options: {
      page?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    await this.logAction(userId, 'content_update', 'content', {
      resourceId: contentKey,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: {
        page: options.page,
        oldValue: this.sanitizeLogValue(oldValue),
        newValue: this.sanitizeLogValue(newValue),
        changeSize: this.calculateChangeSize(oldValue, newValue)
      }
    });
  }

  /**
   * Log component operation
   */
  async logComponentOperation(
    userId: string,
    operation: 'create' | 'update' | 'delete' | 'move',
    componentId: string,
    options: {
      componentType?: string;
      oldPosition?: any;
      newPosition?: any;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    await this.logAction(userId, `component_${operation}`, 'component', {
      resourceId: componentId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success,
      errorMessage: options.errorMessage,
      metadata: {
        componentType: options.componentType,
        oldPosition: options.oldPosition,
        newPosition: options.newPosition
      }
    });
  }

  /**
   * Log page operation
   */
  async logPageOperation(
    userId: string,
    operation: 'create' | 'update' | 'delete' | 'publish',
    pageId: string,
    options: {
      pageTitle?: string;
      pageSlug?: string;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    await this.logAction(userId, `page_${operation}`, 'page', {
      resourceId: pageId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success,
      errorMessage: options.errorMessage,
      metadata: {
        pageTitle: options.pageTitle,
        pageSlug: options.pageSlug
      }
    });
  }

  /**
   * Log navigation operation
   */
  async logNavigationOperation(
    userId: string,
    operation: 'create' | 'update' | 'delete' | 'reorder',
    itemId: string,
    options: {
      displayName?: string;
      url?: string;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    await this.logAction(userId, `navigation_${operation}`, 'navigation', {
      resourceId: itemId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success,
      errorMessage: options.errorMessage,
      metadata: {
        displayName: options.displayName,
        url: options.url
      }
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    userId: string,
    targetUserId: string,
    operation: 'grant' | 'revoke' | 'delegate',
    permission: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    await this.logAction(userId, `permission_${operation}`, 'permission', {
      resourceId: permission,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success,
      errorMessage: options.errorMessage,
      metadata: {
        targetUserId,
        permission
      }
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    userId: string,
    event: 'login' | 'logout' | 'failed_login' | 'role_change',
    options: {
      ipAddress?: string;
      userAgent?: string;
      oldRole?: string;
      newRole?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    await this.logAction(userId, `auth_${event}`, 'authentication', {
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success,
      errorMessage: options.errorMessage,
      metadata: {
        oldRole: options.oldRole,
        newRole: options.newRole
      }
    });
  }

  /**
   * Get audit logs with filtering
   */
  getLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    success?: boolean;
    limit?: number;
  } = {}): AuditLogEntry[] {
    let filtered = [...this.logs];

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action.includes(filters.action));
    }

    if (filters.resource) {
      filtered = filtered.filter(log => log.resource === filters.resource);
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters.success !== undefined) {
      filtered = filtered.filter(log => log.success === filters.success);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Get audit statistics
   */
  getStatistics(timeframe: 'hour' | 'day' | 'week' = 'day'): {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    topUsers: Array<{ userId: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  } {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'hour':
        cutoff.setHours(now.getHours() - 1);
        break;
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
    }

    const recentLogs = this.logs.filter(log => new Date(log.timestamp) >= cutoff);

    const userCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();
    let successfulActions = 0;
    let failedActions = 0;

    for (const log of recentLogs) {
      // Count by user
      userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
      
      // Count by action
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
      
      // Count success/failure
      if (log.success) {
        successfulActions++;
      } else {
        failedActions++;
      }
    }

    return {
      totalActions: recentLogs.length,
      successfulActions,
      failedActions,
      topUsers: Array.from(userCounts.entries())
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topActions: Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }

  /**
   * Sanitize values for logging (remove sensitive data)
   */
  private sanitizeLogValue(value: any): any {
    if (typeof value === 'string') {
      // Truncate long strings
      return value.length > 1000 ? value.substring(0, 1000) + '...' : value;
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        // Skip sensitive fields
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret')) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeLogValue(val);
        }
      }
      return sanitized;
    }
    
    return value;
  }

  /**
   * Calculate the size of a change
   */
  private calculateChangeSize(oldValue: any, newValue: any): number {
    const oldStr = JSON.stringify(oldValue || '');
    const newStr = JSON.stringify(newValue || '');
    return Math.abs(newStr.length - oldStr.length);
  }

  /**
   * Persist audit log to database (placeholder)
   */
  private async persistToDatabase(entry: AuditLogEntry): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just store in memory
    
    // Example database save:
    // await supabase.from('audit_logs').insert(entry);
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();