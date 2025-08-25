// app/api/admin/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin access
        const user = await clerkClient.users.getUser(userId);
        const isAdmin = user.publicMetadata?.role === 'admin' || process.env.NODE_ENV === 'development';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const contentKey = formData.get('contentKey') as string;
        const altText = formData.get('altText') as string || '';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
            }, { status: 400 });
        }

        // Validate file size (50MB limit for cloud storage)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum size is 50MB.'
            }, { status: 400 });
        }

        const supabase = createServerComponentClient({ cookies });

        // Generate unique filename
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${contentKey}_${uuidv4()}.${fileExtension}`;
        const filePath = `content-images/${fileName}`;

        // Convert file to ArrayBuffer for Supabase
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: _uploadData, error: uploadError } = await supabase.storage
            .from('site-content')
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                duplex: 'half',
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return NextResponse.json({
                error: 'Failed to upload to cloud storage',
                details: uploadError.message
            }, { status: 500 });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('site-content')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Generate alt text suggestion if not provided
        const generatedAlt = altText || generateAltText(contentKey, file.name);

        // Save to both legacy content system and new media library
        
        // 1. Save to media library
        const mediaFileData = {
            original_name: file.name,
            file_name: fileName,
            storage_path: filePath,
            public_url: publicUrl,
            file_type: 'image' as const,
            mime_type: file.type,
            file_size: file.size,
            alt_text: generatedAlt,
            content_key: contentKey,
            page_name: 'content-images',
            uploaded_by: userId
        };

        const { data: mediaFile, error: mediaError } = await supabase
            .from('media_files')
            .insert(mediaFileData)
            .select('*')
            .single();

        if (mediaError) {
            console.error('Failed to save to media library:', mediaError);
            // Continue with legacy system for backward compatibility
        }

        // 2. Save legacy metadata for backward compatibility
        const imageMetadata = {
            content_key: `${contentKey}_metadata`,
            content_type: 'json',
            content_json: {
                original_name: file.name,
                file_size: file.size,
                file_type: file.type,
                upload_date: new Date().toISOString(),
                uploaded_by: userId,
                storage_path: filePath,
                public_url: publicUrl,
                media_file_id: mediaFile?.id // Link to media library entry
            },
            page_name: 'images',
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const { error: metadataError } = await supabase
            .from('page_content')
            .upsert(imageMetadata, {
                onConflict: 'page_name,content_key',
                ignoreDuplicates: false
            });

        if (metadataError) {
            console.error('Failed to save image metadata:', metadataError);
            // Don't fail the request, just log the error
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            alt: generatedAlt,
            fileName,
            size: file.size,
            type: file.type,
            storagePath: filePath,
            mediaFileId: mediaFile?.id,
            message: 'Image uploaded successfully to cloud storage'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Failed to upload image',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

// DELETE endpoint for removing images
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin access
        const user = await clerkClient.users.getUser(userId);
        const isAdmin = user.publicMetadata?.role === 'admin' || process.env.NODE_ENV === 'development';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const storagePath = searchParams.get('storagePath');

        if (!storagePath) {
            return NextResponse.json({ error: 'Storage path is required' }, { status: 400 });
        }

        const supabase = createServerComponentClient({ cookies });

        // 1. Delete from Supabase Storage
        const { error: deleteError } = await supabase.storage
            .from('site-content')
            .remove([storagePath]);

        if (deleteError) {
            console.error('Failed to delete from storage:', deleteError);
            return NextResponse.json({
                error: 'Failed to delete from cloud storage',
                details: deleteError.message
            }, { status: 500 });
        }

        // 2. Remove from media library (soft delete)
        const { error: mediaLibraryError } = await supabase
            .from('media_files')
            .update({ 
                is_active: false, 
                deleted_at: new Date().toISOString() 
            })
            .eq('storage_path', storagePath);

        if (mediaLibraryError) {
            console.error('Failed to update media library:', mediaLibraryError);
            // Continue - don't fail the request for this
        }

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({
            error: 'Failed to delete image',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

function generateAltText(contentKey: string, originalName: string): string {
    // Enhanced alt text generation
    const altTextMap: Record<string, string> = {
        'instructor_image': 'Professional driving instructor portrait',
        'hero_background': 'Students learning to drive with instructor',
        'gallery_image': 'Driving lesson in progress',
        'feature_icon': 'Service feature illustration',
        'testimonial_avatar': 'Student testimonial photo',
        'vehicle_image': 'Driving school vehicle',
        'classroom_image': 'Driving theory classroom',
        'test_route': 'Practice driving test route',
        'parking_practice': 'Student practicing parking maneuvers',
        'highway_driving': 'Highway driving instruction',
        'night_driving': 'Night driving lesson',
        'weather_driving': 'Driving in different weather conditions'
    };

    // Try to match content key patterns
    for (const [pattern, alt] of Object.entries(altTextMap)) {
        if (contentKey.toLowerCase().includes(pattern)) {
            return alt;
        }
    }

    // Fallback: use original filename without extension, cleaned up
    const cleanName = originalName
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
        .replace(/\b\w/g, char => char.toUpperCase()); // Title case

    return cleanName || 'Driving school image';
}