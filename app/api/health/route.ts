import { NextResponse } from 'next/server';
import { testSupabaseConnection } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabaseOk = await testSupabaseConnection();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseOk ? 'connected' : 'disconnected',
        clerk: !!process.env.CLERK_SECRET_KEY,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        tlsRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
