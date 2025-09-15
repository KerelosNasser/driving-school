import DataLoader from 'dataloader';
import { supabaseAdmin } from '@/lib/api/utils';
import { GraphQLError } from 'graphql';

// Modern type definitions with strict typing
interface User {
  readonly id: string;
  readonly clerkId?: string | null;
  readonly fullName?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly address?: string | null;
  readonly suburb?: string | null;
  readonly experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
  readonly goals?: string | null;
  readonly emergencyContact?: string | null;
  readonly emergencyPhone?: string | null;
  readonly invitationCode?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface UserQuota {
  readonly id: string;
  readonly userId: string;
  readonly totalHours: number;
  readonly usedHours: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface Package {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly price: number;
  readonly hours: number;
  readonly features: string[];
  readonly isActive: boolean;
  readonly sortOrder?: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface Review {
  readonly id: string;
  readonly name: string;
  readonly email?: string | null;
  readonly rating: number;
  readonly comment: string;
  readonly approved: boolean;
  readonly createdAt: string;
}

interface Booking {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  lessonHours: number;
  status: string;
  googleEventId?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuotaTransaction {
  id: string;
  userId: string;
  type: string;
  hours: number;
  description?: string;
  packageId?: string;
  createdAt: string;
}

// Batch loading functions
const batchLoadUsers = async (ids: readonly string[]): Promise<(User | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('id', ids as string[]);

    if (error) {
      throw new GraphQLError(`Failed to load users: ${error.message}`);
    }

    // Create a map for O(1) lookup
    const userMap = new Map<string, User>();
    data?.forEach(user => {
      userMap.set(user.id, {
        id: user.id,
        clerkId: user.clerk_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        suburb: user.suburb,
        experienceLevel: user.experience_level,
        goals: user.goals,
        emergencyContact: user.emergency_contact,
        emergencyPhone: user.emergency_phone,
        invitationCode: user.invitation_code,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });
    });

    // Return results in the same order as requested IDs
    return ids.map(id => {
      const user = userMap.get(id);
      return user || new Error(`User not found: ${id}`);
    });
  } catch (error) {
    // Return error for all requested IDs
    return ids.map(() => error as Error);
  }
};

const batchLoadUserQuotas = async (userIds: readonly string[]): Promise<(UserQuota | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_quotas')
      .select('*')
      .in('user_id', userIds as string[]);

    if (error) {
      throw new GraphQLError(`Failed to load user quotas: ${error.message}`);
    }

    const quotaMap = new Map<string, UserQuota>();
    data?.forEach(quota => {
      quotaMap.set(quota.user_id, {
        id: quota.id,
        userId: quota.user_id,
        totalHours: parseFloat(quota.total_hours) || 0,
        usedHours: parseFloat(quota.used_hours) || 0,
        createdAt: quota.created_at,
        updatedAt: quota.updated_at
      });
    });

    return userIds.map(userId => {
      const quota = quotaMap.get(userId);
      if (quota) {
        return quota;
      }
      // Return default quota if none exists
      return {
        id: `default-${userId}`,
        userId,
        totalHours: 0,
        usedHours: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  } catch (error) {
    return userIds.map(() => error as Error);
  }
};

const batchLoadPackages = async (ids: readonly string[]): Promise<(Package | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .in('id', ids as string[]);

    if (error) {
      throw new GraphQLError(`Failed to load packages: ${error.message}`);
    }

    const packageMap = new Map<string, Package>();
    data?.forEach(pkg => {
      packageMap.set(pkg.id, {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: parseFloat(pkg.price),
        hours: parseFloat(pkg.hours),
        features: pkg.features || [],
        isActive: pkg.is_active,
        sortOrder: pkg.sort_order,
        createdAt: pkg.created_at,
        updatedAt: pkg.updated_at
      });
    });

    return ids.map(id => {
      const pkg = packageMap.get(id);
      return pkg || new Error(`Package not found: ${id}`);
    });
  } catch (error) {
    return ids.map(() => error as Error);
  }
};

const batchLoadReviews = async (ids: readonly string[]): Promise<(Review | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .in('id', ids as string[]);

    if (error) {
      throw new GraphQLError(`Failed to load reviews: ${error.message}`);
    }

    const reviewMap = new Map<string, Review>();
    data?.forEach(review => {
      reviewMap.set(review.id, {
        id: review.id,
        name: review.name,
        email: review.email,
        rating: review.rating,
        comment: review.comment,
        approved: review.approved,
        createdAt: review.created_at
      });
    });

    return ids.map(id => {
      const review = reviewMap.get(id);
      return review || new Error(`Review not found: ${id}`);
    });
  } catch (error) {
    return ids.map(() => error as Error);
  }
};

const batchLoadBookings = async (ids: readonly string[]): Promise<(Booking | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .in('id', ids as string[]);

    if (error) {
      throw new GraphQLError(`Failed to load bookings: ${error.message}`);
    }

    const bookingMap = new Map<string, Booking>();
    data?.forEach(booking => {
      bookingMap.set(booking.id, {
        id: booking.id,
        userId: booking.user_id,
        title: booking.title,
        description: booking.description,
        startTime: booking.start_time,
        endTime: booking.end_time,
        location: booking.location,
        lessonHours: parseFloat(booking.lesson_hours),
        status: booking.status,
        googleEventId: booking.google_event_id,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      });
    });

    return ids.map(id => {
      const booking = bookingMap.get(id);
      return booking || new Error(`Booking not found: ${id}`);
    });
  } catch (error) {
    return ids.map(() => error as Error);
  }
};

const batchLoadQuotaTransactions = async (ids: readonly string[]): Promise<(QuotaTransaction | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('quota_transactions')
      .select('*')
      .in('id', ids as string[]);

    if (error) {
      throw new GraphQLError(`Failed to load quota transactions: ${error.message}`);
    }

    const transactionMap = new Map<string, QuotaTransaction>();
    data?.forEach(transaction => {
      transactionMap.set(transaction.id, {
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type,
        hours: parseFloat(transaction.hours),
        description: transaction.description,
        packageId: transaction.package_id,
        createdAt: transaction.created_at
      });
    });

    return ids.map(id => {
      const transaction = transactionMap.get(id);
      return transaction || new Error(`Transaction not found: ${id}`);
    });
  } catch (error) {
    return ids.map(() => error as Error);
  }
};

// Batch loading for user's bookings
const batchLoadUserBookings = async (userIds: readonly string[]): Promise<(Booking[] | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .in('user_id', userIds as string[])
      .order('start_time', { ascending: false });

    if (error) {
      throw new GraphQLError(`Failed to load user bookings: ${error.message}`);
    }

    const bookingsByUser = new Map<string, Booking[]>();
    data?.forEach(booking => {
      const userId = booking.user_id;
      if (!bookingsByUser.has(userId)) {
        bookingsByUser.set(userId, []);
      }
      bookingsByUser.get(userId)!.push({
        id: booking.id,
        userId: booking.user_id,
        title: booking.title,
        description: booking.description,
        startTime: booking.start_time,
        endTime: booking.end_time,
        location: booking.location,
        lessonHours: parseFloat(booking.lesson_hours),
        status: booking.status,
        googleEventId: booking.google_event_id,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      });
    });

    return userIds.map(userId => {
      return bookingsByUser.get(userId) || [];
    });
  } catch (error) {
    return userIds.map(() => error as Error);
  }
};

// Batch loading for user's transactions
const batchLoadUserTransactions = async (userIds: readonly string[]): Promise<(QuotaTransaction[] | Error)[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('quota_transactions')
      .select('*')
      .in('user_id', userIds as string[])
      .order('created_at', { ascending: false });

    if (error) {
      throw new GraphQLError(`Failed to load user transactions: ${error.message}`);
    }

    const transactionsByUser = new Map<string, QuotaTransaction[]>();
    data?.forEach(transaction => {
      const userId = transaction.user_id;
      if (!transactionsByUser.has(userId)) {
        transactionsByUser.set(userId, []);
      }
      transactionsByUser.get(userId)!.push({
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type,
        hours: parseFloat(transaction.hours),
        description: transaction.description,
        packageId: transaction.package_id,
        createdAt: transaction.created_at
      });
    });

    return userIds.map(userId => {
      return transactionsByUser.get(userId) || [];
    });
  } catch (error) {
    return userIds.map(() => error as Error);
  }
};

// Create and configure DataLoaders
export const createDataLoaders = () => {
  return {
    // Primary entity loaders
    userLoader: new DataLoader<string, User | Error>(
      batchLoadUsers,
      {
        maxBatchSize: 100,
        cacheKeyFn: (key: string) => key,
        cacheMap: new Map(), // Use default Map for caching
      }
    ),

    quotaLoader: new DataLoader<string, UserQuota | Error>(
      batchLoadUserQuotas,
      {
        maxBatchSize: 100,
        cacheKeyFn: (key: string) => key,
      }
    ),

    packageLoader: new DataLoader<string, Package | Error>(
      batchLoadPackages,
      {
        maxBatchSize: 50,
        cacheKeyFn: (key: string) => key,
      }
    ),

    reviewLoader: new DataLoader<string, Review | Error>(
      batchLoadReviews,
      {
        maxBatchSize: 100,
        cacheKeyFn: (key: string) => key,
      }
    ),

    bookingLoader: new DataLoader<string, Booking | Error>(
      batchLoadBookings,
      {
        maxBatchSize: 100,
        cacheKeyFn: (key: string) => key,
      }
    ),

    transactionLoader: new DataLoader<string, QuotaTransaction | Error>(
      batchLoadQuotaTransactions,
      {
        maxBatchSize: 100,
        cacheKeyFn: (key: string) => key,
      }
    ),

    // Relationship loaders
    userBookingsLoader: new DataLoader<string, Booking[] | Error>(
      batchLoadUserBookings,
      {
        maxBatchSize: 50,
        cacheKeyFn: (key: string) => key,
      }
    ),

    userTransactionsLoader: new DataLoader<string, QuotaTransaction[] | Error>(
      batchLoadUserTransactions,
      {
        maxBatchSize: 50,
        cacheKeyFn: (key: string) => key,
      }
    ),
  };
};

// Helper function to clear all caches
export const clearAllCaches = (dataloaders: ReturnType<typeof createDataLoaders>) => {
  Object.values(dataloaders).forEach(loader => {
    loader.clearAll();
  });
};

// Helper function to prime cache with data
export const primeCache = (
  dataloaders: ReturnType<typeof createDataLoaders>,
  entityType: keyof ReturnType<typeof createDataLoaders>,
  id: string,
  data: any
) => {
  const loader = dataloaders[entityType] as DataLoader<string, any>;
  loader.prime(id, data);
};

// Export types for use in other files
export type {
  User,
  UserQuota,
  Package,
  Review,
  Booking,
  QuotaTransaction
};