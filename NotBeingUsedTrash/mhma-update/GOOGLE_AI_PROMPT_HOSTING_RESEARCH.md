# Google AI Prompt for Hosting Research

## Copy and paste this prompt into Google AI (or ChatGPT/Claude):

---

I need you to research hosting options for a specific web architecture. Please provide detailed, realistic answers.

## My Project Architecture:

**Frontend:**
- Next.js 14.2.0 (React framework)
- TypeScript
- TailwindCSS
- Currently runs locally on localhost:3000
- Fetches data from WordPress backend via REST API
- Uses JWT authentication stored in localStorage

**Backend:**
- WordPress CMS (full WordPress, not WordPress.com)
- MySQL database
- PHP 8.x
- Plugins: JWT Authentication for WP REST API, Advanced Custom Fields (ACF)
- REST API at /wp-json
- Admin panel at /wp-admin
- Currently runs on LocalWP (localhost)

**Connection:**
- Frontend calls WordPress REST API
- Environment variable: NEXT_PUBLIC_WORDPRESS_API_URL
- JWT token in Authorization header for authenticated requests
- CORS enabled for cross-origin requests

## My Questions:

### 1. Oracle Cloud Free Tier - Can this host my WordPress backend?

Specifically:
- Can Oracle Cloud Always Free tier run full WordPress with MySQL?
- Does it support PHP 8.x?
- Can I install custom plugins (JWT, ACF)?
- Does it provide public IP address for REST API access?
- What are the EXACT limitations of the Always Free tier?
- What happens if the instance is idle for 7 days? Can I prevent this?
- Is there a bandwidth limit?
- Is there a storage limit beyond the 200GB block volume?
- Will Oracle charge me anything if I stay within free limits?
- Is there a catch or hidden cost?
- How long does the "Always Free" actually last? Is it truly permanent?
- is there a way to connect wordpress to it? so that if i add or edit something on the front end dashboard with programs or anything that i can see the changes in the wordpress if hosted on oracle cloud?

### 2. Vercel - Can this host my Next.js frontend?

Specifically:
- Is Vercel free for Next.js applications?
- Does Vercel support environment variables?
- Can Vercel make API calls to an external WordPress backend?
- Are there any limitations on API calls from Vercel?
- Does Vercel support CORS for external API calls?
- What are the EXACT limitations of Vercel free tier?
- Is there a bandwidth limit?
- Is there a limit on build time or deployments?
- Will Vercel charge me anything if I stay within free limits?
- Is there a catch or hidden cost?

### 3. Combined Architecture - Oracle Cloud + Vercel

If I use:
- Oracle Cloud Free Tier for WordPress backend
- Vercel Free for Next.js frontend

Will this work? Specifically:
- Can Vercel frontend call Oracle Cloud WordPress REST API?
- Will CORS be an issue? How to handle it?
- Will JWT authentication work across domains?
- Are there any security concerns?
- Is this a common/valid architecture?
- What are the potential issues?

### 4. Alternative Free Hosting Options

Are there ANY other hosting options that can support:
- Full WordPress with MySQL and PHP
- Custom plugin installation (JWT, ACF)
- REST API access
- Public IP/domain
- Image uploads via media library
- $0/month truly free (not trial)

If no free options exist:
- What is the CHEAPEST paid option that meets all requirements?
- What is the monthly cost?
- Are there any hidden costs?

### 5. Oracle Cloud Specifics

Please provide:
- Step-by-step: How to create Oracle Cloud Free Tier account
- Step-by-step: How to launch Ubuntu VM on free tier
- Step-by-step: How to install WordPress on Oracle Cloud
- How to configure security rules for HTTP/HTTPS/SSH
- How to prevent idle instance reclamation
- How to set up custom domain (optional)
- How to set up SSL/HTTPS (optional)
- How to migrate WordPress from LocalWP to Oracle Cloud

### 6. Vercel Specifics

Please provide:
- Step-by-step: How to deploy Next.js to Vercel
- How to set environment variables in Vercel
- How to configure build settings
- How to connect custom domain (optional)

### 7. Comparison

Please compare:
- Oracle Cloud Free Tier vs Cheap Paid Hosting (IONOS, Hostinger, etc.)
- Vercel Free vs Other Next.js hosting (Netlify, etc.)
- Total cost: Oracle Cloud + Vercel vs Paid hosting for both
- Ease of setup
- Reliability
- Performance
- Scalability

## Important Context:

- I have NO budget/income, so truly free is preferred
- If free is impossible, I need the cheapest option that works
- I'm currently using LocalWP for development
- I need the site to be publicly accessible
- I need the WordPress admin panel to work
- I need JWT authentication to work
- I need ACF custom fields to work
- I need image uploads to work
- I need the REST API to be accessible from the frontend

## What I Need From You:

1. Be HONEST about limitations and catches
2. Be SPECIFIC about exact limits (storage, bandwidth, etc.)
3. Be REALISTIC about whether this is sustainable long-term
4. Provide step-by-step instructions where applicable
5. If something won't work, tell me clearly WHY
6. If there's a better approach, suggest it
7. Don't suggest options that don't meet my requirements
8. Focus on FREE options first, then cheapest paid options

Please be thorough and provide specific, actionable information. Don't give generic advice. I need to know EXACTLY what will work and what won't.

---
