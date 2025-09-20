/**
 * API middleware for validation, sanitization, rate limiting, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContentValidator } from './validator';
import { InputSanitizer } from './sanitizer';
import { rateLimiters, checkRateLimit } from './rateLimiter';
import { auditLogger } from './auditLogger';
import { permissionManager } from '../permissions/PermissionManager';
import { UserRole, Resource, Operation } from '../permissions/types';

interface ValidationMiddlewareOptions {
  requireAuth?: boolean;
  requiredRole?: UserRole;
  requiredPermission?: { resource: Resource; operation: Operation };
  rateLimitOperation?: string;
  validateSchema?: 'component' | 'page' | 'navigation' | 'content';
  auditAction?: string;
  auditResource?: string;
}

interface RequestContext {
  user?: {
    id: string;
    role: UserRole;
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enhanced API middleware with security features
 */
export function withSecurityValidation(options: ValidationMiddlewareOptions = {}) {
  return function middleware(handler: Function) {
    return async function secureHandler(req: NextRequest) {
      try {
        // Extract request context
        const context = await extractRequestContext(req);
        
        // 1. Authentication check
        if (options.requireAuth && !context.user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // 2. Role-based authorization
        if (options.requiredRole && context.user) {
          const roleHierarchy: Record<UserRole, number> = {
            guest: 0, viewer: 1, editor: 2, admin: 3
          };
          
          if (roleHierarchy[context.user.role] < roleHierarchy[options.requiredRole]) {
            await auditLogger.logAction(
              context.user.id,
              options.auditAction || 'access_denied',
              options.auditResource || 'api',
              {
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                success: false,
                errorMessage: `Insufficient role: ${context.user.role}, required: ${options.requiredRole}`
              }
            );
            
            return NextResponse.json(
              { error: 'Insufficient permissions', requiredRole: options.requiredRole },
              { status: 403 }
            );
          }
        }

        // 3. Permission-based authorization
        if (options.requiredPermission && context.user) {
          const permissionResult = await permissionManager.checkPermission({
            userId: context.user.id,
            userRole: context.user.role,
            resource: options.requiredPermission.resource,
            operation: options.requiredPermission.operation
          });

          if (!permissionResult.allowed) {
            await auditLogger.logAction(
              context.user.id,
              options.auditAction || 'permission_denied',
              options.auditResource || 'api',
              {
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                success: false,
                errorMessage: permissionResult.reason
              }
            );

            return NextResponse.json(
              { 
                error: 'Permission denied', 
                reason: permissionResult.reason,
                requiredPermission: permissionResult.requiredPermission
              },
              { status: 403 }
            );
          }
        }

        // 4. Rate limiting
        if (options.rateLimitOperation && context.user) {
          const limiter = rateLimiters.content; // Default limiter
          const rateLimitResult = checkRateLimit(
            limiter,
            context.user.id,
            options.rateLimitOperation
          );

          if (!rateLimitResult.allowed) {
            await auditLogger.logAction(
              context.user.id,
              'rate_limit_exceeded',
              options.auditResource || 'api',
              {
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                success: false,
                errorMessage: `Rate limit exceeded for ${options.rateLimitOperation}`
              }
            );

            return NextResponse.json(
              { 
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
              },
              { 
                status: 429,
                headers: {
                  'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
                  'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                  'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
                }
              }
            );
          }
        }

        // 5. Request body validation and sanitization
        let validatedData: any = null;
        if (req.method !== 'GET' && options.validateSchema) {
          try {
            const body = await req.json();
            const validationResult = validateRequestBody(body, options.validateSchema);
            
            if (!validationResult.isValid) {
              await auditLogger.logAction(
                context.user?.id || 'anonymous',
                'validation_failed',
                options.auditResource || 'api',
                {
                  ipAddress: context.ipAddress,
                  userAgent: context.userAgent,
                  success: false,
                  errorMessage: `Validation errors: ${validationResult.errors.map(e => e.message).join(', ')}`,
                  metadata: { errors: validationResult.errors }
                }
              );

              return NextResponse.json(
                { 
                  error: 'Validation failed',
                  errors: validationResult.errors
                },
                { status: 400 }
              );
            }
            
            validatedData = validationResult.sanitizedData;
          } catch (error) {
            return NextResponse.json(
              { error: 'Invalid JSON in request body' },
              { status: 400 }
            );
          }
        }

        // 6. Call the actual handler with enhanced request
        const enhancedReq = {
          ...req,
          context,
          validatedData
        };

        const response = await handler(enhancedReq);

        // 7. Audit successful operations
        if (options.auditAction && context.user) {
          await auditLogger.logAction(
            context.user.id,
            options.auditAction,
            options.auditResource || 'api',
            {
              ipAddress: context.ipAddress,
              userAgent: context.userAgent,
              success: true
            }
          );
        }

        return response;

      } catch (error) {
        console.error('Security middleware error:', error);

        // Audit the error
        if (options.auditAction) {
          await auditLogger.logAction(
            'system',
            'middleware_error',
            options.auditResource || 'api',
            {
              success: false,
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          );
        }

        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Extract request context (user, IP, user agent)
 */
async function extractRequestContext(req: NextRequest): Promise<RequestContext> {
  // In a real implementation, this would extract user from JWT/session
  // For now, we'll use a placeholder
  
  const ipAddress = req.ip || 
    req.headers.get('x-forwarded-for')?.split(',')[0] || 
    req.headers.get('x-real-ip') || 
    'unknown';
    
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Extract user from authorization header or session
  // This is a placeholder - implement based on your auth system
  const user = await extractUserFromRequest(req);

  return {
    user,
    ipAddress,
    userAgent
  };
}

/**
 * Extract user from request (placeholder)
 */
async function extractUserFromRequest(req: NextRequest): Promise<{ id: string; role: UserRole } | undefined> {
  // This would typically extract from JWT token or session
  // For now, return undefined (unauthenticated)
  
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return undefined;
  }

  // Placeholder implementation
  // In reality, you'd validate the JWT token and extract user info
  return {
    id: 'user-123',
    role: 'admin'
  };
}

/**
 * Validate request body based on schema type
 */
function validateRequestBody(body: any, schemaType: string) {
  switch (schemaType) {
    case 'component':
      return ContentValidator.validateComponent(body);
    case 'page':
      return ContentValidator.validatePage(body);
    case 'navigation':
      return ContentValidator.validateNavigation(body);
    case 'content':
      return ContentValidator.validateContent(body);
    default:
      return { isValid: true, errors: [], sanitizedData: body };
  }
}

/**
 * Specific middleware for different operations
 */
export const securityMiddleware = {
  // Content operations
  contentCreate: withSecurityValidation({
    requireAuth: true,
    requiredPermission: { resource: 'content', operation: 'create' },
    rateLimitOperation: 'content_create',
    validateSchema: 'content',
    auditAction: 'content_create',
    auditResource: 'content'
  }),

  contentUpdate: withSecurityValidation({
    requireAuth: true,
    requiredPermission: { resource: 'content', operation: 'update' },
    rateLimitOperation: 'content_update',
    validateSchema: 'content',
    auditAction: 'content_update',
    auditResource: 'content'
  }),

  // Component operations
  componentCreate: withSecurityValidation({
    requireAuth: true,
    requiredPermission: { resource: 'component', operation: 'create' },
    rateLimitOperation: 'component_create',
    validateSchema: 'component',
    auditAction: 'component_create',
    auditResource: 'component'
  }),

  componentUpdate: withSecurityValidation({
    requireAuth: true,
    requiredPermission: { resource: 'component', operation: 'update' },
    rateLimitOperation: 'component_update',
    validateSchema: 'component',
    auditAction: 'component_update',
    auditResource: 'component'
  }),

  // Page operations
  pageCreate: withSecurityValidation({
    requireAuth: true,
    requiredPermission: { resource: 'page', operation: 'create' },
    rateLimitOperation: 'page_create',
    validateSchema: 'page',
    auditAction: 'page_create',
    auditResource: 'page'
  }),

  // Navigation operations
  navigationUpdate: withSecurityValidation({
    requireAuth: true,
    requiredPermission: { resource: 'navigation', operation: 'update' },
    rateLimitOperation: 'navigation_update',
    validateSchema: 'navigation',
    auditAction: 'navigation_update',
    auditResource: 'navigation'
  }),

  // Admin operations
  adminOnly: withSecurityValidation({
    requireAuth: true,
    requiredRole: 'admin',
    auditAction: 'admin_access',
    auditResource: 'admin'
  })
};