// app/api/admin/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
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

        // Validate file size (10MB limit for local storage)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum size is 10MB.'
            }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public/uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Create a unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        return NextResponse.json({
            success: true,
            filename,
            url: `/uploads/${filename}`,
            altText
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json({
            error: 'Failed to upload image',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
        }

        const filepath = join(process.cwd(), 'public/uploads', filename);
        
        if (existsSync(filepath)) {
            const fs = require('fs');
            fs.unlinkSync(filepath);
        }

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json({
            error: 'Failed to delete image',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
