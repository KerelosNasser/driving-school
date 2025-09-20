'use client';

import React, { useState, useEffect } from 'react';
import { Undo, Redo, Users, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react';
import { useRealtimeDragDrop } from '../../lib/drag-drop/hooks/useRealtimeDragDrop';
import { ComponentPalette } from './ComponentPalette';
import { GhostIndicators, CollaborativeDragIndicator } from './GhostIndicators';
import { AdvancedPositioning } from './AdvancedPositioning';
import { SmartDropZone, TrashDropZone } from './DropZoneComponents';
import { DragItem, DropZone, ComponentInstance } from '../../lib/drag-drop';
import { useEditMode } from '../../contexts/editModeContext';

interface RealtimeDragDropExampleProps {
  pageName: string;
  userId: string;
  userName: string;
  initialComponents?: ComponentInstance[];
  onComponentsChange?: (components: ComponentInstance[]) => void;
}

export function RealtimeDragDropExample({
  pageName,
  userId,
  userName,
  initialComponents = [],
  onComponentsChange
}: RealtimeDragDropExampleProps) {
  const { isEditMode } = useEditMode();
  const [components, setComponents] = useState<ComponentInstance[]>(initialComponents);
  const [showGhosts, setShowGhosts] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'positioning'>('visual');

  const {
    isDragging,
    currentDragItem,
    activeZones,
    ghosts,
    undoRedoState,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    broadcastGhostPosition,
    undo,
    redo,
    canUndo,
    canRedo,
    registerDropZone,
    unregisterDropZone,
    validateDrop,
    isRealtimeConnected,
    realtimeStatus
  } = useRealtimeDragDrop({
    pageName,
    userId,
    userName,
    enableRealtime: true,
    enableUndoRedo: true,
    enableGhostIndicators: showGhosts
  });

  // Update components when they change
  useEffect(() => {
    onComponentsChange?.(components);
  }, [components, onComponentsChange]);

  // Handle drop operations
  const handleComponentDrop = async (item: DragItem, targetZone: DropZone) => {
    const success = handleDrop(item, targetZone);
    
    if (success) {
      if (item.type === 'new_component' && item.componentType) {
        // Add new component
        const newComponent: ComponentInstance = {
          id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: item.componentType,
          position: targetZone.position,
          props: item.preview?.thumbnail ? { thumbnail: item.preview.thumbnail } : {},
          version: '1.0.0',
          createdBy: userName,
          createdAt: new Date().toISOString(),
          lastModifiedBy: userName,
          lastModifiedAt: new Date().toISOString()
        };
        
        setComponents(prev => [...prev, newComponent]);
      } else if (item.type === 'existing_component' && item.componentId) {
        // Move existing component
        setComponents(prev => prev.map(comp => 
          comp.id === item.componentId 
            ? { ...comp, position: targetZone.position, lastModifiedAt: new Date().toISOString() }
            : comp
        ));
      }
    }
  };

  // Handle component deletion
  const handleComponentDelete = (componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
  };

  // Handle position changes from advanced positioning
  const handlePositionChange = (componentId: string, newPosition: any) => {
    setComponents(prev => prev.map(comp =>
      comp.id === componentId
        ? { ...comp, position: newPosition, lastModifiedAt: new Date().toISOString() }
        : comp
    ));
  };

  // Mock active users for demonstration
  const activeUsers = [
    {
      userId: 'user1',
      userName: 'Alice',
      isDragging: isDragging && userId === 'user1',
      dragItem: currentDragItem,
    },
    {
      userId: 'user2',
      userName: 'Bob',
      isDragging: ghosts.some(g => g.userId === 'user2'),
      dragItem: ghosts.find(g => g.userId === 'user2')?.item,
    }
  ];

  if (!isEditMode) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Enable edit mode to use drag and drop functionality</p>
      </div>
    );
  }

  return (
    <div className="realtime-drag-drop-example">
      {/* Header Controls */}
      <div className="controls-header">
        <div className="control-group">
          <h2 className="example-title">Real-time Collaborative Drag & Drop</h2>
          <div className="status-indicators">
            <div className={`realtime-status ${realtimeStatus}`}>
              {isRealtimeConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{realtimeStatus}</span>
            </div>
            
            {ghosts.length > 0 && (
              <div className="ghost-count">
                <Users className="w-4 h-4" />
                <span>{ghosts.length} active</span>
              </div>
            )}
          </div>
        </div>

        <div className="control-actions">
          {/* Undo/Redo Controls */}
          <div className="undo-redo-controls">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="control-button"
              title="Undo last action"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="control-button"
              title="Redo last action"
            >
              <Redo className="w-4 h-4" />
            </button>
            <span className="undo-count">
              {undoRedoState.undoStack.length} operations
            </span>
          </div>

          {/* View Controls */}
          <div className="view-controls">
            <button
              onClick={() => setShowGhosts(!showGhosts)}
              className={`control-button ${showGhosts ? 'active' : ''}`}
              title="Toggle ghost indicators"
            >
              {showGhosts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Ghosts
            </button>
            
            <button
              onClick={() => setShowCollaborators(!showCollaborators)}
              className={`control-button ${showCollaborators ? 'active' : ''}`}
              title="Toggle collaborator indicators"
            >
              <Users className="w-4 h-4" />
              Users
            </button>

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'visual' | 'positioning')}
              className="view-mode-selector"
            >
              <option value="visual">Visual Mode</option>
              <option value="positioning">Positioning Mode</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Component Palette */}
        <div className="palette-section">
          <ComponentPalette
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            userId={userId}
            userName={userName}
          />
        </div>

        {/* Drop Area */}
        <div className="drop-area-section">
          {viewMode === 'visual' ? (
            <div className="visual-drop-area">
              {/* Page Sections */}
              <div className="page-sections">
                <SmartDropZone
                  pageId={pageName}
                  sectionId="header"
                  existingComponents={components.filter(c => c.position.sectionId === 'header')}
                  onDrop={handleComponentDrop}
                  userId={userId}
                  userName={userName}
                  maxComponents={3}
                  className="header-section"
                />

                <SmartDropZone
                  pageId={pageName}
                  sectionId="main"
                  existingComponents={components.filter(c => c.position.sectionId === 'main')}
                  onDrop={handleComponentDrop}
                  userId={userId}
                  userName={userName}
                  className="main-section"
                />

                <SmartDropZone
                  pageId={pageName}
                  sectionId="sidebar"
                  existingComponents={components.filter(c => c.position.sectionId === 'sidebar')}
                  onDrop={handleComponentDrop}
                  userId={userId}
                  userName={userName}
                  maxComponents={5}
                  className="sidebar-section"
                />

                <SmartDropZone
                  pageId={pageName}
                  sectionId="footer"
                  existingComponents={components.filter(c => c.position.sectionId === 'footer')}
                  onDrop={handleComponentDrop}
                  userId={userId}
                  userName={userName}
                  maxComponents={2}
                  className="footer-section"
                />
              </div>

              {/* Trash Zone */}
              {isDragging && currentDragItem?.type === 'existing_component' && (
                <TrashDropZone
                  onDrop={(item, zone) => {
                    if (item.componentId) {
                      handleComponentDelete(item.componentId);
                    }
                  }}
                  userId={userId}
                  userName={userName}
                  className="trash-zone"
                />
              )}
            </div>
          ) : (
            <AdvancedPositioning
              pageId={pageName}
              components={components}
              onPositionChange={handlePositionChange}
              onComponentDelete={handleComponentDelete}
            />
          )}
        </div>
      </div>

      {/* Overlays */}
      {showGhosts && (
        <GhostIndicators
          ghosts={ghosts}
          onGhostClick={(ghost) => console.log('Ghost clicked:', ghost)}
        />
      )}

      {showCollaborators && (
        <CollaborativeDragIndicator
          activeUsers={activeUsers}
        />
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <details>
            <summary>Debug Information</summary>
            <div className="debug-content">
              <div><strong>Is Dragging:</strong> {isDragging.toString()}</div>
              <div><strong>Current Item:</strong> {currentDragItem?.componentType || 'None'}</div>
              <div><strong>Active Zones:</strong> {activeZones.length}</div>
              <div><strong>Ghosts:</strong> {ghosts.length}</div>
              <div><strong>Components:</strong> {components.length}</div>
              <div><strong>Realtime Status:</strong> {realtimeStatus}</div>
              <div><strong>Can Undo:</strong> {canUndo.toString()}</div>
              <div><strong>Can Redo:</strong> {canRedo.toString()}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default RealtimeDragDropExample;