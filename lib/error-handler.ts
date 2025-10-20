import { NextResponse } from 'next/server'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429)
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        error: error.message,
        statusCode: error.statusCode 
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: error.issues 
      },
      { status: 400 }
    )
  }

  // Default server error
  return NextResponse.json(
    { 
      error: 'Internal server error',
      statusCode: 500 
    },
    { status: 500 }
  )
}

// Async error wrapper for API routes
export function asyncHandler(fn: Function) {
  return async (req: Request, context?: any) => {
    try {
      return await fn(req, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Log error for monitoring
export function logError(error: unknown, context?: string) {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error('Application Error:', errorInfo)

  // In production, you might want to send this to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, etc.
  }
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleApiError,
  asyncHandler,
  logError,
}