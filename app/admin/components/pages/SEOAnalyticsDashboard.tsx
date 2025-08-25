// SEO Analytics Dashboard - Monitor SEO Performance
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Search,
  Globe,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import type { Page } from '@/lib/types/pages';

interface SEOAnalyticsProps {
  pages: Page[];
}

interface PageMetrics {
  pageId: string;
  slug: string;
  title: string;
  views: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  bounceRate: number;
  timeOnPage: number;
  seoScore: number;
  keywords: KeywordMetric[];
  issues: number;
}

interface KeywordMetric {
  keyword: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  change: number;
}

interface OverallMetrics {
  totalPages: number;
  publishedPages: number;
  averageSeoScore: number;
  totalIssues: number;
  topPerformingPages: PageMetrics[];
  totalKeywords: number;
  avgPosition: number;
}

export function SEOAnalyticsDashboard({ pages }: SEOAnalyticsProps) {
  const [metrics, setMetrics] = useState<PageMetrics[]>([]);
  const [overallMetrics, setOverallMetrics] = useState<OverallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Simulate analytics data (in real implementation, this would come from Google Search Console API, Google Analytics, etc.)
  const generateMockMetrics = (): PageMetrics[] => {
    return pages.map(page => ({
      pageId: page.id,
      slug: page.slug,
      title: page.title,
      views: Math.floor(Math.random() * 5000) + 100,
      impressions: Math.floor(Math.random() * 10000) + 500,
      clicks: Math.floor(Math.random() * 1000) + 50,
      ctr: Math.random() * 10 + 1,
      avgPosition: Math.random() * 50 + 5,
      bounceRate: Math.random() * 50 + 20,
      timeOnPage: Math.random() * 300 + 60,
      seoScore: Math.floor(Math.random() * 40) + 60,
      keywords: generateMockKeywords(),
      issues: Math.floor(Math.random() * 5)
    }));
  };

  const generateMockKeywords = (): KeywordMetric[] => {
    const keywords = [
      'driving lessons',
      'learn to drive',
      'driving school',
      'driving instructor',
      'driving test',
      'driving course',
      'automatic driving lessons',
      'manual driving lessons',
      'defensive driving',
      'road test preparation'
    ];

    return keywords.slice(0, Math.floor(Math.random() * 5) + 3).map(keyword => ({
      keyword,
      position: Math.random() * 50 + 1,
      clicks: Math.floor(Math.random() * 200) + 10,
      impressions: Math.floor(Math.random() * 1000) + 100,
      ctr: Math.random() * 15 + 2,
      change: (Math.random() - 0.5) * 20
    }));
  };

  const calculateOverallMetrics = (pageMetrics: PageMetrics[]): OverallMetrics => {
    const publishedPages = pages.filter(p => p.status === 'published').length;
    const totalKeywords = pageMetrics.reduce((sum, page) => sum + page.keywords.length, 0);
    const avgSeoScore = pageMetrics.reduce((sum, page) => sum + page.seoScore, 0) / pageMetrics.length;
    const totalIssues = pageMetrics.reduce((sum, page) => sum + page.issues, 0);
    const avgPosition = pageMetrics.reduce((sum, page) => sum + page.avgPosition, 0) / pageMetrics.length;

    return {
      totalPages: pages.length,
      publishedPages,
      averageSeoScore: Math.round(avgSeoScore),
      totalIssues,
      topPerformingPages: pageMetrics
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
      totalKeywords,
      avgPosition: Math.round(avgPosition * 10) / 10
    };
  };

  useEffect(() => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const pageMetrics = generateMockMetrics();
      setMetrics(pageMetrics);
      setOverallMetrics(calculateOverallMetrics(pageMetrics));
      setLoading(false);
    }, 1000);
  }, [pages, selectedPeriod]);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      const pageMetrics = generateMockMetrics();
      setMetrics(pageMetrics);
      setOverallMetrics(calculateOverallMetrics(pageMetrics));
      setLoading(false);
    }, 1000);
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SEO Analytics</h2>
          <p className="text-gray-600">Monitor your page performance and SEO metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {overallMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900">{overallMetrics.totalPages}</p>
                  <p className="text-sm text-green-600">{overallMetrics.publishedPages} published</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg SEO Score</p>
                  <p className={`text-2xl font-bold ${getSEOScoreColor(overallMetrics.averageSeoScore)}`}>
                    {overallMetrics.averageSeoScore}
                  </p>
                  <p className="text-sm text-gray-500">/100</p>
                </div>
                <Search className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Keywords</p>
                  <p className="text-2xl font-bold text-gray-900">{overallMetrics.totalKeywords}</p>
                  <p className="text-sm text-gray-500">Avg pos: {overallMetrics.avgPosition}</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">SEO Issues</p>
                  <p className="text-2xl font-bold text-red-600">{overallMetrics.totalIssues}</p>
                  <p className="text-sm text-gray-500">Need attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pages">Page Performance</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="issues">SEO Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-900">Page</th>
                      <th className="text-left p-3 font-medium text-gray-900">Views</th>
                      <th className="text-left p-3 font-medium text-gray-900">CTR</th>
                      <th className="text-left p-3 font-medium text-gray-900">Avg Position</th>
                      <th className="text-left p-3 font-medium text-gray-900">SEO Score</th>
                      <th className="text-left p-3 font-medium text-gray-900">Time on Page</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric) => (
                      <tr key={metric.pageId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">{metric.title}</div>
                            <div className="text-sm text-gray-500">/{metric.slug}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-gray-400" />
                            {formatNumber(metric.views)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {metric.ctr.toFixed(1)}%
                            {metric.ctr > 5 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={metric.avgPosition <= 10 ? 'default' : 'secondary'}>
                            #{metric.avgPosition.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className={`font-medium ${getSEOScoreColor(metric.seoScore)}`}>
                            {metric.seoScore}/100
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatDuration(metric.timeOnPage)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.slice(0, 3).map((metric) => (
                  <div key={metric.pageId} className="space-y-2">
                    <h4 className="font-medium text-gray-900">{metric.title}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-2 text-sm font-medium text-gray-900">Keyword</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-900">Position</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-900">Clicks</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-900">CTR</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-900">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metric.keywords.slice(0, 5).map((keyword, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="p-2 text-sm">{keyword.keyword}</td>
                              <td className="p-2">
                                <Badge variant={keyword.position <= 10 ? 'default' : 'secondary'}>
                                  #{keyword.position.toFixed(1)}
                                </Badge>
                              </td>
                              <td className="p-2 text-sm">{keyword.clicks}</td>
                              <td className="p-2 text-sm">{keyword.ctr.toFixed(1)}%</td>
                              <td className="p-2">
                                <div className={`flex items-center gap-1 text-sm ${
                                  keyword.change > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {keyword.change > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {Math.abs(keyword.change).toFixed(1)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Issues Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.filter(m => m.issues > 0).map((metric) => (
                  <div key={metric.pageId} className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="font-medium text-gray-900">{metric.title}</div>
                        <div className="text-sm text-gray-600">
                          {metric.issues} issue{metric.issues !== 1 ? 's' : ''} found
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Fix Issues
                    </Button>
                  </div>
                ))}
                
                {metrics.filter(m => m.issues === 0).length > 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Great Job!</h3>
                    <p className="text-gray-600">
                      {metrics.filter(m => m.issues === 0).length} page{metrics.filter(m => m.issues === 0).length !== 1 ? 's' : ''} have no SEO issues
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}