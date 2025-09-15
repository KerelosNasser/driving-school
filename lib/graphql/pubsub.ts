import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

// Event types for subscriptions
export enum SubscriptionEvents {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
  QUOTA_UPDATED = 'QUOTA_UPDATED',
  REVIEW_CREATED = 'REVIEW_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  PACKAGE_UPDATED = 'PACKAGE_UPDATED'
}

// Subscription payload types
export interface BookingSubscriptionPayload {
  booking: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
    userId: string;
  };
  userId: string;
}

export interface NotificationSubscriptionPayload {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    userId: string;
    createdAt: string;
  };
  userId: string;
}

export interface QuotaSubscriptionPayload {
  quota: {
    totalHours: number;
    usedHours: number;
    availableHours: number;
  };
  userId: string;
}

export interface ReviewSubscriptionPayload {
  review: {
    id: string;
    name: string;
    rating: number;
    comment: string;
    createdAt: string;
  };
}

export interface UserSubscriptionPayload {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
  };
  userId: string;
}

export interface PackageSubscriptionPayload {
  package: {
    id: string;
    name: string;
    price: number;
    hours: number;
    isActive: boolean;
  };
}

// Create PubSub instance
let pubsub: PubSub | RedisPubSub;

if (process.env.REDIS_URL) {
  // Production: Use Redis for horizontal scaling
  const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  };

  pubsub = new RedisPubSub({
    publisher: new Redis(redisOptions),
    subscriber: new Redis(redisOptions),
  });
} else {
  // Development: Use in-memory PubSub
  pubsub = new PubSub();
}

// Subscription helper functions
export const publishBookingCreated = async (payload: BookingSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.BOOKING_CREATED, {
      bookingCreated: payload.booking,
      userId: payload.userId
    });
  } catch (error) {
    console.error('Failed to publish booking created event:', error);
  }
};

export const publishBookingUpdated = async (payload: BookingSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.BOOKING_UPDATED, {
      bookingUpdated: payload.booking,
      userId: payload.userId
    });
  } catch (error) {
    console.error('Failed to publish booking updated event:', error);
  }
};

export const publishBookingCancelled = async (payload: BookingSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.BOOKING_CANCELLED, {
      bookingCancelled: payload.booking,
      userId: payload.userId
    });
  } catch (error) {
    console.error('Failed to publish booking cancelled event:', error);
  }
};

export const publishNotificationCreated = async (payload: NotificationSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.NOTIFICATION_CREATED, {
      notificationCreated: payload.notification,
      userId: payload.userId
    });
  } catch (error) {
    console.error('Failed to publish notification created event:', error);
  }
};

export const publishQuotaUpdated = async (payload: QuotaSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.QUOTA_UPDATED, {
      quotaUpdated: payload.quota,
      userId: payload.userId
    });
  } catch (error) {
    console.error('Failed to publish quota updated event:', error);
  }
};

export const publishReviewCreated = async (payload: ReviewSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.REVIEW_CREATED, {
      reviewCreated: payload.review
    });
  } catch (error) {
    console.error('Failed to publish review created event:', error);
  }
};

export const publishUserUpdated = async (payload: UserSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.USER_UPDATED, {
      userUpdated: payload.user,
      userId: payload.userId
    });
  } catch (error) {
    console.error('Failed to publish user updated event:', error);
  }
};

export const publishPackageUpdated = async (payload: PackageSubscriptionPayload): Promise<void> => {
  try {
    await pubsub.publish(SubscriptionEvents.PACKAGE_UPDATED, {
      packageUpdated: payload.package
    });
  } catch (error) {
    console.error('Failed to publish package updated event:', error);
  }
};

// Subscription iterators
export const subscribeToBookingCreated = (userId?: string) => {
  return pubsub.asyncIterator([SubscriptionEvents.BOOKING_CREATED]);
};

export const subscribeToBookingUpdated = (userId?: string) => {
  return pubsub.asyncIterator([SubscriptionEvents.BOOKING_UPDATED]);
};

export const subscribeToBookingCancelled = (userId?: string) => {
  return pubsub.asyncIterator([SubscriptionEvents.BOOKING_CANCELLED]);
};

export const subscribeToNotifications = (userId: string) => {
  return pubsub.asyncIterator([SubscriptionEvents.NOTIFICATION_CREATED]);
};

export const subscribeToQuotaUpdates = (userId: string) => {
  return pubsub.asyncIterator([SubscriptionEvents.QUOTA_UPDATED]);
};

export const subscribeToReviews = () => {
  return pubsub.asyncIterator([SubscriptionEvents.REVIEW_CREATED]);
};

export const subscribeToUserUpdates = (userId: string) => {
  return pubsub.asyncIterator([SubscriptionEvents.USER_UPDATED]);
};

export const subscribeToPackageUpdates = () => {
  return pubsub.asyncIterator([SubscriptionEvents.PACKAGE_UPDATED]);
};

// Subscription filters
export const withFilter = (asyncIterator: any, filterFn: (payload: any, variables: any, context: any) => boolean) => {
  return {
    [Symbol.asyncIterator]: () => {
      const iterator = asyncIterator[Symbol.asyncIterator]();
      return {
        async next() {
          let result = await iterator.next();
          while (!result.done) {
            if (filterFn(result.value, {}, {})) {
              return result;
            }
            result = await iterator.next();
          }
          return result;
        },
        return() {
          return iterator.return ? iterator.return() : Promise.resolve({ value: undefined, done: true });
        },
        throw(error: any) {
          return iterator.throw ? iterator.throw(error) : Promise.reject(error);
        }
      };
    }
  };
};

// User-specific subscription filters
export const createUserFilter = (userId: string) => {
  return (payload: any) => {
    return payload.userId === userId;
  };
};

export const createAdminFilter = () => {
  return (payload: any, variables: any, context: any) => {
    return context.user && context.user.role === 'admin';
  };
};

// Subscription connection management
class SubscriptionManager {
  private connections = new Map<string, Set<string>>();
  private userConnections = new Map<string, Set<string>>();

  addConnection(connectionId: string, userId?: string): void {
    if (!this.connections.has(connectionId)) {
      this.connections.set(connectionId, new Set());
    }

    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
    }
  }

  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    
    // Remove from user connections
    for (const [userId, connections] of this.userConnections.entries()) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  addSubscription(connectionId: string, subscriptionId: string): void {
    const subscriptions = this.connections.get(connectionId);
    if (subscriptions) {
      subscriptions.add(subscriptionId);
    }
  }

  removeSubscription(connectionId: string, subscriptionId: string): void {
    const subscriptions = this.connections.get(connectionId);
    if (subscriptions) {
      subscriptions.delete(subscriptionId);
    }
  }

  getUserConnections(userId: string): string[] {
    const connections = this.userConnections.get(userId);
    return connections ? Array.from(connections) : [];
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: string): number {
    const connections = this.userConnections.get(userId);
    return connections ? connections.size : 0;
  }

  cleanup(): void {
    this.connections.clear();
    this.userConnections.clear();
  }
}

export const subscriptionManager = new SubscriptionManager();

// Health check for PubSub
export const checkPubSubHealth = async (): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> => {
  try {
    if (pubsub instanceof RedisPubSub) {
      // Check Redis connection
      const testKey = `health_check_${Date.now()}`;
      await pubsub.publish(testKey, { test: true });
      return { status: 'healthy', message: 'Redis PubSub is operational' };
    } else {
      // In-memory PubSub is always healthy if it exists
      return { status: 'healthy', message: 'In-memory PubSub is operational' };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `PubSub health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Graceful shutdown
export const shutdownPubSub = async (): Promise<void> => {
  try {
    subscriptionManager.cleanup();
    
    if (pubsub instanceof RedisPubSub) {
      await pubsub.close();
    }
  } catch (error) {
    console.error('Error during PubSub shutdown:', error);
  }
};

export { pubsub };
export default pubsub;