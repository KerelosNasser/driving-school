'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageCreationButton } from './PageCreationButton';
import { useEditMode } from '@/contexts/editModeContext';
import { FileText, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PageInfo {
  id: string;
  title: string;
  slug: string;
  template: string;
  createdAt: string;
  isVisible: boolean;
  status: 'draft' | 'published';
}

export function PageCreationExample() {
  const { isAdmin } = useEditMode();
  const [recentPages, setRecentPages] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setRecentPages([
      {
        id: '1',
        title: 'About Our Services',
        slug: 'about-services',
        template: 'service',
        createdAt: new Date().toISOString(),
        isVisible: true,
        status: 'published'
      },
      {
        id: '2',
        title: 'Contact Information',
        slug: 'contact-info',
        template: 'contact',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        isVisible: true,
        status: 'draft'
      }
    ]);
  }, []);

  const handlePageCreated = (pageId: string) => {
    toast.success('Page created successfully! Refreshing page list...');
    
    // In a real implementation, you would fetch the new page data from the API
    // For now, we'll just show a loading state
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.info('Page list refreshed');
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Page Management</CardTitle>
          <CardDescription>
            Admin access required to manage pages.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Creation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Page Management
            <PageCreationButton 
              onPageCreated={handlePageCreated}
              variant="default"
            />
          </CardTitle>
          <CardDescription>
            Create and manage website pages with automatic navigation integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Template-Based</h3>
              <p className="text-sm text-muted-foreground">
                Choose from pre-built page templates
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Auto Navigation</h3>
              <p className="text-sm text-muted-foreground">
                Automatically added to site navigation
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Eye className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground">
                Changes sync across all editors
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <PageCreationButton 
              variant="outline" 
              size="sm"
              onPageCreated={handlePageCreated}
            >
              Quick Create
            </PageCreationButton>
            <Button variant="ghost" size="sm" disabled>
              Import Pages
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Bulk Actions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Pages Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pages</CardTitle>
          <CardDescription>
            Recently created pages in your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading pages...</p>
            </div>
          ) : recentPages.length > 0 ? (
            <div className="space-y-3">
              {recentPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{page.title}</h4>
                      <Badge 
                        variant={page.status === 'published' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {page.status}
                      </Badge>
                      {page.isVisible && (
                        <Badge variant="outline" className="text-xs">
                          Visible
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>/{page.slug}</span>
                      <span>Template: {page.template}</span>
                      <span>Created: {formatDate(page.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No pages yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first page to get started.
              </p>
              <PageCreationButton 
                onPageCreated={handlePageCreated}
                size="sm"
              >
                Create First Page
              </PageCreationButton>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}