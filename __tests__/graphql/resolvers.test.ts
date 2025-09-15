import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GraphQLError } from 'graphql';
import { resolvers } from '@/lib/graphql/resolvers';
import { createDataLoaders } from '@/lib/graphql/dataloaders';
import { supabaseAdmin } from '@/lib/api/utils';

// Mock dependencies
jest.mock('@/lib/api/utils');
jest.mock('@/lib/graphql/dataloaders');
jest.mock('@/lib/graphql/pubsub');
jest.mock('@/lib/graphql/cache');

const mockSupabase = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;
const mockCreateDataLoaders = createDataLoaders as jest.MockedFunction<typeof createDataLoaders>;

// Mock context
const createMockContext = (user?: any) => ({
  user,
  supabase: mockSupabase,
  dataloaders: {
    userLoader: {
      load: jest.fn(),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn()
    },
    packageLoader: {
      load: jest.fn(),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn()
    },
    reviewLoader: {
      load: jest.fn(),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn()
    },
    bookingLoader: {
      load: jest.fn(),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn()
    },
    quotaLoader: {
      load: jest.fn(),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn()
    },
    quotaTransactionLoader: {
      load: jest.fn(),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn()
    }
  },
  req: {
    ip: '127.0.0.1',
    headers: new Map()
  }
});

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+1234567890',
  address: '123 Test St',
  suburb: 'Test Suburb',
  experience_level: 'BEGINNER',
  goals: 'Learn to drive',
  emergency_contact: 'Emergency Contact',
  emergency_phone: '+0987654321',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockAdmin = {
  ...mockUser,
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin'
};

const mockPackage = {
  id: 'package-123',
  name: 'Basic Package',
  description: 'Basic driving lessons',
  price: 500,
  hours: 10,
  features: ['Manual transmission', 'Highway driving'],
  is_active: true,
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('GraphQL Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Query Resolvers', () => {
    describe('me', () => {
      it('should return current user data', async () => {
        const context = createMockContext(mockUser);
        context.dataloaders.userLoader.load.mockResolvedValue(mockUser);

        const result = await resolvers.Query.me(null, {}, context);

        expect(result).toEqual({
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.full_name,
          phone: mockUser.phone,
          address: mockUser.address,
          suburb: mockUser.suburb,
          experienceLevel: mockUser.experience_level,
          goals: mockUser.goals,
          emergencyContact: mockUser.emergency_contact,
          emergencyPhone: mockUser.emergency_phone,
          createdAt: mockUser.created_at,
          updatedAt: mockUser.updated_at
        });
      });

      it('should throw error when user not authenticated', async () => {
        const context = createMockContext();

        await expect(resolvers.Query.me(null, {}, context))
          .rejects
          .toThrow(GraphQLError);
      });
    });

    describe('packages', () => {
      it('should return all active packages', async () => {
        const context = createMockContext();
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockPackage],
                error: null
              })
            })
          })
        } as any);

        const result = await resolvers.Query.packages(null, {}, context);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: mockPackage.id,
          name: mockPackage.name,
          description: mockPackage.description,
          price: mockPackage.price,
          hours: mockPackage.hours,
          features: mockPackage.features,
          isActive: mockPackage.is_active,
          sortOrder: mockPackage.sort_order,
          createdAt: mockPackage.created_at,
          updatedAt: mockPackage.updated_at
        });
      });

      it('should handle database errors', async () => {
        const context = createMockContext();
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        } as any);

        await expect(resolvers.Query.packages(null, {}, context))
          .rejects
          .toThrow(GraphQLError);
      });
    });

    describe('reviews', () => {
      it('should return paginated reviews', async () => {
        const mockReview = {
          id: 'review-123',
          name: 'John Doe',
          email: 'john@example.com',
          rating: 5,
          comment: 'Great service!',
          is_approved: true,
          created_at: '2024-01-01T00:00:00Z'
        };

        const context = createMockContext();
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [mockReview],
                  error: null,
                  count: 1
                })
              })
            })
          })
        } as any);

        const result = await resolvers.Query.reviews(null, { limit: 10, offset: 0 }, context);

        expect(result.items).toHaveLength(1);
        expect(result.totalCount).toBe(1);
        expect(result.hasNextPage).toBe(false);
      });
    });
  });

  describe('Mutation Resolvers', () => {
    describe('createUser', () => {
      it('should create a new user successfully', async () => {
        const context = createMockContext();
        const input = {
          fullName: 'New User',
          phone: '+1234567890',
          address: '123 New St',
          suburb: 'New Suburb',
          experienceLevel: 'BEGINNER' as const,
          goals: 'Learn to drive'
        };

        mockSupabase.auth.admin.createUser.mockResolvedValue({
          data: {
            user: {
              id: 'new-user-123',
              email: 'newuser@example.com'
            }
          },
          error: null
        } as any);

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'new-user-123',
                  full_name: input.fullName,
                  phone: input.phone,
                  address: input.address,
                  suburb: input.suburb,
                  experience_level: input.experienceLevel,
                  goals: input.goals,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                },
                error: null
              })
            })
          })
        } as any);

        const result = await resolvers.Mutation.createUser(null, { input }, context);

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user?.fullName).toBe(input.fullName);
      });

      it('should handle validation errors', async () => {
        const context = createMockContext();
        const input = {
          fullName: '', // Invalid: empty name
          experienceLevel: 'BEGINNER' as const
        };

        await expect(resolvers.Mutation.createUser(null, { input }, context))
          .rejects
          .toThrow(GraphQLError);
      });
    });

    describe('createBooking', () => {
      it('should create a booking for authenticated user', async () => {
        const context = createMockContext(mockUser);
        const input = {
          title: 'Driving Lesson',
          description: 'Basic driving lesson',
          startTime: '2024-12-25T10:00:00Z',
          endTime: '2024-12-25T12:00:00Z',
          location: '123 Test St',
          lessonHours: 2
        };

        // Mock quota check
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { total_hours: 10, used_hours: 5 },
                error: null
              })
            })
          })
        } as any);

        // Mock conflict check
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockReturnValue({
                or: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        } as any);

        // Mock booking creation
        mockSupabase.from.mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'booking-123',
                  title: input.title,
                  description: input.description,
                  start_time: input.startTime,
                  end_time: input.endTime,
                  location: input.location,
                  lesson_hours: input.lessonHours,
                  status: 'PENDING',
                  user_id: mockUser.id,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                },
                error: null
              })
            })
          })
        } as any);

        const result = await resolvers.Mutation.createBooking(null, { input }, context);

        expect(result.success).toBe(true);
        expect(result.booking).toBeDefined();
        expect(result.booking?.title).toBe(input.title);
      });

      it('should reject booking when insufficient quota', async () => {
        const context = createMockContext(mockUser);
        const input = {
          title: 'Driving Lesson',
          startTime: '2024-12-25T10:00:00Z',
          endTime: '2024-12-25T12:00:00Z',
          location: '123 Test St',
          lessonHours: 10 // More than available quota
        };

        // Mock quota check - insufficient quota
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { total_hours: 10, used_hours: 8 }, // Only 2 hours available
                error: null
              })
            })
          })
        } as any);

        await expect(resolvers.Mutation.createBooking(null, { input }, context))
          .rejects
          .toThrow(GraphQLError);
      });
    });

    describe('createPackage', () => {
      it('should create package for admin user', async () => {
        const context = createMockContext(mockAdmin);
        const input = {
          name: 'Premium Package',
          description: 'Premium driving lessons',
          price: 1000,
          hours: 20,
          features: ['Automatic transmission', 'Highway driving', 'Parking'],
          isActive: true,
          sortOrder: 2
        };

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'package-456',
                  name: input.name,
                  description: input.description,
                  price: input.price,
                  hours: input.hours,
                  features: input.features,
                  is_active: input.isActive,
                  sort_order: input.sortOrder,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                },
                error: null
              })
            })
          })
        } as any);

        const result = await resolvers.Mutation.createPackage(null, { input }, context);

        expect(result.success).toBe(true);
        expect(result.package).toBeDefined();
        expect(result.package?.name).toBe(input.name);
      });

      it('should reject package creation for non-admin user', async () => {
        const context = createMockContext(mockUser); // Regular user, not admin
        const input = {
          name: 'Premium Package',
          price: 1000,
          hours: 20,
          features: ['Automatic transmission']
        };

        await expect(resolvers.Mutation.createPackage(null, { input }, context))
          .rejects
          .toThrow(GraphQLError);
      });
    });
  });

  describe('Field Resolvers', () => {
    describe('User', () => {
      it('should resolve user bookings', async () => {
        const context = createMockContext(mockUser);
        const mockBookings = [
          {
            id: 'booking-123',
            title: 'Driving Lesson',
            start_time: '2024-12-25T10:00:00Z',
            end_time: '2024-12-25T12:00:00Z',
            status: 'PENDING'
          }
        ];

        context.dataloaders.bookingLoader.load.mockResolvedValue(mockBookings);

        const result = await resolvers.User.bookings(mockUser, {}, context);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('booking-123');
      });

      it('should resolve user quota', async () => {
        const context = createMockContext(mockUser);
        const mockQuota = {
          total_hours: 10,
          used_hours: 5
        };

        context.dataloaders.quotaLoader.load.mockResolvedValue(mockQuota);

        const result = await resolvers.User.quota(mockUser, {}, context);

        expect(result.totalHours).toBe(10);
        expect(result.usedHours).toBe(5);
        expect(result.availableHours).toBe(5);
      });
    });

    describe('Booking', () => {
      it('should resolve booking user', async () => {
        const context = createMockContext();
        const mockBooking = {
          id: 'booking-123',
          user_id: 'user-123'
        };

        context.dataloaders.userLoader.load.mockResolvedValue(mockUser);

        const result = await resolvers.Booking.user(mockBooking, {}, context);

        expect(result.id).toBe(mockUser.id);
        expect(context.dataloaders.userLoader.load).toHaveBeenCalledWith('user-123');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const context = createMockContext();
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(resolvers.Query.packages(null, {}, context))
        .rejects
        .toThrow(GraphQLError);
    });

    it('should handle validation errors gracefully', async () => {
      const context = createMockContext();
      const invalidInput = {
        fullName: '', // Invalid empty name
        experienceLevel: 'INVALID' as any // Invalid enum value
      };

      await expect(resolvers.Mutation.createUser(null, { input: invalidInput }, context))
        .rejects
        .toThrow(GraphQLError);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for protected queries', async () => {
      const context = createMockContext(); // No user

      await expect(resolvers.Query.me(null, {}, context))
        .rejects
        .toThrow(GraphQLError);
    });

    it('should require admin role for admin operations', async () => {
      const context = createMockContext(mockUser); // Regular user, not admin
      const input = {
        name: 'Test Package',
        price: 500,
        hours: 10,
        features: ['Test feature']
      };

      await expect(resolvers.Mutation.createPackage(null, { input }, context))
        .rejects
        .toThrow(GraphQLError);
    });

    it('should allow admin operations for admin users', async () => {
      const context = createMockContext(mockAdmin);
      const input = {
        name: 'Admin Package',
        price: 500,
        hours: 10,
        features: ['Admin feature']
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'package-admin', ...input },
              error: null
            })
          })
        })
      } as any);

      const result = await resolvers.Mutation.createPackage(null, { input }, context);
      expect(result.success).toBe(true);
    });
  });
});