'use client';

import React, { useCallback, useState, useEffect } from 'react';
import DropZone from '@/lib/drag-drop/DropZone';
import { useEditMode } from '@/contexts/editModeContext';
import { DragItem, DropZone as DropZoneType, ComponentPosition } from '@/lib/types/drag-drop';
import { Plus, Grid, Layout } from 'lucide-react';

interface PageContent {
  [key: string]: {
    content_key: string;
    content_type: string;
    props: any;
    position?: {
      order: number;
    };
  };
}

export function InPlaceDropZones({ pageId }: { pageId: string }) {
  const { isEditMode, addComponent, moveComponent, deleteComponent } = useEditMode();
  const [content, setContent] = useState<PageContent>({});

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/pages/${pageId}`);
        if (response.ok) {
          const pageContent = await response.json();
          setContent(pageContent || {});
        }
      } catch (error) {
        console.error('Failed to fetch page content:', error);
      }
    };
    fetchContent();
  }, [pageId]);

  const handleDrop = useCallback(async (item: DragItem, targetZone: DropZoneType) => {
    try {
      if (targetZone.type === 'trash' && item.type === 'existing_component' && item.componentId) {
        // Delete component
        await deleteComponent(item.componentId);
      } else if (item.type === 'new_component' && item.componentType) {
        // Add new component
        const position: ComponentPosition = {
          pageId,
          sectionId: 'main',
          order: Object.keys(content).length
        };
        await addComponent(item.componentType, position);
      } else if (item.type === 'existing_component' && item.componentId) {
        // Move existing component
        await moveComponent(item.componentId, targetZone.position);
      }
    } catch (error) {
      console.error('Drop operation failed:', error);
    }
  }, [addComponent, moveComponent, deleteComponent, content, pageId]);

  if (!isEditMode) {
    return null;
  }

  // Create drop zones
  const mainDropZone: DropZoneType = {
    id: `main-drop-zone-${pageId}`,
    type: 'section',
    accepts: ['new_component', 'existing_component'],
    position: {
      pageId,
      sectionId: 'main',
      order: 0
    },
    isActive: true,
    isValid: true
  };

  return (
    <div className="space-y-6">
      {/* Primary Drop Zone */}
      <DropZone zone={mainDropZone} onDrop={handleDrop}>
        <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">Main Content Area</p>
              <p className="text-sm text-gray-500 mt-1">Drag components from the sidebar to add them here</p>
            </div>
          </div>
        </div>
      </DropZone>
      
      {/* Secondary Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DropZone 
          zone={{
            ...mainDropZone,
            id: `sidebar-drop-zone-${pageId}`,
            position: { ...mainDropZone.position, order: 1 }
          }} 
          onDrop={handleDrop}
        >
          <div className="text-center text-gray-400 py-8 border border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/20 transition-all duration-200">
            <div className="flex flex-col items-center space-y-2">
              <Layout className="w-6 h-6" />
              <p className="text-sm font-medium">Sidebar Area</p>
              <p className="text-xs">Drop sidebar components here</p>
            </div>
          </div>
        </DropZone>
        
        <DropZone 
          zone={{
            ...mainDropZone,
            id: `footer-drop-zone-${pageId}`,
            position: { ...mainDropZone.position, order: 2 }
          }} 
          onDrop={handleDrop}
        >
          <div className="text-center text-gray-400 py-8 border border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/20 transition-all duration-200">
            <div className="flex flex-col items-center space-y-2">
              <Grid className="w-6 h-6" />
              <p className="text-sm font-medium">Footer Area</p>
              <p className="text-xs">Drop footer components here</p>
            </div>
          </div>
        </DropZone>
      </div>
      
      {/* Component Preview Area */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Added Components</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">0 components</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          <p className="text-sm">Components you add will appear here for editing</p>
        </div>
      </div>
    </div>
  );
}
