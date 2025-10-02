'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import { DragItem } from '../types/drag-drop';

interface DragDropProviderProps {
  children: React.ReactNode;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
}

export function DragDropProvider({ children, onDragEnd, onDragStart }: DragDropProviderProps) {
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 8,
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current as DragItem);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    onDragEnd?.(event);
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeItem && (
          <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg opacity-90 transform rotate-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{activeItem.preview?.icon}</span>
              <span className="font-medium text-gray-800">{activeItem.preview?.name}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default DragDropProvider;