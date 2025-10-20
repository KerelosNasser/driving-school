import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    auth: ServiceHealth
  }
  uptime: number
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  error?: string
}

const startTime = Date.now()

export class HealthChecker {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  private static redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

  static async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now()
    
    try {
      const { error } = await this.supabase
        .from('auth.users')
        .select('count')
        .limit(1)
        .single()

      const responseTime = Date.now() - start

      if (error && error.code !== 'PGRST116') {
        return {
          status: 'down',
          responseTime,
          error: error.message
        }
      }

      return {
        status: responseTime > 1000 ? 'degraded' : 'up',
        responseTime
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async checkRedis(): Promise<ServiceHealth> {
    if (!this.redis) {
      return {
        status: 'down',
        error: 'Redis not configured'
      }
    }

    const start = Date.now()
    
    try {
      await this.redis.ping()
      const responseTime = Date.now() - start

      return {
        status: responseTime > 500 ? 'degraded' : 'up',
        responseTime
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async checkAuth(): Promise<ServiceHealth> {
    const start = Date.now()
    
    try {
      // Simple check to see if Clerk is responding
      const clerkUrl = `https://api.clerk.com/v1/users?limit=1`
      const response = await fetch(clerkUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      })

      const responseTime = Date.now() - start

      if (!response.ok) {
        return {
          status: 'down',
          responseTime,
          error: `HTTP ${response.status}`
        }
      }

      return {
        status: responseTime > 1000 ? 'degraded' : 'up',
        responseTime
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis, auth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAuth()
    ])

    const services = { database, redis, auth }
    
    // Determine overall status
    const serviceStatuses = Object.values(services).map(s => s.status)
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'

    if (serviceStatuses.every(s => s === 'up')) {
      overallStatus = 'healthy'
    } else if (serviceStatuses.some(s => s === 'down')) {
      overallStatus = 'unhealthy'
    } else {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: Date.now() - startTime
    }
  }

  static async isHealthy(): Promise<boolean> {
    const health = await this.getHealthStatus()
    return health.status === 'healthy' || health.status === 'degraded'
  }
}

export default HealthChecker