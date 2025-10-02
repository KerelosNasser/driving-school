'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DropZoneProps } from '../types/drag-drop';

export function DropZone({ zone, onDrop, children }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: zone.id,
    data: zone,
  });

  const handleDrop = React.useCallback((item: any) => {
    if (onDrop) {
      onDrop(item, zone);
    }
  }, [onDrop, zone]);

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[100px] border-2 border-dashed rounded-lg p-4 transition-all
        ${isOver 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
      `}
    >
      {children || (
        <div className="text-center text-gray-500">
          <p>Drop components here</p>
        </div>
      )}
    </div>
  );
}

export default DropZone;