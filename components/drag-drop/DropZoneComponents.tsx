'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Move, Trash2, AlertCircle } from 'lucide-react';
import { 
  DropZone, 
  DragItem, 
  DropZone as DropZoneType, 
  ComponentPosition,
  ComponentInstance,
  useDropZone 
} from '../../lib/drag-drop';

interface SectionDropZoneProps {
  sectionId: string;
  pageId: string;
  title: string;
  children?: React.ReactNode;
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  userId: string;
  userName: string;
  className?: string;
  minHeight?: number;
  showTitle?: boolean;
  allowedComponents?: string[];
}

export function SectionDropZone({
  sectionId,
  pageId,
  title,
  children,
  onDrop,
  userId,
  userName,
  className = '',
  minHeight = 100,
  showTitle = true,
  allowedComponents = ['new_component', 'existing_component']
}: SectionDropZoneProps) {
  const zone: DropZoneType = {
    id: `section-${sectionId}`,
    type: 'section',
    accepts: allowedComponents,
    position: { pageId, sectionId, order: 0 },
    isActive: false,
    isValid: true
  };

  const { dropZoneProps, isActive, isInvalid, canDrop } = useDropZone({
    zone,
    onDrop,
    userId,
    userName
  });

  return (
    <div
      {...dropZoneProps}
      className={`
        section-drop-zone
        ${className}
        ${isActive ? 'border-blue-500 bg-blue-50' : ''}
        ${isInvalid ? 'border-red-500 bg-red-50' : ''}
        ${canDrop ? 'border-dashed border-2 border-gray-300' : 'border border-gray-200'}
        rounded-lg p-4 transition-all duration-200
      `}
      style={{ minHeight }}
    >
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Drop Zone</span>
            {canDrop && <Plus className="w-3 h-3" />}
          </div>
        </div>
      )}

      {/* Drop indicator overlay */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-90 rounded-lg z-10">
          <div className="text-center">
            <Plus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-blue-700 font-medium">Drop component here</div>
          </div>
        </div>
      )}

      {/* Invalid drop indicator */}
      {isInvalid && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-90 rounded-lg z-10">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-red-700 font-medium">Cannot drop here</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {children || (
          <div className="text-center py-8 text-gray-400">
            <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Drop components here to add them to this section</p>
            <p className="text-xs mt-1">Accepts: {allowedComponents.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ComponentDropZoneProps {
  componentId: string;
  position: ComponentPosition;
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  userId: string;
  userName: string;
  className?: string;
  showIndicator?: boolean;
}

export function ComponentDropZone({
  componentId,
  position,
  onDrop,
  userId,
  userName,
  className = '',
  showIndicator = true
}: ComponentDropZoneProps) {
  const zone: DropZoneType = {
    id: `component-${componentId}`,
    type: 'component',
    accepts: ['existing_component'],
    position,
    isActive: false,
    isValid: true
  };

  const { dropZoneProps, isActive, isInvalid, canDrop } = useDropZone({
    zone,
    onDrop,
    userId,
    userName
  });

  return (
    <div
      {...dropZoneProps}
      className={`
        component-drop-zone
        ${className}
        ${isActive ? 'border-blue-400 bg-blue-25' : ''}
        ${isInvalid ? 'border-red-400 bg-red-25' : ''}
        ${canDrop && showIndicator ? 'border-dashed border border-gray-300' : ''}
        rounded transition-all duration-150
        min-h-[40px] flex items-center justify-center
      `}
    >
      {isActive && (
        <div className="flex items-center space-x-2 text-blue-600 text-sm">
          <Move className="w-4 h-4" />
          <span>Drop to reorder</span>
        </div>
      )}

      {isInvalid && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Cannot drop here</span>
        </div>
      )}

      {!isActive && !isInvalid && showIndicator && canDrop && (
        <div className="text-gray-400 text-xs">Drop zone</div>
      )}
    </div>
  );
}

interface TrashDropZoneProps {
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  userId: string;
  userName: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function TrashDropZone({
  onDrop,
  userId,
  userName,
  className = '',
  size = 'medium'
}: TrashDropZoneProps) {
  const zone: DropZoneType = {
    id: 'trash-zone',
    type: 'trash',
    accepts: ['existing_component'],
    position: { pageId: 'trash', sectionId: 'deleted', order: -1 },
    isActive: false,
    isValid: true
  };

  const { dropZoneProps, isActive, isInvalid, canDrop } = useDropZone({
    zone,
    onDrop,
    userId,
    userName
  });

  const sizeClasses = {
    small: 'p-2 text-sm',
    medium: 'p-4 text-base',
    large: 'p-6 text-lg'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div
      {...dropZoneProps}
      className={`
        trash-drop-zone
        ${className}
        ${sizeClasses[size]}
        ${isActive ? 'border-red-500 bg-red-100' : 'border-red-300 bg-red-50'}
        ${isInvalid ? 'border-gray-400 bg-gray-100' : ''}
        border-2 border-dashed rounded-lg
        transition-all duration-200
        text-center
      `}
    >
      <div className="flex flex-col items-center space-y-2">
        <Trash2 className={`${iconSizes[size]} ${isActive ? 'text-red-700' : 'text-red-500'}`} />
        <div className={`font-medium ${isActive ? 'text-red-800' : 'text-red-600'}`}>
          {isActive ? 'Drop to Delete' : 'Trash'}
        </div>
        {size !== 'small' && (
          <div className="text-xs text-red-500">
            Drop existing components here to remove them
          </div>
        )}
      </div>
    </div>
  );
}

interface PositionIndicatorProps {
  position: ComponentPosition;
  isActive?: boolean;
  showDetails?: boolean;
}

export function PositionIndicator({ 
  position, 
  isActive = false, 
  showDetails = false 
}: PositionIndicatorProps) {
  return (
    <div className={`
      position-indicator
      ${isActive ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'}
      border rounded px-2 py-1 text-xs
    `}>
      {showDetails ? (
        <div className="space-y-1">
          <div><strong>Page:</strong> {position.pageId}</div>
          <div><strong>Section:</strong> {position.sectionId}</div>
          <div><strong>Order:</strong> {position.order}</div>
          {position.parentId && (
            <div><strong>Parent:</strong> {position.parentId}</div>
          )}
        </div>
      ) : (
        <span>
          {position.sectionId}:{position.order}
          {position.parentId && ` (${position.parentId})`}
        </span>
      )}
    </div>
  );
}

interface DropZonePreviewProps {
  item: DragItem;
  targetPosition: ComponentPosition;
  isValid: boolean;
}

export function DropZonePreview({ item, targetPosition, isValid }: DropZonePreviewProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [item, targetPosition]);

  if (!isVisible) return null;

  return (
    <div className={`
      drop-zone-preview
      fixed top-4 right-4 z-50
      ${isValid ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}
      border rounded-lg p-3 shadow-lg
      transition-all duration-300
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {item.preview?.icon && (
            <span className="text-lg">{item.preview.icon}</span>
          )}
        </div>
        <div className="flex-1">
          <div className={`font-medium ${isValid ? 'text-green-800' : 'text-red-800'}`}>
            {isValid ? 'Valid Drop Position' : 'Invalid Drop Position'}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <div><strong>Component:</strong> {item.preview?.name || item.componentType}</div>
            <div><strong>Target:</strong> {targetPosition.sectionId}:{targetPosition.order}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SmartDropZoneProps {
  pageId: string;
  sectionId: string;
  existingComponents: ComponentInstance[];
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  userId: string;
  userName: string;
  className?: string;
  maxComponents?: number;
  allowedTypes?: string[];
}

export function SmartDropZone({
  pageId,
  sectionId,
  existingComponents,
  onDrop,
  userId,
  userName,
  className = '',
  maxComponents,
  allowedTypes = ['new_component', 'existing_component']
}: SmartDropZoneProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLayoutAdjusting, setIsLayoutAdjusting] = useState(false);

  const createDropZone = (order: number): DropZoneType => ({
    id: `smart-${sectionId}-${order}`,
    type: 'component',
    accepts: allowedTypes,
    position: { pageId, sectionId, order },
    isActive: false,
    isValid: true
  });

  const handleDropWithLayout = async (item: DragItem, targetZone: DropZoneType) => {
    setIsLayoutAdjusting(true);
    try {
      await onDrop(item, targetZone);
      // Trigger layout recalculation
      setTimeout(() => setIsLayoutAdjusting(false), 300);
    } catch (error) {
      console.error('Drop with layout adjustment failed:', error);
      setIsLayoutAdjusting(false);
    }
  };

  const canAcceptMoreComponents = !maxComponents || existingComponents.length < maxComponents;

  return (
    <div className={`smart-drop-zone ${className} ${isLayoutAdjusting ? 'adjusting-layout' : ''}`}>
      {/* Drop zone before first component */}
      {canAcceptMoreComponents && (
        <ComponentDropZone
          componentId="start"
          position={{ pageId, sectionId, order: 0 }}
          onDrop={handleDropWithLayout}
          userId={userId}
          userName={userName}
          showIndicator={dragOverIndex === 0}
        />
      )}

      {/* Existing components with drop zones between them */}
      {existingComponents.map((component, index) => (
        <div key={component.id} className="component-with-zones">
          {/* Component placeholder */}
          <div className="existing-component-placeholder">
            <div className="component-header">
              <span className="component-type">{component.type}</span>
              <span className="component-id">#{component.id.slice(-6)}</span>
            </div>
            <div className="component-meta">
              <span className="component-order">Position: {component.position.order}</span>
              {component.position.parentId && (
                <span className="component-parent">Parent: {component.position.parentId}</span>
              )}
            </div>
          </div>

          {/* Drop zone after component */}
          {canAcceptMoreComponents && (
            <ComponentDropZone
              componentId={component.id}
              position={{ pageId, sectionId, order: index + 1 }}
              onDrop={handleDropWithLayout}
              userId={userId}
              userName={userName}
              showIndicator={dragOverIndex === index + 1}
            />
          )}
        </div>
      ))}

      {/* Empty state when no components */}
      {existingComponents.length === 0 && canAcceptMoreComponents && (
        <SectionDropZone
          sectionId={sectionId}
          pageId={pageId}
          title="Empty Section"
          onDrop={handleDropWithLayout}
          userId={userId}
          userName={userName}
          showTitle={false}
          className="empty-smart-zone"
        />
      )}

      {/* Max components reached indicator */}
      {!canAcceptMoreComponents && (
        <div className="max-components-indicator">
          <div className="max-components-message">
            Maximum components reached ({maxComponents})
          </div>
        </div>
      )}
    </div>
  );
}

interface NestedDropZoneProps {
  parentId: string;
  parentType: string;
  level: number;
  maxNestingLevel?: number;
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  userId: string;
  userName: string;
  children?: React.ReactNode;
}

export function NestedDropZone({
  parentId,
  parentType,
  level,
  maxNestingLevel = 3,
  onDrop,
  userId,
  userName,
  children
}: NestedDropZoneProps) {
  const canNest = level < maxNestingLevel;
  const nestingClass = `nesting-level-${Math.min(level, 3)}`;

  const zone: DropZoneType = {
    id: `nested-${parentId}-${level}`,
    type: 'component',
    accepts: canNest ? ['new_component', 'existing_component'] : [],
    position: { 
      pageId: 'nested', 
      sectionId: parentId, 
      order: 0, 
      parentId 
    },
    isActive: false,
    isValid: canNest
  };

  const { dropZoneProps, isActive, isInvalid, canDrop } = useDropZone({
    zone,
    onDrop,
    userId,
    userName
  });

  return (
    <div
      {...dropZoneProps}
      className={`
        nested-drop-zone ${nestingClass}
        ${isActive ? 'nested-active' : ''}
        ${isInvalid ? 'nested-invalid' : ''}
        ${canDrop ? 'nested-can-drop' : ''}
        border-l-2 ml-4 pl-4
        ${canNest ? 'border-blue-200' : 'border-gray-200'}
      `}
      style={{
        marginLeft: `${level * 16}px`,
        borderLeftColor: canNest ? '#dbeafe' : '#e5e7eb'
      }}
    >
      {/* Nesting level indicator */}
      <div className="nesting-indicator">
        <span className="nesting-level">Level {level}</span>
        <span className="parent-type">{parentType}</span>
        {!canNest && (
          <span className="max-nesting-warning">Max nesting reached</span>
        )}
      </div>

      {/* Drop area */}
      {canNest && (
        <div className="nested-drop-area">
          {isActive && (
            <div className="nested-drop-feedback">
              <Plus className="w-4 h-4" />
              <span>Drop to nest inside {parentType}</span>
            </div>
          )}
          
          {isInvalid && (
            <div className="nested-invalid-feedback">
              <AlertCircle className="w-4 h-4" />
              <span>Cannot nest here</span>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}