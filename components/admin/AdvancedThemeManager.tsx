'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Copy, 
  Download, 
  Upload, 
  Save, 
  Trash2, 
  Edit3, 
  FileText, 
  Palette,
  Star,
  Tag,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  FolderOpen,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Theme, ThemeMetadata } from '@/lib/theme/types';
import { themeEngine } from '@/lib/theme/engine';

interface AdvancedThemeManagerProps {
  onThemeSelect?: (theme: Theme) => void;
  onThemeUpdate?: (theme: Theme) => void;
  currentTheme?: Theme;
}

interface ThemeListItem {
  theme: Theme;
  isDefault: boolean;
  isActive: boolean;
}

export function AdvancedThemeManager({
  onThemeSelect,
  onThemeUpdate,
  currentTheme
}: AdvancedThemeManagerProps) {
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    author: '',
    tags: '',
    baseTheme: 'default'
  });
  
  const [editForm, setEditForm] = useState<Partial<ThemeMetadata>>({});
  const [importData, setImportData] = useState('');
  const [duplicateForm, setDuplicateForm] = useState({
    name: '',
    description: ''
  });

  // Load themes on mount
  useEffect(() => {
    loadThemes();
  }, []);

  // Load all available themes
  const loadThemes = useCallback(async () => {
    try {
      setLoading(true);
      const availableThemes = await themeEngine.getAvailableThemesFromStorage();
      const defaultTheme = themeEngine.getDefaultTheme();
      
      const themeList: ThemeListItem[] = availableThemes.map(theme => ({
        theme,
        isDefault: theme.id === defaultTheme.id,
        isActive: currentTheme ? theme.id === currentTheme.id : false
      }));
      
      setThemes(themeList);
    } catch (error) {
      console.error('Failed to load themes:', error);
      toast.error('Failed to load themes');
    } finally {
      setLoading(false);
    }
  }, [currentTheme]);

  // Create new custom theme
  const handleCreateTheme = useCallback(async () => {
    try {
      if (!createForm.name.trim()) {
        toast.error('Theme name is required');
        return;
      }

      // Get base theme
      const baseTheme = createForm.baseTheme === 'default' 
        ? themeEngine.getDefaultTheme()
        : await themeEngine.loadTheme(createForm.baseTheme);

      // Create new theme based on base theme
      const newTheme: Theme = {
        ...baseTheme,
        id: `custom-${Date.now()}`,
        name: createForm.name.trim(),
        metadata: {
          name: createForm.name.trim(),
          description: createForm.description.trim() || 'Custom theme',
          author: createForm.author.trim() || 'Unknown',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      };

      // Save the new theme
      await themeEngine.saveTheme(newTheme);
      
      // Reset form and close dialog
      setCreateForm({
        name: '',
        description: '',
        author: '',
        tags: '',
        baseTheme: 'default'
      });
      setShowCreateDialog(false);
      
      // Reload themes and notify
      await loadThemes();
      toast.success(`Theme "${newTheme.name}" created successfully`);
      
      if (onThemeUpdate) {
        onThemeUpdate(newTheme);
      }
    } catch (error) {
      console.error('Failed to create theme:', error);
      toast.error('Failed to create theme');
    }
  }, [createForm, loadThemes, onThemeUpdate]);

  // Duplicate existing theme
  const handleDuplicateTheme = useCallback(async () => {
    try {
      if (!selectedTheme || !duplicateForm.name.trim()) {
        toast.error('Theme name is required');
        return;
      }

      const duplicatedTheme = await themeEngine.duplicateTheme(
        selectedTheme.id,
        duplicateForm.name.trim()
      );

      // Update description if provided
      if (duplicateForm.description.trim()) {
        duplicatedTheme.metadata.description = duplicateForm.description.trim();
        await themeEngine.saveTheme(duplicatedTheme);
      }

      // Reset form and close dialog
      setDuplicateForm({ name: '', description: '' });
      setShowDuplicateDialog(false);
      setSelectedTheme(null);
      
      // Reload themes and notify
      await loadThemes();
      toast.success(`Theme duplicated as "${duplicatedTheme.name}"`);
      
      if (onThemeUpdate) {
        onThemeUpdate(duplicatedTheme);
      }
    } catch (error) {
      console.error('Failed to duplicate theme:', error);
      toast.error('Failed to duplicate theme');
    }
  }, [selectedTheme, duplicateForm, loadThemes, onThemeUpdate]);

  // Edit theme metadata
  const handleEditTheme = useCallback(async () => {
    try {
      if (!selectedTheme || !editForm.name?.trim()) {
        toast.error('Theme name is required');
        return;
      }

      const updatedTheme: Theme = {
        ...selectedTheme,
        name: editForm.name.trim(),
        metadata: {
          ...selectedTheme.metadata,
          name: editForm.name.trim(),
          description: editForm.description?.trim() || selectedTheme.metadata.description,
          author: editForm.author?.trim() || selectedTheme.metadata.author,
          updatedAt: new Date().toISOString(),
          tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean) : selectedTheme.metadata.tags
        }
      };

      await themeEngine.saveTheme(updatedTheme);
      
      // Reset form and close dialog
      setEditForm({});
      setShowEditDialog(false);
      setSelectedTheme(null);
      
      // Reload themes and notify
      await loadThemes();
      toast.success(`Theme "${updatedTheme.name}" updated successfully`);
      
      if (onThemeUpdate) {
        onThemeUpdate(updatedTheme);
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
      toast.error('Failed to update theme');
    }
  }, [selectedTheme, editForm, loadThemes, onThemeUpdate]);

  // Export theme
  const handleExportTheme = useCallback(async (theme: Theme) => {
    try {
      const exportData = await themeEngine.exportTheme(theme.id);
      
      // Create download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${theme.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_theme.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Theme "${theme.name}" exported successfully`);
    } catch (error) {
      console.error('Failed to export theme:', error);
      toast.error('Failed to export theme');
    }
  }, []);

  // Import theme
  const handleImportTheme = useCallback(async () => {
    try {
      if (!importData.trim()) {
        toast.error('Import data is required');
        return;
      }

      const importedTheme = await themeEngine.importTheme(importData.trim());
      
      // Reset form and close dialog
      setImportData('');
      setShowImportDialog(false);
      
      // Reload themes and notify
      await loadThemes();
      toast.success(`Theme "${importedTheme.name}" imported successfully`);
      
      if (onThemeUpdate) {
        onThemeUpdate(importedTheme);
      }
    } catch (error) {
      console.error('Failed to import theme:', error);
      toast.error('Failed to import theme. Please check the format.');
    }
  }, [importData, loadThemes, onThemeUpdate]);

  // Delete theme
  const handleDeleteTheme = useCallback(async () => {
    try {
      if (!selectedTheme) return;

      await themeEngine.deleteTheme(selectedTheme.id);
      
      // Close dialog and reset selection
      setShowDeleteDialog(false);
      setSelectedTheme(null);
      
      // Reload themes and notify
      await loadThemes();
      toast.success(`Theme "${selectedTheme.name}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete theme:', error);
      toast.error('Failed to delete theme');
    }
  }, [selectedTheme, loadThemes]);

  // Handle theme selection
  const handleThemeSelect = useCallback((theme: Theme) => {
    if (onThemeSelect) {
      onThemeSelect(theme);
    }
  }, [onThemeSelect]);

  // Open edit dialog with theme data
  const openEditDialog = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
    setEditForm({
      name: theme.name,
      description: theme.metadata.description,
      author: theme.metadata.author,
      tags: theme.metadata.tags.join(', ')
    });
    setShowEditDialog(true);
  }, []);

  // Open duplicate dialog with theme data
  const openDuplicateDialog = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
    setDuplicateForm({
      name: `${theme.name} (Copy)`,
      description: theme.metadata.description
    });
    setShowDuplicateDialog(true);
  }, []);

  // Open delete dialog
  const openDeleteDialog = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
    setShowDeleteDialog(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600">Loading themes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Advanced Theme Manager</span>
              </CardTitle>
              <CardDescription>
                Create, duplicate, import, export, and manage custom themes
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Theme
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {themes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No themes found</p>
                <p className="text-sm">Create your first custom theme to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map(({ theme, isDefault, isActive }) => (
                  <Card 
                    key={theme.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isActive ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
                    }`}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{theme.name}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">
                            {theme.metadata.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          {isActive && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Theme Preview Colors */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex space-x-1">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: theme.colors.primary[500] }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: theme.colors.secondary[500] }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: theme.colors.accent[500] }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">v{theme.metadata.version}</span>
                      </div>
                      
                      {/* Theme Metadata */}
                      <div className="space-y-1 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{theme.metadata.author}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(theme.metadata.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {theme.metadata.tags.length > 0 && (
                          <div className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            <span className="truncate">{theme.metadata.tags.slice(0, 2).join(', ')}</span>
                            {theme.metadata.tags.length > 2 && <span>...</span>}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDuplicateDialog(theme);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportTheme(theme);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          
                          {!isDefault && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(theme);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(theme);
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant={isActive ? "secondary" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleThemeSelect(theme);
                          }}
                          className="text-xs"
                        >
                          {isActive ? 'Current' : 'Select'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Theme Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Theme</DialogTitle>
            <DialogDescription>
              Create a custom theme based on an existing theme
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme-name">Theme Name *</Label>
              <Input
                id="theme-name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Custom Theme"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme-description">Description</Label>
              <Textarea
                id="theme-description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A beautiful custom theme for..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme-author">Author</Label>
              <Input
                id="theme-author"
                value={createForm.author}
                onChange={(e) => setCreateForm(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Your Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme-tags">Tags (comma-separated)</Label>
              <Input
                id="theme-tags"
                value={createForm.tags}
                onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="custom, professional, blue"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base-theme">Base Theme</Label>
              <Select
                value={createForm.baseTheme}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, baseTheme: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Professional Theme</SelectItem>
                  {themes.filter(t => !t.isDefault).map(({ theme }) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTheme}>
              <Plus className="h-4 w-4 mr-2" />
              Create Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Theme Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Theme</DialogTitle>
            <DialogDescription>
              Create a copy of "{selectedTheme?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Theme Name *</Label>
              <Input
                id="duplicate-name"
                value={duplicateForm.name}
                onChange={(e) => setDuplicateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Theme Name (Copy)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duplicate-description">Description</Label>
              <Textarea
                id="duplicate-description"
                value={duplicateForm.description}
                onChange={(e) => setDuplicateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Updated description..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateTheme}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Theme Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Theme</DialogTitle>
            <DialogDescription>
              Update theme information and metadata
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Theme Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Theme Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Theme description..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-author">Author</Label>
              <Input
                id="edit-author"
                value={editForm.author || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Author Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editForm.tags || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTheme}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Theme Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Theme</DialogTitle>
            <DialogDescription>
              Import a theme from exported JSON data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Theme Data (JSON)</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste exported theme JSON data here..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Paste the JSON data from an exported theme file</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportTheme} disabled={!importData.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Theme Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Theme</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTheme?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-800">
              This will permanently delete the theme and all its data.
            </span>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTheme}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}