'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Move, RotateCcw, Grid, Layers, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { ComponentPosition, ComponentInstance, DragItem, DropZone } from '../../lib/drag-drop';
import { useEditMode } from '../../contexts/editModeContext';

interface AdvancedPositioningProps {
  pageId: string;
  components: ComponentInstance[];
  onPositionChange: (componentId: string, newPosition: ComponentPosition) => void;
  onComponentDelete: (componentId: string) => void;
  className?: string;
}

export function AdvancedPositioning({
  pageId,
  components,
  onPositionChange,
  onComponentDelete,
  className = ''
}: AdvancedPositioningProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [positionMode, setPositionMode] = useState<'visual' | 'grid' | 'list'>('visual');
  const [showPositionGuides, setShowPositionGuides] = useState(true);

  // Group components by section
  const componentsBySection = components.reduce((acc, component) => {
    const sectionId = component.position.sectionId;
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(component);
    return acc;
  }, {} as Record<string, ComponentInstance[]>);

  // Sort components within each section by order
  Object.keys(componentsBySection).forEach(sectionId => {
    componentsBySection[sectionId].sort((a, b) => a.position.order - b.position.order);
  });

  const moveComponent = useCallback((componentId: string, direction: 'up' | 'down') => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const sectionComponents = componentsBySection[component.position.sectionId];
    const currentIndex = sectionComponents.findIndex(c => c.id === componentId);
    
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = sectionComponents[currentIndex - 1].position.order;
      onPositionChange(componentId, {
        ...component.position,
        order: newOrder
      });
    } else if (direction === 'down' && currentIndex < sectionComponents.length - 1) {
      const newOrder = sectionComponents[currentIndex + 1].position.order;
      onPositionChange(componentId, {
        ...component.position,
        order: newOrder
      });
    }
  }, [components, componentsBySection, onPositionChange]);

  const moveToSection = useCallback((componentId: string, targetSectionId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component || component.position.sectionId === targetSectionId) return;

    const targetSectionComponents = componentsBySection[targetSectionId] || [];
    const newOrder = targetSectionComponents.length;

    onPositionChange(componentId, {
      ...component.position,
      sectionId: targetSectionId,
      order: newOrder
    });
  }, [components, componentsBySection, onPositionChange]);

  return (
    <div className={`advanced-positioning ${className}`}>
      {/* Positioning Controls */}
      <div className="positioning-controls">
        <div className="control-group">
          <label className="control-label">View Mode:</label>
          <div className="mode-selector">
            <button
              onClick={() => setPositionMode('visual')}
              className={`mode-button ${positionMode === 'visual' ? 'active' : ''}`}
            >
              <Grid className="w-4 h-4" />
              Visual
            </button>
            <button
              onClick={() => setPositionMode('grid')}
              className={`mode-button ${positionMode === 'grid' ? 'active' : ''}`}
            >
              <Layers className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setPositionMode('list')}
              className={`mode-button ${positionMode === 'list' ? 'active' : ''}`}
            >
              <Move className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        <div className="control-group">
          <label className="control-checkbox">
            <input
              type="checkbox"
              checked={showPositionGuides}
              onChange={(e) => setShowPositionGuides(e.target.checked)}
            />
            Show Position Guides
          </label>
        </div>
      </div>

      {/* Visual Mode */}
      {positionMode === 'visual' && (
        <VisualPositioning
          componentsBySection={componentsBySection}
          selectedComponent={selectedComponent}
          onComponentSelect={setSelectedComponent}
          onPositionChange={onPositionChange}
          onComponentDelete={onComponentDelete}
          showGuides={showPositionGuides}
        />
      )}

      {/* Grid Mode */}
      {positionMode === 'grid' && (
        <GridPositioning
          componentsBySection={componentsBySection}
          selectedComponent={selectedComponent}
          onComponentSelect={setSelectedComponent}
          onMoveComponent={moveComponent}
          onMoveToSection={moveToSection}
          onComponentDelete={onComponentDelete}
        />
      )}

      {/* List Mode */}
      {positionMode === 'list' && (
        <ListPositioning
          componentsBySection={componentsBySection}
          selectedComponent={selectedComponent}
          onComponentSelect={setSelectedComponent}
          onMoveComponent={moveComponent}
          onMoveToSection={moveToSection}
          onComponentDelete={onComponentDelete}
        />
      )}
    </div>
  );
}

interface VisualPositioningProps {
  componentsBySection: Record<string, ComponentInstance[]>;
  selectedComponent: string | null;
  onComponentSelect: (componentId: string | null) => void;
  onPositionChange: (componentId: string, newPosition: ComponentPosition) => void;
  onComponentDelete: (componentId: string) => void;
  showGuides: boolean;
}

function VisualPositioning({
  componentsBySection,
  selectedComponent,
  onComponentSelect,
  onPositionChange,
  onComponentDelete,
  showGuides
}: VisualPositioningProps) {
  return (
    <div className="visual-positioning">
      {Object.entries(componentsBySection).map(([sectionId, sectionComponents]) => (
        <div key={sectionId} className="visual-section">
          <div className="section-header">
            <h3 className="section-title">{sectionId}</h3>
            <span className="component-count">{sectionComponents.length} components</span>
          </div>

          <div className="visual-components">
            {sectionComponents.map((component, index) => (
              <VisualComponentCard
                key={component.id}
                component={component}
                index={index}
                isSelected={selectedComponent === component.id}
                onSelect={() => onComponentSelect(component.id)}
                onPositionChange={onPositionChange}
                onDelete={() => onComponentDelete(component.id)}
                showGuides={showGuides}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface VisualComponentCardProps {
  component: ComponentInstance;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (componentId: string, newPosition: ComponentPosition) => void;
  onDelete: () => void;
  showGuides: boolean;
}

function VisualComponentCard({
  component,
  index,
  isSelected,
  onSelect,
  onPositionChange,
  onDelete,
  showGuides
}: VisualComponentCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`visual-component-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onSelect}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {/* Position guides */}
      {showGuides && (
        <div className="position-guides">
          <span className="position-order">#{component.position.order}</span>
          {component.position.parentId && (
            <span className="position-parent">↳ {component.position.parentId.slice(-6)}</span>
          )}
        </div>
      )}

      {/* Component info */}
      <div className="component-info">
        <div className="component-header">
          <span className="component-type">{component.type}</span>
          <span className="component-id">#{component.id.slice(-6)}</span>
        </div>
        
        <div className="component-meta">
          <span className="created-by">By: {component.createdBy}</span>
          <span className="created-at">{new Date(component.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      {isSelected && (
        <div className="component-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="action-button delete"
            title="Delete component"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface GridPositioningProps {
  componentsBySection: Record<string, ComponentInstance[]>;
  selectedComponent: string | null;
  onComponentSelect: (componentId: string | null) => void;
  onMoveComponent: (componentId: string, direction: 'up' | 'down') => void;
  onMoveToSection: (componentId: string, targetSectionId: string) => void;
  onComponentDelete: (componentId: string) => void;
}

function GridPositioning({
  componentsBySection,
  selectedComponent,
  onComponentSelect,
  onMoveComponent,
  onMoveToSection,
  onComponentDelete
}: GridPositioningProps) {
  const allSections = Object.keys(componentsBySection);

  return (
    <div className="grid-positioning">
      <div className="grid-container">
        {Object.entries(componentsBySection).map(([sectionId, sectionComponents]) => (
          <div key={sectionId} className="grid-section">
            <div className="grid-section-header">
              <h4>{sectionId}</h4>
            </div>
            
            <div className="grid-components">
              {sectionComponents.map((component) => (
                <div
                  key={component.id}
                  className={`grid-component ${selectedComponent === component.id ? 'selected' : ''}`}
                  onClick={() => onComponentSelect(component.id)}
                >
                  <div className="grid-component-info">
                    <span className="component-type">{component.type}</span>
                    <span className="component-order">#{component.position.order}</span>
                  </div>
                  
                  {selectedComponent === component.id && (
                    <div className="grid-component-controls">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveComponent(component.id, 'up');
                        }}
                        className="control-button"
                        title="Move up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveComponent(component.id, 'down');
                        }}
                        className="control-button"
                        title="Move down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      
                      <select
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onMoveToSection(component.id, e.target.value)}
                        value={component.position.sectionId}
                        className="section-selector"
                      >
                        {allSections.map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onComponentDelete(component.id);
                        }}
                        className="control-button delete"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ListPositioningProps {
  componentsBySection: Record<string, ComponentInstance[]>;
  selectedComponent: string | null;
  onComponentSelect: (componentId: string | null) => void;
  onMoveComponent: (componentId: string, direction: 'up' | 'down') => void;
  onMoveToSection: (componentId: string, targetSectionId: string) => void;
  onComponentDelete: (componentId: string) => void;
}

function ListPositioning({
  componentsBySection,
  selectedComponent,
  onComponentSelect,
  onMoveComponent,
  onMoveToSection,
  onComponentDelete
}: ListPositioningProps) {
  const allSections = Object.keys(componentsBySection);

  return (
    <div className="list-positioning">
      {Object.entries(componentsBySection).map(([sectionId, sectionComponents]) => (
        <div key={sectionId} className="list-section">
          <div className="list-section-header">
            <h4>{sectionId}</h4>
            <span className="component-count">{sectionComponents.length}</span>
          </div>
          
          <div className="list-components">
            {sectionComponents.map((component, index) => (
              <div
                key={component.id}
                className={`list-component ${selectedComponent === component.id ? 'selected' : ''}`}
                onClick={() => onComponentSelect(component.id)}
              >
                <div className="list-component-info">
                  <div className="component-main">
                    <span className="component-order">#{component.position.order}</span>
                    <span className="component-type">{component.type}</span>
                    <span className="component-id">#{component.id.slice(-6)}</span>
                  </div>
                  
                  <div className="component-meta">
                    <span className="created-by">{component.createdBy}</span>
                    <span className="created-at">{new Date(component.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="list-component-controls">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveComponent(component.id, 'up');
                    }}
                    disabled={index === 0}
                    className="control-button"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveComponent(component.id, 'down');
                    }}
                    disabled={index === sectionComponents.length - 1}
                    className="control-button"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  
                  <select
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onMoveToSection(component.id, e.target.value)}
                    value={component.position.sectionId}
                    className="section-selector"
                  >
                    {allSections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComponentDelete(component.id);
                    }}
                    className="control-button delete"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdvancedPositioning;