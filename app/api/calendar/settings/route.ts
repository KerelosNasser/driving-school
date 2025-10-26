import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function GET(_request: NextRequest) {
  try {
    const calendarService = new EnhancedCalendarService();
    const settings = await calendarService.getSettings();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching calendar settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const calendarService = new EnhancedCalendarService();
    const updatedSettings = await calendarService.updateSettings(body);
    
    return NextResponse.json({
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating calendar settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update calendar settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}