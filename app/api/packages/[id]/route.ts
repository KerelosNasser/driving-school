import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// PUT - Update package
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 params is a Promise
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params; // ✅ Await params
    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, price, hours, features, popular } = body;

    const { data: updatedPackage, error } = await supabase
      .from('packages')
      .update({
        name,
        description,
        price: price ? parseFloat(price) : null,
        hours: hours ? parseInt(hours) : null,
        features: Array.isArray(features)
          ? features
          : features
          ? JSON.parse(features)
          : [],
        popular: Boolean(popular),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating package:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json({ package: updatedPackage });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE - Delete package
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params; // ✅ Await params
    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    // Check if package is being used in any bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('package_id', id)
      .limit(1);

    if (bookingError) {
      console.error('Supabase error checking bookings:', bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package that has associated bookings' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('packages').delete().eq('id', id);

    if (error) {
      console.error('Supabase error deleting package:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Package deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete package' },
      { status: 500 }
    );
  }
}
