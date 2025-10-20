import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SchedulingConstraint {
  id: string
  instructorId: string
  constraintType: 'unavailable' | 'preferred' | 'blocked'
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  reason?: string
}

export interface WorkingHours {
  id: string
  instructorId: string
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  startTime: string
  endTime: string
  isActive: boolean
}

export class SchedulingService {
  // Get instructor constraints
  async getInstructorConstraints(instructorId: string): Promise<SchedulingConstraint[]> {
    const { data, error } = await supabase
      .from('scheduling_constraints')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('start_date')

    if (error) throw error
    return data || []
  }

  // Create constraint
  async createConstraint(constraint: Omit<SchedulingConstraint, 'id'>): Promise<SchedulingConstraint> {
    const { data, error } = await supabase
      .from('scheduling_constraints')
      .insert({
        instructor_id: constraint.instructorId,
        constraint_type: constraint.constraintType,
        start_date: constraint.startDate,
        end_date: constraint.endDate,
        start_time: constraint.startTime,
        end_time: constraint.endTime,
        reason: constraint.reason,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get working hours
  async getWorkingHours(instructorId: string): Promise<WorkingHours[]> {
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .order('day_of_week')

    if (error) throw error
    return data || []
  }

  // Set working hours
  async setWorkingHours(workingHours: Omit<WorkingHours, 'id'>): Promise<WorkingHours> {
    const { data, error } = await supabase
      .from('working_hours')
      .upsert({
        instructor_id: workingHours.instructorId,
        day_of_week: workingHours.dayOfWeek,
        start_time: workingHours.startTime,
        end_time: workingHours.endTime,
        is_active: workingHours.isActive,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Check if time slot is available
  async isTimeSlotAvailable(
    instructorId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_time_slot_availability', {
        p_instructor_id: instructorId,
        p_start_time: startTime,
        p_end_time: endTime,
      })

    if (error) throw error
    return data
  }

  // Get available time slots for a day
  async getAvailableSlots(
    instructorId: string,
    date: string,
    duration: number = 60 // minutes
  ): Promise<{ startTime: string; endTime: string }[]> {
    const dayOfWeek = new Date(date).getDay()
    
    // Get working hours for the day
    const workingHours = await this.getWorkingHours(instructorId)
    const dayHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek)
    
    if (!dayHours) return []

    // Get existing bookings and constraints
    const constraints = await this.getInstructorConstraints(instructorId)
    
    // Generate available slots (simplified logic)
    const slots: { startTime: string; endTime: string }[] = []
    const startHour = parseInt(dayHours.startTime.split(':')[0])
    const endHour = parseInt(dayHours.endTime.split(':')[0])
    
    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = `${date}T${hour.toString().padStart(2, '0')}:00:00`
      const slotEnd = `${date}T${(hour + Math.floor(duration / 60)).toString().padStart(2, '0')}:00:00`
      
      const isAvailable = await this.isTimeSlotAvailable(instructorId, slotStart, slotEnd)
      if (isAvailable) {
        slots.push({ startTime: slotStart, endTime: slotEnd })
      }
    }
    
    return slots
  }
}