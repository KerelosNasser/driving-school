// app/api/content/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed types: images, PDF, text, and Word documents.' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${originalName}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: filename,
      size: file.size,
      type: file.type,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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