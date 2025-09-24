// Payment Service Worker for handling multiple payment gateways
// This worker will handle payment processing and error handling for better reliability

self.addEventListener('install', (event) => {
  console.log('Payment Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Payment Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle payment processing messages
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PROCESS_PAYMENT':
      try {
        const result = await processPayment(data);
        event.ports[0].postMessage({ success: true, result });
      } catch (error) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
      break;
      
    default:
      if (event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: 'Unknown message type' });
      }
  }
});

// Process payment with selected gateway
async function processPayment(paymentData) {
  const { packageId, paymentGateway, acceptedTerms } = paymentData;
  
  if (!acceptedTerms) {
    throw new Error('Terms and conditions must be accepted');
  }
  
  // In a real implementation, this would handle different payment gateways
  // For now, we'll just call the existing API
  const response = await fetch('/api/create-quota-checkout-enhanced', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      packageId,
      paymentGateway,
      acceptedTerms
    }),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Payment processing failed');
  }
  
  return result;
}

// Handle fetch events for offline support
self.addEventListener('fetch', (event) => {
  // Implement caching strategies for payment-related resources
  if (event.request.url.includes('/api/create-quota-checkout')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ 
              error: 'Network error. Please check your connection and try again.',
              offline: true
            }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
  }
});