const { generateEncryptedInvitationCode, decryptInvitationCode, generateSimpleInvitationCode, isValidInvitationCodeFormat } = require('../lib/invitation-crypto');

/**
 * Test the invitation code encryption system
 */
function testInvitationCodes() {
  console.log('Testing Invitation Code Encryption System\n');
  
  // Test user ID
  const testUserId = 'test-user-123';
  
  try {
    // Test encrypted code generation
    console.log('1. Testing Encrypted Code Generation:');
    const encryptedCode = generateEncryptedInvitationCode(testUserId);
    console.log(`   Generated: ${encryptedCode}`);
    console.log(`   Length: ${encryptedCode.length}`);
    console.log(`   Starts with DRV: ${encryptedCode.startsWith('DRV')}`);
    
    // Test code validation
    console.log('\n2. Testing Code Format Validation:');
    const isValid = isValidInvitationCodeFormat(encryptedCode);
    console.log(`   Format valid: ${isValid}`);
    
    // Test decryption
    console.log('\n3. Testing Code Decryption:');
    const decrypted = decryptInvitationCode(encryptedCode);
    console.log(`   Decryption result:`, decrypted);
    console.log(`   User ID matches: ${decrypted.userId === testUserId}`);
    
    // Test simple code fallback
    console.log('\n4. Testing Simple Code Fallback:');
    const simpleCode = generateSimpleInvitationCode();
    console.log(`   Simple code: ${simpleCode}`);
    console.log(`   Format valid: ${isValidInvitationCodeFormat(simpleCode)}`);
    
    // Test invalid codes
    console.log('\n5. Testing Invalid Codes:');
    const invalidCodes = ['ABC123', 'DRV', '', 'INVALID', '123456'];
    invalidCodes.forEach(code => {
      const valid = isValidInvitationCodeFormat(code);
      console.log(`   "${code}" - Valid: ${valid}`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n⚠️  Make sure you have set INVITATION_SECRET_KEY in your environment');
    console.log('   Run: node scripts/generate-invitation-key.js');
  }
}

// Run tests if called directly
if (require.main === module) {
  testInvitationCodes();
}

module.exports = { testInvitationCodes };
