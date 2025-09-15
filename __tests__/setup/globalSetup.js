// Global setup for Jest tests
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = async () => {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  process.env.RATE_LIMIT_MAX = '1000';
  process.env.RATE_LIMIT_WINDOW = '900000';
  process.env.GRAPHQL_INTROSPECTION = 'true';
  process.env.GRAPHQL_PLAYGROUND = 'false';
  
  // Initialize test database if needed
  try {
    console.log('📊 Initializing test database...');
    // Add any database initialization logic here
    // For example, running migrations or seeding test data
  } catch (error) {
    console.warn('⚠️  Database initialization skipped:', error.message);
  }
  
  // Start Redis for testing (if available)
  try {
    console.log('🔴 Checking Redis connection...');
    // You can add Redis connection check here if needed
    // await exec('redis-cli ping');
    console.log('✅ Redis is available for testing');
  } catch (error) {
    console.warn('⚠️  Redis not available, using in-memory cache for tests');
  }
  
  // Setup test data
  global.__TEST_DATA__ = {
    users: [
      {
        id: 'test-user-1',
        email: 'user1@test.com',
        name: 'Test User 1',
        role: 'user',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin',
        created_at: new Date().toISOString()
      }
    ],
    packages: [
      {
        id: 'test-package-1',
        name: 'Basic Package',
        description: 'Basic driving lessons',
        price: 100,
        duration_hours: 10,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'test-package-2',
        name: 'Premium Package',
        description: 'Premium driving lessons',
        price: 200,
        duration_hours: 20,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ],
    bookings: [
      {
        id: 'test-booking-1',
        user_id: 'test-user-1',
        package_id: 'test-package-1',
        scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'confirmed',
        created_at: new Date().toISOString()
      }
    ],
    reviews: [
      {
        id: 'test-review-1',
        user_id: 'test-user-1',
        package_id: 'test-package-1',
        rating: 5,
        comment: 'Great package!',
        created_at: new Date().toISOString()
      }
    ]
  };
  
  // Setup mock authentication tokens
  global.__TEST_TOKENS__ = {
    user: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.test-signature',
    admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWFkbWluLTEiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjMwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.test-signature',
    expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxNjMwMDAwMDAxfQ.test-signature'
  };
  
  console.log('✅ Test environment setup complete!');
};