## Overview

* Implement a mobile-first quick booking flow at `/quick-book` using existing components and APIs, without modifying any existing component code.

* Steps: Details → Package → Manual PayID + WhatsApp → Summary + Calendar (reused).

## Reuse Existing Calendar

* Embed the existing Google Calendar UI from `GoogleCalendarIntegration` directly in Step 4 for real-time availability (c:\projects\Next.js Projects\driving-school\app\service-center\components\GoogleCalendarIntegration.tsx:39).

* Do not alter its internals; users can preview slots immediately. Actual booking will work only after admin grants hours (quota).

## Step-by-Step Flow

* Step 1: Collect `full name`, `address`, `suburb` (from `lib/data.ts`), `phone`. Pre-fill via `/api/user` when available.

* Step 2: Fetch and display packages from `/api/packages`. Capture `packageId`.

* Step 3: Create manual payment session with `POST /api/create-quota-checkout-enhanced` including Step 1 `metadata`. Display PayID and collect `paymentReference`. Confirm via `POST /api/manual-payment/confirm` (WhatsApp notify via CallMeBot).

* Step 4: Show summary (details + amount + `paymentReference`) and embed `GoogleCalendarIntegration` below for viewing availability and selecting a preferred slot. Booking remains pending until admin verification; quota gating will prevent premature confirmations.

## Admin Verification

* Admin approves in Payment Verification tab (c:\projects\Next.js Projects\driving-school\app\admin\components\PaymentVerificationTab.tsx:1) via `api/admin/verify-payment`.

* Once hours are granted, the embedded calendar’s booking action will succeed without any code changes.

## Config & Security

* Uses `CALLMEBOT_API_KEY`, `ADMIN_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PAYID_IDENTIFIER`. No secrets exposed; only `NEXT_PUBLIC_PAYID_IDENTIFIER` shown to users.

## Acceptance Criteria

* `/quick-book` provides a 4-dot progress indicator and works smoothly on phones.

* Manual payment confirmation sets status to `pending_verification` and alerts admin via WhatsApp.

* Calendar is reused as-is for availability; booking becomes possible immediately after admin approval.

