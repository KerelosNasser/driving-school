'use client';

import React from 'react';
import { DragDropProvider } from '@/lib/drag-drop/DragDropProvider';
import { DragSource } from '@/lib/drag-drop/DragSource';
import { DropZone } from '@/lib/drag-drop/DropZone';
import { DragItem, DropZone as DropZoneType } from '@/lib/types/drag-drop';

export function DragDropTest() {
  const testItem: DragItem = {
    type: 'new_component',
    componentType: 'test-component',
    preview: {
      name: 'Test Component',
      icon: '🧪'
    }
  };

  const testDropZone: DropZoneType = {
    id: 'test-drop-zone',
    type: 'section',
    accepts: ['new_component'],
    position: {
      pageId: 'test',
      sectionId: 'main',
      order: 0
    },
    isActive: true,
    isValid: true
  };

  const handleDrop = (item: DragItem, zone: DropZoneType) => {
    console.log('Dropped:', item, 'on zone:', zone);
    alert(`Successfully dropped ${item.preview?.name} on ${zone.id}`);
  };

  const handleDragEnd = (event: any) => {
    console.log('Drag ended:', event);
    
    // Check if this was a successful drop
    if (event.dropResult && event.dropResult.success) {
      const { dragItem, dropZone } = event.dropResult;
      handleDrop(dragItem, dropZone);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold">Drag & Drop Test</h2>
      
      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-8">
          {/* Draggable Item */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Draggable Item</h3>
            <DragSource
              item={testItem}
              onDragStart={(item) => console.log('Drag started:', item)}
              onDragEnd={(item) => console.log('Drag ended:', item)}
            >
              <div className="p-4 bg-blue-100 border-2 border-blue-300 rounded-lg cursor-grab active:cursor-grabbing">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🧪</span>
                  <span className="font-medium">Test Component</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Drag me to the drop zone!</p>
              </div>
            </DragSource>
          </div>

          {/* Drop Zone */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Drop Zone</h3>
            <DropZone zone={testDropZone} onDrop={handleDrop}>
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg font-medium">Drop Zone</p>
                <p className="text-sm">Drop the test component here</p>
              </div>
            </DropZone>
          </div>
        </div>
      </DragDropProvider>
    </div>
  );
}