// Core real-time event types
export interface RealtimeEvent {
  id: string;
  type: 'content_change' | 'component_add' | 'component_move' | 'component_delete' | 
        'page_create' | 'nav_update' | 'presence_update' | 'conflict_detected';
  pageName: string;
  userId: string;
  timestamp: string;
  data: any;
  version: string;
}

// Editor presence tracking
export interface EditorPresence {
  userId: string;
  userName: string;
  avatar?: string;
  componentId?: string;
  action: 'editing' | 'idle';
  lastSeen: string;
}

// Conflict detection and resolution
export interface ConflictItem {
  id: string;
  type: 'content' | 'structure';
  componentId: string;
  localVersion: any;
  remoteVersion: any;
  conflictedAt: string;
  conflictedBy: string;
}

export interface ConflictResolution {
  conflictId: string;
  strategy: 'accept_remote' | 'keep_local' | 'merge';
  resolvedBy: string;
  resolvedAt: string;
  resultingData: any;
}

// Component positioning and management
export interface ComponentPosition {
  pageId: string;
  sectionId: string;
  order: number;
  parentId?: string;
}

export interface ComponentInstance {
  id: string;
  type: string;
  position: ComponentPosition;
  props: Record<string, any>;
  version: string;
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

// Page and navigation management
export interface NewPageData {
  title: string;
  urlSlug: string;
  navigationOrder?: number;
  isVisible?: boolean;
  template?: string;
}

export interface NavigationItem {
  id: string;
  pageId: string;
  displayName: string;
  urlSlug: string;
  parentId?: string;
  orderIndex: number;
  isVisible: boolean;
  isActive: boolean;
}

// Event-specific data types
export interface ContentChangeEventData {
  contentKey: string;
  oldValue: any;
  newValue: any;
  contentType: 'text' | 'json' | 'file';
  componentId?: string;
}

export interface ComponentAddEventData {
  componentId: string;
  componentType: string;
  position: ComponentPosition;
  props: Record<string, any>;
}

export interface ComponentMoveEventData {
  componentId: string;
  oldPosition: ComponentPosition;
  newPosition: ComponentPosition;
}

export interface ComponentDeleteEventData {
  componentId: string;
  position: ComponentPosition;
  componentType: string;
}

export interface PageCreateEventData {
  pageId: string;
  pageData: NewPageData;
  navigationItem: NavigationItem;
}

export interface NavigationUpdateEventData {
  items: NavigationItem[];
  changeType: 'reorder' | 'add' | 'remove' | 'update';
  affectedItemIds: string[];
}

export interface PresenceUpdateEventData {
  presence: EditorPresence;
  action: 'join' | 'leave' | 'update';
}

export interface ConflictDetectedEventData {
  conflict: ConflictItem;
  affectedUsers: string[];
}

// Union type for all event data
export type RealtimeEventData = 
  | ContentChangeEventData
  | ComponentAddEventData
  | ComponentMoveEventData
  | ComponentDeleteEventData
  | PageCreateEventData
  | NavigationUpdateEventData
  | PresenceUpdateEventData
  | ConflictDetectedEventData;

// Event validation schemas
export interface EventValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

// Event routing and handling
export interface EventHandler<T = any> {
  (event: RealtimeEvent, data: T): Promise<void> | void;
}

export interface EventRouter {
  register<T = any>(eventType: RealtimeEvent['type'], handler: EventHandler<T>): void;
  unregister(eventType: RealtimeEvent['type'], handler: EventHandler): void;
  route(event: RealtimeEvent): Promise<void>;
}

// Subscription management
export interface SubscriptionConfig {
  pageName: string;
  eventTypes?: RealtimeEvent['type'][];
  userId?: string;
  componentId?: string;
}

export interface Subscription {
  id: string;
  config: SubscriptionConfig;
  handler: EventHandler;
  createdAt: string;
  isActive: boolean;
}