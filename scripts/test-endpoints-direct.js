// Direct endpoint testing without authentication
const fetch = require('node-fetch');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:3001';

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {},
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  
  try {
    console.log(`Testing ${method} ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    console.log('---');
    
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      ok: response.ok,
    };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    return {
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message },
      ok: false,
    };
  }
}

async function testEndpoints() {
  console.log('Testing API endpoints directly...');
  console.log('='.repeat(50));
  
  // Test packages GET (should work or show table missing)
  console.log('\n=== Testing GET /api/packages ===');
  await makeRequest('/api/packages', 'GET');
  
  // Test packages POST with valid data
  console.log('\n=== Testing POST /api/packages with valid data ===');
  await makeRequest('/api/packages', 'POST', {
    name: 'Test Package',
    description: 'Test Description',
    price: 100,
    hours: 10,
    features: ['feature1', 'feature2']
  });
  
  // Test quota GET
  console.log('\n=== Testing GET /api/quota ===');
  await makeRequest('/api/quota', 'GET');
  
  // Test quota POST with valid data
  console.log('\n=== Testing POST /api/quota with valid data ===');
  await makeRequest('/api/quota', 'POST', { hours: 10 });
  
  console.log('\n=== Tests completed ===');
}

testEndpoints().catch(console.error);