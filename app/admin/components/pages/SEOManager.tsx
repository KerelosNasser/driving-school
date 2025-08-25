// Advanced SEO Manager Component - 2025 Best Practices
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Share,
  BarChart3,
  ExternalLink,
  Copy,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import type { Page } from '@/lib/types/pages';

interface SEOManagerProps {
  page: Page;
  onUpdate: (updates: Partial<Page>) => void;
}

interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
}

interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  fix?: string;
}

interface SEOSuggestion {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export function SEOManager({ page, onUpdate }: SEOManagerProps) {
  const [seoData, setSeoData] = useState(page.meta_data || {});
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // SEO Analysis function
  const analyzeSEO = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const issues: SEOIssue[] = [];
      const suggestions: SEOSuggestion[] = [];
      let score = 100;

      // Title analysis
      if (!seoData.title && !page.title) {
        issues.push({
          type: 'error',
          title: 'Missing Title Tag',
          description: 'Every page must have a title tag for SEO',
          fix: 'Add a descriptive title (50-60 characters)'
        });
        score -= 20;
      } else {
        const title = seoData.title || page.title;
        if (title.length > 60) {
          issues.push({
            type: 'warning',
            title: 'Title Too Long',
            description: `Title is ${title.length} characters. Recommended: 50-60 characters`,
            fix: 'Shorten the title to improve search appearance'
          });
          score -= 5;
        } else if (title.length < 30) {
          suggestions.push({
            title: 'Optimize Title Length',
            description: 'Consider expanding your title to 50-60 characters for better SEO',
            impact: 'medium'
          });
        }
      }

      // Meta description analysis
      if (!seoData.description) {
        issues.push({
          type: 'warning',
          title: 'Missing Meta Description',
          description: 'Meta descriptions help search engines understand your page',
          fix: 'Add a compelling description (150-160 characters)'
        });
        score -= 10;
      } else if (seoData.description.length > 160) {
        issues.push({
          type: 'warning',
          title: 'Meta Description Too Long',
          description: `Description is ${seoData.description.length} characters. Recommended: 150-160`,
          fix: 'Shorten the description to prevent truncation'
        });
        score -= 5;
      }

      // Keywords analysis
      if (!seoData.keywords) {
        suggestions.push({
          title: 'Add Focus Keywords',
          description: 'Define 3-5 target keywords for better content optimization',
          impact: 'high'
        });
        score -= 5;
      }

      // Open Graph analysis
      if (!seoData.og_title) {
        suggestions.push({
          title: 'Add Open Graph Title',
          description: 'Improve social media sharing with custom OG title',
          impact: 'medium'
        });
      }

      if (!seoData.og_image) {
        suggestions.push({
          title: 'Add Open Graph Image',
          description: 'Include an image for better social media previews',
          impact: 'medium'
        });
      }

      // Content analysis
      const contentLength = page.content?.blocks?.reduce((acc, block) => {
        if (block.type === 'text' && block.props?.content) {
          return acc + block.props.content.replace(/<[^>]*>/g, '').length;
        }
        return acc;
      }, 0) || 0;

      if (contentLength < 300) {
        issues.push({
          type: 'warning',
          title: 'Content Too Short',
          description: `Page has ${contentLength} characters. Recommended: 300+ characters`,
          fix: 'Add more valuable content to improve SEO'
        });
        score -= 10;
      }

      // Structural analysis
      const hasH1 = page.content?.blocks?.some(block => 
        block.type === 'text' && block.props?.content?.includes('<h1>')
      );

      if (!hasH1) {
        issues.push({
          type: 'error',
          title: 'Missing H1 Tag',
          description: 'Every page should have exactly one H1 tag',
          fix: 'Add an H1 heading to your content'
        });
        score -= 15;
      }

      setAnalysis({
        score: Math.max(0, score),
        issues,
        suggestions
      });
      
      setIsAnalyzing(false);
    }, 1500);
  };

  useEffect(() => {
    analyzeSEO();
  }, [page, seoData]);

  const handleSEOUpdate = (field: string, value: string) => {
    const newSeoData = { ...seoData, [field]: value };
    setSeoData(newSeoData);
    onUpdate({ meta_data: newSeoData });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const previewGoogleResult = () => {
    const title = seoData.title || page.title;
    const description = seoData.description || '';
    const url = `${window.location.origin}/${page.slug}`;

    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="text-sm text-green-700 mb-1">{url}</div>
        <div className="text-xl text-blue-600 hover:underline cursor-pointer mb-1">
          {title}
        </div>
        <div className="text-sm text-gray-600">
          {description || 'No meta description available'}
        </div>
      </div>
    );
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSEOScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* SEO Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO Analysis
            </div>
            <div className="flex items-center gap-3">
              {analysis && (
                <Badge className={getSEOScoreBadge(analysis.score)}>
                  {analysis.score}/100
                </Badge>
              )}
              <Button
                onClick={analyzeSEO}
                disabled={isAnalyzing}
                size="sm"
                variant="outline"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Re-analyze
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis && (
            <div className="space-y-4">
              {/* Score Display */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getSEOScoreColor(analysis.score)}`}>
                  {analysis.score}
                </div>
                <div className="text-sm text-gray-600">SEO Score</div>
              </div>

              {/* Issues */}
              {analysis.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Issues ({analysis.issues.length})
                  </h4>
                  <div className="space-y-2">
                    {analysis.issues.map((issue, index) => (
                      <div key={index} className="border-l-4 border-red-300 pl-4 py-2">
                        <div className="font-medium text-red-800">{issue.title}</div>
                        <div className="text-sm text-red-600">{issue.description}</div>
                        {issue.fix && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Fix:</strong> {issue.fix}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Suggestions ({analysis.suggestions.length})
                  </h4>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="border-l-4 border-yellow-300 pl-4 py-2">
                        <div className="font-medium text-yellow-800">{suggestion.title}</div>
                        <div className="text-sm text-yellow-600">{suggestion.description}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {suggestion.impact} impact
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic SEO</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SEO Title */}
              <div>
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={seoData.title || ''}
                  onChange={(e) => handleSEOUpdate('title', e.target.value)}
                  placeholder={page.title}
                  maxLength={60}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {(seoData.title || '').length}/60 characters
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  value={seoData.description || ''}
                  onChange={(e) => handleSEOUpdate('description', e.target.value)}
                  placeholder="A compelling description of your page..."
                  maxLength={160}
                  rows={3}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {(seoData.description || '').length}/160 characters
                </div>
              </div>

              {/* Focus Keywords */}
              <div>
                <Label htmlFor="keywords">Focus Keywords</Label>
                <Input
                  id="keywords"
                  value={seoData.keywords || ''}
                  onChange={(e) => handleSEOUpdate('keywords', e.target.value)}
                  placeholder="driving lessons, learn to drive, driving school"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Separate keywords with commas
                </div>
              </div>

              {/* URL Slug */}
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={page.slug}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newSlug = generateSlug(page.title);
                      onUpdate({ slug: newSlug });
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {window.location.origin}/{page.slug}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Open Graph Title */}
              <div>
                <Label htmlFor="og-title">Open Graph Title</Label>
                <Input
                  id="og-title"
                  value={seoData.og_title || ''}
                  onChange={(e) => handleSEOUpdate('og_title', e.target.value)}
                  placeholder={seoData.title || page.title}
                />
              </div>

              {/* Open Graph Description */}
              <div>
                <Label htmlFor="og-description">Open Graph Description</Label>
                <Textarea
                  id="og-description"
                  value={seoData.og_description || ''}
                  onChange={(e) => handleSEOUpdate('og_description', e.target.value)}
                  placeholder={seoData.description}
                  rows={3}
                />
              </div>

              {/* Open Graph Image */}
              <div>
                <Label htmlFor="og-image">Open Graph Image URL</Label>
                <Input
                  id="og-image"
                  value={seoData.og_image || ''}
                  onChange={(e) => handleSEOUpdate('og_image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Recommended: 1200x630px
                </div>
              </div>

              {/* Twitter Card */}
              <div>
                <Label htmlFor="twitter-card">Twitter Card Type</Label>
                <select
                  id="twitter-card"
                  value={seoData.twitter_card || 'summary'}
                  onChange={(e) => handleSEOUpdate('twitter_card', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Canonical URL */}
              <div>
                <Label htmlFor="canonical">Canonical URL</Label>
                <Input
                  id="canonical"
                  value={seoData.canonical || ''}
                  onChange={(e) => handleSEOUpdate('canonical', e.target.value)}
                  placeholder={`${window.location.origin}/${page.slug}`}
                />
              </div>

              {/* Robots Meta */}
              <div>
                <Label>Robots Meta Tags</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={seoData.robots_index !== false}
                      onCheckedChange={(checked) => handleSEOUpdate('robots_index', checked.toString())}
                    />
                    <Label>Allow search engines to index this page</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={seoData.robots_follow !== false}
                      onCheckedChange={(checked) => handleSEOUpdate('robots_follow', checked.toString())}
                    />
                    <Label>Allow search engines to follow links</Label>
                  </div>
                </div>
              </div>

              {/* Schema Markup Type */}
              <div>
                <Label htmlFor="schema-type">Schema.org Type</Label>
                <select
                  id="schema-type"
                  value={seoData.schema_type || 'WebPage'}
                  onChange={(e) => handleSEOUpdate('schema_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="WebPage">Web Page</option>
                  <option value="Article">Article</option>
                  <option value="Service">Service</option>
                  <option value="LocalBusiness">Local Business</option>
                  <option value="EducationalOrganization">Educational Organization</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Search Result Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Google Search Result</h4>
                  {previewGoogleResult()}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Social Media Preview</h4>
                  <div className="border rounded-lg p-4 bg-white max-w-md">
                    {seoData.og_image && (
                      <div className="w-full h-40 bg-gray-200 rounded mb-2 flex items-center justify-center">
                        <img
                          src={seoData.og_image}
                          alt="OG Preview"
                          className="max-w-full max-h-full object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="font-medium text-gray-900 mb-1">
                      {seoData.og_title || seoData.title || page.title}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {seoData.og_description || seoData.description || 'No description available'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {window.location.hostname}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}