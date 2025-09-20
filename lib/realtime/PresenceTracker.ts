import { EditorPresence, RealtimeEvent, PresenceUpdateEventData } from './types';
import { RealtimeClient } from './RealtimeClient';
import { EventSerializer, getEventRouter } from './EventSystem';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceConfig {
  heartbeatInterval?: number;
  cleanupInterval?: number;
  presenceTimeout?: number;
  maxPresenceHistory?: number;
}

export interface PresenceState {
  [userId: string]: EditorPresence;
}

export interface PresenceTrackerEvents {
  presenceUpdate: (presence: EditorPresence, action: 'join' | 'leave' | 'update') => void;
  userJoined: (presence: EditorPresence) => void;
  userLeft: (presence: EditorPresence) => void;
  userUpdated: (presence: EditorPresence, previousPresence: EditorPresence) => void;
  presenceStateChanged: (state: PresenceState) => void;
}

export class PresenceTracker {
  private realtimeClient: RealtimeClient;
  private currentPresence: EditorPresence | null = null;
  private presenceState: PresenceState = {};
  private eventListeners: Map<keyof PresenceTrackerEvents, Set<Function>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  
  private config: Required<PresenceConfig> = {
    heartbeatInterval: 30000, // 30 seconds
    cleanupInterval: 60000,   // 1 minute
    presenceTimeout: 120000,  // 2 minutes
    maxPresenceHistory: 100
  };

  constructor(realtimeClient: RealtimeClient, config?: PresenceConfig) {
    this.realtimeClient = realtimeClient;
    this.config = { ...this.config, ...config };
    this.setupEventHandlers();
    this.startHeartbeat();
    this.startCleanup();
  }

  private setupEventHandlers(): void {
    // Register for presence update events
    const eventRouter = getEventRouter();
    eventRouter.register('presence_update', this.handlePresenceUpdateEvent.bind(this));
  }

  private async handlePresenceUpdateEvent(event: RealtimeEvent, data: PresenceUpdateEventData): Promise<void> {
    const { presence, action } = data;
    
    // Don't process our own presence updates
    if (presence.userId === this.currentPresence?.userId) {
      return;
    }

    const previousPresence = this.presenceState[presence.userId];

    switch (action) {
      case 'join':
        this.presenceState[presence.userId] = presence;
        this.emit('userJoined', presence);
        break;
      
      case 'leave':
        delete this.presenceState[presence.userId];
        this.emit('userLeft', presence);
        break;
      
      case 'update':
        this.presenceState[presence.userId] = presence;
        if (previousPresence) {
          this.emit('userUpdated', presence, previousPresence);
        }
        break;
    }

    this.emit('presenceUpdate', presence, action);
    this.emit('presenceStateChanged', { ...this.presenceState });
  }

  public async joinPage(pageName: string, userInfo: Omit<EditorPresence, 'lastSeen'>): Promise<void> {
    if (!this.realtimeClient.isConnected()) {
      await this.realtimeClient.waitForConnection();
    }

    // Create or update current presence
    this.currentPresence = {
      ...userInfo,
      lastSeen: new Date().toISOString()
    };

    // Subscribe to page presence channel
    const channelName = `presence:${pageName}`;
    if (!this.channels.has(channelName)) {
      const channel = this.realtimeClient.subscribe(channelName, {
        config: {
          presence: {
            key: userInfo.userId
          }
        }
      });

      // Handle presence events from Supabase
      channel.on('presence', { event: 'sync' }, () => {
        this.syncPresenceState(channel, pageName);
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handleSupabasePresenceJoin(key, newPresences, pageName);
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handleSupabasePresenceLeave(key, leftPresences, pageName);
      });

      this.channels.set(channelName, channel);
    }

    // Track presence in Supabase
    const channel = this.channels.get(channelName)!;
    await channel.track(this.currentPresence);

    // Broadcast join event
    await this.broadcastPresenceUpdate(pageName, 'join');
  }

  public async leavePage(pageName: string): Promise<void> {
    if (!this.currentPresence) {
      return;
    }

    // Broadcast leave event
    await this.broadcastPresenceUpdate(pageName, 'leave');

    // Untrack presence in Supabase
    const channelName = `presence:${pageName}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.untrack();
      this.realtimeClient.unsubscribe(channelName);
      this.channels.delete(channelName);
    }

    // Clear current presence
    this.currentPresence = null;
  }

  public async updatePresence(
    pageName: string, 
    updates: Partial<Pick<EditorPresence, 'componentId' | 'action' | 'avatar'>>
  ): Promise<void> {
    if (!this.currentPresence) {
      throw new Error('Must join page before updating presence');
    }

    // Update current presence
    this.currentPresence = {
      ...this.currentPresence,
      ...updates,
      lastSeen: new Date().toISOString()
    };

    // Update presence in Supabase
    const channelName = `presence:${pageName}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.track(this.currentPresence);
    }

    // Broadcast update event
    await this.broadcastPresenceUpdate(pageName, 'update');
  }

  private async broadcastPresenceUpdate(
    pageName: string, 
    action: 'join' | 'leave' | 'update'
  ): Promise<void> {
    if (!this.currentPresence) {
      return;
    }

    const event: RealtimeEvent = {
      id: this.generateEventId(),
      type: 'presence_update',
      pageName,
      userId: this.currentPresence.userId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        presence: this.currentPresence,
        action
      } as PresenceUpdateEventData
    };

    // Send through Supabase broadcast
    const channelName = `events:${pageName}`;
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.realtimeClient.subscribe(channelName);
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'presence_update',
      payload: EventSerializer.serialize(event)
    });
  }

  private syncPresenceState(channel: RealtimeChannel, pageName: string): void {
    const presenceState = channel.presenceState();
    const newState: PresenceState = {};

    Object.entries(presenceState).forEach(([userId, presences]) => {
      if (Array.isArray(presences) && presences.length > 0) {
        // Take the most recent presence
        const presence = presences[presences.length - 1] as EditorPresence;
        newState[userId] = presence;
      }
    });

    this.presenceState = newState;
    this.emit('presenceStateChanged', { ...this.presenceState });
  }

  private handleSupabasePresenceJoin(key: string, newPresences: any[], pageName: string): void {
    newPresences.forEach((presence) => {
      if (presence.userId !== this.currentPresence?.userId) {
        this.presenceState[presence.userId] = presence;
        this.emit('userJoined', presence);
        this.emit('presenceUpdate', presence, 'join');
      }
    });
    this.emit('presenceStateChanged', { ...this.presenceState });
  }

  private handleSupabasePresenceLeave(key: string, leftPresences: any[], pageName: string): void {
    leftPresences.forEach((presence) => {
      if (presence.userId !== this.currentPresence?.userId) {
        delete this.presenceState[presence.userId];
        this.emit('userLeft', presence);
        this.emit('presenceUpdate', presence, 'leave');
      }
    });
    this.emit('presenceStateChanged', { ...this.presenceState });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.currentPresence) {
        this.currentPresence.lastSeen = new Date().toISOString();
        
        // Update all active channels
        this.channels.forEach(async (channel, channelName) => {
          if (channelName.startsWith('presence:')) {
            await channel.track(this.currentPresence);
          }
        });
      }
    }, this.config.heartbeatInterval);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStalePresence();
    }, this.config.cleanupInterval);
  }

  private cleanupStalePresence(): void {
    const now = Date.now();
    const staleUserIds: string[] = [];

    Object.entries(this.presenceState).forEach(([userId, presence]) => {
      const lastSeen = new Date(presence.lastSeen).getTime();
      if (now - lastSeen > this.config.presenceTimeout) {
        staleUserIds.push(userId);
      }
    });

    staleUserIds.forEach((userId) => {
      const stalePresence = this.presenceState[userId];
      delete this.presenceState[userId];
      this.emit('userLeft', stalePresence);
      this.emit('presenceUpdate', stalePresence, 'leave');
    });

    if (staleUserIds.length > 0) {
      this.emit('presenceStateChanged', { ...this.presenceState });
    }
  }

  public getCurrentPresence(): EditorPresence | null {
    return this.currentPresence;
  }

  public getPresenceState(): PresenceState {
    return { ...this.presenceState };
  }

  public getUserPresence(userId: string): EditorPresence | undefined {
    return this.presenceState[userId];
  }

  public getActiveUsers(): EditorPresence[] {
    return Object.values(this.presenceState);
  }

  public getUsersEditingComponent(componentId: string): EditorPresence[] {
    return Object.values(this.presenceState).filter(
      presence => presence.componentId === componentId && presence.action === 'editing'
    );
  }

  public isUserOnline(userId: string): boolean {
    return userId in this.presenceState;
  }

  public getOnlineUserCount(): number {
    return Object.keys(this.presenceState).length;
  }

  public on<K extends keyof PresenceTrackerEvents>(
    event: K,
    listener: PresenceTrackerEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  public off<K extends keyof PresenceTrackerEvents>(
    event: K,
    listener: PresenceTrackerEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit<K extends keyof PresenceTrackerEvents>(
    event: K,
    ...args: Parameters<PresenceTrackerEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in presence tracker listener for ${event}:`, error);
        }
      });
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Unsubscribe from all channels
    this.channels.forEach((channel, channelName) => {
      this.realtimeClient.unsubscribe(channelName);
    });
    this.channels.clear();

    // Clear state
    this.presenceState = {};
    this.currentPresence = null;
    this.eventListeners.clear();
  }
}

// Singleton presence tracker instance
let presenceTrackerInstance: PresenceTracker | null = null;

export function getPresenceTracker(realtimeClient: RealtimeClient, config?: PresenceConfig): PresenceTracker {
  if (!presenceTrackerInstance) {
    presenceTrackerInstance = new PresenceTracker(realtimeClient, config);
  }
  return presenceTrackerInstance;
}