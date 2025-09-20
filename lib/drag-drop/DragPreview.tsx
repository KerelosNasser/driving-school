'use client';

import React from 'react';
import { DragPreviewProps } from '../types/drag-drop';

export function DragPreview({ item, isDragging }: DragPreviewProps) {
  if (!isDragging || !item.preview) {
    return null;
  }

  return (
    <div className="drag-preview fixed pointer-events-none z-50 bg-white shadow-lg rounded-lg border p-3 max-w-xs">
      <div className="flex items-center space-x-3">
        {item.preview.icon && (
          <div className="flex-shrink-0">
            <span className="text-2xl">{item.preview.icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {item.preview.name}
          </div>
          <div className="text-xs text-gray-500">
            {item.type === 'new_component' ? 'New Component' : 'Move Component'}
          </div>
        </div>
      </div>
      {item.preview.thumbnail && (
        <div className="mt-2">
          <img 
            src={item.preview.thumbnail} 
            alt={item.preview.name}
            className="w-full h-16 object-cover rounded border"
          />
        </div>
      )}
    </div>
  );
}

export default DragPreview;