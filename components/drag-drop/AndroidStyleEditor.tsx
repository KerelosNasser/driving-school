'use client';

import { useEditMode } from '@/contexts/editModeContext';
import ComponentPalette from './ComponentPalette';
import DragDropProvider from '@/lib/drag-drop/DragDropProvider';
import { usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DragItem } from '@/lib/types/drag-drop';
import { X } from 'lucide-react';

export function AndroidStyleEditor({ children }: { children: React.ReactNode }) {
  const { isEditMode, toggleEditMode } = useEditMode();
  const pathname = usePathname();
  const pageId = pathname === '/' ? 'home' : pathname.slice(1);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (active && over) {
      const dragItem = active.data.current as DragItem;
      
      if (dragItem?.type === 'new_component') {
        try {
          await fetch('/api/components', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              componentType: dragItem.componentType,
              pageId,
              position: { order: Date.now() },
              props: {}
            })
          });
        } catch (error) {
          console.error('Failed to add component:', error);
        }
      }
    }
  }, [pageId]);

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      
      {/* Professional Floating Component Palette */}
      {isEditMode && (
        <div className="fixed right-6 top-24 w-72 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/50">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Components</h3>
                <p className="text-xs text-gray-500">Drag to add</p>
              </div>
              <button 
                onClick={toggleEditMode} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exit Edit Mode"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <ComponentPalette userId="demo-user" userName="Demo" pageId={pageId} />
            </div>
          </div>
        </div>
      )}
    </DragDropProvider>
  );
}