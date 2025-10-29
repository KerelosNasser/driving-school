import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { componentType, pageId, position, props } = body;

    if (!componentType || !pageId) {
      return NextResponse.json(
        { error: 'Missing required fields: componentType, pageId' },
        { status: 400 }
      );
    }

    const componentId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const savedComponent = {
      id: componentId,
      componentType,
      pageId,
      position: position || { x: 0, y: 0, order: Date.now() },
      props: props || {},
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      component: savedComponent,
      message: 'Component added successfully'
    });

  } catch (error) {
    console.error('Error adding component:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}