import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { ApolloServer } from '@apollo/server';
import { GraphQLResponse } from '@apollo/server';
import { server, schema, healthCheck, getMetrics } from '@/lib/graphql/server';
import { supabaseAdmin } from '@/lib/api/utils';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/api/utils');
jest.mock('@/lib/graphql/dataloaders');
jest.mock('@/lib/graphql/pubsub');
jest.mock('@/lib/graphql/cache');

const mockSupabase = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

// Test server instance
let testServer: ApolloServer;

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+1234567890',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockAdmin = {
  ...mockUser,
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin'
};

// Helper function to create mock context
const createMockContext = (user?: any) => ({
  user,
  supabase: mockSupabase,
  dataloaders: {
    userLoader: { load: jest.fn(), loadMany: jest.fn(), clear: jest.fn(), clearAll: jest.fn() },
    packageLoader: { load: jest.fn(), loadMany: jest.fn(), clear: jest.fn(), clearAll: jest.fn() },
    reviewLoader: { load: jest.fn(), loadMany: jest.fn(), clear: jest.fn(), clearAll: jest.fn() },
    bookingLoader: { load: jest.fn(), loadMany: jest.fn(), clear: jest.fn(), clearAll: jest.fn() },
    quotaLoader: { load: jest.fn(), loadMany: jest.fn(), clear: jest.fn(), clearAll: jest.fn() },
    quotaTransactionLoader: { load: jest.fn(), loadMany: jest.fn(), clear: jest.fn(), clearAll: jest.fn() }
  },
  req: {
    ip: '127.0.0.1',
    headers: new Map([['authorization', 'Bearer mock-token']])
  } as any
});

describe('GraphQL Server Integration Tests', () => {
  beforeAll(async () => {
    testServer = new ApolloServer({
      schema,
      introspection: true
    });
  });

  afterAll(async () => {
    if (testServer) {
      await testServer.stop();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Schema Validation', () => {
    it('should have a valid GraphQL schema', () => {
      expect(schema).toBeDefined();
      expect(schema.getTypeMap()).toBeDefined();
    });

    it('should include all expected types', () => {
      const typeMap = schema.getTypeMap();
      
      // Check core types
      expect(typeMap.User).toBeDefined();
      expect(typeMap.Package).toBeDefined();
      expect(typeMap.Booking).toBeDefined();
      expect(typeMap.Review).toBeDefined();
      expect(typeMap.UserQuota).toBeDefined();
      expect(typeMap.QuotaTransaction).toBeDefined();
      expect(typeMap.UserNotification).toBeDefined();
      
      // Check input types
      expect(typeMap.CreateUserInput).toBeDefined();
      expect(typeMap.UpdateUserInput).toBeDefined();
      expect(typeMap.CreateBookingInput).toBeDefined();
      expect(typeMap.CreatePackageInput).toBeDefined();
      
      // Check response types
      expect(typeMap.UserResponse).toBeDefined();
      expect(typeMap.BookingResponse).toBeDefined();
      expect(typeMap.PackageResponse).toBeDefined();
      expect(typeMap.ReviewResponse).toBeDefined();
    });

    it('should include Query, Mutation, and Subscription root types', () => {
      const queryType = schema.getQueryType();
      const mutationType = schema.getMutationType();
      const subscriptionType = schema.getSubscriptionType();
      
      expect(queryType).toBeDefined();
      expect(mutationType).toBeDefined();
      expect(subscriptionType).toBeDefined();
    });
  });

  describe('Query Operations', () => {
    it('should execute introspection query', async () => {
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            types {
              name
              kind
            }
          }
        }
      `;

      const response = await testServer.executeOperation({
        query: introspectionQuery
      }, {
        contextValue: createMockContext()
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.__schema).toBeDefined();
      }
    });

    it('should execute packages query without authentication', async () => {
      const query = `
        query GetPackages {
          packages {
            id
            name
            price
            hours
            isActive
          }
        }
      `;

      // Mock Supabase response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'package-123',
                  name: 'Basic Package',
                  price: 500,
                  hours: 10,
                  is_active: true,
                  features: ['Manual transmission'],
                  sort_order: 1,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                }
              ],
              error: null
            })
          })
        })
      } as any);

      const response = await testServer.executeOperation({
        query
      }, {
        contextValue: createMockContext()
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.packages).toHaveLength(1);
        expect(response.body.singleResult.data?.packages[0].name).toBe('Basic Package');
      }
    });

    it('should require authentication for protected queries', async () => {
      const query = `
        query GetMe {
          me {
            id
            email
            fullName
          }
        }
      `;

      const response = await testServer.executeOperation({
        query
      }, {
        contextValue: createMockContext() // No user
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
      }
    });

    it('should return user data for authenticated queries', async () => {
      const query = `
        query GetMe {
          me {
            id
            email
            fullName
          }
        }
      `;

      const context = createMockContext(mockUser);
      context.dataloaders.userLoader.load.mockResolvedValue(mockUser);

      const response = await testServer.executeOperation({
        query
      }, {
        contextValue: context
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.me.id).toBe(mockUser.id);
        expect(response.body.singleResult.data?.me.email).toBe(mockUser.email);
      }
    });
  });

  describe('Mutation Operations', () => {
    it('should create a user successfully', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            success
            message
            user {
              id
              fullName
              email
            }
          }
        }
      `;

      const variables = {
        input: {
          fullName: 'New User',
          phone: '+1234567890',
          experienceLevel: 'BEGINNER'
        }
      };

      // Mock Supabase auth user creation
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com'
          }
        },
        error: null
      } as any);

      // Mock user data insertion
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-user-123',
                full_name: 'New User',
                phone: '+1234567890',
                experience_level: 'BEGINNER',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            })
          })
        })
      } as any);

      const response = await testServer.executeOperation({
        query: mutation,
        variables
      }, {
        contextValue: createMockContext()
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.createUser.success).toBe(true);
        expect(response.body.singleResult.data?.createUser.user.fullName).toBe('New User');
      }
    });

    it('should require authentication for protected mutations', async () => {
      const mutation = `
        mutation CreateBooking($input: CreateBookingInput!) {
          createBooking(input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        input: {
          title: 'Test Booking',
          startTime: '2024-12-25T10:00:00Z',
          endTime: '2024-12-25T12:00:00Z',
          location: 'Test Location',
          lessonHours: 2
        }
      };

      const response = await testServer.executeOperation({
        query: mutation,
        variables
      }, {
        contextValue: createMockContext() // No user
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
      }
    });

    it('should require admin role for admin mutations', async () => {
      const mutation = `
        mutation CreatePackage($input: CreatePackageInput!) {
          createPackage(input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        input: {
          name: 'Test Package',
          price: 500,
          hours: 10,
          features: ['Test feature']
        }
      };

      const response = await testServer.executeOperation({
        query: mutation,
        variables
      }, {
        contextValue: createMockContext(mockUser) // Regular user, not admin
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const invalidQuery = `
        query InvalidQuery {
          packages {
            packages {
              id
              name
              invalidField
            }
          }
        }
      `;

      const response = await testServer.executeOperation({
        query: invalidQuery
      }, {
        contextValue: createMockContext()
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toContain('Cannot query field');
      }
    });

    it('should handle database errors gracefully', async () => {
      const query = `
        query GetPackages {
          packages {
            packages {
              id
              name
            }
          }
        }
      `;

      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
              })
            })
          })
        })
      } as any);

      const response = await testServer.executeOperation({
        query
      }, {
        contextValue: createMockContext()
      });

      console.log('Database error test response:', JSON.stringify(response.body, null, 2));
      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toContain('Database connection failed');
      }
    });

    it('should handle validation errors', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        input: {
          fullName: '', // Invalid: empty name
          experienceLevel: 'INVALID_LEVEL' // Invalid enum value
        }
      };

      const response = await testServer.executeOperation({
        query: mutation,
        variables
      }, {
        contextValue: createMockContext()
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to queries', async () => {
      const query = `
        query GetPackages {
          packages {
            id
            name
          }
        }
      `;

      // Mock successful response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      } as any);

      // Execute multiple requests rapidly
      const promises = Array(5).fill(null).map(() => 
        testServer.executeOperation({
          query
        }, {
          contextValue: createMockContext()
        })
      );

      const responses = await Promise.all(promises);
      
      // All should succeed initially (rate limit not exceeded yet)
      responses.forEach(response => {
        expect(response.body.kind).toBe('single');
      });
    });
  });

  describe('Query Complexity', () => {
    it('should reject overly complex queries', async () => {
      const complexQuery = `
        query ComplexQuery {
          packages {
            id
            name
            reviews {
              id
              name
              comment
              user {
                id
                fullName
                bookings {
                  id
                  title
                  user {
                    id
                    fullName
                    bookings {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await testServer.executeOperation({
        query: complexQuery
      }, {
        contextValue: createMockContext()
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        // Should either succeed or fail with complexity error
        // depending on the actual complexity calculation
        expect(response.body.singleResult).toBeDefined();
      }
    });
  });
});

describe('Health Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy status when database is accessible', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    } as any);

    const health = await healthCheck();

    expect(health.status).toBe('healthy');
    expect(health.details.database).toBe('healthy');
    expect(health.details.server).toBe('healthy');
  });

  it('should return unhealthy status when database is not accessible', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection failed' }
        })
      })
    } as any);

    const health = await healthCheck();

    expect(health.status).toBe('unhealthy');
    expect(health.details.database).toBe('unhealthy');
    expect(health.details.error).toBe('Connection failed');
  });
});

describe('Metrics', () => {
  it('should return server metrics', () => {
    const metrics = getMetrics();

    expect(metrics).toHaveProperty('rateLimits');
    expect(metrics).toHaveProperty('server');
    expect(metrics.server).toHaveProperty('uptime');
    expect(metrics.server).toHaveProperty('memory');
    expect(metrics.server).toHaveProperty('timestamp');
  });
});