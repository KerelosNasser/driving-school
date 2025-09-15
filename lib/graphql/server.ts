import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { shield, rule, and, or } from 'graphql-shield';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import depthLimit from 'graphql-depth-limit';
import { GraphQLError } from 'graphql';
import { NextRequest } from 'next/server';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createDataLoaders } from './dataloaders';
import { supabaseAdmin } from '@/lib/api/utils';

// Modern PubSub instance for subscriptions
const pubsub = new PubSub();

// Rate limiters configuration
const rateLimiters = {
  general: new RateLimiterMemory({
    keyGenerator: (root, args, context) => context.req.ip || 'anonymous',
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
  }),
  mutation: new RateLimiterMemory({
    keyGenerator: (root, args, context) => context.req.ip || 'anonymous',
    points: 20, // Number of mutations
    duration: 60, // Per 60 seconds
  }),
  subscription: new RateLimiterMemory({
    keyGenerator: (root, args, context) => context.req.ip || 'anonymous',
    points: 10, // Number of subscriptions
    duration: 60, // Per 60 seconds
  }),
};

// Authentication rules
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, context) => {
    return context.user !== null;
  }
);

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, context) => {
    return context.user && context.user.role === 'admin';
  }
);

const isOwner = rule({ cache: 'contextual' })(
  async (parent, args, context) => {
    if (!context.user) return false;
    
    // For user-specific operations, check if the user is accessing their own data
    if (args.userId) {
      return context.user.id === args.userId;
    }
    
    return true;
  }
);

// Rate limiting rules
const rateLimit = (limiter: RateLimiterMemory) => rule({ cache: 'no_cache' })(
  async (parent, args, context) => {
    try {
      await limiter.consume(context.req.ip || 'anonymous');
      return true;
    } catch (rejRes) {
      throw new GraphQLError(
        `Rate limit exceeded. Try again in ${Math.round((rejRes as { msBeforeNext: number }).msBeforeNext / 1000)} seconds.`,
        {
          extensions: {
            code: 'RATE_LIMITED',
            retryAfter: (rejRes as { msBeforeNext: number }).msBeforeNext
          }
        }
      );
    }
  }
);

// Security shield
const permissions = shield({
  Query: {
    '*': rateLimit(rateLimiters.general),
    me: isAuthenticated,
    myBookings: isAuthenticated,
    myQuota: isAuthenticated,
    myNotifications: isAuthenticated,
    users: isAdmin,
    bookings: isAdmin,
    quotaTransactions: and(isAuthenticated, or(isAdmin, isOwner)),
  },
  Mutation: {
    '*': and(rateLimit(rateLimiters.mutation), isAuthenticated),
    createUser: rateLimit(rateLimiters.general), // Allow unauthenticated user creation
    createReview: rateLimit(rateLimiters.general), // Allow unauthenticated reviews
    createPackage: isAdmin,
    updatePackage: isAdmin,
    deletePackage: isAdmin,
    updateBookingStatus: isAdmin,
    createQuotaTransaction: isAdmin,
  },
  Subscription: {
    '*': and(rateLimit(rateLimiters.subscription), isAuthenticated),
  },
}, {
  allowExternalErrors: true,
  fallbackError: new GraphQLError('Access denied', {
    extensions: { code: 'FORBIDDEN' }
  })
});

// Modern Query Complexity Plugin Configuration
const createQueryComplexityPlugin = () => {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation(requestContext: any) {
          const { schema, document, operationName, request } = requestContext;
          
          // Import query complexity analyzer dynamically to avoid TypeScript issues
          try {
            const { getComplexity, fieldExtensionsEstimator, directiveEstimator, simpleEstimator } = await import('graphql-query-complexity');
            
            const complexity = getComplexity({
              schema,
              query: document,
              variables: request.variables || {},
              estimators: [
                // Field extensions estimator (highest priority)
                fieldExtensionsEstimator(),
                // Directive estimator for @cost directives
                directiveEstimator({
                  name: 'cost',
                  arguments: { complexity: 'complexity', multipliers: 'multipliers' },
                }),
                // Simple estimator as fallback
                simpleEstimator({
                  defaultComplexity: 1,
                  scalarCost: 1,
                  objectCost: 2,
                  listFactor: 10,
                })
              ],
              createError: (max: number, actual: number) => {
                return new GraphQLError(
                  `Query complexity exceeded limit. Reduce query depth or field selection.`,
                  {
                    extensions: {
                      code: 'QUERY_TOO_COMPLEX',
                      maxCost: max,
                      actualCost: actual,
                      hint: 'Consider using pagination or reducing nested field selections'
                    }
                  }
                );
              }
            });

            const maxComplexity = process.env.NODE_ENV === 'production' ? 500 : 1000;
            
            if (complexity > maxComplexity) {
              throw new GraphQLError(
                `Query complexity ${complexity} exceeds maximum complexity ${maxComplexity}`,
                {
                  extensions: {
                    code: 'QUERY_TOO_COMPLEX',
                    maxCost: maxComplexity,
                    actualCost: complexity,
                    operationName,
                    hint: 'Consider using pagination, reducing nested field selections, or breaking up the query'
                  }
                }
              );
            }

            // Log complexity for monitoring
            console.log(`Query complexity for ${operationName || 'Anonymous'}: ${complexity}/${maxComplexity}`);
            
            // Track complexity metrics
            updateComplexityMetrics(operationName || 'Anonymous', complexity, maxComplexity);
            
          } catch (error) {
            console.error('Query complexity analysis failed:', error);
            // Continue with request if complexity analysis fails
          }
        }
      };
    }
  };
};

// Enhanced security and performance configuration
const securityConfig = {
  maxDepth: process.env.NODE_ENV === 'production' ? 10 : 15,
  maxComplexity: process.env.NODE_ENV === 'production' ? 500 : 1000,
  maxAliases: 15,
  maxDirectives: 50,
  maxTokens: 1000,
  queryTimeout: 30000, // 30 seconds
  introspectionEnabled: process.env.NODE_ENV !== 'production',
};

interface GraphQLContext {
  req: NextRequest;
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
    permissions: string[];
    sessionId: string;
  } | null;
  dataloaders: ReturnType<typeof createDataLoaders>;
  supabase: typeof supabaseAdmin;
  pubsub: PubSub;
  ip: string;
  userAgent: string;
  requestId: string;
  startTime: number;
}

const createContext = async ({ req }: { req: NextRequest }): Promise<GraphQLContext> => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  let user: GraphQLContext['user'] = null;
  
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify JWT token with Supabase
      const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && authUser) {
        // Get additional user data from database
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, email, role, permissions')
          .eq('id', authUser.id)
          .single();
        
        if (userData) {
          user = {
            id: authUser.id,
            email: authUser.email || '',
            role: userData.role || 'STUDENT',
            permissions: userData.permissions || [],
            sessionId: authUser.session?.access_token?.substring(0, 8) || requestId.substring(0, 8),
          };
        }
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    // Continue with null user for public queries
  }
  
  return {
    req,
    user,
    dataloaders: createDataLoaders(),
    supabase: supabaseAdmin,
    pubsub,
    ip,
    userAgent,
    requestId,
    startTime,
  };
};

// Create executable schema
const baseSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Apply middleware to schema
const schema = applyMiddleware(baseSchema, permissions);

// WebSocket server setup for subscriptions
const httpServer = createServer();
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql/subscriptions',
});

// Modern Apollo Server 4 configuration with 2025 best practices
const server = new ApolloServer<GraphQLContext>({
  schema,
  introspection: securityConfig.introspectionEnabled,
  includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
  csrfPrevention: true,
  cache: 'bounded',
  validationRules: [
    depthLimit(securityConfig.maxDepth), // Prevent deeply nested queries
  ],
  formatError: (formattedError, error) => {
    // Structured error logging with context
    const errorContext = {
      message: formattedError.message,
      code: formattedError.extensions?.code,
      locations: formattedError.locations,
      path: formattedError.path,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // Log different error types appropriately
    if (formattedError.extensions?.code === 'INTERNAL_ERROR') {
      console.error('GraphQL Internal Error:', errorContext, error);
    } else if (formattedError.extensions?.code === 'VALIDATION_ERROR') {
      console.warn('GraphQL Validation Error:', errorContext);
    } else if (formattedError.extensions?.code === 'QUERY_TOO_COMPLEX') {
      console.warn('GraphQL Complexity Error:', errorContext);
    } else {
      console.error('GraphQL Error:', errorContext);
    }

    // Enhanced production error handling
    if (process.env.NODE_ENV === 'production') {
      const safeErrorCodes = [
        'VALIDATION_ERROR', 
        'FORBIDDEN', 
        'UNAUTHENTICATED', 
        'RATE_LIMITED', 
        'BAD_USER_INPUT',
        'QUERY_TOO_COMPLEX'
      ];
      
      if (!safeErrorCodes.includes(formattedError.extensions?.code as string)) {
        return new GraphQLError('An unexpected error occurred', {
          extensions: { 
            code: 'INTERNAL_ERROR',
            timestamp: errorContext.timestamp
          }
        });
      }
    }

    return formattedError;
  },
  plugins: [
    // Modern Query Complexity Plugin
    createQueryComplexityPlugin(),
    
    // WebSocket server drain plugin for subscriptions
    ApolloServerPluginDrainHttpServer({ httpServer }),
    
    // Request timeout plugin
    {
      async requestDidStart() {
        return {
          async willSendResponse(requestContext) {
            const { response } = requestContext;
            
            // Add security headers
            response.http.headers.set('X-Content-Type-Options', 'nosniff');
            response.http.headers.set('X-Frame-Options', 'DENY');
            response.http.headers.set('X-XSS-Protection', '1; mode=block');
            response.http.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          }
        };
      }
    },
    
    // Custom plugin for logging and monitoring
    {
      async requestDidStart() {
        const startTime = Date.now();
        return {
          async didResolveOperation(requestContext) {
            const { request, operationName } = requestContext;
            console.log(`GraphQL Operation: ${operationName || 'Anonymous'} - ${request.query?.substring(0, 100)}...`);
          },
          async didEncounterErrors(requestContext) {
            const { errors, operationName } = requestContext;
            const duration = Date.now() - startTime;
            const errorType = errors?.[0]?.extensions?.code || 'UNKNOWN_ERROR';
            
            console.error(`GraphQL Errors in ${operationName || 'Anonymous'}:`, errors);
            updateOperationMetrics(operationName || 'Anonymous', duration, true, errorType as string);
          },
          async willSendResponse(requestContext) {
            const { response, operationName } = requestContext;
            const duration = Date.now() - startTime;
            const hasErrors = response.body.kind === 'single' && 
                             response.body.singleResult.errors && 
                             response.body.singleResult.errors.length > 0;
            
            // Track successful operations
            if (!hasErrors) {
              updateOperationMetrics(operationName || 'Anonymous', duration, false);
            }
            
            // Add performance headers
            response.http.headers.set('X-Response-Time', `${duration}ms`);
            response.http.headers.set('X-Operation-Name', operationName || 'Anonymous');
          }
        };
      }
    },
    
    // Performance monitoring plugin
    {
      async requestDidStart() {
        const startTime = Date.now();
        return {
          async willSendResponse(requestContext) {
            const duration = Date.now() - startTime;
            const { operationName, request } = requestContext;
            
            // Log slow queries
            if (duration > 1000) {
              console.warn(`Slow GraphQL Query (${duration}ms): ${operationName || 'Anonymous'}`, {
                query: request.query?.substring(0, 200),
                variables: request.variables
              });
            }
            
            // Monitor query patterns
            if (process.env.NODE_ENV === 'production' && duration > 5000) {
              console.error(`Critical Performance Warning: Query took ${duration}ms`, {
                operationName,
                query: request.query?.substring(0, 100)
              });
            }
          }
        };
      }
    }
  ],
});

// Create Next.js handler
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: createContext,
});

// Health check endpoint
export const healthCheck = async (): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> => {
  try {
    // Check database connection
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (dbError) {
      return {
        status: 'unhealthy',
        details: {
          database: 'unhealthy',
          error: dbError.message
        }
      };
    }
    
    return {
      status: 'healthy',
      details: {
        database: 'healthy',
        server: 'healthy',
        timestamp: new Date().toISOString(),
        config: {
          maxDepth: securityConfig.maxDepth,
          maxComplexity: securityConfig.maxComplexity,
          introspectionEnabled: securityConfig.introspectionEnabled,
          environment: process.env.NODE_ENV
        }
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

// Enhanced metrics collection with comprehensive GraphQL monitoring
const operationMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  operationCounts: new Map<string, number>(),
  averageResponseTime: 0,
  slowQueries: [] as Array<{ query: string; duration: number; timestamp: string }>,
  errorsByType: new Map<string, number>(),
  complexityMetrics: {
    totalQueries: 0,
    averageComplexity: 0,
    maxComplexity: 0,
    complexityOverTime: [] as Array<{ timestamp: string; complexity: number; operationName: string }>,
  },
};

// Helper function to update complexity metrics
export const updateComplexityMetrics = (operationName: string, complexity: number, maxAllowed: number) => {
  const metrics = operationMetrics.complexityMetrics;
  
  metrics.totalQueries++;
  metrics.averageComplexity = (metrics.averageComplexity * (metrics.totalQueries - 1) + complexity) / metrics.totalQueries;
  metrics.maxComplexity = Math.max(metrics.maxComplexity, complexity);
  
  metrics.complexityOverTime.push({
    timestamp: new Date().toISOString(),
    complexity,
    operationName
  });
  
  // Keep only last 100 complexity measurements
  if (metrics.complexityOverTime.length > 100) {
    metrics.complexityOverTime = metrics.complexityOverTime.slice(-100);
  }
  
  // Log high complexity queries
  if (complexity > maxAllowed * 0.8) {
    console.warn(`High complexity query detected: ${operationName} (${complexity}/${maxAllowed})`);
  }
};

export const getMetrics = () => {
  const memUsage = process.memoryUsage();
  
  return {
    server: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
    },
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    security: {
      maxDepth: securityConfig.maxDepth,
      maxComplexity: securityConfig.maxComplexity,
      introspectionEnabled: securityConfig.introspectionEnabled,
    },
    graphql: {
      totalRequests: operationMetrics.totalRequests,
      totalErrors: operationMetrics.totalErrors,
      errorRate: operationMetrics.totalRequests > 0 
        ? ((operationMetrics.totalErrors / operationMetrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      averageResponseTime: `${operationMetrics.averageResponseTime.toFixed(2)}ms`,
      operationCounts: Object.fromEntries(operationMetrics.operationCounts),
      slowQueries: operationMetrics.slowQueries.slice(-10),
      errorsByType: Object.fromEntries(operationMetrics.errorsByType),
      complexity: {
        totalQueries: operationMetrics.complexityMetrics.totalQueries,
        averageComplexity: operationMetrics.complexityMetrics.averageComplexity.toFixed(2),
        maxComplexity: operationMetrics.complexityMetrics.maxComplexity,
        recentComplexities: operationMetrics.complexityMetrics.complexityOverTime.slice(-10),
      },
    },
    rateLimiters: {
      general: {
        totalHits: rateLimiters.general.totalHits,
        remainingPoints: rateLimiters.general.remainingPoints || 0,
      },
      mutation: {
        totalHits: rateLimiters.mutation.totalHits,
        remainingPoints: rateLimiters.mutation.remainingPoints || 0,
      },
      subscription: {
        totalHits: rateLimiters.subscription.totalHits,
        remainingPoints: rateLimiters.subscription.remainingPoints || 0,
      },
    },
    websocket: {
      connections: wsServer?.clients?.size || 0,
      status: wsServer ? 'active' : 'inactive',
    },
  };
};

// Helper function to update operation metrics
export const updateOperationMetrics = (operationName: string, duration: number, hasErrors: boolean, errorType?: string) => {
  operationMetrics.totalRequests++;
  
  if (hasErrors) {
    operationMetrics.totalErrors++;
    if (errorType) {
      operationMetrics.errorsByType.set(errorType, (operationMetrics.errorsByType.get(errorType) || 0) + 1);
    }
  }
  
  operationMetrics.operationCounts.set(operationName, (operationMetrics.operationCounts.get(operationName) || 0) + 1);
  
  operationMetrics.averageResponseTime = 
    (operationMetrics.averageResponseTime * (operationMetrics.totalRequests - 1) + duration) / operationMetrics.totalRequests;
  
  if (duration > 1000) {
    operationMetrics.slowQueries.push({
      query: operationName,
      duration,
      timestamp: new Date().toISOString(),
    });
    
    if (operationMetrics.slowQueries.length > 50) {
      operationMetrics.slowQueries = operationMetrics.slowQueries.slice(-50);
    }
  }
};

// Export the handler and server
export { handler, server, schema };
export type { GraphQLContext };