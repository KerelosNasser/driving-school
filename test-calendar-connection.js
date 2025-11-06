// Test Google Calendar Service Account Connection
// Run with: node test-calendar-connection.js

require('dotenv').config({ path: '.env.local' });

async function testCalendarConnection() {
  console.log('🔍 Testing Google Calendar Service Account Connection\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('-'.repeat(60));
  
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'primary';
  
  console.log(`Service Account Email: ${serviceEmail ? '✅ Found' : '❌ Missing'}`);
  if (serviceEmail) console.log(`  → ${serviceEmail}`);
  
  console.log(`Private Key: ${privateKey ? '✅ Found' : '❌ Missing'}`);
  if (privateKey) {
    const keyPreview = privateKey.substring(0, 50).replace(/\n/g, '\\n');
    console.log(`  → ${keyPreview}...`);
  }
  
  console.log(`Calendar ID: ${calendarId ? '✅ Found' : '❌ Missing'}`);
  if (calendarId) console.log(`  → ${calendarId}`);
  
  if (!serviceEmail || !privateKey) {
    console.log('\n❌ Missing required environment variables!');
    console.log('\nRequired in .env.local:');
    console.log('  GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com');
    console.log('  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.log('  GOOGLE_CALENDAR_ID=your-email@gmail.com');
    return;
  }
  
  // Step 2: Test Google Auth Library
  console.log('\n📦 Step 2: Loading Google APIs');
  console.log('-'.repeat(60));
  
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
  console.log('-'.repeat(60));
  
  let auth;
  try {
    auth = new google.auth.JWT({
      email: serviceEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
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
  console.log('-'.repeat(60));
  
  try {
    const tokenResponse = await auth.getAccessToken();
    if (tokenResponse && tokenResponse.token) {
      console.log('✅ Access token generated successfully');
      console.log(`   Token preview: ${tokenResponse.token.substring(0, 20)}...`);
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
  
  // Step 5: Test Calendar API Access
  console.log('\n📅 Step 5: Testing Calendar API Access');
  console.log('-'.repeat(60));
  
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    const response = await calendar.calendarList.list();
    console.log('✅ Calendar API access successful');
    console.log(`   Found ${response.data.items?.length || 0} accessible calendars`);
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('\n   Accessible calendars:');
      response.data.items.forEach((cal, index) => {
        console.log(`   ${index + 1}. ${cal.summary} (${cal.id})`);
        console.log(`      Access Role: ${cal.accessRole}`);
      });
    }
  } catch (error) {
    console.log('❌ Calendar API access failed');
    console.log(`   Error: ${error.message}`);
    if (error.code === 404) {
      console.log('\n⚠️  Calendar API might not be enabled in GCP Console');
    }
    return;
  }
  
  // Step 6: Test Specific Calendar Access
  console.log(`\n🎯 Step 6: Testing Access to Calendar: ${calendarId}`);
  console.log('-'.repeat(60));
  
  try {
    const calendarInfo = await calendar.calendars.get({
      calendarId: calendarId
    });
    console.log('✅ Calendar access successful');
    console.log(`   Calendar: ${calendarInfo.data.summary}`);
    console.log(`   Time Zone: ${calendarInfo.data.timeZone}`);
  } catch (error) {
    console.log('❌ Cannot access specified calendar');
    console.log(`   Error: ${error.message}`);
    if (error.code === 404) {
      console.log('\n⚠️  Calendar not found or not shared with service account!');
      console.log('\n   To fix this:');
      console.log('   1. Open Google Calendar (calendar.google.com)');
      console.log('   2. Find your calendar in the left sidebar');
      console.log('   3. Click the 3 dots → Settings and sharing');
      console.log('   4. Scroll to "Share with specific people"');
      console.log('   5. Add this email: ' + serviceEmail);
      console.log('   6. Set permission to "Make changes to events"');
      console.log('   7. Click Send');
    }
    return;
  }
  
  // Step 7: Test Reading Events
  console.log('\n📖 Step 7: Testing Event Reading');
  console.log('-'.repeat(60));
  
  try {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const eventsResponse = await calendar.events.list({
      calendarId: calendarId,
      timeMin: oneMonthAgo.toISOString(),
      timeMax: oneMonthLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = eventsResponse.data.items || [];
    console.log(`✅ Successfully read events from calendar`);
    console.log(`   Found ${events.length} events in the past/next 30 days`);
    
    if (events.length > 0) {
      console.log('\n   Recent/Upcoming events:');
      events.slice(0, 5).forEach((event, index) => {
        const start = event.start?.dateTime || event.start?.date;
        console.log(`   ${index + 1}. ${event.summary || '(No title)'}`);
        console.log(`      Start: ${start}`);
      });
      if (events.length > 5) {
        console.log(`   ... and ${events.length - 5} more events`);
      }
    } else {
      console.log('\n   ℹ️  No events found in this calendar');
      console.log('   Try adding a test event to verify write access');
    }
  } catch (error) {
    console.log('❌ Failed to read events');
    console.log(`   Error: ${error.message}`);
    return;
  }
  
  // Step 8: Test Creating Event
  console.log('\n✍️  Step 8: Testing Event Creation');
  console.log('-'.repeat(60));
  
  try {
    const testEventStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const testEventEnd = new Date(testEventStart.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const testEvent = {
      summary: 'Test Event - Calendar Integration',
      description: 'This is a test event created by the calendar integration test script',
      start: {
        dateTime: testEventStart.toISOString(),
        timeZone: 'Australia/Brisbane',
      },
      end: {
        dateTime: testEventEnd.toISOString(),
        timeZone: 'Australia/Brisbane',
      },
    };
    
    const createdEvent = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: testEvent,
    });
    
    console.log('✅ Successfully created test event');
    console.log(`   Event ID: ${createdEvent.data.id}`);
    console.log(`   Event Link: ${createdEvent.data.htmlLink}`);
    
    // Clean up: Delete the test event
    console.log('\n🧹 Cleaning up test event...');
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: createdEvent.data.id,
    });
    console.log('✅ Test event deleted successfully');
    
  } catch (error) {
    console.log('❌ Failed to create/delete test event');
    console.log(`   Error: ${error.message}`);
    if (error.code === 403) {
      console.log('\n⚠️  Insufficient permissions!');
      console.log('   The service account needs "Make changes to events" permission');
      console.log('   Current permission might be "See all event details" (read-only)');
    }
    return;
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log('\n✅ Your Google Calendar integration is properly configured!');
  console.log('\nNext steps:');
  console.log('  1. Restart your Next.js dev server: npm run dev');
  console.log('  2. Test the API endpoint: http://localhost:3000/api/calendar/connection');
  console.log('  3. Try booking a lesson through your app');
  console.log('\n');
}

// Run the test
testCalendarConnection().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
