/**
 * Example API endpoint using the new security middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, adminMiddleware, apiMiddleware } from '../../../lib/validation/apiMiddleware';

// Example: Secure content update endpoint
export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Your business logic here
    
    // Simulate content update
    const result = {
      id: 'content-123',
      key: body.key,
      value: body.value,
      type: body.type,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}, apiMiddleware);

// Example: Secure component creation endpoint (admin only)
export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Your business logic here
    
    // Simulate component creation
    const result = {
      id: 'component-456',
      name: body.name,
      type: body.type,
      config: body.config,
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create component' },
      { status: 500 }
    );
  }
}, adminMiddleware);