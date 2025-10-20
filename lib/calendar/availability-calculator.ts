/**
 * Availability Calculator
 * Calculates available time slots based on scheduling constraints,
 * existing bookings, and instructor availability
 */

import { 
  SchedulingConstraints, 
  schedulingValidator,
  ExistingBooking 
} from './scheduling-constraints';

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
  available: boolean;
  reason?: string; // Why slot is unavailable
}

export interface AvailabilityOptions {
  date: Date;
  duration: number; // minutes
  userId?: string | undefined;
  instructorId?: string | undefined;
  includeUnavailable?: boolean | undefined; // Include unavailable slots with reasons
}

export interface DayAvailability {
  date: Date;
  slots: TimeSlot[];
  totalAvailableSlots: number;
  totalAvailableHours: number;
  constraints: {
    dailyLimitReached: boolean;
    weeklyLimitReached: boolean;
    outsideOperatingHours: boolean;
  };
}

export interface WeekAvailability {
  weekStart: Date;
  weekEnd: Date;
  days: DayAvailability[];
  totalWeeklyHours: number;
  remainingWeeklyHours: number;
  remainingWeeklyLessons: number;
}

export class AvailabilityCalculator {
  private constraints: SchedulingConstraints;

  constructor(constraints?: SchedulingConstraints) {
    this.constraints = constraints || schedulingValidator.getConstraints();
  }

  /**
   * Calculate available slots for a specific date
   */
  async calculateDayAvailability(
    options: AvailabilityOptions,
    existingBookings: ExistingBooking[] = []
  ): Promise<DayAvailability> {
    const { date, duration, userId, includeUnavailable = false } = options;
    
    // Get base time slots for the day
    const baseSlots = this.generateBaseTimeSlots(date, duration);
    
    // Filter out conflicting bookings
    const availableSlots = baseSlots.map(slot => {
      const conflicts = this.findConflicts(slot, existingBookings);
      const isAvailable = conflicts.length === 0;
      
      return {
        ...slot,
        available: isAvailable,
        reason: conflicts.length > 0 ? `Conflicts with existing booking` : undefined
      };
    });

    // Apply user-specific constraints if userId provided
    let constrainedSlots = availableSlots;
    let constraints = {
      dailyLimitReached: false,
      weeklyLimitReached: false,
      outsideOperatingHours: false
    };

    if (userId) {
      const userBookings = existingBookings.filter(b => b.userId === userId);
      constrainedSlots = this.applyUserConstraints(
        availableSlots, 
        date, 
        duration, 
        userBookings
      );
      
      constraints = this.checkUserConstraints(date, duration, userBookings);
    }

    // Filter out unavailable slots if not requested
    const finalSlots = includeUnavailable 
      ? constrainedSlots 
      : constrainedSlots.filter(slot => slot.available);

    const totalAvailableSlots = constrainedSlots.filter(slot => slot.available).length;
    const totalAvailableHours = (totalAvailableSlots * duration) / 60;

    return {
      date,
      slots: finalSlots,
      totalAvailableSlots,
      totalAvailableHours,
      constraints
    };
  }

  /**
   * Calculate availability for an entire week
   */
  async calculateWeekAvailability(
    weekStart: Date,
    duration: number,
    userId?: string,
    existingBookings: ExistingBooking[] = []
  ): Promise<WeekAvailability> {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const days: DayAvailability[] = [];

    // Calculate availability for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      
      const dayAvailability = await this.calculateDayAvailability(
        { date: currentDate, duration, userId },
        existingBookings
      );
      
      days.push(dayAvailability);
    }

    // Calculate weekly totals
    const totalWeeklyHours = days.reduce((total, day) => total + day.totalAvailableHours, 0);
    
    let remainingWeeklyHours = this.constraints.maxHoursPerWeek;
    let remainingWeeklyLessons = this.constraints.maxLessonsPerWeek;

    if (userId) {
      const weeklyBookings = existingBookings.filter(booking => 
        booking.userId === userId &&
        booking.status === 'confirmed' &&
        booking.startTime >= weekStart &&
        booking.startTime < weekEnd
      );

      const currentWeeklyHours = weeklyBookings.reduce((total, booking) => {
        return total + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
      }, 0);

      remainingWeeklyHours = Math.max(0, this.constraints.maxHoursPerWeek - currentWeeklyHours);
      remainingWeeklyLessons = Math.max(0, this.constraints.maxLessonsPerWeek - weeklyBookings.length);
    }

    return {
      weekStart,
      weekEnd,
      days,
      totalWeeklyHours,
      remainingWeeklyHours,
      remainingWeeklyLessons
    };
  }

  /**
   * Find the next available slot after a given date/time
   */
  findNextAvailableSlot(
    startFrom: Date,
    duration: number,
    existingBookings: ExistingBooking[] = [],
    userId?: string,
    maxDaysToSearch: number = 30
  ): TimeSlot | null {
    const searchEnd = new Date(startFrom.getTime() + maxDaysToSearch * 24 * 60 * 60 * 1000);
    const currentDate = new Date(startFrom);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= searchEnd) {
      const dayAvailability = this.calculateDayAvailability(
        { date: currentDate, duration, userId },
        existingBookings
      );

      const availableSlot = dayAvailability.then(day => 
        day.slots.find(slot => slot.available && slot.start >= startFrom)
      );

      if (availableSlot) {
        return availableSlot as any; // Type assertion for async resolution
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return null;
  }

  /**
   * Generate base time slots for a day based on operating hours and duration
   */
  private generateBaseTimeSlots(date: Date, duration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // Parse operating hours
    const [startHour, startMinute] = this.constraints.earliestStartTime.split(':').map(Number);
    const [endHour, endMinute] = this.constraints.latestEndTime.split(':').map(Number);
    
    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    // Generate slots with minimum buffer time
    let currentTime = new Date(dayStart);
    
    while (currentTime.getTime() + duration * 60 * 1000 <= dayEnd.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
      
      slots.push({
        start: new Date(currentTime),
        end: slotEnd,
        duration,
        available: true
      });

      // Move to next slot (duration + buffer time)
      currentTime = new Date(currentTime.getTime() + 
        (duration + this.constraints.minBufferBetweenLessons) * 60 * 1000);
    }

    return slots;
  }

  /**
   * Find conflicts between a time slot and existing bookings
   */
  private findConflicts(slot: TimeSlot, existingBookings: ExistingBooking[]): ExistingBooking[] {
    return existingBookings.filter(booking => 
      booking.status === 'confirmed' &&
      slot.start < booking.endTime && 
      slot.end > booking.startTime
    );
  }

  /**
   * Apply user-specific constraints to available slots
   */
  private applyUserConstraints(
    slots: TimeSlot[],
    date: Date,
    duration: number,
    userBookings: ExistingBooking[]
  ): TimeSlot[] {
    return slots.map(slot => {
      if (!slot.available) return slot;

      // Check daily limits
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dailyBookings = userBookings.filter(booking => 
        booking.status === 'confirmed' &&
        booking.startTime >= dayStart &&
        booking.startTime < dayEnd
      );

      const currentDailyHours = dailyBookings.reduce((total, booking) => {
        return total + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
      }, 0);

      const requestHours = duration / 60;

      if (currentDailyHours + requestHours > this.constraints.maxHoursPerDay) {
        return {
          ...slot,
          available: false,
          reason: 'Daily hour limit exceeded'
        };
      }

      if (dailyBookings.length >= this.constraints.maxLessonsPerDay) {
        return {
          ...slot,
          available: false,
          reason: 'Daily lesson limit exceeded'
        };
      }

      // Check weekly limits
      const weekStart = this.getWeekStart(date);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weeklyBookings = userBookings.filter(booking => 
        booking.status === 'confirmed' &&
        booking.startTime >= weekStart &&
        booking.startTime < weekEnd
      );

      const currentWeeklyHours = weeklyBookings.reduce((total, booking) => {
        return total + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
      }, 0);

      if (currentWeeklyHours + requestHours > this.constraints.maxHoursPerWeek) {
        return {
          ...slot,
          available: false,
          reason: 'Weekly hour limit exceeded'
        };
      }

      if (weeklyBookings.length >= this.constraints.maxLessonsPerWeek) {
        return {
          ...slot,
          available: false,
          reason: 'Weekly lesson limit exceeded'
        };
      }

      // Check buffer constraints
      const conflictingBookings = userBookings.filter(booking => 
        booking.status === 'confirmed' &&
        this.hasBufferConflict(slot, booking)
      );

      if (conflictingBookings.length > 0) {
        return {
          ...slot,
          available: false,
          reason: 'Insufficient buffer time between lessons'
        };
      }

      return slot;
    });
  }

  /**
   * Check if a slot has buffer time conflicts with a booking
   */
  private hasBufferConflict(slot: TimeSlot, booking: ExistingBooking): boolean {
    const bufferBefore = (slot.start.getTime() - booking.endTime.getTime()) / (1000 * 60);
    const bufferAfter = (booking.startTime.getTime() - slot.end.getTime()) / (1000 * 60);

    return (bufferBefore > 0 && bufferBefore < this.constraints.minBufferBetweenLessons) ||
           (bufferAfter > 0 && bufferAfter < this.constraints.minBufferBetweenLessons);
  }

  /**
   * Check user constraints for a specific date
   */
  private checkUserConstraints(
    date: Date,
    duration: number,
    userBookings: ExistingBooking[]
  ) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dailyBookings = userBookings.filter(booking => 
      booking.status === 'confirmed' &&
      booking.startTime >= dayStart &&
      booking.startTime < dayEnd
    );

    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weeklyBookings = userBookings.filter(booking => 
      booking.status === 'confirmed' &&
      booking.startTime >= weekStart &&
      booking.startTime < weekEnd
    );

    const currentDailyHours = dailyBookings.reduce((total, booking) => {
      return total + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
    }, 0);

    const currentWeeklyHours = weeklyBookings.reduce((total, booking) => {
      return total + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
    }, 0);

    const requestHours = duration / 60;

    return {
      dailyLimitReached: currentDailyHours + requestHours > this.constraints.maxHoursPerDay ||
                        dailyBookings.length >= this.constraints.maxLessonsPerDay,
      weeklyLimitReached: currentWeeklyHours + requestHours > this.constraints.maxHoursPerWeek ||
                         weeklyBookings.length >= this.constraints.maxLessonsPerWeek,
      outsideOperatingHours: this.isOutsideOperatingHours(date)
    };
  }

  /**
   * Check if a date is outside operating hours
   */
  private isOutsideOperatingHours(date: Date): boolean {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeMinutes = hour * 60 + minute;

    // Safely parse time strings with validation
    const parseTimeString = (timeString: string): { hour: number; minute: number } => {
      const parts = timeString.split(':');
      const hour = parts[0] ? parseInt(parts[0], 10) : 0;
      const minute = parts[1] ? parseInt(parts[1], 10) : 0;
      return {
        hour: isNaN(hour) ? 0 : hour,
        minute: isNaN(minute) ? 0 : minute
      };
    };

    const startTime = parseTimeString(this.constraints.earliestStartTime);
    const endTime = parseTimeString(this.constraints.latestEndTime);

    const startMinutes = startTime.hour * 60 + startTime.minute;
    const endMinutes = endTime.hour * 60 + endTime.minute;

    return timeMinutes < startMinutes || timeMinutes > endMinutes;
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Update constraints
   */
  updateConstraints(constraints: SchedulingConstraints): void {
    this.constraints = constraints;
  }

  /**
   * Get current constraints
   */
  getConstraints(): SchedulingConstraints {
    return { ...this.constraints };
  }
}

// Export singleton instance
export const availabilityCalculator = new AvailabilityCalculator();

// Utility functions
export const formatAvailabilitySlot = (slot: TimeSlot): string => {
  const formatTime = (date: Date) => 
    date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  
  return `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
};

export const getAvailabilityStats = (availability: DayAvailability) => {
  const totalSlots = availability.slots.length;
  const availableSlots = availability.slots.filter(slot => slot.available).length;
  const unavailableSlots = totalSlots - availableSlots;
  
  return {
    totalSlots,
    availableSlots,
    unavailableSlots,
    availabilityRate: totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0
  };
};
