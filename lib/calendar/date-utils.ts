import { parseISO, startOfDay, addMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Default timezone for the application
 */
export const DEFAULT_TIMEZONE = 'Australia/Brisbane';

/**
 * Format a date to YYYY-MM-DD in the specified timezone
 * This ensures consistent date strings regardless of user's local timezone
 */
export function formatDateInTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, 'yyyy-MM-dd');
}

/**
 * Format a date to HH:mm in the specified timezone
 */
export function formatTimeInTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, 'HH:mm');
}

/**
 * Create a date from YYYY-MM-DD string in the specified timezone
 * Returns a Date object that represents midnight in that timezone
 */
export function createDateInTimezone(dateString: string, timezone: string = DEFAULT_TIMEZONE): Date {
  // Parse as YYYY-MM-DD and treat as midnight in the target timezone
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  return fromZonedTime(localDate, timezone);
}

/**
 * Create a datetime from date and time strings in the specified timezone
 */
export function createDateTimeInTimezone(
  dateString: string,
  timeString: string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  if (!year || !month || !day || hours === undefined || minutes === undefined) {
    throw new Error(`Invalid date/time: ${dateString} ${timeString}`);
  }
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return fromZonedTime(localDate, timezone);
}

/**
 * Check if a date matches a vacation day (comparing only the date part)
 */
export function isVacationDay(
  date: Date,
  vacationDays: string[],
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const dateStr = formatDateInTimezone(date, timezone);
  return vacationDays.includes(dateStr);
}

/**
 * Check if a date is a working day based on day of week
 */
export function isWorkingDay(date: Date, workingDays: number[]): boolean {
  const dayOfWeek = date.getDay();
  return workingDays.includes(dayOfWeek);
}

/**
 * Get the day of week name
 */
export function getDayName(date: Date): string {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  if (!dayName) {
    throw new Error(`Invalid day of week: ${date.getDay()}`);
  }
  return dayName;
}

/**
 * Check if two time slots overlap (with optional buffer)
 */
export function doTimeSlotsOverlap(
  slot1Start: Date,
  slot1End: Date,
  slot2Start: Date,
  slot2End: Date,
  bufferMinutes: number = 0
): boolean {
  // Add buffer to slot2
  const bufferedStart = addMinutes(slot2Start, -bufferMinutes);
  const bufferedEnd = addMinutes(slot2End, bufferMinutes);
  
  // Check for any overlap
  return (
    (slot1Start >= bufferedStart && slot1Start < bufferedEnd) ||
    (slot1End > bufferedStart && slot1End <= bufferedEnd) ||
    (slot1Start <= bufferedStart && slot1End >= bufferedEnd)
  );
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (hours === undefined || minutes === undefined) {
    throw new Error(`Invalid time string: ${timeString}`);
  }
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:mm)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generate time slots for a given date and working hours
 */
export function generateTimeSlots(
  date: Date,
  startTime: string,
  endTime: string,
  slotDuration: number,
  timezone: string = DEFAULT_TIMEZONE
): Array<{ start: Date; end: Date; time: string }> {
  const slots: Array<{ start: Date; end: Date; time: string }> = [];
  const dateStr = formatDateInTimezone(date, timezone);
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const timeStr = minutesToTime(minutes);
    const slotStart = createDateTimeInTimezone(dateStr, timeStr, timezone);
    const slotEnd = addMinutes(slotStart, slotDuration);
    
    slots.push({
      start: slotStart,
      end: slotEnd,
      time: timeStr,
    });
  }
  
  return slots;
}

/**
 * Check if a date is in the past (comparing only the date part)
 */
export function isDateInPast(date: Date, timezone: string = DEFAULT_TIMEZONE): boolean {
  const now = toZonedTime(new Date(), timezone);
  const todayStart = startOfDay(now);
  const checkDate = toZonedTime(date, timezone);
  const checkDateStart = startOfDay(checkDate);
  
  return checkDateStart < todayStart;
}

/**
 * Get today's date in the specified timezone
 */
export function getTodayInTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, 'PPP'); // e.g., "April 29, 2024"
}

/**
 * Format a datetime for display
 */
export function formatDateTimeForDisplay(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, 'PPP p'); // e.g., "April 29, 2024 2:30 PM"
}

/**
 * Validate that a date string is in YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

/**
 * Validate that a time string is in HH:mm format
 */
export function isValidTimeString(timeString: string): boolean {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
}
