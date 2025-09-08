import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user exists in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single();

    // Check if users table exists by trying to describe it
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    // Check if invitation_codes table exists
    const { data: invitationTableExists, error: invitationTableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'invitation_codes');

    // Check if user_quotas table exists
    const { data: quotaTableExists, error: quotaTableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_quotas');

    return NextResponse.json({
      clerkUserId,
      user: user || null,
      userError: userError?.message || null,
      tables: {
        users: tableExists?.length > 0,
        invitation_codes: invitationTableExists?.length > 0,
        user_quotas: quotaTableExists?.length > 0,
      },
      tableErrors: {
        users: tableError?.message || null,
        invitation_codes: invitationTableError?.message || null,
        user_quotas: quotaTableError?.message || null,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
