import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface RewardNotificationData {
  recipientEmail: string;
  recipientName: string;
  rewardType: 'discount' | 'free_package';
  rewardValue: number;
  reason?: string;
  expiresAt?: string;
}

export async function sendRewardNotification(data: RewardNotificationData) {
  const {
    recipientEmail,
    recipientName,
    rewardType,
    rewardValue,
    reason,
    expiresAt
  } = data;

  // Format reward display
  const rewardDisplay = rewardType === 'discount' 
    ? `${rewardValue}% discount on your next booking`
    : `Free package worth $${rewardValue}`;

  const expiryText = expiresAt 
    ? `This reward expires on ${new Date(expiresAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}.`
    : 'This reward has no expiration date.';

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'EG Driving School <noreply@egdrivingschool.com>',
      to: [recipientEmail],
      subject: '🎁 You\'ve Received a Reward!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You've Received a Reward!</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with gradient -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                        <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 48px;">🎁</span>
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                          You've Got a Reward!
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Hi <strong>${recipientName}</strong>,
                        </p>
                        
                        <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Great news! You've received a special reward from EG Driving School.
                        </p>

                        <!-- Reward Box -->
                        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 30px; margin: 0 0 30px; text-align: center; border: 2px solid #3b82f6;">
                          <div style="font-size: 48px; margin-bottom: 15px;">
                            ${rewardType === 'discount' ? '💰' : '🎉'}
                          </div>
                          <h2 style="margin: 0 0 10px; color: #1e40af; font-size: 24px; font-weight: bold;">
                            ${rewardDisplay}
                          </h2>
                          ${reason ? `
                            <p style="margin: 10px 0 0; color: #1e40af; font-size: 14px; font-style: italic;">
                              ${reason}
                            </p>
                          ` : ''}
                        </div>

                        <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          ${expiryText}
                        </p>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/service-center?tab=referrals" 
                             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                            View Your Rewards
                          </a>
                        </div>

                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 30px 0 0;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            <strong>💡 How to use your reward:</strong><br>
                            Visit your Service Center and go to the Referrals tab to see all your rewards. You can apply them during booking or when purchasing lesson packages.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                          Keep earning rewards by referring friends!
                        </p>
                        <p style="margin: 0 0 20px; color: #9ca3af; font-size: 12px;">
                          EG Driving School<br>
                          Your trusted partner in learning to drive
                        </p>
                        <div style="margin: 20px 0 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #10b981; text-decoration: none; font-size: 12px; margin: 0 10px;">
                            Visit Website
                          </a>
                          <span style="color: #d1d5db;">|</span>
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/service-center" style="color: #10b981; text-decoration: none; font-size: 12px; margin: 0 10px;">
                            Service Center
                          </a>
                        </div>
                      </td>
                    </tr>

                  </table>

                  <!-- Footer note -->
                  <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    You received this email because you have an account with EG Driving School.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Hi ${recipientName},

Great news! You've received a special reward from EG Driving School.

Your Reward: ${rewardDisplay}
${reason ? `Reason: ${reason}` : ''}

${expiryText}

To view and use your reward, visit your Service Center:
${process.env.NEXT_PUBLIC_APP_URL}/service-center?tab=referrals

How to use your reward:
Visit your Service Center and go to the Referrals tab to see all your rewards. You can apply them during booking or when purchasing lesson packages.

Keep earning rewards by referring friends!

---
EG Driving School
Your trusted partner in learning to drive
      `.trim()
    });

    if (error) {
      console.error('Error sending reward notification email:', error);
      return { success: false, error };
    }

    console.log('✅ Reward notification email sent successfully:', emailData);
    return { success: true, data: emailData };

  } catch (error) {
    console.error('Error in sendRewardNotification:', error);
    return { success: false, error };
  }
}

// Function to send referral milestone notification
export async function sendReferralMilestoneNotification(data: {
  recipientEmail: string;
  recipientName: string;
  referralCount: number;
  rewardEarned: string;
}) {
  const { recipientEmail, recipientName, referralCount, rewardEarned } = data;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'EG Driving School <noreply@egdrivingschool.com>',
      to: [recipientEmail],
      subject: `🎉 Milestone Reached: ${referralCount} Referral${referralCount > 1 ? 's' : ''}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Referral Milestone Reached!</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <tr>
                      <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                          Congratulations!
                        </h1>
                        <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 18px;">
                          You've reached ${referralCount} referral${referralCount > 1 ? 's' : ''}!
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Hi <strong>${recipientName}</strong>,
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; margin: 0 0 30px; border: 2px solid #f59e0b;">
                          <h2 style="margin: 0 0 15px; color: #92400e; font-size: 24px; font-weight: bold;">
                            You've Earned: ${rewardEarned}
                          </h2>
                          <p style="margin: 0; color: #92400e; font-size: 14px;">
                            Your reward has been automatically added to your account!
                          </p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/service-center?tab=referrals" 
                             style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                            View Your Rewards
                          </a>
                        </div>

                        <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          Keep sharing your invitation code to earn even more rewards!
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                          Thank you for spreading the word about EG Driving School!
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          EG Driving School
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Hi ${recipientName},

Congratulations! You've reached ${referralCount} referral${referralCount > 1 ? 's' : ''}!

You've Earned: ${rewardEarned}

Your reward has been automatically added to your account!

View your rewards: ${process.env.NEXT_PUBLIC_APP_URL}/service-center?tab=referrals

Keep sharing your invitation code to earn even more rewards!

Thank you for spreading the word about EG Driving School!
      `.trim()
    });

    if (error) {
      console.error('Error sending milestone notification email:', error);
      return { success: false, error };
    }

    console.log('✅ Milestone notification email sent successfully:', emailData);
    return { success: true, data: emailData };

  } catch (error) {
    console.error('Error in sendReferralMilestoneNotification:', error);
    return { success: false, error };
  }
}
