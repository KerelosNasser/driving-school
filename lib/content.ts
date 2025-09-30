
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface ContentItem {
  content_key: string;
  content_value?: string;
  content_json?: any;
  file_url?: string;
  alt_text?: string;
  content_type: 'text' | 'json' | 'file';
}

export interface PageContent {
  [key: string]: ContentItem | undefined;
}

/**
 * Get all content for a specific page
 */
export async function getPageContent(pageName: string): Promise<PageContent> {
  const supabase = await createServerComponentClient({ cookies });

  try {
    const { data } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_name', pageName);

    const contentMap: PageContent = {};
    data?.forEach((item) => {
      contentMap[item.content_key] = {
        content_key: item.content_key,
        content_value: item.content_value,
        content_json: item.content_json,
        file_url: item.file_url,
        alt_text: item.alt_text,
        content_type: item.content_type,
      };
    });

    return contentMap;
  } catch (error) {
    console.error('Error in getPageContent:', error);
    // Return a minimal fallback so the renderer never receives `undefined` or malformed content
    return FALLBACK_PAGE_CONTENT;
  }
}

// Minimal fallback content map used when DB fetch or validation fails
export const FALLBACK_PAGE_CONTENT: PageContent = {
  'hero_title': { content_key: 'hero_title', content_value: 'Default Title', content_type: 'text' },
  'hero_subtitle': { content_key: 'hero_subtitle', content_value: 'Default subtitle', content_type: 'text' },
};

export async function getContentItem(pageName: string, contentKey: string): Promise<ContentItem | null> {
  const supabase =  await createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_name', pageName)
        .eq('content_key', contentKey)
        .single();

    if (error || !data) {
      return null;
    }

    return {
      content_key: data.content_key,
      content_value: data.content_value,
      content_json: data.content_json,
      file_url: data.file_url,
      alt_text: data.alt_text,
      content_type: data.content_type,
    };
  } catch (error) {
    console.error('Error in getContentItem:', error);
    return null;
  }
}

/**
 * Client-side content service for admin operations
 */
export class ContentService {
  private static instance: ContentService;

  static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  async updateContent(
      key: string,
      value: any,
      type: 'text' | 'json' | 'file' = 'text',
      page: string = 'home'
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type,
          page,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating content:', error);
      return false;
    }
  }

  async createContent(
      key: string,
      value: any,
      type: 'text' | 'json' | 'file' = 'text',
      page: string = 'home'
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type,
          page,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error creating content:', error);
      return false;
    }
  }

  async deleteContent(key: string, page: string = 'home'): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/content?key=${key}&page=${page}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }

  async uploadImage(file: File, contentKey: string): Promise<{ url: string; alt: string } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentKey', contentKey);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return {
        url: result.url,
        alt: result.alt,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }
}

/**
 * Helper function to get content value with fallback
 */
export function getContentValue(
    content: PageContent,
    key: string,
    fallback: string = ''
): string {
  const item = content[key];
  if (!item) return fallback;

  switch (item.content_type) {
    case 'text':
      return item.content_value || fallback;
    case 'json':
      // Handle different JSON structures
      if (typeof item.content_json === 'string') {
        return item.content_json;
      }
      return JSON.stringify(item.content_json) || fallback;
    case 'file':
      return item.file_url || fallback;
    default:
      return item.content_value || fallback;
  }
}

/**
 * Helper function to get content JSON with fallback
 */
export function getContentJson<T = any>(
    content: PageContent,
    key: string,
    fallback: T
): T {
  const item = content[key];
  if (!item || item.content_type !== 'json') return fallback;

  // Handle case where content_json might be null or undefined
  if (item.content_json === null || item.content_json === undefined) {
    return fallback;
  }

  return item.content_json || fallback;
}

/**
 * Helper function to get file URL with fallback
 * Updated to handle both old and new image storage formats
 */
export function getContentFile(
    content: PageContent,
    key: string,
    fallback: string = ''
): { url: string; alt: string } {
  const item = content[key];

  if (!item) {
    return { url: fallback, alt: '' };
  }

  // Handle different storage formats
  if (item.content_type === 'file') {
    return {
      url: item.file_url || fallback,
      alt: item.alt_text || '',
    };
  }

  // Handle JSON format for image data (new format)
  if (item.content_type === 'json' && item.content_json) {
    const jsonData = item.content_json;
    if (typeof jsonData === 'object' && jsonData.url) {
      return {
        url: jsonData.url || fallback,
        alt: jsonData.alt || '',
      };
    }
  }

  // Handle legacy text format where URL was stored as text
  if (item.content_type === 'text' && item.content_value) {
    return {
      url: item.content_value || fallback,
      alt: '',
    };
  }

  return { url: fallback, alt: '' };
}

/**
 * Helper function specifically for getting image data
 */
export function getImageData(
    content: PageContent,
    key: string,
    fallbackUrl: string = '',
    fallbackAlt: string = ''
): { url: string; alt: string } {
  const result = getContentFile(content, key, fallbackUrl);
  return {
    url: result.url || fallbackUrl,
    alt: result.alt || fallbackAlt
  };
}

/**
 * Helper function to validate gallery images array
 */
export function validateGalleryImages(images: any): any[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter(img =>
      img &&
      typeof img === 'object' &&
      typeof img.src === 'string' &&
      img.src.trim() !== ''
  ).map((img, index) => ({
    id: img.id || Date.now() + index,
    src: img.src.trim(),
    alt: img.alt || img.studentName || `Gallery image ${index + 1}`,
    studentName: img.studentName || '',
    isUploaded: img.isUploaded || false
  }));
}