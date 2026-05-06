#!/usr/bin/env node
/**
 * Oracle Cloud WordPress Backend Diagnostic Script
 * Run: node scripts/diagnose-oracle-backend.js
 */

const WORDPRESS_URL = 'https://my-wp-backend.duckdns.org';
const USERNAME = 'hkc ode22';
const PASSWORD = 'Khan2203';
const IP = '167.234.220.121';

async function diagnose() {
  console.log('=== MHMA Oracle Backend Diagnostic ===\n');

  // Test 1: DNS Resolution
  console.log('1. Testing DNS Resolution...');
  try {
    const dnsResponse = await fetch(`${WORDPRESS_URL}/wp-json`, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000) 
    });
    console.log(`   DNS OK: ${WORDPRESS_URL} -> ${IP}`);
  } catch (e) {
    console.error(`   DNS/Connection Failed: ${e.message}`);
  }

  // Test 2: WordPress REST API
  console.log('\n2. Testing WordPress REST API...');
  try {
    const apiResponse = await fetch(`${WORDPRESS_URL}/wp-json`, { 
      signal: AbortSignal.timeout(10000) 
    });
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`   WordPress API OK: ${data.name || 'WordPress'}`);
      console.log(`   Version: ${data.version || 'unknown'}`);
    } else {
      console.error(`   WordPress API Error: ${apiResponse.status}`);
    }
  } catch (e) {
    console.error(`   WordPress API Failed: ${e.message}`);
  }

  // Test 3: Authentication
  console.log('\n3. Testing Authentication...');
  try {
    const authResponse = await fetch(`${WORDPRESS_URL}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
      signal: AbortSignal.timeout(10000)
    });
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log(`   Authentication OK: Logged in as ${authData.user_display_name || USERNAME}`);
    } else {
      console.error(`   Authentication Failed: ${authResponse.status}`);
    }
  } catch (e) {
    console.error(`   Authentication Error: ${e.message}`);
  }

  // Test 4: Fetch Programs
  console.log('\n4. Testing Programs Fetch (parent=70)...');
  try {
    const progResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages?parent=70&per_page=5`, {
      signal: AbortSignal.timeout(10000)
    });
    if (progResponse.ok) {
      const programs = await progResponse.json();
      console.log(`   Programs OK: Found ${programs.length} programs`);
      programs.slice(0, 3).forEach(p => {
        console.log(`      - ${p.title?.rendered || p.title} (ID: ${p.id})`);
      });
    } else {
      console.error(`   Programs Fetch Failed: ${progResponse.status}`);
    }
  } catch (e) {
    console.error(`   Programs Fetch Error: ${e.message}`);
  }

  // Test 5: Fetch Events
  console.log('\n5. Testing Events Fetch (parent=277)...');
  try {
    const eventsResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages?parent=277&per_page=5`, {
      signal: AbortSignal.timeout(10000)
    });
    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      console.log(`   Events OK: Found ${events.length} events`);
      events.slice(0, 3).forEach(e => {
        console.log(`      - ${e.title?.rendered || e.title} (ID: ${e.id})`);
      });
    } else {
      console.error(`   Events Fetch Failed: ${eventsResponse.status}`);
    }
  } catch (e) {
    console.error(`   Events Fetch Error: ${e.message}`);
  }

  // Test 6: Fetch Journal Entries
  console.log('\n6. Testing Journal Fetch (parent=199)...');
  try {
    const journalResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages?parent=199&per_page=5`, {
      signal: AbortSignal.timeout(10000)
    });
    if (journalResponse.ok) {
      const journals = await journalResponse.json();
      console.log(`   Journal OK: Found ${journals.length} entries`);
      journals.slice(0, 3).forEach(j => {
        console.log(`      - ${j.title?.rendered || j.title} (ID: ${j.id})`);
      });
    } else {
      console.error(`   Journal Fetch Failed: ${journalResponse.status}`);
    }
  } catch (e) {
    console.error(`   Journal Fetch Error: ${e.message}`);
  }

  console.log('\n=== Diagnostic Complete ===');
  console.log('\nTips:');
  console.log('- If DNS fails: Check DuckDNS and Oracle Cloud Security Lists');
  console.log('- If WordPress returns 500: SSH to Oracle and run "sudo systemctl restart mysql"');
  console.log('- If timeout: Oracle micro instance may be overloaded (1GB RAM)');
  console.log('- Check Oracle Console: https://cloud.oracle.com (login: hk84164@gmail.com)');
}

diagnose().catch(err => {
  console.error('Diagnostic failed:', err.message);
  process.exit(1);
});
