# Testing Guide: Referral Reward System

## Prerequisites
1. ✅ Apply the database changes using the Supabase AI prompt (see REFERRAL_SYSTEM_FIXES.md)
2. ✅ Restart your development server
3. ✅ Have admin access to the admin panel

## Test 1: Create Reward Tiers

### Steps:
1. Navigate to `/admin` in your browser
2. Click on "Referral Rewards" in the sidebar
3. Go to "Reward Tiers" tab
4. Click "Add Tier" button

### Create First Tier (Bronze):
- **Tier Name**: Bronze Tier
- **Required Referrals**: 1
- **Reward Type**: Discount
- **Discount %**: 30
- **Active**: ON
- Click "Create"

### Create Second Tier (Silver):
- **Tier Name**: Silver Tier
- **Required Referrals**: 3
- **Reward Type**: Discount
- **Discount %**: 50
- **Active**: ON
- Click "Create"

### Expected Result:
✅ Both tiers should appear in the table
✅ No errors in console
✅ Success toast notification

---

## Test 2: Gift a Reward to a User

### Steps:
1. Stay in "Referral Rewards" section
2. Go to "Gift Rewards" tab
3. Click "Gift Reward" button

### Fill the Form:
- **User**: Select any user from dropdown (should show email and name)
- **Type**: Discount
- **Discount %**: 20
- **Reason**: "Testing reward system"
- **Expires**: (optional) Set a future date
- **Notify**: ON
- Click "Gift Reward"

### Expected Result:
✅ Success message appears
✅ Reward appears in "All User Rewards" table below
✅ User should be able to see this reward in their service center

### Verify User Received It:
1. Log in as that user (or check their account)
2. Go to Service Center → Invitations section
3. Should see the gifted reward listed

---

## Test 3: Automatic Reward Distribution

### Setup:
You need at least 2 user accounts for this test:
- **User A**: The referrer (will get rewards)
- **User B**: The referred (new signup)

### Steps:

#### Part 1: Get User A's Invitation Code
1. Log in as User A
2. Go to Service Center
3. Copy their invitation code (e.g., "DRV12345ABC")

#### Part 2: Sign Up User B with Invitation Code
1. Log out
2. Go to sign-up page
3. Create a new account (User B)
4. During or after signup, enter User A's invitation code
5. Complete the profile

#### Part 3: Process the Referral
The referral should be automatically processed when User B signs up with the code. If not, you can manually trigger it:

```bash
# Use your API testing tool (Postman, curl, etc.)
POST /api/process-referral
{
  "invitationCode": "DRV12345ABC",
  "newUserId": "<User B's UUID>",
  "newUserEmail": "userb@example.com"
}
```

#### Part 4: Verify Reward Was Given
1. Log in as User A
2. Go to Service Center → Invitations
3. Should see:
   - 1 completed referral
   - 1 reward (Bronze Tier - 30% discount)

### Expected Result:
✅ User A automatically receives Bronze Tier reward (30% discount)
✅ Referral count shows 1
✅ Reward is marked as "Available" (not used)

---

## Test 4: Multiple Referrals & Tier Progression

### Steps:
1. Repeat Test 3 with 2 more new users (User C and User D)
2. Both should use User A's invitation code
3. After processing both referrals, User A should have 3 total referrals

### Expected Result:
✅ User A now has 3 completed referrals
✅ User A has 2 rewards:
   - Bronze Tier (30% discount) - from 1st referral
   - Silver Tier (50% discount) - from 3rd referral
✅ Both rewards are available to use

---

## Test 5: Retroactive Reward Distribution

### Scenario:
You have users who already made referrals BEFORE you created the reward tiers. They should get rewards retroactively.

### Steps:
1. Go to Admin Panel → Referral Rewards
2. Stay on "Overview" tab
3. Click "Distribute Rewards to All Users" button
4. Wait for success message

### Expected Result:
✅ Success message shows how many rewards were distributed
✅ All users with qualifying referral counts receive their rewards
✅ No duplicate rewards are created
✅ Stats update to show new reward count

---

## Test 6: View Statistics

### Steps:
1. Go to Admin Panel → Referral Rewards → Overview
2. Check the stat cards at the top

### Expected Data:
- **Total Users**: Should show total registered users
- **Total Referrals**: Should show count of completed referrals
- **Rewards Distributed**: Should show total rewards given
- **Discount Value**: Estimated value of unused discounts

### Expected Result:
✅ All numbers are accurate
✅ Recent rewards list shows latest 5 rewards
✅ Each reward shows user email, type, and status

---

## Test 7: Edit and Delete Tiers

### Edit a Tier:
1. Go to Reward Tiers tab
2. Click edit icon on Bronze Tier
3. Change discount from 30% to 35%
4. Click "Update"

### Expected Result:
✅ Tier updates successfully
✅ Existing rewards keep their original value (30%)
✅ New rewards will use new value (35%)

### Delete a Tier:
1. Click delete icon on a tier
2. Confirm deletion

### Expected Result:
✅ If tier has rewards: Tier is deactivated (not deleted)
✅ If tier has no rewards: Tier is permanently deleted
✅ Success message appears

---

## Test 8: Apply Reward to Booking

### Steps:
1. Log in as a user who has an available reward
2. Go to booking page
3. Select a package and date
4. At checkout, there should be an option to apply reward
5. Select the reward
6. Complete booking

### Expected Result:
✅ Discount is applied to total price
✅ Reward is marked as "Used"
✅ Reward shows "Used At" timestamp
✅ User can see used reward in service center

---

## Common Issues & Solutions

### Issue: Users dropdown is empty in Gift Rewards
**Solution**: 
- Check that `/api/admin/users` endpoint is working
- Verify users exist in database
- Check browser console for errors

### Issue: Rewards not automatically distributed
**Solution**:
- Check server logs when processing referral
- Verify reward tiers are active
- Ensure referral status is 'completed'
- Check that `tier_name` field exists in database

### Issue: "supabaseUrl is required" error
**Solution**:
- Verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- Verify `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Restart development server after adding env vars

### Issue: Database function not found
**Solution**:
- This is normal - the system falls back to manual distribution
- To use database functions, run the SQL from the Supabase AI prompt

---

## Success Criteria

Your referral system is working correctly if:

✅ Admin can create/edit/delete reward tiers
✅ Admin can gift rewards to specific users
✅ Users automatically receive rewards when reaching milestones
✅ Users can see their invitation code and stats
✅ Users can see their earned rewards
✅ Rewards can be applied to bookings
✅ Statistics are accurate
✅ Retroactive distribution works for existing users

---

## Next: Production Deployment

Before deploying to production:

1. ✅ Run all tests above
2. ✅ Apply database changes to production Supabase
3. ✅ Verify environment variables in production
4. ✅ Test with real user accounts
5. ✅ Set up monitoring for referral processing
6. ✅ Consider adding email notifications for rewards

---

## Need Help?

If something doesn't work:
1. Check browser console (F12)
2. Check server logs
3. Verify database schema matches expected structure
4. Review REFERRAL_SYSTEM_FIXES.md for detailed documentation
