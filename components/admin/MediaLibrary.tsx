'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  Trash2, 
  Eye,
  Image as ImageIcon,
  File,
  Video,
  Music,
  FileText,
  Folder,
  FolderPlus,
  Copy,
  HardDrive,
  Edit,
  Save,
  X,
  Plus,
  RefreshCw,
  MoreVertical,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types for media files
interface MediaFile {
  id: string;
  original_name: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'other';
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number;
  alt_text?: string;
  caption?: string;
  description?: string;
  folder_id?: string;
  folder_name?: string;
  folder_path?: string;
  tags?: string[];
  content_key?: string;
  page_name?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  folder_path?: string;
  direct_file_count: number;
  total_file_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MediaLibraryProps {
  onFileSelect?: (file: MediaFile) => void;
  selectionMode?: boolean;
  allowedTypes?: string[];
  maxSelection?: number;
}

export function MediaLibrary({ 
  onFileSelect, 
  selectionMode = false, 
  allowedTypes = [],
  maxSelection = 1 
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');

  const [loading, setLoading] = useState({ files: false, folders: false, upload: false });
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from API
  const loadFiles = useCallback(async () => {
    setLoading(prev => ({ ...prev, files: true }));
    try {
      const params = new URLSearchParams({
        type: searchTerm ? 'search' : 'files',
        ...(currentFolder && { folder: currentFolder }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { fileTypes: filterType }),
        limit: '100'
      });

      const response = await fetch(`/api/admin/media?${params}`);
      if (response.ok) {
        const { data } = await response.json();
        setFiles(data || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load files');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load media files');
    } finally {
      setLoading(prev => ({ ...prev, files: false }));
    }
  }, [currentFolder, searchTerm, filterType]);

  const loadFolders = useCallback(async () => {
    setLoading(prev => ({ ...prev, folders: true }));
    try {
      const response = await fetch('/api/admin/media?type=folders');
      if (response.ok) {
        const { data } = await response.json();
        setFolders(data || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load folders');
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(prev => ({ ...prev, folders: false }));
    }
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Handle file selection
  const handleFileSelect = useCallback((file: MediaFile) => {
    if (selectionMode) {
      if (selectedFiles.has(file.id)) {
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.id);
          return newSet;
        });
      } else if (selectedFiles.size < maxSelection) {
        setSelectedFiles(prev => new Set([...prev, file.id]));
        if (onFileSelect) {
          onFileSelect(file);
        }
      } else {
        toast.error(`Maximum ${maxSelection} file(s) can be selected`);
      }
    } else {
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  }, [selectionMode, selectedFiles, maxSelection, onFileSelect]);

  // Get file type icon
  const getFileIcon = (file: MediaFile) => {
    switch (file.file_type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter files based on current criteria
  const filteredFiles = files.filter(file => {
    const matchesSearch = searchTerm === '' || 
      file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || file.file_type === filterType;
    const matchesFolder = currentFolder === '' || file.folder_id === currentFolder;
    const matchesAllowedTypes = allowedTypes.length === 0 || allowedTypes.includes(file.file_type);
    
    return matchesSearch && matchesType && matchesFolder && matchesAllowedTypes;
  });

  // Handle edit file
  const handleEditFile = (file: MediaFile) => {
    setEditingFile(file);
    setShowEditModal(true);
  };

  // Save file edits
  const saveFileEdits = async () => {
    if (!editingFile) return;

    const success = await updateFile(editingFile.id, {
      alt_text: editingFile.alt_text,
      caption: editingFile.caption,
      description: editingFile.description,
      tags: editingFile.tags
    });

    if (success) {
      setShowEditModal(false);
      setEditingFile(null);
    }
  };

  // File upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setLoading(prev => ({ ...prev, upload: true }));
    try {
      const formData = new FormData();
      Array.from(uploadedFiles).forEach(file => {
        formData.append('files', file);
      });
      
      if (currentFolder) {
        formData.append('folderId', currentFolder);
      }

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: string) => toast.error(error));
        }
        loadFiles(); // Reload files
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentFolder, loadFiles]);

  // Create new folder
  const createFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || undefined,
          parentId: currentFolder || undefined
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setNewFolderName('');
        setNewFolderDescription('');
        setShowNewFolder(false);
        loadFolders();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error('Failed to create folder');
    }
  }, [newFolderName, newFolderDescription, currentFolder, loadFolders]);

  // Update file metadata
  const updateFile = useCallback(async (fileId: string, updates: Partial<MediaFile>) => {
    try {
      const response = await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'file',
          id: fileId,
          data: updates
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        loadFiles();
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update file');
      }
    } catch (error) {
      console.error('Update file error:', error);
      toast.error('Failed to update file');
      return false;
    }
  }, [loadFiles]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/media?type=file&id=${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        loadFiles();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      toast.error('Failed to delete file');
    }
  }, [loadFiles]);

  // Copy file URL
  const copyFileUrl = useCallback(async (file: MediaFile) => {
    try {
      await navigator.clipboard.writeText(file.public_url);
      toast.success('File URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL'+error);
    }
  }, []);

  // Render file grid item
  const renderGridItem = (file: MediaFile) => {
    const isSelected = selectedFiles.has(file.id);
    
    return (
      <motion.div
        key={file.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative group border rounded-lg overflow-hidden cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
        }`}
        onClick={() => handleFileSelect(file)}
      >
        <div className="aspect-square relative">
          {file.file_type === 'image' ? (
            <Image 
              src={file.public_url} 
              alt={file.alt_text || file.original_name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              {getFileIcon(file)}
            </div>
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(file.public_url, '_blank');
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditFile(file);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  copyFileUrl(file);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleEditFile(file)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyFileUrl(file)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(file.public_url, '_blank')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteFile(file.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <h4 className="font-medium text-sm truncate">{file.original_name}</h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
            <Badge variant="outline" className="text-xs">
              {file.file_type}
            </Badge>
          </div>
          {file.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{file.description}</p>
          )}
        </div>
      </motion.div>
    );
  };

  // Render list item
  const renderListItem = (file: MediaFile) => {
    const isSelected = selectedFiles.has(file.id);
    
    return (
      <motion.div
        key={file.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-sm'
        }`}
        onClick={() => handleFileSelect(file)}
      >
        <div className="flex-shrink-0">
          {file.file_type === 'image' ? (
            <Image 
              src={file.public_url} 
              alt={file.alt_text || file.original_name}
              width={48}
              height={48}
              className="object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              {getFileIcon(file)}
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <h4 className="font-medium truncate">{file.original_name}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{formatFileSize(file.file_size)}</span>
            <span>{new Date(file.created_at).toLocaleDateString()}</span>
            <Badge variant="outline" className="text-xs">
              {file.file_type}
            </Badge>
          </div>
          {file.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{file.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              window.open(file.public_url, '_blank');
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleEditFile(file);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              copyFileUrl(file);
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              deleteFile(file.id);
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Media Library</span>
          </CardTitle>
          <CardDescription>
            Manage your images, videos, documents and other media files
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept={allowedTypes.length > 0 ? allowedTypes.map(type => {
                  switch(type) {
                    case 'image': return 'image/*';
                    case 'video': return 'video/*';
                    case 'audio': return 'audio/*';
                    case 'document': return '.pdf,.doc,.docx,.txt';
                    default: return '';
                  }
                }).join(',') : undefined}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading.upload}
                className="flex items-center space-x-2"
              >
                {loading.upload ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{loading.upload ? 'Uploading...' : 'Upload Files'}</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowNewFolder(true)}
                className="flex items-center space-x-2"
              >
                <FolderPlus className="h-4 w-4" />
                <span>New Folder</span>
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* View mode toggles */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* New folder input */}
          {showNewFolder && (
            <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="Enter folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                />
              </div>
              <div>
                <Label htmlFor="folder-description">Description (optional)</Label>
                <Textarea
                  id="folder-description"
                  placeholder="Enter folder description"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                  setNewFolderDescription('');
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">
                Files ({filteredFiles.length})
              </TabsTrigger>
              <TabsTrigger value="folders">
                Folders ({folders.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="space-y-4">
              {/* Filter tabs */}
              <div className="flex space-x-2 overflow-x-auto">
                {['all', 'image', 'video', 'audio', 'document'].map(type => (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType(type)}
                    className="whitespace-nowrap"
                  >
                    {type === 'all' ? 'All Files' : type.charAt(0).toUpperCase() + type.slice(1)}
                    <Badge variant="secondary" className="ml-2">
                      {type === 'all' ? filteredFiles.length : filteredFiles.filter(f => f.file_type === type).length}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Breadcrumb */}
              {currentFolder && (
                <div className="flex items-center space-x-2 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFolder('')}
                  >
                    All Files
                  </Button>
                  <span>/</span>
                  <span className="font-medium">
                    {folders.find(f => f.id === currentFolder)?.name || 'Unknown Folder'}
                  </span>
                </div>
              )}

              {/* Loading state */}
              {loading.files && (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}

              {/* Files grid/list */}
              <AnimatePresence>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredFiles.map(renderGridItem)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFiles.map(renderListItem)}
                  </div>
                )}
              </AnimatePresence>

              {filteredFiles.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files found</p>
                  <p className="text-sm">Upload some files to get started</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="folders" className="space-y-4">
              {loading.folders ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folders.map(folder => (
                    <Card 
                      key={folder.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setCurrentFolder(folder.id);
                        // Switch back to files tab
                        const filesTab = document.querySelector('[value="files"]') as HTMLElement;
                        filesTab?.click();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Folder className="h-8 w-8 text-blue-500" />
                          <div>
                            <h4 className="font-medium">{folder.name}</h4>
                            <p className="text-sm text-gray-500">{folder.direct_file_count} files</p>
                            {folder.description && (
                              <p className="text-xs text-gray-400 mt-1">{folder.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Selection info */}
          {selectionMode && selectedFiles.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {selectedFiles.size} file(s) selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit File Modal */}
      <AnimatePresence>
        {showEditModal && editingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Edit File Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* File Preview */}
                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
                  {editingFile.file_type === 'image' ? (
                    <Image
                      src={editingFile.public_url}
                      alt={editingFile.alt_text || editingFile.original_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      {getFileIcon(editingFile)}
                      <div className="ml-4">
                        <p className="font-medium">{editingFile.original_name}</p>
                        <p className="text-sm">{formatFileSize(editingFile.file_size)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">File Name:</span>
                    <p className="text-gray-600">{editingFile.original_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">File Size:</span>
                    <p className="text-gray-600">{formatFileSize(editingFile.file_size)}</p>
                  </div>
                  <div>
                    <span className="font-medium">File Type:</span>
                    <p className="text-gray-600">{editingFile.file_type}</p>
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>
                    <p className="text-gray-600">{new Date(editingFile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-alt">Alt Text</Label>
                    <Input
                      id="edit-alt"
                      value={editingFile.alt_text || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, alt_text: e.target.value })}
                      placeholder="Descriptive alt text for accessibility"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-caption">Caption</Label>
                    <Input
                      id="edit-caption"
                      value={editingFile.caption || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, caption: e.target.value })}
                      placeholder="Image caption"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingFile.description || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                      placeholder="Detailed description of the file"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-tags">Tags</Label>
                    <Input
                      id="edit-tags"
                      value={editingFile.tags?.join(', ') || ''}
                      onChange={(e) => setEditingFile({ 
                        ...editingFile, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                      })}
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={saveFileEdits} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}