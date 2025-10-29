import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  allowedMethods?: string[];
  corsOrigins?: string[];
  requireAuth?: boolean;
  requireAdmin?: boolean;
  maxBodySize?: number; // in bytes
  allowedContentTypes?: string[];
}

export interface MiddlewareContext {
  req: NextRequest;
  user?: any;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface MiddlewareResult {
  success: boolean;
  response?: NextResponse;
  context?: MiddlewareContext;
  error?: string;
}

/**
 * Simplified security middleware for API routes
 */
export async function securityMiddleware(
  req: NextRequest,
  config: SecurityConfig = {}
): Promise<MiddlewareResult> {
  const {
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    corsOrigins = ['*'],
    requireAuth = false,
    requireAdmin = false,
    maxBodySize = 10 * 1024 * 1024, // 10MB
    allowedContentTypes = ['application/json', 'multipart/form-data', 'text/plain']
  } = config;

  const context: MiddlewareContext = {
    req,
    isAuthenticated: false,
    isAdmin: false
  };

  try {
    // Method validation
    if (!allowedMethods.includes(req.method)) {
      return {
        success: false,
        error: `Method ${req.method} not allowed`,
        response: NextResponse.json(
          { error: `Method ${req.method} not allowed` },
          { status: 405 }
        )
      };
    }

    // CORS handling
    const origin = req.headers.get('origin');
    const corsHeaders: Record<string, string> = {};
    
    if (corsOrigins.includes('*') || (origin && corsOrigins.includes(origin))) {
      corsHeaders['Access-Control-Allow-Origin'] = origin || '*';
      corsHeaders['Access-Control-Allow-Methods'] = allowedMethods.join(', ');
      corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return {
        success: true,
        response: new NextResponse(null, {
          status: 200,
          headers: corsHeaders
        })
      };
    }

    // Content-Type validation for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers.get('content-type');
      if (contentType && !allowedContentTypes.some(type => contentType.includes(type))) {
        return {
          success: false,
          error: 'Invalid content type',
          response: NextResponse.json(
            { error: 'Invalid content type' },
            { status: 415, headers: corsHeaders }
          )
        };
      }

      // Body size validation
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > maxBodySize) {
        return {
          success: false,
          error: 'Request body too large',
          response: NextResponse.json(
            { error: 'Request body too large' },
            { status: 413, headers: corsHeaders }
          )
        };
      }
    }

    // Basic authentication check (simplified)
    if (requireAuth) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'Authentication required',
          response: NextResponse.json(
            { error: 'Authentication required' },
            { status: 401, headers: corsHeaders }
          )
        };
      }

      // In a real implementation, you would validate the token here
      context.isAuthenticated = true;
      context.user = { id: 'user-id' }; // Placeholder
    }

    // Admin check (simplified)
    if (requireAdmin && !context.isAdmin) {
      return {
        success: false,
        error: 'Admin access required',
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403, headers: corsHeaders }
        )
      };
    }

    return {
      success: true,
      context
    };

  } catch (error) {
    console.error('Security middleware error:', error);
    return {
      success: false,
      error: 'Internal security error',
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(req: NextRequest): Promise<MiddlewareResult> {
  return securityMiddleware(req, {
    requireAuth: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
  });
}

/**
 * General API middleware
 */
export async function apiMiddleware(req: NextRequest): Promise<MiddlewareResult> {
  return securityMiddleware(req, {
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  });
}

/**
 * Admin middleware
 */
export async function adminMiddleware(req: NextRequest): Promise<MiddlewareResult> {
  return securityMiddleware(req, {
    requireAuth: true,
    requireAdmin: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  });
}

/**
 * Public middleware (minimal security)
 */
export async function publicMiddleware(req: NextRequest): Promise<MiddlewareResult> {
  return securityMiddleware(req, {
    requireAuth: false,
    allowedMethods: ['GET', 'POST']
  });
}

/**
 * Utility functions
 */
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Wrapper for API routes with middleware
 */
export function withMiddleware(
  handler: (req: NextRequest, context: MiddlewareContext) => Promise<NextResponse>,
  middleware: (req: NextRequest) => Promise<MiddlewareResult> = apiMiddleware
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = await middleware(req);
    
    if (!result.success) {
      return result.response || createErrorResponse(result.error || 'Middleware error');
    }

    try {
      return await handler(req, result.context!);
    } catch (error) {
      console.error('API handler error:', error);
      return createErrorResponse('Internal server error', 500);
    }
  };
}