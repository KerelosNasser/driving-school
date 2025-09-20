/**
 * Example API endpoint using the new security middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '../../../lib/validation/apiMiddleware';

// Example: Secure content update endpoint
export const POST = securityMiddleware.contentUpdate(async (req: NextRequest & { validatedData: any }) => {
  try {
    const { validatedData } = req;
    
    // The request has already been:
    // 1. Authenticated
    // 2. Authorized (permission checked)
    // 3. Rate limited
    // 4. Validated and sanitized
    // 5. Audit logged
    
    // Your business logic here
    console.log('Processing validated content update:', validatedData);
    
    // Simulate content update
    const result = {
      id: 'content-123',
      key: validatedData.key,
      value: validatedData.value,
      type: validatedData.type,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Content update error:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
});

// Example: Secure component creation endpoint
export const PUT = securityMiddleware.componentCreate(async (req: NextRequest & { validatedData: any }) => {
  try {
    const { validatedData } = req;
    
    // Process component creation with validated data
    const result = {
      id: `comp-${Date.now()}`,
      type: validatedData.type,
      position: validatedData.position,
      props: validatedData.props,
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Component creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create component' },
      { status: 500 }
    );
  }
});