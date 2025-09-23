'use client';

import { RealtimeClient, getRealtimeClient } from '../realtime/RealtimeClient';
import { RealtimeEvent, EventHandler } from '../realtime/types';
import { DragItem, DropZone, ComponentPosition } from '../types/drag-drop';
import { EventEmitter } from 'events';

// Real-time drag and drop event types
export interface DragStartEvent {
  type: 'drag_start';
  userId: string;
  userName: string;
  item: DragItem;
  timestamp: string;
  sessionId: string;
}

export interface DragEndEvent {
  type: 'drag_end';
  userId: string;
  userName: string;
  item: DragItem;
  dropResult?: {
    targetZone: DropZone;
    success: boolean;
  };
  timestamp: string;
  sessionId: string;
}

export interface DropEvent {
  type: 'drop';
  userId: string;
  userName: string;
  item: DragItem;
  targetZone: DropZone;
  timestamp: string;
  sessionId: string;
}

export interface GhostDragEvent {
  type: 'ghost_drag';
  userId: string;
  userName: string;
  item: DragItem;
  currentPosition?: { x: number; y: number };
  targetZone?: DropZone;
  timestamp: string;
  sessionId: string;
}

export type DragDropRealtimeEvent = DragStartEvent | DragEndEvent | DropEvent | GhostDragEvent;

export interface RealtimeDragDropConfig {
  enableGhostIndicators: boolean;
  enableConflictResolution: boolean;
  enableUndoRedo: boolean;
  ghostUpdateInterval: number;
  maxGhostAge: number;
}export
 class RealtimeDragDropSync extends EventEmitter {
  private realtimeClient: RealtimeClient;
  private pageName: string;
  private userId: string;
  private userName: string;
  private sessionId: string;
  private config: RealtimeDragDropConfig;
  private activeGhosts: Map<string, GhostDragEvent> = new Map();
  private ghostCleanupInterval: NodeJS.Timeout | null = null;
  private currentDragSession: string | null = null;

  constructor(
    pageName: string,
    userId: string,
    userName: string,
    config: Partial<RealtimeDragDropConfig> = {}
  ) {
    super();
    
    this.pageName = pageName;
    this.userId = userId;
    this.userName = userName;
    this.sessionId = this.generateSessionId();
    this.realtimeClient = getRealtimeClient();
    
    this.config = {
      enableGhostIndicators: true,
      enableConflictResolution: true,
      enableUndoRedo: true,
      ghostUpdateInterval: 100,
      maxGhostAge: 5000,
      ...config
    };

    this.initialize();
  }

  private initialize(): void {
    this.setupRealtimeSubscription();
    this.setupGhostCleanup();
  }

  private generateSessionId(): string {
    return `${this.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupRealtimeSubscription(): void {
    const channel = this.realtimeClient.subscribe(`drag-drop:${this.pageName}`);
    
    channel.on('broadcast', { event: 'drag_start' }, (payload) => {
      this.handleRemoteDragStart(payload.payload as DragStartEvent);
    });

    channel.on('broadcast', { event: 'drag_end' }, (payload) => {
      this.handleRemoteDragEnd(payload.payload as DragEndEvent);
    });

    channel.on('broadcast', { event: 'drop' }, (payload) => {
      this.handleRemoteDrop(payload.payload as DropEvent);
    });

    channel.on('broadcast', { event: 'ghost_drag' }, (payload) => {
      this.handleRemoteGhostDrag(payload.payload as GhostDragEvent);
    });
  }

  private setupGhostCleanup(): void {
    if (this.config.enableGhostIndicators) {
      this.ghostCleanupInterval = setInterval(() => {
        this.cleanupExpiredGhosts();
      }, this.config.ghostUpdateInterval);
    }
  }

  private cleanupExpiredGhosts(): void {
    const now = Date.now();
    const expiredGhosts: string[] = [];

    this.activeGhosts.forEach((ghost, sessionId) => {
      const ghostAge = now - new Date(ghost.timestamp).getTime();
      if (ghostAge > this.config.maxGhostAge) {
        expiredGhosts.push(sessionId);
      }
    });

    expiredGhosts.forEach(sessionId => {
      this.activeGhosts.delete(sessionId);
      this.emit('ghostExpired', sessionId);
    });
  }
  // Public methods for broadcasting drag events
  public broadcastDragStart(item: DragItem): void {
    const event: DragStartEvent = {
      type: 'drag_start',
      userId: this.userId,
      userName: this.userName,
      item,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.currentDragSession = this.sessionId;
    this.broadcastEvent('drag_start', event);
    this.emit('localDragStart', event);
  }

  public broadcastDragEnd(item: DragItem, dropResult?: any): void {
    const event: DragEndEvent = {
      type: 'drag_end',
      userId: this.userId,
      userName: this.userName,
      item,
      dropResult,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.currentDragSession = null;
    this.broadcastEvent('drag_end', event);
    this.emit('localDragEnd', event);
  }

  public broadcastDrop(item: DragItem, targetZone: DropZone): void {
    const event: DropEvent = {
      type: 'drop',
      userId: this.userId,
      userName: this.userName,
      item,
      targetZone,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.broadcastEvent('drop', event);
    this.emit('localDrop', event);
  }

  public broadcastGhostDrag(
    item: DragItem, 
    currentPosition?: { x: number; y: number }, 
    targetZone?: DropZone
  ): void {
    if (!this.config.enableGhostIndicators || !this.currentDragSession) {
      return;
    }

    const event: GhostDragEvent = {
      type: 'ghost_drag',
      userId: this.userId,
      userName: this.userName,
      item,
      currentPosition: currentPosition as any,
      targetZone: targetZone as any,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.broadcastEvent('ghost_drag', event);
  }

  private broadcastEvent(eventType: string, event: DragDropRealtimeEvent): void {
    const channel = this.realtimeClient.getChannel(`drag-drop:${this.pageName}`);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: eventType,
        payload: event
      });
    }
  }

  // Remote event handlers
  private handleRemoteDragStart(event: DragStartEvent): void {
    if (event.userId === this.userId) return; // Ignore own events

    this.emit('remoteDragStart', event);
    
    // Check for potential conflicts
    if (this.config.enableConflictResolution && this.currentDragSession) {
      this.handleDragConflict(event);
    }
  }

  private handleRemoteDragEnd(event: DragEndEvent): void {
    if (event.userId === this.userId) return;

    this.activeGhosts.delete(event.sessionId);
    this.emit('remoteDragEnd', event);
  }

  private handleRemoteDrop(event: DropEvent): void {
    if (event.userId === this.userId) return;

    this.activeGhosts.delete(event.sessionId);
    this.emit('remoteDrop', event);
    
    // Check for drop conflicts
    if (this.config.enableConflictResolution) {
      this.handleDropConflict(event);
    }
  }

  private handleRemoteGhostDrag(event: GhostDragEvent): void {
    if (event.userId === this.userId) return;

    if (this.config.enableGhostIndicators) {
      this.activeGhosts.set(event.sessionId, event);
      this.emit('ghostUpdate', event);
    }
  }

  private handleDragConflict(remoteEvent: DragStartEvent): void {
    // Check if both users are dragging the same component
    if (this.currentDragSession && 
        remoteEvent.item.type === 'existing_component' &&
        remoteEvent.item.componentId) {
      
      this.emit('dragConflict', {
        localSession: this.currentDragSession,
        remoteSession: remoteEvent.sessionId,
        conflictType: 'simultaneous_drag',
        componentId: remoteEvent.item.componentId,
        remoteUser: remoteEvent.userName
      });
    }
  }

  private handleDropConflict(remoteEvent: DropEvent): void {
    // Check if drop targets the same position as current drag
    if (this.currentDragSession) {
      this.emit('dropConflict', {
        localSession: this.currentDragSession,
        remoteEvent,
        conflictType: 'drop_position_conflict'
      });
    }
  }

  // Utility methods
  public getActiveGhosts(): GhostDragEvent[] {
    return Array.from(this.activeGhosts.values());
  }

  public getGhostBySession(sessionId: string): GhostDragEvent | undefined {
    return this.activeGhosts.get(sessionId);
  }

  public isCurrentlyDragging(): boolean {
    return this.currentDragSession !== null;
  }

  public getCurrentDragSession(): string | null {
    return this.currentDragSession;
  }

  public destroy(): void {
    if (this.ghostCleanupInterval) {
      clearInterval(this.ghostCleanupInterval);
    }
    
    this.realtimeClient.unsubscribe(`drag-drop:${this.pageName}`);
    this.removeAllListeners();
  }
}