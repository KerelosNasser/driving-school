// Direct Page Creation API - Create new Next.js page files
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, template = 'basic' } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: 'Slug and title are required' },
        { status: 400 }
      );
    }

    // Validate slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }

    // Page templates
    const templates = {
      basic: `'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';

export default function ${title.replace(/\s+/g, '')}Page() {
  const { isEditMode } = useEditMode();

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">
            <EditableText 
              contentKey="${slug}_title" 
              defaultValue="${title}" 
            />
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <EditableText 
            contentKey="${slug}_content" 
            defaultValue="<p>Add your content here...</p>"
            type="rich"
          />
        </div>
      </main>
    </div>
  );
}`,

      hero: `'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';
import { Button } from '@/components/ui/button';

export default function ${title.replace(/\s+/g, '')}Page() {
  const { isEditMode } = useEditMode();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            <EditableText 
              contentKey="${slug}_hero_title" 
              defaultValue="${title}" 
            />
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            <EditableText 
              contentKey="${slug}_hero_subtitle" 
              defaultValue="Your compelling subtitle goes here"
            />
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <EditableText 
              contentKey="${slug}_hero_button" 
              defaultValue="Get Started" 
            />
          </Button>
        </div>
      </section>

      {/* Content Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <EditableText 
            contentKey="${slug}_content" 
            defaultValue="<h2>Welcome</h2><p>Add your content here...</p>"
            type="rich"
          />
        </div>
      </main>
    </div>
  );
}`,

      landing: `'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ${title.replace(/\s+/g, '')}Page() {
  const { isEditMode } = useEditMode();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            <EditableText 
              contentKey="${slug}_hero_title" 
              defaultValue="${title}" 
            />
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            <EditableText 
              contentKey="${slug}_hero_subtitle" 
              defaultValue="Your compelling subtitle goes here"
            />
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <EditableText 
              contentKey="${slug}_hero_button" 
              defaultValue="Get Started" 
            />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            <EditableText 
              contentKey="${slug}_features_title" 
              defaultValue="Why Choose Us?" 
            />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EditableImage 
                      contentKey="${slug}_feature_icon_${i}"
                      defaultSrc="/icons/feature.svg"
                      className="w-8 h-8"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    <EditableText 
                      contentKey="${slug}_feature_title_${i}" 
                      defaultValue="Feature ${i}" 
                    />
                  </h3>
                  <p className="text-gray-600">
                    <EditableText 
                      contentKey="${slug}_feature_desc_${i}" 
                      defaultValue="Feature description goes here..."
                    />
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            <EditableText 
              contentKey="${slug}_cta_title" 
              defaultValue="Ready to Get Started?" 
            />
          </h2>
          <p className="text-xl mb-8">
            <EditableText 
              contentKey="${slug}_cta_subtitle" 
              defaultValue="Contact us today and begin your journey"
            />
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <EditableText 
              contentKey="${slug}_cta_button" 
              defaultValue="Contact Us" 
            />
          </Button>
        </div>
      </section>
    </div>
  );
}`
    };

    // Get template content
    const templateContent = templates[template as keyof typeof templates] || templates.basic;

    // Create directory path
    const pageDirPath = path.join(process.cwd(), 'app', slug);
    const pageFilePath = path.join(pageDirPath, 'page.tsx');

    // Check if page already exists
    if (fs.existsSync(pageFilePath)) {
      return NextResponse.json(
        { error: 'Page already exists' },
        { status: 409 }
      );
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(pageDirPath)) {
      fs.mkdirSync(pageDirPath, { recursive: true });
    }

    // Write the page file
    fs.writeFileSync(pageFilePath, templateContent, 'utf8');

    return NextResponse.json({
      success: true,
      data: {
        slug,
        title,
        template,
        filePath: `app/${slug}/page.tsx`,
        created: true,
        lastModified: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page', details: error.message },
      { status: 500 }
    );
  }
}