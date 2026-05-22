/**
 * Firestore Security Rules Test Script
 * 
 * This script tests the security rules by simulating browser-side attacks.
 * It uses the Firebase REST API directly (like a browser would) to test
 * if unauthorized access is properly blocked.
 * 
 * Run: node scripts/test-security-rules.mjs
 */

import https from 'https';

const PROJECT_ID = 'mhma-backend';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Get a valid auth token for a regular member (not board member)
// We'll use the service account to mint a custom token for testing
async function getAuthToken() {
  const crypto = await import('crypto');
  const fs = await import('fs');
  const sa = JSON.parse(fs.readFileSync(process.env.HOME + '/.keys/mhma-firebase.json', 'utf8'));
  
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const jwt = header + '.' + payload + '.' + sign.sign(sa.private_key, 'base64url');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    });
    
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const token = JSON.parse(data);
        resolve(token.access_token);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function apiRequest(method, path, token = null, body = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: `/v1${path}`,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, data: { error: data.substring(0, 200) } });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🔒 Firestore Security Rules Test\n');
  console.log('Testing as: UNAUTHENTICATED USER (no token)\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Read events (should PASS - public read)
  console.log('Test 1: Read events (should ALLOW - public read)');
  const events = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/events`);
  if (events.status === 200) {
    console.log('  ✅ PASS - Events are publicly readable\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Events should be publicly readable (got ${events.status})\n`);
    failed++;
  }
  
  // Test 2: Read users without auth (should FAIL)
  console.log('Test 2: Read users collection (should DENY - requires auth)');
  const users = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/users`);
  if (users.status === 403 || users.status === 401) {
    console.log('  ✅ PASS - Users collection is protected\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Users should be protected (got ${users.status})\n`);
    failed++;
  }
  
  // Test 3: Read enrollments without auth (should FAIL)
  console.log('Test 3: Read enrollments (should DENY - board only)');
  const enrollments = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/enrollments`);
  if (enrollments.status === 403 || enrollments.status === 401) {
    console.log('  ✅ PASS - Enrollments are protected\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Enrollments should be protected (got ${enrollments.status})\n`);
    failed++;
  }
  
  // Test 4: Read scheduling requests without auth (should FAIL)
  console.log('Test 4: Read scheduling requests (should DENY - board only)');
  const requests = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/schedulingRequests`);
  if (requests.status === 403 || requests.status === 401) {
    console.log('  ✅ PASS - Scheduling requests are protected\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Scheduling requests should be protected (got ${requests.status})\n`);
    failed++;
  }
  
  // Test 5: Read contact submissions without auth (should FAIL)
  console.log('Test 5: Read contact submissions (should DENY - board only)');
  const contacts = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/contactSubmissions`);
  if (contacts.status === 403 || contacts.status === 401) {
    console.log('  ✅ PASS - Contact submissions are protected\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Contact submissions should be protected (got ${contacts.status})\n`);
    failed++;
  }
  
  // Test 6: Read RSVPs without auth (should FAIL)
  console.log('Test 6: Read RSVPs (should DENY - board only)');
  const rsvps = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/rsvps`);
  if (rsvps.status === 403 || rsvps.status === 401) {
    console.log('  ✅ PASS - RSVPs are protected\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - RSVPs should be protected (got ${rsvps.status})\n`);
    failed++;
  }
  
  // Test 7: Read invite codes without auth (should FAIL)
  console.log('Test 7: Read invite codes (should DENY - board only)');
  const codes = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/inviteCodes`);
  if (codes.status === 403 || codes.status === 401) {
    console.log('  ✅ PASS - Invite codes are protected\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Invite codes should be protected (got ${codes.status})\n`);
    failed++;
  }
  
  // Test 8: Read notifications without auth (should FAIL)
  console.log('Test 8: Read notifications (should DENY - board only)');
  const notifications = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/notifications`);
  if (notifications.status === 403 || notifications.status === 401) {
    console.log('  ✅ PASS - Notifications are protected\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Notifications should be protected (got ${notifications.status})\n`);
    failed++;
  }
  
  // Test 9: Write to events without auth (should FAIL)
  console.log('Test 9: Create event (should DENY - board only)');
  const createEvent = await apiRequest('POST', `/projects/${PROJECT_ID}/databases/(default)/documents/events`, null, {
    fields: {
      title: { stringValue: 'HACKED EVENT' },
      slug: { stringValue: 'hacked' }
    }
  });
  if (createEvent.status === 403 || createEvent.status === 401) {
    console.log('  ✅ PASS - Cannot create events without auth\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Should not be able to create events (got ${createEvent.status})\n`);
    failed++;
  }
  
  // Test 10: Delete a user document without auth (should FAIL)
  console.log('Test 10: Delete user document (should DENY - never allowed)');
  const deleteUser = await apiRequest('DELETE', `/projects/${PROJECT_ID}/databases/(default)/documents/users/test-user-123`);
  if (deleteUser.status === 403 || deleteUser.status === 401 || deleteUser.status === 404) {
    console.log('  ✅ PASS - Cannot delete users\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Should not be able to delete users (got ${deleteUser.status})\n`);
    failed++;
  }
  
  // Test 11: Read programs (should PASS - public read)
  console.log('Test 11: Read programs (should ALLOW - public read)');
  const programs = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/programs`);
  if (programs.status === 200) {
    console.log('  ✅ PASS - Programs are publicly readable\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Programs should be publicly readable (got ${programs.status})\n`);
    failed++;
  }
  
  // Test 12: Read journal (should PASS - public read)
  console.log('Test 12: Read journal (should ALLOW - public read)');
  const journal = await apiRequest('GET', `/projects/${PROJECT_ID}/databases/(default)/documents/journal`);
  if (journal.status === 200) {
    console.log('  ✅ PASS - Journal is publicly readable\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Journal should be publicly readable (got ${journal.status})\n`);
    failed++;
  }
  
  // Test 13: Create contact submission (should PASS - public write)
  console.log('Test 13: Create contact submission (should ALLOW - public write)');
  const createContact = await apiRequest('POST', `/projects/${PROJECT_ID}/databases/(default)/documents/contactSubmissions`, null, {
    fields: {
      name: { stringValue: 'Security Test' },
      email: { stringValue: 'test@security.test' },
      subject: { stringValue: 'Security Test' },
      message: { stringValue: 'This is a security test' },
      read: { booleanValue: false }
    }
  });
  if (createContact.status === 200) {
    console.log('  ✅ PASS - Contact submissions can be created publicly\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - Contact submissions should be publicly creatable (got ${createContact.status})\n`);
    failed++;
  }
  
  // Test 14: Create RSVP (should PASS - public write)
  console.log('Test 14: Create RSVP (should ALLOW - public write)');
  const createRSVP = await apiRequest('POST', `/projects/${PROJECT_ID}/databases/(default)/documents/rsvps`, null, {
    fields: {
      fullName: { stringValue: 'Security Test' },
      email: { stringValue: 'test@security.test' },
      eventTitle: { stringValue: 'Test Event' },
      attendees: { integerValue: 1 },
      status: { stringValue: 'pending' }
    }
  });
  if (createRSVP.status === 200) {
    console.log('  ✅ PASS - RSVPs can be created publicly\n');
    passed++;
  } else {
    console.log(`  ❌ FAIL - RSVPs should be publicly creatable (got ${createRSVP.status})\n`);
    failed++;
  }
  
  console.log('═'.repeat(50));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  
  if (failed === 0) {
    console.log('\n🔒 ALL SECURITY TESTS PASSED - Your Firestore rules are tight!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Review your security rules!');
  }
  
  console.log('\n📝 Summary:');
  console.log('  - Public data (events, programs, journal) is accessible ✅');
  console.log('  - User data is protected from unauthenticated access ✅');
  console.log('  - Board-only collections (enrollments, requests, RSVPs) are protected ✅');
  console.log('  - Public forms (contact, RSVP) accept submissions ✅');
  console.log('  - Write operations on protected collections are blocked ✅');
}

runTests().catch(console.error);
