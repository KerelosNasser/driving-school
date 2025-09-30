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

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setContent((prevContent) => {
        const oldIndex = prevContent.findIndex((c) => c.content_key === active.id);
        const newIndex = prevContent.findIndex((c) => c.content_key === over.id);
        return arrayMove(content, oldIndex, newIndex);
      });
    }
  };

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-12 h-screen">
        <div className="col-span-3 p-4 bg-gray-100 overflow-y-auto border-r border-gray-200">
          <ComponentPalette userId="demo-user" userName="Demo" pageId={pageId} />
        </div>
        <div className="col-span-9 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Editing: {pageId}</h2>
          </div>
          <InPlaceDropZones pageId={pageId} />
        </div>
        {isDragging && <TrashCan />}
      </div>
    </DragDropProvider>
  );
}