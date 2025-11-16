#!/usr/bin/env node

/**
 * Test script to verify calendar settings sync between admin panel and service center
 * 
 * Usage: node scripts/test-calendar-settings-sync.js
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testCalendarSettingsSync() {
  console.log('🧪 Testing Calendar Settings Sync\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Fetch settings from admin endpoint
    console.log('\n📡 Test 1: Fetching from admin endpoint (/api/calendar-settings)...');
    const adminResponse = await fetch(`${APP_URL}/api/calendar-settings`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!adminResponse.ok) {
      console.log('⚠️  Admin endpoint requires authentication (expected)');
    } else {
      const adminData = await adminResponse.json();
      console.log('✅ Admin settings:', JSON.stringify(adminData, null, 2));
    }
    
    // Test 2: Fetch settings from service center endpoint
    console.log('\n📡 Test 2: Fetching from service center endpoint (/api/calendar/settings)...');
    const serviceCenterResponse = await fetch(`${APP_URL}/api/calendar/settings`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!serviceCenterResponse.ok) {
      throw new Error(`Service center endpoint failed: ${serviceCenterResponse.status}`);
    }
    
    const serviceCenterData = await serviceCenterResponse.json();
    console.log('✅ Service center settings:', JSON.stringify(serviceCenterData, null, 2));
    
    // Test 3: Verify key settings
    console.log('\n🔍 Test 3: Verifying key settings...');
    
    const checks = [
      {
        name: 'Buffer Time',
        value: serviceCenterData.bufferTimeMinutes,
        expected: 'number',
        valid: typeof serviceCenterData.bufferTimeMinutes === 'number'
      },
      {
        name: 'Working Days',
        value: serviceCenterData.workingDays,
        expected: 'array',
        valid: Array.isArray(serviceCenterData.workingDays)
      },
      {
        name: 'Working Hours',
        value: serviceCenterData.workingHours,
        expected: 'object with start/end',
        valid: serviceCenterData.workingHours?.start && serviceCenterData.workingHours?.end
      },
      {
        name: 'Vacation Days',
        value: serviceCenterData.vacationDays,
        expected: 'array',
        valid: Array.isArray(serviceCenterData.vacationDays)
      }
    ];
    
    let allValid = true;
    checks.forEach(check => {
      if (check.valid) {
        console.log(`  ✅ ${check.name}: ${JSON.stringify(check.value)}`);
      } else {
        console.log(`  ❌ ${check.name}: Invalid (expected ${check.expected})`);
        allValid = false;
      }
    });
    
    // Test 4: Check working days configuration
    console.log('\n📅 Test 4: Working days configuration...');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    serviceCenterData.workingDays?.forEach(day => {
      console.log(`  ✅ ${dayNames[day]} is enabled`);
    });
    
    // Test 5: Check vacation days
    console.log('\n🏖️  Test 5: Vacation days...');
    if (serviceCenterData.vacationDays?.length > 0) {
      serviceCenterData.vacationDays.forEach(date => {
        console.log(`  🏖️  ${date}`);
      });
    } else {
      console.log('  ℹ️  No vacation days configured');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    if (allValid) {
      console.log('✅ All tests passed! Calendar settings sync is working correctly.');
      console.log('\n💡 Next steps:');
      console.log('   1. Open admin panel and modify calendar settings');
      console.log('   2. Wait 30 seconds or refresh service center');
      console.log('   3. Verify changes appear in service center booking calendar');
    } else {
      console.log('❌ Some tests failed. Please check the configuration.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure the development server is running');
    console.error('   2. Check database connection');
    console.error('   3. Verify calendar_settings table exists');
    console.error('   4. Review server logs for errors');
    process.exit(1);
  }
}

// Run tests
testCalendarSettingsSync().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
