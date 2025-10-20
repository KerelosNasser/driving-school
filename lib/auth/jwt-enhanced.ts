import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

// Create JWT token
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

// Extract token from request
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check cookies
  const tokenCookie = request.cookies.get('auth-token')
  return tokenCookie?.value || null
}

// Verify user from request
export function verifyUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = extractToken(request)
  if (!token) return null
  
  return verifyToken(token)
}

// Check if user has required role
export function hasRole(user: JWTPayload, requiredRole: string): boolean {
  const roleHierarchy = ['student', 'instructor', 'admin']
  const userRoleIndex = roleHierarchy.indexOf(user.role)
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)
  
  return userRoleIndex >= requiredRoleIndex
}