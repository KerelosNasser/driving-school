// Global teardown for Jest tests
const { shutdownPubSub } = require('../../lib/graphql/pubsub');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Shutdown PubSub connections
    await shutdownPubSub();
    console.log('✅ PubSub connections closed');
  } catch (error) {
    console.warn('⚠️  Error shutting down PubSub:', error.message);
  }
  
  // Clean up global test data
  if (global.__TEST_DATA__) {
    delete global.__TEST_DATA__;
  }
  
  if (global.__TEST_TOKENS__) {
    delete global.__TEST_TOKENS__;
  }
  
  // Clean up any remaining timers
  if (global.setTimeout && global.setTimeout.mockRestore) {
    global.setTimeout.mockRestore();
  }
  
  if (global.setInterval && global.setInterval.mockRestore) {
    global.setInterval.mockRestore();
  }
  
  console.log('✅ Test environment cleanup complete!');
};