import { NextResponse } from 'next/server'
import HealthChecker from '@/lib/health-check'

export async function GET() {
  try {
    const health = await HealthChecker.getHealthStatus()
    
    // Return appropriate HTTP status based on health
    const statusCode = health.status === 'healthy' ? 200 
                     : health.status === 'degraded' ? 200 
                     : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        services: {
          database: { status: 'down' },
          redis: { status: 'down' },
          auth: { status: 'down' }
        },
        uptime: 0
      },
      { status: 503 }
    )
  }
}

// Simple liveness probe
export async function HEAD() {
  return new Response(null, { status: 200 })
}