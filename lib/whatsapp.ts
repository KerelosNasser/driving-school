// WhatsApp notification service using Meta's Cloud API (100% FREE)

interface WhatsAppMessage {
  to: string;
  message: string;
}

/**
 * Send WhatsApp notification using Meta's Cloud API (FREE)
 * Alternative: Use CallMeBot API (even simpler, no setup)
 */
export async function sendWhatsAppNotification(data: WhatsAppMessage): Promise<boolean> {
  // Try CallMeBot first (simplest, no setup required)
  const callMeBotSuccess = await sendViaCallMeBot(data);
  if (callMeBotSuccess) return true;

  // Fallback to Meta Cloud API
  return await sendViaMetaCloudAPI(data);
}

/**
 * CallMeBot - Simplest option, no API keys needed!
 * Just need to get your API key by sending a WhatsApp message once
 * 100% FREE, no limits
 */
async function sendViaCallMeBot(data: WhatsAppMessage): Promise<boolean> {
  try {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const phoneNumber = data.to.replace(/\+/g, ''); // Remove + sign
    
    if (!apiKey) {
      console.log('CallMeBot not configured, skipping...');
      return false;
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(data.message)}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('CallMeBot notification failed');
      return false;
    }

    console.log('WhatsApp notification sent via CallMeBot (FREE)');
    return true;
  } catch (error) {
    console.error('Error sending via CallMeBot:', error);
    return false;
  }
}

/**
 * Meta WhatsApp Cloud API - Official, 100% free for up to 1000 conversations/month
 */
async function sendViaMetaCloudAPI(data: WhatsAppMessage): Promise<boolean> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      console.warn('Meta WhatsApp Cloud API not configured');
      return false;
    }

    const toNumber = data.to.replace(/\+/g, ''); // Remove + sign
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toNumber,
          type: 'text',
          text: {
            body: data.message
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Meta WhatsApp API failed:', error);
      return false;
    }

    console.log('WhatsApp notification sent via Meta Cloud API (FREE)');
    return true;
  } catch (error) {
    console.error('Error sending via Meta Cloud API:', error);
    return false;
  }
}

export function formatPaymentNotification(payment: {
  userName: string;
  amount: number;
  packageName: string;
  paymentReference: string;
  hours: number;
}): string {
  return `🚗 *New Payment Received!*

👤 Customer: ${payment.userName}
💰 Amount: $${payment.amount} AUD
📦 Package: ${payment.packageName}
⏰ Hours: ${payment.hours}
🔖 Reference: ${payment.paymentReference}

Please verify this payment in your PayID account and approve it in the admin dashboard.

🔗 Admin Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/admin`;
}
