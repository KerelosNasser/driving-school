/**
 * API Middleware for Centralized State Management
 * 
 * This middleware replaces individual rate limiting with unified request processing.
 * It integrates seamlessly with existing API routes while providing centralized control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiStateManager, type RequestHandler } from './api-state-manager';

interface MiddlewareOptions {
  priority?: 'high' | 'medium' | 'low';
  maxRetries?: number;
  requireAuth?: boolean;
  timeout?: number;
}

/**
 * Centralized API middleware that replaces individual rate limiting
 * with unified request queue processing
 */
export function withCentralizedStateManagement(
  handler: RequestHandler,
  endpoint: string,
  options: MiddlewareOptions = {}
) {
  const {
    priority = 'medium',
    maxRetries = 3,
    requireAuth = true  } = options;

  // We don't pre-register handlers for all methods since each route export
  // (GET, POST, etc.) will call this middleware separately with the specific handler

  // Return the wrapped handler
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Register the handler for this specific method and endpoint
      const endpointKey = `${request.method} ${endpoint}`;
      apiStateManager.registerHandler(endpointKey, async (req: NextRequest) => {
        try {
          // Apply authentication check if required
          if (requireAuth) {
            const authResult = await checkAuthentication(req);
            if (!authResult.success) {
              return NextResponse.json(
                { error: authResult.error },
                { status: 401 }
              );
            }
          }

          // Execute the original handler
          return await handler(req);
        } catch (error) {
          console.error(`[API Middleware] Error in ${endpoint}:`, error);
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        }
      });

      // Queue the request through the centralized state manager
      return await apiStateManager.queueRequest(
        request,
        endpointKey,
        priority,
        maxRetries
      );
    } catch (error) {
      console.error(`[API Middleware] Failed to queue request for ${endpoint}:`, error);
      
      // Return appropriate error response
      if (error instanceof Error) {
        if (error.message.includes('frozen')) {
          return NextResponse.json(
            { error: 'API system is temporarily unavailable' },
            { status: 503 }
          );
        }
        if (error.message.includes('queue is full')) {
          return NextResponse.json(
            { error: 'Server is busy, please try again later' },
            { status: 429 }
          );
        }
      }
      
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
  console.error('[API Middleware] Authentication check failed:', error);
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
  console.warn(`[API Middleware] Using legacy wrapper for ${endpoint}. Consider migrating to withCentralizedStateManagement.`);
  
  return withCentralizedStateManagement(originalHandler, endpoint, {
    priority: 'low', // Legacy endpoints get lower priority
    maxRetries: 1
  });
}