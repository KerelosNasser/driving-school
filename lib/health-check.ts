import { supabase } from '@/lib/supabase';
import { checkPubSubHealth } from '@/lib/graphql/pubsub';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  services: HealthCheckResult[];
  uptime: number;
}

class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Check database connectivity and performance
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simple query to test database connectivity
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime,
          error: error.message
        };
      }

      // Check response time thresholds
      const status = responseTime > 1000 ? 'degraded' : 'healthy';

      return {
        service: 'database',
        status,
        responseTime,
        details: {
          connectionPool: 'active',
          queryCount: data?.length || 0
        }
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Check PubSub system health
   */
  async checkPubSub(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await checkPubSubHealth();
      const responseTime = Date.now() - startTime;

      return {
        service: 'pubsub',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          eventSystem: isHealthy ? 'operational' : 'degraded'
        }
      };
    } catch (error) {
      return {
        service: 'pubsub',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'PubSub system error'
      };
    }
  }

  /**
   * Check external API dependencies
   */
  async checkExternalAPIs(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check if we can make external requests (basic connectivity test)
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        timeout: 5000
      });

      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'degraded';

      return {
        service: 'external_apis',
        status,
        responseTime,
        details: {
          httpStatus: response.status,
          connectivity: response.ok ? 'available' : 'limited'
        }
      };
    } catch (error) {
      return {
        service: 'external_apis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'External API connectivity error'
      };
    }
  }

  /**
   * Check memory usage and system resources
   */
  checkSystemResources(): HealthCheckResult {
    const startTime = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryUtilization = (heapUsedMB / heapTotalMB) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (memoryUtilization > 90) {
        status = 'unhealthy';
      } else if (memoryUtilization > 75) {
        status = 'degraded';
      }

      return {
        service: 'system_resources',
        status,
        responseTime: Date.now() - startTime,
        details: {
          memoryUsage: {
            heapUsed: `${heapUsedMB}MB`,
            heapTotal: `${heapTotalMB}MB`,
            utilization: `${memoryUtilization.toFixed(1)}%`
          },
          uptime: process.uptime()
        }
      };
    } catch (error) {
      return {
        service: 'system_resources',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'System resource check error'
      };
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealthStatus> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkPubSub(),
      this.checkExternalAPIs(),
      this.checkSystemResources()
    ]);

    // Determine overall health status
    const unhealthyServices = checks.filter(check => check.status === 'unhealthy');
    const degradedServices = checks.filter(check => check.status === 'degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    }

    return {
      overall: overallStatus,
      timestamp: Date.now(),
      services: checks,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get simple health status for quick checks
   */
  async getSimpleHealthStatus(): Promise<{ status: string; timestamp: number }> {
    try {
      const health = await this.performHealthCheck();
      return {
        status: health.overall,
        timestamp: health.timestamp
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now()
      };
    }
  }
}

// Create singleton instance
const healthChecker = new HealthChecker();

export default healthChecker;

// Export convenience functions
export const performHealthCheck = () => healthChecker.performHealthCheck();
export const getSimpleHealthStatus = () => healthChecker.getSimpleHealthStatus();