import { z } from 'zod';

// Validation schemas
const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  phone: z.string().optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  goals: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  invitationCode: z.string().optional()
});

const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  goals: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional()
});

const createPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(100, 'Package name too long'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  hours: z.number().positive('Hours must be positive'),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional()
});

const updatePackageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(100, 'Package name too long').optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  hours: z.number().positive('Hours must be positive').optional(),
  features: z.array(z.string()).min(1, 'At least one feature is required').optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

const createBookingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  location: z.string().min(1, 'Location is required').max(500, 'Location too long'),
  lessonHours: z.number().positive('Lesson hours must be positive').max(8, 'Maximum 8 hours per lesson')
}).refine(data => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
}).refine(data => {
  const start = new Date(data.startTime);
  const now = new Date();
  return start > now;
}, {
  message: 'Booking must be in the future',
  path: ['startTime']
});

const updateBookingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid start time format').optional(),
  endTime: z.string().datetime('Invalid end time format').optional(),
  location: z.string().min(1, 'Location is required').max(500, 'Location too long').optional(),
  lessonHours: z.number().positive('Lesson hours must be positive').max(8, 'Maximum 8 hours per lesson').optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional()
});

const createReviewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long')
});

const quotaTransactionSchema = z.object({
  type: z.enum(['PURCHASE', 'CONSUMPTION', 'REFUND', 'BONUS']),
  hours: z.number().positive('Hours must be positive'),
  description: z.string().optional(),
  packageId: z.string().uuid('Invalid package ID').optional()
});

const paginationSchema = z.object({
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  offset: z.number().int().min(0, 'Offset must be non-negative').default(0)
});

const filterSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.string().datetime('Invalid date format').optional(),
  dateTo: z.string().datetime('Invalid date format').optional(),
  status: z.string().optional(),
  isActive: z.boolean().optional()
}).refine(data => {
  if (data.dateFrom && data.dateTo) {
    const from = new Date(data.dateFrom);
    const to = new Date(data.dateTo);
    return to >= from;
  }
  return true;
}, {
  message: 'dateTo must be after or equal to dateFrom',
  path: ['dateTo']
});

// Validation result type
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

// Validation functions
export const validateCreateUser = (input: any): ValidationResult => {
  try {
    const data = createUserSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateUpdateUser = (input: any): ValidationResult => {
  try {
    const data = updateUserSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateCreatePackage = (input: any): ValidationResult => {
  try {
    const data = createPackageSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateUpdatePackage = (input: any): ValidationResult => {
  try {
    const data = updatePackageSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateBooking = (input: any): ValidationResult => {
  try {
    const data = createBookingSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateUpdateBooking = (input: any): ValidationResult => {
  try {
    const data = updateBookingSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateReview = (input: any): ValidationResult => {
  try {
    const data = createReviewSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateQuotaTransaction = (input: any): ValidationResult => {
  try {
    const data = quotaTransactionSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validatePagination = (input: any): ValidationResult => {
  try {
    const data = paginationSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

export const validateFilter = (input: any): ValidationResult => {
  try {
    const data = filterSchema.parse(input);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

// Business logic validators
export const validateBookingConflict = async (userId: string, startTime: string, endTime: string, excludeBookingId?: string): Promise<ValidationResult> => {
  try {
    const { supabaseAdmin } = await import('@/lib/api/utils');
    
    let query = supabaseAdmin
      .from('bookings')
      .select('id, title, start_time, end_time')
      .eq('user_id', userId)
      .neq('status', 'CANCELLED')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      return { isValid: false, errors: [`Database error: ${error.message}`] };
    }

    if (conflicts && conflicts.length > 0) {
      return {
        isValid: false,
        errors: [`Booking conflicts with existing booking: ${conflicts[0]?.title || 'Unknown'}`]
      };
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    return { isValid: false, errors: ['Failed to validate booking conflict'] };
  }
};

export const validateQuotaAvailability = async (userId: string, hoursToConsume: number): Promise<ValidationResult> => {
  try {
    const { supabaseAdmin } = await import('@/lib/api/utils');
    
    const { data: quota, error } = await supabaseAdmin
      .from('user_quotas')
      .select('total_hours, used_hours')
      .eq('user_id', userId)
      .single();

    if (error) {
      return { isValid: false, errors: [`Database error: ${error.message}`] };
    }

    if (!quota) {
      return { isValid: false, errors: ['No quota found for user'] };
    }

    const availableHours = (quota.total_hours || 0) - (quota.used_hours || 0);
    
    if (availableHours < hoursToConsume) {
      return {
        isValid: false,
        errors: [`Insufficient quota. Available: ${availableHours} hours, Required: ${hoursToConsume} hours`]
      };
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    return { isValid: false, errors: ['Failed to validate quota availability'] };
  }
};

export const validateInvitationCode = async (code: string): Promise<ValidationResult> => {
  try {
    const { supabaseAdmin } = await import('@/lib/api/utils');
    
    const { data: invitation, error } = await supabaseAdmin
      .from('invitation_codes')
      .select('id, is_active, current_uses, max_uses')
      .eq('code', code)
      .single();

    if (error) {
      return { isValid: false, errors: ['Invalid invitation code'] };
    }

    if (!invitation.is_active) {
      return { isValid: false, errors: ['Invitation code is no longer active'] };
    }

    if (invitation.max_uses && invitation.current_uses >= invitation.max_uses) {
      return { isValid: false, errors: ['Invitation code has reached maximum uses'] };
    }

    return { isValid: true, errors: [], data: invitation };
  } catch (error) {
    return { isValid: false, errors: ['Failed to validate invitation code'] };
  }
};

// Rate limiting validator
export const validateRateLimit = async (identifier: string, action: string, limit: number, windowMinutes: number): Promise<ValidationResult> => {
  try {
    const { supabaseAdmin } = await import('@/lib/api/utils');
    
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    
    // This would need a rate_limit_attempts table or similar
    // For now, we'll implement a simple check
    const { count, error } = await supabaseAdmin
      .from('suspicious_activities')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('activity_type', action)
      .gte('created_at', windowStart);

    if (error) {
      return { isValid: false, errors: [`Rate limit check failed: ${error.message}`] };
    }

    if ((count || 0) >= limit) {
      return {
        isValid: false,
        errors: [`Rate limit exceeded. Maximum ${limit} ${action} attempts per ${windowMinutes} minutes`]
      };
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    return { isValid: false, errors: ['Failed to validate rate limit'] };
  }
};

// Export validation result type
export type { ValidationResult };