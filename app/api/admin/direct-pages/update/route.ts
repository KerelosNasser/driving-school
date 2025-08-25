// Direct Page Update API - Update actual Next.js page files
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, sectionId, content, type = 'text' } = body;

    if (!slug || !sectionId) {
      return NextResponse.json(
        { error: 'Slug and sectionId are required' },
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

    // Read current file content
    let fileContent = fs.readFileSync(filePath, 'utf8');

    // Update the content based on type
    if (type === 'text') {
      // Update EditableText component
      const editableTextRegex = new RegExp(
        `(<EditableText[^>]*contentKey=["']${sectionId}["'][^>]*>)([^<]*)(<\\/EditableText>)`,
        'g'
      );
      
      fileContent = fileContent.replace(editableTextRegex, `$1${content}$3`);
      
      // Also update defaultValue if it exists
      const defaultValueRegex = new RegExp(
        `(<EditableText[^>]*contentKey=["']${sectionId}["'][^>]*defaultValue=["'])([^"']*)([^>]*>)`,
        'g'
      );
      
      fileContent = fileContent.replace(defaultValueRegex, `$1${content}$3`);
    
    } else if (type === 'image') {
      // Update EditableImage component
      const editableImageRegex = new RegExp(
        `(<EditableImage[^>]*contentKey=["']${sectionId}["'][^>]*src=["'])([^"']*)([^>]*\\/?>)`,
        'g'
      );
      
      fileContent = fileContent.replace(editableImageRegex, `$1${content}$3`);
    
    } else if (type === 'html') {
      // Update HTML content within components
      const htmlRegex = new RegExp(
        `(<!-- ${sectionId}_start -->)([\\s\\S]*?)(<!-- ${sectionId}_end -->)`,
        'g'
      );
      
      fileContent = fileContent.replace(htmlRegex, `$1\n${content}\n$3`);
    }

    // Create backup
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));

    // Write updated content
    fs.writeFileSync(filePath, fileContent, 'utf8');

    // Clean up old backups (keep only last 5)
    const backupDir = path.dirname(filePath);
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith(path.basename(filePath) + '.backup.'))
      .sort()
      .reverse();
    
    // Remove old backups
    backupFiles.slice(5).forEach(file => {
      fs.unlinkSync(path.join(backupDir, file));
    });

    return NextResponse.json({
      success: true,
      data: {
        slug,
        sectionId,
        updated: true,
        lastModified: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating page content:', error);
    return NextResponse.json(
      { error: 'Failed to update page content', details: error.message },
      { status: 500 }
    );
  }
}