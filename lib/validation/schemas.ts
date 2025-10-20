import { z } from 'zod'

// Basic user validation
export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
})

// Login validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Calendar booking schemas
export const bookingCreateSchema = z.object({
  instructorId: uuidSchema,
  studentId: uuidSchema,
  startTime: dateSchema,
  endTime: dateSchema,
  lessonType: z.enum(['theory', 'practical', 'test_preparation', 'mock_test']),
  notes: z.string().max(500, 'Notes too long').optional(),
  vehicleId: uuidSchema.optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0.5 && diffHours <= 4; // 30 minutes to 4 hours
  },
  {
    message: 'Lesson duration must be between 30 minutes and 4 hours',
    path: ['endTime'],
  }
);

export const bookingUpdateSchema = z.object({
  startTime: dateSchema.optional(),
  endTime: dateSchema.optional(),
  lessonType: z.enum(['theory', 'practical', 'test_preparation', 'mock_test']).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  vehicleId: uuidSchema.optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Availability schemas
export const availabilityCreateSchema = z.object({
  instructorId: uuidSchema,
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isRecurring: z.boolean().default(true),
  validFrom: dateSchema.optional(),
  validUntil: dateSchema.optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Instructor schemas
export const instructorCreateSchema = z.object({
  userId: uuidSchema,
  licenseNumber: z.string().min(1, 'License number is required'),
  specializations: z.array(z.enum(['manual', 'automatic', 'motorcycle', 'truck', 'bus'])),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  experience: z.number().min(0, 'Experience must be positive'),
  bio: z.string().max(1000, 'Bio too long').optional(),
  isActive: z.boolean().default(true),
});

export const instructorUpdateSchema = z.object({
  licenseNumber: z.string().min(1).optional(),
  specializations: z.array(z.enum(['manual', 'automatic', 'motorcycle', 'truck', 'bus'])).optional(),
  hourlyRate: z.number().min(0).optional(),
  experience: z.number().min(0).optional(),
  bio: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

// Vehicle schemas
export const vehicleCreateSchema = z.object({
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, 'License plate is required').max(20),
  transmission: z.enum(['manual', 'automatic']),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  isActive: z.boolean().default(true),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).default('10'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

export const bookingQuerySchema = paginationSchema.extend({
  instructorId: uuidSchema.optional(),
  studentId: uuidSchema.optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  lessonType: z.enum(['theory', 'practical', 'test_preparation', 'mock_test']).optional(),
}).merge(dateRangeSchema);

// Google Calendar integration schemas
export const googleCalendarEventSchema = z.object({
  summary: z.string().min(1, 'Event summary is required'),
  description: z.string().optional(),
  startDateTime: dateSchema,
  endDateTime: dateSchema,
  attendees: z.array(z.object({
    email: emailSchema,
    displayName: z.string().optional(),
  })).optional(),
  location: z.string().optional(),
  reminders: z.object({
    useDefault: z.boolean().default(false),
    overrides: z.array(z.object({
      method: z.enum(['email', 'popup']),
      minutes: z.number().min(0).max(40320), // Max 4 weeks
    })).optional(),
  }).optional(),
});

// OAuth schemas
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

// Admin schemas
export const adminUserUpdateSchema = z.object({
  role: z.enum(['student', 'instructor', 'admin']).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

// Scheduling constraints schemas
export const schedulingConstraintSchema = z.object({
  instructorId: uuidSchema,
  constraintType: z.enum(['break', 'unavailable', 'maintenance', 'holiday']),
  startTime: dateSchema,
  endTime: dateSchema,
  reason: z.string().max(200).optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Validation helper functions
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
};

export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));
};

// Middleware validation helper
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown) => {
    const result = validateRequest(schema, data);
    if (!result.success) {
      throw new Error(`Validation failed: ${JSON.stringify(formatValidationErrors(result.errors))}`);
    }
    return result.data;
  };
};