# CallMeBot - 2 Minute Setup (100% FREE)

## The Absolute Easiest Way to Get WhatsApp Notifications

No account, no credit card, no verification. Just send one WhatsApp message!

---

## Step 1: Add CallMeBot Contact (30 seconds)

Open WhatsApp and add this number to your contacts:

```
+34 644 44 71 80
```

Name it: **CallMeBot** (or anything you like)

---

## Step 2: Get Your API Key (30 seconds)

1. Open WhatsApp
2. Go to CallMeBot chat
3. Send this exact message:

```
I allow callmebot to send me messages
```

4. You'll receive a reply with your API key, like:

```
Your API key is: 123456

Use this key to send messages via our API.
```

5. **Copy that number** (e.g., 123456)

---

## Step 3: Add to Your Project (30 seconds)

Open your `.env.local` file and add:

```env
CALLMEBOT_API_KEY=123456
ADMIN_WHATSAPP_NUMBER=+61431512095
```

Replace:
- `123456` with your actual API key
- `+61431512095` with your phone number (include country code)

---

## Step 4: Restart Server (30 seconds)

Stop your development server and start it again:

```bash
# Stop with Ctrl+C
# Then start again
npm run dev
```

---

## Step 5: Test It! 🎉

1. Go to your website
2. Make a test payment submission
3. You should receive a WhatsApp message instantly!

---

## Example Message You'll Receive:

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

---

## Troubleshooting

### Not receiving messages?

1. **Check phone number format**
   - Must include country code: `+61431512095`
   - No spaces or dashes

2. **Check API key**
   - Make sure you copied it correctly
   - No spaces before or after

3. **Restart server**
   - Changes to .env.local require restart

4. **Check server logs**
   - Look for "WhatsApp notification sent via CallMeBot"
   - Or any error messages

### Still not working?

Try sending the message to CallMeBot again:
```
I allow callmebot to send me messages
```

You might get a new API key.

---

## That's It!

You now have **100% FREE** WhatsApp notifications with:
- ✅ No account creation
- ✅ No credit card
- ✅ No verification process
- ✅ Unlimited messages
- ✅ Instant delivery

Total setup time: **2 minutes** ⏱️

---

## Want More Professional?

Later, you can upgrade to Meta's WhatsApp Cloud API for:
- Messages from your business name
- Better formatting
- Professional branding

But CallMeBot is perfect to get started! 🚀
