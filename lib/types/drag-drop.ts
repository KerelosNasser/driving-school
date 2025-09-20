/**
 * Drag and Drop System Types
 * Defines interfaces for React DnD implementation
 */

export interface DragItem {
  type: 'new_component' | 'existing_component';
  componentType?: string;
  componentId?: string;
  sourcePosition?: ComponentPosition;
  preview?: {
    name: string;
    icon: string;
    thumbnail?: string;
  };
}

export interface DropZone {
  id: string;
  type: 'section' | 'component' | 'trash';
  accepts: string[];
  position: ComponentPosition;
  isActive: boolean;
  isValid: boolean;
  canDrop?: boolean;
  isOver?: boolean;
}

export interface ComponentPosition {
  pageId: string;
  sectionId: string;
  order: number;
  parentId?: string;
}

export interface DragPreviewProps {
  item: DragItem;
  isDragging: boolean;
}

export interface DropZoneProps {
  zone: DropZone;
  onDrop: (item: DragItem, targetZone: DropZone) => void;
  children?: React.ReactNode;
}

export interface DragSourceProps {
  item: DragItem;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, dropResult?: any) => void;
  children: React.ReactNode;
}

// Drag and drop event types for real-time synchronization
export interface DragStartEvent {
  userId: string;
  userName: string;
  item: DragItem;
  timestamp: string;
}

export interface DragEndEvent {
  userId: string;
  userName: string;
  item: DragItem;
  dropResult?: {
    targetZone: DropZone;
    success: boolean;
  };
  timestamp: string;
}

export interface DropEvent {
  userId: string;
  userName: string;
  item: DragItem;
  targetZone: DropZone;
  timestamp: string;
}

// Component library types
export interface ComponentDefinition {
  id: string;
  name: string;
  category: 'text' | 'media' | 'layout' | 'interactive';
  icon: string;
  description?: string;
  defaultProps: Record<string, any>;
  schema: ComponentSchema;
  previewComponent: React.ComponentType<any>;
  editComponent: React.ComponentType<any>;
  thumbnail?: string;
}

export interface ComponentSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    default?: any;
    required?: boolean;
    description?: string;
  }>;
  required?: string[];
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
}

// Drag and drop validation types
export interface DropValidationResult {
  canDrop: boolean;
  reason?: string;
  suggestions?: string[];
}

export interface DragDropConfig {
  enablePreview: boolean;
  enableGhostIndicators: boolean;
  enableDropValidation: boolean;
  enableRealTimeSync: boolean;
  maxDragDistance?: number;
  dropZoneHighlightDelay?: number;
}