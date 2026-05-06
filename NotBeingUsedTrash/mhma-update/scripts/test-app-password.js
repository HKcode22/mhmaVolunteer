const WP_API_URL = 'http://mhma-update.local/wp-json';
const USERNAME = 'SWE';
const PASSWORD = 'test';

// Create Basic Auth header
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

async function testWithAppPassword() {
  console.log('🔍 Testing with Application Password format...\n');

  try {
    // Try Application Password format (WordPress 5.6+)
    console.log('Test: Using Application Password format...');
    const response = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);
    console.log();

    // Check if we need to install Basic Auth plugin
    console.log('Note: WordPress REST API does not support Basic Auth by default.');
    console.log('You need to install one of these plugins:');
    console.log('1. "Basic Auth" plugin from WordPress plugin repository');
    console.log('2. "JWT Authentication for WP REST API" plugin');
    console.log('3. Or use Application Passwords (WordPress 5.6+)');
    console.log();

    // Try to check if Basic Auth plugin is available
    console.log('Test: Checking if Basic Auth plugin is active...');
    const response2 = await fetch(`${WP_API_URL}/`, {
      method: 'GET'
    });

    console.log('Status:', response2.status);
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWithAppPassword();
