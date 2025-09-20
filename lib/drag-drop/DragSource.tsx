'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { DragItem, DragSourceProps } from '../types/drag-drop';

export function DragSource({ 
  item, 
  onDragStart, 
  onDragEnd, 
  children 
}: DragSourceProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: item.type,
    item: () => {
      onDragStart?.(item);
      return item;
    },
    end: (draggedItem, monitor) => {
      const dropResult = monitor.getDropResult();
      onDragEnd?.(draggedItem, dropResult);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
      className={`drag-source ${isDragging ? 'dragging' : ''}`}
    >
      {children}
    </div>
  );
}

export default DragSource;