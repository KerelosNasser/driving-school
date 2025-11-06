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
    // Prefer explicit calendar ID, otherwise fall back to admin email, then primary
    return process.env.GOOGLE_CALENDAR_ID || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'primary';
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
   */
  private async ensureSettingsLoaded(): Promise<void> {
    if (this.settingsLoaded) return;
    try {
      // Load calendar settings row (single)
      const { data: settingsRow, error: settingsError } = await this.supabase
        .from('calendar_settings')
        .select('*')
        .single();

      if (!settingsError && settingsRow) {
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

        // Update core settings
        const monday = this.workingHoursByDay[1];
        this.settings = {
          ...this.settings,
          bufferTimeMinutes: Number(settingsRow.buffer_time_minutes ?? this.DEFAULT_SETTINGS.bufferTimeMinutes),
          workingHours: { start: monday.start, end: monday.end },
          workingDays: enabledDays,
        };
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
      }

      this.settingsLoaded = true;
    } catch (err) {
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
      const response = await calendar.calendarList.get({ calendarId: 'primary' });

      return {
        connected: true,
        message: 'Calendar successfully connected via service account',
        calendar: {
          id: response.data.id || 'primary',
          summary: response.data.summary || 'Primary Calendar',
          timeZone: response.data.timeZone || this.DEFAULT_TIMEZONE,
          accessRole: response.data.accessRole || 'owner'
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
   */
  async getSettings(): Promise<BookingSettings> {
    await this.ensureSettingsLoaded();
    return { ...this.settings };
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
  async getAvailableSlots(date: string, bufferMinutes: number = 15): Promise<TimeSlot[]> {
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
    console.log('getEvents called with:', { startDate, endDate });
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      console.error('Failed to get auth client in getEvents');
      return []; // Return empty array instead of throwing
    }

    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const calendarId = this.getCalendarId();
    console.log('Using calendarId:', calendarId);

    try {
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: startDate,
        timeMax: endDate,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      console.log(`Found ${events.length} events in calendar.`);
      return events.map(this.transformGoogleEvent);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  /**
   * Get admin events (for admin calendar) using service account
   */
  async getAdminEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    console.log('getAdminEvents called with:', { startDate, endDate });
    const authClient = await TokenManager.getAuthClient();
    if (!authClient) {
      console.error('Failed to get auth client in getAdminEvents');
      return []; // Return empty array instead of throwing
    }

    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const calendarId = this.getCalendarId();
    console.log('Using admin calendarId:', calendarId);

    try {
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: startDate,
        timeMax: endDate,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      console.log(`Found ${events.length} admin events in calendar.`);
      return events.map(this.transformGoogleEvent);
    } catch (error) {
      console.error('Error fetching admin calendar events:', error);
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
      title: 'Driving Lesson', // Generic title
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

    // Create event in resolved admin calendar
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: createEventData,
    });

    // Event created successfully

    return this.transformGoogleEvent(response.data);
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

  private transformGoogleEvent(googleEvent: any): CalendarEvent {
    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      start: googleEvent.start?.dateTime || googleEvent.start?.date,
      end: googleEvent.end?.dateTime || googleEvent.end?.date,
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
