import { TokenManager } from '@/lib/oauth/token-manager';
import { createClient } from '@supabase/supabase-js';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  status: string;
  attendees: any[];
  creator: any;
  organizer: any;
  htmlLink: string;
  hangoutLink: string;
  recurringEventId: string;
  originalStartTime: any;
  transparency: string;
  visibility: string;
  reminders: any;
  created: string;
  updated: string;
  hidden?: boolean; // Added for marking hidden events
}

export interface CreateEventData {
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  description?: string;
  location?: string;
  attendees?: any[];
  reminders?: any;
}

export interface BookingSettings {
  bufferTimeMinutes: number;
  maxBookingsPerDay: number;
  workingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  workingDays: number[]; // 0-6, Sunday = 0
  vacationDays: string[]; // ISO date strings
  lessonDurationMinutes: number;
}

export interface TimeSlot {
  id?: string;
  start: string;
  end: string;
  time?: string;
  available: boolean;
  reason?: string;
  eventId?: string;
}

export interface BookingRequest {
  date: string; // ISO date string
  time: string; // HH:MM format
  duration?: number; // minutes, defaults to settings
  studentName: string;
  studentEmail: string;
  lessonType: string;
  notes?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  eventsProcessed: number;
  errors: string[];
  lastSyncTime: string;
}

export interface CalendarConnectionStatus {
  connected: boolean;
  message: string;
  calendar?: {
    id: string;
    summary: string;
    timeZone: string;
    accessRole: string;
  };
}

export class EnhancedCalendarService {
  private readonly DEFAULT_TIMEZONE = 'Australia/Brisbane';
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  private settingsLoaded = false;
  private workingHoursByDay: Record<number, { start: string; end: string; enabled: boolean }> = {
    0: { start: '10:00', end: '16:00', enabled: false }, // Sunday
    1: { start: '09:00', end: '17:00', enabled: true },  // Monday
    2: { start: '09:00', end: '17:00', enabled: true },  // Tuesday
    3: { start: '09:00', end: '17:00', enabled: true },  // Wednesday
    4: { start: '09:00', end: '17:00', enabled: true },  // Thursday
    5: { start: '09:00', end: '17:00', enabled: true },  // Friday
    6: { start: '10:00', end: '16:00', enabled: false }  // Saturday
  };
  
  // Helper: create an authenticated Calendar API client using service account
  private async getCalendarClient(): Promise<any> {
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      throw new Error('Calendar not connected or tokens expired');
    }
    const { google } = await import('googleapis');
    return google.calendar({ version: 'v3', auth: authClient });
  }
  // Resolve a single calendar ID to use consistently across reads/writes
  private getCalendarId(): string {
    const id = process.env.GOOGLE_CALENDAR_ID;
    if (!id) {
      throw new Error('GOOGLE_CALENDAR_ID is not configured');
    }
    return id;
  }

  // Default booking settings
  private readonly DEFAULT_SETTINGS: BookingSettings = {
    bufferTimeMinutes: 30,
    maxBookingsPerDay: 8,
    workingHours: { start: '09:00', end: '17:00' },
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    vacationDays: [],
    lessonDurationMinutes: 60
  };

  private settings: BookingSettings;

  constructor() {
    this.settings = { ...this.DEFAULT_SETTINGS };
  }

  /**
   * Load calendar settings and vacation days from Supabase (if available)
   * @param forceReload - Force reload settings even if already loaded
   */
  private async ensureSettingsLoaded(forceReload: boolean = false): Promise<void> {
    if (this.settingsLoaded && !forceReload) return;
    
    console.log('🔄 [EnhancedCalendarService] Loading calendar settings from database...');
    
    try {
      // Load calendar settings row (single)
      const { data: settingsRow, error: settingsError } = await this.supabase
        .from('calendar_settings')
        .select('*')
        .single();

      if (!settingsError && settingsRow) {
        console.log('✅ [EnhancedCalendarService] Calendar settings loaded:', settingsRow);
        
        // Map enabled working days
        const enabledDays: number[] = [];
        const dayKeys = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        dayKeys.forEach((day, idx) => {
          const enabled = Boolean(settingsRow[`${day}_enabled`]);
          const start = (settingsRow[`${day}_start`] || (this.workingHoursByDay[idx]?.start ?? '09:00')).toString().slice(0,5);
          const end = (settingsRow[`${day}_end`] || (this.workingHoursByDay[idx]?.end ?? '17:00')).toString().slice(0,5);
          this.workingHoursByDay[idx] = { start, end, enabled };
          if (enabled) enabledDays.push(idx);
        });

        console.log('📅 [EnhancedCalendarService] Working hours by day:', this.workingHoursByDay);
        console.log('📅 [EnhancedCalendarService] Enabled days:', enabledDays);

        // Update core settings
        const monday = this.workingHoursByDay[1];
        this.settings = {
          ...this.settings,
          bufferTimeMinutes: Number(settingsRow.buffer_time_minutes ?? this.DEFAULT_SETTINGS.bufferTimeMinutes),
          workingHours: { start: monday.start, end: monday.end },
          workingDays: enabledDays,
        };
        
        console.log('⚙️ [EnhancedCalendarService] Updated settings:', this.settings);
      } else {
        console.warn('⚠️ [EnhancedCalendarService] No calendar settings found in database, using defaults');
      }

      // Load vacation days
      const { data: vacationRows, error: vacationError } = await this.supabase
        .from('vacation_days')
        .select('date');

      if (!vacationError && Array.isArray(vacationRows)) {
        this.settings.vacationDays = vacationRows.map((row: any) => {
          const d = row.date;
          // Ensure ISO yyyy-mm-dd string
          if (typeof d === 'string') return d;
          try {
            return new Date(d).toISOString().split('T')[0];
          } catch {
            return d;
          }
        });
        console.log('🏖️ [EnhancedCalendarService] Vacation days loaded:', this.settings.vacationDays);
      }

      this.settingsLoaded = true;
    } catch (err) {
      console.error('❌ [EnhancedCalendarService] Error loading settings:', err);
      // If Supabase is not configured or query fails, fall back to defaults silently
      this.settingsLoaded = true; // Avoid retry loops; can be refreshed on demand
    }
  }

  /**
   * Check calendar connection status using service account
   */
  async getCalendarStatus(): Promise<CalendarConnectionStatus> {
    try {
      const hasValidTokens = await TokenManager.hasValidTokens();

      if (!hasValidTokens) {
        return {
          connected: false,
          message: 'Calendar not connected or tokens expired'
        };
      }

      // Test connection with a simple calendar info call using service account
      const calendar = await this.getCalendarClient();
      const response = await calendar.calendars.get({ calendarId: this.getCalendarId() });

      return {
        connected: true,
        message: 'Calendar successfully connected via service account',
        calendar: {
          id: response.data.id || this.getCalendarId(),
          summary: response.data.summary || 'Admin Calendar',
          timeZone: response.data.timeZone || this.DEFAULT_TIMEZONE,
          accessRole: 'owner'
        }
      };
    } catch (error) {
      return {
        connected: false,
        message: 'Error checking calendar connection: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Get current booking settings
   * @param forceReload - Force reload settings from database
   */
  async getSettings(forceReload: boolean = false): Promise<BookingSettings> {
    await this.ensureSettingsLoaded(forceReload);
    return { ...this.settings };
  }
  
  /**
   * Refresh settings from database (clears cache and reloads)
   */
  async refreshSettings(): Promise<BookingSettings> {
    this.settingsLoaded = false;
    return this.getSettings(true);
  }

  /**
   * Update booking settings
   */
  async updateSettings(newSettings: Partial<BookingSettings>): Promise<BookingSettings> {
    this.settings = { ...this.settings, ...newSettings };
    return { ...this.settings };
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(date: string, bufferMinutes?: number): Promise<TimeSlot[]> {
    await this.ensureSettingsLoaded();
    const targetDate = new Date(date);

    // Check if date is a working day
    const dow = targetDate.getDay();
    const dayConfig = this.workingHoursByDay[dow];
    const isEnabled = dayConfig?.enabled ?? this.settings.workingDays.includes(dow);
    if (!isEnabled) {
      return [];
    }

    // Check if date is a vacation day
    if (this.settings.vacationDays.includes(date)) {
      return [];
    }

    // Get existing events for the date
    const existingEvents = await this.getEventsForDate(date);

    // Add admin events to the list of events to check against
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const adminEventsForDay = await this.getAdminEvents(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );
      if (adminEventsForDay && adminEventsForDay.length > 0) {
        existingEvents.push(...adminEventsForDay);
      }
    } catch (_err) {
      // If we cannot read admin events, degrade gracefully and proceed with normal availability
    }

    // Generate potential time slots
    const slots = this.generateTimeSlotsInternal(date);

    // Filter out unavailable slots based on existing events and buffer times
    const effectiveBuffer = typeof bufferMinutes === 'number' ? bufferMinutes : this.settings.bufferTimeMinutes;
    return this.filterAvailableSlots(slots, existingEvents, effectiveBuffer);
  }

  /**
   * Create a new booking
   */
  async createBooking(booking: BookingRequest): Promise<CalendarEvent> {
    await this.ensureSettingsLoaded();
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      throw new Error('Calendar not connected or tokens expired');
    }

    // Validate booking request
    await this.validateBookingRequest(booking);

    // Create the calendar event
    const startDateTime = new Date(`${booking.date}T${booking.time}:00`);
    const endDateTime = new Date(
      startDateTime.getTime() + (booking.duration || this.settings.lessonDurationMinutes) * 60000
    );

    const eventData: CreateEventData = {
      summary: `Driving Lesson - ${booking.studentName}`,
      description: `
Lesson Type: ${booking.lessonType}
Student: ${booking.studentName}
Email: ${booking.studentEmail}
${booking.notes ? `Notes: ${booking.notes}` : ''}

Booked via Driving School System
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: this.DEFAULT_TIMEZONE
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: this.DEFAULT_TIMEZONE
      },
      attendees: [
        {
          email: booking.studentEmail,
          displayName: booking.studentName
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }       // 1 hour before
        ]
      }
    };

    return this.createCalendarEvent(eventData);
  }

  /**
   * Update an existing event using service account
   */
  async updateEvent(eventId: string, updateData: Partial<CreateEventData>): Promise<CalendarEvent> {
    const calendar = await this.getCalendarClient();
    const calendarId = this.getCalendarId();

    const response = await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: updateData as any,
    });

    return this.transformGoogleEvent(response.data);
  }

  /**
   * Delete an event using service account
   */
  async deleteEvent(eventId: string): Promise<void> {
    const calendar = await this.getCalendarClient();
    const calendarId = this.getCalendarId();

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
  }

  /**
   * Get events in date range using service account
   */
  async getEvents(startDate: string, endDate: string, _eventType?: string): Promise<CalendarEvent[]> {
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      return [];
    }
    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const calendarId = this.getCalendarId();
    try {
      let pageToken: string | undefined;
      const all: any[] = [];
      do {
        const response = await calendar.events.list({
          calendarId,
          timeMin: startDate,
          timeMax: endDate,
          singleEvents: true,
          orderBy: 'startTime',
          timeZone: this.DEFAULT_TIMEZONE,
          pageToken,
        });
        if (Array.isArray(response.data.items)) {
          all.push(...response.data.items);
        }
        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);
      return all.map(this.transformGoogleEvent);
    } catch {
      return [];
    }
  }

  /**
   * Check admin calendar free/busy for a time range, optionally applying buffer
   */
  async isAdminBusy(startISO: string, endISO: string, bufferMinutes?: number): Promise<boolean> {
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      return true;
    }
    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const calendarId = this.getCalendarId();

    const buffer = typeof bufferMinutes === 'number' ? bufferMinutes : this.settings?.bufferTimeMinutes ?? this.DEFAULT_SETTINGS.bufferTimeMinutes;
    const start = new Date(new Date(startISO).getTime() - buffer * 60000).toISOString();
    const end = new Date(new Date(endISO).getTime() + buffer * 60000).toISOString();

    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: start,
          timeMax: end,
          items: [{ id: calendarId }],
        } as any,
      });
      const calendars = response.data.calendars || {};
      const cal = calendars[calendarId] || calendars['primary'];
      const busy = Array.isArray(cal?.busy) ? cal.busy : [];
      return busy.length > 0;
    } catch (_err) {
      return true;
    }
  }

  /**
   * Get admin events (for admin calendar) using service account
   */
  async getAdminEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    console.log('🔍 [getAdminEvents] Starting fetch:', { startDate, endDate });
    
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      console.log('❌ [getAdminEvents] No auth client available');
      return [];
    }
    
    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const calendarId = this.getCalendarId();
    
    console.log('🔍 [getAdminEvents] Using calendar ID:', calendarId);
    
    try {
      let pageToken: string | undefined;
      const all: any[] = [];
      let pageCount = 0;
      
      do {
        pageCount++;
        console.log(`🔍 [getAdminEvents] Fetching page ${pageCount}...`);
        
        const response = await calendar.events.list({
          calendarId,
          timeMin: startDate,
          timeMax: endDate,
          singleEvents: true,
          orderBy: 'startTime',
          timeZone: this.DEFAULT_TIMEZONE,
          pageToken,
        });
        
        console.log(`🔍 [getAdminEvents] Page ${pageCount} response:`, {
          itemsCount: response.data.items?.length || 0,
          hasNextPage: !!response.data.nextPageToken
        });
        
        if (Array.isArray(response.data.items)) {
          console.log(`🔍 [getAdminEvents] Page ${pageCount} events:`, 
            response.data.items.map(item => ({
              id: item.id,
              summary: item.summary,
              start: item.start?.dateTime || item.start?.date,
              end: item.end?.dateTime || item.end?.date
            }))
          );
          all.push(...response.data.items);
        }
        
        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);
      
      console.log(`✅ [getAdminEvents] Total events fetched: ${all.length}`);
      console.log(`✅ [getAdminEvents] All events:`, 
        all.map(item => ({
          id: item.id,
          summary: item.summary,
          start: item.start?.dateTime || item.start?.date,
          end: item.end?.dateTime || item.end?.date,
          timestamp: new Date(item.start?.dateTime || item.start?.date).toLocaleString()
        }))
      );
      
      const transformed = all.map(this.transformGoogleEvent);
      console.log(`✅ [getAdminEvents] Transformed events: ${transformed.length}`);
      
      return transformed;
    } catch (error) {
      console.error('❌ [getAdminEvents] Error fetching events:', error);
      return [];
    }
  }

  /**
   * Get public events (anonymized)
   */
  async getPublicEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const events = await this.getEvents(startDate, endDate);

    // Anonymize events for public view
    return events.map(event => ({
      ...event,
      title: 'BOOKED',
      description: '', // Remove personal details
      attendees: [] // Remove attendee information
    }));
  }

  /**
   * Sync calendar and return results
   */
  async syncCalendar(): Promise<CalendarSyncResult> {
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const events = await this.getEvents(startDate, endDate);

      return {
        success: true,
        eventsProcessed: events.length,
        errors: [],
        lastSyncTime: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        eventsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
        lastSyncTime: new Date().toISOString()
      };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(eventId: string, _reason?: string): Promise<boolean> {
    try {
      await this.deleteEvent(eventId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(startDate: string, endDate: string): Promise<{
    totalBookings: number;
    completedLessons: number;
    upcomingLessons: number;
    cancelledLessons: number;
    averageBookingsPerDay: number;
  }> {
    const events = await this.getEvents(startDate, endDate);
    const now = new Date();

    const totalBookings = events.length;
    const completedLessons = events.filter(e => new Date(e.end) < now && e.status === 'confirmed').length;
    const upcomingLessons = events.filter(e => new Date(e.start) > now && e.status === 'confirmed').length;
    const cancelledLessons = events.filter(e => e.status === 'cancelled').length;

    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const averageBookingsPerDay = totalBookings / Math.max(daysDiff, 1);

    return {
      totalBookings,
      completedLessons,
      upcomingLessons,
      cancelledLessons,
      averageBookingsPerDay: Math.round(averageBookingsPerDay * 100) / 100
    };
  }

  /**
   * Generate time slots for a given date
   */
  generateTimeSlots(date: string, existingEvents: CalendarEvent[] = [], bufferMinutes: number = 15): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const selectedDate = new Date(date);

    // Default working hours: 9 AM to 5 PM
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if this slot conflicts with existing events
      const hasConflict = existingEvents.some(event => {
        if (!event.start || !event.end) return false;

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Add buffer time
        const bufferStart = new Date(eventStart.getTime() - bufferMinutes * 60000);
        const bufferEnd = new Date(eventEnd.getTime() + bufferMinutes * 60000);

        // Check for overlap
        return slotStart < bufferEnd && slotEnd > bufferStart;
      });

      slots.push({
        id: `${date}-${hour}`,
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: !hasConflict,
        start: slotStart.toISOString(),
        end: slotEnd.toISOString()
      });
    }

    return slots;
  }

  /**
   * Create event in admin calendar using service account
   */
  async createEvent(eventData: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
  }): Promise<CalendarEvent> {
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      throw new Error('Admin calendar not connected or tokens expired');
    }

    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const calendarId = this.getCalendarId();

    const createEventData = {
      summary: eventData.title,
      start: {
        dateTime: eventData.start,
        timeZone: this.DEFAULT_TIMEZONE,
      },
      end: {
        dateTime: eventData.end,
        timeZone: this.DEFAULT_TIMEZONE,
      },
      description: eventData.description || null,
      location: eventData.location || null,
    };

    // Create event in resolved admin calendar with retry logic
    let lastError: any = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await calendar.events.insert({
          calendarId: calendarId,
          requestBody: createEventData,
        });

        // Event created successfully
        return this.transformGoogleEvent(response.data);
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a retryable error
        const isRetryable = 
          error.code === 'ECONNRESET' || 
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          (error.response?.status >= 500 && error.response?.status < 600);
        
        if (isRetryable && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.warn(`Calendar API attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Non-retryable error or max retries reached
        throw error;
      }
    }
    
    // Should never reach here, but just in case
    throw lastError || new Error('Failed to create calendar event after retries');
  }

  // Private helper methods

  private async getEventsForDate(date: string): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEvents(startOfDay.toISOString(), endOfDay.toISOString());
  }

  private async validateBookingRequest(booking: BookingRequest): Promise<void> {
    await this.ensureSettingsLoaded();
    // Check if the requested time slot is available
    const availableSlots = await this.getAvailableSlots(booking.date);

    const isSlotAvailable = availableSlots.some(slot => {
      // Prefer comparing by local HH:MM to avoid timezone mismatches
      const slotTime = new Date(slot.start).toTimeString().slice(0,5);
      return slotTime === booking.time && slot.available;
    });

    if (!isSlotAvailable) {
      throw new Error('Requested time slot is not available');
    }

    // Check daily booking limit
    const existingEvents = await this.getEventsForDate(booking.date);
    if (existingEvents.length >= this.settings.maxBookingsPerDay) {
      throw new Error('Maximum bookings per day exceeded');
    }
  }

  private async createCalendarEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      throw new Error('Calendar not connected or tokens expired');
    }

    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const calendarId = this.getCalendarId();

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: eventData as any,
    });

    return this.transformGoogleEvent(response.data);
  }

  private generateTimeSlotsInternal(date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dow = new Date(date).getDay();
    const cfg = this.workingHoursByDay[dow] || { start: this.settings.workingHours.start, end: this.settings.workingHours.end, enabled: true };
    const [startHour = 9, startMinute = 0] = cfg.start.split(':').map(Number);
    const [endHour = 17, endMinute = 0] = cfg.end.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    for (let time = startTime; time < endTime; time += this.settings.lessonDurationMinutes) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;

      const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
      const slotEnd = new Date(slotStart.getTime() + this.settings.lessonDurationMinutes * 60000);

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        available: true
      });
    }

    return slots;
  }

  private filterAvailableSlots(
    slots: TimeSlot[],
    existingEvents: CalendarEvent[],
    bufferMinutes: number
  ): TimeSlot[] {
    return slots.map(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      const isUnavailable = existingEvents.some(event => {
        if (!event.start || !event.end) {
          return false; // Skip events with invalid time data
        }

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        const bufferedStart = new Date(eventStart.getTime() - bufferMinutes * 60000);
        const bufferedEnd = new Date(eventEnd.getTime() + bufferMinutes * 60000);

        const conflict = slotStart < bufferedEnd && slotEnd > bufferedStart;

        if (conflict) {
          console.log(
            `Conflict found: Slot ${slot.time} is unavailable due to event "${event.title}".`
          );
        }

        return conflict;
      });

      return {
        ...slot,
        available: !isUnavailable,
        reason: isUnavailable ? 'Time slot conflicts with an existing booking.' : undefined
      };
    });
  }

  async createUserEvent(userId: string, eventData: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
  }): Promise<CalendarEvent | null> {
    try {
      const tokens = await (await import('@/lib/oauth/token-manager')).TokenManager.getTokens(userId, 'google');
      if (!tokens?.access_token) {
        return null;
      }
      const { google } = await import('googleapis');
      const oauth2 = new google.auth.OAuth2();
      oauth2.setCredentials({ access_token: tokens.access_token });
      const calendar = google.calendar({ version: 'v3', auth: oauth2 });
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: eventData.title,
          start: { dateTime: eventData.start, timeZone: this.DEFAULT_TIMEZONE },
          end: { dateTime: eventData.end, timeZone: this.DEFAULT_TIMEZONE },
          description: eventData.description || null,
          location: eventData.location || null,
        } as any,
      });
      return this.transformGoogleEvent(response.data);
    } catch {
      return null;
    }
  }

  async createDualEvents(userId: string, eventData: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
  }): Promise<{ adminEvent: CalendarEvent; userEvent: CalendarEvent | null }> {
    const adminEvent = await this.createEvent(eventData);
    let userEvent: CalendarEvent | null = null;
    try {
      userEvent = await this.createUserEvent(userId, eventData);
    } catch {}
    return { adminEvent, userEvent };
  }

  buildICS(summary: string, startISO: string, endISO: string, description?: string, location?: string): string {
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const fmt = (iso: string) => iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${Math.random().toString(36).slice(2)}@driving-school`;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Driving School//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${fmt(startISO)}`,
      `DTEND:${fmt(endISO)}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : 'DESCRIPTION:',
      location ? `LOCATION:${location}` : 'LOCATION:',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.join('\r\n');
  }

  /**
   * Find the first contiguous available window that satisfies durationMinutes
   */
  async getNextAvailableSlot(
    startDateISO: string,
    durationMinutes: number,
    bufferMinutes?: number,
    horizonDays: number = 30
  ): Promise<{ start: string; end: string } | null> {
    await this.ensureSettingsLoaded();
    const effectiveBuffer = typeof bufferMinutes === 'number' ? bufferMinutes : this.settings.bufferTimeMinutes;
    const lessonLen = this.settings.lessonDurationMinutes;
    const requiredSlots = Math.max(1, Math.ceil(durationMinutes / lessonLen));

    const startDate = new Date(startDateISO);
    for (let d = 0; d < horizonDays; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const eventsForDay = await this.getEventsForDate(isoDate);
      try {
        const adminEventsForDay = await this.getAdminEvents(
          new Date(`${isoDate}T00:00:00.000Z`).toISOString(),
          new Date(`${isoDate}T23:59:59.999Z`).toISOString()
        );
        if (adminEventsForDay?.length) eventsForDay.push(...adminEventsForDay);
      } catch {}

      const slots = this.filterAvailableSlots(this.generateTimeSlotsInternal(isoDate), eventsForDay, effectiveBuffer);

      // Find contiguous run of available slots
      let runStartIndex: number | null = null;
      let runCount = 0;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].available) {
          if (runStartIndex === null) runStartIndex = i;
          runCount++;
          if (runCount >= requiredSlots) {
            const start = slots[runStartIndex].start;
            const end = new Date(new Date(start).getTime() + durationMinutes * 60000).toISOString();
            return { start, end };
          }
        } else {
          runStartIndex = null;
          runCount = 0;
        }
      }
    }
    return null;
  }

  private transformGoogleEvent(googleEvent: any): CalendarEvent {
    const isAllDay = !!googleEvent.start?.date && !googleEvent.start?.dateTime;
    let startISO = googleEvent.start?.dateTime || googleEvent.start?.date || '';
    let endISO = googleEvent.end?.dateTime || googleEvent.end?.date || '';

    if (isAllDay && googleEvent.start?.date && googleEvent.end?.date) {
      // Google all-day events use exclusive end date; normalize to inclusive end-of-day
      const startDate = new Date(`${googleEvent.start.date}T00:00:00.000Z`);
      const endDateExclusive = new Date(`${googleEvent.end.date}T00:00:00.000Z`);
      const endDateInclusive = new Date(endDateExclusive.getTime() - 1);
      startISO = startDate.toISOString();
      endISO = endDateInclusive.toISOString();
    }

    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      start: startISO,
      end: endISO,
      location: googleEvent.location || '',
      status: googleEvent.status,
      attendees: googleEvent.attendees || [],
      creator: googleEvent.creator,
      organizer: googleEvent.organizer,
      htmlLink: googleEvent.htmlLink,
      hangoutLink: googleEvent.hangoutLink,
      recurringEventId: googleEvent.recurringEventId,
      originalStartTime: googleEvent.originalStartTime,
      transparency: googleEvent.transparency,
      visibility: googleEvent.visibility,
      reminders: googleEvent.reminders,
      created: googleEvent.created,
      updated: googleEvent.updated
    };
  }
}
