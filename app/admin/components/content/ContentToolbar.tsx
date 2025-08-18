'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';
import { CONTENT_SECTIONS } from '@/lib/content-utils';

interface ContentToolbarProps {
  selectedSection: string;
  onSectionChange: (section: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showDrafts: boolean;
  onShowDraftsChange: (show: boolean) => void;
  children: React.ReactNode;
}

export function ContentToolbar({
  selectedSection,
  onSectionChange,
  searchTerm,
  onSearchChange,
  showDrafts,
  onShowDraftsChange,
  children,
}: ContentToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <Select onValueChange={onSectionChange} value={selectedSection}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {CONTENT_SECTIONS.map((section) => (
              <SelectItem key={section.value} value={section.value}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch id="show-drafts" checked={showDrafts} onCheckedChange={onShowDraftsChange} />
          <Label htmlFor="show-drafts">Show Drafts</Label>
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
