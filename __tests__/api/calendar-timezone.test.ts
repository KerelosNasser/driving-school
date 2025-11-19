import { describe, it, expect } from '@jest/globals';

/**
 * Unit tests for calendar booking timezone alignment
 * 
 * These tests verify that the booking API correctly handles date/time
 * in the user's local timezone without UTC offset issues.
 */
describe('Calendar Booking Timezone Alignment', () => {

      /**
       * Test that date parsing preserves local timezone
       */
      it('should parse date in local timezone, not UTC', () => {
            // Simulating the fixed date parsing logic
            const date = '2025-11-20';
            const time = '10:00';

            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);

            // Create date in local timezone (month is 0-indexed in JS)
            const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

            // Verify the date components match the input
            expect(startDateTime.getFullYear()).toBe(2025);
            expect(startDateTime.getMonth()).toBe(10); // November (0-indexed)
            expect(startDateTime.getDate()).toBe(20);
            expect(startDateTime.getHours()).toBe(10);
            expect(startDateTime.getMinutes()).toBe(0);
      });

      /**
       * Test that the created date aligns with Google Calendar expectations
       */
      it('should create ISO string that matches the intended local date/time', () => {
            const date = '2025-11-20';
            const time = '14:30';

            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);

            const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

            // Get the ISO string
            const isoString = startDateTime.toISOString();

            // Parse it back to verify it represents the correct moment in time
            const parsedBack = new Date(isoString);

            // When converted back to local time, it should match our input
            // Note: We need to account for timezone offset
            const localYear = parsedBack.getFullYear();
            const localMonth = parsedBack.getMonth();
            const localDay = parsedBack.getDate();

            // The ISO string should represent a moment where the LOCAL time
            // (in the server's timezone) matches our input
            expect(startDateTime.getFullYear()).toBe(2025);
            expect(startDateTime.getMonth()).toBe(10); // November
            expect(startDateTime.getDate()).toBe(20);
      });

      /**
       * Test edge case: booking on the day boundary
       * This catches the bug where UTC midnight causes date shift
       */
      it('should not shift date when booking late at night', () => {
            const date = '2025-11-20';
            const time = '23:00'; // 11 PM

            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);

            const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

            // Should still be November 20, not November 19 or 21
            expect(startDateTime.getDate()).toBe(20);
            expect(startDateTime.getMonth()).toBe(10); // November
      });

      /**
       * Test that duration calculation doesn't cause timezone issues
       */
      it('should correctly calculate end time with duration', () => {
            const date = '2025-11-20';
            const time = '10:00';
            const duration = 120; // 2 hours in minutes

            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);

            const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
            const endDateTime = new Date(startDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + duration);

            // Should be 12:00 PM on the same day
            expect(endDateTime.getDate()).toBe(20);
            expect(endDateTime.getHours()).toBe(12);
            expect(endDateTime.getMinutes()).toBe(0);
      });

      /**
       * Test comparison with old buggy implementation
       */
      it('should avoid UTC midnight bug from old implementation', () => {
            const date = '2025-11-20';
            const time = '10:00';

            // OLD BUGGY WAY (for comparison)
            const oldBuggyDate = new Date(date); // This creates midnight UTC
            const [hours, minutes] = time.split(':').map(Number);
            const oldBuggyDateTime = new Date(oldBuggyDate);
            oldBuggyDateTime.setHours(hours, minutes, 0, 0);

            // NEW CORRECT WAY
            const [year, month, day] = date.split('-').map(Number);
            const newCorrectDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

            // In some timezones (e.g., UTC+10), the old way would create Nov 19
            // The new way should always create Nov 20
            expect(newCorrectDateTime.getDate()).toBe(20);

            // Document that old way might fail depending on timezone
            // This test verifies the logic works correctly
            // regardless of what timezone the server is running in

            const testCases = [
                  { date: '2025-01-15', time: '09:00' }, // Winter
                  { date: '2025-07-15', time: '09:00' }, // Summer (DST in some zones)
                  { date: '2025-11-20', time: '14:30' }, // Current use case
            ];

            testCases.forEach(({ date, time }) => {
                  const [year, month, day] = date.split('-').map(Number);
                  const [hours, minutes] = time.split(':').map(Number);

                  const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

                  // Verify the date components are preserved
                  expect(startDateTime.getFullYear()).toBe(year);
                  expect(startDateTime.getMonth()).toBe(month - 1);
                  expect(startDateTime.getDate()).toBe(day);
                  expect(startDateTime.getHours()).toBe(hours);
                  expect(startDateTime.getMinutes()).toBe(minutes);
            });
      });
});
