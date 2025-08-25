'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  Home,
  FileText,
  User,
  MessageSquare,
  Package,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Site content structure
interface SiteContentItem {
  id?: string;
  content_key: string;
  content_type: 'text' | 'json' | 'image' | 'boolean';
  content_value: string | null;
  content_json: any | null;
  page_section: string;
  is_active: boolean;
  is_draft: boolean;
  updated_at?: string;
}

// Page definitions for the actual website
const SITE_PAGES = [
  {
    id: 'home',
    name: 'Homepage',
    icon: Home,
    description: 'Main landing page content - hero, features, testimonials',
    sections: [
      'hero_title', 'hero_subtitle', 'hero_feature_1', 'hero_feature_2', 'hero_feature_3', 'hero_feature_4',
      'hero_testimonial_quote', 'hero_testimonial_author', 'hero_background_image',
      'features_title', 'features_subtitle', 'features_data',
      'gallery_title', 'gallery_subtitle', 'gallery_images',
      'instructor_title', 'instructor_name', 'instructor_bio_p1', 'instructor_bio_p2',
      'instructor_image', 'instructor_experience', 'instructor_rating', 
      'cta_title', 'cta_subtitle'
    ]
  },
  {
    id: 'about',
    name: 'About Page',
    icon: User,
    description: 'About page content - instructor bio, service areas',
    sections: [
      'about_page_title', 'about_page_subtitle', 'about_instructor_section_title',
      'about_instructor_name', 'about_instructor_bio_p1', 'about_instructor_image',
      'about_instructor_experience', 'about_service_areas_title', 'service_areas'
    ]
  },
  {
    id: 'packages',
    name: 'Packages',
    icon: Package,
    description: 'Driving lesson packages and pricing',
    sections: ['packages_title', 'packages_subtitle', 'packages_data']
  },
  {
    id: 'contact',
    name: 'Contact',
    icon: MessageSquare,
    description: 'Contact information and forms',
    sections: ['contact_title', 'contact_subtitle', 'contact_info']
  },
  {
    id: 'reviews',
    name: 'Reviews',
    icon: MessageSquare,
    description: 'Customer reviews and testimonials',
    sections: ['reviews_title', 'reviews_subtitle']
  }
];

export function RealContentManager() {
  const [activePage, setActivePage] = useState('home');
  const [contentItems, setContentItems] = useState<SiteContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SiteContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load content for the active page
  const loadPageContent = useCallback(async (page: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content?page=${page}`);
      if (response.ok) {
        const { data } = await response.json();
        setContentItems(data || []);
      } else {
        toast.error('Failed to load content');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Error loading content');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load content when page changes
  useEffect(() => {
    loadPageContent(activePage);
  }, [activePage, loadPageContent]);

  // Save or update content item
  const saveContentItem = async (item: Partial<SiteContentItem>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: item.content_key,
          value: item.content_type === 'json' ? item.content_json : item.content_value,
          type: item.content_type,
          page: activePage,
        }),
      });

      if (response.ok) {
        toast.success('Content saved successfully');
        loadPageContent(activePage);
        setIsEditing(false);
        setSelectedItem(null);
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Delete content item
  const deleteContentItem = async (key: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;

    try {
      const response = await fetch(`/api/admin/content?key=${key}&page=${activePage}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Content deleted');
        loadPageContent(activePage);
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  // Filter content based on search
  const filteredContent = contentItems.filter(item =>
    item.content_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.content_value && item.content_value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentPage = SITE_PAGES.find(p => p.id === activePage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Site Content Manager</h2>
          <p className="text-gray-600">Manage content across all pages of your website</p>
        </div>
        <Button onClick={() => loadPageContent(activePage)} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activePage} onValueChange={setActivePage}>
        <TabsList className="grid w-full grid-cols-5">
          {SITE_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <TabsTrigger key={page.id} value={page.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {page.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SITE_PAGES.map((page) => (
          <TabsContent key={page.id} value={page.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <page.icon className="h-5 w-5" />
                  {page.name} Content
                </CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedItem({
                        content_key: '',
                        content_type: 'text',
                        content_value: '',
                        content_json: null,
                        page_section: page.id,
                        is_active: true,
                        is_draft: false,
                      });
                      setIsEditing(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContent.length > 0 ? (
                      filteredContent.map((item) => (
                        <div
                          key={item.content_key}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">{item.content_type}</Badge>
                              <span className="font-medium">{item.content_key}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsEditing(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteContentItem(item.content_key)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            {item.content_type === 'text' && (
                              <p className="truncate">{item.content_value || 'No content'}</p>
                            )}
                            {item.content_type === 'json' && (
                              <p className="truncate">JSON: {JSON.stringify(item.content_json)?.substring(0, 100)}...</p>
                            )}
                            {item.content_type === 'image' && (
                              <p className="truncate">Image: {item.content_value || 'No image'}</p>
                            )}
                          </div>

                          {item.updated_at && (
                            <div className="text-xs text-gray-500 mt-2">
                              Last updated: {new Date(item.updated_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No content found for this page</p>
                        <p className="text-sm">Add some content to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {currentPage && (
              <Card>
                <CardHeader>
                  <CardTitle>Content Keys for {currentPage.name}</CardTitle>
                  <CardDescription>
                    These are the content keys used in your {currentPage.name.toLowerCase()}. Click to create missing content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {currentPage.sections.map((section) => {
                      const exists = contentItems.some(item => item.content_key === section);
                      return (
                        <Button
                          key={section}
                          variant={exists ? "outline" : "ghost"}
                          size="sm"
                          className={`justify-start ${!exists ? 'text-red-600 border-red-200' : ''}`}
                          onClick={() => {
                            if (!exists) {
                              setSelectedItem({
                                content_key: section,
                                content_type: 'text',
                                content_value: '',
                                content_json: null,
                                page_section: page.id,
                                is_active: true,
                                is_draft: false,
                              });
                              setIsEditing(true);
                            }
                          }}
                        >
                          {exists ? '✓' : '+'} {section}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Content Dialog */}
      {isEditing && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedItem.id ? 'Edit Content' : 'Add Content'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>Content Key</Label>
                <Input
                  value={selectedItem.content_key}
                  onChange={(e) => setSelectedItem({ ...selectedItem, content_key: e.target.value })}
                  placeholder="e.g., hero_title"
                />
              </div>

              <div>
                <Label>Content Type</Label>
                <select
                  value={selectedItem.content_type}
                  onChange={(e) => setSelectedItem({ 
                    ...selectedItem, 
                    content_type: e.target.value as 'text' | 'json' | 'image' | 'boolean'
                  })}
                  className="w-full p-2 border rounded"
                >
                  <option value="text">Text</option>
                  <option value="json">JSON/Object</option>
                  <option value="image">Image URL</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>

              {selectedItem.content_type === 'text' && (
                <div>
                  <Label>Content Value</Label>
                  <Textarea
                    value={selectedItem.content_value || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, content_value: e.target.value })}
                    placeholder="Enter your content..."
                    rows={6}
                  />
                </div>
              )}

              {selectedItem.content_type === 'json' && (
                <div>
                  <Label>JSON Content</Label>
                  <Textarea
                    value={selectedItem.content_json ? JSON.stringify(selectedItem.content_json, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSelectedItem({ ...selectedItem, content_json: parsed });
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='{"key": "value"}'
                    rows={8}
                    className="font-mono"
                  />
                </div>
              )}

              {selectedItem.content_type === 'image' && (
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={selectedItem.content_value || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, content_value: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItem.is_active}
                    onChange={(e) => setSelectedItem({ ...selectedItem, is_active: e.target.checked })}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItem.is_draft}
                    onChange={(e) => setSelectedItem({ ...selectedItem, is_draft: e.target.checked })}
                  />
                  Draft
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => saveContentItem(selectedItem)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedItem(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}