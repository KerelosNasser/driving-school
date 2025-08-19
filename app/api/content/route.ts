import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const contentUpdateSchema = z.object({
  id: z.string().uuid(),
  content_value: z.string().optional(),
  content_json: z.any().optional(),
  is_active: z.boolean().optional(),
  alt_text: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  is_draft: z.boolean().optional(),
});

const contentCreateSchema = z.object({
  content_key: z.string(),
  content_type: z.enum(['image', 'text', 'json', 'boolean']),
  content_value: z.string().optional(),
  content_json: z.any().optional(),
  page_section: z.string(),
  display_order: z.number().optional(),
  alt_text: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

// Helper function to get file URL from Supabase storage
function getFileUrl(filePath: string): string {
  if (!filePath) return '';
  // Use consistent bucket name: content-files
  const { data } = supabase.storage.from('content-files').getPublicUrl(filePath);
  return data.publicUrl;
}

// GET - Fetch all content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const includeDrafts = searchParams.get('drafts') === 'true';

    let query = supabase
      .from('site_content')
      .select('*')
      .order('display_order', { ascending: true });

    if (section) {
      query = query.eq('page_section', section);
    }

    if (!includeDrafts) {
      query = query.eq('is_draft', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content', details: error.message },
        { status: 500 }
      );
    }

    // Transform data to include file URLs
    const transformedData = data?.map(item => ({
      ...item,
      // Add computed file URL for images
      file_url: item.file_path ? getFileUrl(item.file_path) : null,
      // For backward compatibility, set content_value to file URL if it's an image
      content_value: item.content_type === 'image' && item.file_path 
        ? getFileUrl(item.file_path) 
        : item.content_value,
    }));

    return NextResponse.json({
      data: transformedData,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contentCreateSchema.parse(body);

    const { data, error } = await supabase
      .from('site_content')
      .insert([{
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create content', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      data: {
        ...data,
        file_url: data.file_path ? getFileUrl(data.file_path) : null
      } 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update existing content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contentUpdateSchema.parse(body);

    const { id, ...updateData } = validatedData;

    const { data, error } = await supabase
      .from('site_content')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update content', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      data: {
        ...data,
        file_url: data.file_path ? getFileUrl(data.file_path) : null
      } 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // First get the content to check if it has a file
    const { data: content, error: fetchError } = await supabase
      .from('site_content')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Content not found', details: fetchError.message },
        { status: 404 }
      );
    }

    // Delete the file from storage if it exists
    if (content.file_path) {
      const { error: storageError } = await supabase.storage
        .from('content-files') // Changed from 'content-images'
        .remove([content.file_path]);
      
      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }
    }

    // Delete the content record
    const { error: deleteError } = await supabase
      .from('site_content')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete content', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Content deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}