'use client';

import { useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem, DropZone } from '../../types/drag-drop';
import { useDragDrop } from './useDragDrop';

interface UseDropZoneProps {
  zone: DropZone;
  onDrop: (item: DragItem, targetZone: DropZone) => void;
  userId: string;
  userName: string;
}

export function useDropZone({ zone, onDrop, userId, userName }: UseDropZoneProps) {
  const { registerDropZone, unregisterDropZone, handleDrop, validateDrop } = useDragDrop();
  const zoneRef = useRef<DropZone>(zone);

  // Update zone reference when props change
  useEffect(() => {
    zoneRef.current = zone;
  }, [zone]);

  // Register/unregister drop zone
  useEffect(() => {
    try {
      registerDropZone(zone);
    } catch (err) {
      console.error('Failed to register drop zone (useDropZone):', err);
    }

    return () => {
      try {
        unregisterDropZone(zone.id);
      } catch (err) {
        // ignore
      }
    };
  }, [zone.id, registerDropZone, unregisterDropZone]);

  const [{ isOver, canDrop, isOverCurrent }, drop] = useDrop({
    accept: zone.accepts,
    drop: (item: DragItem, monitor) => {
      try {
        if (!monitor.isOver({ shallow: true })) return;

        const validation = validateDrop?.(item, zoneRef.current);
        if (!validation?.canDrop) {
          console.warn('Drop validation failed:', validation?.reason);
          return;
        }

        const success = handleDrop(item, zoneRef.current, userId, userName);
        if (success) onDrop(item, zoneRef.current);

        return { targetZone: zoneRef.current, success };
      } catch (err) {
        console.group('Drop handler failed');
        console.error(err);
        console.groupEnd();
        return { targetZone: zoneRef.current, success: false };
      }
    },
    canDrop: (item: DragItem) => {
      try {
        const validation = validateDrop?.(item, zoneRef.current);
        return validation?.canDrop || false;
      } catch (err) {
        console.error('canDrop validator failed', err);
        return false;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOverCurrent && canDrop;
  const isInvalid = isOverCurrent && !canDrop;

  return {
    drop,
    isOver,
    isOverCurrent,
    canDrop,
    isActive,
    isInvalid,
    dropZoneProps: {
      ref: drop,
      'data-zone-id': zone.id,
      'data-zone-type': zone.type,
      'data-can-drop': canDrop,
      'data-is-over': isOverCurrent,
      'data-is-active': isActive,
      'data-is-invalid': isInvalid,
    },
  };
}