// Direct Page Content API - Read actual Next.js page files
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Map slugs to actual file paths
    const pageMap: Record<string, string> = {
      'home': 'page.tsx',
      'about': 'about/page.tsx',
      'contact': 'contact/page.tsx',
      'packages': 'packages/page.tsx',
      'book': 'book/page.tsx',
      'reviews': 'reviews/page.tsx'
    };

    const relativePath = pageMap[slug];
    if (!relativePath) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Get the absolute path to the page file
    const filePath = path.join(process.cwd(), 'app', relativePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Page file not found' },
        { status: 404 }
      );
    }

    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Get file stats
    const stats = fs.statSync(filePath);

    return NextResponse.json({
      success: true,
      data: {
        slug,
        filePath: relativePath,
        content,
        lastModified: stats.mtime.toISOString(),
        size: stats.size
      }
    });

  } catch (error) {
    console.error('Error reading page content:', error);
    return NextResponse.json(
      { error: 'Failed to read page content' },
      { status: 500 }
    );
  }
}