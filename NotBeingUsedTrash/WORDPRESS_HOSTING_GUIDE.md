# WordPress Hosting Guide

## Current Setup
- **LocalWP**: You're currently using LocalWP for local development
- **Live Link**: `https://different-leaf.localsite.io` (temporary tunnel)
- **Issue**: Live Link stops working when your computer is closed (404 error)

## What is LocalWP?
LocalWP is a **local development environment** for WordPress. It's designed for:
- Building and testing WordPress sites locally
- Development work before going live
- NOT for production hosting

The "Open Live Link" feature creates a temporary tunnel to share your local site with others, but:
- It requires your computer to be ON
- It's not meant for long-term hosting
- It's slow and unreliable for production use

## How is mhma.us Hosted?
mhma.us is likely hosted on a **production web hosting provider**, such as:
- Shared hosting (Bluehost, SiteGround, HostGator)
- Managed WordPress hosting (WP Engine, Kinsta, Flywheel)
- VPS hosting (DigitalOcean, Linode, AWS)

These providers:
- Keep your site online 24/7
- Have fast, reliable servers
- Provide domain name registration
- Handle backups, security, and updates

## WordPress Hosting Options

### 1. Shared Hosting (Cheapest)
**Providers**: Bluehost, SiteGround, HostGator, Namecheap
**Cost**: $3-10/month
**Pros**:
- Very affordable
- Easy to set up
- Good for small sites
- One-click WordPress installation
**Cons**:
- Shared resources with other sites
- Limited performance
- Less control over server
- Can be slow with high traffic

**Recommended for**: Small personal sites, beginners

### 2. Managed WordPress Hosting (Best for WordPress)
**Providers**: WP Engine, Kinsta, Flywheel, Liquid Web
**Cost**: $25-500+/month
**Pros**:
- Optimized specifically for WordPress
- Automatic updates and backups
- Excellent security
- Fast performance
- Great support
**Cons**:
- More expensive
- Limited to WordPress only
- Less control over server settings

**Recommended for**: Business sites, serious WordPress projects

### 3. VPS Hosting (More Control)
**Providers**: DigitalOcean, Linode, AWS, Google Cloud
**Cost**: $5-100+/month
**Pros**:
- Full control over server
- Better performance than shared
- Scalable
- Can host multiple sites
**Cons**:
- Requires technical knowledge
- You manage server maintenance
- Need to set up WordPress manually
- No built-in backups/security

**Recommended for**: Developers, tech-savvy users

### 4. Free Hosting (Limited)
**Providers**: WordPress.com (free tier), 000webhost, InfinityFree
**Cost**: Free
**Pros**:
- No cost
- Easy to start
**Cons**:
- Very limited features
- Forced ads
- Poor performance
- No custom domain (usually)
- Limited storage/bandwidth
- No support

**Recommended for**: Testing only, not for serious sites

## How to Migrate from LocalWP to Production

### Option 1: Use a Migration Plugin (Easiest)
1. Install a migration plugin in LocalWP (e.g., All-in-One WP Migration, Duplicator)
2. Export your site from LocalWP
3. Set up hosting account and install WordPress
4. Import the site to production
5. Update domain settings

### Option 2: Manual Migration
1. Export database from LocalWP
2. Copy all WordPress files
3. Create database on production hosting
4. Import database to production
5. Upload files to production
6. Update wp-config.php with production database credentials
7. Update site URLs in database
8. Configure permalinks

### Option 3: Use a Hosting Provider's Migration Service
Many hosting providers (especially managed WordPress hosts) offer free migration services. You just provide them access and they handle everything.

## Recommended Next Steps

### For Immediate Testing (Temporary)
- Keep using LocalWP Live Link for testing with others
- Remember it requires your computer to be on
- Not suitable for long-term use

### For Production Launch (Long-term)
1. **Choose a hosting provider** based on your needs:
   - Budget: Shared hosting (SiteGround, Bluehost)
   - Performance/Budget balance: Managed WordPress (Kinsta, WP Engine)
   - Technical control: VPS (DigitalOcean)

2. **Purchase a domain name** if you don't have one already
   - You can use mhma.us if you own it
   - Or register a new domain

3. **Set up hosting account** with your chosen provider

4. **Migrate your site** from LocalWP to production
   - Use a migration plugin (easiest)
   - Or use the hosting provider's migration service

5. **Test the production site** thoroughly
   - Check all pages and functionality
   - Test forms and user interactions
   - Verify images and media

6. **Update DNS** to point your domain to the new hosting

## Cost Estimates

### Shared Hosting
- **SiteGround**: $3.99/month (StartUp plan)
- **Bluehost**: $2.95/month (Basic plan)
- **HostGator**: $2.75/month (Hatchling plan)

### Managed WordPress Hosting
- **Kinsta**: $35/month (Starter plan)
- **WP Engine**: $25/month (Startup plan)
- **Flywheel**: $23/month (Tiny plan)

### VPS Hosting
- **DigitalOcean**: $5/month (Basic droplet)
- **Linode**: $5/month (Nanode)
- **AWS**: Variable (can be $5-50+/month)

## Important Notes

1. **LocalWP is for development only** - never use it for production
2. **Always back up** before migrating
3. **Test thoroughly** after migration
4. **Update DNS** only after confirming site works on production
5. **Keep LocalWP copy** for future development work

## Getting Help

If you need help with migration:
- Most hosting providers offer support
- WordPress.org forums have migration guides
- Consider hiring a WordPress developer if unsure

## Free Trial Options

Many hosting providers offer free trials:
- SiteGround: 30-day money-back guarantee
- WP Engine: Free trial for some plans
- DigitalOcean: Free credits for new users
- Kinsta: Free trial available

Check each provider's website for current offers.
