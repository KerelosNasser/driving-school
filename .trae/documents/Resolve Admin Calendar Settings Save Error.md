## Error Summary

* Console shows `Error saving calendar settings: {}` and a stack into Next.js compiled chunks.

* The error originates in `app/admin/components/CalendarSettingsTab.tsx:155–171` during `supabase.from('calendar_settings').upsert(settings, { onConflict: 'id' })`.

## Root Causes

* RLS policy blocks writes for unauthenticated users:

  * Client Supabase uses anon key (`lib/supabase.ts:38–45`).

  * Policies allow only `authenticated` (`sql/create_calendar_tables.sql:55–60`, `supabase/migrations/20241220000000_create_calendar_tables.sql:51–65`).

  * `app/admin` pages are not guarded by Clerk; anyone can reach them (`app/admin/page.tsx`, `middleware.ts`).

* Schema mismatch can cause failing `upsert`:

  * Two variants exist: `UUID PRIMARY KEY` (`sql/create_calendar_tables.sql:3`) vs `SERIAL PRIMARY KEY` (`supabase/migrations/20241220000000_create_calendar_tables.sql:3`).

  * Component types expect `id?: string` (UUID) while migration uses int. This can lead to type mismatch and duplicate rows when saving without `id`.

* Next 15 console formatting often renders non‑enumerable error objects as `{}`, masking Supabase error details.

## Implementation Changes

* Protect admin routes:

  * Add an `app/admin/layout.tsx` that checks `auth()` and enforces admin only (match `NEXT_PUBLIC_ADMIN_EMAIL`). Redirect non‑admins to `/sign-in`.

* Move saving to a secure server API route:

  * Create `app/api/calendar-settings/route.ts` (POST) that validates payload (e.g., zod), uses `supabaseAdmin` to `upsert`/`update`, and returns explicit error `{ message, code }`.

  * Restrict this route to admin via Clerk (`@clerk/nextjs/server`).

* Align schema and client types:

  * Decide on `id` type: if production uses `SERIAL`, change `CalendarSettings.id` to `number` and always upsert/update with a fixed `id` (e.g., `1`) to maintain singleton semantics.

  * If using `UUID`, keep `id: string` and ensure the singleton row’s `id` is loaded and included on save to avoid inserting new rows.

  * Confirm `vacation_days.date` uniqueness; handle duplicate insert errors with a clear toast.

* Improve error visibility client‑side:

  * In `CalendarSettingsTab.tsx`, log `error?.message` and `error?.code`; show `toast.error(error?.message || 'Failed to save calendar settings')`.

  * Optionally stringify `error` for debugging during development.

* Update `saveSettings` to call the new API route and handle responses; keep optimistic UI (`saving` state and success toast).

## Verification

* Sign in as the admin and open `app/admin`.

* Save settings and verify:

  * No RLS errors; success toast appears.

  * Only a single `calendar_settings` row is present; subsequent saves update the same row.

* Attempt save while signed out to confirm the route rejects non‑admins with a clear error.

* Confirm `loadSettings` works without errors and doesn’t break when multiple rows accidentally exist; fallback to `maybeSingle()` if needed.

* Validate `vacation_days` insertion respects uniqueness and shows readable errors.

## Notes

* Key locations:

  * `app/admin/components/CalendarSettingsTab.tsx:155–171`

  * `lib/supabase.ts:38–45`

  * `sql/create_calendar_tables.sql:3, 55–60`

  * `supabase/migrations/20241220000000_create_calendar_tables.sql:3, 51–65`

  * `app/admin/page.tsx` (no guard)

* This plan avoids leaking secrets and keeps writes server‑side behind admin auth.

