import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { asyncHandler, AuthenticationError, ValidationError, NotFoundError } from '@/lib/error-handler'
import { validateRequest } from '@/lib/validation/schemas'
import { checkRateLimit } from '@/lib/rate-limit-enhanced'
import CacheService from '@/lib/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/scheduling/working-hours - Get instructor working hours
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
  const instructorId = searchParams.get('instructorId') || userId

  // Check cache first
  const cacheKey = CacheService.keys.workingHours(instructorId)
  const cached = await CacheService.get(cacheKey)
  if (cached) {
    return NextResponse.json({ workingHours: cached })
  }

  const { data: workingHours, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('day_of_week', { ascending: true })

  if (error) {
    throw new Error('Failed to fetch working hours')
  }

  // Cache the result
  await CacheService.set(cacheKey, workingHours, CacheService.TTL.LONG)

  return NextResponse.json({ workingHours })
})

// POST /api/scheduling/working-hours - Create or update working hours
export const POST = asyncHandler(async (req: NextRequest) => {
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

  const body = await req.json()
  
  // Validate input
  const validation = validateRequest(body, {
    day_of_week: 'number',
    start_time: 'string',
    end_time: 'string',
    is_active: 'boolean'
  })

  if (!validation.success) {
    throw new ValidationError('Invalid working hours data')
  }

  if (body.day_of_week < 0 || body.day_of_week > 6) {
    throw new ValidationError('Day of week must be between 0 and 6')
  }

  const workingHoursData = {
    instructor_id: userId,
    day_of_week: body.day_of_week,
    start_time: body.start_time,
    end_time: body.end_time,
    is_active: body.is_active ?? true
  }

  // Use upsert to handle create or update
  const { data: workingHours, error } = await supabase
    .from('working_hours')
    .upsert(workingHoursData, {
      onConflict: 'instructor_id,day_of_week'
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to save working hours')
  }

  // Invalidate cache
  await CacheService.del(CacheService.keys.workingHours(userId))
  await CacheService.del(CacheService.keys.availability(userId, '*'))

  return NextResponse.json({ workingHours }, { status: 201 })
})

// DELETE /api/scheduling/working-hours - Delete working hours for a day
export const DELETE = asyncHandler(async (req: NextRequest) => {
  const { userId } = await auth()
  if (!userId) {
    throw new AuthenticationError()
  }

  const { searchParams } = new URL(req.url)
  const dayOfWeek = searchParams.get('dayOfWeek')

  if (!dayOfWeek) {
    throw new ValidationError('Day of week is required')
  }

  const dayNum = parseInt(dayOfWeek)
  if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
    throw new ValidationError('Day of week must be between 0 and 6')
  }

  const { error } = await supabase
    .from('working_hours')
    .delete()
    .eq('instructor_id', userId)
    .eq('day_of_week', dayNum)

  if (error) {
    throw new Error('Failed to delete working hours')
  }

  // Invalidate cache
  await CacheService.del(CacheService.keys.workingHours(userId))
  await CacheService.del(CacheService.keys.availability(userId, '*'))

  return NextResponse.json({ message: 'Working hours deleted successfully' })
})