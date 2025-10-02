'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { DragSourceProps } from '../types/drag-drop';

export function DragSource({ item, onDragStart, onDragEnd, children }: DragSourceProps) {
  const dragId = `${item.type}-${item.componentType || 'unknown'}-${Date.now()}`;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: item,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 'auto',
  } : undefined;

  // Handle drag start
  React.useEffect(() => {
    if (isDragging && onDragStart) {
      onDragStart(item);
    }
  }, [isDragging, item, onDragStart]);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={isDragging ? 'opacity-50' : ''}
    >
      {children}
    </div>
  );
}

export default DragSource;