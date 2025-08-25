// DirectPagesTab - WordPress-like direct file editing system
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Search,
  Layout,
  Eye,
  Edit3,
  ExternalLink,
  Code,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { getDirectPages, createNewPage, DirectPageInfo } from '@/lib/directPageEditor';
import { DirectPageEditor } from './pages/DirectPageEditor';

export function DirectPagesTab() {
  const [pages, setPages] = useState<DirectPageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<DirectPageInfo | null>(null);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPageData, setNewPageData] = useState({
    slug: '',
    title: '',
    template: 'basic'
  });
  const [creating, setCreating] = useState(false);

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      // Get direct pages from file system
      const directPages = getDirectPages();
      setPages(directPages);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = (page: DirectPageInfo) => {
    setSelectedPage(page);
    setView('editor');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedPage(null);
    loadPages(); // Refresh the list
  };

  const handleCreatePage = async () => {
    if (!newPageData.slug || !newPageData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const success = await createNewPage(newPageData.slug, newPageData.title, newPageData.template);
      
      if (success) {
        toast.success('Page created successfully');
        setShowCreateDialog(false);
        setNewPageData({ slug: '', title: '', template: 'basic' });
        await loadPages();
        
        // Open the new page for editing
        const newPage = pages.find(p => p.slug === newPageData.slug);
        if (newPage) {
          handlePageSelect(newPage);
        }
      } else {
        throw new Error('Failed to create page');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  const openPage = (slug: string) => {
    window.open(`/${slug}`, '_blank');
  };

  const openPageWithEdit = (slug: string) => {
    window.open(`/${slug}?edit=1`, '_blank');
  };

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading pages...</p>
        </div>
      </div>
    );
  }

  if (view === 'editor' && selectedPage) {
    return (
      <DirectPageEditor
        page={selectedPage}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Zap className="h-8 w-8 mr-3 text-blue-600" />
                Direct Pages
              </h1>
              <p className="text-gray-600 mt-1">
                WordPress-like direct file editing - Changes are immediately live
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Direct File Editing</h4>
                <p className="text-blue-700 text-sm mt-1">
                  This system directly edits your Next.js page files. All changes are immediately reflected on your live website without database storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pages by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center text-sm text-gray-500">
                {filteredPages.length} of {pages.length} pages
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPages.map((page) => (
            <Card 
              key={page.slug}
              className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">/{page.slug}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Badge 
                    variant="outline" 
                    className={
                      page.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Live File
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  File: {page.filePath}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Modified {new Date(page.lastModified).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(page.lastModified).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handlePageSelect(page)}
                    className="flex-1"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => openPage(page.slug)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => openPageWithEdit(page.slug)}
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPages.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'No pages match your search criteria.' : 'Create your first page to get started.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Page
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Page Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a new Next.js page file with editable content sections.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Page Title</label>
              <Input
                value={newPageData.title}
                onChange={(e) => setNewPageData(prev => ({ 
                  ...prev, 
                  title: e.target.value,
                  slug: e.target.value.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim()
                }))}
                placeholder="Enter page title..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL Slug</label>
              <Input
                value={newPageData.slug}
                onChange={(e) => setNewPageData(prev => ({ 
                  ...prev, 
                  slug: e.target.value 
                }))}
                placeholder="page-url"
              />
              <p className="text-xs text-gray-500">
                Will create: app/{newPageData.slug}/page.tsx
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select
                value={newPageData.template}
                onValueChange={(value) => setNewPageData(prev => ({ ...prev, template: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Page</SelectItem>
                  <SelectItem value="hero">Hero Page</SelectItem>
                  <SelectItem value="landing">Landing Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePage}
              disabled={creating || !newPageData.title || !newPageData.slug}
            >
              {creating ? 'Creating...' : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}