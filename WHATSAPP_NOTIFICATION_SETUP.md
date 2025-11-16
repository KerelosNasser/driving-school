# WhatsApp Notification Setup

## Overview
When a user submits a payment reference, you'll receive an instant WhatsApp notification so you can verify and approve it quickly.

## What Was Implemented

### 1. WhatsApp Service (`lib/whatsapp.ts`)
- Uses Twilio API to send WhatsApp messages
- Formats payment notifications with all relevant details
- Handles errors gracefully (won't break payment flow if notification fails)

### 2. Automatic Notifications
When a user submits a payment reference, you receive:
```
🚗 *New Payment Received!*

👤 Customer: John Doe
💰 Amount: $299.99 AUD
📦 Package: Standard Package
⏰ Hours: 10
🔖 Reference: ABC123XYZ

Please verify this payment in your PayID account and approve it in the admin dashboard.

🔗 Admin Dashboard: https://yoursite.com/admin
```

### 3. PayID Only
- Removed BPAY and Tyro options
- Simplified UI to show only PayID
- Updated validation to only check PayID format

## Setup Instructions

### Option 1: CallMeBot (EASIEST - 2 Minutes) ⭐ RECOMMENDED

**100% FREE, No Account Needed!**

1. **Add CallMeBot to WhatsApp**
   - Save this number: **+34 644 44 71 80**
   - Name it "CallMeBot"

2. **Get Your API Key**
   - Send this message to CallMeBot: `I allow callmebot to send me messages`
   - You'll receive your API key instantly

3. **Add to .env.local**
   ```env
   CALLMEBOT_API_KEY=123456
   ADMIN_WHATSAPP_NUMBER=+61431512095
   ```

4. **Done!** That's it! 🎉

### Option 2: Meta WhatsApp Cloud API (More Professional)

**100% FREE up to 1,000 messages/month**

1. Go to https://developers.facebook.com/
2. Create app → Add WhatsApp product
3. Get Access Token and Phone Number ID
4. Add to .env.local:
   ```env
   WHATSAPP_ACCESS_TOKEN=your_token
   WHATSAPP_PHONE_NUMBER_ID=your_id
   ADMIN_WHATSAPP_NUMBER=+61431512095
   ```

**See `FREE_WHATSAPP_SETUP.md` for detailed instructions**

### Test It
1. Make a test payment submission
2. You should receive a WhatsApp message instantly
3. If not, check server logs for errors

## Which Option Should You Choose?

### CallMeBot (Recommended for Quick Start)
✅ Setup in 2 minutes
✅ No account creation
✅ Unlimited free messages
✅ Works immediately
⚠️ Messages come from CallMeBot number

### Meta Cloud API (For Professional Setup)
✅ Official Meta API
✅ 1,000 free messages/month
✅ Professional branding
✅ Better formatting
⚠️ Takes 15-20 minutes to setup

**My Recommendation:** Start with CallMeBot (super easy), upgrade to Meta later if needed.

## Notification Flow

1. User completes PayID transfer
2. User submits payment reference on your site
3. **Instant WhatsApp notification sent to you**
4. You check your bank account
5. You approve in admin dashboard
6. User gets their hours

## Benefits

✅ **Instant Notifications** - Know immediately when payment submitted
✅ **No Email Delays** - WhatsApp is faster than email
✅ **Mobile Friendly** - Approve payments from your phone
✅ **All Details Included** - Customer name, amount, reference, package
✅ **Direct Link** - Click to go straight to admin dashboard

## Troubleshooting

### Not Receiving Messages?
1. Check your phone joined the Twilio sandbox
2. Verify `ADMIN_WHATSAPP_NUMBER` format (+61...)
3. Check server logs for errors
4. Test Twilio credentials in their console

### Messages Going to Spam?
- This only happens with sandbox
- Production WhatsApp numbers don't have this issue

### Want to Disable Notifications?
- Simply don't set the environment variables
- Payment flow will work fine without notifications

## Cost Estimate

**CallMeBot:**
- 100% FREE
- Unlimited messages
- No credit card needed
- No account required

**Meta Cloud API:**
- 100% FREE up to 1,000 messages/month
- More than enough for most businesses
- No credit card needed for free tier

Both options are completely free! 🎉

## Summary

WhatsApp notifications ensure you never miss a payment submission. You'll be notified instantly on your phone, can verify the payment in your bank, and approve it in the admin dashboard - all within minutes instead of hours or days.
