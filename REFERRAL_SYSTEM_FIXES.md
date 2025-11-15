# Referral Reward System - Complete Fix Documentation

## Overview
This document outlines all the fixes applied to the referral reward system to make it fully functional.

## Issues Fixed

### 1. Database Schema Mismatch ✅
**Problem**: The database used `reward_tiers.name` but the API expected `tier_name`
**Solution**: Updated all API endpoints to use consistent field naming

### 2. Automatic Reward Distribution ✅
**Problem**: Rewards weren't being automatically distributed when users reached milestones
**Solution**: 
- Fixed the `checkAndDistributeRewards()` function in `/api/process-referral/route.ts`
- Changed from checking composite keys to checking by `tier_id` only
- Added better logging for debugging
- Fixed the tier name field reference

### 3. Admin API Supabase Client Issues ✅
**Problem**: Admin APIs were using `createServerComponentClient` which requires cookies
**Solution**: Changed all admin API routes to use service role key directly:
- `/api/admin/referral-rewards/tiers/route.ts`
- `/api/admin/referral-rewards/rewards/route.ts`
- `/api/admin/referral-rewards/stats/route.ts`
- `/api/admin/referral-rewards/gift/route.ts`

### 4. Missing User Fetching Endpoint ✅
**Problem**: Admin panel couldn't fetch users for gifting rewards
**Solution**: Created `/api/admin/users/route.ts` endpoint

### 5. Manual Reward Distribution ✅
**Problem**: No way to retroactively distribute rewards to existing users
**Solution**: Created `/api/admin/referral-rewards/distribute/route.ts` endpoint with button in admin panel

## Database Changes Required

**IMPORTANT**: Run this prompt in Supabase AI to apply database schema fixes:

\`\`\`
I need to fix my referral reward system database schema. Please execute these changes:

1. ALTER the reward_tiers table to rename the 'name' column to 'tier_name' for consistency with the API:
   ALTER TABLE reward_tiers RENAME COLUMN name TO tier_name;

2. Ensure the referral_rewards table has all necessary columns including 'created_at' (some queries use it):
   ALTER TABLE referral_rewards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

3. Add missing columns to users table if they don't exist:
   ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

4. Create an index on referral_rewards.created_at for better performance:
   CREATE INDEX IF NOT EXISTS idx_referral_rewards_created_at ON referral_rewards(created_at);

5. Update the gift_reward_to_user function to include created_at:
   CREATE OR REPLACE FUNCTION gift_reward_to_user(
       p_user_id UUID,
       p_reward_type TEXT,
       p_reward_value DECIMAL,
       p_gifted_by UUID,
       p_reason TEXT DEFAULT NULL,
       p_metadata JSONB DEFAULT '{}'
   ) RETURNS UUID AS $$
   DECLARE
       reward_id UUID;
       v_expires_at TIMESTAMPTZ;
   BEGIN
       -- Extract expires_at from metadata if provided
       v_expires_at := (p_metadata->>'expires_at')::TIMESTAMPTZ;
       
       INSERT INTO referral_rewards (
           user_id,
           reward_type,
           reward_value,
           source,
           gifted_by,
           reason,
           metadata,
           expires_at,
           created_at,
           earned_at
       ) VALUES (
           p_user_id,
           p_reward_type,
           p_reward_value,
           'admin_gift',
           p_gifted_by,
           p_reason,
           p_metadata,
           v_expires_at,
           NOW(),
           NOW()
       ) RETURNING id INTO reward_id;

       RETURN reward_id;
   END;
   $$ LANGUAGE plpgsql;

6. Create a function to manually trigger reward distribution for all users:
   CREATE OR REPLACE FUNCTION distribute_rewards_to_all_users()
   RETURNS TABLE (
       user_id UUID,
       rewards_distributed INTEGER,
       message TEXT
   ) AS $$
   DECLARE
       user_record RECORD;
       referral_count INTEGER;
       eligible_tiers RECORD;
       rewards_count INTEGER;
   BEGIN
       -- Loop through all users with referrals
       FOR user_record IN 
           SELECT DISTINCT referrer_user_id as id
           FROM referrals
           WHERE status = 'completed'
       LOOP
           rewards_count := 0;
           
           -- Get user's referral count
           SELECT COUNT(*) INTO referral_count
           FROM referrals
           WHERE referrer_user_id = user_record.id
           AND status = 'completed';
           
           -- Find eligible tiers
           FOR eligible_tiers IN
               SELECT rt.*
               FROM reward_tiers rt
               WHERE rt.is_active = true
               AND rt.required_referrals <= referral_count
               AND NOT EXISTS (
                   SELECT 1 FROM referral_rewards rr
                   WHERE rr.user_id = user_record.id
                   AND rr.tier_id = rt.id
               )
               ORDER BY rt.required_referrals ASC
           LOOP
               -- Create reward
               INSERT INTO referral_rewards (
                   user_id,
                   reward_type,
                   reward_value,
                   package_id,
                   tier_id,
                   source,
                   reason,
                   created_at,
                   earned_at
               ) VALUES (
                   user_record.id,
                   eligible_tiers.reward_type,
                   eligible_tiers.reward_value,
                   eligible_tiers.package_id,
                   eligible_tiers.id,
                   'referral',
                   'Earned ' || eligible_tiers.tier_name || ' - ' || referral_count || ' referrals',
                   NOW(),
                   NOW()
               );
               
               rewards_count := rewards_count + 1;
           END LOOP;
           
           RETURN QUERY SELECT 
               user_record.id,
               rewards_count,
               'Distributed ' || rewards_count || ' rewards';
       END LOOP;
   END;
   $$ LANGUAGE plpgsql;

Please execute all these changes and confirm when done.
\`\`\`

## How the System Works Now

### For Users:
1. User shares their invitation code with friends
2. When a friend signs up using the code, a referral is created
3. The system automatically checks if the user qualifies for any reward tiers
4. Rewards are automatically created and visible in the service center

### For Admins:
1. **Manage Reward Tiers**: Create tiers like "Bronze (1 referral = 30% discount)", "Silver (3 referrals = 2 free hours)"
2. **View Statistics**: See total referrals, rewards distributed, and usage
3. **Gift Rewards**: Manually give rewards to specific users
4. **Distribute Rewards**: Click button to retroactively distribute rewards to all qualifying users

## Testing the System

### Step 1: Apply Database Changes
Copy the Supabase AI prompt above and run it in your Supabase dashboard

### Step 2: Create Reward Tiers
1. Go to Admin Panel → Referral Rewards → Reward Tiers
2. Click "Add Tier"
3. Create tiers like:
   - **Bronze Tier**: 1 referral, 30% discount
   - **Silver Tier**: 3 referrals, 2 free hours

### Step 3: Test Automatic Distribution
1. Have a user share their invitation code
2. Sign up a new user with that code
3. Process the referral via `/api/process-referral`
4. Check that the referrer automatically receives the Bronze tier reward

### Step 4: Test Manual Gifting
1. Go to Admin Panel → Referral Rewards → Gift Rewards
2. Select a user from the dropdown
3. Choose reward type and value
4. Click "Gift Reward"
5. Verify the user receives the reward

### Step 5: Test Retroactive Distribution
1. Click "Distribute Rewards to All Users" button in Overview tab
2. System will check all users with referrals
3. Any missing rewards will be automatically created

## API Endpoints

### User Endpoints
- `POST /api/process-referral` - Process a new referral and auto-distribute rewards
- `GET /api/rewards` - Get user's rewards
- `POST /api/rewards/apply` - Apply a reward to a booking/purchase
- `GET /api/invitation/stats` - Get invitation statistics

### Admin Endpoints
- `GET /api/admin/referral-rewards/tiers` - List all reward tiers
- `POST /api/admin/referral-rewards/tiers` - Create new tier
- `PUT /api/admin/referral-rewards/tiers` - Update tier
- `DELETE /api/admin/referral-rewards/tiers` - Delete tier
- `GET /api/admin/referral-rewards/rewards` - List all user rewards
- `GET /api/admin/referral-rewards/stats` - Get system statistics
- `POST /api/admin/referral-rewards/gift` - Gift reward to user
- `POST /api/admin/referral-rewards/distribute` - Distribute rewards to all users
- `GET /api/admin/users` - Get all users for dropdown

## Files Modified

### API Routes
- ✅ `app/api/process-referral/route.ts` - Fixed reward distribution logic
- ✅ `app/api/admin/referral-rewards/tiers/route.ts` - Fixed Supabase client and field names
- ✅ `app/api/admin/referral-rewards/rewards/route.ts` - Fixed Supabase client
- ✅ `app/api/admin/referral-rewards/stats/route.ts` - Fixed Supabase client
- ✅ `app/api/admin/referral-rewards/gift/route.ts` - Fixed Supabase client
- ✅ `app/api/admin/referral-rewards/distribute/route.ts` - NEW: Manual distribution endpoint
- ✅ `app/api/admin/users/route.ts` - NEW: User fetching endpoint

### Components
- ✅ `app/admin/components/ReferralRewardsTab.tsx` - Added distribute button

## Key Features

✅ **Automatic Reward Distribution**: Rewards are automatically given when users reach milestones
✅ **Admin Management**: Full control over reward tiers and manual gifting
✅ **Retroactive Distribution**: Can distribute rewards to existing users who already qualified
✅ **User Dropdown**: Admin can select users from a dropdown when gifting
✅ **Proper Error Handling**: Better logging and error messages
✅ **Database Functions**: Optional database functions for better performance

## Next Steps (Optional Enhancements)

1. **Email Notifications**: Send emails when users earn rewards
2. **Reward Expiration**: Implement automatic expiration handling
3. **Analytics Dashboard**: Add charts showing referral trends
4. **Reward Templates**: Pre-defined reward packages
5. **Referral Leaderboard**: Show top referrers

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database schema was updated correctly
4. Ensure environment variables are set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
