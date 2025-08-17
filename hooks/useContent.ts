// hooks/useContentManagement.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SiteContent, 
  GalleryImage, 
  UploadResult, 
  ContentResponse, 
  ValidationError,
  validateImageFile,
  validateImageUrl,
  validateTextContent,
  handleApiError,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage,
  debounce
} from '../lib/content-utils';

interface UseContentManagementOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  enableDrafts?: boolean;
}

interface UseContentManagementReturn {
  // State
  content: SiteContent[];
  galleryImages: GalleryImage[];
  loading: boolean;
  saving: Record<string, boolean>;
  uploading: Record<string, boolean>;
  uploadProgress: Record<string, number>;
  errors: ValidationError[];
  
  // Actions
  fetchContent: (section?: string, includeDrafts?: boolean) => Promise<void>;
  updateContent: (id: string, updates: Partial<SiteContent>) => Promise<void>;
  createContent: (data: Omit<SiteContent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  uploadFile: (contentId: string, file: File, section?: string) => Promise<UploadResult | null>;
  
  // Gallery specific
  updateGalleryImages: (images: GalleryImage[]) => Promise<void>;
  addGalleryImage: (imageData: Omit<GalleryImage, 'id'>) => Promise<void>;
  removeGalleryImage: (imageId: number) => Promise<void>;
  uploadGalleryImage: (imageId: number, file: File) => Promise<void>;
  
  // Utility
  clearErrors: (field?: string) => void;
  validateField: (field: string, value: any, type?: SiteContent['content_type']) => ValidationError[];
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useContentManagement(options: UseContentManagementOptions = {}): UseContentManagementReturn {
  const {
    autoSave = false,
    autoSaveInterval = 30000,
    enableDrafts = true
  } = options;

  // State
  const [content, setContent] = useState<SiteContent[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  // History for undo/redo
  const [history, setHistory] = useState<SiteContent[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  
  // Auto-save refs
  const autoSaveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingChanges = useRef<Record<string, Partial<SiteContent>>>({});

  // Save to history for undo/redo
  const saveToHistory = useCallback((newContent: SiteContent[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newContent]);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setHistoryIndex(maxHistorySize - 1);
      } else {
        setHistoryIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [historyIndex]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    debounce(async (contentId: string, updates: Partial<SiteContent>) => {
      if (enableDrafts) {
        saveDraftToStorage(contentId, updates);
      }
      
      if (autoSave) {
        try {
          await updateContentInternal(contentId, updates);
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, autoSaveInterval),
    [autoSave, enableDrafts, autoSaveInterval]
  );

  // Internal update function
  const updateContentInternal = async (id: string, updates: Partial<SiteContent>) => {
    const response = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to update content');
    }

    return response.json();
  };

  // Fetch content
  const fetchContent = useCallback(async (section?: string, includeDrafts = false) => {
    try {
      setLoading(true);
      clearErrors();

      const params = new URLSearchParams();
      if (section && section !== 'all') params.append('section', section);
      if (includeDrafts) params.append('drafts', 'true');

      const response = await fetch(`/api/content?${params}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result: ContentResponse = await response.json();
      if (result.data) {
        setContent(result.data);
        
        // Extract gallery images
        const galleryContent = result.data.find(item => item.content_key === 'gallery_images');
        if (galleryContent?.content_json) {
          setGalleryImages(galleryContent.content_json);
        }
        
        // Save initial state to history
        if (history.length === 0) {
          setHistory([result.data]);
          setHistoryIndex(0);
        }
      }
    } catch (error) {
      const validationError = handleApiError(error);
      setErrors([validationError]);
    } finally {
      setLoading(false);
    }
  }, [history.length]);

  // Update content
  const updateContent = useCallback(async (id: string, updates: Partial<SiteContent>) => {
    try {
      setSaving(prev => ({ ...prev, [id]: true }));
      clearErrors(id);

      // Save current state for undo
      saveToHistory(content);

      await updateContentInternal(id, updates);
      
      // Update local state
      setContent(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));

      // Clear draft from storage if update was successful
      if (enableDrafts) {
        clearDraftFromStorage(id);
      }

    } catch (error) {
      const validationError = handleApiError(error);
      setErrors(prev => [...prev.filter(e => e.field !== id), validationError]);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  }, [content, saveToHistory, enableDrafts]);

  // Create content
  const createContent = useCallback(async (data: Omit<SiteContent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create content');
      }

      const result = await response.json();
      
      // Save current state for undo
      saveToHistory(content);
      
      setContent(prev => [...prev, result.data]);
      
    } catch (error) {
      const validationError = handleApiError(error);
      setErrors(prev => [...prev, validationError]);
    } finally {
      setLoading(false);
    }
  }, [content, saveToHistory]);

  // Delete content
  const deleteContent = useCallback(async (id: string) => {
    try {
      setSaving(prev => ({ ...prev, [id]: true }));
      
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete content');
      }

      // Save current state for undo
      saveToHistory(content);
      
      setContent(prev => prev.filter(item => item.id !== id));
      
      // Clear draft from storage
      if (enableDrafts) {
        clearDraftFromStorage(id);
      }

    } catch (error) {
      const validationError = handleApiError(error);
      setErrors(prev => [...prev, validationError]);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  }, [content, saveToHistory, enableDrafts]);

  // Upload file
  const uploadFile = useCallback(async (
    contentId: string, 
    file: File, 
    section = 'general'
  ): Promise<UploadResult | null> => {
    // Validate file
    const fileErrors = validateImageFile(file);
    if (fileErrors.length > 0) {
      setErrors(prev => [...prev.filter(e => e.field !== contentId), ...fileErrors]);
      return null;
    }

    try {
      setUploading(prev => ({ ...prev, [contentId]: true }));
      setUploadProgress(prev => ({ ...prev, [contentId]: 0 }));
      clearErrors(contentId);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        contentId,
        section,
        generateThumbnails: true
      }));

      // Simulate progress (replace with actual progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[contentId] || 0;
          if (current < 90) {
            return { ...prev, [contentId]: current + 10 };
          }
          return prev;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Upload failed');
      }

      const result: UploadResult = await response.json();
      
      setUploadProgress(prev => ({ ...prev, [contentId]: 100 }));
      
      // Update content with new file info
      await updateContent(contentId, {
        file_path: result.data?.primaryPath,
        content_value: result.data?.primaryUrl,
        file_name: result.data?.originalName,
        file_size: result.data?.size,
        file_type: result.data?.type
      });

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newPrev = { ...prev };
          delete newPrev[contentId];
          return newPrev;
        });
      }, 2000);

      return result;

    } catch (error) {
      const validationError = handleApiError(error);
      setErrors(prev => [...prev.filter(e => e.field !== contentId), validationError]);
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [contentId]: false }));
    }
  }, [updateContent]);

  // Gallery specific functions
  const updateGalleryImages = useCallback(async (images: GalleryImage[]) => {
    const galleryContent = content.find(item => item.content_key === 'gallery_images');
    if (galleryContent) {
      await updateContent(galleryContent.id, { content_json: images });
      setGalleryImages(images);
    }
  }, [content, updateContent]);

  const addGalleryImage = useCallback(async (imageData: Omit<GalleryImage, 'id'>) => {
    const newId = Math.max(...galleryImages.map(img => img.id), 0) + 1;
    const newImage: GalleryImage = { ...imageData, id: newId };
    const updatedImages = [...galleryImages, newImage];
    await updateGalleryImages(updatedImages);
  }, [galleryImages, updateGalleryImages]);

  const removeGalleryImage = useCallback(async (imageId: number) => {
    const imageToRemove = galleryImages.find(img => img.id === imageId);
    
    // If it's an uploaded image, delete from storage
    if (imageToRemove?.file_path) {
      try {
        await fetch(`/api/upload?path=${encodeURIComponent(imageToRemove.file_path)}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.warn('Failed to delete file from storage:', error);
      }
    }

    const updatedImages = galleryImages.filter(img => img.id !== imageId);
    await updateGalleryImages(updatedImages);
  }, [galleryImages, updateGalleryImages]);

  const uploadGalleryImage = useCallback(async (imageId: number, file: File) => {
    try {
      setUploading(prev => ({ ...prev, [`gallery-${imageId}`]: true }));
      clearErrors(`gallery-${imageId}`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        section: 'gallery',
        generateThumbnails: true
      }));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Upload failed');
      }

      const result: UploadResult = await response.json();
      
      const updatedImages = galleryImages.map(img => 
        img.id === imageId ? {
          ...img,
          src: result.data!.primaryUrl,
          file_path: result.data!.primaryPath,
          file_name: result.data!.originalName,
          file_size: result.data!.size,
          file_type: result.data!.type,
          isUploaded: true
        } : img
      );
      
      await updateGalleryImages(updatedImages);

    } catch (error) {
      const validationError = handleApiError(error);
      setErrors(prev => [...prev.filter(e => e.field !== `gallery-${imageId}`), validationError]);
    } finally {
      setUploading(prev => ({ ...prev, [`gallery-${imageId}`]: false }));
    }
  }, [galleryImages, updateGalleryImages]);

  // Validation function
  const validateField = useCallback((
    field: string, 
    value: any, 
    type: SiteContent['content_type'] = 'text'
  ): ValidationError[] => {
    switch (type) {
      case 'text':
        return validateTextContent(value, false).map(err => ({ ...err, field }));
      case 'image':
        if (typeof value === 'string') {
          return validateImageUrl(value).map(err => ({ ...err, field }));
        }
        return [];
      default:
        return [];
    }
  }, []);

  // Clear errors
  const clearErrors = useCallback((field?: string) => {
    setErrors(prev => field ? prev.filter(e => e.field !== field) : []);
  }, []);

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setContent(previousState);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setContent(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !enableDrafts) return;

    const interval = setInterval(() => {
      Object.entries(pendingChanges.current).forEach(([contentId, changes]) => {
        debouncedAutoSave(contentId, changes);
      });
      pendingChanges.current = {};
    }, autoSaveInterval);

    return () => {
      clearInterval(interval);
      // Clear all auto-save timeouts
      Object.values(autoSaveTimeouts.current).forEach(clearTimeout);
    };
  }, [autoSave, enableDrafts, autoSaveInterval, debouncedAutoSave]);

  // Load drafts on mount
  useEffect(() => {
    if (!enableDrafts) return;

    content.forEach(item => {
      const draft = loadDraftFromStorage(item.id);
      if (draft) {
        // Merge draft changes with current content
        setContent(prev => prev.map(prevItem => 
          prevItem.id === item.id ? { ...prevItem, ...draft } : prevItem
        ));
      }
    });
  }, [content.length, enableDrafts]); // Only run when content is first loaded

  return {
    // State
    content,
    galleryImages,
    loading,
    saving,
    uploading,
    uploadProgress,
    errors,
    
    // Actions
    fetchContent,
    updateContent,
    createContent,
    deleteContent,
    uploadFile,
    
    // Gallery specific
    updateGalleryImages,
    addGalleryImage,
    removeGalleryImage,
    uploadGalleryImage,
    
    // Utility
    clearErrors,
    validateField,
    
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo
  };
}