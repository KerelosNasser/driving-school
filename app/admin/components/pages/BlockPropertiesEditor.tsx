// BlockPropertiesEditor Component - Edit block properties in the sidebar
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Type, 
  Palette, 
  Settings,
  Upload
} from 'lucide-react';
import type { PageBlock } from '@/lib/types/pages';

interface BlockPropertiesEditorProps {
  block?: PageBlock;
  onUpdate: (updates: Partial<PageBlock>) => void;
}

export function BlockPropertiesEditor({ block, onUpdate }: BlockPropertiesEditorProps) {
  if (!block) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a block to edit its properties</p>
      </div>
    );
  }

  const updateProps = (key: string, value: any) => {
    onUpdate({
      props: {
        ...block.props,
        [key]: value
      }
    });
  };

  const updateStyles = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...block.styles,
        [key]: value
      }
    });
  };

  const renderPropertiesForm = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={block.props.title || ''}
                onChange={(e) => updateProps('title', e.target.value)}
                placeholder="Enter hero title"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Textarea
                value={block.props.subtitle || ''}
                onChange={(e) => updateProps('subtitle', e.target.value)}
                placeholder="Enter hero subtitle"
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Button Text</Label>
              <Input
                value={block.props.buttonText || ''}
                onChange={(e) => updateProps('buttonText', e.target.value)}
                placeholder="Call to action text"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Button URL</Label>
              <Input
                value={block.props.buttonUrl || ''}
                onChange={(e) => updateProps('buttonUrl', e.target.value)}
                placeholder="/contact"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Content</Label>
              <Textarea
                value={block.props.content || ''}
                onChange={(e) => updateProps('content', e.target.value)}
                placeholder="Enter your text content using HTML..."
                rows={8}
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Custom block type</p>
            <p className="text-xs">Properties editor available for basic blocks</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">{block.type}</Badge>
        <span className="text-xs text-gray-500 truncate">ID: {block.id}</span>
      </div>
      
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Content
          </TabsTrigger>
          <TabsTrigger value="styles" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Styles
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-4">
          {renderPropertiesForm()}
        </TabsContent>
        
        <TabsContent value="styles" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Padding</Label>
              <Input
                value={block.styles.padding || ''}
                onChange={(e) => updateStyles('padding', e.target.value)}
                placeholder="40px 20px"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Background Color</Label>
              <Input
                type="color"
                value={block.styles.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyles('backgroundColor', e.target.value)}
                className="mt-1 h-10"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}