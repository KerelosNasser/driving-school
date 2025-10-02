'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { useEditMode } from '@/contexts/editModeContext';

export function TrashCan() {
  const { deleteComponent } = useEditMode();
  const { isOver, setNodeRef } = useDroppable({
    id: 'trash-can',
    data: {
      type: 'trash',
      accepts: ['existing_component']
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-10 right-10 z-50 p-4 rounded-full transition-all duration-200 ${
        isOver ? 'bg-red-500 scale-110' : 'bg-gray-800'
      }`}
    >
      <Trash2 className={`text-white h-8 w-8 transition-all duration-200 ${isOver ? 'rotate-12' : ''}`} />
    </div>
  );
}
