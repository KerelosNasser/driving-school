// CreatePageDialog Component - Modal for creating new pages
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { CreatePageRequest } from '@/lib/types/pages';

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePage: (pageData: CreatePageRequest) => Promise<void>;
}

export function CreatePageDialog({ open, onOpenChange, onCreatePage }: CreatePageDialogProps) {
  const [formData, setFormData] = useState<CreatePageRequest>({
    title: '',
    slug: '',
    status: 'draft'
  });
  const [isCreating, setIsCreating] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Page title is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Page slug is required');
      return;
    }

    setIsCreating(true);
    try {
      await onCreatePage(formData);
      setFormData({
        title: '',
        slug: '',
        status: 'draft'
      });
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      slug: '',
      status: 'draft'
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
          <DialogDescription>
            Create a new page for your website. You can edit the content after creation.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter page title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">your-site.com/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="page-url"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              URL-friendly version of the title (auto-generated)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Meta Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.meta_data?.description || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                meta_data: {
                  ...prev.meta_data,
                  description: e.target.value,
                  keywords: prev.meta_data?.keywords || ''
                }
              }))}
              placeholder="Brief description of the page..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              This will appear in search results (recommended: 150-160 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.title.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
