<!-- .github/copilot-instructions.md - guidance for AI coding agents -->
# Copilot / AI agent instructions — driving-school

Short, actionable guidance to help AI agents be productive in this repository.

1. Big picture
   - This is a Next.js (App Router) full-stack app (see `app/`) using TypeScript + Tailwind.
   - Frontend and API are in the same repo: pages and UI live under `app/` and reusable UI in `components/`.
   - Backend logic runs as Next.js API routes under `app/api/` (e.g. `app/api/create-checkout-session/`, `app/api/webhooks/stripe/`, `app/api/chatbot/`).
   - Persistent data lives in Supabase; client helpers are in `lib/supabase.ts`. Auth uses Clerk (see `middleware.ts` and `app/layout.tsx`).

2. Where to make safe edits
   - Small UI or layout tweaks: `components/` and `app/layout.tsx`.
   - API behavior changes: `app/api/**` routes. Keep payload shapes compatible with clients.
   - DB schema changes: `sql/` and `lib/supabase.ts` (update TypeScript types in `lib/supabase.ts` when schema changes).

3. Important patterns and conventions (do not invent alternatives)
   - Authentication: Clerk used globally via `middleware.ts` and `ClerkProvider` in `app/layout.tsx`. Respect Clerk session APIs and env var names `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
   - Data access: Use the Supabase client exported from `lib/supabase.ts` for client-side and the server helpers in `lib/api-middleware.ts` or `lib/api-state-manager.ts` for server-side flows.
   - Error & monitoring: Sentry is wired via `next.config.ts` and `instrumentation.ts`. Add Sentry.captureException(...) in server-side error handlers when appropriate.
   - Rate limiting: `lib/rate-limit.ts` is used on routes that require protection. Reuse it instead of adding ad-hoc solutions.
   - Validation: Zod schemas are expected for request validation (used across `app/api/*`). Follow existing Zod usage patterns when adding new endpoints.

4. Build / test / dev commands
   - Dev server: `npm run dev` (uses `next dev --turbopack`).
   - Production build: `npm run build` then `npm run start`.
   - Type check: `npm run type-check`.
   - Lint: `npm run lint`.
   - Tests: `npm run test` (Jest config in `jest.config.js`). Use `npm run test:watch` for iterative work.

5. Environment & deployment notes
   - The app expects many env vars: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), Clerk publishable key, Stripe keys, Resend, Hugging Face keys, and `NEXT_PUBLIC_CHATBOT_WIDGET_ID` for the external widget.
   - Vercel is the recommended host. When changing API routes that depend on webhooks (Stripe), ensure webhook URL and secret are configured in the deployment.

6. Examples & file references
   - Add an authenticated API route: mimic `app/api/send-booking-email/route.ts` (validate with Zod, use Clerk auth, call `lib/supabase.ts` and `resend` client).
   - Add a new UI component: see `components/ui/` for shadcn-based components. Export props types and default story-like usage from the same directory.
   - Chatbot: server side model/knowledge is in `lib/chatbot-knowledge.ts` and frontend widget loader in `app/layout.tsx`.

7. Auto-generated artifacts & conventions
   - Keep TypeScript types in `lib/types.ts` and `lib/supabase.ts` in sync with SQL in `sql/`.
   - Use `app/global-error.tsx` for global error UI; prefer surface-level error boundaries per route/segment.

8. Quick heuristics for PR suggestions
   - Prefer small, focused PRs that change UI or API in one area.
   - If adding a new dependency, ensure it appears in `package.json` and is consistent with existing libraries (e.g., prefer `@xenova/transformers` or `@huggingface/inference` already present).
   - If updating database schema, add SQL to `sql/` plus update TypeScript definitions and any seeds in `sql/seed.sql`.

9. When to ask the human
   - Breaking schema or auth behavior changes (Clerk or Supabase) that affect data migration or deployment secrets.
   - Adding external integrations that require new privileged credentials (Stripe webhooks, Resend, Hugging Face inference).

If anything here is unclear or you want more examples (API route template, Zod schema examples, or component skeleton), say what area to expand and I will iterate.
