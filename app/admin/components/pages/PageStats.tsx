// PageStats Component - Display overview statistics
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Globe, 
  FileEdit,
  Archive,
  TrendingUp,
  Calendar
} from 'lucide-react';
import type { Page } from '@/lib/types/pages';

interface PageStatsProps {
  pages: Page[];
}

export function PageStats({ pages }: PageStatsProps) {
  const stats = {
    total: pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft: pages.filter(p => p.status === 'draft').length,
    archived: pages.filter(p => p.status === 'archived').length,
    recentlyUpdated: pages.filter(p => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUpdate <= 7;
    }).length
  };

  const statCards = [
    {
      label: 'Total Pages',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Published',
      value: stats.published,
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Draft',
      value: stats.draft,
      icon: FileEdit,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Archived',
      value: stats.archived,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      label: 'Updated This Week',
      value: stats.recentlyUpdated,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}