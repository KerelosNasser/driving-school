## Goals
- Block bookings on admin-conflicting events with buffer and accurate availability.
- Create bookings in both admin and user calendars; fallback via ICS if user isn’t connected.
- Fix “next available” navigation with a single server query.
- Enforce multi-hour bookings against user quota; disallow when requested hours exceed remaining.
- Remove hard-coded values; centralize configuration and settings.

## Current Findings (Anchors)
- Admin calendar ID fallback `'primary'` and scattered defaults: `lib/calendar/enhanced-calendar-service.ts:119–123`, connection check at `lib/calendar/enhanced-calendar-service.ts:214–216`.
- Availability via events.list and custom slot generation; no `freeBusy.query`: `lib/calendar/enhanced-calendar-service.ts:253–299`, `422–451`, `677–741`.
- Buffer inconsistencies (service 30 vs API default 15): `lib/calendar/enhanced-calendar-service.ts:125–133`, `app/api/calendar/events/route.ts:31–33`.
- Booking route blocks entire day if any admin event: `app/api/calendar/book/route.ts:157–173`.
- Quota checks and consumption exist but duplicated: `app/api/calendar/book/route.ts:215–235`, `294–350`; `app/api/quota/consume/route.ts:113–176`.
- UI “next available” loops client-side across 30 days: `app/service-center/components/CalendarView.tsx:143–176`, `QuotaManagementTab.tsx:104–132`.

## Architecture Changes
- OAuth and tokens
  - Use Auth.js v5 (2025) Google provider with PKCE and minimum scopes (`calendar.events`).
  - Store per-user and admin refresh tokens encrypted; rotate on use; avoid logging tokens.
  - Keep a distinct admin calendar connection for authoritative availability.
- Calendar service refactor
  - Replace scattered calendarId resolution with a single `getCalendarId()` that prefers `GOOGLE_CALENDAR_ID` and errors if missing; remove `'primary'` fallback.
  - Add `freeBusy.query` for conflict detection against admin calendar for a requested time range; fallback to `events.list` if needed.
  - Standardize timezone handling (service center TZ from settings), normalize to UTC internally.
  - Centralize buffer defaults from settings; expose buffer in all availability methods.
- Availability and next slot
  - Implement `findContinuousAvailability(startDate, durationMinutes, buffer)` that returns the first contiguous free window within working hours respecting vacation and admin events.
  - Add `GET /api/calendar/availability/next?duration=...&buffer=...` returning `{ start, end }`.
  - Update UI to call the single endpoint and jump calendar to the returned slot.
- Dual event creation
  - Implement `createDualEvents({ start, end, summary, location })`:
    - Create admin event with buffer-aware conflict check (prevent double-book).
    - If user connected to Google, create user event in their calendar; else generate ICS and email.
  - Ensure idempotency and rollback: if any step fails, delete created events and abort.
- Quota enforcement for multi-hour booking
  - Server-side validation: compute `requestedHours = ceil(durationMinutes / 60)` and compare against `quota.remaining_hours`.
  - Deny if requested exceeds remaining; otherwise decrement in the same transaction as booking creation.
  - Persist booking duration and consumed hours consistently; avoid rounding mismatches.
- Concurrency safety
  - Use a DB transaction with an overlap check to prevent double-booking; add a unique or exclusion constraint on `[resourceId, tsrange(start, end)]` (Postgres) or code-level lock.

## File-Level Implementation
- `lib/calendar/enhanced-calendar-service.ts`
  - Fix `getCalendarId` to require env `GOOGLE_CALENDAR_ID`; remove `'primary'` fallback (119–123).
  - Replace day-wide block logic with time-range conflict detection using `freeBusy.query` in `getAvailableSlots`/`createBooking` (253–299, 422–451, 304–354).
  - Unify buffer handling by reading from settings once and applying consistently (125–133, 705–741).
  - Add `getNextAvailableSlot(durationMinutes, buffer)` using contiguous-slot search (new function near 677–741).
  - Add `createDualEvents` with admin+user paths and rollback safety.
- `app/api/calendar/events/route.ts`
  - Align buffer default to service settings; accept `duration` and forward to service for availability (28–46, 31–33).
  - Add `/api/calendar/availability/next` handler returning the earliest valid slot.
- `app/api/calendar/book/route.ts`
  - Replace “block entire day” with precise overlap conflict check (157–191).
  - Enforce `requestedHours` vs `quota.remaining_hours`; consume via RPC inside the booking transaction (215–235, 294–350).
  - Call `createDualEvents` and rollback on failure.
- UI
  - `CalendarView.tsx` and `QuotaManagementTab.tsx`: swap 30-day loops for a single `next` endpoint call; honor buffer from settings; enforce multi-hour selection against quota client-side for UX.

## Configuration & Settings
- Env vars: `GOOGLE_CALENDAR_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`.
- Settings in DB: `bufferTimeMinutes`, `lessonDurationMinutes`, working hours per weekday, `timezone`, `vacation_days`.
- Token storage: encrypted columns for refresh/access tokens; metadata for expiry.

## Validation & Tests
- Unit tests: availability generation with buffer; contiguous slot finder.
- Integration: booking route conflict checks, quota enforcement, rollback behavior.
- Mock Google API: stub `freeBusy.query`, `events.insert`, `events.list`.
- UI smoke: “Next available” navigates correctly; multi-hour ranges disabled when over quota.

## Rollout
- Feature flag the new next-available endpoint and buffer harmonization.
- Migrate settings off hard-coded defaults; require explicit calendar ID.
- Backfill user/admin tokens where needed; ICS fallback for non-connected users.

## Security & Best Practices
- Principle of least privilege scopes; no token logs; encrypt tokens at rest.
- Timezone correctness and DST handling; avoid naive date math (use Luxon or Temporal where available).
- Idempotent operations with retries and compensating deletes for external API failures.

If approved, I’ll implement these changes in the referenced files, add the new endpoint, update the UI to use it, and wire in strict quota enforcement and buffer-consistent availability.