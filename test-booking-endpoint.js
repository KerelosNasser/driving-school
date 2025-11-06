// Simple test for POST /api/calendar/book
// Requirements:
// - Dev server running on http://localhost:3000
// - A valid Clerk JWT in TEST_AUTH_TOKEN env var
// - Calendar connected via Google service account or OAuth

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || process.env.CLERK_TEST_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Missing TEST_AUTH_TOKEN. Please set a valid Clerk JWT in your .env.local');
  process.exit(1);
}

function formatDateYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function getAvailableSlots(dateStr) {
  const url = `${BASE_URL}/api/calendar/events?eventType=slots&date=${encodeURIComponent(dateStr)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get slots: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json?.data || json?.slots || [];
}

async function bookSlot(dateStr, time) {
  const payload = {
    date: dateStr,
    time,
    studentName: 'Test Student',
    studentEmail: 'test.student@example.com',
    notes: 'Automated booking test',
  };
  const res = await fetch(`${BASE_URL}/api/calendar/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  // Try tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = formatDateYYYYMMDD(tomorrow);

  console.log('Fetching available slots for', dateStr);
  const slots = await getAvailableSlots(dateStr);
  if (!slots.length) {
    console.error('No available slots found. Ensure calendar settings enable this day and tokens are configured.');
    process.exit(2);
  }

  const first = slots[0];
  const time = first?.time || first?.start?.split('T')[1]?.slice(0,5) || first;
  console.log('Attempting to book slot:', time);

  const { status, json } = await bookSlot(dateStr, time);
  console.log('Booking response status:', status);
  console.log(JSON.stringify(json, null, 2));
}

main().catch(err => {
  console.error('Error running booking test:', err);
  process.exit(3);
});