// Core real-time infrastructure
export { RealtimeClient, getRealtimeClient } from './RealtimeClient';
export type { ConnectionStatus, ConnectionConfig, RealtimeClientEvents } from './RealtimeClient';

// Event system
export { EventValidator, EventSerializer, RealtimeEventRouter, getEventRouter } from './EventSystem';
export type { EventHandler, EventRouter, EventValidationResult } from './EventSystem';

// Presence tracking
export { PresenceTracker, getPresenceTracker } from './PresenceTracker';
export type { PresenceConfig, PresenceState, PresenceTrackerEvents } from './PresenceTracker';

// Type definitions
export * from './types';
import { RealtimeEvent } from './types';

// React components
export { 
  PresenceIndicators, 
  UserPresenceAvatar, 
  ComponentEditingIndicator, 
  PresenceStatus 
} from '../../components/realtime/PresenceIndicators';

// Utility functions
export function createRealtimeInfrastructure(config?: {
  connectionConfig?: ConnectionConfig;
  presenceConfig?: PresenceConfig;
}) {
  const realtimeClient = getRealtimeClient(config?.connectionConfig);
  const eventRouter = getEventRouter();
  const presenceTracker = getPresenceTracker(realtimeClient, config?.presenceConfig);

  return {
    realtimeClient,
    eventRouter,
    presenceTracker
  };
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isRealtimeEvent(obj: any): obj is RealtimeEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.pageName === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.version === 'string' &&
    obj.data !== undefined
  );
}