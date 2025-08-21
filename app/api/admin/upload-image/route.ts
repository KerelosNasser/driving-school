// app/api/admin/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {auth, clerkClient} from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
         const user = await clerkClient.users.getUser(userId);
         if (user.publicMetadata?.role !== 'admin') {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
         }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const contentKey = formData.get('contentKey') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
            }, { status: 400 });
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum size is 5MB.'
            }, { status: 400 });
        }

        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const fileName = `${contentKey}_${uuidv4()}${fileExtension}`;

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'content');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Write file to disk
        const filePath = path.join(uploadDir, fileName);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(filePath, buffer);

        // Generate URL for the uploaded file
        const fileUrl = `/uploads/content/${fileName}`;

        // Generate alt text suggestion based on content key
        const altText = generateAltText(contentKey, file.name);

        return NextResponse.json({
            success: true,
            url: fileUrl,
            alt: altText,
            fileName,
            size: file.size,
            type: file.type,
            message: 'Image uploaded successfully'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Failed to upload image',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

function generateAltText(contentKey: string, originalName: string): string {
    // Simple alt text generation based on content key
    const altTextMap: Record<string, string> = {
        'instructor_image': 'Professional driving instructor',
        'hero_background': 'Students learning to drive',
        'gallery_image': 'Driving lesson in progress',
        'feature_icon': 'Service feature illustration',
        'testimonial_avatar': 'Student testimonial photo'
    };

    // Try to match content key patterns
    for (const [pattern, alt] of Object.entries(altTextMap)) {
        if (contentKey.includes(pattern)) {
            return alt;
        }
    }

    // Fallback: use original filename without extension
    return path.parse(originalName).name.replace(/[-_]/g, ' ');
}