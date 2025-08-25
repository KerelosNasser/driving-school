// PagesList Component - Modern list/grid view for pages
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Edit3, 
  Eye, 
  ExternalLink, 
  MoreVertical,
  Trash2,
  Copy,
  Calendar,
  User,
  Globe,
  Home,
  Info,
  MessageSquare,
  Phone,
  Package,
  Star
} from 'lucide-react';
import { useState } from 'react';
import type { Page } from '@/lib/types/pages';

interface PagesListProps {
  pages: Page[];
  viewMode: 'grid' | 'list';
  onPageSelect: (page: Page) => void;
  onPageDelete: (id: string) => Promise<void>;
}

// System page icons mapping
const PAGE_ICONS: Record<string, any> = {
  'home': Home,
  'about': Info,
  'contact': Phone,
  'reviews': MessageSquare,
  'packages': Package,
  'book': Calendar,
  'default': FileText
};

const SYSTEM_PAGES = ['home', 'about', 'contact', 'reviews', 'packages', 'book'];

export function PagesList({ pages, viewMode, onPageSelect, onPageDelete }: PagesListProps) {
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const handleDeleteClick = (pageId: string) => {
    setDeletePageId(pageId);
  };

  const handleConfirmDelete = async () => {
    if (!deletePageId) return;
    
    setDeletingPageId(deletePageId);
    try {
      await onPageDelete(deletePageId);
    } catch (error) {
      console.error('Failed to delete page:', error);
    } finally {
      setDeletingPageId(null);
      setDeletePageId(null);
    }
  };

  const getPageIcon = (slug: string) => {
    return PAGE_ICONS[slug] || PAGE_ICONS.default;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyPageUrl = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const openPageInNewTab = (slug: string) => {
    window.open(`/${slug}`, '_blank');
  };

  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
          <p className="text-gray-600 mb-4">
            No pages match your current filters. Try adjusting your search or filter criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pages.map((page) => {
            const IconComponent = getPageIcon(page.slug);
            const isSystemPage = SYSTEM_PAGES.includes(page.slug);
            
            return (
              <Card 
                key={page.id} 
                className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300"
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {page.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">/{page.slug}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPageSelect(page)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {page.status === 'published' && (
                          <>
                            <DropdownMenuItem onClick={() => openPageInNewTab(page.slug)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyPageUrl(page.slug)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                          </>
                        )}
                        {!isSystemPage && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(page.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge variant="outline" className={getStatusColor(page.status)}>
                      {page.status === 'published' && <Globe className="h-3 w-3 mr-1" />}
                      {page.status}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {page.meta_data?.description || 'No description provided'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated {new Date(page.updated_at).toLocaleDateString()}</span>
                    <span>{page.content?.blocks?.length || 0} blocks</span>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onPageSelect(page)}
                        className="flex-1"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {page.status === 'published' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openPageInNewTab(page.slug)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePageId} onOpenChange={() => setDeletePageId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Page</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this page? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                disabled={!!deletingPageId}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingPageId ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // List view
  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-medium text-gray-900">Page</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Last Updated</th>
                <th className="text-left p-4 font-medium text-gray-900">Blocks</th>
                <th className="text-right p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const IconComponent = getPageIcon(page.slug);
                const isSystemPage = SYSTEM_PAGES.includes(page.slug);
                
                return (
                  <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{page.title}</div>
                          <div className="text-sm text-gray-500">/{page.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={getStatusColor(page.status)}>
                        {page.status === 'published' && <Globe className="h-3 w-3 mr-1" />}
                        {page.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {page.content?.blocks?.length || 0}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onPageSelect(page)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        {page.status === 'published' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => openPageInNewTab(page.slug)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {!isSystemPage && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteClick(page.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePageId} onOpenChange={() => setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={!!deletingPageId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingPageId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}