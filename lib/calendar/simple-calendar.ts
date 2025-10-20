
export interface SimpleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

export class SimpleCalendarService {
  private static readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

  /**
   * Get service account credentials
   */
  private static getServiceAccountCredentials(): any {
    try {
      // In production, store this file outside of public folder for security
      const serviceAccountPath = path.join(process.cwd(), 'lib', 'config', 'service-account.json');

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
        return JSON.parse(serviceAccountData);
      }

      // Fallback to environment variables if file not found
      return {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
    } catch (error) {
      console.error('Error loading service account credentials:', error);
      return null;
    }
  }

  /**
   * Get JWT token for service account authentication
   */
  private static async getJWTToken(): Promise<string | null> {
    const credentials = this.getServiceAccountCredentials();
    if (!credentials) {
      console.error('No service account credentials found');
      return null;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600, // 1 hour
        iat: now,
      };

      const token = jwt.sign(payload, credentials.private_key, { algorithm: 'RS256' });
      return token;
    } catch (error) {
      console.error('Error generating JWT token:', error);
      return null;
    }
  }

  /**
   * Get access token using service account
   */
  private static async getAccessToken(): Promise<string | null> {
    const jwtToken = await this.getJWTToken();
    if (!jwtToken) {
      return null;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken,
        }),
      });

      if (!response.ok) {
        console.error('Failed to get access token:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Fetch events for a specific date
   */
  static async getEvents(date: string): Promise<SimpleCalendarEvent[]> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const url = `${this.GOOGLE_CALENDAR_API}/calendars/primary/events?` +
      `timeMin=${startOfDay.toISOString()}&` +
      `timeMax=${endOfDay.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`);
    }

    const data = await response.json();
    return (data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      description: event.description,
      location: event.location,
    }));
  }

  /**
   * Create a new calendar event
   */
  static async createEvent(eventData: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
  }): Promise<SimpleCalendarEvent> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const googleEvent = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start,
        timeZone: 'Australia/Brisbane',
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'Australia/Brisbane',
      },
    };

    const response = await fetch(`${this.GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.status}`);
    }

    const createdEvent = await response.json();
    return {
      id: createdEvent.id,
      title: createdEvent.summary,
      start: createdEvent.start.dateTime,
      end: createdEvent.end.dateTime,
      description: createdEvent.description,
      location: createdEvent.location,
    };
  }

  /**
   * Generate available time slots for a date
   */
  static async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    const events = await this.getEvents(date);
    const slots: TimeSlot[] = [];
    
    // Working hours: 9 AM to 5 PM
    const workStart = 9;
    const workEnd = 17;
    
    for (let hour = workStart; hour < workEnd; hour++) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if this slot conflicts with any existing event
      const hasConflict = events.some(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const slotStartTime = new Date(`${date}T${slotStart}`);
        const slotEndTime = new Date(`${date}T${slotEnd}`);
        
        return (slotStartTime < eventEnd && slotEndTime > eventStart);
      });
      
      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !hasConflict,
      });
    }
    
    return slots;
  }

  /**
   * Check if calendar is connected
   */
  static async checkConnection(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.GOOGLE_CALENDAR_API}/calendars/primary`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
