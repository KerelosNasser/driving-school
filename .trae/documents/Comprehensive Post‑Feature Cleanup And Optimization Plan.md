## Goals
- Remove remaining code tied to removed features (Theme, Drag‑Drop, SEO utilities) and admin controls
- Eliminate code waste: unused files, dependencies, disabled endpoints, debug/test routes
- Improve efficiency: smaller bundle, faster builds, less memory use at runtime
- Modernize configs (Sentry instrumentation), and keep SEO strong

## Phase 1: Redundant Feature Code
- Search and remove any remaining references to:
  - Drag‑Drop: `EditableWrapper`, `DropZoneArea`, `useDragDrop`, `lib/drag-drop/*`
  - Theme: `next-themes` usage anywhere else, any `lib/theme/*` remnants
  - SEO utilities: `lib/seo/utils.ts` if truly unused
- Verify pages compile and render without those features

## Phase 2: Admin Controls And Disabled Routes
- Remove admin controls for deleted features if present (tab labels or helper text)
- Delete disabled route files (`*.disabled`) under `app/api/**` to cut noise
- Remove leftover debug/test endpoints no longer needed: `app/api/debug/**`, `app/api/test-checkout/route.ts`

## Phase 3: Dependencies And Build Footprint
- Remove unused dependencies from `package.json`:
  - `@dnd-kit/*`, `react-dnd*`, `@hello-pangea/dnd`, `next-themes`
  - `winston` if not referenced anywhere
- Run install and verify the app builds without these libs

## Phase 4: Code Waste Cleanup
- Replace any remaining `console.log/info/debug` with centralized logger or remove entirely in runtime files
- Remove unused imports/variables flagged by ESLint (`no-unused-vars`)
- Delete unreferenced files & assets (e.g., unused workers, scripts) after verifying no imports

## Phase 5: Environment Hygiene
- Confirm `.env.local` is not committed (use `.env.development.local` locally); ensure secrets live in deployment env
- Remove dev-only flags (`NODE_TLS_REJECT_UNAUTHORIZED`) and keep `NEXT_PUBLIC_*` only non-sensitive

## Phase 6: Sentry Modernization
- Move client init from `sentry.client.config.ts` to `instrumentation-client.ts` to resolve Turbopack deprecation
- Keep production sampling conservative; verify DSN via env

## Phase 7: SEO Enhancements (Keep Strong)
- Add per-page metadata for `/about`, `/contact`, `/packages` (titles, descriptions)
- Add BreadcrumbList JSON‑LD for key pages; Service JSON‑LD on `/packages`

## Phase 8: Verification
- Lint and type-check; fix new warnings from removals
- Production build; spot-check `/`, `/about`, `/contact`, `/packages`, `/admin`
- Confirm bundle size reduction and no runtime errors

## Deliverables
- Clean repo (features and controls removed, unused deps/files deleted)
- Modernized Sentry instrumentation
- Enhanced per-page SEO (metadata + JSON‑LD)
- Report summarizing removed items, dependency diff, and verification results