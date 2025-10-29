import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PaymentIdService } from '@/lib/payment-id-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate test payment ID
    const paymentIdService = new PaymentIdService();
    const testPackageId = 'test-package-123';
    const paymentId = paymentIdService.generatePaymentId(testPackageId, userId);
    
    // Create test session
    const sessionId = `test_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const testSession = {
      id: sessionId,
      payment_id: paymentId,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/manual-payment?session_id=${sessionId}&gateway=payid&payment_id=${paymentId}&test=true`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours expiry
    };

    console.log('Test payment session created:', {
      sessionId: testSession.id,
      paymentId: testSession.payment_id,
      userId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      sessionId: testSession.id,
      paymentId: testSession.payment_id,
      url: testSession.url,
      expiresAt: testSession.expires_at,
      message: 'Test payment session created successfully'
    });

  } catch (error) {
    console.error('Error creating test checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create test checkout session' },
      { status: 500 }
    );
  }
}