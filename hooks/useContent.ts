import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  enhancedContentService, 
  ContentFilters, 
  ContentSortOptions, 
  ContentStats,
  ContentServiceError 
} from '@/lib/content-service';
import { SiteContent } from '@/lib/types';

export interface UseEnhancedContentOptions {
  filters?: ContentFilters;
  sort?: ContentSortOptions;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseEnhancedContentReturn {
  // State
  content: SiteContent[];
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  error: string | null;
  total: number;
  stats: ContentStats | null;
  sections: string[];
  
  // Actions
  fetchContent: () => Promise<void>;
  createContent: (content: Omit<SiteContent, 'id' | 'created_at' | 'updated_at'>) => Promise<SiteContent | null>;
  updateContent: (id: string, updates: Partial<SiteContent>) => Promise<SiteContent | null>;
  deleteContent: (id: string) => Promise<boolean>;
  bulkDeleteContent: (ids: string[]) => Promise<boolean>;
  bulkUpdateContent: (ids: string[], updates: Partial<SiteContent>) => Promise<boolean>;
  duplicateContent: (id: string) => Promise<SiteContent | null>;
  uploadFile: (file: File, path: string, onProgress?: (progress: number) => void) => Promise<{ path: string; url: string } | null>;
  refreshSections: () => Promise<void>;
  
  // Utilities
  setFilters: (filters: ContentFilters) => void;
  setSort: (sort: ContentSortOptions) => void;
  clearError: () => void;
}

export function useEnhancedContent(options: UseEnhancedContentOptions = {}): UseEnhancedContentReturn {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [filters, setFilters] = useState<ContentFilters>(options.filters || {});
  const [sort, setSort] = useState<ContentSortOptions>(options.sort || { field: 'created_at', direction: 'desc' });

  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    const message = error instanceof ContentServiceError ? error.message : defaultMessage;
    setError(message);
    toast.error(message);
    console.error(error);
  }, []);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await enhancedContentService.getAll({
        filters,
        sort,
        limit: options.limit
      });
      
      setContent(result.data);
      setTotal(result.total);
      setStats(result.stats);
    } catch (error) {
      handleError(error, 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [filters, sort, options.limit, handleError]);

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
      setTotal(prev => prev + 1);
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
      setTotal(prev => prev - 1);
      
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

  const bulkDeleteContent = useCallback(async (ids: string[]) => {
    setError(null);
    
    try {
      // Optimistic update
      setContent(prev => prev.filter(item => !ids.includes(item.id)));
      setTotal(prev => prev - ids.length);
      
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

  const bulkUpdateContent = useCallback(async (ids: string[], updates: Partial<SiteContent>) => {
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
      setTotal(prev => prev + 1);
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
    path: string, 
    onProgress?: (progress: number) => void
  ) => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await enhancedContentService.uploadFile(file, path, onProgress);
      toast.success('File uploaded successfully');
      return result;
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

  // Auto-fetch on mount and when dependencies change
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
    total,
    stats,
    sections,
    
    // Actions
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    bulkDeleteContent,
    bulkUpdateContent,
    duplicateContent,
    uploadFile,
    refreshSections,
    
    // Utilities
    setFilters,
    setSort,
    clearError
  };
}