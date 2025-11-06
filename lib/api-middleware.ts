import { NextRequest, NextResponse } from 'next/server';
import { apiStateManager, type RequestHandler } from './api-state-manager';

interface MiddlewareOptions {
  priority?: 'high' | 'medium' | 'low';
  maxRetries?: number;
  timeout?: number;
}

/**
 * Centralized API middleware for unified request queue processing
 */
export function withCentralizedStateManagement(
  handler: RequestHandler,
  endpoint: string,
  options: MiddlewareOptions = {}
) {
  const { priority = 'medium', maxRetries = 3 } = options;
  const IS_PROD = process.env.NODE_ENV === 'production';
  const endpointKey = `${endpoint}_${Date.now()}`;

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // In development/test environments, bypass the centralized queue to simplify debugging
      // and avoid any potential race conditions with dev servers.
      if (!IS_PROD) {
        try {
          console.log(`API (dev) route hit: ${endpoint} ${request.method}`);
          return await handler(request);
        } catch (error) {
          console.error(`[API Middleware - DEV] Handler error for ${endpoint}:`, error);
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        }
      }

      // Register the handler with the state manager
      apiStateManager.registerHandler(endpointKey, async (req: NextRequest) => {
        try {
          return await handler(req);
        } catch (error) {
          console.error(`[API Middleware] Handler error for ${endpointKey}:`, error);
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        }
      });

      // Process the request through the state manager using queueRequest
      return await apiStateManager.queueRequest(
        request,
        endpointKey,
        priority,
        maxRetries
      );

    } catch (error) {
      console.error('[API Middleware] Request processing failed:', error);
      return NextResponse.json(
        { error: 'Request processing failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Authentication check helper
 */
async function checkAuthentication(_request: NextRequest): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
}> {
 try {
  // Import the auth function directly (not as default export)
  const { auth } = await import('@clerk/nextjs/server');
  const authResult = await auth();
  const { userId } = authResult;
  
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized - No valid session found'
    };
  }
  
  return {
    success: true,
    userId
  };
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[API Middleware] Authentication check failed:', error);
  }
  return {
    success: false,
    error: 'Authentication service unavailable'
  };
}
}

/**
 * Utility function to get API metrics
 */
export function getAPIMetrics() {
  return apiStateManager.getMetrics();
}

/**
 * Utility function to freeze/unfreeze the API system
 */
export function freezeAPI() {
  apiStateManager.freeze();
}

export function unfreezeAPI() {
  apiStateManager.unfreeze();
}

/**
 * Utility function to clear the request queue
 */
export function clearAPIQueue() {
  apiStateManager.clearQueue();
}

/**
 * Health check endpoint helper
 */
export function createHealthCheckHandler() {
  return async (): Promise<NextResponse> => {
    const metrics = apiStateManager.getMetrics();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        queueLength: metrics.queueLength,
        isProcessing: metrics.isProcessing,
        lastProcessedAt: metrics.lastProcessedAt ? new Date(metrics.lastProcessedAt).toISOString() : null
      }
    });
  };
}

/**
 * Legacy rate limit compatibility layer
 * This allows gradual migration from the old rate limiting system
 */
export function createLegacyRateLimitWrapper(
  originalHandler: RequestHandler,
  endpoint: string
) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[API Middleware] Using legacy wrapper for ${endpoint}. Consider migrating to withCentralizedStateManagement.`);
  }
  
  return withCentralizedStateManagement(originalHandler, endpoint, {
    priority: 'low', // Legacy endpoints get lower priority
    maxRetries: 1
  });
}