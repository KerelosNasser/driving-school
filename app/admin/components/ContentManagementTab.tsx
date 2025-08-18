'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { toast } from 'sonner';
import { Search, Plus, Filter, RefreshCw, Grid, List, ChevronDown, ChevronUp } from 'lucide-react';
import { SiteContent } from '@/lib/types';
import { useEnhancedContent } from '@/hooks/useContent';
import { ContentItem } from './content/ContentItem';
import { CreateContentDialog } from './content/CreateContentDialog';
import { BulkActionsToolbar } from './content/BulkOperations';
import { ContentFilters } from './content/ContentFilters';
import { ContentStats } from './content/ContentStats';

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'updated_at' | 'content_key' | 'page_section' | 'display_order';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  search: string;
  section: string;
  contentType: string;
  status: 'all' | 'active' | 'inactive' | 'draft';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export function EnhancedContentManagement() {
  const {
    content,
    loading,
    saving,
    uploading,
    error,
    totalCount,
    sections,
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    bulkDelete,
    bulkUpdate,
    duplicateContent,
    uploadFile
  } = useEnhancedContent();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    section: 'all',
    contentType: 'all',
    status: 'all',
    dateRange: 'all'
  });

  // Load content on mount and when filters change
  useEffect(() => {
    const loadContent = async () => {
      const params = {
        section: filters.section !== 'all' ? filters.section : undefined,
        contentType: filters.contentType !== 'all' ? filters.contentType : undefined,
        search: filters.search || undefined,
        isActive: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
        isDraft: filters.status === 'draft' ? true : undefined,
        sortBy: sortField,
        sortOrder,
        limit: 50
      };
      
      await fetchContent(params);
    };

    loadContent();
  }, [filters, sortField, sortOrder, fetchContent]);

  // Filtered and sorted content
  const filteredContent = useMemo(() => {
    let filtered = [...content];

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.updated_at) >= cutoff);
    }

    return filtered;
  }, [content, filters.dateRange]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedItems.size === filteredContent.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredContent.map(item => item.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      await bulkDelete(Array.from(selectedItems));
      setSelectedItems(new Set());
      toast.success(`Deleted ${selectedItems.size} items`);
    } catch (error) {
      toast.error('Failed to delete items');
    }
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedItems.size === 0) return;
    
    try {
      await bulkUpdate(Array.from(selectedItems), { is_active: isActive });
      setSelectedItems(new Set());
      toast.success(`Updated ${selectedItems.size} items`);
    } catch (error) {
      toast.error('Failed to update items');
    }
  };

  // Content actions
  const handleCreateContent = async (contentData: Partial<SiteContent>) => {
    try {
      await createContent(contentData);
      setIsCreateDialogOpen(false);
      toast.success('Content created successfully');
    } catch (error) {
      toast.error('Failed to create content');
    }
  };

  const handleUpdateContent = async (id: string, updates: Partial<SiteContent>) => {
    try {
      await updateContent(id, updates);
      toast.success('Content updated successfully');
    } catch (error) {
      toast.error('Failed to update content');
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      await deleteContent(id);
      toast.success('Content deleted successfully');
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const handleDuplicateContent = async (id: string) => {
    try {
      await duplicateContent(id);
      toast.success('Content duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate content');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
          <p className="text-muted-foreground">
            Manage your website content with advanced filtering and bulk operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </DialogTrigger>
            <CreateContentDialog
              sections={sections}
              createContent={handleCreateContent}
              onClose={() => setIsCreateDialogOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <ContentStats
        totalCount={totalCount}
        activeCount={content.filter(c => c.is_active).length}
        draftCount={content.filter(c => c.is_draft).length}
        sections={sections}
      />

      {/* Filters */}
      {showFilters && (
        <ContentFilters
          filters={filters}
          sections={sections}
          onFiltersChange={setFilters}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-80"
            />
          </div>

          {/* Sort */}
          <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-') as [SortField, SortOrder];
            setSortField(field);
            setSortOrder(order);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
              <SelectItem value="created_at-desc">Recently Created</SelectItem>
              <SelectItem value="content_key-asc">Key (A-Z)</SelectItem>
              <SelectItem value="page_section-asc">Section (A-Z)</SelectItem>
              <SelectItem value="display_order-asc">Display Order</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedItems.size}
              onBulkDelete={handleBulkDelete}
              onBulkActivate={() => handleBulkStatusChange(true)}
              onBulkDeactivate={() => handleBulkStatusChange(false)}
              onClearSelection={() => setSelectedItems(new Set())}
            />
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchContent()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredContent.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.section !== 'all' || filters.contentType !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first piece of content'}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredContent.map((item) => (
            <ContentItem
              key={item.id}
              content={item}
              viewMode={viewMode}
              isSelected={selectedItems.has(item.id)}
              onSelect={() => handleSelectItem(item.id)}
              onUpdate={(updates) => handleUpdateContent(item.id, updates)}
              onDelete={() => handleDeleteContent(item.id)}
              onDuplicate={() => handleDuplicateContent(item.id)}
              onUploadFile={uploadFile}
              saving={saving}
              uploading={uploading}
            />
          ))}
        </div>
      )}

      {/* Select All Checkbox (for list view) */}
      {viewMode === 'list' && filteredContent.length > 0 && (
        <div className="flex items-center gap-2 pt-4 border-t">
          <input
            type="checkbox"
            checked={selectedItems.size === filteredContent.length}
            onChange={handleSelectAll}
            className="rounded"
          />
          <Label className="text-sm text-muted-foreground">
            Select all ({filteredContent.length} items)
          </Label>
        </div>
      )}

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}