import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/api/utils';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ hasProfile: false });
    }

    // Check if user exists in Supabase with required data
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone, address, suburb, experience_level')
      .eq('clerk_id', userId)
      .single();

    if (error || !user) {
      console.log('❌ [Profile Status] User not found in Supabase:', userId);
      return NextResponse.json({ hasProfile: false });
    }

    // Check if user has filled required fields
    const hasRequiredData = !!(
      user.full_name &&
      user.phone &&
      user.address &&
      user.suburb
    );

    console.log('✅ [Profile Status] User data check:', {
      userId,
      hasRequiredData,
      fields: {
        full_name: !!user.full_name,
        phone: !!user.phone,
        address: !!user.address,
        suburb: !!user.suburb
      }
    });

    return NextResponse.json({
      hasProfile: hasRequiredData,
      user: {
        full_name: user.full_name,
        phone: user.phone,
        address: user.address,
        suburb: user.suburb,
        experience_level: user.experience_level
      }
    });
  } catch (error) {
    console.error('Error checking profile status:', error);
    return NextResponse.json({ hasProfile: false });
  }
}
