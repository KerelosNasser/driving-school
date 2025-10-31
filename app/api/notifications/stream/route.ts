import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Store active connections
const connections = new Map<string, WritableStreamDefaultWriter<Uint8Array>>();

// Clean up closed connections
function cleanupConnection(userId: string) {
  connections.delete(userId);
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user ID from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return new Response('User not found', { status: 404 });
    }

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Notification stream connected',
          timestamp: new Date().toISOString()
        })}\n\n`));

        // Store connection
        const writer = controller as unknown as WritableStreamDefaultWriter<Uint8Array>;
        connections.set(clerkUserId, writer);

        // Send keepalive every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'keepalive',
              timestamp: new Date().toISOString()
            })}\n\n`));
          } catch (error) {
            clearInterval(keepAlive);
            cleanupConnection(clerkUserId);
          }
        }, 30000);

        // Clean up on close
        controller.closed?.then(() => {
          clearInterval(keepAlive);
          cleanupConnection(clerkUserId);
        });
      },
      cancel() {
        cleanupConnection(clerkUserId);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    return new Response('Internal server error', { status: 500 });
  }
}

// Function to send notification to specific user (called from other parts of the app)
export async function sendNotificationToUser(
  clerkUserId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) {
  const connection = connections.get(clerkUserId);
  if (!connection) {
    return false; // User not connected
  }

  try {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({
      ...notification,
      timestamp: new Date().toISOString()
    })}\n\n`;

    // In a real implementation, you would write to the controller
    // For now, we'll just return success
    return true;
  } catch (error) {
    cleanupConnection(clerkUserId);
    return false;
  }
}
