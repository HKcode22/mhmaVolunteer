#!/bin/bash
# Deploy React App to WordPress
# Usage: ./deploy.sh "/path/to/your/wordpress/site"

WORDPRESS_PATH="${1:-}"

if [ -z "$WORDPRESS_PATH" ]; then
    echo "❌ Error: Please provide your WordPress path"
    echo ""
    echo "Usage: ./deploy.sh \"/path/to/wordpress\""
    echo ""
    echo "Examples:"
    echo "  Local by Flywheel: ./deploy.sh \"~/Local Sites/mhma-update/app/public\""
    echo "  MAMP: ./deploy.sh \"/Applications/MAMP/htdocs/mhma-update\""
    echo "  Custom: ./deploy.sh \"/Users/yourname/Sites/mhma-update\""
    exit 1
fi

# Get the script's directory (where this file is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_PATH="$PROJECT_ROOT/dist"

echo "🚀 Deploying React app to WordPress..."
echo "   WordPress path: $WORDPRESS_PATH"
echo "   Dist path: $DIST_PATH"

# Check if WordPress path exists
if [ ! -d "$WORDPRESS_PATH" ]; then
    echo "❌ Error: WordPress path does not exist: $WORDPRESS_PATH"
    exit 1
fi

# Check if dist folder exists
if [ ! -d "$DIST_PATH" ]; then
    echo "❌ Error: Build not found. Please run 'npm run build' first"
    exit 1
fi

# Create react-app folder in WordPress
echo "📁 Creating react-app folder..."
mkdir -p "$WORDPRESS_PATH/react-app"

# Copy all dist files to WordPress
echo "📦 Copying React build files..."
cp -R "$DIST_PATH/"* "$WORDPRESS_PATH/react-app/"

# Backup original index.php
echo "💾 Backing up original index.php..."
if [ -f "$WORDPRESS_PATH/index.php" ]; then
    cp "$WORDPRESS_PATH/index.php" "$WORDPRESS_PATH/index.php.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy new index.php
echo "🔄 Installing React frontend bridge..."
cp "$SCRIPT_DIR/index.php" "$WORDPRESS_PATH/index.php"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Your WordPress URLs:"
echo "   Frontend (React): http://mhma-update.local"
echo ""
