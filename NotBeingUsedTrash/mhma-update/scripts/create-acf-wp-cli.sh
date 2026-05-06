#!/bin/bash

# WP-CLI script to create ACF fields for Event Scheduling Request
# This script uses WP-CLI from Local by Flywheel

WP_PATH="/Users/hk/Local Sites/mhma-update"
WP_CLI="/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/wp-cli.phar"

echo "🚀 Creating ACF fields using WP-CLI..."
echo "WordPress path: $WP_PATH"
echo "WP-CLI path: $WP_CLI"
echo ""

# Check if WP-CLI exists
if [ ! -f "$WP_CLI" ]; then
    echo "❌ WP-CLI not found at $WP_CLI"
    exit 1
fi

# Try to create a page first
echo "Creating Event Scheduling Request page..."
cd "$WP_PATH" || exit 1

# Using WP-CLI to create the page
php "$WP_CLI" post create \
  --post_type=page \
  --post_title='Event Scheduling Request' \
  --post_content='' \
  --post_status=publish \
  --post_name='event-scheduling-request' \
  --post_author=1

echo ""
echo "✅ Page created successfully!"
echo ""
echo "⚠️  Note: ACF field groups cannot be created via WP-CLI with the free version of ACF."
echo "You will need to create the ACF fields manually in WordPress admin:"
echo "1. Go to Custom Fields → Add New"
echo "2. Create field group 'Event Scheduling Request'"
echo "3. Add the 22 fields listed in the documentation"
