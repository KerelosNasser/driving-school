import { RealtimeChannel, RealtimeClient as SupabaseRealtimeClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { logger } from '@/lib/logger';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ConnectionConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface RealtimeClientEvents {
  statusChange: (status: ConnectionStatus) => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
  reconnected: () => void;
}

export class RealtimeClient {
  private client: SupabaseRealtimeClient;
  private channels: Map<string, RealtimeChannel> = new Map();
  private status: ConnectionStatus = 'disconnected';
  private eventListeners: Map<keyof RealtimeClientEvents, Set<Function>> = new Map();
  private retryCount = 0;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;

  private config: Required<ConnectionConfig> = {
    maxRetries: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  constructor(config?: ConnectionConfig) {
    this.client = supabase.realtime;
    this.config = { ...this.config, ...config };
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    // Listen to connection state changes using the modern Supabase API
    // The realtime client in newer versions doesn't expose onOpen/onClose/onError directly
    // Instead, we'll monitor connection status through channel subscriptions and connection events

    // Set up a system channel to monitor connection status
    const systemChannel = this.client.channel('system', {
      config: {
        presence: { key: 'connection_monitor' }
      }
    });

    systemChannel
      .on('system', { event: '*' }, (payload) => {
        // Handle system events if needed
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.handleConnectionOpen();
        } else if (status === 'CHANNEL_ERROR') {
          this.handleConnectionError(new Error('Channel subscription error'));
        } else if (status === 'TIMED_OUT') {
          this.handleConnectionError(new Error('Connection timed out'));
        } else if (status === 'CLOSED') {
          this.handleConnectionClose();
        }
      });

    // Store the system channel for cleanup
    this.channels.set('__system__', systemChannel);
  }

  private handleConnectionOpen(): void {
    logger.info('Realtime connection opened');
    this.status = 'connected';
    this.retryCount = 0;
    this.isReconnecting = false;

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.emit('statusChange', this.status);

    if (this.retryCount > 0) {
      this.emit('reconnected');
    }
  }

  private handleConnectionClose(): void {
    logger.warn('Realtime connection closed');
    this.status = 'disconnected';
    this.emit('statusChange', this.status);

    // Attempt to reconnect if not manually disconnected
    if (!this.isReconnecting) {
      this.attemptReconnect();
    }
  }

  private handleConnectionError(error: any): void {
    logger.error('Realtime connection error:', error);
    this.status = 'error';
    this.emit('statusChange', this.status);
    this.emit('error', new Error(error.message || 'Connection error'));

    // Attempt to reconnect on error
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.retryCount >= this.config.maxRetries) {
      logger.error('Max reconnection attempts reached');
      this.status = 'error';
      this.emit('statusChange', this.status);
      return;
    }

    if (this.isReconnecting) {
      return; // Already attempting to reconnect
    }

    this.isReconnecting = true;
    this.retryCount++;

    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, this.retryCount - 1),
      this.config.maxDelay
    );

    logger.info(`Attempting to reconnect (${this.retryCount}/${this.config.maxRetries}) in ${delay}ms`);
    this.emit('reconnecting', this.retryCount);

    this.retryTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.status = 'connecting';
        this.emit('statusChange', this.status);

        // In modern Supabase, connection is established automatically when creating channels
        // We'll resolve immediately and let the channel subscription handle the actual connection
        setTimeout(() => {
          if (this.status === 'connecting') {
            // If still connecting after a brief delay, assume connection is established
            this.handleConnectionOpen();
          }
          resolve();
        }, 100);

      } catch (error) {
        this.status = 'error';
        this.emit('statusChange', this.status);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.isReconnecting = false;

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // Unsubscribe from all channels
    this.channels.forEach((channel) => {
      channel.unsubscribe();
      this.client.removeChannel(channel);
    });
    this.channels.clear();

    this.status = 'disconnected';
    this.emit('statusChange', this.status);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  public subscribe(channelName: string, config?: any): RealtimeChannel {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.client.channel(channelName, config);
    this.channels.set(channelName, channel);

    // Subscribe to the channel with proper error handling
    channel.subscribe((status) => {
      logger.debug(`Channel ${channelName} subscription status:`, status);

      if (status === 'SUBSCRIBED') {
        // Channel successfully subscribed
        if (this.status !== 'connected') {
          this.handleConnectionOpen();
        }
      } else if (status === 'CHANNEL_ERROR') {
        this.handleConnectionError(new Error(`Channel ${channelName} subscription error`));
      } else if (status === 'TIMED_OUT') {
        this.handleConnectionError(new Error(`Channel ${channelName} subscription timed out`));
      } else if (status === 'CLOSED') {
        // Channel closed, might indicate connection issues
        if (this.status === 'connected') {
          this.handleConnectionClose();
        }
      }
    });

    return channel;
  }

  public unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  public getChannel(channelName: string): RealtimeChannel | undefined {
    return this.channels.get(channelName);
  }

  public on<K extends keyof RealtimeClientEvents>(
    event: K,
    listener: RealtimeClientEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  public off<K extends keyof RealtimeClientEvents>(
    event: K,
    listener: RealtimeClientEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit<K extends keyof RealtimeClientEvents>(
    event: K,
    ...args: Parameters<RealtimeClientEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as any)(...args);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public async waitForConnection(timeout = 10000): Promise<void> {
    if (this.isConnected()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off('statusChange', onStatusChange);
        reject(new Error('Connection timeout'));
      }, timeout);

      const onStatusChange = (status: ConnectionStatus) => {
        if (status === 'connected') {
          clearTimeout(timeoutId);
          this.off('statusChange', onStatusChange);
          resolve();
        } else if (status === 'error') {
          clearTimeout(timeoutId);
          this.off('statusChange', onStatusChange);
          reject(new Error('Connection failed'));
        }
      };

      this.on('statusChange', onStatusChange);
    });
  }

  public getConnectionMetrics() {
    return {
      status: this.status,
      retryCount: this.retryCount,
      channelCount: this.channels.size,
      isReconnecting: this.isReconnecting
    };
  }
}

// Singleton instance
let realtimeClientInstance: RealtimeClient | null = null;

export function getRealtimeClient(config?: ConnectionConfig): RealtimeClient {
  if (!realtimeClientInstance) {
    realtimeClientInstance = new RealtimeClient(config);
  }
  return realtimeClientInstance;
}