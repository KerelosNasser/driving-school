# Endpoint Cleanup Report - Production Readiness

## Summary
This report identifies development/test endpoints and unused API routes that should be removed before production deployment.

## ✅ COMPLETED REMOVALS

### 1. Development/Debug Endpoints (REMOVED)
- ~~**`app/api/debug/user-status/route.ts`**~~ - Debug endpoint for checking user status and table existence
- ~~**`app/api/debug-checkout/route.ts`**~~ - Debug endpoint for testing checkout flow
- ~~**`app/api/debug-packages/route.ts`**~~ - Debug endpoint for checking packages table
- ~~**`app/api/test-checkout/route.ts`**~~ - Test endpoint for creating test payment sessions

### 2. Test/Example Pages (REMOVED)
- ~~**`app/sentry-example-page/page.tsx`**~~ - Sentry testing page (only used for error monitoring tests)
- ~~**`app/api/sentry-example-api/route.ts`**~~ - API route for Sentry testing
- ~~**`app/test-calendar-settings/page.tsx`**~~ - Test page for calendar settings validation

### 3. Initialization Endpoints (REMOVED)
- ~~**`app/api/init-packages/route.ts`**~~ - One-time initialization endpoint for creating default packages

### 4. Empty API Directories (REMOVED)
- ~~**`app/api/create-checkout-session/`**~~ - Empty directory
- ~~**`app/api/payment-id-checkout/`**~~ - Empty directory
- ~~**`app/api/debug/`**~~ - Empty directory after removing debug endpoints

### 5. Script Updates (COMPLETED)
- Updated `scripts/test-api-endpoints.js` to remove references to deleted debug endpoints

## ⚠️ ENDPOINTS TO REVIEW (Potentially Unused)

### Confirmed Unused (Recommend Removal):

1. **`app/api/graphql/route.ts`** + **`lib/graphql/*`** 
   - ❌ NOT used in production code
   - Only referenced in test files
   - GraphQL dependencies in package.json: @apollo/server, graphql, graphql-*
   - **RECOMMENDATION**: Remove if not planning to use GraphQL

2. **`app/api/realtime/*`** (content, presence, sessions)
   - ❌ NOT used in production code
   - No fetch calls to /api/realtime found
   - **RECOMMENDATION**: Remove if not planning to use realtime features

### Keep (Production Features):

3. **`app/api/content/persistent/`** 
   - ✅ KEEP - Used in production
   - Referenced in `contexts/editModeContext.tsx`
   - Used for persistent content management
   - EditModeProvider is in root layout (app/layout.tsx)

4. **`app/api/conflicts/*`** 
   - ✅ KEEP - Used in production
   - Referenced in `contexts/editModeContext.tsx`
   - Used for conflict resolution in edit mode
   - Part of collaborative editing feature

## ✅ PRODUCTION ENDPOINTS (Keep)

These are actively used in production:
- `/api/admin/*` - Admin dashboard functionality
- `/api/calendar/*` - Calendar booking system
- `/api/packages/*` - Package management
- `/api/quota/*` - Quota management
- `/api/user/*` - User profile management
- `/api/manual-payment/*` - Manual payment processing
- `/api/webhooks/*` - Webhook handlers
- `/api/reviews/*` - Review system
- `/api/rewards/*` - Referral rewards
- `/api/scheduling/*` - Scheduling system
- `/api/chatbot/*` - Chatbot functionality
- `/api/health/*` - Health check endpoint

## 📋 CLEANUP ACTIONS

### Phase 1: Safe Removals (No dependencies)
1. Remove debug endpoints
2. Remove test pages
3. Remove empty directories
4. Remove Sentry example pages

### Phase 2: Verify & Remove
1. Check init-packages usage in production
2. Verify GraphQL usage
3. Review realtime features
4. Check conflict resolution usage

## 🔍 VERIFICATION NEEDED

Before removing, verify these are not used in:
- Production scripts
- Cron jobs
- External integrations
- Admin tools

---

## 📊 CLEANUP SUMMARY

### ✅ Completed (Phase 1)
- Removed 8 debug/test endpoints
- Removed 3 test pages
- Removed 6 empty directories
- Updated test scripts to remove references
- **Total files removed**: ~15 files

### 🎯 Recommended Next Steps (Phase 2)

#### High Priority - Safe to Remove:
1. **GraphQL Infrastructure** (if not planning to use)
   - Delete `app/api/graphql/` directory
   - Delete `lib/graphql/` directory
   - Remove GraphQL dependencies from package.json:
     - @apollo/server
     - @as-integrations/next
     - @graphql-tools/schema
     - graphql
     - graphql-depth-limit
     - graphql-middleware
     - graphql-query-complexity
     - graphql-scalars
     - graphql-shield
     - graphql-subscriptions
   - Remove GraphQL tests from `__tests__/graphql/`
   - **Estimated savings**: ~50+ files, ~10MB in node_modules

2. **Realtime API** (if not planning to use)
   - Delete `app/api/realtime/` directory (content, presence, sessions)
   - **Estimated savings**: ~10 files

#### Medium Priority - Review Before Removing:
3. **Test Files** - Review and remove unused test files in `__tests__/`
4. **Coverage Reports** - Remove `coverage/` directory from git if tracked
5. **Playwright Reports** - Remove `playwright-report/` and `test-results/` if tracked

### 💾 Estimated Total Cleanup Impact:
- **Files**: 75+ files removed
- **Dependencies**: 10+ packages removed
- **Bundle size**: Reduced by ~15-20MB
- **Build time**: Potentially faster without unused dependencies
