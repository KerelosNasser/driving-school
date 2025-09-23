import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

type ParamsPromise = { params: Promise<{ id?: string }> };

// Helper to normalize Supabase responses that may be array or single row
function singleRow<T = any>(data: any): T | null {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

async function parseJsonSafely(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch (e) {
    return { __parse_error: (e as Error).message };
  }
}

// PUT - Update package
export async function PUT(request: NextRequest, context: ParamsPromise) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const body = await parseJsonSafely(request);
    if ((body as any).__parse_error) {
      return NextResponse.json(
        { error: 'Invalid JSON', details: (body as any).__parse_error },
        { status: 400 }
      );
    }

    const { name, description, price, hours, features, popular } = body as any;

    // Verify package exists
    const { data: existsData, error: existsError } = await supabase
      .from('packages')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existsError) {
      console.error('Error checking package existence:', existsError);
      return NextResponse.json({ error: 'Database error checking package', details: existsError.message }, { status: 500 });
    }

    const exists = singleRow(existsData);
    if (!exists) {
      console.warn(`Package with id=${id} not found when attempting update`);
      return NextResponse.json({ error: 'Package not found', details: `No package with id ${id}` }, { status: 404 });
    }

    // Validate and normalize fields to update
    const updates: Record<string, any> = {};
    if (typeof name !== 'undefined') updates.name = String(name);
    if (typeof description !== 'undefined') updates.description = String(description);
    if (typeof price !== 'undefined' && price !== null && price !== '') {
      const p = Number(price);
      if (Number.isNaN(p)) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
      updates.price = p;
    } else if (typeof price !== 'undefined') {
      updates.price = null;
    }
    if (typeof hours !== 'undefined' && hours !== null && hours !== '') {
      const h = parseInt(String(hours), 10);
      if (Number.isNaN(h)) {
        return NextResponse.json({ error: 'Invalid hours' }, { status: 400 });
      }
      updates.hours = h;
    } else if (typeof hours !== 'undefined') {
      updates.hours = null;
    }

    // features can be array or JSON string; default to empty array if explicitly set empty
    if (typeof features !== 'undefined') {
      if (Array.isArray(features)) updates.features = features;
      else if (typeof features === 'string' && features.trim() !== '') {
        try {
          const parsed = JSON.parse(features);
          updates.features = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return NextResponse.json({ error: 'Invalid features JSON' }, { status: 400 });
        }
      } else {
        updates.features = [];
      }
    }

    if (typeof popular !== 'undefined') updates.popular = Boolean(popular);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided to update' }, { status: 400 });
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Supabase error updating package:', updateError);
      return NextResponse.json({ error: 'Database error updating package', details: updateError.message }, { status: 500 });
    }

    const updatedPackage = singleRow(updatedData);
    if (!updatedPackage) {
      console.warn(`Package with id=${id} not found after update`);
      return NextResponse.json({ error: 'Package not found', details: `No package with id ${id}` }, { status: 404 });
    }

    return NextResponse.json({ package: updatedPackage }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to update package' }, { status: 500 });
  }
}

// DELETE - Delete package
export async function DELETE(request: NextRequest, context: ParamsPromise) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    // Check if package is being used in any bookings
    const { data: bookingRows, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('package_id', id)
      .limit(1);

    if (bookingError) {
      console.error('Supabase error checking bookings:', bookingError);
      return NextResponse.json({ error: 'Database error checking bookings', details: bookingError.message }, { status: 500 });
    }

    if (Array.isArray(bookingRows) && bookingRows.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package with associated bookings', details: 'There is at least one booking referencing this package' },
        { status: 400 }
      );
    }

    const { data: deletedData, error: deleteError } = await supabase
      .from('packages')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (deleteError) {
      console.error('Supabase error deleting package:', deleteError);
      return NextResponse.json({ error: 'Database error deleting package', details: deleteError.message }, { status: 500 });
    }

    const deletedPackage = singleRow(deletedData);
    if (!deletedPackage) {
      return NextResponse.json({ error: 'Package not found', details: `No package with id ${id}` }, { status: 404 });
    }

    return NextResponse.json({ message: 'Package deleted successfully', package: deletedPackage }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete package' }, { status: 500 });
  }
}