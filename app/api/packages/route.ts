import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET - Fetch all packages
export async function GET() {
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST - Create new package
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, hours, features, popular } = body;

    // Validate required fields
    if (!name || !description || !price || !hours || !features) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: newPackage, error } = await supabase
      .from('packages')
      .insert({
        name,
        description,
        price: parseFloat(price),
        hours: parseInt(hours),
        features: Array.isArray(features) ? features : JSON.parse(features),
        popular: Boolean(popular)
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ package: newPackage }, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}