'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { DragSource, DragItem, ComponentDefinition, ThumbnailGenerator } from '../../lib/drag-drop';

interface ComponentPaletteProps {
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, dropResult?: any) => void;
  userId: string;
  userName: string;
  className?: string;
}

// Sample component definitions
const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Text Components
  {
    id: 'text-heading',
    name: 'Heading',
    category: 'text',
    icon: '📝',
    description: 'Add a heading to your page',
    defaultProps: { text: 'Your Heading Here', level: 1 },
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', default: 'Your Heading Here' },
        level: { type: 'number', default: 1 }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'text-paragraph',
    name: 'Paragraph',
    category: 'text',
    icon: '📄',
    description: 'Add a paragraph of text',
    defaultProps: { text: 'Your paragraph text here...' },
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', default: 'Your paragraph text here...' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'text-list',
    name: 'List',
    category: 'text',
    icon: '📋',
    description: 'Add a bulleted or numbered list',
    defaultProps: { items: ['Item 1', 'Item 2', 'Item 3'], type: 'bullet' },
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', default: ['Item 1', 'Item 2', 'Item 3'] },
        type: { type: 'string', default: 'bullet' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },

  // Media Components
  {
    id: 'media-image',
    name: 'Image',
    category: 'media',
    icon: '🖼️',
    description: 'Add an image to your page',
    defaultProps: { src: '', alt: 'Image description' },
    schema: {
      type: 'object',
      properties: {
        src: { type: 'string', default: '' },
        alt: { type: 'string', default: 'Image description' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'media-gallery',
    name: 'Gallery',
    category: 'media',
    icon: '🖼️',
    description: 'Add an image gallery',
    defaultProps: { images: [], columns: 3 },
    schema: {
      type: 'object',
      properties: {
        images: { type: 'array', default: [] },
        columns: { type: 'number', default: 3 }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'media-video',
    name: 'Video',
    category: 'media',
    icon: '🎥',
    description: 'Embed a video',
    defaultProps: { src: '', autoplay: false },
    schema: {
      type: 'object',
      properties: {
        src: { type: 'string', default: '' },
        autoplay: { type: 'boolean', default: false }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },

  // Layout Components
  {
    id: 'layout-section',
    name: 'Section',
    category: 'layout',
    icon: '📐',
    description: 'Add a content section',
    defaultProps: { padding: 'medium', background: 'transparent' },
    schema: {
      type: 'object',
      properties: {
        padding: { type: 'string', default: 'medium' },
        background: { type: 'string', default: 'transparent' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'layout-columns',
    name: 'Columns',
    category: 'layout',
    icon: '📊',
    description: 'Create a multi-column layout',
    defaultProps: { columns: 2, gap: 'medium' },
    schema: {
      type: 'object',
      properties: {
        columns: { type: 'number', default: 2 },
        gap: { type: 'string', default: 'medium' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'layout-spacer',
    name: 'Spacer',
    category: 'layout',
    icon: '📏',
    description: 'Add vertical spacing',
    defaultProps: { height: 'medium' },
    schema: {
      type: 'object',
      properties: {
        height: { type: 'string', default: 'medium' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },

  // Interactive Components
  {
    id: 'interactive-button',
    name: 'Button',
    category: 'interactive',
    icon: '🔘',
    description: 'Add a clickable button',
    defaultProps: { text: 'Click me', style: 'primary', link: '' },
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', default: 'Click me' },
        style: { type: 'string', default: 'primary' },
        link: { type: 'string', default: '' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'interactive-form',
    name: 'Contact Form',
    category: 'interactive',
    icon: '📝',
    description: 'Add a contact form',
    defaultProps: { fields: ['name', 'email', 'message'], submitText: 'Send Message' },
    schema: {
      type: 'object',
      properties: {
        fields: { type: 'array', default: ['name', 'email', 'message'] },
        submitText: { type: 'string', default: 'Send Message' }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  },
  {
    id: 'interactive-map',
    name: 'Map',
    category: 'interactive',
    icon: '🗺️',
    description: 'Embed an interactive map',
    defaultProps: { address: '', zoom: 15 },
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string', default: '' },
        zoom: { type: 'number', default: 15 }
      }
    },
    previewComponent: () => null,
    editComponent: () => null
  }
];

// Mock usage analytics
const USAGE_ANALYTICS = {
  'text-heading': 45,
  'text-paragraph': 38,
  'media-image': 32,
  'interactive-button': 28,
  'layout-section': 25,
  'layout-columns': 18,
  'media-gallery': 15,
  'text-list': 12,
  'interactive-form': 10,
  'media-video': 8,
  'interactive-map': 6,
  'layout-spacer': 4
};

export function ComponentPalette({ 
  onDragStart, 
  onDragEnd, 
  userId, 
  userName, 
  className = '' 
}: ComponentPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'usage'>('category');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(COMPONENT_DEFINITIONS.map(comp => comp.category)));
    return ['all', ...cats];
  }, []);

  // Filter and sort components
  const filteredComponents = useMemo(() => {
    let filtered = COMPONENT_DEFINITIONS.filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort components
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          const usageA = USAGE_ANALYTICS[a.id as keyof typeof USAGE_ANALYTICS] || 0;
          const usageB = USAGE_ANALYTICS[b.id as keyof typeof USAGE_ANALYTICS] || 0;
          return usageB - usageA;
        case 'category':
        default:
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy]);

  // Group components by category for display
  const groupedComponents = useMemo(() => {
    const groups: Record<string, ComponentDefinition[]> = {};
    filteredComponents.forEach(component => {
      if (!groups[component.category]) {
        groups[component.category] = [];
      }
      groups[component.category].push(component);
    });
    return groups;
  }, [filteredComponents]);

  // Get recommended components (most used)
  const recommendedComponents = useMemo(() => {
    return COMPONENT_DEFINITIONS
      .sort((a, b) => {
        const usageA = USAGE_ANALYTICS[a.id as keyof typeof USAGE_ANALYTICS] || 0;
        const usageB = USAGE_ANALYTICS[b.id as keyof typeof USAGE_ANALYTICS] || 0;
        return usageB - usageA;
      })
      .slice(0, 4);
  }, []);

  const createDragItem = (component: ComponentDefinition): DragItem => ({
    type: 'new_component',
    componentType: component.id,
    preview: {
      name: component.name,
      icon: component.icon,
      thumbnail: ThumbnailGenerator.generateThumbnail(component)
    }
  });

  const handleDragStart = (component: ComponentDefinition) => {
    const dragItem = createDragItem(component);
    onDragStart?.(dragItem);
  };

  const handleDragEnd = (component: ComponentDefinition, dropResult?: any) => {
    const dragItem = createDragItem(component);
    onDragEnd?.(dragItem, dropResult);
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Component Palette</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'category' | 'usage')}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="category">Sort by Category</option>
            <option value="name">Sort by Name</option>
            <option value="usage">Sort by Usage</option>
          </select>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-600">
          Showing {filteredComponents.length} of {COMPONENT_DEFINITIONS.length} components
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Recommended Components */}
        {searchTerm === '' && selectedCategory === 'all' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-green-700">Most Used</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recommendedComponents.map(component => (
                <ComponentPaletteItem
                  key={`recommended-${component.id}`}
                  component={component}
                  onDragStart={() => handleDragStart(component)}
                  onDragEnd={(dropResult) => handleDragEnd(component, dropResult)}
                  userId={userId}
                  userName={userName}
                  showUsage={true}
                  usage={USAGE_ANALYTICS[component.id as keyof typeof USAGE_ANALYTICS]}
                />
              ))}
            </div>
            <div className="border-t mt-4 pt-4" />
          </div>
        )}

        {/* Component Groups */}
        {Object.entries(groupedComponents).map(([category, components]) => (
          <div key={category} className="mb-6 last:mb-0">
            <h4 className="font-medium text-gray-700 mb-3 capitalize">
              {category} Components ({components.length})
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {components.map(component => (
                <ComponentPaletteItem
                  key={component.id}
                  component={component}
                  onDragStart={() => handleDragStart(component)}
                  onDragEnd={(dropResult) => handleDragEnd(component, dropResult)}
                  userId={userId}
                  userName={userName}
                  showUsage={sortBy === 'usage'}
                  usage={USAGE_ANALYTICS[component.id as keyof typeof USAGE_ANALYTICS]}
                />
              ))}
            </div>
          </div>
        ))}

        {/* No results */}
        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No components found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ComponentPaletteItemProps {
  component: ComponentDefinition;
  onDragStart: () => void;
  onDragEnd: (dropResult?: any) => void;
  userId: string;
  userName: string;
  showUsage?: boolean;
  usage?: number;
}

function ComponentPaletteItem({ 
  component, 
  onDragStart, 
  onDragEnd, 
  userId, 
  userName, 
  showUsage = false, 
  usage = 0 
}: ComponentPaletteItemProps) {
  const dragItem: DragItem = {
    type: 'new_component',
    componentType: component.id,
    preview: {
      name: component.name,
      icon: component.icon,
      thumbnail: ThumbnailGenerator.generateThumbnail(component)
    }
  };

  return (
    <DragSource
      item={dragItem}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-grab active:cursor-grabbing group">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-xl">{component.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-900 truncate">{component.name}</h5>
              {showUsage && usage > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {usage}
                </span>
              )}
            </div>
            {component.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {component.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                {component.category}
              </span>
              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Drag to add
              </span>
            </div>
          </div>
        </div>
      </div>
    </DragSource>
  );
}

export default ComponentPalette;