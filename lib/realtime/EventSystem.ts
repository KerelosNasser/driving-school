import { 
  RealtimeEvent, 
  RealtimeEventData, 
  EventHandler, 
  EventRouter, 
  EventValidationResult,
  ContentChangeEventData,
  ComponentAddEventData,
  ComponentMoveEventData,
  ComponentDeleteEventData,
  PageCreateEventData,
  NavigationUpdateEventData,
  PresenceUpdateEventData,
  ConflictDetectedEventData
} from './types';

// Event validation and sanitization
export class EventValidator {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_OBJECT_DEPTH = 10;

  static validateEvent(event: RealtimeEvent): EventValidationResult {
    const errors: string[] = [];

    // Basic field validation
    if (!event.id || typeof event.id !== 'string') {
      errors.push('Event ID is required and must be a string');
    }

    if (!event.type || !this.isValidEventType(event.type)) {
      errors.push('Event type is required and must be valid');
    }

    if (!event.pageName || typeof event.pageName !== 'string') {
      errors.push('Page name is required and must be a string');
    }

    if (!event.userId || typeof event.userId !== 'string') {
      errors.push('User ID is required and must be a string');
    }

    if (!event.timestamp || !this.isValidTimestamp(event.timestamp)) {
      errors.push('Timestamp is required and must be valid ISO string');
    }

    if (!event.version || typeof event.version !== 'string') {
      errors.push('Version is required and must be a string');
    }

    // Sanitize and validate data based on event type
    let sanitizedData = event.data;
    try {
      sanitizedData = this.sanitizeEventData(event.type, event.data);
    } catch (error) {
      errors.push(`Data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  private static isValidEventType(type: string): type is RealtimeEvent['type'] {
    const validTypes = [
      'content_change', 'component_add', 'component_move', 'component_delete',
      'page_create', 'nav_update', 'presence_update', 'conflict_detected'
    ];
    return validTypes.includes(type as any);
  }

  private static isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  }

  private static sanitizeEventData(eventType: RealtimeEvent['type'], data: any): RealtimeEventData {
    switch (eventType) {
      case 'content_change':
        return this.sanitizeContentChangeData(data);
      case 'component_add':
        return this.sanitizeComponentAddData(data);
      case 'component_move':
        return this.sanitizeComponentMoveData(data);
      case 'component_delete':
        return this.sanitizeComponentDeleteData(data);
      case 'page_create':
        return this.sanitizePageCreateData(data);
      case 'nav_update':
        return this.sanitizeNavigationUpdateData(data);
      case 'presence_update':
        return this.sanitizePresenceUpdateData(data);
      case 'conflict_detected':
        return this.sanitizeConflictDetectedData(data);
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }

  private static sanitizeContentChangeData(data: any): ContentChangeEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Content change data must be an object');
    }

    return {
      contentKey: this.sanitizeString(data.contentKey, 'contentKey'),
      oldValue: this.sanitizeValue(data.oldValue),
      newValue: this.sanitizeValue(data.newValue),
      contentType: this.validateContentType(data.contentType),
      componentId: data.componentId ? this.sanitizeString(data.componentId, 'componentId') : undefined
    };
  }

  private static sanitizeComponentAddData(data: any): ComponentAddEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Component add data must be an object');
    }

    return {
      componentId: this.sanitizeString(data.componentId, 'componentId'),
      componentType: this.sanitizeString(data.componentType, 'componentType'),
      position: this.sanitizeComponentPosition(data.position),
      props: this.sanitizeObject(data.props || {})
    };
  }

  private static sanitizeComponentMoveData(data: any): ComponentMoveEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Component move data must be an object');
    }

    return {
      componentId: this.sanitizeString(data.componentId, 'componentId'),
      oldPosition: this.sanitizeComponentPosition(data.oldPosition),
      newPosition: this.sanitizeComponentPosition(data.newPosition)
    };
  }

  private static sanitizeComponentDeleteData(data: any): ComponentDeleteEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Component delete data must be an object');
    }

    return {
      componentId: this.sanitizeString(data.componentId, 'componentId'),
      position: this.sanitizeComponentPosition(data.position),
      componentType: this.sanitizeString(data.componentType, 'componentType')
    };
  }

  private static sanitizePageCreateData(data: any): PageCreateEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Page create data must be an object');
    }

    return {
      pageId: this.sanitizeString(data.pageId, 'pageId'),
      pageData: {
        title: this.sanitizeString(data.pageData?.title, 'title'),
        urlSlug: this.sanitizeString(data.pageData?.urlSlug, 'urlSlug'),
        navigationOrder: data.pageData?.navigationOrder ? Number(data.pageData.navigationOrder) : undefined,
        isVisible: Boolean(data.pageData?.isVisible ?? true),
        template: data.pageData?.template ? this.sanitizeString(data.pageData.template, 'template') : undefined
      },
      navigationItem: this.sanitizeNavigationItem(data.navigationItem)
    };
  }

  private static sanitizeNavigationUpdateData(data: any): NavigationUpdateEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Navigation update data must be an object');
    }

    return {
      items: Array.isArray(data.items) ? data.items.map(item => this.sanitizeNavigationItem(item)) : [],
      changeType: this.validateChangeType(data.changeType),
      affectedItemIds: Array.isArray(data.affectedItemIds) ? 
        data.affectedItemIds.map(id => this.sanitizeString(id, 'affectedItemId')) : []
    };
  }

  private static sanitizePresenceUpdateData(data: any): PresenceUpdateEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Presence update data must be an object');
    }

    return {
      presence: {
        userId: this.sanitizeString(data.presence?.userId, 'userId'),
        userName: this.sanitizeString(data.presence?.userName, 'userName'),
        avatar: data.presence?.avatar ? this.sanitizeString(data.presence.avatar, 'avatar') : undefined,
        componentId: data.presence?.componentId ? this.sanitizeString(data.presence.componentId, 'componentId') : undefined,
        action: this.validatePresenceAction(data.presence?.action),
        lastSeen: this.sanitizeString(data.presence?.lastSeen, 'lastSeen')
      },
      action: this.validatePresenceUpdateAction(data.action)
    };
  }

  private static sanitizeConflictDetectedData(data: any): ConflictDetectedEventData {
    if (!data || typeof data !== 'object') {
      throw new Error('Conflict detected data must be an object');
    }

    return {
      conflict: {
        id: this.sanitizeString(data.conflict?.id, 'conflict.id'),
        type: this.validateConflictType(data.conflict?.type),
        componentId: this.sanitizeString(data.conflict?.componentId, 'conflict.componentId'),
        localVersion: this.sanitizeValue(data.conflict?.localVersion),
        remoteVersion: this.sanitizeValue(data.conflict?.remoteVersion),
        conflictedAt: this.sanitizeString(data.conflict?.conflictedAt, 'conflict.conflictedAt'),
        conflictedBy: this.sanitizeString(data.conflict?.conflictedBy, 'conflict.conflictedBy')
      },
      affectedUsers: Array.isArray(data.affectedUsers) ? 
        data.affectedUsers.map(userId => this.sanitizeString(userId, 'affectedUser')) : []
    };
  }

  // Helper methods for sanitization
  private static sanitizeString(value: any, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    if (value.length > this.MAX_STRING_LENGTH) {
      throw new Error(`${fieldName} exceeds maximum length`);
    }
    return value.trim();
  }

  private static sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    if (typeof value === 'string') {
      return value.length > this.MAX_STRING_LENGTH ? value.substring(0, this.MAX_STRING_LENGTH) : value;
    }
    
    if (typeof value === 'object') {
      return this.sanitizeObject(value);
    }
    
    return value;
  }

  private static sanitizeObject(obj: any, depth = 0): any {
    if (depth > this.MAX_OBJECT_DEPTH) {
      throw new Error('Object depth exceeds maximum allowed');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeValue(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeValue(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  private static sanitizeComponentPosition(position: any) {
    if (!position || typeof position !== 'object') {
      throw new Error('Component position must be an object');
    }

    return {
      pageId: this.sanitizeString(position.pageId, 'position.pageId'),
      sectionId: this.sanitizeString(position.sectionId, 'position.sectionId'),
      order: Number(position.order),
      parentId: position.parentId ? this.sanitizeString(position.parentId, 'position.parentId') : undefined
    };
  }

  private static sanitizeNavigationItem(item: any) {
    if (!item || typeof item !== 'object') {
      throw new Error('Navigation item must be an object');
    }

    return {
      id: this.sanitizeString(item.id, 'navigationItem.id'),
      pageId: this.sanitizeString(item.pageId, 'navigationItem.pageId'),
      displayName: this.sanitizeString(item.displayName, 'navigationItem.displayName'),
      urlSlug: this.sanitizeString(item.urlSlug, 'navigationItem.urlSlug'),
      parentId: item.parentId ? this.sanitizeString(item.parentId, 'navigationItem.parentId') : undefined,
      orderIndex: Number(item.orderIndex),
      isVisible: Boolean(item.isVisible),
      isActive: Boolean(item.isActive)
    };
  }

  private static validateContentType(type: any): 'text' | 'json' | 'file' {
    if (!['text', 'json', 'file'].includes(type)) {
      throw new Error('Content type must be text, json, or file');
    }
    return type;
  }

  private static validateChangeType(type: any): 'reorder' | 'add' | 'remove' | 'update' {
    if (!['reorder', 'add', 'remove', 'update'].includes(type)) {
      throw new Error('Change type must be reorder, add, remove, or update');
    }
    return type;
  }

  private static validatePresenceAction(action: any): 'editing' | 'idle' {
    if (!['editing', 'idle'].includes(action)) {
      throw new Error('Presence action must be editing or idle');
    }
    return action;
  }

  private static validatePresenceUpdateAction(action: any): 'join' | 'leave' | 'update' {
    if (!['join', 'leave', 'update'].includes(action)) {
      throw new Error('Presence update action must be join, leave, or update');
    }
    return action;
  }

  private static validateConflictType(type: any): 'content' | 'structure' {
    if (!['content', 'structure'].includes(type)) {
      throw new Error('Conflict type must be content or structure');
    }
    return type;
  }
}

// Event serialization and deserialization
export class EventSerializer {
  static serialize(event: RealtimeEvent): string {
    try {
      return JSON.stringify(event);
    } catch (error) {
      throw new Error(`Failed to serialize event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static deserialize(eventString: string): RealtimeEvent {
    try {
      const event = JSON.parse(eventString);
      const validation = EventValidator.validateEvent(event);
      
      if (!validation.isValid) {
        throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
      }
      
      return {
        ...event,
        data: validation.sanitizedData
      };
    } catch (error) {
      throw new Error(`Failed to deserialize event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Event routing system
export class RealtimeEventRouter implements EventRouter {
  private handlers: Map<RealtimeEvent['type'], Set<EventHandler>> = new Map();

  register<T = any>(eventType: RealtimeEvent['type'], handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  unregister(eventType: RealtimeEvent['type'], handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  async route(event: RealtimeEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      console.warn(`No handlers registered for event type: ${event.type}`);
      return;
    }

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event, event.data);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    });

    await Promise.all(promises);
  }

  getRegisteredEventTypes(): RealtimeEvent['type'][] {
    return Array.from(this.handlers.keys());
  }

  getHandlerCount(eventType: RealtimeEvent['type']): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

// Singleton event router instance
let eventRouterInstance: RealtimeEventRouter | null = null;

export function getEventRouter(): RealtimeEventRouter {
  if (!eventRouterInstance) {
    eventRouterInstance = new RealtimeEventRouter();
  }
  return eventRouterInstance;
}