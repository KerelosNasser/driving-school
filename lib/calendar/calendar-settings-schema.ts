import { z } from 'zod';

/**
 * Time string in HH:mm format (24-hour)
 */
const timeStringSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Time must be in HH:mm format (e.g., 09:00, 14:30)'
});

/**
 * Date string in YYYY-MM-DD format
 */
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format'
});

/**
 * Day of week configuration
 */
const dayConfigSchema = z.object({
  enabled: z.boolean(),
  start: timeStringSchema,
  end: timeStringSchema,
}).refine(
  (data) => !data.enabled || data.start < data.end,
  { message: 'Start time must be before end time' }
);

/**
 * Complete calendar settings schema
 */
export const calendarSettingsSchema = z.object({
  id: z.number().optional(),
  bufferTimeMinutes: z.number().min(0).max(120),
  lessonDurationMinutes: z.number().min(30).max(180).default(60),
  maxBookingsPerDay: z.number().min(1).max(20).default(8),
  
  // Day-specific settings
  sunday: dayConfigSchema,
  monday: dayConfigSchema,
  tuesday: dayConfigSchema,
  wednesday: dayConfigSchema,
  thursday: dayConfigSchema,
  friday: dayConfigSchema,
  saturday: dayConfigSchema,
  
  // Vacation days
  vacationDays: z.array(z.object({
    date: dateStringSchema,
    reason: z.string().min(1).max(200),
  })).default([]),
  
  // Metadata
  updatedAt: z.string().datetime().optional(),
  timezone: z.string().default('Australia/Brisbane'),
});

/**
 * Frontend-friendly calendar settings (camelCase)
 */
export const frontendCalendarSettingsSchema = z.object({
  bufferTimeMinutes: z.number(),
  lessonDurationMinutes: z.number(),
  maxBookingsPerDay: z.number(),
  
  // Day-specific (camelCase)
  sundayEnabled: z.boolean(),
  sundayStart: timeStringSchema,
  sundayEnd: timeStringSchema,
  
  mondayEnabled: z.boolean(),
  mondayStart: timeStringSchema,
  mondayEnd: timeStringSchema,
  
  tuesdayEnabled: z.boolean(),
  tuesdayStart: timeStringSchema,
  tuesdayEnd: timeStringSchema,
  
  wednesdayEnabled: z.boolean(),
  wednesdayStart: timeStringSchema,
  wednesdayEnd: timeStringSchema,
  
  thursdayEnabled: z.boolean(),
  thursdayStart: timeStringSchema,
  thursdayEnd: timeStringSchema,
  
  fridayEnabled: z.boolean(),
  fridayStart: timeStringSchema,
  fridayEnd: timeStringSchema,
  
  saturdayEnabled: z.boolean(),
  saturdayStart: timeStringSchema,
  saturdayEnd: timeStringSchema,
  
  // Vacation days
  vacationDays: z.array(dateStringSchema),
  vacationDaysDetails: z.array(z.object({
    date: dateStringSchema,
    reason: z.string(),
  })).optional(),
  
  // Working days array (for backward compatibility)
  workingDays: z.array(z.number().min(0).max(6)),
  
  // Metadata
  timezone: z.string(),
  updatedAt: z.string().optional(),
});

export type CalendarSettings = z.infer<typeof calendarSettingsSchema>;
export type FrontendCalendarSettings = z.infer<typeof frontendCalendarSettingsSchema>;

/**
 * Transform database settings to frontend format
 */
export function transformToFrontendSettings(dbSettings: any): FrontendCalendarSettings {
  const workingDays: number[] = [];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  dayNames.forEach((day, index) => {
    if (dbSettings[`${day}_enabled`]) {
      workingDays.push(index);
    }
  });
  
  return {
    bufferTimeMinutes: dbSettings.buffer_time_minutes ?? 30,
    lessonDurationMinutes: dbSettings.lesson_duration_minutes ?? 60,
    maxBookingsPerDay: dbSettings.max_bookings_per_day ?? 8,
    
    sundayEnabled: dbSettings.sunday_enabled ?? false,
    sundayStart: dbSettings.sunday_start ?? '10:00',
    sundayEnd: dbSettings.sunday_end ?? '16:00',
    
    mondayEnabled: dbSettings.monday_enabled ?? true,
    mondayStart: dbSettings.monday_start ?? '09:00',
    mondayEnd: dbSettings.monday_end ?? '17:00',
    
    tuesdayEnabled: dbSettings.tuesday_enabled ?? true,
    tuesdayStart: dbSettings.tuesday_start ?? '09:00',
    tuesdayEnd: dbSettings.tuesday_end ?? '17:00',
    
    wednesdayEnabled: dbSettings.wednesday_enabled ?? true,
    wednesdayStart: dbSettings.wednesday_start ?? '09:00',
    wednesdayEnd: dbSettings.wednesday_end ?? '17:00',
    
    thursdayEnabled: dbSettings.thursday_enabled ?? true,
    thursdayStart: dbSettings.thursday_start ?? '09:00',
    thursdayEnd: dbSettings.thursday_end ?? '17:00',
    
    fridayEnabled: dbSettings.friday_enabled ?? true,
    fridayStart: dbSettings.friday_start ?? '09:00',
    fridayEnd: dbSettings.friday_end ?? '17:00',
    
    saturdayEnabled: dbSettings.saturday_enabled ?? false,
    saturdayStart: dbSettings.saturday_start ?? '10:00',
    saturdayEnd: dbSettings.saturday_end ?? '16:00',
    
    vacationDays: [],
    workingDays,
    timezone: dbSettings.timezone ?? 'Australia/Brisbane',
    updatedAt: dbSettings.updated_at,
  };
}
