import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
 Save, Trash2, Plus, Image as ImageIcon, Type,
  Loader2, AlertCircle, CheckCircle, X, Eye, EyeOff,
  Maximize2,
} from 'lucide-react';

interface SiteContent {
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
  alt_text?: string;
  title?: string;
  description?: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  version?: number;
}

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  isUploaded?: boolean;
  file_path?: string;
}

interface UploadProgress {
  [key: string]: number;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function ContentManagementTab() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [newImageUrl, setNewImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [undoHistory, setUndoHistory] = useState<SiteContent[][]>([]);
  const [redoHistory, setRedoHistory] = useState<SiteContent[][]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-save functionality
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Record<string, Date>>({});

  useEffect(() => {
    fetchContent();
  }, [showDrafts, selectedSection]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      // Auto-save logic would go here
      // For now, just update last saved timestamps
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoSaveEnabled, content]);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSection !== 'all') params.append('section', selectedSection);
      if (showDrafts) params.append('drafts', 'true');

      const response = await fetch(`/api/content?${params}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (result.data) {
        setContent(result.data);
        
        // Extract gallery images
        const galleryContent = result.data.find((item: SiteContent) => item.content_key === 'gallery_images');
        if (galleryContent?.content_json) {
          setGalleryImages(galleryContent.content_json);
        }
        
        // Clear errors on successful fetch
        setErrors([]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setErrors([{ field: 'fetch', message: 'Failed to fetch content. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [showDrafts, selectedSection]);

  const validateContent = useCallback((item: SiteContent, value: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (item.content_type === 'text' && !value.trim()) {
      errors.push({ field: item.id, message: 'Text content cannot be empty' });
    }
    
    if (item.content_type === 'image' && value) {
      try {
        new URL(value);
      } catch {
        errors.push({ field: item.id, message: 'Invalid image URL format' });
      }
    }
    
    return errors;
  }, []);

  const updateContent = async (id: string, updates: Partial<SiteContent>) => {
    try {
      setSaving(prev => ({ ...prev, [id]: true }));
      setErrors(prev => prev.filter(err => err.field !== id));

      // Save current state for undo
      setUndoHistory(prev => [...prev, content]);
      setRedoHistory([]); // Clear redo history on new change

      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update content');
      }

      await fetchContent();
      setLastSaved(prev => ({ ...prev, [id]: new Date() }));
      
      // Show success notification (you'd typically use a toast library)
      console.log('Content updated successfully');
      
    } catch (error) {
      console.error('Error updating content:', error);
      setErrors(prev => [...prev, { 
        field: id, 
        message: error instanceof Error ? error.message : 'Failed to update content' 
      }]);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleFileUpload = async (contentId: string, file: File) => {
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, [contentId]: true }));
      setUploadProgress(prev => ({ ...prev, [contentId]: 0 }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        contentId,
        section: selectedSection,
        generateThumbnails: true
      }));

      // Simulate upload progress (in real implementation, you'd use XMLHttpRequest for progress)
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

      const result = await response.json();
      
      setUploadProgress(prev => ({ ...prev, [contentId]: 100 }));
      
      // Update content with new file path
      await updateContent(contentId, {
        file_path: result.data.primaryPath,
        content_value: result.data.primaryUrl,
        file_name: result.data.originalName,
        file_size: result.data.size,
        file_type: result.data.type
      });

      setTimeout(() => {
        setUploadProgress(prev => {
          const newPrev = { ...prev };
          delete newPrev[contentId];
          return newPrev;
        });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => [...prev, { 
        field: contentId, 
        message: error instanceof Error ? error.message : 'Upload failed' 
      }]);
    } finally {
      setUploading(prev => ({ ...prev, [contentId]: false }));
    }
  };

  const updateGalleryImages = async (images: GalleryImage[]) => {
    const galleryContent = content.find(item => item.content_key === 'gallery_images');
    if (galleryContent) {
      await updateContent(galleryContent.id, { content_json: images });
      setGalleryImages(images);
    }
  };

  const addGalleryImage = () => {
    if (!newImageUrl.trim()) {
      setErrors(prev => [...prev, { field: 'gallery', message: 'Please enter an image URL or upload a file' }]);
      return;
    }

    const newImage: GalleryImage = {
      id: Math.max(...galleryImages.map(img => img.id), 0) + 1,
      src: newImageUrl,
      alt: 'New gallery image',
      title: 'New Image',
      isUploaded: false
    };

    const updatedImages = [...galleryImages, newImage];
    updateGalleryImages(updatedImages);
    setNewImageUrl('');
    setErrors(prev => prev.filter(err => err.field !== 'gallery'));
  };

  const removeGalleryImage = async (imageId: number) => {
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
    updateGalleryImages(updatedImages);
  };

  const updateGalleryImage = (imageId: number, updates: Partial<GalleryImage>) => {
    const updatedImages = galleryImages.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    );
    updateGalleryImages(updatedImages);
  };

  const handleGalleryFileUpload = async (imageId: number, file: File) => {
    try {
      setUploading(prev => ({ ...prev, [`gallery-${imageId}`]: true }));

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

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      updateGalleryImage(imageId, {
        src: result.data.primaryUrl,
        file_path: result.data.primaryPath,
        isUploaded: true
      });

    } catch (error) {
      console.error('Gallery upload error:', error);
      setErrors(prev => [...prev, { 
        field: `gallery-${imageId}`, 
        message: 'Failed to upload image' 
      }]);
    } finally {
      setUploading(prev => ({ ...prev, [`gallery-${imageId}`]: false }));
    }
  };

  const getContentBySection = (section: string) => {
    let filtered = content.filter(item => 
      section === 'all' || item.page_section === section
    );

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.content_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.content_value?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.title?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => a.display_order - b.display_order);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const selectedIds = Array.from(bulkSelection);
    if (selectedIds.length === 0) return;

    try {
      if (action === 'delete') {
        // Handle bulk delete
        for (const id of selectedIds) {
          await fetch(`/api/content?id=${id}`, { method: 'DELETE' });
        }
      } else {
        // Handle bulk activate/deactivate
        const isActive = action === 'activate';
        for (const id of selectedIds) {
          await updateContent(id, { is_active: isActive });
        }
      }
      
      setBulkSelection(new Set());
      await fetchContent();
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  const undo = () => {
    if (undoHistory.length === 0) return;
    
    const previousState = undoHistory[undoHistory.length - 1];
    setRedoHistory(prev => [...prev, content]);
    setUndoHistory(prev => prev.slice(0, -1));
    setContent(previousState);
  };

  const redo = () => {
    if (redoHistory.length === 0) return;
    
    const nextState = redoHistory[redoHistory.length - 1];
    setUndoHistory(prev => [...prev, content]);
    setRedoHistory(prev => prev.slice(0, -1));
    setContent(nextState);
  };

  const ContentEditor = ({ item }: { item: SiteContent }) => {
    const [value, setValue] = useState(item.content_value || '');
    const [isActive, setIsActive] = useState(item.is_active);
    const [isDraft, setIsDraft] = useState(item.is_draft || false);
    const [altText, setAltText] = useState(item.alt_text || '');
    const [title, setTitle] = useState(item.title || '');
    const [description, setDescription] = useState(item.description || '');

    const hasUnsavedChanges = 
      value !== (item.content_value || '') ||
      isActive !== item.is_active ||
      isDraft !== (item.is_draft || false) ||
      altText !== (item.alt_text || '') ||
      title !== (item.title || '') ||
      description !== (item.description || '');

    const fieldErrors = errors.filter(err => err.field === item.id);
    const isUploading = uploading[item.id];
    const isSaving = saving[item.id];
    const uploadProgressValue = uploadProgress[item.id];

    const handleSave = () => {
      const validationErrors = validateContent(item, value);
      if (validationErrors.length > 0) {
        setErrors(prev => [...prev.filter(e => e.field !== item.id), ...validationErrors]);
        return;
      }

      updateContent(item.id, { 
        content_value: value,
        is_active: isActive,
        is_draft: isDraft,
        alt_text: altText,
        title: title,
        description: description
      });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(item.id, file);
      }
    };

    return (
      <Card className={`mb-4 ${hasUnsavedChanges ? 'border-orange-200' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={bulkSelection.has(item.id)}
                onChange={(e) => {
                  const newSelection = new Set(bulkSelection);
                  if (e.target.checked) {
                    newSelection.add(item.id);
                  } else {
                    newSelection.delete(item.id);
                  }
                  setBulkSelection(newSelection);
                }}
                className="rounded"
              />
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {item.content_type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Type className="h-4 w-4" />}
                  {item.content_key.replace(/_/g, ' ').toUpperCase()}
                  {hasUnsavedChanges && <Badge variant="outline" className="text-orange-600">Unsaved</Badge>}
                  {isDraft && <Badge variant="secondary">Draft</Badge>}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {item.content_type} • {item.page_section}
                  {lastSaved[item.id] && (
                    <span className="text-xs text-green-600">
                      Saved {lastSaved[item.id].toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor={`draft-${item.id}`} className="text-sm">Draft</Label>
                <Switch
                  id={`draft-${item.id}`}
                  checked={isDraft}
                  onCheckedChange={setIsDraft}
                  size="sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor={`active-${item.id}`} className="text-sm">Active</Label>
                <Switch
                  id={`active-${item.id}`}
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Error Display */}
            {fieldErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {fieldErrors.map(err => err.message).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Progress */}
            {isUploading && typeof uploadProgressValue === 'number' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading... {uploadProgressValue}%</span>
                </div>
                <Progress value={uploadProgressValue} className="w-full" />
              </div>
            )}

            {/* Image Content */}
            {item.content_type === 'image' && (
              <div className="space-y-4">
                {(value || item.file_url) && (
                  <div className="relative group">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={item.file_url || value}
                        alt={altText || item.content_key}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(item.file_url || value, '_blank')}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {item.file_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.file_name} • {item.file_size ? `${Math.round(item.file_size / 1024)}KB` : ''}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`url-${item.id}`}>Image URL</Label>
                    <Input
                      id={`url-${item.id}`}
                      placeholder="Enter image URL"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`file-${item.id}`}>Upload File</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`file-${item.id}`}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        ref={(el) => {fileInputRefs.current[item.id] = el}}
                        className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`alt-${item.id}`}>Alt Text</Label>
                    <Input
                      id={`alt-${item.id}`}
                      placeholder="Describe the image for accessibility"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`title-${item.id}`}>Title</Label>
                    <Input
                      id={`title-${item.id}`}
                      placeholder="Image title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`desc-${item.id}`}>Description</Label>
                  <Textarea
                    id={`desc-${item.id}`}
                    placeholder="Additional image description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Text Content */}
            {item.content_type === 'text' && (
              <div>
                <Label htmlFor={`text-${item.id}`}>Content</Label>
                <Textarea
                  id={`text-${item.id}`}
                  placeholder="Enter text content"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || isUploading || !hasUnsavedChanges}
                className="flex-1"
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Changes</>
                )}
              </Button>
              
              {hasUnsavedChanges && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setValue(item.content_value || '');
                    setIsActive(item.is_active);
                    setIsDraft(item.is_draft || false);
                    setAltText(item.alt_text || '');
                    setTitle(item.title || '');
                    setDescription(item.description || '');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <div>Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Manage images, text, and other content displayed on your website pages.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={undoHistory.length === 0}
              >
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={redoHistory.length === 0}
              >
                Redo
              </Button>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
                <Label>Auto-save</Label>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label>Section:</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="about">About</SelectItem>
                  <SelectItem value="gallery">Gallery</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch checked={showDrafts} onCheckedChange={setShowDrafts} />
              <Label>Show Drafts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch checked={previewMode} onCheckedChange={setPreviewMode} />
              <Label>Preview Mode</Label>
            </div>

            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />

            {bulkSelection.size > 0 && (
              <div className="flex items-center space-x-2 ml-auto">
                <Badge>{bulkSelection.size} selected</Badge>
                <Button size="sm" onClick={() => handleBulkAction('activate')}>
                  <Eye className="h-4 w-4 mr-1" />Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  <EyeOff className="h-4 w-4 mr-1" />Deactivate
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Errors */}
      {errors.filter(e => e.field === 'fetch').length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.find(e => e.field === 'fetch')?.message}
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="ml-2">
              Reload Page
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedSection === 'all' ? 'home' : selectedSection} onValueChange={setSelectedSection} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="home">Home Page</TabsTrigger>
          <TabsTrigger value="about">About Page</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Home Page Content</h3>
            <Badge variant="outline">{getContentBySection('home').length} items</Badge>
          </div>
          {getContentBySection('home').map(item => (
            <ContentEditor key={item.id} item={item} />
          ))}
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">About Page Content</h3>
            <Badge variant="outline">{getContentBySection('about').length} items</Badge>
          </div>
          {getContentBySection('about').map(item => (
            <ContentEditor key={item.id} item={item} />
          ))}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Gallery Management</h3>
            <Badge variant="outline">{galleryImages.length} images</Badge>
          </div>
          
          {/* Add new image */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Gallery Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errors.filter(e => e.field === 'gallery').length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.find(e => e.field === 'gallery')?.message}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <Button onClick={addGalleryImage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery images grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryImages.map(image => (
              <Card key={image.id}>
                <CardContent className="p-4">
                  <div className="relative group mb-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                      {uploading[`gallery-${image.id}`] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {image.isUploaded && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Title"
                      value={image.title}
                      onChange={(e) => updateGalleryImage(image.id, { title: e.target.value })}
                    />
                    <Input
                      placeholder="Alt text"
                      value={image.alt}
                      onChange={(e) => updateGalleryImage(image.id, { alt: e.target.value })}
                    />
                    
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleGalleryFileUpload(image.id, file);
                        }}
                        className="flex-1 text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(image.src, '_blank')}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeGalleryImage(image.id)}
                      className="w-full"
                      disabled={uploading[`gallery-${image.id}`]}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {galleryImages.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gallery images</h3>
                <p className="text-gray-500 mb-4">Add your first gallery image to get started</p>
                <Button onClick={() => setNewImageUrl('')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Image
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Global Settings</h3>
            <Badge variant="outline">{getContentBySection('global').length} items</Badge>
          </div>
          {getContentBySection('global').map(item => (
            <ContentEditor key={item.id} item={item} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Show all content when "all" is selected */}
      {selectedSection === 'all' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">All Content</h3>
            <Badge variant="outline">{content.length} total items</Badge>
          </div>
          
          {['home', 'about', 'gallery', 'global'].map(section => {
            const sectionContent = getContentBySection(section);
            if (sectionContent.length === 0) return null;
            
            return (
              <div key={section} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-medium capitalize">{section} Page</h4>
                  <Badge variant="outline">{sectionContent.length} items</Badge>
                </div>
                {sectionContent.map(item => (
                  <ContentEditor key={item.id} item={item} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer with statistics */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{content.length}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {content.filter(item => item.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {content.filter(item => item.is_draft).length}
              </div>
              <div className="text-sm text-gray-500">Drafts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {content.filter(item => item.content_type === 'image').length}
              </div>
              <div className="text-sm text-gray-500">Images</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}