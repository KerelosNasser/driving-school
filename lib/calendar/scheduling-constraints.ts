import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export interface SchedulingConstraint {
  id: string;
  instructor_id: string;
  constraint_type: 'unavailable' | 'preferred' | 'blocked';
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  id: string;
  instructor_id: string;
  day_of_week: number; // 0-6, Sunday to Saturday
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchedulingConstraints {
  max_hours_per_week: number;
  max_lessons_per_week: number;
  max_consecutive_lessons: number;
  max_hours_per_day: number;
  max_lessons_per_day: number;
  earliest_start_time: string;
  latest_end_time: string;
  min_buffer_between_lessons: number;
  max_buffer_between_lessons: number;
  min_lesson_duration: number;
  max_lesson_duration: number;
  allowed_durations: number[];
  max_advance_booking_days: number;
  min_advance_booking_hours: number;
  max_instructor_hours_per_day: number;
  required_break_after_hours: number;
  min_break_duration: number;
}

// Default scheduling constraints
export const DEFAULT_CONSTRAINTS: SchedulingConstraints = {
  max_hours_per_week: 40,
  max_lessons_per_week: 30,
  max_consecutive_lessons: 4,
  max_hours_per_day: 8,
  max_lessons_per_day: 8,
  earliest_start_time: '07:00',
  latest_end_time: '19:00',
  min_buffer_between_lessons: 15,
  max_buffer_between_lessons: 60,
  min_lesson_duration: 60,
  max_lesson_duration: 180,
  allowed_durations: [60, 90, 120, 180],
  max_advance_booking_days: 30,
  min_advance_booking_hours: 24,
  max_instructor_hours_per_day: 8,
  required_break_after_hours: 4,
  min_break_duration: 30,
};

// Zod validator for scheduling constraints
export const schedulingValidator = z.object({
  max_hours_per_week: z.number().min(1).max(168),
  max_lessons_per_week: z.number().min(1).max(100),
  max_consecutive_lessons: z.number().min(1).max(10),
  max_hours_per_day: z.number().min(1).max(24),
  max_lessons_per_day: z.number().min(1).max(20),
  earliest_start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  latest_end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  min_buffer_between_lessons: z.number().min(0).max(120),
  max_buffer_between_lessons: z.number().min(0).max(240),
  min_lesson_duration: z.number().min(30).max(480),
  max_lesson_duration: z.number().min(30).max(480),
  allowed_durations: z.array(z.number().min(30).max(480)),
  max_advance_booking_days: z.number().min(1).max(365),
  min_advance_booking_hours: z.number().min(1).max(168),
  max_instructor_hours_per_day: z.number().min(1).max(24),
  required_break_after_hours: z.number().min(1).max(12),
  min_break_duration: z.number().min(15).max(120),
});

export class SchedulingConstraintsManager {
  async getConstraints(): Promise<SchedulingConstraints | null> {
    try {
      const { data, error } = await supabase
        .from('scheduling_constraints')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching scheduling constraints:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getConstraints:', error);
      return null;
    }
  }

  async updateConstraints(constraints: Partial<SchedulingConstraints>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduling_constraints')
        .update(constraints)
        .eq('id', 1); // Assuming single row configuration

      if (error) {
        console.error('Error updating scheduling constraints:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConstraints:', error);
      return false;
    }
  }

  async getInstructorConstraints(instructorId: string): Promise<SchedulingConstraint[]> {
    try {
      const { data, error } = await supabase
        .from('scheduling_constraints')
        .select('*')
        .eq('instructor_id', instructorId);

      if (error) {
        console.error('Error fetching instructor constraints:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInstructorConstraints:', error);
      return [];
    }
  }

  async addInstructorConstraint(constraint: Omit<SchedulingConstraint, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduling_constraints')
        .insert([constraint]);

      if (error) {
        console.error('Error adding instructor constraint:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addInstructorConstraint:', error);
      return false;
    }
  }

  async getWorkingHours(instructorId: string): Promise<WorkingHours[]> {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching working hours:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWorkingHours:', error);
      return [];
    }
  }

  async updateWorkingHours(instructorId: string, workingHours: Omit<WorkingHours, 'id' | 'instructor_id' | 'created_at' | 'updated_at'>[]): Promise<boolean> {
    try {
      // First, deactivate all existing working hours
      await supabase
        .from('working_hours')
        .update({ is_active: false })
        .eq('instructor_id', instructorId);

      // Then insert new working hours
      const hoursWithInstructor = workingHours.map(hours => ({
        ...hours,
        instructor_id: instructorId,
        is_active: true
      }));

      const { error } = await supabase
        .from('working_hours')
        .insert(hoursWithInstructor);

      if (error) {
        console.error('Error updating working hours:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateWorkingHours:', error);
      return false;
    }
  }

  async checkTimeSlotAvailability(
    instructorId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_time_slot_availability', {
          p_instructor_id: instructorId,
          p_start_time: startTime,
          p_end_time: endTime
        });

      if (error) {
        console.error('Error checking time slot availability:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in checkTimeSlotAvailability:', error);
      return false;
    }
  }
}

export const schedulingConstraintsManager = new SchedulingConstraintsManager();