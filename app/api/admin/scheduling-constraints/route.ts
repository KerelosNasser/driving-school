import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  SchedulingConstraints, 
  DEFAULT_CONSTRAINTS,
  schedulingValidator 
} from '@/lib/calendar/scheduling-constraints';

/**
 * GET /api/admin/scheduling-constraints
 * Retrieve current scheduling constraints
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Try to get constraints from database
    const { data: constraintsData, error: constraintsError } = await supabase
      .from('scheduling_constraints')
      .select('*')
      .single();

    let constraints: SchedulingConstraints;

    if (constraintsError || !constraintsData) {
      // Return default constraints if none exist
      constraints = DEFAULT_CONSTRAINTS;
    } else {
      // Parse constraints from database
      constraints = {
        maxHoursPerWeek: constraintsData.max_hours_per_week,
        maxLessonsPerWeek: constraintsData.max_lessons_per_week,
        maxConsecutiveLessons: constraintsData.max_consecutive_lessons,
        maxHoursPerDay: constraintsData.max_hours_per_day,
        maxLessonsPerDay: constraintsData.max_lessons_per_day,
        earliestStartTime: constraintsData.earliest_start_time,
        latestEndTime: constraintsData.latest_end_time,
        minBufferBetweenLessons: constraintsData.min_buffer_between_lessons,
        maxBufferBetweenLessons: constraintsData.max_buffer_between_lessons,
        minLessonDuration: constraintsData.min_lesson_duration,
        maxLessonDuration: constraintsData.max_lesson_duration,
        allowedDurations: constraintsData.allowed_durations || DEFAULT_CONSTRAINTS.allowedDurations,
        maxAdvanceBookingDays: constraintsData.max_advance_booking_days,
        minAdvanceBookingHours: constraintsData.min_advance_booking_hours,
        maxInstructorHoursPerDay: constraintsData.max_instructor_hours_per_day,
        requiredBreakAfterHours: constraintsData.required_break_after_hours,
        minBreakDuration: constraintsData.min_break_duration
      };
    }

    return NextResponse.json({
      constraints,
      isDefault: constraintsError || !constraintsData
    });

  } catch (error) {
    console.error('Error fetching scheduling constraints:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/scheduling-constraints
 * Update scheduling constraints
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const constraints: SchedulingConstraints = body.constraints;

    // Validate constraints
    if (!constraints || typeof constraints !== 'object') {
      return NextResponse.json(
        { error: 'Invalid constraints data' },
        { status: 400 }
      );
    }

    // Validate constraint values
    const validationErrors = validateConstraints(constraints);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid constraint values', details: validationErrors },
        { status: 400 }
      );
    }

    // Prepare data for database
    const constraintsData = {
      max_hours_per_week: constraints.maxHoursPerWeek,
      max_lessons_per_week: constraints.maxLessonsPerWeek,
      max_consecutive_lessons: constraints.maxConsecutiveLessons,
      max_hours_per_day: constraints.maxHoursPerDay,
      max_lessons_per_day: constraints.maxLessonsPerDay,
      earliest_start_time: constraints.earliestStartTime,
      latest_end_time: constraints.latestEndTime,
      min_buffer_between_lessons: constraints.minBufferBetweenLessons,
      max_buffer_between_lessons: constraints.maxBufferBetweenLessons,
      min_lesson_duration: constraints.minLessonDuration,
      max_lesson_duration: constraints.maxLessonDuration,
      allowed_durations: constraints.allowedDurations,
      max_advance_booking_days: constraints.maxAdvanceBookingDays,
      min_advance_booking_hours: constraints.minAdvanceBookingHours,
      max_instructor_hours_per_day: constraints.maxInstructorHoursPerDay,
      required_break_after_hours: constraints.requiredBreakAfterHours,
      min_break_duration: constraints.minBreakDuration,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    // Try to update existing constraints or insert new ones
    const { data, error } = await supabase
      .from('scheduling_constraints')
      .upsert(constraintsData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving constraints:', error);
      return NextResponse.json(
        { error: 'Failed to save constraints' },
        { status: 500 }
      );
    }

    // Update the validator with new constraints
    schedulingValidator.updateConstraints(constraints);

    return NextResponse.json({
      message: 'Constraints updated successfully',
      constraints,
      updatedAt: data.updated_at
    });

  } catch (error) {
    console.error('Error updating scheduling constraints:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/scheduling-constraints/reset
 * Reset constraints to defaults
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Delete existing constraints to reset to defaults
    const { error: deleteError } = await supabase
      .from('scheduling_constraints')
      .delete()
      .neq('id', 0); // Delete all rows

    if (deleteError) {
      console.error('Error resetting constraints:', deleteError);
      return NextResponse.json(
        { error: 'Failed to reset constraints' },
        { status: 500 }
      );
    }

    // Update the validator with default constraints
    schedulingValidator.updateConstraints(DEFAULT_CONSTRAINTS);

    return NextResponse.json({
      message: 'Constraints reset to defaults',
      constraints: DEFAULT_CONSTRAINTS
    });

  } catch (error) {
    console.error('Error resetting scheduling constraints:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate constraint values
 */
function validateConstraints(constraints: SchedulingConstraints): string[] {
  const errors: string[] = [];

  // Weekly limits validation
  if (constraints.maxHoursPerWeek < 1 || constraints.maxHoursPerWeek > 40) {
    errors.push('Max hours per week must be between 1 and 40');
  }
  
  if (constraints.maxLessonsPerWeek < 1 || constraints.maxLessonsPerWeek > 20) {
    errors.push('Max lessons per week must be between 1 and 20');
  }
  
  if (constraints.maxConsecutiveLessons < 1 || constraints.maxConsecutiveLessons > 5) {
    errors.push('Max consecutive lessons must be between 1 and 5');
  }

  // Daily limits validation
  if (constraints.maxHoursPerDay < 1 || constraints.maxHoursPerDay > 12) {
    errors.push('Max hours per day must be between 1 and 12');
  }
  
  if (constraints.maxLessonsPerDay < 1 || constraints.maxLessonsPerDay > 10) {
    errors.push('Max lessons per day must be between 1 and 10');
  }

  // Time format validation
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(constraints.earliestStartTime)) {
    errors.push('Earliest start time must be in HH:mm format');
  }
  
  if (!timeRegex.test(constraints.latestEndTime)) {
    errors.push('Latest end time must be in HH:mm format');
  }

  // Buffer time validation
  if (constraints.minBufferBetweenLessons < 0 || constraints.minBufferBetweenLessons > 120) {
    errors.push('Min buffer time must be between 0 and 120 minutes');
  }
  
  if (constraints.maxBufferBetweenLessons < constraints.minBufferBetweenLessons || constraints.maxBufferBetweenLessons > 240) {
    errors.push('Max buffer time must be greater than min buffer and less than 240 minutes');
  }

  // Duration validation
  if (constraints.minLessonDuration < 30 || constraints.minLessonDuration > 240) {
    errors.push('Min lesson duration must be between 30 and 240 minutes');
  }
  
  if (constraints.maxLessonDuration < constraints.minLessonDuration || constraints.maxLessonDuration > 480) {
    errors.push('Max lesson duration must be greater than min duration and less than 480 minutes');
  }

  // Allowed durations validation
  if (!Array.isArray(constraints.allowedDurations) || constraints.allowedDurations.length === 0) {
    errors.push('At least one allowed duration must be specified');
  }
  
  for (const duration of constraints.allowedDurations) {
    if (duration < constraints.minLessonDuration || duration > constraints.maxLessonDuration) {
      errors.push(`Allowed duration ${duration} is outside the min/max range`);
    }
  }

  // Booking advance validation
  if (constraints.maxAdvanceBookingDays < 1 || constraints.maxAdvanceBookingDays > 90) {
    errors.push('Max advance booking days must be between 1 and 90');
  }
  
  if (constraints.minAdvanceBookingHours < 1 || constraints.minAdvanceBookingHours > 168) {
    errors.push('Min advance booking hours must be between 1 and 168');
  }

  // Instructor constraints validation
  if (constraints.maxInstructorHoursPerDay < 4 || constraints.maxInstructorHoursPerDay > 12) {
    errors.push('Max instructor hours per day must be between 4 and 12');
  }
  
  if (constraints.requiredBreakAfterHours < 2 || constraints.requiredBreakAfterHours > 8) {
    errors.push('Required break after hours must be between 2 and 8');
  }
  
  if (constraints.minBreakDuration < 15 || constraints.minBreakDuration > 120) {
    errors.push('Min break duration must be between 15 and 120 minutes');
  }

  return errors;
}
