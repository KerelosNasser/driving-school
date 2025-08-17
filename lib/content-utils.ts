// lib/content-utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for combining classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
export interface SiteContent {
  id: string;
  content_key: string;
  content_type: 'image' | 'text' | 'json' | 'boolean';
  content_value: string | null;
  content_json: any;
  page_section: string;
  display_order: number;
  is_active: boolean;
  file_path?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  alt_text?: string;
  title?: string;
  description?: string;
  is_draft: boolean;
  version?: number;
  parent_id?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  isUploaded?: boolean;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

export interface UploadResult {
  success: boolean;
  data?: {
    originalName: string;
    size: number;
    type: string;
    images: Array<{
      size: string;
      path: string;
      url: string;
      width?: number;
      height?: number;
    }>;
    primaryUrl: string;
    primaryPath: string;
  };
  error?: string;
  details?: string;
}

export interface ContentResponse {
  data: SiteContent[];
  count: number;
  error?: string;
  details?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
} as const;

export const CONTENT_SECTIONS = [
  { value: 'home', label: 'Home Page' },
  { value: 'about', label: 'About Page' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'global', label: 'Global Settings' },
] as const;

// Validation functions
export function validateImageFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    });
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push({
      field: 'file',
      message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed'
    });
  }
  
  return errors;
}

export function validateImageUrl(url: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!url.trim()) {
    return errors; // Empty URL is valid
  }
  
  try {
    new URL(url);
  } catch {
    errors.push({
      field: 'url',
      message: 'Invalid URL format'
    });
  }
  
  return errors;
}

export function validateTextContent(content: string, required = false): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (required && !content.trim()) {
    errors.push({
      field: 'content',
      message: 'Content is required'
    });
  }
  
  if (content.length > 10000) {
    errors.push({
      field: 'content',
      message: 'Content is too long (maximum 10,000 characters)'
    });
  }
  
  return errors;
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function generateContentKey(title: string, section: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
  
  return `${section}_${sanitized}`;
}

export function getContentTypeIcon(type: SiteContent['content_type']) {
  switch (type) {
    case 'image':
      return 'ImageIcon';
    case 'text':
      return 'Type';
    case 'json':
      return 'Settings';
    case 'boolean':
      return 'ToggleLeft';
    default:
      return 'FileText';
  }
}

// Supabase Storage helpers
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  return url;
}

export function buildStorageUrl(bucket: string, path: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path}`;
}

// Content transformation helpers
export function transformContentForDisplay(content: SiteContent): SiteContent {
  return {
    ...content,
    // Ensure file URLs are properly constructed
    file_url: content.file_path ? buildStorageUrl('content-images', content.file_path) : undefined,
    // For backward compatibility with components expecting content_value as image URL
    content_value: content.content_type === 'image' && content.file_path 
      ? buildStorageUrl('content-images', content.file_path)
      : content.content_value,
  };
}

export function sortContentByDisplayOrder(content: SiteContent[]): SiteContent[] {
  return [...content].sort((a, b) => a.display_order - b.display_order);
}

export function groupContentBySection(content: SiteContent[]): Record<string, SiteContent[]> {
  return content.reduce((groups, item) => {
    const section = item.page_section;
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(item);
    return groups;
  }, {} as Record<string, SiteContent[]>);
}

// Search and filtering
export function filterContent(
  content: SiteContent[], 
  filters: {
    section?: string;
    type?: string;
    active?: boolean;
    draft?: boolean;
    search?: string;
  }
): SiteContent[] {
  return content.filter(item => {
    if (filters.section && filters.section !== 'all' && item.page_section !== filters.section) {
      return false;
    }
    
    if (filters.type && item.content_type !== filters.type) {
      return false;
    }
    
    if (typeof filters.active === 'boolean' && item.is_active !== filters.active) {
      return false;
    }
    
    if (typeof filters.draft === 'boolean' && item.is_draft !== filters.draft) {
      return false;
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        item.content_key,
        item.content_value,
        item.title,
        item.alt_text,
        item.description
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        field?.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });
}

// Error handling
export class ContentManagementError extends Error {
  constructor(
    message: string,
    public code?: string,
    public field?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ContentManagementError';
  }
}

export function handleApiError(error: any): ValidationError {
  if (error instanceof ContentManagementError) {
    return {
      field: error.field || 'general',
      message: error.message
    };
  }
  
  if (error.response?.data?.details) {
    return {
      field: 'api',
      message: error.response.data.details
    };
  }
  
  return {
    field: 'general',
    message: error.message || 'An unexpected error occurred'
  };
}

// Local Storage helpers for drafts and preferences
export function saveDraftToStorage(contentId: string, draft: Partial<SiteContent>) {
  if (typeof window === 'undefined') return;
  
  try {
    const drafts = JSON.parse(localStorage.getItem('content_drafts') || '{}');
    drafts[contentId] = {
      ...draft,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('content_drafts', JSON.stringify(drafts));
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
}

export function loadDraftFromStorage(contentId: string): Partial<SiteContent> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const drafts = JSON.parse(localStorage.getItem('content_drafts') || '{}');
    return drafts[contentId] || null;
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
    return null;
  }
}

export function clearDraftFromStorage(contentId: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const drafts = JSON.parse(localStorage.getItem('content_drafts') || '{}');
    delete drafts[contentId];
    localStorage.setItem('content_drafts', JSON.stringify(drafts));
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
}

// Performance optimization helpers
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}