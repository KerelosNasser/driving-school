import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { asyncHandler, AuthenticationError, ValidationError } from '@/lib/error-handler'
import { validateRequest } from '@/lib/validation/schemas'
import { checkRateLimit } from '@/lib/rate-limit-enhanced'
import CacheService from '@/lib/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/scheduling/availability - Check instructor availability
export const GET = asyncHandler(async (req: NextRequest) => {
  // Rate limiting
  const rateLimitResult = await checkRateLimit(req)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: rateLimitResult.headers
      }
    )
  }

  const { userId } = await auth()
  if (!userId) {
    throw new AuthenticationError()
  }

  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get('instructorId')
  const date = searchParams.get('date')
  const startTime = searchParams.get('startTime')
  const endTime = searchParams.get('endTime')

  if (!instructorId || !date) {
    throw new ValidationError('Instructor ID and date are required')
  }

  // Check cache first for availability data
  const cacheKey = CacheService.keys.availability(instructorId, date)
  const cached = await CacheService.get(cacheKey)
  
  if (cached && !startTime && !endTime) {
    return NextResponse.json({ availability: cached })
  }

  // If checking specific time slot
  if (startTime && endTime) {
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = new Date(`${date}T${endTime}`)

    // Use the database function to check availability
    const { data: isAvailable, error } = await supabase
      .rpc('check_time_slot_availability', {
        p_instructor_id: instructorId,
        p_start_time: startDateTime.toISOString(),
        p_end_time: endDateTime.toISOString()
      })

    if (error) {
      throw new Error('Failed to check availability')
    }

    return NextResponse.json({ 
      available: isAvailable,
      timeSlot: { startTime, endTime, date }
    })
  }

  // Generate available time slots for the day
  const availableSlots = await generateAvailableSlots(instructorId, date)

  // Cache the result
  await CacheService.set(cacheKey, availableSlots, CacheService.TTL.SHORT)

  return NextResponse.json({ availability: availableSlots })
})

async function generateAvailableSlots(instructorId: string, date: string) {
  const dayOfWeek = new Date(date).getDay()
  
  // Get working hours for the day
  const { data: workingHours, error: whError } = await supabase
    .from('working_hours')
    .select('start_time, end_time')
    .eq('instructor_id', instructorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single()

  if (whError || !workingHours) {
    return [] // No working hours set for this day
  }

  // Get constraints for the date
  const { data: constraints, error: constraintsError } = await supabase
    .from('scheduling_constraints')
    .select('start_time, end_time, constraint_type')
    .eq('instructor_id', instructorId)
    .lte('start_date', date)
    .gte('end_date', date)

  if (constraintsError) {
    throw new Error('Failed to fetch constraints')
  }

  // Get existing bookings for the date
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('instructor_id', instructorId)
    .gte('start_time', `${date}T00:00:00`)
    .lt('start_time', `${date}T23:59:59`)
    .in('status', ['scheduled', 'confirmed'])

  if (bookingsError) {
    // Could not fetch bookings - continue with empty bookings array
  }

  // Generate time slots (1-hour intervals)
  const slots = []
  const startHour = parseInt(workingHours.start_time.split(':')[0])
  const endHour = parseInt(workingHours.end_time.split(':')[0])

  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = `${hour.toString().padStart(2, '0')}:00`
    const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`
    
    // Check if slot conflicts with constraints
    const hasConstraint = constraints?.some(constraint => {
      if (constraint.constraint_type === 'unavailable' || constraint.constraint_type === 'blocked') {
        const constraintStart = constraint.start_time || '00:00'
        const constraintEnd = constraint.end_time || '23:59'
        return slotStart >= constraintStart && slotEnd <= constraintEnd
      }
      return false
    })

    // Check if slot conflicts with existing bookings
    const hasBooking = bookings?.some(booking => {
      const bookingStart = new Date(booking.start_time).toTimeString().slice(0, 5)
      const bookingEnd = new Date(booking.end_time).toTimeString().slice(0, 5)
      return slotStart < bookingEnd && slotEnd > bookingStart
    })

    if (!hasConstraint && !hasBooking) {
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: true
      })
    }
  }

  return slots
}