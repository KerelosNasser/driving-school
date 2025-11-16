// Find your correct Google Business Location ID
// Run with: node find-google-location-id.js

require('dotenv').config({ path: '.env.local' });

async function findLocationId() {
  console.log('🔍 Finding Your Google Business Location ID\n');
  console.log('='.repeat(70));
  
  // Step 1: Check service account credentials
  console.log('\n📋 Step 1: Checking Service Account Credentials');
  console.log('-'.repeat(70));
  
  const serviceEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!serviceEmail || !privateKey) {
    console.log('❌ Service account credentials missing!');
    return;
  }
  
  console.log(`✅ Service Account: ${serviceEmail}`);
  
  // Step 2: Load Google Auth Library
  console.log('\n📦 Step 2: Loading Google Auth Library');
  console.log('-'.repeat(70));
  
  let google;
  try {
    google = require('googleapis').google;
    console.log('✅ googleapis package loaded');
  } catch (error) {
    console.log('❌ Failed to load googleapis');
    console.log('   Run: npm install googleapis');
    return;
  }
  
  // Step 3: Create JWT Client
  console.log('\n🔐 Step 3: Creating JWT Authentication');
  console.log('-'.repeat(70));
  
  let auth;
  try {
    auth = new google.auth.JWT({
      email: serviceEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    });
    
    const tokenResponse = await auth.getAccessToken();
    if (!tokenResponse?.token) {
      throw new Error('Failed to get access token');
    }
    
    console.log('✅ Authentication successful');
    console.log(`   Token: ${tokenResponse.token.substring(0, 20)}...`);
    
    const accessToken = tokenResponse.token;
    
    // Step 4: List all accounts
    console.log('\n🏢 Step 4: Finding Your Business Accounts');
    console.log('-'.repeat(70));
    
    const accountsUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    console.log(`   Fetching from: ${accountsUrl}`);
    
    const accountsResponse = await fetch(accountsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.log('❌ Failed to fetch accounts');
      console.log(`   Status: ${accountsResponse.status}`);
      console.log(`   Error: ${errorText}`);
      
      if (accountsResponse.status === 403) {
        console.log('\n⚠️  API not enabled or insufficient permissions!');
        console.log('\n   To fix:');
        console.log('   1. Go to https://console.cloud.google.com/');
        console.log('   2. Select your project: eds2-477208');
        console.log('   3. Go to APIs & Services → Library');
        console.log('   4. Search and enable these APIs:');
        console.log('      - My Business Account Management API');
        console.log('      - My Business Business Information API');
        console.log('   5. Add service account as Manager in Google Business Profile');
      }
      return;
    }
    
    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found');
      console.log('\n   Possible reasons:');
      console.log('   1. Service account not added to Google Business Profile');
      console.log('   2. You don\'t have a Google Business Profile yet');
      console.log('\n   To fix:');
      console.log('   1. Go to https://business.google.com/');
      console.log('   2. Create or claim your business');
      console.log('   3. Add service account as Manager');
      return;
    }
    
    console.log(`✅ Found ${accounts.length} account(s)`);
    
    // Step 5: List locations for each account
    console.log('\n📍 Step 5: Finding Your Business Locations');
    console.log('-'.repeat(70));
    
    let allLocations = [];
    
    for (const account of accounts) {
      console.log(`\n   Account: ${account.accountName || account.name}`);
      console.log(`   Account ID: ${account.name}`);
      
      const locationsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`;
      
      try {
        const locationsResponse = await fetch(locationsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          const locations = locationsData.locations || [];
          
          console.log(`   ✅ Found ${locations.length} location(s)`);
          
          locations.forEach((location, index) => {
            console.log(`\n   Location ${index + 1}:`);
            console.log(`   - Name: ${location.title || location.locationName || 'Unnamed'}`);
            console.log(`   - Full ID: ${location.name}`);
            console.log(`   - Address: ${location.storefrontAddress?.locality || 'N/A'}`);
            console.log(`   - Status: ${location.locationState?.isVerified ? 'Verified' : 'Not Verified'}`);
            
            allLocations.push({
              name: location.title || location.locationName,
              fullId: location.name,
              address: location.storefrontAddress?.locality
            });
          });
        } else {
          console.log(`   ⚠️  Could not fetch locations for this account`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error fetching locations: ${error.message}`);
      }
    }
    
    // Step 6: Show results
    console.log('\n' + '='.repeat(70));
    console.log('📝 RESULTS');
    console.log('='.repeat(70));
    
    if (allLocations.length === 0) {
      console.log('\n❌ No locations found!');
      console.log('\n   To fix:');
      console.log('   1. Go to https://business.google.com/');
      console.log('   2. Create or claim your business location');
      console.log('   3. Verify your business');
      console.log('   4. Add service account as Manager:');
      console.log(`      Email: ${serviceEmail}`);
      console.log('      Role: Manager');
      return;
    }
    
    console.log(`\n✅ Found ${allLocations.length} location(s)!\n`);
    
    allLocations.forEach((location, index) => {
      console.log(`Location ${index + 1}: ${location.name}`);
      console.log(`Address: ${location.address || 'N/A'}`);
      console.log(`\n📋 Add this to your .env.local:\n`);
      console.log(`GOOGLE_LOCATION_ID="${location.fullId}"`);
      console.log('\n' + '-'.repeat(70) + '\n');
    });
    
    // Step 7: Test fetching reviews
    if (allLocations.length > 0) {
      console.log('🧪 Step 7: Testing Reviews Fetch');
      console.log('-'.repeat(70));
      
      const testLocation = allLocations[0];
      console.log(`\nTesting with: ${testLocation.name}`);
      
      const reviewsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${testLocation.fullId}/reviews`;
      
      try {
        const reviewsResponse = await fetch(reviewsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          const reviews = reviewsData.reviews || [];
          
          console.log(`✅ Successfully fetched reviews!`);
          console.log(`   Total reviews: ${reviews.length}`);
          console.log(`   Average rating: ${reviewsData.averageRating || 'N/A'}`);
          
          if (reviews.length > 0) {
            console.log(`\n   Latest review:`);
            const latest = reviews[0];
            console.log(`   - Reviewer: ${latest.reviewer?.displayName || 'Anonymous'}`);
            console.log(`   - Rating: ${'⭐'.repeat(convertStarRating(latest.starRating))}`);
            console.log(`   - Date: ${new Date(latest.createTime).toLocaleDateString()}`);
          }
        } else {
          const errorText = await reviewsResponse.text();
          console.log(`⚠️  Could not fetch reviews`);
          console.log(`   Status: ${reviewsResponse.status}`);
          console.log(`   This is OK - you can still use the location ID above`);
        }
      } catch (error) {
        console.log(`⚠️  Error testing reviews: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ DONE!');
    console.log('='.repeat(70));
    console.log('\nNext steps:');
    console.log('1. Copy the GOOGLE_LOCATION_ID from above');
    console.log('2. Update your .env.local file');
    console.log('3. Restart your dev server: npm run dev');
    console.log('4. Try the sync again in /admin → Reviews → Google Sync');
    console.log('\n');
    
  } catch (error) {
    console.error('\n💥 Error:', error);
    console.error('\nStack:', error.stack);
  }
}

function convertStarRating(starRating) {
  const ratings = {
    'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5,
    'STAR_RATING_UNSPECIFIED': 5
  };
  return ratings[starRating] || 5;
}

// Run the script
findLocationId().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
