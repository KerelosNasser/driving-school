'use client';

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DragDropConfig } from '../types/drag-drop';

interface DragDropProviderProps {
  children: React.ReactNode;
  config?: Partial<DragDropConfig>;
}

const defaultConfig: DragDropConfig = {
  enablePreview: true,
  enableGhostIndicators: true,
  enableDropValidation: true,
  enableRealTimeSync: true,
  maxDragDistance: 1000,
  dropZoneHighlightDelay: 100,
};

export function DragDropProvider({ children, config = {} }: DragDropProviderProps) {
  const mergedConfig = { ...defaultConfig, ...config };

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-drag-drop-config={JSON.stringify(mergedConfig)}>
        {children}
      </div>
    </DndProvider>
  );
}

export default DragDropProvider;