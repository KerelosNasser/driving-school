'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { InPlaceDropZones } from './InPlaceDropZones';
import ComponentPalette from './ComponentPalette';
import DragDropProvider from '@/lib/drag-drop/DragDropProvider';
import { usePathname } from 'next/navigation';
import { useDragDrop } from '@/lib/drag-drop/useDragDrop';
import { TrashCan } from './TrashCan';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { DragEndEvent } from '@dnd-kit/core';

export function InPlaceEditor({ children }: { children: React.ReactNode }) {
  const { isEditMode } = useEditMode();
  console.log('--- InPlaceEditor rendered, isEditMode:', isEditMode);
  const { isDragging } = useDragDrop();
  const pathname = usePathname();
  const pageId = pathname === '/' ? 'home' : pathname.slice(1);
  const [content, setContent] = useState<any[]>([]);

  if (!isEditMode) {
    return <>{children}</>;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setContent((prevContent) => {
        if (!Array.isArray(prevContent) || prevContent.length === 0) {
          return prevContent;
        }
        const oldIndex = prevContent.findIndex((c) => c?.content_key === active.id);
        const newIndex = prevContent.findIndex((c) => c?.content_key === over.id);
        if (oldIndex === -1 || newIndex === -1) {
          return prevContent;
        }
        return arrayMove(prevContent, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      {/* Overlay that doesn't block interactions */}
      <div className="fixed inset-0 bg-black bg-opacity-10 z-40 pointer-events-none" />
      
      {/* DnD Interface */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="flex h-full pointer-events-auto">
            {/* Sidebar */}
            <div className="w-80 bg-white shadow-xl border-r border-gray-200 overflow-y-auto">
              <ComponentPalette userId="demo-user" userName="Demo" pageId={pageId} />
            </div>
            
            {/* Main content area */}
            <div className="flex-1 p-4 overflow-y-auto bg-white bg-opacity-90">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Editing: {pageId}</h2>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Exit Edit Mode
                </button>
              </div>
              <InPlaceDropZones pageId={pageId} />
            </div>
          </div>
          {isDragging && <TrashCan />}
        </DragDropProvider>
      </div>
      
      {/* Original content (dimmed) */}
      <div className="relative z-30 opacity-50 pointer-events-none">
        {children}
      </div>
    </>
  );
}