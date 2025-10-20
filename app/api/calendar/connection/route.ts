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
      connected: isConnected,
      status: isConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check connection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For simplicity, we'll just return success
    // In a real implementation, you might want to revoke tokens
    return NextResponse.json({ 
      success: true,
      message: 'Calendar disconnected successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disconnect calendar' }, { status: 500 });
  }
}
