# Oracle Cloud Free Tier WordPress Setup Guide

## Overview
This guide walks you through setting up WordPress on Oracle Cloud Free Tier to replace your LocalWP setup. Your Next.js code changes will be minimal - just change the API URL.

## What You Get (Always Free)
- **2 AMD VMs** (VM.Standard.E2.1.Micro) - 1/8 OCPU, 1GB RAM each
- **200 GB storage** (block volumes)
- **Full WordPress + MySQL support**
- **Never expires** (as long as you use it regularly)

## Prerequisites
- Credit card (for verification only, not charged)
- Basic SSH knowledge
- 1-2 hours for setup

## Step 1: Create Oracle Cloud Account

1. Go to https://www.oracle.com/cloud/free/
2. Click "Try for Free"
3. Create account with email
4. Add credit card (verification only, $0 charge)
5. Verify email and phone

## Step 2: Create Compute Instance

1. Login to Oracle Cloud Console
2. Go to **Compute** → **Instances**
3. Click **Create Instance**
4. Configure:
   - **Name:** mhma-wordpress
   - **Compartment:** (use default or create one)
   - **Shape:** VM.Standard.E2.1.Micro (Always Free)
   - **Operating System:** Ubuntu 22.04 or 24.04
   - **SSH Key:** Create or upload your SSH public key
     - If you don't have one: `ssh-keygen -t rsa -b 4096` on your Mac
     - Copy contents of `~/.ssh/id_rsa.pub`
5. Click **Create**

## Step 3: Configure Network (Enable Internet Access)

1. After instance is created, click on it
2. Go to **Networking** → **Virtual Cloud Network**
3. Click on the VCN name
4. Go to **Security Lists**
5. Click **Default Security List**
6. Add Ingress Rules:
   - **Port 80 (HTTP):** Source: 0.0.0.0/0
   - **Port 443 (HTTPS):** Source: 0.0.0.0/0
   - **Port 22 (SSH):** Source: 0.0.0.0/0 (or restrict to your IP)

## Step 4: SSH into the Instance

```bash
ssh -i ~/.ssh/id_rsa ubuntu@<YOUR_PUBLIC_IP>
```

Replace `<YOUR_PUBLIC_IP>` with your instance's public IP (shown in Oracle Console).

## Step 5: Install Apache, PHP, MySQL

Run these commands one by one:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Apache
sudo apt install apache2 -y
sudo systemctl start apache2
sudo systemctl enable apache2

# Install PHP 8 and extensions
sudo apt install php8.1 php8.1-mysql php8.1-curl php8.1-gd php8.1-mbstring php8.1-xml php8.1-zip php8.1-xmlrpc -y

# Install MySQL
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL (set root password)
sudo mysql_secure_installation
# Follow prompts, set a strong root password
```

## Step 6: Configure MySQL for WordPress

```bash
# Log into MySQL
sudo mysql -u root -p
# Enter your root password

# Run these SQL commands:
CREATE DATABASE wordpress;
CREATE USER 'wordpressuser'@'localhost' IDENTIFIED BY 'strongpasswordhere';
GRANT ALL PRIVILEGES ON wordpress.* TO 'wordpressuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 7: Download and Install WordPress

```bash
# Download WordPress
cd /tmp
wget https://wordpress.org/latest.tar.gz
tar -xvzf latest.tar.gz

# Move to web directory
sudo mv wordpress/* /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

## Step 8: Configure WordPress

```bash
# Create wp-config.php
cd /var/www/html/
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php
```

Edit these lines:
```php
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', 'wordpressuser' );
define( 'DB_PASSWORD', 'strongpasswordhere' );
define( 'DB_HOST', 'localhost' );
```

Save and exit (Ctrl+X, Y, Enter).

## Step 9: Complete WordPress Setup in Browser

1. Open browser: `http://<YOUR_PUBLIC_IP>`
2. Select language
3. Enter site details:
   - Site Title: MHMA
   - Username: admin
   - Password: (create strong password)
   - Email: your email
4. Click "Install WordPress"
5. Login with your credentials

## Step 10: Install Required Plugins

1. Go to **Plugins** → **Add New**
2. Install these plugins:
   - **JWT Authentication for WP REST API**
   - **Advanced Custom Fields (ACF)**
3. Activate all plugins

## Step 11: Configure JWT Plugin

```bash
# SSH back into server
ssh -i ~/.ssh/id_rsa ubuntu@<YOUR_PUBLIC_IP>

# Edit wp-config.php
sudo nano /var/www/html/wp-config.php
```

Add this line BEFORE "That's all, stop editing!":
```php
define('JWT_AUTH_SECRET_KEY', 'your-top-secret-key');
define('JWT_AUTH_CORS_ENABLE', true);
```

Generate a secret key here: https://api.wordpress.org/secret-key/1.1/salt/

Save and exit.

## Step 12: Import Your LocalWP Content

**Option A: Export from LocalWP and Import to Oracle Cloud**

1. In LocalWP: **Tools** → **Export** → **All content**
2. Download the XML file
3. In Oracle Cloud WordPress: **Tools** → **Import** → **WordPress**
4. Upload the XML file
5. Install and activate All-in-One WP Migration plugin for full migration

**Option B: Use All-in-One WP Migration (Recommended)**

1. Install All-in-One WP Migration plugin on both LocalWP and Oracle Cloud
2. In LocalWP: Export to file
3. In Oracle Cloud: Import from file

## Step 13: Update Next.js Configuration

1. Open your Next.js project
2. Edit `.env.local`:
   ```
   NEXT_PUBLIC_WORDPRESS_API_URL=http://<YOUR_PUBLIC_IP>/wp-json
   ```
3. Rebuild: `npm run build`
4. Restart server

## Step 14: Test

1. Visit http://localhost:3000/programs
2. Check if Arabic Academy shows WordPress data
3. Try updating content in WordPress admin
4. Verify changes appear on Next.js frontend

## Optional: Set Up Custom Domain

If you have a domain (e.g., mhma.us):

1. In Oracle Console, go to **Networking** → **DNS**
2. Create a zone for your domain
3. Add A record pointing to your instance IP
4. Update domain nameservers to Oracle's nameservers
5. Install SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-apache -y
   sudo certbot --apache -d yourdomain.com
   ```

## Troubleshooting

**Can't connect to instance:**
- Check security list rules (Step 3)
- Verify SSH key is correct
- Check instance is running

**WordPress not loading:**
- Check Apache is running: `sudo systemctl status apache2`
- Check error logs: `sudo tail -f /var/log/apache2/error.log`

**Database connection error:**
- Verify MySQL is running: `sudo systemctl status mysql`
- Check wp-config.php credentials
- Test MySQL connection: `mysql -u wordpressuser -p wordpress`

**JWT not working:**
- Verify JWT_AUTH_SECRET_KEY is set in wp-config.php
- Check .htaccess file has correct rewrite rules
- Test API: `http://<YOUR_IP>/wp-json/jwt-auth/v1/token`

## Maintenance

**Keep instance active (Oracle reclaims idle instances):**
- Set up a simple cron job to ping your site daily:
  ```bash
  crontab -e
  # Add this line:
  0 * * * * curl http://localhost > /dev/null 2>&1
  ```

**Backup:**
- Install UpdraftPlus plugin for automated backups
- Or use Oracle Cloud snapshots

## Cost

**$0/month** (Always Free tier)
- Credit card required for verification only
- Not charged unless you exceed free limits
- You get 200 GB storage, 2 VMs

## Alternative: Cheap Paid Hosting

If this setup is too complex:

- **IONOS:** $1/month first year
- **Hostinger:** ~$2-3/month long-term
- Both have one-click WordPress installation
- Minimal code changes (just change API URL)

## Summary

**Time:** 1-2 hours initial setup
**Cost:** $0/month
**Code changes:** Just change `NEXT_PUBLIC_WORDPRESS_API_URL`
**Result:** Full WordPress backend accessible from your Next.js frontend
