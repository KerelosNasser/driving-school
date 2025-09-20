'use client';

import { useEffect, useRef, useState } from 'react';
import { DragDropManager } from '../DragDropManager';
import { DragItem, DropZone, DragStartEvent, DragEndEvent, DropEvent } from '../../types/drag-drop';

export function useDragDrop() {
  const managerRef = useRef<DragDropManager>();
  const [isDragging, setIsDragging] = useState(false);
  const [currentDragItem, setCurrentDragItem] = useState<DragItem | null>(null);
  const [activeZones, setActiveZones] = useState<DropZone[]>([]);

  useEffect(() => {
    managerRef.current = DragDropManager.getInstance();
    
    const unsubscribeDragStart = managerRef.current.onDragStart((event: DragStartEvent) => {
      setIsDragging(true);
      setCurrentDragItem(event.item);
      setActiveZones(managerRef.current!.getActiveZones());
    });

    const unsubscribeDragEnd = managerRef.current.onDragEnd((event: DragEndEvent) => {
      setIsDragging(false);
      setCurrentDragItem(null);
      setActiveZones([]);
    });

    const unsubscribeDrop = managerRef.current.onDrop((event: DropEvent) => {
      console.log('Drop event:', event);
    });

    return () => {
      unsubscribeDragStart();
      unsubscribeDragEnd();
      unsubscribeDrop();
    };
  }, []);

  const registerDropZone = (zone: DropZone) => {
    managerRef.current?.registerDropZone(zone);
  };

  const unregisterDropZone = (zoneId: string) => {
    managerRef.current?.unregisterDropZone(zoneId);
  };

  const handleDragStart = (item: DragItem, userId: string, userName: string) => {
    managerRef.current?.handleDragStart(item, userId, userName);
  };

  const handleDragEnd = (item: DragItem, dropResult: any, userId: string, userName: string) => {
    managerRef.current?.handleDragEnd(item, dropResult, userId, userName);
  };

  const handleDrop = (item: DragItem, targetZone: DropZone, userId: string, userName: string) => {
    return managerRef.current?.handleDrop(item, targetZone, userId, userName) || false;
  };

  const validateDrop = (item: DragItem, zone: DropZone) => {
    return managerRef.current?.validateDrop(item, zone);
  };

  const getCompatibleZones = (item: DragItem) => {
    return managerRef.current?.getCompatibleZones(item) || [];
  };

  return {
    isDragging,
    currentDragItem,
    activeZones,
    registerDropZone,
    unregisterDropZone,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    validateDrop,
    getCompatibleZones,
  };
}