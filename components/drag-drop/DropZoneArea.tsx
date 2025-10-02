'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

interface DropZoneAreaProps {
  id: string;
  className?: string;
  children?: React.ReactNode;
  placeholder?: string;
}

export function DropZoneArea({ id, className = '', children, placeholder = 'Drop components here' }: DropZoneAreaProps) {
  const { isEditMode } = useEditMode();
  const { isOver, setNodeRef } = useDroppable({ id, disabled: !isEditMode });

  if (!isEditMode && !children) {
    return null;
  }

  if (!isEditMode && children) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        ${className}
        ${isOver ? 'bg-blue-50/50 border-blue-400' : 'border-gray-200'}
        ${!children ? 'min-h-[60px] border border-dashed hover:border-gray-300' : ''}
        transition-all duration-200 rounded-lg group
      `}
    >
      {children || (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400 group-hover:text-gray-500">
          <Plus className="w-5 h-5 mb-1" />
          <p className="text-xs font-medium">{placeholder}</p>
        </div>
      )}
    </div>
  );
}