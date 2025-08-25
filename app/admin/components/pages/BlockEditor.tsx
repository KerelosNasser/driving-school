// BlockEditor Component - Individual draggable blocks in the page editor
'use client';

import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  Edit,
  Eye,
  EyeOff,
  Type,
  Image,
  Layout,
  Columns,
  Megaphone
} from 'lucide-react';
import type { PageBlock } from '@/lib/types/pages';

interface BlockEditorProps {
  block: PageBlock;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PageBlock>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

// Block type icons
const BLOCK_ICONS: Record<string, any> = {
  hero: Layout,
  text: Type,
  image: Image,
  columns: Columns,
  cta: Megaphone,
  default: Layout
};

export function BlockEditor({ 
  block, 
  index, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onRemove, 
  onDuplicate 
}: BlockEditorProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const IconComponent = BLOCK_ICONS[block.type] || BLOCK_ICONS.default;
  
  const renderBlockPreview = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {block.props.title || 'Hero Title'}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {block.props.subtitle || 'Hero subtitle goes here'}
            </p>
            {block.props.buttonText && (
              <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg">
                {block.props.buttonText}
              </div>
            )}
          </div>
        );
      
      case 'text':
        return (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: block.props.content || '<p>Text content goes here...</p>' 
            }}
          />
        );
      
      case 'image':
        return (
          <div className="text-center">
            {block.props.src ? (
              <div>
                <img 
                  src={block.props.src} 
                  alt={block.props.alt || ''} 
                  className="max-w-full h-auto rounded-lg mx-auto"
                />
                {block.props.caption && (
                  <p className="text-sm text-gray-600 mt-2">{block.props.caption}</p>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to add image</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'columns':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="prose prose-sm">
              <div dangerouslySetInnerHTML={{ 
                __html: block.props.leftContent || '<p>Left column content...</p>' 
              }} />
            </div>
            <div className="prose prose-sm">
              <div dangerouslySetInnerHTML={{ 
                __html: block.props.rightContent || '<p>Right column content...</p>' 
              }} />
            </div>
          </div>
        );
      
      case 'cta':
        return (
          <div className="text-center py-12 bg-blue-600 text-white rounded-lg">
            <h2 className="text-2xl font-bold mb-4">
              {block.props.title || 'Call to Action'}
            </h2>
            <p className="text-lg mb-6">
              {block.props.description || 'Your compelling message here'}
            </p>
            {block.props.buttonText && (
              <div className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold">
                {block.props.buttonText}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <IconComponent className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">{block.type} Block</p>
            <p className="text-xs">Custom block type</p>
          </div>
        );
    }
  };

  return (
    <Draggable draggableId={block.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative transition-all duration-200 ${
            isSelected 
              ? 'ring-2 ring-blue-500 ring-offset-2' 
              : snapshot.isDragging 
              ? 'ring-2 ring-blue-300 ring-offset-2' 
              : ''
          }`}
        >
          <Card 
            className={`cursor-pointer transition-all duration-200 ${
              isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
            } ${!isVisible ? 'opacity-50' : ''}`}
            onClick={onSelect}
          >
            {/* Block Header */}
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div 
                  {...provided.dragHandleProps}
                  className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-200"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <IconComponent className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <Badge variant="outline" className="text-xs">
                    {block.type}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(!isVisible);
                  }}
                  className="h-7 w-7 p-0"
                >
                  {isVisible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Block Content */}
            <CardContent className="p-6">
              {renderBlockPreview()}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}