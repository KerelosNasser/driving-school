## Issue Summary
- Editable Terms & Conditions on the packages page fails to load because the client code assumes an array response and `content_key/content_json` fields, but the API returns a single object and `key/value` fields.
- Evidence:
  - Client parsing in `components/ui/editable-terms-conditions.tsx:46-50` calls `data.data.find(...)` and expects `content_key/content_json`.
  - Client parsing in `components/ui/terms-acceptance-dialog.tsx:41-45` does the same.
  - API handler `app/api/admin/content/route.ts:32-44` returns a single object when `key` is present and uses `key/value` fields.

## Root Cause
- Response shape mismatch and field-name mismatch between admin content API and the components.
- Components are built around the persistent content model (`content_key/content_json`), but they fetch from the admin content endpoint that returns `key/value` from a different table.

## Implementation Steps
### 1) Switch Terms loading to persistent content API
- In `components/ui/editable-terms-conditions.tsx`, update the fetch to `GET /api/content/persistent?page=packages&key=packages_terms_conditions` and parse the single item response.
- Replace `.find(...)` with direct `data` item parsing:
  - If `data` exists and `data.content_json` is an array → `setTerms(data.content_json)`.
  - Else → `setTerms(defaultTerms)` and initialize storage by saving defaults.
- Reference: current faulty parsing `components/ui/editable-terms-conditions.tsx:46-50`.

### 2) Align saving to persistent content API
- Update `saveTerms` in `components/ui/editable-terms-conditions.tsx:70-100` to call `PUT /api/content/persistent` with body `{ key: contentKey, value: newTerms, type: 'json', page }`.
- Handle success via `{ success: true }` and show Sonner success; on failure, show Sonner error.

### 3) Fix Terms Acceptance Dialog loader
- In `components/ui/terms-acceptance-dialog.tsx`, change fetch to `GET /api/content/persistent?page=packages&key=packages_terms_conditions`.
- Parse single item (`result.data`) instead of array `.find(...)`.
- Reference: current faulty parsing `components/ui/terms-acceptance-dialog.tsx:41-45`.

### 4) Defensive parsing for both shapes (optional fallback)
- If `data.data` is an array (legacy), still support it by checking `Array.isArray(data.data)` and mapping to the expected structure when needed.
- Prefer the persistent endpoint to avoid future mismatches.

### 5) Keep admin-only mutations consistent
- Persistent PUT requires auth; ensure edits happen while logged in as admin. In dev, `isUserAdmin` allows; in production, ensure proper admin role.

## Verification
- Open `/packages` and confirm:
  - Terms render without Sonner error.
  - Toggle edit mode and add/update/delete a term → Sonner shows success and list updates.
  - Refresh the page → edited terms persist and load from persistent API.
- Cross-check `TermsAcceptanceDialog` opens and shows terms correctly.

## Notes / Follow-ups
- `PersistentEditableText` uses `PersistentContentLoader` directly in a client component, which relies on server-only APIs (`fs`, service role key). It works due to bundling/usage patterns but should be reviewed for security and SSR consistency.
- If we prefer to keep using the admin content route, we must update that route to return an array and `content_*` fields or update both components to parse `key/value`. The persistent approach is cleaner and consistent with `lib/contentLoader.ts`.