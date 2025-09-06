import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/api/utils';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string> {
  // Try to find by clerk_id
  const { data: existing, error: findError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single();

  if (existing && existing.id) return existing.id;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const email = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const full_name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || 'Unknown User';

  // Upsert user
  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert({ clerk_id: clerkUserId, email, full_name }, { onConflict: 'clerk_id' })
    .select('id')
    .single();

  if (upsertError || !upserted) {
    throw new Error(`Failed to provision user in Supabase: ${upsertError?.message || 'unknown error'}`);
  }

  return upserted.id as string;
}

// GET - Fetch user profile and statistics
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await limiter.check(request, 10, 'CACHE_TOKEN');

    // Get authenticated user (Clerk)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map or provision user in Supabase
    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Get user profile data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Get user's quota information
    const { data: quota, error: quotaError } = await supabaseAdmin
      .from('user_quotas')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    // Get user's bookings statistics
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, date, time, status, hours, instructor_name, pickup_location')
      .eq('user_id', supabaseUserId)
      .order('date', { ascending: false });

    // Get user's packages
    const { data: packages, error: packagesError } = await supabaseAdmin
      .from('quota_transactions')
      .select(`
        id,
        hours_change,
        transaction_type,
        created_at,
        packages (
          name,
          hours,
          price
        )
      `)
      .eq('user_id', supabaseUserId)
      .eq('transaction_type', 'purchase')
      .order('created_at', { ascending: false });

    // Calculate statistics
    const completedLessons = bookings?.filter(b => b.status === 'completed').length || 0;
    const upcomingLessons = bookings?.filter(b => 
      b.status === 'confirmed' && new Date(b.date) > new Date()
    ).length || 0;
    
    const nextLesson = bookings?.find(b => 
      b.status === 'confirmed' && new Date(b.date) > new Date()
    );
    
    const lastLesson = bookings?.find(b => b.status === 'completed');
    
    const totalHoursPurchased = packages?.reduce((sum, pkg) => sum + (pkg.hours_change || 0), 0) || 0;
    const totalHoursUsed = quota?.used_hours || 0;
    const remainingHours = quota?.remaining_hours || 0;

    // Get preferred instructor (most frequent)
    const instructorCounts = bookings?.reduce((acc: Record<string, number>, booking) => {
      if (booking.instructor_name) {
        acc[booking.instructor_name] = (acc[booking.instructor_name] || 0) + 1;
      }
      return acc;
    }, {}) || {};
    
    const preferredInstructor = Object.keys(instructorCounts).length > 0 
      ? Object.entries(instructorCounts).sort(([,a], [,b]) => b - a)[0][0]
      : null;

    // Get preferred location (most frequent)
    const locationCounts = bookings?.reduce((acc: Record<string, number>, booking) => {
      if (booking.pickup_location) {
        acc[booking.pickup_location] = (acc[booking.pickup_location] || 0) + 1;
      }
      return acc;
    }, {}) || {};
    
    const preferredLocation = Object.keys(locationCounts).length > 0 
      ? Object.entries(locationCounts).sort(([,a], [,b]) => b - a)[0][0]
      : null;

    const statistics = {
      learningProgress: {
        completedLessons,
        totalLessons: bookings?.length || 0,
        upcomingLessons
      },
      hoursUsage: {
        totalPurchased: totalHoursPurchased,
        used: totalHoursUsed,
        remaining: remainingHours
      },
      recentActivity: {
        lastLessonDate: lastLesson?.date || null,
        lastLessonTime: lastLesson?.time || null,
        nextLessonDate: nextLesson?.date || null,
        nextLessonTime: nextLesson?.time || null,
        preferredInstructor,
        preferredLocation
      },
      memberSince: user.created_at
    };

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      statistics
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}