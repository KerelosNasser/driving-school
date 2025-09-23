'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DragDropManager } from './DragDropManager';
import { DragItem, DropZone, DragStartEvent, DragEndEvent, DropEvent } from '../types/drag-drop';

interface UseDragDropReturn {
  // State
  isDragging: boolean;
  currentDragItem: DragItem | null;
  activeZones: DropZone[];
  
  // Zone management
  registerDropZone: (zone: DropZone) => void;
  unregisterDropZone: (zoneId: string) => void;
  
  // Drag operations
  handleDragStart: (item: DragItem, userId: string, userName: string) => void;
  handleDragEnd: (item: DragItem, dropResult: any, userId: string, userName: string) => void;
  handleDrop: (item: DragItem, targetZone: DropZone, userId: string, userName: string) => boolean;
  
  // Utilities
  validateDrop: (item: DragItem, zone: DropZone) => { canDrop: boolean; reason?: string };
  getCompatibleZones: (item: DragItem) => DropZone[];
}

interface UseDragDropOptions {
  userId?: string;
  userName?: string;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDrop?: (event: DropEvent) => void;
}

export function useDragDrop(options: UseDragDropOptions = {}): UseDragDropReturn {
  const { userId = 'anonymous', userName = 'Anonymous User', onDragStart, onDragEnd, onDrop } = options;
  
  const [isDragging, setIsDragging] = useState(false);
  const [currentDragItem, setCurrentDragItem] = useState<DragItem | null>(null);
  const [activeZones, setActiveZones] = useState<DropZone[]>([]);
  
  const managerRef = useRef<DragDropManager | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Initialize drag drop manager
  useEffect(() => {
    try {
      managerRef.current = DragDropManager.getInstance();

      // Set up event listeners
      const unsubscribeDragStart = managerRef.current.onDragStart((event) => {
        try {
          setIsDragging(true);
          setCurrentDragItem(event.item);
          onDragStart?.(event);
        } catch (e) {
          console.error('DragDrop: onDragStart handler failed', e);
        }
      });

      const unsubscribeDragEnd = managerRef.current.onDragEnd((event) => {
        try {
          setIsDragging(false);
          setCurrentDragItem(null);
          onDragEnd?.(event);
        } catch (e) {
          console.error('DragDrop: onDragEnd handler failed', e);
        }
      });

      const unsubscribeDrop = managerRef.current.onDrop((event) => {
        try {
          onDrop?.(event);
        } catch (e) {
          console.error('DragDrop: onDrop handler failed', e);
        }
      });

      cleanupFunctionsRef.current = [unsubscribeDragStart, unsubscribeDragEnd, unsubscribeDrop];

      // Update active zones periodically
      const updateZones = () => {
        try {
          if (managerRef.current) {
            setActiveZones(managerRef.current.getActiveZones());
          }
        } catch (e) {
          console.error('DragDrop: updateZones failed', e);
        }
      };

      const intervalId = setInterval(updateZones, 1000);
      updateZones(); // Initial update

      return () => {
        clearInterval(intervalId);
        cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      };
    } catch (err) {
      const details = err instanceof Error ? err.message : String(err);
      console.group('DragDrop initialization failed');
      console.error(err);
      console.groupEnd();
      // Attempt to notify developer
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__DND_INIT_ERROR = details;
      } catch (e) {}
      // Ensure app still mounts
      return () => {};
    }
  }, [onDragStart, onDragEnd, onDrop]);

  // Zone management functions
  const registerDropZone = useCallback((zone: DropZone) => {
    try {
      if (!managerRef.current) throw new Error('DragDropManager not initialized');

      // Detect duplicate zone ids
      const existing = managerRef.current.getActiveZones().find(z => z.id === zone.id);
      if (existing) {
        const msg = `Draggable ID '${zone.id}' duplicated—keys must be unique.`;
        console.warn(msg);
        // surface to developer console
        console.group('DragDrop duplicate id');
        console.warn('Existing zone:', existing);
        console.warn('New zone:', zone);
        console.groupEnd();
      }

      managerRef.current.registerDropZone(zone);
      setActiveZones(managerRef.current.getActiveZones());
    } catch (err) {
      console.error('Failed to register drop zone:', err);
    }
  }, []);

  const unregisterDropZone = useCallback((zoneId: string) => {
    if (managerRef.current) {
      managerRef.current.unregisterDropZone(zoneId);
      setActiveZones(managerRef.current.getActiveZones());
    }
  }, []);

  // Drag operation handlers
  const handleDragStart = useCallback((item: DragItem, dragUserId?: string, dragUserName?: string) => {
    if (managerRef.current) {
      managerRef.current.handleDragStart(
        item, 
        dragUserId || userId, 
        dragUserName || userName
      );
    }
  }, [userId, userName]);

  const handleDragEnd = useCallback((item: DragItem, dropResult: any, dragUserId?: string, dragUserName?: string) => {
    if (managerRef.current) {
      managerRef.current.handleDragEnd(
        item, 
        dropResult, 
        dragUserId || userId, 
        dragUserName || userName
      );
    }
  }, [userId, userName]);

  const handleDrop = useCallback((item: DragItem, targetZone: DropZone, dragUserId?: string, dragUserName?: string): boolean => {
    if (managerRef.current) {
      return managerRef.current.handleDrop(
        item, 
        targetZone, 
        dragUserId || userId, 
        dragUserName || userName
      );
    }
    return false;
  }, [userId, userName]);

  // Utility functions
  const validateDrop = useCallback((item: DragItem, zone: DropZone) => {
    if (managerRef.current) {
      return managerRef.current.validateDrop(item, zone);
    }
    return { canDrop: false, reason: 'Drag drop manager not initialized' };
  }, []);

  const getCompatibleZones = useCallback((item: DragItem): DropZone[] => {
    if (managerRef.current) {
      return managerRef.current.getCompatibleZones(item);
    }
    return [];
  }, []);

  return {
    // State
    isDragging,
    currentDragItem,
    activeZones,
    
    // Zone management
    registerDropZone,
    unregisterDropZone,
    
    // Drag operations
    handleDragStart,
    handleDragEnd,
    handleDrop,
    
    // Utilities
    validateDrop,
    getCompatibleZones
  };
}

export default useDragDrop;