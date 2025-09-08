import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NotificationPayload {
  type: 'referral_success' | 'reward_earned';
  referrerUserId: string;
  referredUserName?: string;
  rewardType?: string;
  rewardValue?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from our internal system
    const authHeader = request.headers.get('authorization');
    const internalToken = process.env.INTERNAL_API_TOKEN;
    
    if (!authHeader || authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: NotificationPayload = await request.json();

    // Get referrer's clerk_id
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('clerk_id, full_name')
      .eq('id', payload.referrerUserId)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { message: 'Referrer not found' },
        { status: 404 }
      );
    }

    // Create notification based on type
    let notification;
    
    if (payload.type === 'referral_success') {
      notification = {
        type: 'referral_success',
        title: '🎉 Your invitation code was used!',
        message: `${payload.referredUserName || 'Someone'} just signed up using your invitation code!`,
        data: {
          referredUser: payload.referredUserName,
          timestamp: new Date().toISOString()
        }
      };
    } else if (payload.type === 'reward_earned') {
      const rewardMessage = payload.rewardType === 'discount_30_percent' 
        ? 'You earned a 30% discount for your next booking!'
        : 'You earned 2 free driving hours!';
      
      notification = {
        type: 'reward_earned',
        title: '🎁 Reward Earned!',
        message: rewardMessage,
        data: {
          rewardType: payload.rewardType,
          rewardValue: payload.rewardValue,
          timestamp: new Date().toISOString()
        }
      };
    }

    if (!notification) {
      return NextResponse.json(
        { message: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Store notification in database for persistence
    const { error: insertError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: payload.referrerUserId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        is_read: false
      });

    if (insertError) {
      console.error('Error storing notification:', insertError);
      // Continue anyway - notification storage is not critical
    }

    // Send real-time notification (this would integrate with the SSE endpoint)
    // In a production environment, you might use Redis pub/sub or similar
    await sendNotificationToUser(referrer.clerk_id, notification);

    return NextResponse.json({
      message: 'Notification sent successfully',
      notificationSent: true
    });

  } catch (error) {
    console.error('Notification trigger error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simple notification dispatch (in production, use Redis pub/sub or WebSockets)
async function sendNotificationToUser(clerkUserId: string, notification: any) {
  // This would integrate with the SSE connection or WebSocket
  // For now, we'll just log it
  console.log(`Notification for user ${clerkUserId}:`, notification);
  
  // In a real implementation, you could:
  // 1. Use Redis pub/sub to notify the SSE endpoint
  // 2. Store in a queue for delivery
  // 3. Use WebSocket connections
  
  return true;
}
