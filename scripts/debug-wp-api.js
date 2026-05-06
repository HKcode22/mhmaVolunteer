const WP_API_URL = 'http://mhma-update.local/wp-json';
const USERNAME = 'SWE';
const PASSWORD = 'test';

// Create Basic Auth header
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

async function testAuthentication() {
  console.log('🔍 Testing WordPress REST API authentication...\n');

  try {
    // Test 1: Check if we can access the API at all
    console.log('Test 1: Checking API accessibility...');
    const response1 = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    console.log('Status:', response1.status);
    const data1 = await response1.text();
    console.log('Response:', data1);
    console.log();

    // Test 2: Try to get user list
    console.log('Test 2: Getting user list...');
    const response2 = await fetch(`${WP_API_URL}/wp/v2/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    console.log('Status:', response2.status);
    const data2 = await response2.text();
    console.log('Response:', data2);
    console.log();

    // Test 3: Check if ACF is installed
    console.log('Test 3: Checking ACF plugin...');
    const response3 = await fetch(`${WP_API_URL}/acf/v3/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    console.log('Status:', response3.status);
    const data3 = await response3.text();
    console.log('Response:', data3);
    console.log();

    // Test 4: Try to create a simple post
    console.log('Test 4: Trying to create a simple post...');
    const response4 = await fetch(`${WP_API_URL}/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        title: 'Test Post',
        content: 'Test content',
        status: 'draft'
      })
    });

    console.log('Status:', response4.status);
    const data4 = await response4.text();
    console.log('Response:', data4);
    console.log();

    // Test 5: Try to create a page
    console.log('Test 5: Trying to create a page...');
    const response5 = await fetch(`${WP_API_URL}/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        title: 'Test Page',
        content: 'Test content',
        status: 'draft'
      })
    });

    console.log('Status:', response5.status);
    const data5 = await response5.text();
    console.log('Response:', data5);
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuthentication();
