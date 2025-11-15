// Quick script to check if rewards exist in the database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRewards() {
  console.log('Checking referral rewards in database...\n');

  try {
    // Get all rewards
    const { data: rewards, error } = await supabase
      .from('referral_rewards')
      .select(`
        *,
        users!referral_rewards_user_id_fkey (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rewards:', error);
      return;
    }

    if (!rewards || rewards.length === 0) {
      console.log('❌ No rewards found in database');
      return;
    }

    console.log(`✅ Found ${rewards.length} reward(s):\n`);

    rewards.forEach((reward, index) => {
      console.log(`Reward #${index + 1}:`);
      console.log(`  ID: ${reward.id}`);
      console.log(`  User: ${reward.users?.email || 'Unknown'} (${reward.users?.full_name || 'N/A'})`);
      console.log(`  Type: ${reward.reward_type}`);
      console.log(`  Value: ${reward.reward_value}`);
      console.log(`  Source: ${reward.source}`);
      console.log(`  Is Used: ${reward.is_used ? 'Yes' : 'No'}`);
      console.log(`  Created: ${reward.created_at}`);
      console.log(`  Expires: ${reward.expires_at || 'Never'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkRewards();
