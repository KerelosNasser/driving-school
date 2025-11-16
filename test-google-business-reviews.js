// Test Google Business Profile API Access with Service Account
// Run with: node test-google-business-reviews.js

require('dotenv').config({ path: '.env.local' });

async function testGoogleBusinessReviews() {
  console.log('🔍 Testing Google Business Profile API Access\n');
  console.log('='.repeat(70));
  
  // Step 1: Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('-'.repeat(70));
  
  const serviceEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const locationId = process.env.GOOGLE_LOCATION_ID;
  
  console.log(`Service Account Email: ${serviceEmail ? '✅ Found' : '❌ Missing'}`);
  if (serviceEmail) console.log(`  → ${serviceEmail}`);
  
  console.log(`Private Key: ${privateKey ? '✅ Found' : '❌ Missing'}`);
  if (privateKey) {
    const keyPreview = privateKey.substring(0, 50).replace(/\n/g, '\\n');
    console.log(`  → ${keyPreview}...`);
  }
  
  console.log(`Location ID: ${locationId ? '✅ Found' : '❌ Missing'}`);
  if (locationId) console.log(`  → ${locationId}`);
  
  if (!serviceEmail || !privateKey) {
    console.log('\n❌ Missing service account credentials!');
    console.log('\nRequired in .env.local:');
    console.log('  GOOGLE_CLIENT_EMAIL=your-service@project.iam.gserviceaccount.com');
    console.log('  GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    return;
  }
  
  if (!locationId) {
    console.log('\n❌ Missing GOOGLE_LOCATION_ID!');
    console.log('\nAdd to .env.local:');
    console.log('  GOOGLE_LOCATION_ID=accounts/YOUR_ACCOUNT_ID/locations/YOUR_LOCATION_ID');
    console.log('\nTo find your location ID:');
    console.log('  1. Go to https://business.google.com/');
    console.log('  2. Select your business');
    console.log('  3. The URL will contain your location ID');
    console.log('  4. Or use: gcloud alpha my-business-business-information locations list');
    return;
  }
  
  // Step 2: Load Google Auth Library
  console.log('\n📦 Step 2: Loading Google Auth Library');
  console.log('-'.repeat(70));
  
  let google;
  try {
    google = require('googleapis').google;
    console.log('✅ googleapis package loaded successfully');
  } catch (error) {
    console.log('❌ Failed to load googleapis package');
    console.log('   Run: npm install googleapis');
    return;
  }
  
  // Step 3: Create JWT Client
  console.log('\n🔐 Step 3: Creating JWT Authentication Client');
  console.log('-'.repeat(70));
  
  let auth;
  try {
    auth = new google.auth.JWT({
      email: serviceEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/business.manage'
      ],
    });
    console.log('✅ JWT client created successfully');
  } catch (error) {
    console.log('❌ Failed to create JWT client');
    console.log(`   Error: ${error.message}`);
    return;
  }
  
  // Step 4: Test Token Generation
  console.log('\n🎫 Step 4: Testing Token Generation');
  console.log('-'.repeat(70));
  
  let accessToken;
  try {
    const tokenResponse = await auth.getAccessToken();
    if (tokenResponse && tokenResponse.token) {
      accessToken = tokenResponse.token;
      console.log('✅ Access token generated successfully');
      console.log(`   Token preview: ${accessToken.substring(0, 20)}...`);
      console.log(`   Token length: ${accessToken.length} characters`);
    } else {
      console.log('❌ Failed to generate access token');
      return;
    }
  } catch (error) {
    console.log('❌ Token generation failed');
    console.log(`   Error: ${error.message}`);
    if (error.message.includes('invalid_grant')) {
      console.log('\n⚠️  Possible causes:');
      console.log('   - Private key is incorrect or malformed');
      console.log('   - Service account has been deleted or disabled');
      console.log('   - System clock is out of sync');
    }
    return;
  }
  
  // Step 5: Test Business Profile API - Check if API is enabled
  console.log('\n🏢 Step 5: Testing Business Profile API Access');
  console.log('-'.repeat(70));
  
  try {
    // First, try to get location info
    const locationUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}`;
    console.log(`   Fetching location info from: ${locationUrl}`);
    
    const locationResponse = await fetch(locationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (locationResponse.ok) {
      const locationData = await locationResponse.json();
      console.log('✅ Business Profile API access successful');
      console.log(`   Business Name: ${locationData.title || locationData.name}`);
      console.log(`   Location: ${locationData.storefrontAddress?.locality || 'N/A'}`);
    } else {
      const errorText = await locationResponse.text();
      console.log('❌ Business Profile API access failed');
      console.log(`   Status: ${locationResponse.status}`);
      console.log(`   Error: ${errorText}`);
      
      if (locationResponse.status === 403) {
        console.log('\n⚠️  API not enabled or insufficient permissions!');
        console.log('\n   To fix:');
        console.log('   1. Go to https://console.cloud.google.com/');
        console.log('   2. Select your project: eds2-477208');
        console.log('   3. Go to APIs & Services → Library');
        console.log('   4. Search "My Business Business Information API"');
        console.log('   5. Click Enable');
        console.log('   6. Add service account as Manager in Google Business Profile');
      } else if (locationResponse.status === 404) {
        console.log('\n⚠️  Location not found!');
        console.log('\n   Check your GOOGLE_LOCATION_ID format:');
        console.log('   Should be: accounts/YOUR_ACCOUNT_ID/locations/YOUR_LOCATION_ID');
      }
      return;
    }
  } catch (error) {
    console.log('❌ API request failed');
    console.log(`   Error: ${error.message}`);
    return;
  }
  
  // Step 6: Test Fetching Reviews
  console.log('\n⭐ Step 6: Testing Reviews Fetch');
  console.log('-'.repeat(70));
  
  try {
    const reviewsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}/reviews`;
    console.log(`   Fetching reviews from: ${reviewsUrl}`);
    
    const reviewsResponse = await fetch(reviewsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      const reviews = reviewsData.reviews || [];
      
      console.log('✅ Successfully fetched reviews');
      console.log(`   Total reviews: ${reviews.length}`);
      console.log(`   Average rating: ${reviewsData.averageRating || 'N/A'}`);
      console.log(`   Total review count: ${reviewsData.totalReviewCount || reviews.length}`);
      
      if (reviews.length > 0) {
        console.log('\n   Recent reviews:');
        reviews.slice(0, 3).forEach((review, index) => {
          console.log(`   ${index + 1}. ${review.reviewer?.displayName || 'Anonymous'}`);
          console.log(`      Rating: ${'⭐'.repeat(convertStarRating(review.starRating))}`);
          console.log(`      Comment: ${review.comment?.substring(0, 60) || 'No comment'}...`);
          console.log(`      Date: ${new Date(review.createTime).toLocaleDateString()}`);
        });
        if (reviews.length > 3) {
          console.log(`   ... and ${reviews.length - 3} more reviews`);
        }
      } else {
        console.log('\n   ℹ️  No reviews found for this business');
        console.log('   This is normal if your business has no reviews yet');
      }
    } else {
      const errorText = await reviewsResponse.text();
      console.log('❌ Failed to fetch reviews');
      console.log(`   Status: ${reviewsResponse.status}`);
      console.log(`   Error: ${errorText}`);
      
      if (reviewsResponse.status === 403) {
        console.log('\n⚠️  Insufficient permissions!');
        console.log('\n   To fix:');
        console.log('   1. Go to https://business.google.com/');
        console.log('   2. Select your business');
        console.log('   3. Click Users → Add users');
        console.log(`   4. Add: ${serviceEmail}`);
        console.log('   5. Set role: Manager');
        console.log('   6. Wait 5-10 minutes for permissions to propagate');
      }
      return;
    }
  } catch (error) {
    console.log('❌ Reviews fetch failed');
    console.log(`   Error: ${error.message}`);
    return;
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('='.repeat(70));
  console.log('\n✅ Your Google Business Profile integration is ready!');
  console.log('\nNext steps:');
  console.log('  1. Deploy to Vercel with environment variables');
  console.log('  2. Test manual sync: /admin → Reviews → Google Sync → Sync Now');
  console.log('  3. Wait for automatic sync at 2 AM UTC');
  console.log('\n');
}

// Helper function to convert star rating
function convertStarRating(starRating) {
  const ratings = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5,
    'STAR_RATING_UNSPECIFIED': 5
  };
  return ratings[starRating] || 5;
}

// Run the test
testGoogleBusinessReviews().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
