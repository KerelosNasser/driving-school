import { EventEmitter } from 'events';

export interface PubSubMessage {
  topic: string;
  payload: any;
  timestamp: number;
}

export interface PubSubSubscription {
  id: string;
  topic: string;
  callback: (payload: any) => void;
}

class PubSubManager extends EventEmitter {
  private subscriptions: Map<string, PubSubSubscription[]> = new Map();
  private isHealthy: boolean = true;
  private lastHealthCheck: number = Date.now();

  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners for high-traffic scenarios
  }

  /**
   * Publish a message to a topic
   */
  publish(topic: string, payload: any): void {
    try {
      const message: PubSubMessage = {
        topic,
        payload,
        timestamp: Date.now()
      };

      this.emit(topic, message.payload);
      
      // Update health status
      this.isHealthy = true;
      this.lastHealthCheck = Date.now();
    } catch (error) {
      console.error('Error publishing message:', error);
      this.isHealthy = false;
    }
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, callback: (payload: any) => void): string {
    const subscriptionId = `${topic}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: PubSubSubscription = {
      id: subscriptionId,
      topic,
      callback
    };

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }

    this.subscriptions.get(topic)!.push(subscription);
    this.on(topic, callback);

    return subscriptionId;
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [topic, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        const subscription = subs[index];
        if (subscription) {
          this.off(topic, subscription.callback);
        }
        subs.splice(index, 1);
        
        if (subs.length === 0) {
          this.subscriptions.delete(topic);
        }
        
        return true;
      }
    }
    return false;
  }

  /**
   * Get all active subscriptions for a topic
   */
  getSubscriptions(topic: string): PubSubSubscription[] {
    return this.subscriptions.get(topic) || [];
  }

  /**
   * Get all active topics
   */
  getActiveTopics(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Clear all subscriptions
   */
  clearAll(): void {
    this.removeAllListeners();
    this.subscriptions.clear();
  }

  /**
   * Get health status
   */
  getHealthStatus(): { healthy: boolean; lastCheck: number; subscriptionCount: number } {
    const subscriptionCount = Array.from(this.subscriptions.values())
      .reduce((total, subs) => total + subs.length, 0);

    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      subscriptionCount
    };
  }
}

// Create singleton instance
export const pubsub = new PubSubManager();

// Common topic constants
export const TOPICS = {
  USER_ACTIVITY: 'user_activity',
  BOOKING_CREATED: 'booking_created',
  BOOKING_UPDATED: 'booking_updated',
  BOOKING_CANCELLED: 'booking_cancelled',
  INSTRUCTOR_AVAILABILITY: 'instructor_availability',
  NOTIFICATION: 'notification',
  REALTIME_UPDATE: 'realtime_update',
  DRAG_DROP_UPDATE: 'drag_drop_update',
  THEME_CHANGE: 'theme_change',
  CONTENT_UPDATE: 'content_update'
} as const;

/**
 * Health check function for monitoring
 */
export function checkPubSubHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const health = pubsub.getHealthStatus();
      const isHealthy = health.healthy && (Date.now() - health.lastCheck) < 60000; // 1 minute threshold
      resolve(isHealthy);
    } catch (error) {
      console.error('PubSub health check failed:', error);
      resolve(false);
    }
  });
}

/**
 * Utility function to publish with error handling
 */
export function safePublish(topic: string, payload: any): boolean {
  try {
    pubsub.publish(topic, payload);
    return true;
  } catch (error) {
    console.error(`Failed to publish to topic ${topic}:`, error);
    return false;
  }
}

/**
 * Utility function to subscribe with automatic cleanup
 */
export function safeSubscribe(
  topic: string, 
  callback: (payload: any) => void,
  timeoutMs?: number
): string {
  const subscriptionId = pubsub.subscribe(topic, callback);
  
  if (timeoutMs) {
    setTimeout(() => {
      pubsub.unsubscribe(subscriptionId);
    }, timeoutMs);
  }
  
  return subscriptionId;
}

/**
 * Booking-specific publish functions
 */
export function publishBookingCreated(payload: any): boolean {
  return safePublish('booking:created', payload);
}

export function publishBookingUpdated(payload: any): boolean {
  return safePublish('booking:updated', payload);
}

export function publishBookingCancelled(payload: any): boolean {
  return safePublish('booking:cancelled', payload);
}

/**
 * Quota-specific publish functions
 */
export function publishQuotaUpdated(payload: any): boolean {
  return safePublish('quota:updated', payload);
}

export function publishQuotaCreated(payload: any): boolean {
  return safePublish('quota:created', payload);
}

export default pubsub;