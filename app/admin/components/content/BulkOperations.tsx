'use client';

import { useState } from 'react';
import { Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { enhancedContentService } from '@/lib/content-service';
import { SiteContent } from '@/lib/types';

interface BulkOperationsProps {
  selectedItems: Set<string>;
  content: SiteContent[];
  onBulkUpdate: (ids: string[], updates: Partial<SiteContent>) => Promise<boolean>;
  onBulkDelete: (ids: string[]) => Promise<boolean>;
  onClearSelection: () => void;
}

export function BulkOperations({ 
  selectedItems, 
  content, 
  onBulkUpdate, 
  onBulkDelete, 
  onClearSelection 
}: BulkOperationsProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [bulkSection, setBulkSection] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedContent = content.filter(item => selectedItems.has(item.id));

  const handleExport = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      content_count: selectedContent.length,
      content: selectedContent.map(item => ({
        ...item,
        id: undefined, // Remove ID for import
        created_at: undefined,
        updated_at: undefined
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedContent.length} content items`);
    setShowExportDialog(false);
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('Please provide import data');
      return;
    }

    setLoading(true);
    try {
      const data = JSON.parse(importData);
      
      if (!data.content || !Array.isArray(data.content)) {
        throw new Error('Invalid import format');
      }

      let importedCount = 0;
      for (const item of data.content) {
        try {
          await enhancedContentService.create({
            ...item,
            content_key: `${item.content_key}_imported_${Date.now()}`,
            is_draft: true // Import as draft by default
          });
          importedCount++;
        } catch (error) {
          console.error('Failed to import item:', item.content_key, error);
        }
      }

      toast.success(`Imported ${importedCount} content items`);
      setImportData('');
      setShowImportDialog(false);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to parse import data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSectionChange = async () => {
    if (!bulkSection) {
      toast.error('Please select a section');
      return;
    }

    const success = await onBulkUpdate(Array.from(selectedItems), { page_section: bulkSection });
    if (success) {
      setBulkSection('');
      onClearSelection();
    }
  };

  if (selectedItems.size === 0) {
    return (
      <div className="flex items-center gap-2">
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Import Data (JSON)</label>
                <Textarea
                  placeholder="Paste your exported content JSON here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={loading}>
                  Import Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary">
        {selectedItems.size} selected
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onBulkDelete(Array.from(selectedItems))}
        disabled={loading}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onBulkUpdate(Array.from(selectedItems), { is_active: true })}
        disabled={loading}
      >
        <Eye className="h-4 w-4 mr-1" />
        Activate
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onBulkUpdate(Array.from(selectedItems), { is_active: false })}
        disabled={loading}
      >
        <EyeOff className="h-4 w-4 mr-1" />
        Deactivate
      </Button>

      <div className="flex items-center gap-1">
        <Select value={bulkSection} onValueChange={setBulkSection}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Move to..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hero">Hero</SelectItem>
            <SelectItem value="about">About</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="packages">Packages</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="footer">Footer</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkSectionChange}
          disabled={!bulkSection || loading}
        >
          Move
        </Button>
      </div>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Selected Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Export {selectedItems.size} selected content items as JSON.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
      >
        Clear Selection
      </Button>
    </div>
  );
}