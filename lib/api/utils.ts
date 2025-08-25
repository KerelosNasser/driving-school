// Modern API Utilities - Following 2025 best practices
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Supabase admin client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Error types
export class APIError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Auth middleware
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new APIError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return userId;
}

// Response helpers
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}

export function errorResponse(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      }
    }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues,
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  return NextResponse.json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  }, { status: 500 });
}

// API handler wrapper
export function apiHandler(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const userId = await requireAuth();
      return await handler(req, userId);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

// Validation schemas
export const pageValidation = {
  create: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    slug: z.string()
      .min(1, 'Slug is required')
      .max(255, 'Slug too long')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
    content: z.object({
      blocks: z.array(z.object({
        id: z.string(),
        type: z.string(),
        props: z.record(z.string(), z.any()),
        styles: z.record(z.string(), z.any())
      }))
    }).optional(),
    meta_data: z.object({
      description: z.string().optional(),
      keywords: z.string().optional(),
      og_title: z.string().optional(),
      og_description: z.string().optional(),
      og_image: z.string().url().optional().or(z.literal(''))
    }).optional(),
    settings: z.object({
      layout: z.enum(['default', 'full-width', 'narrow']).optional(),
      show_header: z.boolean().optional(),
      show_footer: z.boolean().optional(),
      allow_comments: z.boolean().optional(),
      custom_css: z.string().optional()
    }).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional()
  }),

  update: z.object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string()
      .min(1)
      .max(255)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    content: z.object({
      blocks: z.array(z.object({
        id: z.string(),
        type: z.string(),
        props: z.record(z.string(), z.any()),
        styles: z.record(z.string(), z.any())
      }))
    }).optional(),
    meta_data: z.object({
      description: z.string().optional(),
      keywords: z.string().optional(),
      og_title: z.string().optional(),
      og_description: z.string().optional(),
      og_image: z.string().url().optional().or(z.literal(''))
    }).optional(),
    settings: z.object({
      layout: z.enum(['default', 'full-width', 'narrow']).optional(),
      show_header: z.boolean().optional(),
      show_footer: z.boolean().optional(),
      allow_comments: z.boolean().optional(),
      custom_css: z.string().optional()
    }).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional()
  })
};

export const componentTemplateValidation = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    category: z.enum(['headers', 'content', 'media', 'layout', 'marketing', 'forms']),
    icon: z.string().min(1, 'Icon is required'),
    description: z.string().max(1000, 'Description too long'),
    template: z.object({
      type: z.string(),
      props: z.record(z.string(), z.any()),
      styles: z.record(z.string(), z.any())
    }),
    preview_image: z.string().url().optional().or(z.literal(''))
  })
};

// Pagination helpers
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// Slug generation helper
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

// Content validation helpers
export function validatePageContent(content: any): boolean {
  if (!content || typeof content !== 'object') return false;
  if (!Array.isArray(content.blocks)) return false;
  
  return content.blocks.every((block: any) => 
    block.id && 
    block.type && 
    typeof block.props === 'object' && 
    typeof block.styles === 'object'
  );
}

export function sanitizeContent(content: any): any {
  // Basic sanitization - in production, use a proper HTML sanitizer
  if (typeof content === 'string') {
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (Array.isArray(content)) {
    return content.map(sanitizeContent);
  }
  
  if (content && typeof content === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(content)) {
      sanitized[key] = sanitizeContent(value);
    }
    return sanitized;
  }
  
  return content;
}