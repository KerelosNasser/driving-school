'use client';

import React, { useState } from 'react';
import { 
  DragDropProvider, 
  DragSource, 
  DropZone, 
  DragItem, 
  DropZone as DropZoneType,
  useDragDrop 
} from '../../lib/drag-drop';

// Example component to demonstrate drag and drop functionality
export function DragDropExample() {
  const [droppedItems, setDroppedItems] = useState<DragItem[]>([]);
  const { isDragging, currentDragItem } = useDragDrop();

  // Sample drag items
  const sampleItems: DragItem[] = [
    {
      type: 'new_component',
      componentType: 'text',
      preview: {
        name: 'Text Component',
        icon: '📝',
      }
    },
    {
      type: 'new_component',
      componentType: 'image',
      preview: {
        name: 'Image Component',
        icon: '🖼️',
      }
    },
    {
      type: 'new_component',
      componentType: 'button',
      preview: {
        name: 'Button Component',
        icon: '🔘',
      }
    }
  ];

  // Sample drop zones
  const dropZones: DropZoneType[] = [
    {
      id: 'main-content',
      type: 'section',
      accepts: ['new_component', 'existing_component'],
      position: { pageId: 'home', sectionId: 'main', order: 0 },
      isActive: false,
      isValid: true
    },
    {
      id: 'sidebar',
      type: 'section',
      accepts: ['new_component'],
      position: { pageId: 'home', sectionId: 'sidebar', order: 0 },
      isActive: false,
      isValid: true
    },
    {
      id: 'trash',
      type: 'trash',
      accepts: ['existing_component'],
      position: { pageId: 'trash', sectionId: 'deleted', order: -1 },
      isActive: false,
      isValid: true
    }
  ];

  const handleDrop = (item: DragItem, targetZone: DropZoneType) => {
    console.log('Dropped item:', item, 'in zone:', targetZone);
    
    if (targetZone.type === 'trash') {
      // Remove item from dropped items
      setDroppedItems(prev => prev.filter(droppedItem => 
        droppedItem.componentId !== item.componentId
      ));
    } else {
      // Add item to dropped items
      const newItem = {
        ...item,
        componentId: `${item.componentType}-${Date.now()}`,
        sourcePosition: targetZone.position
      };
      setDroppedItems(prev => [...prev, newItem]);
    }
  };

  return (
    <DragDropProvider>
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Drag and Drop Example</h2>
        
        {/* Status indicator */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <div className="text-sm">
            <strong>Status:</strong> {isDragging ? 'Dragging' : 'Idle'}
          </div>
          {currentDragItem && (
            <div className="text-sm text-blue-600">
              <strong>Current Item:</strong> {currentDragItem.preview?.name || currentDragItem.componentType}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Component Palette */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Component Palette</h3>
            <div className="space-y-3">
              {sampleItems.map((item, index) => (
                <DragSource
                  key={index}
                  item={item}
                  onDragStart={(dragItem) => console.log('Drag started:', dragItem)}
                  onDragEnd={(dragItem, result) => console.log('Drag ended:', dragItem, result)}
                >
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-grab hover:bg-blue-100 transition-colors">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{item.preview?.icon}</span>
                      <span className="font-medium">{item.preview?.name}</span>
                    </div>
                  </div>
                </DragSource>
              ))}
            </div>
          </div>

          {/* Drop Zones */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold">Drop Zones</h3>
            
            {dropZones.slice(0, 2).map((zone) => (
              <DropZone
                key={zone.id}
                zone={zone}
                onDrop={handleDrop}
              >
                <div className="p-4">
                  <h4 className="font-medium mb-2 capitalize">
                    {zone.id.replace('-', ' ')} Zone
                  </h4>
                  <div className="text-sm text-gray-600 mb-3">
                    Accepts: {zone.accepts.join(', ')}
                  </div>
                  
                  {/* Show dropped items in this zone */}
                  <div className="space-y-2">
                    {droppedItems
                      .filter(item => item.sourcePosition?.sectionId === zone.position.sectionId)
                      .map((item, index) => (
                        <DragSource
                          key={item.componentId}
                          item={{
                            ...item,
                            type: 'existing_component'
                          }}
                        >
                          <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center space-x-2">
                            <span>{item.preview?.icon}</span>
                            <span className="text-sm">{item.preview?.name}</span>
                            <span className="text-xs text-gray-500">#{item.componentId?.slice(-4)}</span>
                          </div>
                        </DragSource>
                      ))}
                  </div>
                  
                  {droppedItems.filter(item => 
                    item.sourcePosition?.sectionId === zone.position.sectionId
                  ).length === 0 && (
                    <div className="text-gray-400 text-sm italic">
                      Drop components here
                    </div>
                  )}
                </div>
              </DropZone>
            ))}

            {/* Trash Zone */}
            <DropZone
              zone={dropZones[2]}
              onDrop={handleDrop}
            >
              <div className="p-4 bg-red-50 border-2 border-dashed border-red-200 rounded-lg">
                <h4 className="font-medium mb-2 text-red-700">🗑️ Trash Zone</h4>
                <div className="text-sm text-red-600">
                  Drop existing components here to delete them
                </div>
              </div>
            </DropZone>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Debug Info</h4>
          <div className="text-sm space-y-1">
            <div><strong>Total Dropped Items:</strong> {droppedItems.length}</div>
            <div><strong>Is Dragging:</strong> {isDragging ? 'Yes' : 'No'}</div>
            {droppedItems.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Dropped Items Details</summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(droppedItems, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
}