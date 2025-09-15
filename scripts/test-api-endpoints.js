// Script to test API endpoints and verify fixes

const fetch = require('node-fetch');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN; // Set this in your .env file

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (TEST_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${TEST_AUTH_TOKEN}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    console.log(`Testing ${method} ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      ok: response.ok,
    };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    return {
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message },
      ok: false,
    };
  }
}

// Test functions
async function testQuotaEndpoint() {
  console.log('\n=== Testing /api/quota endpoint ===');
  
  // Test with valid data
  const validResponse = await makeRequest('/api/quota', 'POST', {
    hours: 10,
    transaction_type: 'purchase',
    description: 'Test purchase',
  });
  
  console.log('Valid request response:', {
    status: validResponse.status,
    ok: validResponse.ok,
    data: validResponse.data,
  });
  
  // Test with empty body (should return 400)
  const emptyResponse = await makeRequest('/api/quota', 'POST');
  
  console.log('Empty body response:', {
    status: emptyResponse.status,
    ok: emptyResponse.ok,
    data: emptyResponse.data,
  });
  
  // Test with invalid data
  const invalidResponse = await makeRequest('/api/quota', 'POST', {
    hours: -5,
  });
  
  console.log('Invalid data response:', {
    status: invalidResponse.status,
    ok: invalidResponse.ok,
    data: invalidResponse.data,
  });
}

async function testQuotaConsumeEndpoint() {
  console.log('\n=== Testing /api/quota/consume endpoint ===');
  
  // Test with valid data
  const validResponse = await makeRequest('/api/quota/consume', 'POST', {
    hours: 1,
    description: 'Test consumption',
  });
  
  console.log('Valid request response:', {
    status: validResponse.status,
    ok: validResponse.ok,
    data: validResponse.data,
  });
  
  // Test with empty body (should return 400)
  const emptyResponse = await makeRequest('/api/quota/consume', 'POST');
  
  console.log('Empty body response:', {
    status: emptyResponse.status,
    ok: emptyResponse.ok,
    data: emptyResponse.data,
  });
}

async function testInvitationStatsEndpoint() {
  console.log('\n=== Testing /api/invitation/stats endpoint ===');
  
  const response = await makeRequest('/api/invitation/stats');
  
  console.log('Response:', {
    status: response.status,
    ok: response.ok,
    data: response.data,
  });
  
  // Check if we got the expected fallback response when table doesn't exist
  if (response.data && response.data.message === 'Invitation system coming soon') {
    console.log('✅ Received correct fallback response for missing invitation_codes table');
  }
}

async function testDebugUserStatusEndpoint() {
  console.log('\n=== Testing /api/debug/user-status endpoint ===');
  
  const response = await makeRequest('/api/debug/user-status');
  
  console.log('Response:', {
    status: response.status,
    ok: response.ok,
    data: response.data,
  });
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting API endpoint tests...');
    
    await testQuotaEndpoint();
    await testQuotaConsumeEndpoint();
    await testInvitationStatsEndpoint();
    await testDebugUserStatusEndpoint();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();