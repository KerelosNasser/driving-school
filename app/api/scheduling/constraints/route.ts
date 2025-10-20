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

// GET /api/scheduling/constraints - Get instructor constraints
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
  const cacheKey = CacheService.keys.constraints(instructorId)
  const cached = await CacheService.get(cacheKey)
  if (cached) {
    return NextResponse.json({ constraints: cached })
  }

  const { data: constraints, error } = await supabase
    .from('scheduling_constraints')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('start_date', { ascending: true })

  if (error) {
    throw new Error('Failed to fetch constraints')
  }

  // Cache the result
  await CacheService.set(cacheKey, constraints, CacheService.TTL.MEDIUM)

  return NextResponse.json({ constraints })
})

// POST /api/scheduling/constraints - Create new constraint
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
    constraint_type: 'string',
    start_date: 'string',
    end_date: 'string',
    start_time: 'string',
    end_time: 'string',
    reason: 'string'
  })

  if (!validation.success) {
    throw new ValidationError('Invalid constraint data')
  }

  const constraintData = {
    instructor_id: userId,
    constraint_type: body.constraint_type,
    start_date: body.start_date,
    end_date: body.end_date,
    start_time: body.start_time || null,
    end_time: body.end_time || null,
    reason: body.reason || null
  }

  const { data: constraint, error } = await supabase
    .from('scheduling_constraints')
    .insert(constraintData)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create constraint')
  }

  // Invalidate cache
  await CacheService.del(CacheService.keys.constraints(userId))
  await CacheService.del(CacheService.keys.availability(userId, '*'))

  return NextResponse.json({ constraint }, { status: 201 })
})

// PUT /api/scheduling/constraints - Update constraint
export const PUT = asyncHandler(async (req: NextRequest) => {
  const { userId } = await auth()
  if (!userId) {
    throw new AuthenticationError()
  }

  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) {
    throw new ValidationError('Constraint ID is required')
  }

  // Check if constraint exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('scheduling_constraints')
    .select('instructor_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new NotFoundError('Constraint not found')
  }

  if (existing.instructor_id !== userId) {
    throw new AuthenticationError('Not authorized to update this constraint')
  }

  const { data: constraint, error } = await supabase
    .from('scheduling_constraints')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update constraint')
  }

  // Invalidate cache
  await CacheService.del(CacheService.keys.constraints(userId))
  await CacheService.del(CacheService.keys.availability(userId, '*'))

  return NextResponse.json({ constraint })
})

// DELETE /api/scheduling/constraints - Delete constraint
export const DELETE = asyncHandler(async (req: NextRequest) => {
  const { userId } = await auth()
  if (!userId) {
    throw new AuthenticationError()
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('Constraint ID is required')
  }

  // Check if constraint exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('scheduling_constraints')
    .select('instructor_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new NotFoundError('Constraint not found')
  }

  if (existing.instructor_id !== userId) {
    throw new AuthenticationError('Not authorized to delete this constraint')
  }

  const { error } = await supabase
    .from('scheduling_constraints')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Failed to delete constraint')
  }

  // Invalidate cache
  await CacheService.del(CacheService.keys.constraints(userId))
  await CacheService.del(CacheService.keys.availability(userId, '*'))

  return NextResponse.json({ message: 'Constraint deleted successfully' })
})