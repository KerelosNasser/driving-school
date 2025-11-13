import { NextRequest, NextResponse } from 'next/server'
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date().toISOString()
    const durationParam = searchParams.get('durationMinutes')
    const bufferParam = searchParams.get('bufferMinutes')

    const service = new EnhancedCalendarService()
    const settings = await service.getSettings()
    const durationMinutes = durationParam ? parseInt(durationParam, 10) : settings.lessonDurationMinutes
    const bufferMinutes = bufferParam ? parseInt(bufferParam, 10) : settings.bufferTimeMinutes

    const next = await service.getNextAvailableSlot(startDate, durationMinutes, bufferMinutes)
    if (!next) {
      return NextResponse.json({ success: true, next: null })
    }
    return NextResponse.json({ success: true, next })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to compute next available slot', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
