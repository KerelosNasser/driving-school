// app/api/content/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/json'
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contentId = formData.get('contentId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images, PDFs, text files, and JSON are allowed' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `uploads/${timestamp}_${sanitizedName}`;

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-files')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('content-files')
      .getPublicUrl(uploadData.path);

    // Update content record if contentId provided
    if (contentId) {
      const { error: updateError } = await supabase
        .from('site_content')
        .update({
          file_path: uploadData.path,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          // For image content, also update content_value
          content_value: file.type.startsWith('image/') ? urlData.publicUrl : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (updateError) {
        console.error('Database update error:', updateError);
        // File was uploaded but DB update failed - you might want to delete the file
        await supabase.storage.from('content-files').remove([uploadData.path]);
        return NextResponse.json(
          { error: 'Failed to update content record', details: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        path: uploadData.path,
        url: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}

// DELETE - Remove uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const contentId = searchParams.get('contentId');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Remove file from storage
    const { error: deleteError } = await supabase.storage
      .from('content-files')
      .remove([filePath]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file', details: deleteError.message },
        { status: 500 }
      );
    }

    // Update content record if contentId provided
    if (contentId) {
      const { error: updateError } = await supabase
        .from('site_content')
        .update({
          file_path: null,
          file_url: null,
          file_name: null,
          file_size: null,
          file_type: null,
          content_value: null, // Clear content_value for images
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update content record', details: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file deletion' },
      { status: 500 }
    );
  }
}