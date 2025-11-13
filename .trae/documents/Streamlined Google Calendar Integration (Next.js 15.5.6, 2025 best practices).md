## Goals
- Fetch all admin calendar events for a full month range.
- Block bookings against existing admin events with consistent buffer.
- Create events in both admin and user calendars, or attach ICS when user isn’t connected.
- Provide a simple, server-computed “next available” slot.
- Hide event details for non-admin views, showing only a friendly “BOOKED” label while preserving exact times.
- Enforce multi-hour booking against quota; disallow requests exceeding remaining hours.
- Keep implementation minimal, robust, and aligned with 2025 Google and Next.js practices.

## Assumptions
- Admin availability is authoritative and managed via a single `GOOGLE_CALENDAR_ID`.
- Access is through a service account. If the calendar is a group calendar, either share it directly with the service account email or enable domain-wide delegation with `GOOGLE_IMPERSONATE_SUBJECT`.
- Users may connect personal Google calendars via OAuth for dual event creation; otherwise, use ICS fallback in email.

## Server API Endpoints
- `GET /api/calendar/events?month=YYYY-MM&admin=true|false`
  - Returns all events in the month.
  - Admin: full events for internal logic.
  - Public: anonymized events with title `BOOKED`, empty description/attendees, preserving `start/end`.
- `GET /api/calendar/availability?date=YYYY-MM-DD`
  - Returns slots for a single day, using working hours and buffer, filtered by admin events and vacations.
- `GET /api/calendar/availability/next?startDate=<ISO>&durationMinutes=<M>&bufferMinutes=<B>`
  - Returns the earliest contiguous slot that satisfies duration, with buffer applied.
- `POST /api/calendar/book`
  - Input: `{ start, end }` or `{ date, time, durationMinutes }` along with lesson metadata.
  - Validates free/busy with buffer, enforces quota, creates admin event, creates user event if connected, persists booking, consumes quota, and rolls back on failure.

## Calendar Service (Server-side)
- `getCalendarId()`
  - Require `GOOGLE_CALENDAR_ID` (no fallback). Throw a clear error if missing.
- `getEventsRange(startISO, endISO)`
  - Use `events.list` with `singleEvents: true`, `orderBy: 'startTime'` and pagination (`nextPageToken`). Return normalized events.
- `getAdminEvents(startISO, endISO)`
  - Wrapper around `getEventsRange(...)` using admin calendar ID.
- `getFreeBusy(startISO, endISO, bufferMinutes)`
  - Use `freebusy.query`. Apply buffer around requested window. Treat API errors as busy to avoid double-booking.
- `generateSlots(date, workingHours, durationMinutes)`
  - Create candidate slots for the day, use settings from DB (working days/hours, vacations).
- `filterSlotsByEvents(slots, events, bufferMinutes)`
  - Mark conflicts unavailable with buffer on both sides.
- `getNextAvailableSlot(startDateISO, durationMinutes, bufferMinutes)`
  - Scan up to `horizonDays` (e.g., 30) across days, find first contiguous window.
- `createDualEvents(userId, { start, end, summary, description, location })`
  - Create admin event via service account.
  - If user has Google tokens, create user event on their `primary`; else return `null` for user event.
  - On failure, delete any created event(s).

## Booking Flow (Simple & Robust)
1. Parse input to `{ startISO, endISO }`; compute `durationMinutes`.
2. Fetch settings; determine `bufferMinutes`.
3. Check admin free/busy with buffer.
4. Validate user quota: `requestedHours = ceil(durationMinutes / 60)` must be ≤ `remainingHours`.
5. Create dual events.
6. Persist booking and consume quota (transactional; rollback calendar on failure).
7. Send confirmation email with ICS fallback when user event wasn’t created.

## Public Events (Hide Details)
- `getPublicEvents(startISO, endISO)`
  - Map event: `title: 'BOOKED'`, `description: ''`, `attendees: []`. Keep `start`/`end` intact for UI grid while hiding sensitive info.

## UI Updates (Minimal)
- Month view loads `GET /api/calendar/events?month=YYYY-MM` on month change to mark busy days (no details shown for non-admin).
- Day selection triggers `GET /api/calendar/availability?date=YYYY-MM-DD` to load time slots.
- “Find next available” calls `GET /api/calendar/availability/next?...` and jumps to returned start.
- Booking button posts to `/api/calendar/book` and shows success/errors. Display “BOOKED” for public items.

## Configuration
- Required: `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
- Optional (Workspace impersonation): `GOOGLE_IMPERSONATE_SUBJECT`.
- App: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- OAuth (user calendars): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.

## Security & Best Practices (2025)
- Least-privilege scopes: Calendar only.
- Never log tokens; encrypt at rest.
- Use server-side computations; keep client simple.
- Normalize times in UTC, display in local TZ; maintain DST correctness.

## Validation
- Unit tests: slot generation, buffer conflict detection, contiguous slot search.
- Integration: free/busy conflict denies overlaps; quota enforcement blocks exceeding requests; rollback on persistence or quota failure.
- Manual: month endpoint returns all events; public responses show `BOOKED` with correct times.

## Rollout
- Require `GOOGLE_CALENDAR_ID`; verify service account calendar permissions.
- Enable domain-wide delegation if targeting group calendars, or share calendar with service account.
- Update the UI calls to month/next/availability endpoints.

If you approve, I will implement these changes across the calendar service, API routes, and minimal UI adjustments, focusing on simplicity and correctness.