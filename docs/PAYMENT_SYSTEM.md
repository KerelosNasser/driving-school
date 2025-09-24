# Payment System Documentation

## Overview

This document describes the payment system implementation for the EG Driving School platform. The system is designed specifically for Australian businesses operating in Brisbane, with support for multiple payment gateways and robust error handling.

## Payment Gateways

The system currently supports the following payment gateways, optimized for Australian businesses. Manual payment methods are prioritized as the primary/recommended options:

### 1. PayID (Primary)
- **Fees**: 0.5% + 10¢ per transaction
- **Features**:
  - Instant bank transfers
  - Growing adoption in Australia
  - Email or mobile-based payments
  - Lowest transaction fees

### 2. Tyro EFTPOS (Primary)
- **Fees**: 1.8% + 30¢ per transaction
- **Features**:
  - Australian-owned payment provider
  - EFTPOS terminal integration
  - Popular with local businesses
  - Lower fees for Australian merchants

### 3. BPAY (Primary)
- **Fees**: 0.6% + 25¢ per transaction
- **Features**:
  - Bank transfer payments
  - Widely used in Australia
  - Available through internet banking
  - Low transaction fees

### 4. Stripe
- **Fees**: 2.9% + 30¢ per transaction
- **Features**:
  - Credit and debit card payments
  - Afterpay integration
  - Strong fraud protection
  - Comprehensive API for error handling
  - PCI compliance
  - Australian Dollar (AUD) support

### 5. Afterpay
- **Fees**: 3.5% + 30¢ per transaction
- **Features**:
  - Buy-now, pay-later option
  - Popular with Australian consumers
  - Automatic integration through Stripe

### 6. PayPal (Planned)
- **Fees**: 2.6% + 30¢ per transaction
- **Features**:
  - Widely recognized payment method
  - PayPal account payments
  - Strong customer trust

## User Synchronization

The payment system now includes automatic user synchronization between Clerk (authentication provider) and Supabase (database). When a user who exists in Clerk but not yet in Supabase attempts to make a payment, they are automatically created in Supabase with their profile information.

The synchronization process also handles cases where a user with the same email already exists in the database but without a Clerk ID, by linking the Clerk ID to the existing user record. This prevents duplicate user records and handles race conditions that might occur during user creation.

For manual payment methods, an atomic PostgreSQL function is used to ensure that both the user creation and manual payment session creation happen in a single transaction, preventing foreign key constraint violations.

## Implementation Details

### Frontend Components

1. **EnhancedCheckout.tsx**
   - Terms and conditions acceptance checkbox
   - Payment gateway selection UI with manual methods prioritized
   - Improved error messaging
   - Progress indicators
   - Trust signals display

2. **TrustSignals.tsx**
   - Security badge display
   - Payment method indicators
   - Satisfaction guarantee

### Backend API Routes

1. **create-quota-checkout-enhanced/route.ts**
   - Primary payment processing endpoint
   - Validation for terms acceptance
   - Promo code support
   - Rate limiting
   - Detailed error handling
   - Payment attempt logging
   - Support for multiple payment gateways
   - Automatic user synchronization with duplicate handling
   - Atomic session creation for manual payments

2. **create-quota-checkout/route.ts**
   - Legacy payment processing endpoint
   - Maintained for backward compatibility
   - Basic terms validation
   - Automatic user synchronization

3. **manual-payment/route.ts**
   - Handles manual payment methods (Tyro, BPAY, PayID)
   - Payment session management
   - Payment confirmation handling

4. **manual-payment/page.tsx**
   - Dedicated page for manual payment methods
   - Payment instructions display
   - Payment reference collection
   - Confirmation workflow

### Utilities

1. **payment-utils.ts**
   - Error parsing and categorization
   - Gateway comparison functions
   - Recommended gateway selection (now defaults to manual methods)
   - User-friendly error messaging

## Security Features

- Webhook signature verification
- Idempotency key support (planned)
- Rate limiting on payment attempts
- PCI compliance through Stripe
- SSL encryption
- Terms of service acceptance requirement
- Automatic user provisioning
- Atomic database operations for data integrity

## Error Handling

The system implements comprehensive error handling for various scenarios:

1. **Network Errors**
   - Connection failures
   - Timeout issues
   - Offline support (planned)

2. **Validation Errors**
   - Terms acceptance verification
   - Input validation
   - Package availability checks

3. **Gateway Errors**
   - Card decline handling
   - Insufficient funds
   - Expired cards

4. **Server Errors**
   - API failures
   - Database issues
   - Service outages

5. **User Synchronization Errors**
   - Automatic retry mechanisms
   - Graceful fallbacks
   - Detailed logging
   - Duplicate user handling

6. **Database Constraint Errors**
   - Foreign key constraint handling
   - Atomic operations to prevent race conditions
   - Proper transaction management

## Best Practices Implemented

1. **Terms Acceptance**
   - Mandatory checkbox for terms and conditions
   - Clear links to terms and privacy policy
   - Validation at both frontend and backend

2. **Multiple Payment Options**
   - Manual payment methods prioritized (PayID, Tyro, BPAY)
   - Card payments via Stripe
   - Afterpay integration
   - Future support for PayPal

3. **Australian Market Focus**
   - AUD currency support
   - Local payment preferences
   - Australian compliance requirements
   - Support for popular local payment methods

4. **Error Resilience**
   - Categorized error handling
   - User-friendly error messages
   - Recovery suggestions

5. **User Experience**
   - Automatic user provisioning
   - Seamless payment flow
   - Clear error messaging
   - Duplicate user handling
   - Atomic operations to prevent data inconsistencies

## Future Improvements

1. **Additional Gateways**
   - PayPal integration
   - Enhanced Tyro API integration
   - More detailed BPAY instructions

2. **Enhanced Features**
   - Idempotency key implementation
   - Customer object creation in Stripe
   - Subscription support for recurring packages

3. **Advanced Error Handling**
   - Service worker for offline payment processing
   - Retry mechanisms for transient failures
   - Detailed analytics on payment failures

## Usage

To process a payment:

1. User selects a package
2. User accepts terms and conditions
3. User selects payment method (PayID, Tyro, BPAY, Stripe, or Afterpay)
4. System creates checkout session via API
5. For card payments, user is redirected to Stripe
6. For manual payments, user is redirected to manual payment page
7. User completes payment through selected method
8. Webhook or manual confirmation processes payment
9. System updates user quota

## Compliance

- GDPR compliant data handling
- PCI DSS compliant through Stripe
- Australian Consumer Law adherence
- Privacy Act 1988 compliance