import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transformToFrontendSettings } from '@/lib/calendar/calendar-settings-schema';
import { formatDateInTimezone, DEFAULT_TIMEZONE } from '@/lib/calendar/date-utils';

// Create Supabase client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_request: NextRequest) {
  try {
    console.log('📡 [API /calendar/settings] GET request received');
    
    const supabase = getSupabaseAdmin();
    
    // Get raw settings from database
    const { data: dbSettings, error: dbError } = await supabase
      .from('calendar_settings')
      .select('*')
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') {
      console.error('❌ [API /calendar/settings] Database error:', dbError);
      throw dbError;
    }
    
    // Get vacation days with proper date formatting
    const { data: vacationDaysRaw, error: vacationError } = await supabase
      .from('vacation_days')
      .select('date, reason')
      .order('date', { ascending: true });
    
    if (vacationError) {
      console.error('⚠️ [API /calendar/settings] Vacation days error:', vacationError);
    }
    
    // Transform database settings to frontend format
    const settings = transformToFrontendSettings(dbSettings || {});
    
    // Format vacation days properly using timezone-aware formatting
    const vacationDays = (vacationDaysRaw || []).map((v: any) => {
      // Ensure date is in YYYY-MM-DD format in the correct timezone
      if (typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date)) {
        return v.date;
      }
      // If it's a Date object or ISO string, format it properly
      return formatDateInTimezone(new Date(v.date), DEFAULT_TIMEZONE);
    });
    
    const vacationDaysDetails = (vacationDaysRaw || []).map((v: any) => ({
      date: typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date)
        ? v.date
        : formatDateInTimezone(new Date(v.date), DEFAULT_TIMEZONE),
      reason: v.reason || '',
    }));
    
    // Combine settings with vacation days
    const response = {
      ...settings,
      vacationDays,
      vacationDaysDetails,
      timezone: DEFAULT_TIMEZONE,
      updatedAt: dbSettings?.updated_at || new Date().toISOString(),
    };
    
    console.log('✅ [API /calendar/settings] Returning settings:', {
      bufferTime: response.bufferTimeMinutes,
      workingDays: response.workingDays,
      vacationDaysCount: response.vacationDays.length,
      timezone: response.timezone,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API /calendar/settings] Error:', error);
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