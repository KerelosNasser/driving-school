// Modern Page Management Hooks - Following 2025 best practices
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  Page, 
  ComponentTemplate, 
  CreatePageRequest, 
  UpdatePageRequest,
  PagesResponse,
  ComponentTemplatesResponse
} from '@/lib/types/pages';

// Custom hook for managing pages
export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async (filters?: { 
    status?: string; 
    search?: string; 
    page?: number; 
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.limit) params.set('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/pages?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch pages');
      }

      // Normalize pages to ensure content structure exists
      const normalizedPages = (result.data.pages || []).map((page: any) => ({
        ...page,
        content: page.content || { blocks: [] },
        meta_data: page.meta_data || { description: '', keywords: '' },
        settings: page.settings || { layout: 'default', show_header: true, show_footer: true }
      }));

      setPages(normalizedPages);
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pages';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPage = useCallback(async (pageData: CreatePageRequest) => {
    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create page');
      }

      const newPage = {
        ...result.data.page,
        content: result.data.page.content || { blocks: [] },
        meta_data: result.data.page.meta_data || { description: '', keywords: '' },
        settings: result.data.page.settings || { layout: 'default', show_header: true, show_footer: true }
      };
      setPages(prev => [newPage, ...prev]);
      toast.success('Page created successfully');
      return newPage;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create page';
      toast.error(message);
      throw err;
    }
  }, []);

  const updatePage = useCallback(async (id: string, updates: UpdatePageRequest) => {
    try {
      const response = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update page');
      }

      const updatedPage = {
        ...result.data.page,
        content: result.data.page.content || { blocks: [] },
        meta_data: result.data.page.meta_data || { description: '', keywords: '' },
        settings: result.data.page.settings || { layout: 'default', show_header: true, show_footer: true }
      };
      setPages(prev => prev.map(page => page.id === id ? updatedPage : page));
      toast.success('Page updated successfully');
      return updatedPage;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update page';
      toast.error(message);
      throw err;
    }
  }, []);

  const deletePage = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/pages?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete page');
      }

      setPages(prev => prev.filter(page => page.id !== id));
      toast.success('Page deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete page';
      toast.error(message);
      throw err;
    }
  }, []);

  const getPage = useCallback(async (slug: string) => {
    try {
      const response = await fetch(`/api/admin/pages?slug=${slug}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch page');
      }

      return {
        ...result.data.page,
        content: result.data.page.content || { blocks: [] },
        meta_data: result.data.page.meta_data || { description: '', keywords: '' },
        settings: result.data.page.settings || { layout: 'default', show_header: true, show_footer: true }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch page';
      toast.error(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return {
    pages,
    loading,
    error,
    fetchPages,
    createPage,
    updatePage,
    deletePage,
    getPage
  };
}

// Custom hook for managing component templates
export function useComponentTemplates() {
  const [templates, setTemplates] = useState<ComponentTemplate[]>([]);
  const [groupedTemplates, setGroupedTemplates] = useState<Record<string, ComponentTemplate[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (filters?: { 
    category?: string; 
    search?: string; 
  }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.search) params.set('search', filters.search);

      const response = await fetch(`/api/admin/component-templates?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch templates');
      }

      setTemplates(result.data.templates);
      setGroupedTemplates(result.data.groupedTemplates);
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    groupedTemplates,
    loading,
    error,
    fetchTemplates
  };
}

// Custom hook for page editor state
export function usePageEditor(initialPage?: Page) {
  const [page, setPage] = useState<Page | null>(initialPage || null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hasChanges, setHasChanges] = useState(false);

  const updatePageContent = useCallback((newContent: any) => {
    if (!page) return;
    
    setPage(prev => prev ? { ...prev, content: newContent } : null);
    setHasChanges(true);
  }, [page]);

  const addBlock = useCallback((block: any, index?: number) => {
    if (!page) return;

    const newBlocks = [...page.content.blocks];
    if (index !== undefined) {
      newBlocks.splice(index, 0, block);
    } else {
      newBlocks.push(block);
    }

    updatePageContent({ blocks: newBlocks });
  }, [page, updatePageContent]);

  const updateBlock = useCallback((blockId: string, updates: any) => {
    if (!page) return;

    const newBlocks = page.content.blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );

    updatePageContent({ blocks: newBlocks });
  }, [page, updatePageContent]);

  const removeBlock = useCallback((blockId: string) => {
    if (!page) return;

    const newBlocks = page.content.blocks.filter(block => block.id !== blockId);
    updatePageContent({ blocks: newBlocks });
    
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [page, updatePageContent, selectedBlockId]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    if (!page) return;

    const newBlocks = [...page.content.blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);

    updatePageContent({ blocks: newBlocks });
  }, [page, updatePageContent]);

  const resetChanges = useCallback(() => {
    setHasChanges(false);
  }, []);

  return {
    page,
    setPage,
    selectedBlockId,
    setSelectedBlockId,
    isEditing,
    setIsEditing,
    isDragging,
    setIsDragging,
    previewMode,
    setPreviewMode,
    hasChanges,
    updatePageContent,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    resetChanges
  };
}