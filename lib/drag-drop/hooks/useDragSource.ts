'use client';

import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragItem } from '../../types/drag-drop';
import { useDragDrop } from './useDragDrop';

interface UseDragSourceProps {
  item: DragItem;
  userId: string;
  userName: string;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, dropResult?: any) => void;
}

export function useDragSource({ 
  item, 
  userId, 
  userName, 
  onDragStart, 
  onDragEnd 
}: UseDragSourceProps) {
  const { handleDragStart, handleDragEnd } = useDragDrop();
  const itemRef = useRef<DragItem>(item);

  // Update item reference when props change
  itemRef.current = item;

  const [{ isDragging, canDrag }, drag, preview] = useDrag({
    type: item.type,
    item: () => {
      const currentItem = itemRef.current;
      handleDragStart(currentItem, userId, userName);
      onDragStart?.(currentItem);
      return currentItem;
    },
    end: (draggedItem, monitor) => {
      const dropResult = monitor.getDropResult();
      handleDragEnd(draggedItem, dropResult, userId, userName);
      onDragEnd?.(draggedItem, dropResult);
    },
    canDrag: () => {
      // Add any custom logic to determine if item can be dragged
      return true;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
    }),
  });

  return {
    drag,
    preview,
    isDragging,
    canDrag,
    dragSourceProps: {
      ref: drag,
      'data-drag-type': item.type,
      'data-component-type': item.componentType,
      'data-component-id': item.componentId,
      'data-is-dragging': isDragging,
      'data-can-drag': canDrag,
      style: {
        opacity: isDragging ? 0.5 : 1,
        cursor: canDrag ? 'grab' : 'default',
      },
    },
  };
}