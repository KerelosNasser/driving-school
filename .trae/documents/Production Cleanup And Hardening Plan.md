## Goals
- Remove development artifacts (console logs, debug code, test/demo pages) without affecting production features
- Eliminate sensitive development information and unsafe settings
- Optimize production build configuration and monitoring
- Keep process reversible with backups, branches, and small, tested batches

## Safety & Change Management
- Create branch `prod-cleanup`
- Add a lightweight backup tag `pre-cleanup-<date>`
- Apply changes in small batches (per area) with separate commits
- After each batch: run unit tests, build, and smoke test critical flows

## Batch 1: Centralize and Gate Logging
- Add `lib/logger.ts` using `winston`
  - Levels: error, warn, info, debug
  - In production: only `error`/`warn` print; info/debug are silent or forwarded to Sentry
- Enforce `no-console` in ESLint
  - Add rule: `no-console: ['error', { allow: ['warn','error'] }]`
- Replace runtime `console.log/debug/info/trace/time*` with logger calls in these directories:
  - `app`, `components`, `contexts`, `hooks`, `lib` (exclude `__tests__`, `scripts`, theme demo/test files)
- Examples to update:
  - `contexts/editModeContext.tsx:253, 255, 258, 269, 272, 281, 287, 327, 346, 363, 365, 381, 410, 449, 514` (connection and save logs)
  - `lib/google-api/logger.ts:265-274` (gate info/debug to avoid console noise in prod)
  - `middleware.ts:9` (keep gated by `NODE_ENV`; optionally route to logger)

## Batch 2: Remove/Gate Development Endpoints & Pages
- Remove or gate behind `NODE_ENV !== 'production'`:
  - `app/api/debug-checkout/route.ts`
  - `app/api/debug-packages/route.ts`
  - `app/sentry-example-page/page.tsx`
  - `app/sentry-example-api/route.ts`
  - `app/test-calendar-settings/page.tsx`
- Keep `.disabled` route handlers disabled; verify none are mounted in prod

## Batch 3: Environment & Secrets Hygiene
- Remove development-only flags from env files
  - Delete `NODE_TLS_REJECT_UNAUTHORIZED` entries
  - Replace `NEXT_PUBLIC_APP_URL` with prod URL via deployment env
  - Fix `NEXTAUTH_SECRET` to a generated static secret per environment
- Move all private secrets to deployment secret manager (no secrets in repo)
  - Rotate: `CLERK_SECRET_KEY`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `GROQ_API_KEY`, `HUGGING_FACE_API_KEY`, `HYPERBOLIC_API_KEY`, `VERCEL_OIDC_TOKEN`, `SENTRY_AUTH_TOKEN`
- Audit `NEXT_PUBLIC_*` values to ensure only non-sensitive configs are exposed

## Batch 4: Production Build Hardening
- `next.config.ts`
  - Set `typescript.ignoreBuildErrors: false`
  - Set `eslint.ignoreDuringBuilds: false`
  - Add `productionBrowserSourceMaps: false`
- Sentry configs (`sentry.*.config.ts`)
  - Reduce `tracesSampleRate` for prod (e.g., `0.1`) and `replaysSessionSampleRate` appropriately
  - Use `process.env.NODE_ENV` gating for sampling overrides

## Batch 5: Clean Code Waste
- Run `npm run lint:fix` and address remaining issues
- Remove unused imports/functions flagged by ESLint and TS
- Delete demo/test-only theme files not referenced by production code (retain unit tests in `__tests__`)

## Batch 6: Verification After Each Batch
- Commands
  - `npm run type-check`
  - `npm run lint`
  - `npm run production:build`
  - `npm test` and selected Playwright specs (`playwright test --project chromium`)
- Smoke tests
  - Booking flow: `/packages` → checkout → `app/api/create-quota-checkout`
  - Calendar sync: `app/api/calendar/sync`, `status`, `events`
  - Admin dashboard pages and tabs
  - Auth flows ((auth)/sign-in, sign-up, complete-profile)
  - Webhooks: Clerk webhook route

## Batch 7: Sensitive Data Review
- Grep and inspect for accidental logging of secrets and PII after logger migration
- Verify `auditLogger` only logs in development (`lib/validation/auditLogger.ts:53-55`)
- Ensure no API returns internal error stacks in production

## Documentation & Checkpoints
- Create `docs/ProductionCleanup.md` capturing:
  - What was removed/changed and why
  - Affected files and commits
  - Verification steps and pass/fail notes
  - Post-cleanup checklist
- Tag `post-cleanup-<date>` after full verification

## Reversibility
- Each batch is an isolated commit on `prod-cleanup`
- Easy rollback via `git revert` or branch reset to `pre-cleanup-<date>`

## Deliverables
- Clean, production-ready codebase with centralized gated logging
- Hardened `next.config.ts` and Sentry sampling
- Secrets removed from repo and rotated
- Documented, reproducible cleanup process with verification notes

Confirm to proceed; I will execute the batches, verify, and share a concise change log plus any necessary follow-up fixes.