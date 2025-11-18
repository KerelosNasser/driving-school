## Goals
- Remove all remaining Theme and Drag‑Drop code and admin controls
- Keep and enhance SEO in `app/layout.tsx` and relevant pages
- Maintain reversibility and verify after each batch

## Safety & Change Management
- Create branch `remove-theme-dnd-enhance-seo`
- Apply changes in small, testable batches: Drag‑Drop → Theme → SEO Enhancements → Tests/cleanup
- After each batch: run lint and build; smoke test `/`, `/about`, `/contact`, `/packages`, `/admin`

## Batch 1: Remove Drag‑Drop From Pages and Code
- Pages:
  - `app/about/page.tsx`: remove `EditableWrapper` and `DropZoneArea` imports/usages; render static sections (retain `EditableText`/`EditableImage` where useful)
  - `app/contact/page.tsx`: same removal of `EditableWrapper`/`DropZoneArea`
- Core drag‑drop code:
  - Delete `lib/drag-drop/**` (providers, hooks, managers, debug files)
  - Ensure no remaining runtime references; keep generic component rendering not tied to dnd
- Verification: lint and build

## Batch 2: Remove Theme Feature Usage
- UI toasts:
  - `components/ui/sonner.tsx`: remove `next-themes` and set a fixed `theme` prop (e.g., `'light'`)
- Residual theme modules/tests:
  - Remove any remaining `lib/theme/**` modules if present
  - Remove `__tests__/theme/**`
- Verification: lint and build

## Batch 3: SEO Enhancements (no minimization)
- Keep and improve `app/layout.tsx` metadata:
  - Ensure canonical via `metadataBase` + `alternates` (canonical URL)
  - Expand OpenGraph/Twitter images with correct dimensions and alt text; ensure URLs are absolute
  - Add `robots` tuned for production; keep `manifest`
- Add JSON‑LD structured data:
  - Organization/LocalBusiness schema injected in `<head>` via `<script type="application/ld+json">`
  - Service schema (Driving Lessons) for `/packages`
- Per‑page metadata (where helpful):
  - Add `export const metadata` to `app/packages/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx` with specific titles/descriptions
- Keep `app/sitemap.ts` as is (or enhance with priority/changefreq if applicable)
- Verification: build; inspect `<head>` output and validate JSON‑LD with a validator

## Batch 4: Admin Controls
- Confirm no admin tabs reference theme/drag‑drop/SEO; if any legacy tab exists, remove tab item(s) from `AdminDashboardClient.tsx`
- Verify `/admin` shows only relevant tabs

## Batch 5: Tests And Dead Code Cleanup
- Remove `__tests__/drag-drop/**` and `__tests__/theme/**`
- Run tests and lint

## Final Verification
- Build runs cleanly
- Pages render without dnd wrappers and without theme dependency
- SEO is preserved/enhanced (metadata + JSON‑LD + canonical)
- Admin panel free of theme/dnd/SEO controls

## Deliverables
- Clean pages without drag‑drop wrappers
- Removed drag‑drop and theme modules
- Enhanced SEO metadata and JSON‑LD
- Admin panel free of related controls
- A concise change log summarizing removed files and added SEO enhancements