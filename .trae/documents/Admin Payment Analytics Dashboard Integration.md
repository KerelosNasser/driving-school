## Overview
- Build a comprehensive admin analytics dashboard focused on Australian transactions with a Brisbane emphasis.
- Integrate directly with the existing manual payment gateway and Supabase data to provide secure, real‑time metrics, visualizations, search/filtering, and exportable reports.
- Preserve and extend current flows: session creation, confirmation, quota updates and transaction logging.

## Current Payment Flow (Key References)
- Enhanced manual checkout: `app/api/create-quota-checkout-enhanced/route.ts:19-178` creates PayID session (AUD), generates `paymentId`, logs attempts.
- Manual payment session fetch: `app/api/manual-payment/route.ts:5-53` returns PayID details.
- Manual payment confirmation: `app/api/manual-payment/confirm/route.ts:9-137` validates reference, marks session completed, updates quotas, logs `quota_transactions`.
- Rate limiting: `lib/rate-limit.ts:51-93` governs payment attempts.
- Payment ID utilities: `lib/payment-id-service.ts:22-218` generation/validation/reference helpers.
- User geocoding into Supabase: `hooks/useBookings.ts:91-109` populates `users.latitude/longitude/address` from booking location.

## Data Model Updates
- Extend `manual_payment_sessions` to ensure location fields required for AU/Brisbane analytics:
  - Add columns when missing: `country TEXT`, `city TEXT`, `region TEXT`, `latitude DOUBLE`, `longitude DOUBLE`, `user_location_source TEXT`.
  - Indexes: partial indexes on `(country)` and `(city)`; composite `(city, created_at)` for trend queries; GIST on `(latitude, longitude)` if spatial queries are needed.
- Ensure `quota_transactions` includes `amount_paid`, `payment_id`, `metadata.gateway`, `metadata.payment_reference` (already logged in confirm route).
- Source of location:
  - First choice: `users.address/latitude/longitude` via existing geocoding.
  - Fallback: geocode `metadata.user_address` or booking location using `lib/geocoding.ts` and store `city='Brisbane'` when detected.

## Backend APIs (Secure Admin)
- `GET /api/admin/payments/metrics`
  - Auth: Clerk admin-only, Supabase service role.
  - Returns JSON aggregates for the admin dashboard:
    - Success/failure rates from `manual_payment_sessions.status` over time and totals.
    - Geographic distribution grouped by `city` with `country='AU'` (flag Brisbane highlight).
    - Transaction volume trends (daily/weekly counts) across AU, filterable by Brisbane.
    - Revenue analytics (sum of `amount` for `status='completed'`, by period and gateway).
- `GET /api/admin/payments/transactions`
  - Auth: Clerk admin-only.
  - Paginated list combining `manual_payment_sessions` and `quota_transactions` for Australian transactions.
  - Query params: `paymentId`, `status`, `gateway`, `city`, `dateFrom`, `dateTo`, `onlyBrisbane=true|false`.
- `GET /api/admin/payments/reports`
  - Auth: Clerk admin-only.
  - Generates downloadable CSV (and optional PDF) for AU transactions; supports filters identical to transactions endpoint.
- Implementation details:
  - Use server-side Supabase client with `SUPABASE_SERVICE_ROLE_KEY` similar to `app/admin/page.tsx:9-12`.
  - Zod schemas for all inputs; consistent error envelope and `X-Request-ID` header.
  - Rate limit admin endpoints conservatively; add idempotency for report generation.

## Manual Gateway Enhancements
- Session creation (`create-quota-checkout-enhanced`): enrich RPC payload with location metadata when available: `country='AU'`, `city`, `latitude/longitude`.
- Confirmation (`manual-payment/confirm`): keep transaction logging to `quota_transactions`; ensure `currency='AUD'` and gateway validation; capture final location snapshot for analytics.
- Logging: structured, minimal PII, include `payment_id`, `session_id`, `status`, `amount`, and coarse location; send errors to Sentry.

## Admin Dashboard UI
- New sidebar tab: “Payments”.
- Client components (dynamic):
  - `PaymentsOverview`: KPIs (success % | failure %, total revenue, AU revenue, Brisbane share), small sparkline trends.
  - `PaymentsCharts`: 
    - Success/failure rates over time (line/area chart).
    - Geographic distribution (map marker cluster; Brisbane highlighted). Reuse Leaflet components (`components/maps/LeafletAdminMap.tsx`) if present.
    - Transaction volume trends (bar/line by day).
    - Revenue analytics (stacked bar by gateway, total line).
  - `PaymentsTable`: searchable, filterable transaction list with a detail drawer; search by `paymentId` and filters (status, gateway, Brisbane toggle, date range).
  - `PaymentsReport`: export AU transactions to CSV/PDF with current filters.
- Charting library: use `recharts` via dynamic import in client components to avoid SSR issues. If an existing chart lib is found, adopt it; otherwise add `recharts` with minimal bundle impact.
- Data fetching: dashboard components call the new admin endpoints; handle loading, errors, and empty states.

## Security & Compliance (2025 Best Practices)
- Authentication & authorization: Clerk admin role checks on all new endpoints and admin UI.
- Transport security: HTTPS enforced; no service role keys exposed client-side.
- Input validation: Zod schemas for endpoints and user actions, strict types.
- Rate limiting & anomaly detection: reuse `lib/rate-limit.ts`, add admin limits and monitoring.
- Sensitive data handling: redact PII in logs; avoid storing raw PayID account identifiers; store normalized identifiers only when strictly necessary.
- Auditability: include `payment_id`, `session_id`, timestamps; persist error events and status transitions.
- Data residency: filter and report only AU; explicitly tag records `country='AU'` for compliance.
- Optional: encrypt `payment_reference` at rest using Postgres `pgcrypto` or Supabase vault if required.

## Verification
- Unit tests for admin endpoints: schema validation, auth gates, Brisbane filters, aggregates correctness.
- Integration tests: simulate manual payment session → confirm → metrics update; verify revenue/success metrics and Brisbane grouping.
- UI checks: render charts and table with mocked responses; CSV export contents validated.
- Observability: confirm Sentry captures errors; verify rate limiting headers; add `X-Request-ID` to responses.

## Implementation Steps
1) Database extension and indexes for location analytics fields (AU/Brisbane).
2) Enrich payment session creation with location metadata and AUD validation.
3) Harden confirmation route with stricter validation and consistent logging.
4) Implement admin metrics/transactions/reports endpoints.
5) Build Payments tab UI with KPIs, charts, table, and export.
6) Add tests for endpoints and components; verify end-to-end flow.

## Deliverables
- Admin Payments tab with live analytics focused on Australian and Brisbane transactions.
- Secure endpoints powering metrics, lists, and reports.
- Updated payment flow capturing location and robust logging/error handling.
- Tests and verification artifacts to ensure correctness and resilience.