'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DragDropManager } from '../DragDropManager';
import { RealtimeDragDropSync, GhostDragEvent } from '../RealtimeDragDropSync';
import { UndoRedoManager, UndoRedoState } from '../UndoRedoManager';
import { DragItem, DropZone } from '../../types/drag-drop';
import { useEditMode } from '../../../contexts/editModeContext';

interface UseRealtimeDragDropOptions {
  pageName: string;
  userId: string;
  userName: string;
  enableRealtime?: boolean;
  enableUndoRedo?: boolean;
  enableGhostIndicators?: boolean;
}

interface UseRealtimeDragDropReturn {
  // State
  isDragging: boolean;
  currentDragItem: DragItem | null;
  activeZones: DropZone[];
  ghosts: GhostDragEvent[];
  undoRedoState: UndoRedoState;
  
  // Drag operations
  handleDragStart: (item: DragItem) => void;
  handleDragEnd: (item: DragItem, dropResult?: any) => void;
  handleDrop: (item: DragItem, targetZone: DropZone) => boolean;
  
  // Ghost operations
  broadcastGhostPosition: (item: DragItem, position?: { x: number; y: number }, targetZone?: DropZone) => void;
  
  // Undo/Redo operations
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  
  // Zone management
  registerDropZone: (zone: DropZone) => void;
  unregisterDropZone: (zoneId: string) => void;
  
  // Utilities
  validateDrop: (item: DragItem, zone: DropZone) => { canDrop: boolean; reason?: string };
  getCompatibleZones: (item: DragItem) => DropZone[];
  
  // Real-time status
  isRealtimeConnected: boolean;
  realtimeStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

export function useRealtimeDragDrop(options: UseRealtimeDragDropOptions): UseRealtimeDragDropReturn {
  const {
    pageName,
    userId,
    userName,
    enableRealtime = true,
    enableUndoRedo = true,
    enableGhostIndicators = true
  } = options;

  const { isEditMode } = useEditMode();
  
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [currentDragItem, setCurrentDragItem] = useState<DragItem | null>(null);
  const [activeZones, setActiveZones] = useState<DropZone[]>([]);
  const [ghosts, setGhosts] = useState<GhostDragEvent[]>([]);
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    undoStack: [],
    redoStack: [],
    currentIndex: 0
  });
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  // Refs
  const managerRef = useRef<DragDropManager | null>(null);
  const realtimeSyncRef = useRef<RealtimeDragDropSync | null>(null);
  const undoRedoManagerRef = useRef<UndoRedoManager | null>(null);

  // Initialize drag drop manager
  useEffect(() => {
    if (!isEditMode) return;

    managerRef.current = DragDropManager.getInstance();
    
    if (enableRealtime) {
      managerRef.current.initializeRealtime(pageName, userId, userName);
      realtimeSyncRef.current = managerRef.current.getRealtimeSync();
      
      if (realtimeSyncRef.current) {
        setupRealtimeListeners();
      }
    }

    if (enableUndoRedo) {
      undoRedoManagerRef.current = managerRef.current.getUndoRedoManager();
      
      if (undoRedoManagerRef.current) {
        setupUndoRedoListeners();
      }
    }

    setupDragDropListeners();

    return () => {
      cleanupListeners();
    };
  }, [isEditMode, pageName, userId, userName, enableRealtime, enableUndoRedo]);

  // Setup real-time listeners
  const setupRealtimeListeners = useCallback(() => {
    if (!realtimeSyncRef.current) return;

    const sync = realtimeSyncRef.current;

    sync.on('remoteDragStart', (event) => {
      console.log('Remote drag start:', event);
    });

    sync.on('remoteDragEnd', (event) => {
      console.log('Remote drag end:', event);
    });

    sync.on('remoteDrop', (event) => {
      console.log('Remote drop:', event);
    });

    sync.on('ghostUpdate', (event: GhostDragEvent) => {
      if (enableGhostIndicators) {
        setGhosts(prev => {
          const filtered = prev.filter(g => g.sessionId !== event.sessionId);
          return [...filtered, event];
        });
      }
    });

    sync.on('ghostExpired', (sessionId: string) => {
      setGhosts(prev => prev.filter(g => g.sessionId !== sessionId));
    });

    sync.on('dragConflict', (conflict) => {
      console.warn('Drag conflict:', conflict);
      // Handle conflict resolution UI
    });

    sync.on('dropConflict', (conflict) => {
      console.warn('Drop conflict:', conflict);
      // Handle conflict resolution UI
    });

    setIsRealtimeConnected(true);
    setRealtimeStatus('connected');
  }, [enableGhostIndicators]);

  // Setup undo/redo listeners
  const setupUndoRedoListeners = useCallback(() => {
    if (!undoRedoManagerRef.current) return;

    const manager = undoRedoManagerRef.current;

    manager.on('stateChanged', (state: UndoRedoState) => {
      setUndoRedoState(state);
    });

    manager.on('operationRecorded', (operation) => {
      console.log('Operation recorded:', operation);
    });

    manager.on('undoExecuted', (operation) => {
      console.log('Undo executed:', operation);
    });

    manager.on('redoExecuted', (operation) => {
      console.log('Redo executed:', operation);
    });

    // Initialize state
    setUndoRedoState(manager.getState());
  }, []);

  // Setup drag drop listeners
  const setupDragDropListeners = useCallback(() => {
    if (!managerRef.current) return;

    const manager = managerRef.current;

    const unsubscribeDragStart = manager.onDragStart((event) => {
      setIsDragging(true);
      setCurrentDragItem(event.item);
    });

    const unsubscribeDragEnd = manager.onDragEnd((event) => {
      setIsDragging(false);
      setCurrentDragItem(null);
    });

    const unsubscribeDrop = manager.onDrop((event) => {
      console.log('Drop event:', event);
    });

    // Store cleanup functions
    return () => {
      unsubscribeDragStart();
      unsubscribeDragEnd();
      unsubscribeDrop();
    };
  }, []);

  // Cleanup listeners
  const cleanupListeners = useCallback(() => {
    if (realtimeSyncRef.current) {
      realtimeSyncRef.current.removeAllListeners();
    }
    
    if (undoRedoManagerRef.current) {
      undoRedoManagerRef.current.removeAllListeners();
    }
  }, []);

  // Drag operations
  const handleDragStart = useCallback((item: DragItem) => {
    if (managerRef.current) {
      managerRef.current.handleDragStart(item, userId, userName);
    }
  }, [userId, userName]);

  const handleDragEnd = useCallback((item: DragItem, dropResult?: any) => {
    if (managerRef.current) {
      managerRef.current.handleDragEnd(item, dropResult, userId, userName);
    }
  }, [userId, userName]);

  const handleDrop = useCallback((item: DragItem, targetZone: DropZone): boolean => {
    if (managerRef.current) {
      return managerRef.current.handleDrop(item, targetZone, userId, userName);
    }
    return false;
  }, [userId, userName]);

  // Ghost operations
  const broadcastGhostPosition = useCallback((
    item: DragItem, 
    position?: { x: number; y: number }, 
    targetZone?: DropZone
  ) => {
    if (managerRef.current && enableGhostIndicators) {
      managerRef.current.broadcastGhostDrag(item, position, targetZone);
    }
  }, [enableGhostIndicators]);

  // Undo/Redo operations
  const undo = useCallback(async () => {
    if (undoRedoManagerRef.current) {
      const operation = await undoRedoManagerRef.current.undo();
      if (operation) {
        // Execute the undo operation
        console.log('Executing undo:', operation);
        // TODO: Implement actual undo logic based on operation type
      }
    }
  }, []);

  const redo = useCallback(async () => {
    if (undoRedoManagerRef.current) {
      const operation = await undoRedoManagerRef.current.redo();
      if (operation) {
        // Execute the redo operation
        console.log('Executing redo:', operation);
        // TODO: Implement actual redo logic based on operation type
      }
    }
  }, []);

  // Zone management
  const registerDropZone = useCallback((zone: DropZone) => {
    if (managerRef.current) {
      managerRef.current.registerDropZone(zone);
      setActiveZones(managerRef.current.getActiveZones());
    }
  }, []);

  const unregisterDropZone = useCallback((zoneId: string) => {
    if (managerRef.current) {
      managerRef.current.unregisterDropZone(zoneId);
      setActiveZones(managerRef.current.getActiveZones());
    }
  }, []);

  // Utilities
  const validateDrop = useCallback((item: DragItem, zone: DropZone) => {
    if (managerRef.current) {
      return managerRef.current.validateDrop(item, zone);
    }
    return { canDrop: false, reason: 'Manager not initialized' };
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
    ghosts,
    undoRedoState,
    
    // Drag operations
    handleDragStart,
    handleDragEnd,
    handleDrop,
    
    // Ghost operations
    broadcastGhostPosition,
    
    // Undo/Redo operations
    undo,
    redo,
    canUndo: undoRedoState.canUndo,
    canRedo: undoRedoState.canRedo,
    
    // Zone management
    registerDropZone,
    unregisterDropZone,
    
    // Utilities
    validateDrop,
    getCompatibleZones,
    
    // Real-time status
    isRealtimeConnected,
    realtimeStatus
  };
}

export default useRealtimeDragDrop;