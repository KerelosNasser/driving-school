/**
 * Unit tests for timezone utilities in date-utils.ts
 * 
 * These tests ensure that all date/time conversions are timezone-aware
 * and correctly handle Australia/Brisbane timezone, including DST transitions.
 */

import { describe, it, expect } from '@jest/globals';
import {
      createDateTimeInTimezone,
      formatDateInTimezone,
      formatTimeInTimezone,
      createDateInTimezone,
      isDateInPast,
      getTodayInTimezone,
      DEFAULT_TIMEZONE,
} from '../date-utils';

describe('Timezone Utilities', () => {
      describe('createDateTimeInTimezone', () => {
            it('should create a date in Brisbane timezone for a given date and time', () => {
                  // November 20, 2025 at 10:00 AM Brisbane time
                  const date = '2025-11-20';
                  const time = '10:00';

                  const result = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);

                  // The result should be a Date object
                  expect(result).toBeInstanceOf(Date);

                  // When formatted back to Brisbane timezone, it should match the input
                  const formattedDate = formatDateInTimezone(result, DEFAULT_TIMEZONE);
                  const formattedTime = formatTimeInTimezone(result, DEFAULT_TIMEZONE);

                  expect(formattedDate).toBe('2025-11-20');
                  expect(formattedTime).toBe('10:00');
            });

            it('should correctly handle Brisbane timezone UTC offset (GMT+10)', () => {
                  // Brisbane is UTC+10 (no DST currently, but note: QLD doesn't observe DST)
                  const date = '2025-11-20';
                  const time = '10:00';

                  const result = createDateTimeInTimezone(date, time, 'Australia/Brisbane');

                  // 10:00 AM Brisbane = 00:00 UTC (roughly, accounting for DST)
                  // Let's verify the ISO string represents the correct UTC time
                  const isoString = result.toISOString();

                  // The ISO string should represent midnight UTC (10:00 Brisbane - 10 hours)
                  expect(isoString).toContain('2025-11-20T00:00:00');
            });

            it('should handle midnight correctly', () => {
                  const date = '2025-11-20';
                  const time = '00:00';

                  const result = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);

                  const formattedTime = formatTimeInTimezone(result, DEFAULT_TIMEZONE);
                  expect(formattedTime).toBe('00:00');
            });

            it('should handle end of day (23:59) correctly', () => {
                  const date = '2025-11-20';
                  const time = '23:59';

                  const result = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);

                  const formattedTime = formatTimeInTimezone(result, DEFAULT_TIMEZONE);
                  expect(formattedTime).toBe('23:59');
            });

            it('should throw error for invalid date format', () => {
                  expect(() => {
                        createDateTimeInTimezone('invalid-date', '10:00', DEFAULT_TIMEZONE);
                  }).toThrow();
            });

            it('should throw error for invalid time format', () => {
                  expect(() => {
                        createDateTimeInTimezone('2025-11-20', 'invalid:time', DEFAULT_TIMEZONE);
                  }).toThrow();
            });
      });

      describe('formatDateInTimezone', () => {
            it('should format a date object to YYYY-MM-DD in Brisbane timezone', () => {
                  const date = new Date('2025-11-20T10:00:00Z'); // UTC time

                  const result = formatDateInTimezone(date, DEFAULT_TIMEZONE);

                  // In Brisbane (UTC+10), this would be Nov 20 20:00
                  expect(result).toBe('2025-11-20');
            });

            it('should handle ISO string input', () => {
                  const isoString = '2025-11-20T10:00:00Z';

                  const result = formatDateInTimezone(isoString, DEFAULT_TIMEZONE);

                  expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            });
      });

      describe('formatTimeInTimezone', () => {
            it('should format time to HH:mm in Brisbane timezone', () => {
                  const date = new Date('2025-11-20T00:00:00Z'); // Midnight UTC

                  const result = formatTimeInTimezone(date, DEFAULT_TIMEZONE);

                  // In Brisbane (UTC+10), this would be 10:00
                  expect(result).toBe('10:00');
            });
      });

      describe('createDateInTimezone', () => {
            it('should create a date representing midnight in Brisbane timezone', () => {
                  const dateString = '2025-11-20';

                  const result = createDateInTimezone(dateString, DEFAULT_TIMEZONE);

                  expect(result).toBeInstanceOf(Date);

                  // When formatted back, should be the same date
                  const formatted = formatDateInTimezone(result, DEFAULT_TIMEZONE);
                  expect(formatted).toBe('2025-11-20');
            });
      });

      describe('isDateInPast', () => {
            it('should return true for dates in the past', () => {
                  const pastDate = new Date('2020-01-01T12:00:00Z');

                  const result = isDateInPast(pastDate, DEFAULT_TIMEZONE);

                  expect(result).toBe(true);
            });

            it('should return false for future dates', () => {
                  const futureDate = new Date('2030-01-01T12:00:00Z');

                  const result = isDateInPast(futureDate, DEFAULT_TIMEZONE);

                  expect(result).toBe(false);
            });

            it('should return false for today', () => {
                  const today = getTodayInTimezone(DEFAULT_TIMEZONE);

                  const result = isDateInPast(today, DEFAULT_TIMEZONE);

                  expect(result).toBe(false);
            });
      });

      describe('DST Edge Cases', () => {
            // Note: Queensland (Brisbane) does NOT observe Daylight Saving Time
            // However, we should still test that the utilities handle this correctly

            it('should handle October dates consistently (when other states start DST)', () => {
                  const date = '2025-10-05';
                  const time = '10:00';

                  const result = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);

                  const formattedDate = formatDateInTimezone(result, DEFAULT_TIMEZONE);
                  const formattedTime = formatTimeInTimezone(result, DEFAULT_TIMEZONE);

                  expect(formattedDate).toBe('2025-10-05');
                  expect(formattedTime).toBe('10:00');
            });

            it('should handle April dates consistently (when other states end DST)', () => {
                  const date = '2026-04-05';
                  const time = '10:00';

                  const result = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);

                  const formattedDate = formatDateInTimezone(result, DEFAULT_TIMEZONE);
                  const formattedTime = formatTimeInTimezone(result, DEFAULT_TIMEZONE);

                  expect(formattedDate).toBe('2026-04-05');
                  expect(formattedTime).toBe('10:00');
            });
      });

      describe('Round-trip Conversion', () => {
            it('should maintain accuracy through round-trip conversions', () => {
                  const originalDate = '2025-11-20';
                  const originalTime = '14:30';

                  // Create date from string
                  const dateObj = createDateTimeInTimezone(originalDate, originalTime, DEFAULT_TIMEZONE);

                  // Convert back to strings
                  const resultDate = formatDateInTimezone(dateObj, DEFAULT_TIMEZONE);
                  const resultTime = formatTimeInTimezone(dateObj, DEFAULT_TIMEZONE);

                  // Should match original inputs exactly
                  expect(resultDate).toBe(originalDate);
                  expect(resultTime).toBe(originalTime);
            });

            it('should handle multiple round-trips without drift', () => {
                  let dateObj = createDateTimeInTimezone('2025-11-20', '10:00', DEFAULT_TIMEZONE);

                  // Perform 5 round-trips
                  for (let i = 0; i < 5; i++) {
                        const date = formatDateInTimezone(dateObj, DEFAULT_TIMEZONE);
                        const time = formatTimeInTimezone(dateObj, DEFAULT_TIMEZONE);
                        dateObj = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);
                  }

                  // After 5 round-trips, should still be the same
                  expect(formatDateInTimezone(dateObj, DEFAULT_TIMEZONE)).toBe('2025-11-20');
                  expect(formatTimeInTimezone(dateObj, DEFAULT_TIMEZONE)).toBe('10:00');
            });
      });

      describe('Google Calendar API Format Compatibility', () => {
            it('should create dates that convert to proper RFC 3339 format', () => {
                  const date = '2025-11-20';
                  const time = '10:00';

                  const dateObj = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);
                  const isoString = dateObj.toISOString();

                  // ISO string should be valid RFC 3339 format
                  expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            });

            it('should create dates that work with formatInTimeZone for Google Calendar', () => {
                  const { formatInTimeZone } = require('date-fns-tz');

                  const date = '2025-11-20';
                  const time = '10:00';

                  const dateObj = createDateTimeInTimezone(date, time, DEFAULT_TIMEZONE);
                  const gcalFormat = formatInTimeZone(dateObj, DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

                  // Should be in format that Google Calendar API accepts
                  expect(gcalFormat).toBe('2025-11-20T10:00:00');
            });
      });
});
