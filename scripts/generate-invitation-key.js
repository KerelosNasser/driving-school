const crypto = require('crypto');

/**
 * Generate a secure 32-byte key for invitation code encryption
 */
function generateInvitationKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log('Generated secure invitation key:');
  console.log(`INVITATION_SECRET_KEY=${key}`);
  console.log('');
  console.log('Add this to your .env.local file');
  console.log('Keep this key secret and secure!');
  return key;
}

// Run the generator
if (require.main === module) {
  generateInvitationKey();
}

module.exports = { generateInvitationKey };
