// lib/content.ts
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
  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_name', pageName);

    // if (error) {
    //   console.error('Error fetching page content:', error);
    //   return {};
    // }

    // Transform array to object with content_key as keys
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
    return {};
  }
}

/**
 * Get a specific content item
 */
export async function getContentItem(pageName: string, contentKey: string): Promise<ContentItem | null> {
  const supabase = createServerComponentClient({ cookies });

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
  return item.content_json || fallback;
}

/**
 * Helper function to get file URL with fallback
 */
export function getContentFile(
    content: PageContent,
    key: string,
    fallback: string = ''
): { url: string; alt: string } {
  const item = content[key];
  if (!item || item.content_type !== 'file') {
    return { url: fallback, alt: '' };
  }
  return {
    url: item.file_url || fallback,
    alt: item.alt_text || '',
  };
}