// Modern PagesTab Component - Following 2025 best practices
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Layout,
  Settings,
  BarChart3
} from 'lucide-react';
import { usePages } from '@/hooks/usePages';
import { PagesList } from './pages/PagesList';
import { PageEditor } from './pages/PageEditor';
import { PageStats } from './pages/PageStats';
import { CreatePageDialog } from './pages/CreatePageDialog';
import { SEOAnalyticsDashboard } from './pages/SEOAnalyticsDashboard';
import type { Page } from '@/lib/types/pages';

export function PagesTab() {
  const { pages, loading, error, createPage, updatePage, deletePage } = usePages();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handlePageSelect = (page: Page) => {
    setSelectedPage(page);
    setView('editor');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedPage(null);
  };

  const handleCreatePage = async (pageData: any) => {
    try {
      const newPage = await createPage(pageData);
      setShowCreateDialog(false);
      // Optionally open the new page for editing
      setSelectedPage(newPage);
      setView('editor');
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = !searchQuery || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Pages</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'editor' && selectedPage) {
    return (
      <PageEditor
        page={selectedPage}
        onBack={handleBackToList}
        onUpdate={updatePage}
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
                <FileText className="h-8 w-8 mr-3 text-blue-600" />
                Pages
              </h1>
              <p className="text-gray-600 mt-1">Create and manage your website pages</p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          </div>

          {/* Quick Stats */}
          <PageStats pages={pages} />
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pages by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Results count */}
              <div className="flex items-center text-sm text-gray-500">
                {filteredPages.length} of {pages.length} pages
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Grid View
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                SEO Analytics
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-0">
            <PagesList
              pages={filteredPages}
              viewMode="grid"
              onPageSelect={handlePageSelect}
              onPageDelete={deletePage}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <PagesList
              pages={filteredPages}
              viewMode="list"
              onPageSelect={handlePageSelect}
              onPageDelete={deletePage}
            />
          </TabsContent>

          <TabsContent value="seo" className="mt-0">
            <SEOAnalyticsDashboard pages={pages} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Page Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Page analytics coming soon</p>
                  <p className="text-sm">Track page views, engagement, and performance</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Page Dialog */}
      <CreatePageDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreatePage={handleCreatePage}
      />
    </div>
  );
}