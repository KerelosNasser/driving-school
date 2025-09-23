'use client';

import React, { useState } from 'react';
import { useEditMode } from '@/contexts/editModeContext';
import { DragDropExample } from './DragDropExample';
import { Button } from '@/components/ui/button';

export default function EditModeHUD() {
  const { isEditMode } = useEditMode();
  const [open, setOpen] = useState(false);

  if (!isEditMode) return null;

  return (
    <div aria-hidden={!isEditMode} className="fixed bottom-6 right-6 z-[99999]">
      <div className="flex flex-col items-end space-y-2">
        {open && (
          <div className="w-[920px] max-w-full h-[520px] bg-white border rounded-lg shadow-lg overflow-auto">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-medium">Edit Mode — Drag & Drop Preview</div>
              <div>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
            <div className="p-4">
              <DragDropExample />
            </div>
          </div>
        )}

        <div>
          <Button size="sm" onClick={() => setOpen(!open)} className="bg-purple-600 text-white">
            {open ? 'Hide DnD Preview' : 'Open DnD Preview'}
          </Button>
        </div>
      </div>
    </div>
  );
}
