import { GraphQLResolveInfo, GraphQLScalarType } from 'graphql';
import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { supabaseAdmin } from '@/lib/api/utils';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createDataLoaders } from './dataloaders';
import { GraphQLError } from 'graphql';
import { validateQuotaTransaction, validateBooking } from './validators';
import { pubsub } from './pubsub';

// Custom scalar for UUID
const UUIDType = new GraphQLScalarType({
  name: 'UUID',
  description: 'UUID scalar type',
  serialize: (value: any) => value,
  parseValue: (value: any) => value,
  parseLiteral: (ast: any) => ast.value,
});

// Context type
export interface GraphQLContext {
  user?: {
    id: string;
    clerkId: string;
    email: string;
    role?: string;
  };
  dataloaders: ReturnType<typeof createDataLoaders>;
  req: any;
}

// Helper function to get authenticated user
async function getAuthenticatedUser(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
}

// Helper function to check admin permissions
async function requireAdmin(context: GraphQLContext) {
  const user = await getAuthenticatedUser(context);
  if (user.role !== 'admin') {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
}

// Helper function to get or create Supabase user ID
async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const email = clerkUser?.primaryEmailAddress?.emailAddress || '';
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'Unknown User';

  const { data: inserted, error } = await supabaseAdmin
    .from('users')
    .upsert({ clerk_id: clerkUserId, email, full_name: fullName }, { onConflict: 'clerk_id' })
    .select('id')
    .single();

  if (error || !inserted) {
    throw new GraphQLError(`Failed to create user: ${error?.message}`);
  }

  return inserted.id;
}

export const resolvers = {
  // Scalar resolvers
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  UUID: UUIDType,

  // Query resolvers
  Query: {
    // User queries
    me: async (_: any, __: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);
      return context.dataloaders.userLoader.load(supabaseUserId);
    },

    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      await requireAdmin(context);
      return context.dataloaders.userLoader.load(id);
    },

    users: async (_: any, { pagination = {}, filter = {} }: any, context: GraphQLContext) => {
      await requireAdmin(context);
      const { limit = 20, offset = 0 } = pagination;
      
      let query = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (filter.search) {
        query = query.or(`full_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw new GraphQLError(error.message);

      return {
        users: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    },

    // Package queries
    package: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return context.dataloaders.packageLoader.load(id);
    },

    packages: async (_: any, { pagination = {}, filter = {} }: any) => {
      const { limit = 20, offset = 0 } = pagination;
      
      let query = supabaseAdmin
        .from('packages')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('sort_order', { ascending: true });

      if (filter.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }

      const { data, error, count } = await query;
      if (error) throw new GraphQLError(error.message);

      return {
        packages: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    },

    activePackages: async () => {
      const { data, error } = await supabaseAdmin
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw new GraphQLError(error.message);
      return data || [];
    },

    // Review queries
    reviews: async (_: any, { pagination = {}, filter = {} }: any) => {
      const { limit = 20, offset = 0 } = pagination;
      
      let query = supabaseAdmin
        .from('reviews')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (filter.approved !== undefined) {
        query = query.eq('approved', filter.approved);
      }

      const { data, error, count } = await query;
      if (error) throw new GraphQLError(error.message);

      return {
        reviews: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    },

    approvedReviews: async (_: any, { limit = 10 }: { limit?: number }) => {
      const { data, error } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw new GraphQLError(error.message);
      return data || [];
    },

    // Booking queries
    myBookings: async (_: any, { pagination = {} }: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);
      const { limit = 20, offset = 0 } = pagination;

      const { data, error, count } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('user_id', supabaseUserId)
        .range(offset, offset + limit - 1)
        .order('start_time', { ascending: false });

      if (error) throw new GraphQLError(error.message);

      return {
        bookings: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    },

    // Quota queries
    myQuota: async (_: any, __: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);
      return context.dataloaders.quotaLoader.load(supabaseUserId);
    },

    quotaStats: async (_: any, __: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);
      
      const quota = await context.dataloaders.quotaLoader.load(supabaseUserId);
      const remainingHours = quota.totalHours - quota.usedHours;
      const utilizationRate = quota.totalHours > 0 ? (quota.usedHours / quota.totalHours) * 100 : 0;

      return {
        totalHours: quota.totalHours,
        usedHours: quota.usedHours,
        remainingHours,
        utilizationRate
      };
    },

    // Referral queries
    myReferrals: async (_: any, __: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);

      const { data, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referrer_id', supabaseUserId)
        .order('created_at', { ascending: false });

      if (error) throw new GraphQLError(error.message);
      return data || [];
    },

    myRewards: async (_: any, __: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);

      const { data, error } = await supabaseAdmin
        .from('referral_rewards')
        .select('*')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false });

      if (error) throw new GraphQLError(error.message);
      return data || [];
    },

    // Notification queries
    myNotifications: async (_: any, { pagination = {} }: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);
      const { limit = 20, offset = 0 } = pagination;

      const { data, error } = await supabaseAdmin
        .from('user_notifications')
        .select('*')
        .eq('user_id', supabaseUserId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw new GraphQLError(error.message);
      return data || [];
    },

    unreadNotificationCount: async (_: any, __: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);

      const { count, error } = await supabaseAdmin
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', supabaseUserId)
        .eq('status', 'UNREAD');

      if (error) throw new GraphQLError(error.message);
      return count || 0;
    },

    // Admin queries
    systemStats: async (_: any, __: any, context: GraphQLContext) => {
      await requireAdmin(context);

      const [usersResult, bookingsResult, reviewsResult] = await Promise.all([
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('reviews').select('rating').eq('approved', true)
      ]);

      const totalUsers = usersResult.count || 0;
      const totalBookings = bookingsResult.count || 0;
      const reviews = reviewsResult.data || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;

      return {
        totalUsers,
        activeUsers: totalUsers, // Simplified for now
        totalBookings,
        totalReviews,
        averageRating,
        totalRevenue: 0 // Would need to calculate from transactions
      };
    }
  },

  // Mutation resolvers
  Mutation: {
    // User mutations
    updateUser: async (_: any, { input }: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          full_name: input.fullName,
          phone: input.phone,
          address: input.address,
          suburb: input.suburb,
          experience_level: input.experienceLevel,
          goals: input.goals,
          emergency_contact: input.emergencyContact,
          emergency_phone: input.emergencyPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', supabaseUserId)
        .select()
        .single();

      if (error) throw new GraphQLError(error.message);
      
      // Clear cache
      context.dataloaders.userLoader.clear(supabaseUserId);
      
      return data;
    },

    // Package mutations
    createPackage: async (_: any, { input }: any, context: GraphQLContext) => {
      await requireAdmin(context);

      const { data, error } = await supabaseAdmin
        .from('packages')
        .insert({
          name: input.name,
          description: input.description,
          price: input.price,
          hours: input.hours,
          features: input.features,
          is_active: input.isActive,
          sort_order: input.sortOrder
        })
        .select()
        .single();

      if (error) throw new GraphQLError(error.message);
      return data;
    },

    // Booking mutations
    createBooking: async (_: any, { input }: any, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);

      // Validate booking
      const validation = validateBooking(input);
      if (!validation.isValid) {
        throw new GraphQLError(`Validation error: ${validation.errors.join(', ')}`);
      }

      const { data, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: supabaseUserId,
          title: input.title,
          description: input.description,
          start_time: input.startTime,
          end_time: input.endTime,
          location: input.location,
          lesson_hours: input.lessonHours,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw new GraphQLError(error.message);

      // Publish subscription
      pubsub.publish('BOOKING_STATUS_CHANGED', {
        bookingStatusChanged: data,
        userId: supabaseUserId
      });

      return data;
    },

    // Review mutations
    createReview: async (_: any, { input }: any, context: GraphQLContext) => {
      const { data, error } = await supabaseAdmin
        .from('reviews')
        .insert({
          name: input.name,
          email: input.email,
          rating: input.rating,
          comment: input.comment,
          approved: false // Reviews need approval
        })
        .select()
        .single();

      if (error) throw new GraphQLError(error.message);
      return data;
    },

    // Quota mutations
    purchaseQuota: async (_: any, { packageId }: { packageId: string }, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);

      // Get package details
      const packageData = await context.dataloaders.packageLoader.load(packageId);
      if (!packageData) {
        throw new GraphQLError('Package not found');
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('quota_transactions')
        .insert({
          user_id: supabaseUserId,
          type: 'PURCHASE',
          hours: packageData.hours,
          description: `Purchased ${packageData.name}`,
          package_id: packageId
        })
        .select()
        .single();

      if (transactionError) throw new GraphQLError(transactionError.message);

      // Update user quota
      const { error: quotaError } = await supabaseAdmin
        .from('user_quotas')
        .upsert({
          user_id: supabaseUserId,
          total_hours: supabaseAdmin.raw('COALESCE(total_hours, 0) + ?', [packageData.hours])
        }, { onConflict: 'user_id' });

      if (quotaError) throw new GraphQLError(quotaError.message);

      // Clear cache
      context.dataloaders.quotaLoader.clear(supabaseUserId);

      // Publish subscription
      const updatedQuota = await context.dataloaders.quotaLoader.load(supabaseUserId);
      pubsub.publish('QUOTA_UPDATED', {
        quotaUpdated: updatedQuota,
        userId: supabaseUserId
      });

      return transaction;
    },

    // Notification mutations
    markNotificationRead: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const user = await getAuthenticatedUser(context);
      const supabaseUserId = await getOrCreateSupabaseUserId(user.clerkId);

      const { data, error } = await supabaseAdmin
        .from('user_notifications')
        .update({
          status: 'READ',
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', supabaseUserId)
        .select()
        .single();

      if (error) throw new GraphQLError(error.message);
      return data;
    }
  },

  // Subscription resolvers
  Subscription: {
    notificationAdded: {
      subscribe: (_: any, { userId }: { userId: string }) => {
        return pubsub.asyncIterator(['NOTIFICATION_ADDED']);
      },
      resolve: (payload: any, { userId }: { userId: string }) => {
        if (payload.userId === userId) {
          return payload.notificationAdded;
        }
        return null;
      }
    },

    bookingStatusChanged: {
      subscribe: (_: any, { userId }: { userId: string }) => {
        return pubsub.asyncIterator(['BOOKING_STATUS_CHANGED']);
      },
      resolve: (payload: any, { userId }: { userId: string }) => {
        if (payload.userId === userId) {
          return payload.bookingStatusChanged;
        }
        return null;
      }
    },

    quotaUpdated: {
      subscribe: (_: any, { userId }: { userId: string }) => {
        return pubsub.asyncIterator(['QUOTA_UPDATED']);
      },
      resolve: (payload: any, { userId }: { userId: string }) => {
        if (payload.userId === userId) {
          return payload.quotaUpdated;
        }
        return null;
      }
    }
  },

  // Field resolvers for relations
  User: {
    quota: async (parent: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.quotaLoader.load(parent.id);
    },
    referrals: async (parent: any) => {
      const { data, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referrer_id', parent.id);
      
      if (error) throw new GraphQLError(error.message);
      return data || [];
    },
    rewards: async (parent: any) => {
      const { data, error } = await supabaseAdmin
        .from('referral_rewards')
        .select('*')
        .eq('user_id', parent.id);
      
      if (error) throw new GraphQLError(error.message);
      return data || [];
    }
  },

  UserQuota: {
    remainingHours: (parent: any) => {
      return parent.totalHours - parent.usedHours;
    },
    user: async (parent: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.userLoader.load(parent.userId);
    }
  },

  Referral: {
    referrer: async (parent: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.userLoader.load(parent.referrerId);
    },
    referred: async (parent: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.userLoader.load(parent.referredId);
    }
  },

  QuotaTransaction: {
    user: async (parent: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.userLoader.load(parent.userId);
    },
    package: async (parent: any, _: any, context: GraphQLContext) => {
      return parent.packageId ? context.dataloaders.packageLoader.load(parent.packageId) : null;
    }
  }
};