
'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import { Trash2 } from 'lucide-react';
import { useEditMode } from '@/contexts/editModeContext';
import { DragItem } from '@/lib/types/drag-drop';

export function TrashCan() {
  const { deleteComponent } = useEditMode();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'existing_component',
    drop: (item: DragItem) => {
      if (item.componentId) {
        deleteComponent(item.componentId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`fixed bottom-10 right-10 z-50 p-4 rounded-full transition-all duration-200 ${
        isActive ? 'bg-red-500 scale-110' : 'bg-gray-800'
      }`}
    >
      <Trash2 className={`text-white h-8 w-8 transition-all duration-200 ${isActive ? 'rotate-12' : ''}`} />
    </div>
  );
}
