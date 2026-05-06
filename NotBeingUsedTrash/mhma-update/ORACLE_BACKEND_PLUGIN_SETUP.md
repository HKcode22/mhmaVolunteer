# Oracle Backend WordPress Plugin Setup Guide

This guide explains how to set up the required plugins on your Oracle Cloud WordPress backend (`https://my-wp-backend.duckdns.org`) to ensure all features work correctly.

## Required Plugins

### 1. Journal Meta Fields Plugin (CRITICAL for Journal dates)

The Journal page requires this plugin to display dates properly.

#### Option A: Install via WordPress Admin (Easiest)

1. Log in to your Oracle WordPress admin: `https://my-wp-backend.duckdns.org/wp-admin`
2. Go to **Plugins > Add New Plugin**
3. Click **Upload Plugin**
4. Download this file as a ZIP and upload it:

**File: `journal-meta-fields.php`**
```php
<?php
/**
 * Plugin Name: Journal Meta Fields
 * Description: Enables journal date fields to work with REST API
 * Version: 1.0
 * Author: MHMA
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Register meta fields so they work with REST API
add_action('init', function() {
    // Register for pages (since journal entries are stored as pages)
    register_meta('post', 'date_published', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
    
    register_meta('post', 'date_held_on', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
    
    register_meta('post', 'journal_title', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
    
    register_meta('post', 'attendees', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
});

// Also register as page meta (since journal entries are pages with parent=199)
add_action('init', function() {
    register_meta('page', 'date_published', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
    
    register_meta('page', 'date_held_on', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
    
    register_meta('page', 'journal_title', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
    
    register_meta('page', 'attendees', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
});
```

5. After uploading, click **Activate**

#### Option B: Manual Installation via SSH/SFTP

1. SSH into your Oracle Cloud instance
2. Navigate to WordPress plugins directory:
   ```bash
   cd /var/www/html/wp-content/plugins
   ```
3. Create the plugin directory:
   ```bash
   sudo mkdir journal-meta-fields
   ```
4. Create the plugin file:
   ```bash
   sudo nano journal-meta-fields/journal-meta-fields.php
   ```
5. Paste the code above and save (Ctrl+X, then Y, then Enter)
6. Go to WordPress admin and activate the plugin

### 2. Advanced Custom Fields (ACF) Plugin

**Required for:** Programs, Events, and Contact page custom fields

1. In WordPress admin, go to **Plugins > Add New**
2. Search for "Advanced Custom Fields"
3. Install and activate **Advanced Custom Fields** by WP Engine
4. Once activated, import the field groups:
   - Go to **Custom Fields > Tools**
   - Import the JSON files:
     - `acf-contact-page-fields.json` (from this repository)
     - Create field groups for Programs and Events (see below)

### 3. JWT Authentication for WP REST API

**Required for:** Dashboard login and content management

1. In WordPress admin, go to **Plugins > Add New**
2. Search for "JWT Authentication for WP REST API"
3. Install and activate
4. Configure `wp-config.php`:
   ```php
   define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
   define('JWT_AUTH_CORS_ENABLE', true);
   ```

## Page Structure Setup

Ensure these pages exist with the correct IDs (or update the frontend code to match your IDs):

| Page | Purpose | Expected Parent ID |
|------|---------|-------------------|
| Home | Homepage | 152 |
| Programs | Programs listing | 70 |
| Events | Events listing | 277 |
| Journal | Journal/Minutes | 199 |

To find your page IDs:
1. Go to **Pages > All Pages**
2. Hover over a page and look at the URL - it shows `post=XXX`

## Troubleshooting

### Journal dates not showing
- Verify the Journal Meta Fields plugin is activated
- Check that journal entries have the `date_published` meta field set

### Events not showing
- Verify ACF plugin is active
- Check that events have the correct parent page ID
- Verify event ACF fields are populated

### Programs not showing correctly
- Verify ACF plugin is active
- Check program ACF fields in the WordPress admin
- Ensure `program_image` field contains a valid media ID

## Support

If you encounter issues:
1. Check WordPress error logs: `/var/www/html/wp-content/debug.log`
2. Verify REST API is working: `https://my-wp-backend.duckdns.org/wp-json/wp/v2/pages`
3. Check that all plugins are activated and up to date
