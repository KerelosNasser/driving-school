'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { DragSource, DragItem, ComponentDefinition, ThumbnailGenerator } from '../../lib/drag-drop';
import { Button } from '@/components/ui/button';
import { NewPageDialog } from '@/components/admin/NewPageDialog';
import { useRouter } from 'next/navigation';
import { 
  ButtonComponentPreview, 
  ButtonComponentEdit 
} from '../component-library/ButtonComponent';
import { 
  ImageComponentPreview, 
  ImageComponentEdit 
} from '../component-library/ImageComponent';
import { 
  TextComponentPreview, 
  TextComponentEdit 
} from '../component-library/TextComponent';
import {  
  ColumnComponentPreview, 
  ColumnComponentEdit 
} from '../component-library/LayoutComponents';
import { SectionComponent } from '../component-library/SectionComponent';
import { AlertComponent } from '../component-library/AlertComponent';
import { AvatarComponent } from '../component-library/AvatarComponent';
import { BadgeComponent } from '../component-library/BadgeComponent';
import { CardComponent } from '../component-library/CardComponent';
import { CalendarComponent } from '../component-library/CalendarComponent';
import { CheckboxComponent } from '../component-library/CheckboxComponent';
import { InputComponent } from '../component-library/InputComponent';
import { LabelComponent } from '../component-library/LabelComponent';

interface ComponentPaletteProps {
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, dropResult?: any) => void;
  userId: string;
  userName: string;
  className?: string;
  pageId: string;
}

const getComponentDefinitions = (pageId: string): ComponentDefinition[] => [
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
    previewComponent: TextComponentPreview,
    editComponent: TextComponentEdit
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
    previewComponent: TextComponentPreview,
    editComponent: TextComponentEdit
  },
  {
    id: 'text-label',
    name: 'Label',
    category: 'text',
    icon: '🏷️',
    description: 'Display a label',
    defaultProps: { text: 'Label' },
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', default: 'Label' }
      }
    },
    previewComponent: LabelComponent,
    editComponent: LabelComponent
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
    previewComponent: ImageComponentPreview,
    editComponent: ImageComponentEdit
  },
  {
    id: 'media-avatar',
    name: 'Avatar',
    category: 'media',
    icon: '👤',
    description: 'Display an avatar',
    defaultProps: { src: '', fallback: 'AV' },
    schema: {
      type: 'object',
      properties: {
        src: { type: 'string', default: '' },
        fallback: { type: 'string', default: 'AV' }
      }
    },
    previewComponent: AvatarComponent,
    editComponent: AvatarComponent
  },

  // Layout Components
  {
    id: 'layout-section',
    name: 'Section',
    category: 'layout',
    icon: '📐',
    description: 'Add a content section',
    defaultProps: { pageId },
    schema: {},
    previewComponent: SectionComponent,
    editComponent: SectionComponent
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
    previewComponent: ColumnComponentPreview,
    editComponent: ColumnComponentEdit
  },
  {
    id: 'layout-card',
    name: 'Card',
    category: 'layout',
    icon: '📇',
    description: 'Display content in a card',
    defaultProps: { title: 'Card Title', description: 'Card Description', content: 'Card Content', footer: 'Card Footer' },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', default: 'Card Title' },
        description: { type: 'string', default: 'Card Description' },
        content: { type: 'string', default: 'Card Content' },
        footer: { type: 'string', default: 'Card Footer' }
      }
    },
    previewComponent: CardComponent,
    editComponent: CardComponent
  },

  // Interactive Components
  {
    id: 'interactive-badge',
    name: 'Badge',
    category: 'interactive',
    icon: '🏷️',
    description: 'Display a badge',
    defaultProps: { text: 'Badge' },
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', default: 'Badge' }
      }
    },
    previewComponent: BadgeComponent,
    editComponent: BadgeComponent
  },
  {
    id: 'interactive-alert',
    name: 'Alert',
    category: 'interactive',
    icon: '🚨',
    description: 'Display an alert message',
    defaultProps: { title: 'Heads up!', description: 'This is an alert message.' },
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', default: 'Heads up!' },
        description: { type: 'string', default: 'This is an alert message.' }
      }
    },
    previewComponent: AlertComponent,
    editComponent: AlertComponent
  },
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
    previewComponent: ButtonComponentPreview,
    editComponent: ButtonComponentEdit
  },
  {
    id: 'interactive-calendar',
    name: 'Calendar',
    category: 'interactive',
    icon: '📅',
    description: 'Display a calendar',
    defaultProps: {},
    schema: {},
    previewComponent: CalendarComponent,
    editComponent: CalendarComponent
  },
  {
    id: 'interactive-checkbox',
    name: 'Checkbox',
    category: 'interactive',
    icon: '✅',
    description: 'Display a checkbox',
    defaultProps: { label: 'Accept terms and conditions' },
    schema: {
      type: 'object',
      properties: {
        label: { type: 'string', default: 'Accept terms and conditions' }
      }
    },
    previewComponent: CheckboxComponent,
    editComponent: CheckboxComponent
  },
  {
    id: 'interactive-input',
    name: 'Input',
    category: 'interactive',
    icon: '⌨️',
    description: 'Display an input field',
    defaultProps: { placeholder: 'Enter text...' },
    schema: {
      type: 'object',
      properties: {
        placeholder: { type: 'string', default: 'Enter text...' }
      }
    },
    previewComponent: InputComponent,
    editComponent: InputComponent
  },
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
  className = '',
  pageId
}: ComponentPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'usage'>('category');
  const [isNewPageDialogOpen, setIsNewPageDialogOpen] = useState(false);
  const router = useRouter();

  const COMPONENT_DEFINITIONS = getComponentDefinitions(pageId);

  const onCreatePage = async (title: string, slug: string) => {
    const response = await fetch('/api/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, slug }),
    });

    if (response.ok) {
      const { slug: newSlug } = await response.json();
      router.push(`/${newSlug}`);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(COMPONENT_DEFINITIONS.map(comp => comp.category)));
    return ['all', ...cats];
  }, [COMPONENT_DEFINITIONS]);

  // Filter and sort components
  const filteredComponents = useMemo(() => {
    const filtered = COMPONENT_DEFINITIONS.filter(component => {
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
  }, [searchTerm, selectedCategory, sortBy, COMPONENT_DEFINITIONS]);

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
  }, [COMPONENT_DEFINITIONS]);

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
        <div className="mt-4">
          <Button onClick={() => setIsNewPageDialogOpen(true)} className="w-full">New Page</Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
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
            <h4 className="font-semibold text-lg text-gray-800 mb-3 capitalize">
              {category}
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
      <NewPageDialog open={isNewPageDialogOpen} onOpenChange={setIsNewPageDialogOpen} onCreatePage={onCreatePage} />
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