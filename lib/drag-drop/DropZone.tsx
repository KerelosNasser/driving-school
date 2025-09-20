'use client';

import React, { useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem, DropZone as DropZoneType, DropZoneProps } from '../types/drag-drop';
import { DropZoneValidator } from './dropZoneValidator';
import { CheckCircle, XCircle, Target, Move } from 'lucide-react';

export function DropZone({ zone, onDrop, children }: DropZoneProps) {
  const [validationResult, setValidationResult] = useState<{ canDrop: boolean; reason?: string; suggestions?: string[] }>({ canDrop: true });

  const [{ isOver, canDrop, item }, drop] = useDrop({
    accept: zone.accepts,
    drop: (dragItem: DragItem) => {
      onDrop(dragItem, zone);
      return { targetZone: zone };
    },
    canDrop: (dragItem: DragItem) => {
      const validation = DropZoneValidator.validateDrop(dragItem, zone);
      setValidationResult(validation);
      return validation.canDrop;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      item: monitor.getItem() as DragItem,
    }),
  });

  const isActive = isOver && canDrop;
  const isInvalid = isOver && !canDrop;

  // Update zone state
  useEffect(() => {
    zone.isOver = isOver;
    zone.canDrop = canDrop;
    zone.isActive = isActive;
  }, [isOver, canDrop, isActive, zone]);

  const getDropZoneIcon = () => {
    if (isActive) return <CheckCircle className="w-5 h-5" />;
    if (isInvalid) return <XCircle className="w-5 h-5" />;
    if (zone.type === 'trash') return <Target className="w-5 h-5" />;
    return <Move className="w-5 h-5" />;
  };

  const getDropZoneMessage = () => {
    if (isActive) {
      if (zone.type === 'trash') return 'Drop to delete';
      if (item?.type === 'new_component') return `Add ${item.componentType || 'component'}`;
      if (item?.type === 'existing_component') return 'Move component here';
      return 'Drop here';
    }
    
    if (isInvalid) {
      return validationResult.reason || 'Cannot drop here';
    }

    if (zone.type === 'section') return 'Drop components in this section';
    if (zone.type === 'component') return 'Drop between components';
    if (zone.type === 'trash') return 'Drag components here to delete';
    
    return 'Drop zone';
  };

  const getDropZoneStyles = () => {
    const baseStyles = {
      minHeight: zone.type === 'section' ? '100px' : zone.type === 'trash' ? '80px' : '40px',
      borderRadius: zone.type === 'trash' ? '50%' : '8px',
      padding: zone.type === 'trash' ? '16px' : '8px',
      transition: 'all 0.2s ease-in-out',
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (isActive) {
      return {
        ...baseStyles,
        border: '2px dashed #3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        transform: zone.type === 'trash' ? 'scale(1.1)' : 'scale(1.02)',
      };
    }

    if (isInvalid) {
      return {
        ...baseStyles,
        border: '2px dashed #ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      };
    }

    if (canDrop) {
      return {
        ...baseStyles,
        border: '2px dashed #d1d5db',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      };
    }

    return {
      ...baseStyles,
      border: '1px solid transparent',
      backgroundColor: 'transparent',
    };
  };

  const shouldShowOverlay = isActive || isInvalid;

  return (
    <div
      ref={drop}
      className={`drop-zone ${zone.type} ${isActive ? 'active' : ''} ${isInvalid ? 'invalid' : ''} ${canDrop ? 'can-drop' : ''}`}
      style={getDropZoneStyles()}
      data-zone-id={zone.id}
      data-zone-type={zone.type}
      data-testid={`drop-zone-${zone.id}`}
    >
      {shouldShowOverlay && (
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg ${
            isActive 
              ? 'bg-blue-50 bg-opacity-90 text-blue-600' 
              : 'bg-red-50 bg-opacity-90 text-red-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {getDropZoneIcon()}
            <span className="font-medium text-sm">
              {getDropZoneMessage()}
            </span>
          </div>
          
          {isInvalid && validationResult.suggestions && validationResult.suggestions.length > 0 && (
            <div className="mt-2 text-xs text-center max-w-xs">
              <div className="text-gray-600">Suggestions:</div>
              <ul className="list-disc list-inside">
                {validationResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-gray-500">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Position indicator for component zones */}
      {zone.type === 'component' && canDrop && !shouldShowOverlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-blue-400 rounded-full opacity-60" />
        </div>
      )}
      
      {children}
    </div>
  );
}

export default DropZone;