'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Settings, 
  Wand2, 
  FolderOpen, 
  Plus, 
  Palette,
  Star,
  Layers,
  Download,
  Upload,
  Copy,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Theme } from '@/lib/theme/types';
import { AdvancedThemeManager } from './AdvancedThemeManager';
import { CustomThemeCreator } from './CustomThemeCreator';
import { themeImportExport } from '@/lib/theme/import-export';
import { themeDuplicator } from '@/lib/theme/duplication';

interface AdvancedThemeManagementProps {
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export function AdvancedThemeManagement({
  currentTheme,
  onThemeChange
}: AdvancedThemeManagementProps) {
  const [activeTab, setActiveTab] = useState('manager');
  const [showCreator, setShowCreator] = useState(false);
  const [showVariationsDialog, setShowVariationsDialog] = useState(false);
  const [selectedThemeForVariations, setSelectedThemeForVariations] = useState<Theme | null>(null);
  const [creatingVariations, setCreatingVariations] = useState(false);

  // Handle theme selection
  const handleThemeSelect = useCallback((theme: Theme) => {
    if (onThemeChange) {
      onThemeChange(theme);
    }
    toast.success(`Selected theme: ${theme.name}`);
  }, [onThemeChange]);

  // Handle theme creation
  const handleThemeCreated = useCallback((theme: Theme) => {
    setShowCreator(false);
    if (onThemeChange) {
      onThemeChange(theme);
    }
    toast.success(`Theme "${theme.name}" created and applied!`);
  }, [onThemeChange]);

  // Handle theme update
  const handleThemeUpdate = useCallback((theme: Theme) => {
    if (onThemeChange) {
      onThemeChange(theme);
    }
  }, [onThemeChange]);

  // Create theme backup
  const handleCreateBackup = useCallback(async () => {
    try {
      const result = await themeImportExport.createThemeBackup();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Backup creation failed');
      }

      // Download backup file
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `theme-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Theme backup created and downloaded successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create theme backup');
    }
  }, []);

  // Create seasonal variations
  const handleCreateSeasonalVariations = useCallback(async (theme: Theme) => {
    try {
      setCreatingVariations(true);
      setSelectedThemeForVariations(theme);
      
      const result = await themeDuplicator.createSeasonalVariations(theme.id);
      
      if (!result.success) {
        throw new Error(result.errors?.join(', ') || 'Failed to create variations');
      }

      toast.success(`Created ${result.themes?.length || 0} seasonal variations of "${theme.name}"`);
      setShowVariationsDialog(false);
    } catch (error) {
      console.error('Failed to create seasonal variations:', error);
      toast.error('Failed to create seasonal variations');
    } finally {
      setCreatingVariations(false);
      setSelectedThemeForVariations(null);
    }
  }, []);

  // Create accessibility variations
  const handleCreateAccessibilityVariations = useCallback(async (theme: Theme) => {
    try {
      setCreatingVariations(true);
      setSelectedThemeForVariations(theme);
      
      const result = await themeDuplicator.createAccessibilityVariations(theme.id);
      
      if (!result.success) {
        throw new Error(result.errors?.join(', ') || 'Failed to create variations');
      }

      toast.success(`Created ${result.themes?.length || 0} accessibility variations of "${theme.name}"`);
      setShowVariationsDialog(false);
    } catch (error) {
      console.error('Failed to create accessibility variations:', error);
      toast.error('Failed to create accessibility variations');
    } finally {
      setCreatingVariations(false);
      setSelectedThemeForVariations(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5" />
                <span>Advanced Theme Management</span>
              </CardTitle>
              <CardDescription>
                Comprehensive theme management with creation, duplication, and import/export
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateBackup}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Backup All</span>
              </Button>
              
              <Button
                size="sm"
                onClick={() => setShowCreator(true)}
                className="flex items-center space-x-2"
              >
                <Wand2 className="h-4 w-4" />
                <span>Create Theme</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manager" className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4" />
                <span>Theme Manager</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Advanced Tools</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Statistics</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Theme Manager Tab */}
            <TabsContent value="manager" className="space-y-4">
              <AdvancedThemeManager
                currentTheme={currentTheme}
                onThemeSelect={handleThemeSelect}
                onThemeUpdate={handleThemeUpdate}
              />
            </TabsContent>
            
            {/* Advanced Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Theme Variations */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Theme Variations</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Create seasonal and accessibility variations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => currentTheme && handleCreateSeasonalVariations(currentTheme)}
                        disabled={!currentTheme || creatingVariations}
                      >
                        <Palette className="h-3 w-3 mr-2" />
                        Seasonal Variations
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => currentTheme && handleCreateAccessibilityVariations(currentTheme)}
                        disabled={!currentTheme || creatingVariations}
                      >
                        <Star className="h-3 w-3 mr-2" />
                        Accessibility Variations
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Operations */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Copy className="h-4 w-4" />
                      <span>Bulk Operations</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Perform operations on multiple themes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleCreateBackup}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Export All Themes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        disabled
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Bulk Import (Coming Soon)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Analytics */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Star className="h-4 w-4" />
                      <span>Theme Analytics</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Analyze theme usage and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Current Theme:</span>
                          <span className="font-medium">{currentTheme?.name || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Version:</span>
                          <span className="font-medium">{currentTheme?.metadata.version || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span className="font-medium">
                            {currentTheme ? new Date(currentTheme.metadata.updatedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Import/Export Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import/Export Tools</CardTitle>
                  <CardDescription>
                    Advanced import and export functionality for themes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Export Options</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => currentTheme && handleCreateBackup()}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Current Theme
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleCreateBackup}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export All Themes
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Import Options</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          disabled
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Single Theme (Use Manager)
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          disabled
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Restore from Backup (Coming Soon)
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Current Theme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentTheme ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{currentTheme.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Author:</span>
                          <span className="font-medium">{currentTheme.metadata.author}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Version:</span>
                          <span className="font-medium">{currentTheme.metadata.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {currentTheme.metadata.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No theme selected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Theme Colors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentTheme ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: currentTheme.colors.primary[500] }}
                          />
                          <span className="text-sm">Primary</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: currentTheme.colors.secondary[500] }}
                          />
                          <span className="text-sm">Secondary</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: currentTheme.colors.accent[500] }}
                          />
                          <span className="text-sm">Accent</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No theme selected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setShowCreator(true)}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Create New Theme
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => currentTheme && handleCreateSeasonalVariations(currentTheme)}
                        disabled={!currentTheme}
                      >
                        <Sparkles className="h-3 w-3 mr-2" />
                        Create Variations
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleCreateBackup}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Export Backup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Custom Theme Creator Dialog */}
      <Dialog open={showCreator} onOpenChange={setShowCreator}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Theme</DialogTitle>
            <DialogDescription>
              Use the guided theme creator to build your custom theme
            </DialogDescription>
          </DialogHeader>
          
          <CustomThemeCreator
            baseTheme={currentTheme}
            onThemeCreated={handleThemeCreated}
            onCancel={() => setShowCreator(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Theme Variations Dialog */}
      <Dialog open={showVariationsDialog} onOpenChange={setShowVariationsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Theme Variations</DialogTitle>
            <DialogDescription>
              Create multiple variations of "{selectedThemeForVariations?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => selectedThemeForVariations && handleCreateSeasonalVariations(selectedThemeForVariations)}
                disabled={creatingVariations}
                className="justify-start"
              >
                <Palette className="h-4 w-4 mr-2" />
                Create Seasonal Variations (4 themes)
              </Button>
              
              <Button
                onClick={() => selectedThemeForVariations && handleCreateAccessibilityVariations(selectedThemeForVariations)}
                disabled={creatingVariations}
                className="justify-start"
              >
                <Star className="h-4 w-4 mr-2" />
                Create Accessibility Variations (2 themes)
              </Button>
            </div>
            
            {creatingVariations && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <span className="ml-2 text-sm text-gray-600">Creating variations...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}