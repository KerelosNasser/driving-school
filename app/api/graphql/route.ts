import { NextRequest, NextResponse } from 'next/server';
import { handler, healthCheck, getMetrics } from '@/lib/graphql/server';
import { checkPubSubHealth } from '@/lib/graphql/pubsub';

// CORS headers for GraphQL endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Apollo-Require-Preflight',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Handle GraphQL requests
export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request
    const url = new URL(request.url);
    if (url.searchParams.get('health') === 'true') {
      const health = await healthCheck();
      const pubsubHealth = await checkPubSubHealth();
      
      return NextResponse.json({
        ...health,
        details: {
          ...health.details,
          pubsub: pubsubHealth
        }
      }, {
        status: health.status === 'healthy' ? 200 : 503,
        headers: corsHeaders
      });
    }
    
    // Check if this is a metrics request
    if (url.searchParams.get('metrics') === 'true') {
      const metrics = getMetrics();
      return NextResponse.json(metrics, {
        headers: corsHeaders
      });
    }
    
    // Handle GraphQL GET requests (typically for GraphQL Playground or introspection)
    const response = await handler(request);
    
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('GraphQL GET Error:', error);
    
    return NextResponse.json(
      {
        errors: [{
          message: 'Internal server error',
          extensions: {
            code: 'INTERNAL_ERROR'
          }
        }]
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle GraphQL POST requests
    const response = await handler(request);
    
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  } catch (error) {
    console.error('GraphQL POST Error:', error);
    
    return NextResponse.json(
      {
        errors: [{
          message: 'Internal server error',
          extensions: {
            code: 'INTERNAL_ERROR'
          }
        }]
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// Export for edge runtime compatibility (optional)
export const runtime = 'nodejs'; // Use 'edge' for edge runtime