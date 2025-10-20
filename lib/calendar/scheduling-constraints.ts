/**
 * Scheduling Constraints and Limits Management
 * Provides centralized configuration for scheduling rules and validation
 */

export interface SchedulingConstraints {
  // Weekly limits
  maxHoursPerWeek: number;
  maxLessonsPerWeek: number;
  maxConsecutiveLessons: number;
  
  // Daily limits
  maxHoursPerDay: number;
  maxLessonsPerDay: number;
  
  // Time constraints
  earliestStartTime: string; // HH:mm format
  latestEndTime: string;     // HH:mm format
  
  // Buffer requirements
  minBufferBetweenLessons: number; // minutes
  maxBufferBetweenLessons: number; // minutes
  
  // Lesson duration constraints
  minLessonDuration: number; // minutes
  maxLessonDuration: number; // minutes
  allowedDurations: number[]; // allowed lesson durations in minutes
  
  // Booking constraints
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  
  // Instructor constraints
  maxInstructorHoursPerDay: number;
  requiredBreakAfterHours: number; // hours after which a break is required
  minBreakDuration: number; // minutes
}

export const DEFAULT_CONSTRAINTS: SchedulingConstraints = {
  // Weekly limits
  maxHoursPerWeek: 20,
  maxLessonsPerWeek: 15,
  maxConsecutiveLessons: 3,
  
  // Daily limits
  maxHoursPerDay: 6,
  maxLessonsPerDay: 8,
  
  // Time constraints (7 AM to 7 PM)
  earliestStartTime: '07:00',
  latestEndTime: '19:00',
  
  // Buffer requirements
  minBufferBetweenLessons: 15,
  maxBufferBetweenLessons: 60,
  
  // Lesson duration constraints
  minLessonDuration: 60,
  maxLessonDuration: 180,
  allowedDurations: [60, 90, 120, 180], // 1h, 1.5h, 2h, 3h
  
  // Booking constraints
  maxAdvanceBookingDays: 30,
  minAdvanceBookingHours: 24,
  
  // Instructor constraints
  maxInstructorHoursPerDay: 8,
  requiredBreakAfterHours: 4,
  minBreakDuration: 30
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface BookingRequest {
  userId: string;
  startTime: Date;
  endTime: Date;
  lessonType?: string;
  duration: number; // minutes
}

export interface ExistingBooking {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  lessonType?: string;
}

export class SchedulingValidator {
  private constraints: SchedulingConstraints;

  constructor(constraints: SchedulingConstraints = DEFAULT_CONSTRAINTS) {
    this.constraints = constraints;
  }

  /**
   * Validate a booking request against all constraints
   */
  validateBooking(
    request: BookingRequest,
    existingBookings: ExistingBooking[] = []
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate basic constraints
    this.validateTimeConstraints(request, result);
    this.validateDurationConstraints(request, result);
    this.validateAdvanceBookingConstraints(request, result);
    
    // Validate against existing bookings
    this.validateWeeklyLimits(request, existingBookings, result);
    this.validateDailyLimits(request, existingBookings, result);
    this.validateBufferConstraints(request, existingBookings, result);
    this.validateConsecutiveLessons(request, existingBookings, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateTimeConstraints(request: BookingRequest, result: ValidationResult): void {
    const startHour = request.startTime.getHours();
    const startMinute = request.startTime.getMinutes();
    const endHour = request.endTime.getHours();
    const endMinute = request.endTime.getMinutes();

    const [earliestHour, earliestMinute] = this.constraints.earliestStartTime.split(':').map((n): number => isNaN(Number(n)) ? 0 : Number(n));
    const [latestHour, latestMinute] = this.constraints.latestEndTime.split(':').map((n): number => isNaN(Number(n)) ? 0 : Number(n));

    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    const earliestMinutes = earliestHour * 60 + earliestMinute;
    const latestMinutes = latestHour * 60 + latestMinute;

    if (startTimeMinutes < earliestMinutes) {
      result.errors.push(`Lesson cannot start before ${this.constraints.earliestStartTime}`);
    }

    if (endTimeMinutes > latestMinutes) {
      result.errors.push(`Lesson cannot end after ${this.constraints.latestEndTime}`);
    }

    // Check for weekend bookings (assuming weekdays only)
    const dayOfWeek = request.startTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      result.warnings.push('Weekend bookings may have limited availability');
    }
  }

  private validateDurationConstraints(request: BookingRequest, result: ValidationResult): void {
    if (request.duration < this.constraints.minLessonDuration) {
      result.errors.push(`Lesson duration must be at least ${this.constraints.minLessonDuration} minutes`);
    }

    if (request.duration > this.constraints.maxLessonDuration) {
      result.errors.push(`Lesson duration cannot exceed ${this.constraints.maxLessonDuration} minutes`);
    }

    if (!this.constraints.allowedDurations.includes(request.duration)) {
      result.warnings.push(`Recommended lesson durations: ${this.constraints.allowedDurations.join(', ')} minutes`);
    }
  }

  private validateAdvanceBookingConstraints(request: BookingRequest, result: ValidationResult): void {
    const now = new Date();
    const hoursUntilLesson = (request.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilLesson = hoursUntilLesson / 24;

    if (hoursUntilLesson < this.constraints.minAdvanceBookingHours) {
      result.errors.push(`Lessons must be booked at least ${this.constraints.minAdvanceBookingHours} hours in advance`);
    }

    if (daysUntilLesson > this.constraints.maxAdvanceBookingDays) {
      result.errors.push(`Lessons cannot be booked more than ${this.constraints.maxAdvanceBookingDays} days in advance`);
    }
  }

  private validateWeeklyLimits(
    request: BookingRequest,
    existingBookings: ExistingBooking[],
    result: ValidationResult
  ): void {
    const weekStart = this.getWeekStart(request.startTime);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weeklyBookings = existingBookings.filter(booking => 
      booking.userId === request.userId &&
      booking.status === 'confirmed' &&
      booking.startTime >= weekStart &&
      booking.startTime < weekEnd
    );

    const currentWeeklyHours = weeklyBookings.reduce((total, booking) => {
      return total + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
    }, 0);

    const requestHours = request.duration / 60;

    if (currentWeeklyHours + requestHours > this.constraints.maxHoursPerWeek) {
      result.errors.push(`Weekly limit exceeded. Maximum ${this.constraints.maxHoursPerWeek} hours per week`);
    }

    if (weeklyBookings.length >= this.constraints.maxLessonsPerWeek) {
      result.errors.push(`Weekly lesson limit exceeded. Maximum ${this.constraints.maxLessonsPerWeek} lessons per week`);
    }
  }

  private validateDailyLimits(
    request: BookingRequest,
    existingBookings: ExistingBooking[],
    result: ValidationResult
  ): void {
    const dayStart = new Date(request.startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dailyBookings = existingBookings.filter(booking => 
      booking.userId === request.userId &&
      booking.status === 'confirmed' &&
      booking.startTime >= dayStart &&
      booking.startTime < dayEnd
    );

    const currentDailyHours = dailyBookings.reduce((total, booking) => {
      return total + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
    }, 0);

    const requestHours = request.duration / 60;

    if (currentDailyHours + requestHours > this.constraints.maxHoursPerDay) {
      result.errors.push(`Daily limit exceeded. Maximum ${this.constraints.maxHoursPerDay} hours per day`);
    }

    if (dailyBookings.length >= this.constraints.maxLessonsPerDay) {
      result.errors.push(`Daily lesson limit exceeded. Maximum ${this.constraints.maxLessonsPerDay} lessons per day`);
    }
  }

  private validateBufferConstraints(
    request: BookingRequest,
    existingBookings: ExistingBooking[],
    result: ValidationResult
  ): void {
    const conflictingBookings = existingBookings.filter(booking => 
      booking.userId === request.userId &&
      booking.status === 'confirmed' &&
      this.hasTimeConflict(request, booking)
    );

    for (const booking of conflictingBookings) {
      const bufferBefore = (request.startTime.getTime() - booking.endTime.getTime()) / (1000 * 60);
      const bufferAfter = (booking.startTime.getTime() - request.endTime.getTime()) / (1000 * 60);

      if (bufferBefore > 0 && bufferBefore < this.constraints.minBufferBetweenLessons) {
        result.errors.push(`Insufficient buffer time. Need at least ${this.constraints.minBufferBetweenLessons} minutes between lessons`);
      }

      if (bufferAfter > 0 && bufferAfter < this.constraints.minBufferBetweenLessons) {
        result.errors.push(`Insufficient buffer time. Need at least ${this.constraints.minBufferBetweenLessons} minutes between lessons`);
      }
    }
  }

  private validateConsecutiveLessons(
    request: BookingRequest,
    existingBookings: ExistingBooking[],
    result: ValidationResult
  ): void {
    const dayStart = new Date(request.startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dailyBookings = existingBookings
      .filter(booking => 
        booking.userId === request.userId &&
        booking.status === 'confirmed' &&
        booking.startTime >= dayStart &&
        booking.startTime < dayEnd
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Add the new request to check consecutive lessons
    const allBookings = [...dailyBookings, {
      id: 'new',
      userId: request.userId,
      startTime: request.startTime,
      endTime: request.endTime,
      status: 'confirmed' as const
    }].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    let consecutiveCount = 1;
    for (let i = 1; i < allBookings.length; i++) {
      const prevBooking = allBookings[i - 1];
      const currentBooking = allBookings[i];
      
      // Check if lessons are back-to-back (within buffer time)
      const timeBetween = (currentBooking.startTime.getTime() - prevBooking.endTime.getTime()) / (1000 * 60);
      
      if (timeBetween <= this.constraints.minBufferBetweenLessons) {
        consecutiveCount++;
        
        if (consecutiveCount > this.constraints.maxConsecutiveLessons) {
          result.warnings.push(`Consider spacing out lessons. Maximum recommended consecutive lessons: ${this.constraints.maxConsecutiveLessons}`);
          break;
        }
      } else {
        consecutiveCount = 1;
      }
    }
  }

  private hasTimeConflict(request: BookingRequest, booking: ExistingBooking): boolean {
    return request.startTime < booking.endTime && request.endTime > booking.startTime;
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Get available time slots for a given date
   */
  getAvailableSlots(
    date: Date,
    existingBookings: ExistingBooking[],
    duration: number = 60
  ): { start: Date; end: Date }[] {
    const slots: { start: Date; end: Date }[] = [];
    
    const dayStart = new Date(date);
    const [startHour, startMinute] = this.constraints.earliestStartTime.split(':').map(Number);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    const [endHour, endMinute] = this.constraints.latestEndTime.split(':').map(Number);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    // Get bookings for this date
    const dayBookings = existingBookings
      .filter(booking => 
        booking.status === 'confirmed' &&
        booking.startTime.toDateString() === date.toDateString()
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    let currentTime = new Date(dayStart);

    for (const booking of dayBookings) {
      // Check if there's a slot before this booking
      const availableTime = booking.startTime.getTime() - currentTime.getTime();
      const requiredTime = (duration + this.constraints.minBufferBetweenLessons) * 60 * 1000;

      if (availableTime >= requiredTime) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
        if (slotEnd <= booking.startTime) {
          slots.push({
            start: new Date(currentTime),
            end: slotEnd
          });
        }
      }

      // Move to after this booking plus buffer
      currentTime = new Date(booking.endTime.getTime() + this.constraints.minBufferBetweenLessons * 60 * 1000);
    }

    // Check for slot after last booking
    const remainingTime = dayEnd.getTime() - currentTime.getTime();
    if (remainingTime >= duration * 60 * 1000) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
      if (slotEnd <= dayEnd) {
        slots.push({
          start: new Date(currentTime),
          end: slotEnd
        });
      }
    }

    return slots;
  }

  /**
   * Update constraints (for admin use)
   */
  updateConstraints(newConstraints: Partial<SchedulingConstraints>): void {
    this.constraints = { ...this.constraints, ...newConstraints };
  }

  /**
   * Get current constraints
   */
  getConstraints(): SchedulingConstraints {
    return { ...this.constraints };
  }
}

// Export singleton instance
export const schedulingValidator = new SchedulingValidator();

// Utility functions
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatTimeRange = (start: Date, end: Date): string => {
  const formatTime = (date: Date) => 
    date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  
  return `${formatTime(start)} - ${formatTime(end)}`;
};
