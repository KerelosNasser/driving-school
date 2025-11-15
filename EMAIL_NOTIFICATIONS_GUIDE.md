# Email Notifications for Referral Rewards

## Overview
The referral reward system now sends beautiful HTML email notifications to users when they receive rewards.

## Features

### 1. **Admin Gift Notifications**
When an admin gifts a reward to a user through the admin panel, the user receives an email with:
- 🎁 Beautiful gradient design
- Clear reward details (discount % or package value)
- Expiration date (if applicable)
- Direct link to view rewards in Service Center
- Instructions on how to use the reward

### 2. **Automatic Milestone Notifications**
When a user reaches a referral milestone (1, 3, etc. referrals), they automatically receive:
- 🎉 Congratulations message
- Milestone achievement details
- Reward earned information
- Link to view all rewards
- Encouragement to keep referring

## Email Templates

### Gift Notification Email
- **Subject**: 🎁 You've Received a Reward!
- **From**: EG Driving School <noreply@egdrivingschool.com>
- **Design**: Green gradient header with gift icon
- **Content**: 
  - Personalized greeting
  - Reward details in highlighted box
  - Expiration information
  - CTA button to Service Center
  - Usage instructions

### Milestone Notification Email
- **Subject**: 🎉 Milestone Reached: X Referrals!
- **From**: EG Driving School <noreply@egdrivingschool.com>
- **Design**: Purple gradient header with celebration icon
- **Content**:
  - Congratulations message
  - Referral count
  - Reward earned
  - CTA button to Service Center
  - Encouragement message

## Configuration

### Environment Variables Required
```env
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### Email Sender
Currently configured as: `EG Driving School <noreply@egdrivingschool.com>`

**Important**: For production, you need to:
1. Verify your domain in Resend dashboard
2. Update the `from` address to use your verified domain
3. Or use Resend's default sending domain for testing

## Testing

### Test Admin Gift Email
1. Go to Admin Panel → Referral Rewards → Gift Rewards
2. Select a user
3. Choose reward type and value
4. Enable "Notify User" toggle
5. Click "Gift Reward"
6. Check the recipient's email inbox

### Test Milestone Email
1. Create reward tiers (e.g., 1 referral = 30% discount)
2. Have a user refer someone
3. Process the referral via `/api/process-referral`
4. The referrer will receive a milestone email automatically

## Email Content Customization

To customize the emails, edit: `lib/email/reward-notification.ts`

### Customizable Elements:
- **Colors**: Change gradient colors in inline styles
- **Logo**: Add your logo image URL
- **Footer**: Update company information
- **CTA Button**: Change button text and styling
- **Content**: Modify the message text

### Example: Change Email Colors
```typescript
// Change from green to blue
style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);"
```

## Troubleshooting

### Emails Not Sending
1. **Check Resend API Key**: Verify `RESEND_API_KEY` in `.env.local`
2. **Check Console Logs**: Look for error messages in server logs
3. **Verify Domain**: Make sure sender domain is verified in Resend
4. **Check Spam Folder**: Emails might be filtered as spam initially

### Email Delivery Issues
- **Development**: Use Resend's test mode or your personal email
- **Production**: Verify your domain and set up SPF/DKIM records
- **Rate Limits**: Resend free tier has sending limits

### Common Errors

**Error**: "Domain not verified"
- **Solution**: Verify your domain in Resend dashboard or use default sending domain

**Error**: "Invalid API key"
- **Solution**: Check that `RESEND_API_KEY` is correctly set in `.env.local`

**Error**: "Email not sent but no error"
- **Solution**: Check that `notify_user` is set to `true` when gifting rewards

## API Functions

### `sendRewardNotification(data)`
Sends a gift reward notification email.

**Parameters**:
```typescript
{
  recipientEmail: string;      // User's email address
  recipientName: string;        // User's display name
  rewardType: 'discount' | 'free_package';
  rewardValue: number;          // Percentage or dollar value
  reason?: string;              // Optional reason for the gift
  expiresAt?: string;           // Optional expiration date
}
```

**Returns**: `{ success: boolean, data?: any, error?: any }`

### `sendReferralMilestoneNotification(data)`
Sends a milestone achievement notification email.

**Parameters**:
```typescript
{
  recipientEmail: string;       // User's email address
  recipientName: string;         // User's display name
  referralCount: number;         // Number of referrals achieved
  rewardEarned: string;          // Description of reward earned
}
```

**Returns**: `{ success: boolean, data?: any, error?: any }`

## Production Checklist

Before deploying to production:

- [ ] Verify domain in Resend dashboard
- [ ] Update `from` email address to use verified domain
- [ ] Set up SPF and DKIM records for your domain
- [ ] Test emails with real email addresses
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Check email rendering in multiple email clients
- [ ] Set up email monitoring/logging
- [ ] Configure unsubscribe link (if required)
- [ ] Review and comply with email regulations (CAN-SPAM, GDPR)

## Future Enhancements

Potential improvements:
- [ ] Add email templates for other events (booking confirmations, etc.)
- [ ] Implement email preferences/unsubscribe functionality
- [ ] Add email analytics tracking
- [ ] Create admin dashboard for email logs
- [ ] Support multiple languages
- [ ] Add SMS notifications option
- [ ] Implement email scheduling/queuing

## Support

For issues with:
- **Resend API**: https://resend.com/docs
- **Email Design**: Check inline CSS compatibility
- **Delivery Issues**: Contact Resend support

---

**Note**: Email notifications are sent asynchronously and won't block the main request. If an email fails to send, the reward will still be created successfully.
