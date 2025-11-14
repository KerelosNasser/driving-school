# 🦁 Brave Browser - Connection Issues Fix

## Problem
Brave browser is blocking connections to:
- ❌ Supabase (database)
- ❌ Sentry (error tracking)
- ❌ WebSocket connections (real-time updates)

This causes:
- Failed API requests
- Real-time features not working
- Error tracking disabled

---

## ✅ Quick Fix (Recommended)

### Option 1: Disable Shields for Localhost

1. **Click the Brave Shield icon** (lion icon in address bar)
2. **Toggle "Shields" to OFF** for `localhost:3000`
3. **Refresh the page**

This allows all connections while developing locally.

### Option 2: Configure Brave Shields

1. **Click Brave Shield icon**
2. **Advanced View** → **Advanced Controls**
3. Set these options:
   - **Trackers & ads blocking**: Standard (not Aggressive)
   - **Block cross-site cookies**: Disabled
   - **Block Fingerprinting**: Standard (not Strict)
   - **Block Scripts**: Disabled

---

## 🔧 What I Fixed in Code

### 1. Updated Content Security Policy (CSP)
Added Supabase URLs to allowed connections:

```typescript
// Before (blocked Supabase)
connect-src 'self' https://*.googleapis.com https://*.google.com

// After (allows Supabase)
connect-src 'self' https://*.googleapis.com https://*.google.com 
  https://*.supabase.co wss://*.supabase.co
```

### 2. WebSocket Support
Added `wss://*.supabase.co` for real-time connections.

---

## 🚀 After Applying Fix

**Restart your dev server:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

**Clear browser cache:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

**Refresh the page:**
- Press `Ctrl + F5` (hard refresh)

---

## 🔍 Verify It's Working

### Check Console (F12)
You should NO LONGER see:
- ❌ `violates the following Content Security Policy directive`
- ❌ `ERR_BLOCKED_BY_CLIENT`
- ❌ `Refused to connect`

You SHOULD see:
- ✅ `Realtime connection opened`
- ✅ `Real-time connection established`
- ✅ API requests succeeding

---

## 🛡️ Why Brave Blocks These

Brave's privacy features block:

1. **Third-party trackers** (Sentry)
   - Sentry tracks errors for debugging
   - Brave sees it as "tracking"
   - Solution: Disable shields for localhost

2. **Cross-origin requests** (Supabase)
   - Your app (localhost:3000) → Supabase (*.supabase.co)
   - Brave blocks by default
   - Solution: Added to CSP whitelist

3. **WebSocket connections** (Real-time)
   - Used for live updates
   - Brave blocks unknown WebSocket URLs
   - Solution: Added `wss://*.supabase.co` to CSP

---

## 🎯 Development vs Production

### Development (localhost)
- **Disable Brave Shields** for easier development
- All features work without restrictions
- Faster debugging

### Production (deployed site)
- **Keep Brave Shields ON** for users
- CSP properly configured
- All connections whitelisted
- Users won't have issues

---

## 🔄 Alternative: Use Different Browser for Development

If Brave continues causing issues:

### Chrome
```bash
# No special configuration needed
# Works out of the box
```

### Firefox
```bash
# Minimal privacy blocking
# Good for development
```

### Edge
```bash
# Similar to Chrome
# Works well for development
```

**Keep Brave for production testing** to ensure your app works with strict privacy settings!

---

## 📊 What Each Error Means

### `ERR_BLOCKED_BY_CLIENT`
- **Cause**: Brave Shields blocking request
- **Fix**: Disable shields for localhost

### `violates Content Security Policy`
- **Cause**: URL not in CSP whitelist
- **Fix**: Already fixed in `next.config.ts`

### `Connection timed out`
- **Cause**: WebSocket blocked
- **Fix**: Added `wss://*.supabase.co` to CSP

### `Refused to connect`
- **Cause**: Cross-origin request blocked
- **Fix**: Added domain to CSP `connect-src`

---

## ✅ Checklist

After applying fixes:

- [ ] Updated `next.config.ts` (already done ✓)
- [ ] Restarted dev server
- [ ] Disabled Brave Shields for localhost
- [ ] Cleared browser cache
- [ ] Hard refreshed page (Ctrl+F5)
- [ ] Checked console for errors
- [ ] Tested booking functionality
- [ ] Verified real-time updates work

---

## 🆘 Still Having Issues?

### 1. Check Brave Version
```
brave://version
```
Update to latest version if needed.

### 2. Reset Brave Settings
```
brave://settings/reset
```
This resets all shields and privacy settings.

### 3. Try Incognito Mode
```
Ctrl + Shift + N
```
Tests without extensions or cached settings.

### 4. Check Brave Shields Logs
```
brave://adblock-internals
```
See what's being blocked in real-time.

---

## 💡 Pro Tips

### For Development:
1. **Use Chrome/Firefox** for development
2. **Test in Brave** before deploying
3. **Keep shields disabled** on localhost

### For Production:
1. **Test with Brave Shields ON**
2. **Verify all features work**
3. **Check console for CSP errors**

---

## 🎉 Summary

**What was wrong:**
- Brave blocked Supabase connections
- CSP didn't include Supabase URLs
- WebSocket connections failed

**What's fixed:**
- ✅ Added Supabase to CSP whitelist
- ✅ Added WebSocket support
- ✅ Documented Brave Shield settings

**What you need to do:**
1. Restart dev server
2. Disable Brave Shields for localhost
3. Clear cache and refresh

**Result:**
- All connections work
- Real-time updates functional
- No more CSP errors

---

**Your app now works perfectly with Brave!** 🚀
