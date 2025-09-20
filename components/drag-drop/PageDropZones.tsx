'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DropZone } from '../../lib/drag-drop/DropZone';
import { useDragDrop } from '../../lib/drag-drop';
import { DragItem, DropZone as DropZoneType, ComponentPosition } from '../../lib/types/drag-drop';
import { useEditMode } from '../../contexts/editModeContext';
import { Plus, Trash2, Move } from 'lucide-react';

interface PageDropZonesProps {
  pageName: string;
  sections: PageSection[];
  onComponentAdd?: (componentType: string, position: ComponentPosition) => void;
  onComponentMove?: (componentId: string, newPosition: ComponentPosition) => void;
  onComponentDelete?: (componentId: string) => void;
  className?: string;
}

interface PageSection {
  id: string;
  name: string;
  type: 'header' | 'main' | 'sidebar' | 'footer';
  allowedComponents?: string[];
  maxComponents?: number;
  currentComponents?: ComponentInstance[];
}

interface ComponentInstance {
  id: string;
  type: string;
  position: ComponentPosition;
  props: Record<string, any>;
}

export function PageDropZones({
  pageName,
  sections,
  onComponentAdd,
  onComponentMove,
  onComponentDelete,
  className = ''
}: PageDropZonesProps) {
  const { isEditMode, addComponent, moveComponent, deleteComponent } = useEditMode();
  const { isDragging, currentDragItem, registerDropZone, unregisterDropZone } = useDragDrop();
  const [dropZones, setDropZones] = useState<DropZoneType[]>([]);

  // Create drop zones for each section
  useEffect(() => {
    if (!isEditMode) return;

    const zones: DropZoneType[] = [];

    // Create section drop zones
    sections.forEach((section, sectionIndex) => {
      // Main section drop zone
      const sectionZone: DropZoneType = {
        id: `section-${section.id}`,
        type: 'section',
        accepts: ['new_component', 'existing_component'],
        position: {
          pageId: pageName,
          sectionId: section.id,
          order: 0
        },
        isActive: false,
        isValid: true
      };

      zones.push(sectionZone);

      // Create drop zones between existing components
      if (section.currentComponents) {
        section.currentComponents.forEach((component, componentIndex) => {
          // Drop zone before component
          const beforeZone: DropZoneType = {
            id: `before-${component.id}`,
            type: 'component',
            accepts: ['new_component', 'existing_component'],
            position: {
              pageId: pageName,
              sectionId: section.id,
              order: componentIndex
            },
            isActive: false,
            isValid: true
          };

          zones.push(beforeZone);

          // Drop zone after last component
          if (componentIndex === section.currentComponents.length - 1) {
            const afterZone: DropZoneType = {
              id: `after-${component.id}`,
              type: 'component',
              accepts: ['new_component', 'existing_component'],
              position: {
                pageId: pageName,
                sectionId: section.id,
                order: componentIndex + 1
              },
              isActive: false,
              isValid: true
            };

            zones.push(afterZone);
          }
        });
      }
    });

    // Add trash zone
    const trashZone: DropZoneType = {
      id: 'trash-zone',
      type: 'trash',
      accepts: ['existing_component'],
      position: {
        pageId: 'trash',
        sectionId: 'deleted',
        order: -1
      },
      isActive: false,
      isValid: true
    };

    zones.push(trashZone);

    setDropZones(zones);

    // Register zones with drag drop manager
    zones.forEach(zone => registerDropZone(zone));

    // Cleanup
    return () => {
      zones.forEach(zone => unregisterDropZone(zone.id));
    };
  }, [isEditMode, sections, pageName, registerDropZone, unregisterDropZone]);

  const handleDrop = useCallback(async (item: DragItem, targetZone: DropZoneType) => {
    try {
      if (targetZone.type === 'trash' && item.type === 'existing_component' && item.componentId) {
        // Delete component
        await deleteComponent(item.componentId);
        onComponentDelete?.(item.componentId);
      } else if (item.type === 'new_component' && item.componentType) {
        // Add new component
        const componentId = await addComponent(item.componentType, targetZone.position);
        onComponentAdd?.(item.componentType, targetZone.position);
      } else if (item.type === 'existing_component' && item.componentId) {
        // Move existing component
        await moveComponent(item.componentId, targetZone.position);
        onComponentMove?.(item.componentId, targetZone.position);
      }
    } catch (error) {
      console.error('Drop operation failed:', error);
    }
  }, [addComponent, moveComponent, deleteComponent, onComponentAdd, onComponentMove, onComponentDelete]);

  if (!isEditMode) {
    return null;
  }

  return (
    <div className={`page-drop-zones ${className}`}>
      {/* Section Drop Zones */}
      {sections.map((section) => (
        <SectionDropZone
          key={section.id}
          section={section}
          pageName={pageName}
          onDrop={handleDrop}
          isDragging={isDragging}
          currentDragItem={currentDragItem}
        />
      ))}

      {/* Trash Zone - Fixed position */}
      {isDragging && currentDragItem?.type === 'existing_component' && (
        <TrashDropZone
          onDrop={handleDrop}
          isDragging={isDragging}
        />
      )}

      {/* Drop Zone Indicators */}
      {isDragging && (
        <DropZoneIndicators
          zones={dropZones}
          currentDragItem={currentDragItem}
        />
      )}
    </div>
  );
}

interface SectionDropZoneProps {
  section: PageSection;
  pageName: string;
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  isDragging: boolean;
  currentDragItem: DragItem | null;
}

function SectionDropZone({
  section,
  pageName,
  onDrop,
  isDragging,
  currentDragItem
}: SectionDropZoneProps) {
  const sectionZone: DropZoneType = {
    id: `section-${section.id}`,
    type: 'section',
    accepts: ['new_component', 'existing_component'],
    position: {
      pageId: pageName,
      sectionId: section.id,
      order: section.currentComponents?.length || 0
    },
    isActive: false,
    isValid: true
  };

  const showDropZone = isDragging && (
    !section.currentComponents?.length || 
    (section.maxComponents && section.currentComponents.length < section.maxComponents)
  );

  return (
    <div className={`section-drop-zone section-${section.type}`} data-section={section.id}>
      {/* Section Header */}
      <div className="section-header">
        <h3 className="section-title">{section.name}</h3>
        {isDragging && (
          <div className="section-info">
            <span className="component-count">
              {section.currentComponents?.length || 0}
              {section.maxComponents && ` / ${section.maxComponents}`}
            </span>
          </div>
        )}
      </div>

      {/* Component Drop Zones */}
      <div className="component-zones">
        {section.currentComponents?.map((component, index) => (
          <React.Fragment key={component.id}>
            {/* Drop zone before component */}
            {isDragging && (
              <ComponentDropZone
                position={{
                  pageId: pageName,
                  sectionId: section.id,
                  order: index
                }}
                onDrop={onDrop}
                label={`Before ${component.type}`}
              />
            )}

            {/* Component placeholder */}
            <div className="component-placeholder" data-component-id={component.id}>
              <div className="component-info">
                <span className="component-type">{component.type}</span>
                <Move className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Drop zone after last component */}
            {index === section.currentComponents.length - 1 && isDragging && (
              <ComponentDropZone
                position={{
                  pageId: pageName,
                  sectionId: section.id,
                  order: index + 1
                }}
                onDrop={onDrop}
                label={`After ${component.type}`}
              />
            )}
          </React.Fragment>
        ))}

        {/* Main section drop zone (when empty or has space) */}
        {showDropZone && (
          <DropZone zone={sectionZone} onDrop={onDrop}>
            <div className="empty-section-drop-zone">
              <Plus className="w-8 h-8 text-gray-400" />
              <span className="drop-zone-label">
                Drop components here
              </span>
              {section.allowedComponents && (
                <div className="allowed-components">
                  <span className="text-xs text-gray-500">
                    Accepts: {section.allowedComponents.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </DropZone>
        )}
      </div>
    </div>
  );
}

interface ComponentDropZoneProps {
  position: ComponentPosition;
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  label: string;
}

function ComponentDropZone({ position, onDrop, label }: ComponentDropZoneProps) {
  const zone: DropZoneType = {
    id: `pos-${position.sectionId}-${position.order}`,
    type: 'component',
    accepts: ['new_component', 'existing_component'],
    position,
    isActive: false,
    isValid: true
  };

  return (
    <DropZone zone={zone} onDrop={onDrop}>
      <div className="component-drop-zone">
        <div className="drop-indicator">
          <div className="drop-line" />
          <span className="drop-label">{label}</span>
        </div>
      </div>
    </DropZone>
  );
}

interface TrashDropZoneProps {
  onDrop: (item: DragItem, targetZone: DropZoneType) => void;
  isDragging: boolean;
}

function TrashDropZone({ onDrop, isDragging }: TrashDropZoneProps) {
  const trashZone: DropZoneType = {
    id: 'trash-zone',
    type: 'trash',
    accepts: ['existing_component'],
    position: {
      pageId: 'trash',
      sectionId: 'deleted',
      order: -1
    },
    isActive: false,
    isValid: true
  };

  return (
    <div className="trash-drop-zone-container">
      <DropZone zone={trashZone} onDrop={onDrop}>
        <div className="trash-drop-zone">
          <Trash2 className="w-6 h-6 text-red-500" />
          <span className="trash-label">Drop to delete</span>
        </div>
      </DropZone>
    </div>
  );
}

interface DropZoneIndicatorsProps {
  zones: DropZoneType[];
  currentDragItem: DragItem | null;
}

function DropZoneIndicators({ zones, currentDragItem }: DropZoneIndicatorsProps) {
  if (!currentDragItem) return null;

  return (
    <div className="drop-zone-indicators">
      {zones.map((zone) => (
        <div
          key={zone.id}
          className={`drop-zone-indicator ${zone.type} ${zone.isActive ? 'active' : ''}`}
          data-zone-id={zone.id}
        />
      ))}
    </div>
  );
}

export default PageDropZones;