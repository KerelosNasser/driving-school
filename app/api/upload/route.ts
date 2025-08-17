// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
};

// Validation schema
const uploadSchema = z.object({
  contentId: z.string().uuid().optional(),
  section: z.string().default('general'),
  generateThumbnails: z.boolean().default(true),
});

// Helper function to generate unique filename
function generateFileName(originalName: string, suffix: string = ''): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${timestamp}-${randomString}${suffix}.${extension}`;
}

// Helper function to optimize image
async function optimizeImage(
  buffer: Buffer, 
  options: { width?: number; height?: number; quality?: number } = {}
): Promise<Buffer> {
  const { width, height, quality = 85 } = options;
  
  let sharpInstance = sharp(buffer)
    .jpeg({ quality, progressive: true })
    .png({ compressionLevel: 9 })
    .webp({ quality });

  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  return await sharpInstance.toBuffer();
}

// Helper function to upload file to Supabase storage
async function uploadToStorage(
  buffer: Buffer, 
  filePath: string, 
  mimeType: string
): Promise<{ success: boolean; error?: string; publicUrl?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('content-images')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('content-images')
      .getPublicUrl(filePath);

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = formData.get('metadata') as string;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Parse metadata
    let validatedMetadata;
    try {
      validatedMetadata = uploadSchema.parse(
        metadata ? JSON.parse(metadata) : {}
      );
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid metadata' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate file paths
    const baseFileName = file.name.replace(/\.[^/.]+$/, "");
    const originalFileName = generateFileName(file.name);
    const section = validatedMetadata.section;
    const basePath = `${section}/${originalFileName.split('.')[0]}`;

    const results: Array<{
      size: string;
      path: string;
      url: string;
      width?: number;
      height?: number;
    }> = [];

    try {
      // Upload original optimized image
      const optimizedBuffer = await optimizeImage(buffer);
      const originalPath = `${basePath}-original.${originalFileName.split('.').pop()}`;
      
      const originalUpload = await uploadToStorage(
        optimizedBuffer,
        originalPath,
        file.type
      );

      if (!originalUpload.success) {
        throw new Error(`Failed to upload original: ${originalUpload.error}`);
      }

      results.push({
        size: 'original',
        path: originalPath,
        url: originalUpload.publicUrl!
      });

      // Generate and upload thumbnails if requested
      if (validatedMetadata.generateThumbnails) {
        for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
          const thumbnailBuffer = await optimizeImage(buffer, {
            width: dimensions.width,
            height: dimensions.height,
            quality: 80
          });

          const thumbnailPath = `${basePath}-${sizeName}.${originalFileName.split('.').pop()}`;
          
          const thumbnailUpload = await uploadToStorage(
            thumbnailBuffer,
            thumbnailPath,
            file.type
          );

          if (thumbnailUpload.success) {
            results.push({
              size: sizeName,
              path: thumbnailPath,
              url: thumbnailUpload.publicUrl!,
              width: dimensions.width,
              height: dimensions.height
            });
          }
        }
      }

      // Update content record if contentId provided
      if (validatedMetadata.contentId) {
        const { error: updateError } = await supabase
          .from('site_content')
          .update({
            file_path: originalPath,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', validatedMetadata.contentId);

        if (updateError) {
          console.warn('Failed to update content record:', updateError);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          originalName: file.name,
          size: file.size,
          type: file.type,
          images: results,
          primaryUrl: results[0].url,
          primaryPath: results[0].path
        }
      });

    } catch (uploadError) {
      // Clean up any uploaded files on error
      const paths = results.map(r => r.path);
      if (paths.length > 0) {
        await supabase.storage
          .from('content-images')
          .remove(paths);
      }

      throw uploadError;
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Delete from storage
    const { error } = await supabase.storage
      .from('content-images')
      .remove([filePath]);

    if (error) {
      console.error('Storage deletion error:', error);
      return NextResponse.json(
        { error: 'Failed to delete file', details: error.message },
        { status: 500 }
      );
    }

    // Also try to delete associated thumbnails
    const basePath = filePath.replace(/-(original|thumbnail|medium|large)\.(jpg|jpeg|png|webp)$/, '');
    const possibleThumbnails = [
      `${basePath}-thumbnail.jpg`,
      `${basePath}-medium.jpg`, 
      `${basePath}-large.jpg`,
      `${basePath}-thumbnail.png`,
      `${basePath}-medium.png`,
      `${basePath}-large.png`,
      `${basePath}-thumbnail.webp`,
      `${basePath}-medium.webp`,
      `${basePath}-large.webp`,
    ];

    await supabase.storage
      .from('content-images')
      .remove(possibleThumbnails);

    return NextResponse.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}