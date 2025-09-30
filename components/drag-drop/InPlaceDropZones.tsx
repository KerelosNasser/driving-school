
'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { DropZone } from '@/lib/drag-drop';
import { useEditMode } from '@/contexts/editModeContext';
import { DragItem, DropZone as DropZoneType } from '@/lib/types/drag-drop';

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function InPlaceDropZones({ pageId }: { pageId: string }) {
  const { isEditMode, addComponent, moveComponent, deleteComponent } = useEditMode();
  const [content, setContent] = useState<PageContent>({});

  useEffect(() => {
    const fetchContent = async () => {
      const response = await fetch(`/api/pages/${pageId}`);
      if (response.ok) {
        const pageContent = await response.json();
        setContent(pageContent);
      }
    };
    fetchContent();
  }, [pageId]);

  const handleDrop = useCallback(async (item: DragItem, targetZone: DropZoneType) => {
    try {
      if (targetZone.type === 'trash' && item.type === 'existing_component' && item.componentId) {
        // Delete component
        await deleteComponent(item.componentId);
      } else if (item.type === 'new_component' && item.componentType) {
        // Add new component
        await addComponent(item.componentType, targetZone.position);
      } else if (item.type === 'existing_component' && item.componentId) {
        // Move existing component
        await moveComponent(item.componentId, targetZone.position);
      }
    } catch (error) {
      console.error('Drop operation failed:', error);
    }
  }, [addComponent, moveComponent, deleteComponent]);

  if (!isEditMode) {
    return null;
  }

  const renderComponents = () => {
    const components = Object.values(content).filter(c => c.position).sort((a, b) => a.position.order - b.position.order);

    return (
      <SortableContext items={components.map(c => c.content_key)} strategy={verticalListSortingStrategy}>
        {components.map((component, index) => {
          const Component = isEditMode ? componentMap[component.content_type]?.edit : componentMap[component.content_type]?.preview;

          if (!Component) {
            return null;
          }

          return (
            <SortableItem key={component.content_key} id={component.content_key}>
              <div data-component-id={component.content_key}>
                <Component {...component.props} />
              </div>
            </SortableItem>
          );
        })}
      </SortableContext>
    );
  };

  return <div>{renderComponents()}</div>;
}
