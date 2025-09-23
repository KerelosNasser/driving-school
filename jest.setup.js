// Jest setup file for GraphQL tests
import 'jest-extended';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RATE_LIMIT_MAX = '100';
process.env.RATE_LIMIT_WINDOW = '900000';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Redis (guarded so tests don't fail if 'redis' isn't installed)
const _redisMock = {
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
    on: jest.fn(),
    off: jest.fn(),
    isReady: true,
    isOpen: true
  }))
};

try {
  // Attempt to register the mock with Jest. In some environments the mock hoisting
  // or module resolution can throw if 'redis' is not present; guard so setup
  // doesn't crash the entire test run.
  jest.mock('redis', () => _redisMock);
} catch (e) {
  // If jest.mock isn't available or fails, expose a global fallback that tests
  // and other setup code can optionally reference.
  global.__REDIS_MOCK__ = _redisMock;
}

// Mock Supabase client (guarded)
try {
  jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn(),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChange: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn()
      })),
      rpc: jest.fn(),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(),
          download: jest.fn(),
          remove: jest.fn(),
          list: jest.fn(),
          getPublicUrl: jest.fn()
        }))
      }
    }))
  }));
} catch (e) {
  global.__SUPABASE_MOCK__ = true;
}

// Mock GraphQL Yoga (guarded)
try {
  jest.mock('graphql-yoga', () => ({
    createYoga: jest.fn(() => ({
      handle: jest.fn(),
      graphqlEndpoint: '/api/graphql'
    })),
    createSchema: jest.fn()
  }));
} catch (e) {
  global.__GRAPHQL_YOGA_MOCK__ = true;
}

// Mock DataLoader (guarded)
try {
  jest.mock('dataloader', () => {
    return jest.fn().mockImplementation((batchLoadFn) => ({
      load: jest.fn(),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn(),
      prime: jest.fn()
    }));
  });
} catch (e) {
  global.__DATALOADER_MOCK__ = true;
}

// Mock rate limiter (guarded)
try {
  jest.mock('rate-limiter-flexible', () => ({
    RateLimiterRedis: jest.fn().mockImplementation(() => ({
      consume: jest.fn(() => Promise.resolve()),
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      penalty: jest.fn(),
      reward: jest.fn(),
      block: jest.fn()
    })),
    RateLimiterMemory: jest.fn().mockImplementation(() => ({
      consume: jest.fn(() => Promise.resolve()),
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      penalty: jest.fn(),
      reward: jest.fn(),
      block: jest.fn()
    }))
  }));
} catch (e) {
  global.__RATE_LIMITER_MOCK__ = true;
}

// Mock Winston logger (guarded)
try {
  jest.mock('winston', () => ({
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    })),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
      printf: jest.fn()
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    }
  }));
} catch (e) {
  global.__WINSTON_MOCK__ = true;
}

// Mock crypto for Node.js
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  }
});

// Global test utilities
global.createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

global.createMockPackage = () => ({
  id: 'test-package-id',
  name: 'Test Package',
  description: 'Test package description',
  price: 100,
  duration_hours: 10,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

global.createMockBooking = () => ({
  id: 'test-booking-id',
  user_id: 'test-user-id',
  package_id: 'test-package-id',
  scheduled_at: new Date().toISOString(),
  status: 'confirmed',
  notes: 'Test booking notes',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(30000);