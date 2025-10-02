'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface EditableWrapperProps {
  children: React.ReactNode;
  componentId: string;
  componentType: string;
  className?: string;
}

export function EditableWrapper({ children, componentId, componentType, className = '' }: EditableWrapperProps) {
  const { isEditMode } = useEditMode();
  const [isHovered, setIsHovered] = useState(false);

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: componentId,
    data: { type: 'existing_component', componentId, componentType },
    disabled: !isEditMode
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop-${componentId}`,
    disabled: !isEditMode
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 'auto',
  } : undefined;

  return (
    <div
      ref={setDropRef}
      className={`relative ${className} ${isEditMode ? 'group' : ''} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      onMouseEnter={() => isEditMode && setIsHovered(true)}
      onMouseLeave={() => isEditMode && setIsHovered(false)}
    >
      <div
        ref={setDragRef}
        style={style}
        className={`${isDragging ? 'opacity-60' : ''} ${isEditMode && isHovered ? 'ring-1 ring-blue-300' : ''} transition-all duration-200`}
        {...listeners}
        {...attributes}
      >
        {children}
      </div>
      
      {isEditMode && isHovered && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-1 z-20 border border-gray-200">
          <div className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}