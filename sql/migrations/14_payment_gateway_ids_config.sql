-- Migration: Payment Gateway IDs Configuration
-- This migration documents the addition of payment gateway IDs to the environment configuration
-- to support manual payment methods (PayID, Tyro EFTPOS, BPAY).

-- No database schema changes required for this migration.
-- This is a configuration documentation update.

-- The following environment variables should be added to .env and .env.example files:
-- TYRO_PAYMENT_ID=your_tyro_payment_id_here
-- BPAY_BILLER_CODE=your_bpay_biller_code_here
-- PAYID_IDENTIFIER=your_payid_identifier_here

-- These variables are used to provide customers with the necessary payment details
-- when making manual payments through the Tyro, BPAY, or PayID payment methods.

-- The variables are accessed in:
-- 1. app/api/manual-payment/route.ts - to provide payment details in API responses
-- 2. app/manual-payment/page.tsx - to display payment instructions to customers