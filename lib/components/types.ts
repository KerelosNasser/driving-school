// Component library type definitions
import { ComponentPosition } from '../realtime/types';

// Component definition and schema
export interface ComponentSchema {
  type: 'object';
  properties: Record<string, ComponentPropertySchema>;
  required?: string[];
}

export interface ComponentPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  items?: ComponentPropertySchema;
  properties?: Record<string, ComponentPropertySchema>;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  category: 'text' | 'media' | 'layout' | 'interactive';
  icon: string;
  description: string;
  defaultProps: Record<string, any>;
  schema: ComponentSchema;
  previewComponent: string; // Component name for preview
  editComponent: string; // Component name for editing
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentInstance {
  id: string;
  type: string;
  position: ComponentPosition;
  props: Record<string, any>;
  version: string;
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  isActive: boolean;
}

// Component registry and management
export interface ComponentRegistry {
  definitions: Map<string, ComponentDefinition>;
  instances: Map<string, ComponentInstance>;
}

export interface ComponentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedProps?: Record<string, any>;
}

export interface ComponentRenderContext {
  isEditMode: boolean;
  isPreview: boolean;
  componentId: string;
  onPropsChange?: (props: Record<string, any>) => void;
  onDelete?: () => void;
  onMove?: (newPosition: ComponentPosition) => void;
}

// Component categories and metadata
export interface ComponentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: 'text',
    name: 'Text',
    description: 'Text content and typography components',
    icon: 'Type',
    order: 1
  },
  {
    id: 'media',
    name: 'Media',
    description: 'Images, videos, and media components',
    icon: 'Image',
    order: 2
  },
  {
    id: 'layout',
    name: 'Layout',
    description: 'Sections, columns, and layout components',
    icon: 'Layout',
    order: 3
  },
  {
    id: 'interactive',
    name: 'Interactive',
    description: 'Buttons, forms, and interactive components',
    icon: 'MousePointer',
    order: 4
  }
];

// Component positioning utilities
export interface PositionCalculation {
  newOrder: number;
  affectedComponents: string[];
  reorderOperations: Array<{
    componentId: string;
    oldOrder: number;
    newOrder: number;
  }>;
}

export interface ComponentHierarchy {
  componentId: string;
  parentId?: string;
  children: ComponentHierarchy[];
  depth: number;
  position: ComponentPosition;
}

// Component library events
export interface ComponentLibraryEvent {
  type: 'definition_added' | 'definition_updated' | 'definition_removed' | 
        'instance_created' | 'instance_updated' | 'instance_deleted';
  componentId: string;
  data: any;
  timestamp: string;
  userId: string;
}