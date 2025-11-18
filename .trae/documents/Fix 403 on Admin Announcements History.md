## Root Cause
- The 403 is triggered by a hard admin check against a Supabase table that likely doesn’t exist or has no admin row:
  - `app/api/admin/announcements/history/route.ts:23-27` returns 403 when `user_roles.role !== 'admin'` or when the query errors.
  - `app/api/admin/announcements/send/route.ts:69-73` uses the same pattern.
- Your project already provides a consistent admin check via Clerk metadata or the `NEXT_PUBLIC_ADMIN_EMAIL` fallback:
  - `lib/auth-helpers.ts:8-37` (`isAdmin`) and `lib/auth-helpers.ts:43-66` (`isUserAdmin`).
- The announcements routes don’t use these helpers and therefore forbid even valid admins. In development, `app/api/admin/users/route.ts:10-25,35-38` allows admins, but announcements endpoints don’t.

## Affected Files
- `app/api/admin/announcements/history/route.ts:5-68`
- `app/api/admin/announcements/send/route.ts:51-227`
- UI fetches history in `app/admin/components/AnnouncementTab.tsx:58-68,122-127`.
- Middleware logging only (`middleware.ts:7-11`).

## Changes
1. Replace Supabase `user_roles` check with Clerk/email-based admin helper:
   - Import `isUserAdmin` from `lib/auth-helpers.ts`.
   - In both routes, after `auth()`:
     - `if (!userId) return 401`.
     - `const isAdmin = await isUserAdmin(userId); if (!isAdmin) return 403`.
   - Remove the `user_roles` query entirely.
2. Keep announcement data fetching/sending logic intact.
3. Optional: in dev, allow all authenticated users as admin to match `users` endpoint behavior.
4. UI improvement (optional): if history fetch returns non-OK, surface a toast so admins see the error cause.

## Verification
- Start dev server and hit `GET /api/admin/announcements/history` while authenticated as the admin (email matches `NEXT_PUBLIC_ADMIN_EMAIL` or Clerk `publicMetadata.role === 'admin'`). Expect 200 and `{ success: true, announcements: [...] }`.
- Trigger a send via UI; check `POST /api/admin/announcements/send` returns 200 and history updates.
- Confirm no 403s in console logs.

## Notes
- No database schema changes required; removes dependency on non-existent `user_roles` table.
- Leverages existing, project-wide admin policy for consistency.