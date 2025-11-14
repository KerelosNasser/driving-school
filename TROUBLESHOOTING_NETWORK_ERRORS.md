# 🔧 Troubleshooting Network Errors (ECONNRESET)

## Issue: Google Calendar API Connection Errors

If you're seeing errors like:
- `ECONNRESET`
- `ETIMEDOUT`
- `request to https://www.googleapis.com/calendar/v3/calendars/... failed`

This is a **network connectivity issue** between your server and Google's API.

---

## ✅ Solutions

### 1. **Check Your Internet Connection**
- Ensure your development machine has stable internet
- Try accessing https://www.googleapis.com in your browser
- Check if you're behind a corporate firewall or VPN

### 2. **Retry Logic (Already Implemented)**
The system now automatically retries failed requests up to 3 times with exponential backoff:
- 1st retry: after 1 second
- 2nd retry: after 2 seconds
- 3rd retry: after 4 seconds

### 3. **Firewall/Antivirus**
Some security software blocks API requests:
- **Windows Defender**: Add exception for Node.js
- **Corporate Firewall**: Whitelist `*.googleapis.com`
- **VPN**: Try disconnecting temporarily

### 4. **DNS Issues**
If DNS resolution is failing:
```bash
# Flush DNS cache (Windows)
ipconfig /flushdns

# Test DNS resolution
nslookup www.googleapis.com
```

### 5. **Proxy Settings**
If you're behind a proxy, configure Node.js:
```bash
# Set proxy environment variables
set HTTP_PROXY=http://proxy.example.com:8080
set HTTPS_PROXY=http://proxy.example.com:8080
```

### 6. **Google API Status**
Check if Google services are down:
- Visit: https://status.cloud.google.com/
- Check Calendar API status

### 7. **Rate Limiting**
If you're making too many requests:
- Google Calendar API has rate limits
- Wait a few minutes and try again
- Check your API quota in Google Cloud Console

---

## 🔍 Debugging Steps

### 1. Test Calendar Connection
Run the test script:
```bash
node test-calendar-connection.js
```

This will show if the issue is with:
- Authentication
- Network connectivity
- API permissions

### 2. Check Server Logs
Look for patterns in the errors:
```
Error creating booking: Error: request to https://www.googleapis.com/calendar/v3/calendars/...
```

### 3. Test Direct API Access
Try accessing the API directly:
```bash
curl -v https://www.googleapis.com/calendar/v3/calendars
```

---

## 🚀 Quick Fixes

### Option 1: Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Clear cache
npm run clean

# Restart
npm run dev
```

### Option 2: Use Different Network
- Switch from WiFi to Ethernet (or vice versa)
- Try mobile hotspot
- Disable VPN

### Option 3: Update Dependencies
```bash
npm update googleapis google-auth-library
```

---

## 📊 Error Codes Explained

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `ECONNRESET` | Connection was forcibly closed | Retry, check firewall |
| `ETIMEDOUT` | Request took too long | Check internet speed |
| `ENOTFOUND` | DNS lookup failed | Check DNS settings |
| `ECONNREFUSED` | Server refused connection | Check if API is down |

---

## 🛡️ Prevention

### 1. Implement Retry Logic ✅
Already implemented in the calendar service!

### 2. Use Connection Pooling
The Google API client handles this automatically.

### 3. Monitor API Health
Set up monitoring for Google Calendar API availability.

### 4. Fallback Mechanism
Consider implementing a queue system for failed bookings:
- Save booking to database
- Retry calendar creation in background
- Notify user when complete

---

## 🔄 Current Implementation

The system now includes:

✅ **Automatic Retries**: Up to 3 attempts with exponential backoff
✅ **Better Error Messages**: User-friendly messages instead of technical errors
✅ **Error Logging**: Detailed logs for debugging
✅ **Graceful Degradation**: Booking saved even if calendar creation fails

---

## 💡 User-Facing Error Messages

Users now see helpful messages instead of technical errors:

| Technical Error | User Message |
|----------------|--------------|
| `ECONNRESET` | "Unable to connect to Google Calendar. Please check your internet connection and try again." |
| `ETIMEDOUT` | "Unable to connect to Google Calendar. Please check your internet connection and try again." |
| Quota error | "Insufficient hours available for this booking" |
| Conflict | "This time slot is no longer available" |

---

## 🆘 Still Having Issues?

### Check These:

1. **Environment Variables**
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=egdrivingschool@eds2-477208.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   GOOGLE_CALENDAR_ID="lj4hsl9jtv32ulq7riatg6i8ro@group.calendar.google.com"
   ```

2. **Calendar Permissions**
   - Calendar shared with service account
   - "Make changes to events" permission granted

3. **Google Cloud Console**
   - Calendar API enabled
   - Service account has correct permissions
   - No quota limits exceeded

### Contact Support:
If the issue persists after trying all solutions:
1. Collect error logs
2. Note the exact time of failure
3. Check Google API status
4. Contact Google Cloud Support if API is consistently failing

---

## 📈 Monitoring

Set up monitoring to track:
- API success/failure rates
- Response times
- Error patterns
- Retry success rates

This helps identify if issues are:
- Temporary network glitches (normal)
- Persistent problems (needs investigation)
- Google API issues (wait for resolution)

---

**Remember**: Network errors are often temporary. The retry logic should handle most cases automatically!
