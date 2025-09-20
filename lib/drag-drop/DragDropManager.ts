import { DragItem, DropZone, ComponentPosition, DragStartEvent, DragEndEvent, DropEvent } from '../types/drag-drop';
import { DropZoneValidator } from './dropZoneValidator';
import { RealtimeDragDropSync } from './RealtimeDragDropSync';
import { UndoRedoManager } from './UndoRedoManager';

export class DragDropManager {
  private static instance: DragDropManager;
  private dragStartListeners: ((event: DragStartEvent) => void)[] = [];
  private dragEndListeners: ((event: DragEndEvent) => void)[] = [];
  private dropListeners: ((event: DropEvent) => void)[] = [];
  private currentDragItem: DragItem | null = null;
  private activeZones: Map<string, DropZone> = new Map();
  private realtimeSync: RealtimeDragDropSync | null = null;
  private undoRedoManager: UndoRedoManager | null = null;
  private isRealtimeEnabled = false;

  private constructor() {}

  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager();
    }
    return DragDropManager.instance;
  }

  /**
   * Register event listeners
   */
  onDragStart(listener: (event: DragStartEvent) => void) {
    this.dragStartListeners.push(listener);
    return () => {
      const index = this.dragStartListeners.indexOf(listener);
      if (index > -1) {
        this.dragStartListeners.splice(index, 1);
      }
    };
  }

  onDragEnd(listener: (event: DragEndEvent) => void) {
    this.dragEndListeners.push(listener);
    return () => {
      const index = this.dragEndListeners.indexOf(listener);
      if (index > -1) {
        this.dragEndListeners.splice(index, 1);
      }
    };
  }

  onDrop(listener: (event: DropEvent) => void) {
    this.dropListeners.push(listener);
    return () => {
      const index = this.dropListeners.indexOf(listener);
      if (index > -1) {
        this.dropListeners.splice(index, 1);
      }
    };
  }

  /**
   * Initialize real-time synchronization
   */
  initializeRealtime(pageName: string, userId: string, userName: string) {
    if (!this.realtimeSync) {
      this.realtimeSync = new RealtimeDragDropSync(pageName, userId, userName);
      this.undoRedoManager = new UndoRedoManager(userId, userName);
      this.isRealtimeEnabled = true;
      
      // Set up real-time event handlers
      this.setupRealtimeHandlers();
    }
  }

  /**
   * Set up real-time event handlers
   */
  private setupRealtimeHandlers() {
    if (!this.realtimeSync) return;

    this.realtimeSync.on('remoteDragStart', (event) => {
      // Handle remote user starting drag
      this.handleRemoteDragStart(event);
    });

    this.realtimeSync.on('remoteDragEnd', (event) => {
      // Handle remote user ending drag
      this.handleRemoteDragEnd(event);
    });

    this.realtimeSync.on('remoteDrop', (event) => {
      // Handle remote user dropping
      this.handleRemoteDrop(event);
    });

    this.realtimeSync.on('ghostUpdate', (event) => {
      // Handle ghost indicator updates
      this.handleGhostUpdate(event);
    });

    this.realtimeSync.on('dragConflict', (conflict) => {
      // Handle drag conflicts
      this.handleDragConflict(conflict);
    });
  }

  /**
   * Handle drag start
   */
  handleDragStart(item: DragItem, userId: string, userName: string) {
    this.currentDragItem = item;
    
    const event: DragStartEvent = {
      userId,
      userName,
      item,
      timestamp: new Date().toISOString()
    };

    this.dragStartListeners.forEach(listener => listener(event));
    
    // Broadcast to real-time if enabled
    if (this.isRealtimeEnabled && this.realtimeSync) {
      this.realtimeSync.broadcastDragStart(item);
    }
    
    // Update zone highlighting
    this.updateZoneHighlighting(item);
  }

  /**
   * Handle drag end
   */
  handleDragEnd(item: DragItem, dropResult: any, userId: string, userName: string) {
    const event: DragEndEvent = {
      userId,
      userName,
      item,
      dropResult,
      timestamp: new Date().toISOString()
    };

    this.dragEndListeners.forEach(listener => listener(event));
    
    // Broadcast to real-time if enabled
    if (this.isRealtimeEnabled && this.realtimeSync) {
      this.realtimeSync.broadcastDragEnd(item, dropResult);
    }
    
    this.currentDragItem = null;
    this.clearZoneHighlighting();
  }

  /**
   * Handle drop
   */
  handleDrop(item: DragItem, targetZone: DropZone, userId: string, userName: string): boolean {
    // Validate the drop
    const validation = DropZoneValidator.validateDrop(item, targetZone);
    if (!validation.canDrop) {
      console.warn('Drop validation failed:', validation.reason);
      return false;
    }

    const event: DropEvent = {
      userId,
      userName,
      item,
      targetZone,
      timestamp: new Date().toISOString()
    };

    // Record operation for undo/redo
    if (this.undoRedoManager) {
      this.recordDropOperation(item, targetZone);
    }

    // Broadcast to real-time if enabled
    if (this.isRealtimeEnabled && this.realtimeSync) {
      this.realtimeSync.broadcastDrop(item, targetZone);
    }

    this.dropListeners.forEach(listener => listener(event));
    return true;
  }

  /**
   * Register a drop zone
   */
  registerDropZone(zone: DropZone) {
    this.activeZones.set(zone.id, zone);
  }

  /**
   * Unregister a drop zone
   */
  unregisterDropZone(zoneId: string) {
    this.activeZones.delete(zoneId);
  }

  /**
   * Get all active drop zones
   */
  getActiveZones(): DropZone[] {
    return Array.from(this.activeZones.values());
  }

  /**
   * Update zone highlighting based on current drag item
   */
  private updateZoneHighlighting(item: DragItem) {
    this.activeZones.forEach(zone => {
      const shouldHighlight = DropZoneValidator.shouldHighlightZone(item, zone);
      zone.isActive = shouldHighlight;
      zone.canDrop = shouldHighlight;
    });
  }

  /**
   * Clear all zone highlighting
   */
  private clearZoneHighlighting() {
    this.activeZones.forEach(zone => {
      zone.isActive = false;
      zone.canDrop = false;
      zone.isOver = false;
    });
  }

  /**
   * Get current drag item
   */
  getCurrentDragItem(): DragItem | null {
    return this.currentDragItem;
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.currentDragItem !== null;
  }

  /**
   * Calculate optimal drop position
   */
  calculateDropPosition(
    item: DragItem, 
    zone: DropZone, 
    existingComponents: ComponentPosition[] = []
  ): ComponentPosition {
    return DropZoneValidator.calculateDropPosition(item, zone, existingComponents);
  }

  /**
   * Validate if a drop is allowed
   */
  validateDrop(item: DragItem, zone: DropZone) {
    return DropZoneValidator.validateDrop(item, zone);
  }

  /**
   * Get drop zones that accept a specific item type
   */
  getCompatibleZones(item: DragItem): DropZone[] {
    return this.getActiveZones().filter(zone => 
      DropZoneValidator.validateDrop(item, zone).canDrop
    );
  }

  /**
   * Record drop operation for undo/redo
   */
  private recordDropOperation(item: DragItem, targetZone: DropZone) {
    if (!this.undoRedoManager) return;

    if (item.type === 'new_component' && item.componentType) {
      this.undoRedoManager.recordAdd(
        `temp-${Date.now()}`, // Temporary ID, should be replaced with actual ID
        item.componentType,
        targetZone.position
      );
    } else if (item.type === 'existing_component' && item.componentId && item.sourcePosition) {
      this.undoRedoManager.recordMove(
        item.componentId,
        item.sourcePosition,
        targetZone.position
      );
    }
  }

  /**
   * Handle remote drag start events
   */
  private handleRemoteDragStart(event: any) {
    // Update UI to show other user is dragging
    console.log(`Remote user ${event.userName} started dragging`, event.item);
  }

  /**
   * Handle remote drag end events
   */
  private handleRemoteDragEnd(event: any) {
    // Clean up remote drag indicators
    console.log(`Remote user ${event.userName} ended dragging`, event.item);
  }

  /**
   * Handle remote drop events
   */
  private handleRemoteDrop(event: any) {
    // Update local state based on remote drop
    console.log(`Remote user ${event.userName} dropped`, event.item, 'at', event.targetZone);
  }

  /**
   * Handle ghost indicator updates
   */
  private handleGhostUpdate(event: any) {
    // Update ghost indicators for remote users
    console.log(`Ghost update from ${event.userName}`, event);
  }

  /**
   * Handle drag conflicts
   */
  private handleDragConflict(conflict: any) {
    // Handle conflicts when multiple users drag the same component
    console.warn('Drag conflict detected:', conflict);
  }

  /**
   * Broadcast ghost drag position
   */
  broadcastGhostDrag(item: DragItem, position?: { x: number; y: number }, targetZone?: DropZone) {
    if (this.isRealtimeEnabled && this.realtimeSync) {
      this.realtimeSync.broadcastGhostDrag(item, position, targetZone);
    }
  }

  /**
   * Get undo/redo manager
   */
  getUndoRedoManager(): UndoRedoManager | null {
    return this.undoRedoManager;
  }

  /**
   * Get real-time sync instance
   */
  getRealtimeSync(): RealtimeDragDropSync | null {
    return this.realtimeSync;
  }

  /**
   * Check if real-time is enabled
   */
  isRealtimeActive(): boolean {
    return this.isRealtimeEnabled && this.realtimeSync !== null;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.dragStartListeners = [];
    this.dragEndListeners = [];
    this.dropListeners = [];
    this.currentDragItem = null;
    this.activeZones.clear();
    
    if (this.realtimeSync) {
      this.realtimeSync.destroy();
      this.realtimeSync = null;
    }
    
    this.undoRedoManager = null;
    this.isRealtimeEnabled = false;
  }
}