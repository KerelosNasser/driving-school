'use client';

import { useEditMode } from '@/contexts/editModeContext';
import { InPlaceDropZones } from './InPlaceDropZones';
import ComponentPalette from './ComponentPalette';
import DragDropProvider from '@/lib/drag-drop/DragDropProvider';
import { usePathname } from 'next/navigation';
import { TrashCan } from './TrashCan';
import { useState, useCallback } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DragItem } from '@/lib/types/drag-drop';
import { X, Eye, EyeOff, Save, Undo, Redo } from 'lucide-react';

export function EnhancedInPlaceEditor({ children }: { children: React.ReactNode }) {
  const { isEditMode, toggleEditMode } = useEditMode();
  const pathname = usePathname();
  const pageId = pathname === '/' ? 'home' : pathname.slice(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (active && over) {
      const dragItem = active.data.current as DragItem;
      
      if (dragItem?.type === 'new_component' && over.id !== 'trash-can') {
        try {
          const response = await fetch('/api/components', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              componentType: dragItem.componentType,
              pageId,
              position: { x: 0, y: 0, order: Date.now() },
              props: {}
            })
          });
          
          if (response.ok) {
            setHasChanges(true);
            // Success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] animate-slide-in';
            notification.innerHTML = `
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span>${dragItem.preview?.name} added successfully!</span>
              </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
          }
        } catch (error) {
          console.error('Failed to add component:', error);
          // Error notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999]';
          notification.textContent = 'Failed to add component. Please try again.';
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      }
    }
  }, [pageId]);

  const handleSave = async () => {
    setHasChanges(false);
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999]';
    notification.textContent = 'Changes saved successfully!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  if (!isEditMode) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Enhanced backdrop with subtle animation */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/40 to-purple-50/40 backdrop-blur-[1px] z-40 pointer-events-none animate-fade-in" />
      
      {/* Edit Mode Interface */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex h-full">
            {/* Enhanced Component Palette Sidebar */}
            <div className="w-80 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-gray-200/50 pointer-events-auto animate-slide-in-left">
              <div className="h-full flex flex-col">
                {/* Enhanced Header */}
                <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Component Library</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-100">Ready to drag</span>
                      </div>
                    </div>
                    <button
                      onClick={toggleEditMode}
                      className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Exit Edit Mode"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                
                {/* Component List with enhanced styling */}
                <div className="flex-1 overflow-y-auto">
                  <ComponentPalette userId="demo-user" userName="Demo" pageId={pageId} />
                </div>
              </div>
            </div>
            
            {/* Enhanced Main Edit Area */}
            <div className="flex-1 flex flex-col pointer-events-auto">
              {/* Enhanced Top Toolbar */}
              <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-gray-800">Editing: {pageId}</h1>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm text-gray-600">Live Edit Mode</span>
                    </div>
                    {hasChanges && (
                      <div className="flex items-center space-x-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>Unsaved changes</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Action buttons */}
                    <button
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
                      title={showOriginal ? 'Hide original content' : 'Show original content'}
                    >
                      {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="text-sm">{showOriginal ? 'Hide' : 'Show'} Original</span>
                    </button>
                    
                    <button
                      onClick={() => {/* Implement undo */}}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Undo"
                    >
                      <Undo className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {/* Implement redo */}}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Redo"
                    >
                      <Redo className="w-4 h-4" />
                    </button>
                    
                    {hasChanges && (
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    )}
                    
                    <button
                      onClick={toggleEditMode}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium hover:scale-105"
                    >
                      Exit Edit Mode
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Drop Zones Area */}
              <div className="flex-1 p-6 overflow-y-auto">
                <InPlaceDropZones pageId={pageId} />
              </div>
            </div>
          </div>
          
          {/* Enhanced Trash Can */}
          {isDragging && <TrashCan />}
        </DragDropProvider>
      </div>
      
      {/* Enhanced Original Content with smooth transitions */}
      <div className={`relative z-30 transition-all duration-500 ease-in-out ${
        showOriginal ? 'opacity-30 scale-[0.98]' : 'opacity-0 pointer-events-none scale-95'
      }`}>
        {children}
      </div>
      
      {/* Custom styles */}
      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}