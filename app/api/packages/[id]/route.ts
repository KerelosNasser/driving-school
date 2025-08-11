import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';


// PUT - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, hours, features, popular } = body;

    const { data: updatedPackage, error } = await supabase
      .from('packages')
      .update({
        name,
        description,
        price: parseFloat(price),
        hours: parseInt(hours),
        features: Array.isArray(features) ? features : JSON.parse(features),
        popular: Boolean(popular)
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ package: updatedPackage });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if package is being used in any bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('package_id', params.id)
      .limit(1);

    if (bookingError) throw bookingError;

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package that has associated bookings' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}