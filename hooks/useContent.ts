import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  enhancedContentService, 
  ContentFilters, 
  ContentSortOptions, 
  ContentStats,
  ContentServiceError,
  GetAllContentOptions
} from '@/lib/content-service';
import { SiteContent } from '@/lib/types';

export interface UseEnhancedContentOptions {
  filters?: ContentFilters;
  sort?: ContentSortOptions;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseEnhancedContentParams {
  section?: string;
  contentType?: 'text' | 'image' | 'json' | 'boolean';
  search?: string;
  isActive?: boolean;
  isDraft?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'content_key' | 'page_section' | 'display_order';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UseEnhancedContentReturn {
  // State
  content: SiteContent[];
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  error: string | null;
  totalCount: number;
  stats: ContentStats | null;
  sections: string[];
  
  // Actions
  fetchContent: (params?: UseEnhancedContentParams) => Promise<void>;
  createContent: (content: Omit<SiteContent, 'id' | 'created_at' | 'updated_at'>) => Promise<SiteContent | null>;
  updateContent: (id: string, updates: Partial<SiteContent>) => Promise<SiteContent | null>;
  deleteContent: (id: string) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<boolean>;
  bulkUpdate: (ids: string[], updates: Partial<SiteContent>) => Promise<boolean>;
  duplicateContent: (id: string) => Promise<SiteContent | null>;
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<string | null>;
  refreshSections: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
}

export function useEnhancedContent(options: UseEnhancedContentOptions = {}): UseEnhancedContentReturn {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [sections, setSections] = useState<string[]>([]);

  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    const message = error instanceof ContentServiceError ? error.message : defaultMessage;
    setError(message);
    toast.error(message);
    console.error(error);
  }, []);

  const fetchContent = useCallback(async (params?: UseEnhancedContentParams) => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert params to the format expected by enhancedContentService
      const serviceOptions: GetAllContentOptions = {};
      
      if (params) {
        serviceOptions.filters = {
          section: params.section,
          contentType: params.contentType,
          isActive: params.isActive,
          isDraft: params.isDraft,
          search: params.search
        };
        
        if (params.sortBy && params.sortOrder) {
          serviceOptions.sort = {
            field: params.sortBy,
            direction: params.sortOrder
          };
        }
        
        serviceOptions.limit = params.limit;
        serviceOptions.offset = params.offset;
      }
      
      const result = await enhancedContentService.getAll(serviceOptions);
      
      setContent(result.data);
      setTotalCount(result.total);
      setStats(result.stats);
    } catch (error) {
      handleError(error, 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const refreshSections = useCallback(async () => {
    try {
      const sectionsData = await enhancedContentService.getSections();
      setSections(sectionsData);
    } catch (error) {
      handleError(error, 'Failed to fetch sections');
    }
  }, [handleError]);

  const createContent = useCallback(async (newContent: Omit<SiteContent, 'id' | 'created_at' | 'updated_at'>) => {
    setSaving(true);
    setError(null);
    
    try {
      const created = await enhancedContentService.create(newContent);
      setContent(prev => [created, ...prev]);
      setTotalCount(prev => prev + 1);
      toast.success('Content created successfully');
      return created;
    } catch (error) {
      handleError(error, 'Failed to create content');
      return null;
    } finally {
      setSaving(false);
    }
  }, [handleError]);

  const updateContent = useCallback(async (id: string, updates: Partial<SiteContent>) => {
    setSaving(true);
    setError(null);
    
    try {
      const updated = await enhancedContentService.update(id, updates);
      setContent(prev => prev.map(item => item.id === id ? updated : item));
      toast.success('Content updated successfully');
      return updated;
    } catch (error) {
      handleError(error, 'Failed to update content');
      return null;
    } finally {
      setSaving(false);
    }
  }, [handleError]);

  const deleteContent = useCallback(async (id: string) => {
    setError(null);
    
    try {
      // Optimistic update
      setContent(prev => prev.filter(item => item.id !== id));
      setTotalCount(prev => prev - 1);
      
      await enhancedContentService.delete(id);
      toast.success('Content deleted successfully');
      return true;
    } catch (error) {
      // Revert optimistic update on error
      await fetchContent();
      handleError(error, 'Failed to delete content');
      return false;
    }
  }, [handleError, fetchContent]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    setError(null);
    
    try {
      // Optimistic update
      setContent(prev => prev.filter(item => !ids.includes(item.id)));
      setTotalCount(prev => prev - ids.length);
      
      await enhancedContentService.bulkDelete(ids);
      toast.success(`${ids.length} items deleted successfully`);
      return true;
    } catch (error) {
      // Revert optimistic update on error
      await fetchContent();
      handleError(error, 'Failed to delete content items');
      return false;
    }
  }, [handleError, fetchContent]);

  const bulkUpdate = useCallback(async (ids: string[], updates: Partial<SiteContent>) => {
    setSaving(true);
    setError(null);
    
    try {
      await enhancedContentService.bulkUpdate(ids, updates);
      // Refresh content to get updated data
      await fetchContent();
      toast.success(`${ids.length} items updated successfully`);
      return true;
    } catch (error) {
      handleError(error, 'Failed to update content items');
      return false;
    } finally {
      setSaving(false);
    }
  }, [handleError, fetchContent]);

  const duplicateContent = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const duplicated = await enhancedContentService.duplicate(id);
      setContent(prev => [duplicated, ...prev]);
      setTotalCount(prev => prev + 1);
      toast.success('Content duplicated successfully');
      return duplicated;
    } catch (error) {
      handleError(error, 'Failed to duplicate content');
      return null;
    } finally {
      setSaving(false);
    }
  }, [handleError]);

  const uploadFile = useCallback(async (
    file: File, 
    onProgress?: (progress: number) => void
  ) => {
    setUploading(true);
    setError(null);
    
    try {
      // Generate a unique path for the file
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `uploads/${timestamp}_${sanitizedName}`;
      
      const result = await enhancedContentService.uploadFile(file, path, onProgress);
      toast.success('File uploaded successfully');
      return result.url;
    } catch (error) {
      handleError(error, 'Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchContent();
    }
  }, [fetchContent, options.autoFetch]);

  // Fetch sections on mount
  useEffect(() => {
    refreshSections();
  }, [refreshSections]);

  return {
    // State
    content,
    loading,
    saving,
    uploading,
    error,
    totalCount,
    stats,
    sections,
    
    // Actions
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    bulkDelete,
    bulkUpdate,
    duplicateContent,
    uploadFile,
    refreshSections,
    clearError
  };
}