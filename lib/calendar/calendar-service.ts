import { TokenManager } from '@/lib/oauth/token-manager';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  hangoutLink?: string;
  recurringEventId?: string;
  originalStartTime?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  created?: string;
  updated?: string;
}

export interface CreateEventData {
  summary: string;
  description?: string;
  start: string | { dateTime: string; timeZone: string };
  end: string | { dateTime: string; timeZone: string };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id?: never; // Prevent id from being updated
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

export interface FetchEventsOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  showDeleted?: boolean;
  showHiddenInvitations?: boolean;
}

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  groupExpansionMax?: number;
  calendarExpansionMax?: number;
  items: Array<{
    id: string;
  }>;
}

export interface FreeBusyResponse {
  timeMin: string;
  timeMax: string;
  calendars: {
    [calendarId: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
      errors?: Array<{
        domain: string;
        reason: string;
      }>;
    };
  };
}

export class CalendarService {
  private static readonly BASE_URL = 'https://www.googleapis.com/calendar/v3';
  private static readonly DEFAULT_TIMEZONE = 'Australia/Brisbane';

  /**
   * Check if the user has a valid calendar connection
   */
  static async checkConnection(userId: string): Promise<CalendarConnectionStatus> {
    try {
      const hasValidTokens = await TokenManager.hasValidTokens(userId);
      
      if (!hasValidTokens) {
        return {
          connected: false,
          message: 'Calendar not connected or tokens expired'
        };
      }

      const accessToken = await TokenManager.getValidAccessToken(userId);
      if (!accessToken) {
        return {
          connected: false,
          message: 'Failed to retrieve valid access token'
        };
      }

      // Test connection with a simple calendar info call
      const response = await fetch(
        `${this.BASE_URL}/users/me/calendarList/primary`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return {
          connected: false,
          message: 'Calendar connection test failed'
        };
      }

      const calendarInfo = await response.json();

      return {
        connected: true,
        message: 'Calendar successfully connected',
        calendar: {
          id: calendarInfo.id,
          summary: calendarInfo.summary,
          timeZone: calendarInfo.timeZone,
          accessRole: calendarInfo.accessRole
        }
      };
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      return {
        connected: false,
        message: 'Error checking calendar connection'
      };
    }
  }

  /**
   * Fetch events from the user's calendar
   */
  static async fetchEvents(
    userId: string, 
    options: FetchEventsOptions = {}
  ): Promise<{ events: CalendarEvent[]; nextPageToken?: string; nextSyncToken?: string }> {
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('Calendar not connected or tokens expired');
    }

    const {
      timeMin = new Date().toISOString(),
      timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults = 250,
      singleEvents = true,
      orderBy = 'startTime',
      showDeleted = false,
      showHiddenInvitations = false
    } = options;

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults: maxResults.toString(),
      singleEvents: singleEvents.toString(),
      showDeleted: showDeleted.toString(),
      showHiddenInvitations: showHiddenInvitations.toString(),
    });

    if (singleEvents && orderBy) {
      params.append('orderBy', orderBy);
    }

    const response = await fetch(
      `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch calendar events:', errorText);
      throw new Error(`Failed to fetch calendar events: ${response.status}`);
    }

    const data = await response.json();

    const events: CalendarEvent[] = data.items?.map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      status: event.status,
      attendees: event.attendees || [],
      creator: event.creator,
      organizer: event.organizer,
      htmlLink: event.htmlLink,
      hangoutLink: event.hangoutLink,
      recurringEventId: event.recurringEventId,
      originalStartTime: event.originalStartTime,
      transparency: event.transparency,
      visibility: event.visibility,
      reminders: event.reminders,
      created: event.created,
      updated: event.updated
    })) || [];

    return {
      events,
      nextPageToken: data.nextPageToken,
      nextSyncToken: data.nextSyncToken
    };
  }

  /**
   * Create a new calendar event
   */
  static async createEvent(userId: string, eventData: CreateEventData): Promise<CalendarEvent> {
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('Calendar not connected or tokens expired');
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Ensure start and end times have proper timezone
    const processedEventData = {
      ...eventData,
      start: typeof eventData.start === 'string' 
        ? { dateTime: eventData.start, timeZone: this.DEFAULT_TIMEZONE } 
        : eventData.start,
      end: typeof eventData.end === 'string' 
        ? { dateTime: eventData.end, timeZone: this.DEFAULT_TIMEZONE } 
        : eventData.end,
    };

    const response = await fetch(
      `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedEventData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create calendar event:', errorText);
      throw new Error(`Failed to create calendar event: ${response.status}`);
    }

    const createdEvent = await response.json();
    return this.transformGoogleEvent(createdEvent);
  }

  /**
   * Update an existing calendar event
   */
  static async updateEvent(userId: string, eventId: string, updateData: UpdateEventData): Promise<CalendarEvent> {
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('Calendar not connected or tokens expired');
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // First, get the existing event
    const existingEvent = await this.getEvent(userId, eventId);
    if (!existingEvent) {
      throw new Error('Event not found');
    }

    // Merge updates with existing data
    const updatedEventData = {
      ...existingEvent,
      ...updateData,
      start: updateData.start 
        ? (typeof updateData.start === 'string' 
          ? { dateTime: updateData.start, timeZone: this.DEFAULT_TIMEZONE } 
          : updateData.start)
        : existingEvent.start,
      end: updateData.end 
        ? (typeof updateData.end === 'string' 
          ? { dateTime: updateData.end, timeZone: this.DEFAULT_TIMEZONE } 
          : updateData.end)
        : existingEvent.end,
    };

    const response = await fetch(
      `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEventData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update calendar event:', errorText);
      throw new Error(`Failed to update calendar event: ${response.status}`);
    }

    const updatedEvent = await response.json();
    return this.transformGoogleEvent(updatedEvent);
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(userId: string, eventId: string): Promise<void> {
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('Calendar not connected or tokens expired');
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const response = await fetch(
      `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      console.error('Failed to delete calendar event:', errorText);
      throw new Error(`Failed to delete calendar event: ${response.status}`);
    }
  }

  /**
   * Get a specific calendar event
   */
  static async getEvent(userId: string, eventId: string): Promise<CalendarEvent | null> {
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('Calendar not connected or tokens expired');
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const response = await fetch(
      `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch calendar event:', errorText);
      throw new Error(`Failed to fetch calendar event: ${response.status}`);
    }

    const event = await response.json();
    return this.transformGoogleEvent(event);
  }

  /**
   * Check free/busy status for calendars
   */
  static async getFreeBusy(userId: string, request: FreeBusyRequest): Promise<FreeBusyResponse> {
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('Calendar not connected or tokens expired');
    }

    const response = await fetch(
      `${this.BASE_URL}/freeBusy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          timeZone: request.timeZone || this.DEFAULT_TIMEZONE,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch free/busy information:', errorText);
      throw new Error(`Failed to fetch free/busy information: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get available time slots based on existing events and buffer times
   */
  static async getAvailableSlots(
    userId: string,
    date: string,
    duration: number,
    bufferMinutes: number = 15,
    workingHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
  ): Promise<Array<{ start: string; end: string }>> {
    const startOfDay = new Date(`${date}T${workingHours.start}:00`);
    const endOfDay = new Date(`${date}T${workingHours.end}:00`);

    // Fetch existing events for the day
    const { events } = await this.fetchEvents(userId, {
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    // Filter out cancelled events and convert to time slots
    const busySlots = events
      .filter(event => event.status !== 'cancelled')
      .map(event => ({
        start: new Date(event.start),
        end: new Date(event.end)
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const availableSlots: Array<{ start: string; end: string }> = [];
    let currentTime = new Date(startOfDay);

    for (const busySlot of busySlots) {
      // Check if there's a gap before this busy slot
      const gapDuration = busySlot.start.getTime() - currentTime.getTime();
      const requiredDuration = (duration + bufferMinutes) * 60 * 1000; // Convert to milliseconds

      if (gapDuration >= requiredDuration) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
        if (slotEnd <= busySlot.start) {
          availableSlots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString()
          });
        }
      }

      // Move current time to after this busy slot (including buffer)
      currentTime = new Date(busySlot.end.getTime() + bufferMinutes * 60 * 1000);
    }

    // Check for availability after the last busy slot
    const remainingTime = endOfDay.getTime() - currentTime.getTime();
    const requiredDuration = duration * 60 * 1000;

    if (remainingTime >= requiredDuration) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
      if (slotEnd <= endOfDay) {
        availableSlots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString()
        });
      }
    }

    return availableSlots;
  }

  /**
   * Transform Google Calendar event to our CalendarEvent interface
   */
  private static transformGoogleEvent(googleEvent: any): CalendarEvent {
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

  /**
   * Disconnect calendar by deleting stored tokens
   */
  static async disconnect(userId: string): Promise<boolean> {
    return TokenManager.deleteTokens(userId);
  }
}