// PageEditor Component - WordPress-like page editor with drag-and-drop
'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings, 
  Layout,
  Palette,
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  Type,
  Image,
  Columns,
  Megaphone,
  Edit,
  ExternalLink,
  Search
} from 'lucide-react';
import { usePageEditor } from '@/hooks/usePages';
import { useComponentTemplates } from '@/hooks/usePages';
import { BlockEditor } from './BlockEditor';
import { BlockPropertiesEditor } from './BlockPropertiesEditor';
import { SEOManager } from './SEOManager';
import type { Page, UpdatePageRequest, PageBlock } from '@/lib/types/pages';
import { toast } from 'sonner';

interface PageEditorProps {
  page: Page;
  onBack: () => void;
  onUpdate: (id: string, updates: UpdatePageRequest) => Promise<Page>;
}

// Block type icons
const BLOCK_ICONS: Record<string, any> = {
  hero: Layout,
  text: Type,
  image: Image,
  columns: Columns,
  cta: Megaphone,
  default: Layout
};

export function PageEditor({ page: initialPage, onBack, onUpdate }: PageEditorProps) {
  const {
    page,
    setPage,
    selectedBlockId,
    setSelectedBlockId,
    previewMode,
    setPreviewMode,
    hasChanges,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    resetChanges
  } = usePageEditor(initialPage);
  
  const { templates, groupedTemplates } = useComponentTemplates();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  
  // Update page metadata
  const updatePageMetadata = useCallback((field: string, value: any) => {
    if (!page) return;
    
    if (field.startsWith('meta_data.')) {
      const metaField = field.replace('meta_data.', '');
      setPage(prev => prev ? {
        ...prev,
        meta_data: {
          ...prev.meta_data,
          [metaField]: value
        }
      } : null);
    } else if (field.startsWith('settings.')) {
      const settingField = field.replace('settings.', '');
      setPage(prev => prev ? {
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: value
        }
      } : null);
    } else {
      setPage(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [page, setPage]);
  
  // Handle drag end
  const onDragEnd = useCallback((result: any) => {
    if (!result.destination || !page) return;
    
    const { source, destination } = result;
    
    if (source.index === destination.index) return;
    
    moveBlock(source.index, destination.index);
  }, [moveBlock, page]);
  
  // Add new block from template
  const addBlockFromTemplate = useCallback((template: any) => {
    const newBlock: PageBlock = {
      id: `block-${Date.now()}`,
      type: template.template.type,
      props: { ...template.template.props },
      styles: { ...template.template.styles }
    };
    
    addBlock(newBlock);
    setSelectedBlockId(newBlock.id);
    setShowComponentLibrary(false);
    toast.success(`${template.name} added`);
  }, [addBlock, setSelectedBlockId]);
  
  // Save page
  const handleSave = async () => {
    if (!page) return;
    
    setIsSaving(true);
    try {
      await onUpdate(page.id, {
        title: page.title,
        slug: page.slug,
        content: page.content,
        meta_data: page.meta_data,
        settings: page.settings,
        status: page.status
      });
      resetChanges();
      toast.success('Page saved successfully');
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Preview page
  const handlePreview = () => {
    if (page?.status === 'published') {
      window.open(`/${page.slug}`, '_blank');
    } else {
      toast.info('Page must be published to preview');
    }
  };
  
  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'max-w-sm';
      case 'tablet': return 'max-w-2xl';
      default: return 'w-full';
    }
  };
  
  const getBlockIcon = (type: string) => {
    return BLOCK_ICONS[type] || BLOCK_ICONS.default;
  };
  
  if (!page) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Editor Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pages
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{page.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">/{page.slug}</span>
                <Badge variant="outline" className={
                  page.status === 'published' 
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : page.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }>
                  {page.status}
                </Badge>
                {hasChanges && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                    Unsaved
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Preview Device Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className="px-2"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className="px-2"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className="px-2"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content" className="text-xs">
                  <Layout className="h-3 w-3 mr-1" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="design" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="seo" className="text-xs">
                  <Search className="h-3 w-3 mr-1" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {/* Add Block Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Block
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowComponentLibrary(!showComponentLibrary)}
                        >
                          Library
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {showComponentLibrary && (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {Object.entries(groupedTemplates).map(([category, templates]) => (
                            <div key={category}>
                              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                                {category}
                              </h4>
                              <div className="grid grid-cols-1 gap-2">
                                {templates.map((template) => {
                                  const IconComponent = getBlockIcon(template.template.type);
                                  return (
                                    <Button
                                      key={template.id}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addBlockFromTemplate(template)}
                                      className="justify-start h-auto p-3"
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                          <IconComponent className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                          <div className="text-xs font-medium">{template.name}</div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {template.description}
                                          </div>
                                        </div>
                                      </div>
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Block Properties */}
                  {selectedBlockId && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Block Properties
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <BlockPropertiesEditor
                          block={page.content?.blocks?.find(b => b.id === selectedBlockId)}
                          onUpdate={(updates) => updateBlock(selectedBlockId, updates)}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Page Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs">Layout</Label>
                        <Select 
                          value={page.settings.layout} 
                          onValueChange={(value) => updatePageMetadata('settings.layout', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="full-width">Full Width</SelectItem>
                            <SelectItem value="narrow">Narrow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Show Header</Label>
                          <Switch
                            checked={page.settings.show_header}
                            onCheckedChange={(checked) => updatePageMetadata('settings.show_header', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Show Footer</Label>
                          <Switch
                            checked={page.settings.show_footer}
                            onCheckedChange={(checked) => updatePageMetadata('settings.show_footer', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="pr-2">
                  <SEOManager 
                    page={page} 
                    onUpdate={(updates) => {
                      if (updates.meta_data) {
                        setPage(prev => prev ? { ...prev, meta_data: { ...prev.meta_data, ...updates.meta_data } } : null);
                      }
                      if (updates.slug && typeof updates.slug === 'string') {
                        setPage(prev => prev ? { ...prev, slug: updates.slug as string } : null);
                      }
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {/* Basic Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Basic Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      <div>
                        <Label className="text-xs">Page Title</Label>
                        <Input
                          value={page.title}
                          onChange={(e) => updatePageMetadata('title', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">URL Slug</Label>
                        <Input
                          value={page.slug}
                          onChange={(e) => updatePageMetadata('slug', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Status</Label>
                        <Select 
                          value={page.status} 
                          onValueChange={(value) => updatePageMetadata('status', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Advanced Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Allow Comments</Label>
                          <Switch
                            checked={page.settings.allow_comments || false}
                            onCheckedChange={(checked) => updatePageMetadata('settings.allow_comments', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Featured Page</Label>
                          <Switch
                            checked={page.settings.featured || false}
                            onCheckedChange={(checked) => updatePageMetadata('settings.featured', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 bg-gray-100 p-6 overflow-auto">
          <div className={`mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${getPreviewWidth()}`}>
            <div className="p-8">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="page-blocks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4 min-h-[400px]"
                    >
                      {page.content?.blocks && page.content.blocks.length > 0 ? (
                        page.content?.blocks.map((block, index) => (
                          <BlockEditor
                            key={block.id}
                            block={block}
                            index={index}
                            isSelected={selectedBlockId === block.id}
                            onSelect={() => setSelectedBlockId(block.id)}
                            onUpdate={(updates) => updateBlock(block.id, updates)}
                            onRemove={() => {
                              removeBlock(block.id);
                              if (selectedBlockId === block.id) {
                                setSelectedBlockId(null);
                              }
                            }}
                            onDuplicate={() => {
                              const duplicatedBlock = {
                                ...block,
                                id: `block-${Date.now()}`
                              };
                              addBlock(duplicatedBlock, index + 1);
                            }}
                          />
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="text-center text-gray-500">
                            <Layout className="h-12 w-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Start Building Your Page</h3>
                            <p className="text-sm mb-4">
                              Add content blocks from the sidebar to start building your page.
                            </p>
                            <Button 
                              onClick={() => setShowComponentLibrary(true)}
                              variant="outline"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Block
                            </Button>
                          </div>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}