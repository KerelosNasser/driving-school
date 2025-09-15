import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const type = searchParams.get('type');
    const offset = (page - 1) * limit;

    // Get user from database
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let query = supabase
      .from('user_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userData.id);

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Filter out expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    const { data: notifications, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch notifications error:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.id)
      .eq('is_read', false)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      unreadCount: unreadCount || 0
    });

  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark notifications as read/dismissed
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();
    const { action, notification_ids, mark_all = false } = body;

    // Get user from database
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let query = supabase
      .from('user_notifications')
      .update({
        ...(action === 'mark_read' && { 
          is_read: true, 
          read_at: new Date().toISOString() 
        }),
        ...(action === 'dismiss' && { 
          is_dismissed: true, 
          dismissed_at: new Date().toISOString() 
        })
      })
      .eq('user_id', userData.id);

    if (mark_all) {
      // Mark all notifications for the user
      if (action === 'mark_read') {
        query = query.eq('is_read', false);
      } else if (action === 'dismiss') {
        query = query.eq('is_dismissed', false);
      }
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications
      query = query.in('id', notification_ids);
    } else {
      return NextResponse.json({ error: 'No notifications specified' }, { status: 400 });
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Update notifications error:', error);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      updated_count: data?.length || 0,
      message: `${data?.length || 0} notifications ${action === 'mark_read' ? 'marked as read' : 'dismissed'}`
    });

  } catch (error) {
    console.error('PUT /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete notifications (admin only or expired)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const cleanupExpired = searchParams.get('cleanup_expired') === 'true';

    // Get user from database
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (cleanupExpired) {
      // Delete expired notifications for the user
      const { data, error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', userData.id)
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        return NextResponse.json({ error: 'Failed to cleanup expired notifications' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        deleted_count: data?.length || 0,
        message: `${data?.length || 0} expired notifications deleted`
      });
    }

    if (notificationId) {
      // Delete specific notification (only if it belongs to the user)
      const { data, error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userData.id)
        .select();

      if (error) {
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
      }

      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Notification deleted successfully' 
      });
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 });

  } catch (error) {
    console.error('DELETE /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}