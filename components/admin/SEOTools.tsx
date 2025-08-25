'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Download,
  RefreshCw,
  Save,
  Plus,
  Edit,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface SEOPage {
  id?: string;
  page_url: string;
  title: string;
  description: string;
  keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  canonical_url?: string;
  robots: string;
  schema_markup?: any;
  is_active: boolean;
}

interface GlobalSEOSettings {
  site_name: string;
  default_title: string;
  default_description: string;
  default_keywords: string;
  default_og_image: string;
  google_analytics_id?: string;
  google_search_console_id?: string;
  facebook_app_id?: string;
  twitter_handle?: string;
  robots_txt: string;
}

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
  included: boolean;
}

const SITE_PAGES = [
  { url: '/', name: 'Homepage', description: 'Main landing page' },
  { url: '/packages', name: 'Packages', description: 'Driving lesson packages' },
  { url: '/reviews', name: 'Reviews', description: 'Customer reviews and testimonials' },
  { url: '/contact', name: 'Contact', description: 'Contact information and booking' },
  { url: '/about', name: 'About', description: 'About the driving school' },
  { url: '/book', name: 'Booking', description: 'Online booking system' }
];

export function SEOTools() {
  const [pages, setPages] = useState<SEOPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<SEOPage | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSEOSettings | null>(null);
  const [sitemap, setSitemap] = useState<SitemapEntry[]>([]);
  const [loading, setLoading] = useState({ pages: false, global: false, save: false, sitemap: false });
  const [activeTab, setActiveTab] = useState('pages');
  const [editingPage, setEditingPage] = useState<SEOPage | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);

  // Load SEO data
  const loadPages = useCallback(async () => {
    setLoading(prev => ({ ...prev, pages: true }));
    try {
      const response = await fetch('/api/admin/seo?type=pages');
      if (response.ok) {
        const { data } = await response.json();
        setPages(data || []);
        if (data && data.length > 0 && !selectedPage) {
          setSelectedPage(data[0]);
        }
      } else {
        toast.error('Failed to load page SEO settings');
      }
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Error loading SEO pages');
    } finally {
      setLoading(prev => ({ ...prev, pages: false }));
    }
  }, [selectedPage]);

  const loadGlobalSettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, global: true }));
    try {
      const response = await fetch('/api/admin/seo?type=global');
      if (response.ok) {
        const { data } = await response.json();
        setGlobalSettings(data);
      } else {
        toast.error('Failed to load global SEO settings');
      }
    } catch (error) {
      console.error('Error loading global settings:', error);
      toast.error('Error loading global SEO settings');
    } finally {
      setLoading(prev => ({ ...prev, global: false }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadPages();
    loadGlobalSettings();
    
    // Generate sitemap entries from pages
    const sitemapEntries: SitemapEntry[] = SITE_PAGES.map(page => ({
      url: page.url,
      lastModified: new Date().toISOString(),
      changeFrequency: page.url === '/' ? 'daily' : page.url === '/reviews' ? 'daily' : 'weekly',
      priority: page.url === '/' ? 1.0 : page.url === '/packages' ? 0.9 : 0.7,
      included: true
    }));
    setSitemap(sitemapEntries);
  }, [loadPages, loadGlobalSettings]);

  // Save page SEO settings
  const savePageSEO = useCallback(async (pageData: SEOPage) => {
    setLoading(prev => ({ ...prev, save: true }));
    try {
      const response = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page', data: pageData }),
      });

      if (response.ok) {
        toast.success('Page SEO settings saved successfully');
        loadPages();
        setEditingPage(null);
        setIsAddingPage(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save SEO settings');
      }
    } catch (error) {
      console.error('Error saving page SEO:', error);
      toast.error('Failed to save page SEO settings');
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  }, [loadPages]);

  // Save global SEO settings
  const saveGlobalSEO = useCallback(async (settings: GlobalSEOSettings) => {
    setLoading(prev => ({ ...prev, save: true }));
    try {
      const response = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'global', data: settings }),
      });

      if (response.ok) {
        toast.success('Global SEO settings saved successfully');
        setGlobalSettings(settings);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save global SEO settings');
      }
    } catch (error) {
      console.error('Error saving global SEO:', error);
      toast.error('Failed to save global SEO settings');
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  }, []);

  // Generate sitemap
  const generateSitemap = useCallback(async () => {
    setLoading(prev => ({ ...prev, sitemap: true }));
    try {
      const includedEntries = sitemap.filter(entry => entry.included);
      const baseUrl = globalSettings?.site_name ? 'https://egdrivingschool.com' : 'https://localhost:3000';
      
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${includedEntries.map(entry => `  <url>
    <loc>${baseUrl}${entry.url}</loc>
    <lastmod>${entry.lastModified.split('T')[0]}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      const blob = new Blob([sitemapXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Sitemap generated and downloaded');
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast.error('Failed to generate sitemap');
    } finally {
      setLoading(prev => ({ ...prev, sitemap: false }));
    }
  }, [sitemap, globalSettings]);

  // SEO Score calculation
  const calculateSEOScore = (page: SEOPage): number => {
    let score = 0;
    
    // Title optimization (30 points)
    if (page.title) {
      score += 15;
      if (page.title.length >= 30 && page.title.length <= 60) score += 15;
    }
    
    // Description optimization (25 points)
    if (page.description) {
      score += 10;
      if (page.description.length >= 120 && page.description.length <= 160) score += 15;
    }
    
    // Keywords (10 points)
    if (page.keywords && page.keywords.length > 0) score += 10;
    
    // Open Graph (15 points)
    if (page.og_title) score += 5;
    if (page.og_description) score += 5;
    if (page.og_image) score += 5;
    
    // Twitter Cards (10 points)
    if (page.twitter_title) score += 5;
    if (page.twitter_description) score += 5;
    
    // Technical SEO (10 points)
    if (page.canonical_url) score += 5;
    if (page.robots === 'index, follow') score += 5;
    
    return Math.min(score, 100);
  };

  const getScoreStatus = (score: number): 'optimized' | 'needs-work' | 'critical' => {
    if (score >= 80) return 'optimized';
    if (score >= 60) return 'needs-work';
    return 'critical';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimized': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'needs-work': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>SEO Management</span>
              </CardTitle>
              <CardDescription>
                Manage SEO settings, meta tags, and search optimization for your website
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                loadPages();
                loadGlobalSettings();
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="global">Global Settings</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
            </TabsList>
            
            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Page SEO Settings</h3>
                <Button onClick={() => setIsAddingPage(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Page
                </Button>
              </div>
              
              {loading.pages ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {pages.map((page) => {
                    const score = calculateSEOScore(page);
                    const status = getScoreStatus(score);
                    
                    return (
                      <Card 
                        key={page.page_url} 
                        className={`cursor-pointer transition-all ${
                          selectedPage?.page_url === page.page_url ? 'ring-2 ring-primary' : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedPage(page)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(status)}
                              <div>
                                <h4 className="font-medium">{page.page_url}</h4>
                                <p className="text-sm text-gray-600 truncate max-w-md">{page.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPage(page);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <div className="text-right">
                                <div className="text-lg font-bold">{score}/100</div>
                                <Badge variant={status === 'optimized' ? 'default' : status === 'needs-work' ? 'secondary' : 'destructive'}>
                                  {status.replace('-', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Progress value={score} className="h-2" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              {/* Quick Edit Modal for simplicity */}
              {(editingPage || isAddingPage) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {editingPage ? `Edit SEO: ${editingPage.page_url}` : 'Add New Page SEO'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Page URL</Label>
                          <Input
                            value={editingPage?.page_url || ''}
                            onChange={(e) => {
                              if (editingPage) {
                                setEditingPage({ ...editingPage, page_url: e.target.value });
                              }
                            }}
                            placeholder="/page-url"
                            disabled={!!editingPage && !isAddingPage}
                          />
                        </div>
                        
                        <div>
                          <Label>Page Title</Label>
                          <Input
                            value={editingPage?.title || ''}
                            onChange={(e) => {
                              if (editingPage) {
                                setEditingPage({ ...editingPage, title: e.target.value });
                              }
                            }}
                            placeholder="Page title for search results"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {(editingPage?.title || '').length}/60 characters
                          </div>
                        </div>
                        
                        <div>
                          <Label>Meta Description</Label>
                          <Textarea
                            value={editingPage?.description || ''}
                            onChange={(e) => {
                              if (editingPage) {
                                setEditingPage({ ...editingPage, description: e.target.value });
                              }
                            }}
                            placeholder="Brief description for search results"
                            rows={3}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {(editingPage?.description || '').length}/160 characters
                          </div>
                        </div>
                        
                        <div>
                          <Label>Keywords</Label>
                          <Textarea
                            value={editingPage?.keywords || ''}
                            onChange={(e) => {
                              if (editingPage) {
                                setEditingPage({ ...editingPage, keywords: e.target.value });
                              }
                            }}
                            placeholder="keyword1, keyword2, keyword3"
                            rows={2}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingPage(null);
                            setIsAddingPage(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (editingPage) {
                              const pageData = {
                                ...editingPage,
                                og_title: editingPage.og_title || editingPage.title,
                                og_description: editingPage.og_description || editingPage.description,
                                twitter_title: editingPage.twitter_title || editingPage.title,
                                twitter_description: editingPage.twitter_description || editingPage.description,
                                robots: editingPage.robots || 'index, follow',
                                is_active: true
                              };
                              savePageSEO(pageData);
                            }
                          }}
                          disabled={loading.save}
                        >
                          {loading.save ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save SEO Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Global Settings Tab */}
            <TabsContent value="global" className="space-y-6">
              <h3 className="text-lg font-semibold">Global SEO Settings</h3>
              
              {loading.global ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : globalSettings ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Default Meta Tags</h4>
                      
                      <div>
                        <Label>Site Name</Label>
                        <Input
                          value={globalSettings.site_name}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, site_name: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label>Default Title</Label>
                        <Input
                          value={globalSettings.default_title}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, default_title: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label>Default Description</Label>
                        <Textarea
                          value={globalSettings.default_description}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, default_description: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Analytics & Social</h4>
                      
                      <div>
                        <Label>Google Analytics ID</Label>
                        <Input
                          value={globalSettings.google_analytics_id || ''}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, google_analytics_id: e.target.value })}
                          placeholder="GA-XXXXXXXXX-X"
                        />
                      </div>
                      
                      <div>
                        <Label>Twitter Handle</Label>
                        <Input
                          value={globalSettings.twitter_handle || ''}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, twitter_handle: e.target.value })}
                          placeholder="@egdrivingschool"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveGlobalSEO(globalSettings)}
                      disabled={loading.save}
                    >
                      {loading.save ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Global Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No global settings found</p>
                </div>
              )}
            </TabsContent>
            
            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <h3 className="text-lg font-semibold">SEO Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {pages.length > 0 ? Math.round(pages.reduce((acc, page) => acc + calculateSEOScore(page), 0) / pages.length) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{pages.length}</div>
                    <div className="text-sm text-gray-600">Pages Analyzed</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {pages.filter(page => getScoreStatus(calculateSEOScore(page)) === 'optimized').length}
                    </div>
                    <div className="text-sm text-gray-600">Optimized</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {pages.filter(page => getScoreStatus(calculateSEOScore(page)) === 'critical').length}
                    </div>
                    <div className="text-sm text-gray-600">Need Attention</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Sitemap Tab */}
            <TabsContent value="sitemap" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>XML Sitemap</CardTitle>
                      <CardDescription>
                        Generate and manage your website sitemap
                      </CardDescription>
                    </div>
                    <Button onClick={generateSitemap} disabled={loading.sitemap}>
                      {loading.sitemap ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Generate Sitemap
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sitemap.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium">{entry.url}</span>
                            <div className="text-sm text-gray-500">
                              {entry.changeFrequency} • Priority: {entry.priority}
                            </div>
                          </div>
                        </div>
                        <Badge variant={entry.included ? 'default' : 'secondary'}>
                          {entry.included ? 'Included' : 'Excluded'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Initialize new page for adding */}
      {isAddingPage && !editingPage && (() => {
        const newPage: SEOPage = {
          page_url: '',
          title: '',
          description: '',
          keywords: '',
          og_title: '',
          og_description: '',
          og_image: '',
          twitter_title: '',
          twitter_description: '',
          twitter_image: '',
          canonical_url: '',
          robots: 'index, follow',
          schema_markup: null,
          is_active: true
        };
        setEditingPage(newPage);
        return null;
      })()}
    </div>
  );
}