// Direct Page Editor - WordPress-like direct file editing system
// This system allows editing actual Next.js page files without database dependency

export interface DirectPageInfo {
  slug: string;
  title: string;
  filePath: string;
  status: 'active' | 'inactive';
  lastModified: string;
  hasContent: boolean;
}

export interface EditableSection {
  id: string;
  type: 'text' | 'image' | 'hero' | 'list' | 'card' | 'custom';
  content: any;
  position: {
    line: number;
    component: string;
  };
}

// Get all available pages from the file system
export function getDirectPages(): DirectPageInfo[] {
  const pages: DirectPageInfo[] = [
    {
      slug: 'home',
      title: 'Homepage',
      filePath: '/app/page.tsx',
      status: 'active',
      lastModified: new Date().toISOString(),
      hasContent: true
    },
    {
      slug: 'about',
      title: 'About Us',
      filePath: '/app/about/page.tsx',
      status: 'active',
      lastModified: new Date().toISOString(),
      hasContent: true
    },
    {
      slug: 'contact',
      title: 'Contact',
      filePath: '/app/contact/page.tsx',
      status: 'active',
      lastModified: new Date().toISOString(),
      hasContent: true
    },
    {
      slug: 'packages',
      title: 'Packages',
      filePath: '/app/packages/page.tsx',
      status: 'active',
      lastModified: new Date().toISOString(),
      hasContent: true
    },
    {
      slug: 'book',
      title: 'Book a Lesson',
      filePath: '/app/book/page.tsx',
      status: 'active',
      lastModified: new Date().toISOString(),
      hasContent: true
    },
    {
      slug: 'reviews',
      title: 'Reviews',
      filePath: '/app/reviews/page.tsx',
      status: 'active',
      lastModified: new Date().toISOString(),
      hasContent: true
    }
  ];

  return pages;
}

// WordPress-like content extraction from React components
export async function extractEditableContent(slug: string): Promise<EditableSection[]> {
  try {
    // Get the page file content
    const response = await fetch(`/api/admin/direct-pages/content?slug=${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch page content');
    }
    
    const { content } = await response.json();
    return parseEditableContent(content);
  } catch (error) {
    console.error('Error extracting content:', error);
    return [];
  }
}

// Parse React component code to find editable sections
function parseEditableContent(fileContent: string): EditableSection[] {
  const sections: EditableSection[] = [];
  
  // Extract EditableText components
  const editableTextRegex = /<EditableText[^>]*contentKey=["']([^"']+)["'][^>]*>([^<]*)<\/EditableText>/g;
  let match;
  
  while ((match = editableTextRegex.exec(fileContent)) !== null) {
    sections.push({
      id: match[1],
      type: 'text',
      content: match[2],
      position: {
        line: getLineNumber(fileContent, match.index),
        component: 'EditableText'
      }
    });
  }

  // Extract EditableImage components
  const editableImageRegex = /<EditableImage[^>]*contentKey=["']([^"']+)["'][^>]*src=["']([^"']+)["'][^>]*\/>/g;
  
  while ((match = editableImageRegex.exec(fileContent)) !== null) {
    sections.push({
      id: match[1],
      type: 'image',
      content: match[2],
      position: {
        line: getLineNumber(fileContent, match.index),
        component: 'EditableImage'
      }
    });
  }

  // Extract hero sections
  const heroRegex = /<section[^>]*className=[^>]*hero[^>]*>(.*?)<\/section>/gs;
  
  while ((match = heroRegex.exec(fileContent)) !== null) {
    sections.push({
      id: `hero_${sections.length}`,
      type: 'hero',
      content: match[1],
      position: {
        line: getLineNumber(fileContent, match.index),
        component: 'HeroSection'
      }
    });
  }

  return sections;
}

// Update content directly in the file
export async function updatePageContent(slug: string, sectionId: string, newContent: any): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/direct-pages/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        slug,
        sectionId,
        content: newContent
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating content:', error);
    return false;
  }
}

// Create a new page file
export async function createNewPage(slug: string, title: string, template: string = 'basic'): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/direct-pages/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        slug,
        title,
        template
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error creating page:', error);
    return false;
  }
}

// Helper function to get line number from string index
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

// Page templates for creating new pages
export const PAGE_TEMPLATES = {
  basic: `'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';

export default function {{TITLE}}Page() {
  const { isEditMode } = useEditMode();

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">
            <EditableText contentKey="{{SLUG}}_title" defaultValue="{{TITLE}}" />
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <EditableText 
            contentKey="{{SLUG}}_content" 
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

export default function {{TITLE}}Page() {
  const { isEditMode } = useEditMode();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            <EditableText contentKey="{{SLUG}}_hero_title" defaultValue="{{TITLE}}" />
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            <EditableText 
              contentKey="{{SLUG}}_hero_subtitle" 
              defaultValue="Your compelling subtitle goes here"
            />
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <EditableText contentKey="{{SLUG}}_hero_button" defaultValue="Get Started" />
          </Button>
        </div>
      </section>

      {/* Content Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <EditableText 
            contentKey="{{SLUG}}_content" 
            defaultValue="<h2>Welcome</h2><p>Add your content here...</p>"
            type="rich"
          />
        </div>
      </main>
    </div>
  );
}`
};