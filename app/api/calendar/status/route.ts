import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SimpleCalendarService } from '@/lib/calendar/simple-calendar';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConnected = await SimpleCalendarService.checkConnection();
    
    return NextResponse.json({ 
      status: 'healthy',
      connected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      connected: false,
      error: 'Failed to check status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
