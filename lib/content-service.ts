import { supabase } from './supabase';
import { SiteContent } from './types';

export class ContentServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ContentServiceError';
  }
}

export interface ContentFilters {
  section?: string;
  contentType?: 'text' | 'image' | 'json' | 'boolean';
  isActive?: boolean;
  isDraft?: boolean;
  search?: string;
  tags?: string[];
}

export interface ContentSortOptions {
  field: 'created_at' | 'updated_at' | 'display_order' | 'content_key';
  direction: 'asc' | 'desc';
}

export interface GetAllContentOptions {
  filters?: ContentFilters;
  sort?: ContentSortOptions;
  limit?: number;
  offset?: number;
}

export interface ContentStats {
  total: number;
  active: number;
  draft: number;
  byType: Record<string, number>;
  bySection: Record<string, number>;
}

class EnhancedContentService {
  async getAll(options: GetAllContentOptions = {}): Promise<{
    data: SiteContent[];
    total: number;
    stats: ContentStats;
  }> {
    try {
      let query = supabase.from('site_content').select('*', { count: 'exact' });

      // Apply filters
      if (options.filters) {
        const { section, contentType, isActive, isDraft, search, tags } = options.filters;
        
        if (section) {
          query = query.eq('page_section', section);
        }
        
        if (contentType) {
          query = query.eq('content_type', contentType);
        }
        
        if (isActive !== undefined) {
          query = query.eq('is_active', isActive);
        }
        
        if (isDraft !== undefined) {
          query = query.eq('is_draft', isDraft);
        }
        
        if (search) {
          query = query.or(`content_key.ilike.%${search}%,content_value.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        if (tags && tags.length > 0) {
          // Assuming tags are stored in content_json or a separate field
          query = query.contains('content_json', { tags });
        }
      }

      // Apply sorting
      if (options.sort) {
        query = query.order(options.sort.field, { ascending: options.sort.direction === 'asc' });
      } else {
        query = query.order('display_order', { ascending: true }).order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new ContentServiceError(`Failed to fetch content: ${error.message}`, error.code);
      }

      // Get stats
      const stats = await this.getStats();

      return {
        data: data || [],
        total: count || 0,
        stats
      };
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error fetching content: ${error}`);
    }
  }

  async getById(id: string): Promise<SiteContent | null> {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new ContentServiceError(`Failed to fetch content: ${error.message}`, error.code);
      }

      return data;
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error fetching content by ID: ${error}`);
    }
  }

  async create(content: Omit<SiteContent, 'id' | 'created_at' | 'updated_at'>): Promise<SiteContent> {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .insert([content])
        .select();

      if (error) {
        throw new ContentServiceError(`Failed to create content: ${error.message}`, error.code);
      }

      // Return the first item from the array
      return data[0];
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error creating content: ${error}`);
    }
  }

  async update(id: string, updates: Partial<SiteContent>): Promise<SiteContent> {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) {
        throw new ContentServiceError(`Failed to update content: ${error.message}`, error.code);
      }

      // Check if we got data back
      if (!data || data.length === 0) {
        throw new ContentServiceError('Failed to update content: No data returned');
      }

      // Return the first (and should be only) item
      return data[0];
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error updating content: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // First get the content to check for associated files
      const content = await this.getById(id);
      
      if (content?.file_path) {
        // Delete associated file from storage
        const { error: storageError } = await supabase.storage
          .from('content-files')
          .remove([content.file_path]);
        
        if (storageError) {
          console.warn('Failed to delete associated file:', storageError);
        }
      }

      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('id', id);

      if (error) {
        throw new ContentServiceError(`Failed to delete content: ${error.message}`, error.code);
      }
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error deleting content: ${error}`);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    try {
      // Get all content items to check for associated files
      const { data: contentItems } = await supabase
        .from('site_content')
        .select('id, file_path')
        .in('id', ids);

      // Delete associated files
      const filePaths = contentItems?.filter(item => item.file_path).map(item => item.file_path) || [];
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('content-files')
          .remove(filePaths);
        
        if (storageError) {
          console.warn('Failed to delete some associated files:', storageError);
        }
      }

      const { error } = await supabase
        .from('site_content')
        .delete()
        .in('id', ids);

      if (error) {
        throw new ContentServiceError(`Failed to bulk delete content: ${error.message}`, error.code);
      }
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error bulk deleting content: ${error}`);
    }
  }

  async bulkUpdate(ids: string[], updates: Partial<SiteContent>): Promise<void> {
    try {
      const { error } = await supabase
        .from('site_content')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) {
        throw new ContentServiceError(`Failed to bulk update content: ${error.message}`, error.code);
      }
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error bulk updating content: ${error}`);
    }
  }

  async uploadFile(
    file: File,
    path: string,
    _onProgress?: (progress: number) => void
  ): Promise<{ path: string; url: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('content-files')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new ContentServiceError(`Failed to upload file: ${error.message}`, error.message);
      }

      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(data.path);

      return {
        path: data.path,
        url: urlData.publicUrl
      };
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error uploading file: ${error}`);
    }
  }

  async getSections(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('page_section')
        .not('page_section', 'is', null);

      if (error) {
        throw new ContentServiceError(`Failed to fetch sections: ${error.message}`, error.code);
      }

      const sections = [...new Set(data?.map(item => item.page_section).filter(Boolean))] as string[];
      return sections.sort();
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error fetching sections: ${error}`);
    }
  }

  async duplicate(id: string): Promise<SiteContent> {
    try {
      const original = await this.getById(id);
      if (!original) {
        throw new ContentServiceError('Content not found for duplication');
      }

      const { id: _, created_at, updated_at, ...contentToDuplicate } = original;
      const duplicatedContent = {
        ...contentToDuplicate,
        content_key: `${original.content_key}_copy`,
        title: original.title ? `${original.title} (Copy)` : null,
        is_draft: true
      };

      return await this.create({
        ...duplicatedContent,
        title: duplicatedContent.title || null
      });
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error duplicating content: ${error}`);
    }
  }

  private async getStats(): Promise<ContentStats> {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_type, page_section, is_active, is_draft');

      if (error) {
        throw new ContentServiceError(`Failed to fetch stats: ${error.message}`, error.code);
      }

      const stats: ContentStats = {
        total: data?.length || 0,
        active: data?.filter(item => item.is_active).length || 0,
        draft: data?.filter(item => item.is_draft).length || 0,
        byType: {},
        bySection: {}
      };

      data?.forEach(item => {
        // Count by type
        stats.byType[item.content_type] = (stats.byType[item.content_type] || 0) + 1;
        
        // Count by section
        if (item.page_section) {
          stats.bySection[item.page_section] = (stats.bySection[item.page_section] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      throw new ContentServiceError(`Unexpected error fetching stats: ${error}`);
    }
  }
}

export const enhancedContentService = new EnhancedContentService();
export default enhancedContentService;