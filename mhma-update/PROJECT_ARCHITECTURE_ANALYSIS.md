# MHMA Project Architecture Analysis

## Project Overview
MHMA (Mountain House Muslim Association) website is a dual-architecture application consisting of:
- **Frontend:** Next.js (React) application - displays programs, events, committees, donations
- **Backend:** WordPress CMS - provides content management system, admin panel, data storage
- **Connection:** REST API with JWT authentication

## Backend Engine: WordPress CMS

### WordPress Installation
- **Local Development:** LocalWP (http://mhma-update.local)
- **Production Target:** Oracle Cloud Free Tier (Ubuntu VM with WordPress)
- **Database:** MySQL (stores all content, user data, ACF fields)
- **PHP Version:** 8.x
- **WordPress Version:** Latest

### WordPress Admin Panel
- **URL:** http://mhma-update.local/wp-admin
- **Purpose:** Content management interface
- **Capabilities:**
  - Create/edit/delete programs
  - Create/edit/delete events
  - Upload images to media library
  - Manage users and permissions
  - Configure plugins and themes

### Key WordPress Plugins

#### 1. JWT Authentication for WP REST API
- **Purpose:** Authenticate API requests between Next.js and WordPress
- **How it works:**
  - Generates JWT tokens when users log in
  - Tokens stored in localStorage (key: `jwt_token`)
  - Tokens sent in Authorization header for protected API calls
  - Tokens validate user permissions for CRUD operations
- **Configuration:**
  - Requires `JWT_AUTH_SECRET_KEY` in wp-config.php
  - CORS enabled for cross-origin requests
- **API Endpoints:**
  - `/wp-json/jwt-auth/v1/token` - Login, receive JWT
  - `/wp-json/jwt-auth/v1/token/validate` - Validate token

#### 2. Advanced Custom Fields (ACF)
- **Purpose:** Add custom fields to WordPress pages/posts
- **Custom Fields for Programs:**
  - `program_title` - Program display title
  - `program_description` - Program description
  - `program_content` - Full content (with HTML)
  - `program_image` - Featured image (media ID or URL)
  - `stat1_label`, `stat1_value` - Custom statistics
  - `stat2_label`, `stat2_value` - Custom statistics
  - `stat3_label`, `stat3_value` - Custom statistics
  - `use_hardcoded_version` - Toggle to use hardcoded data instead of WordPress
- **Custom Fields for Events:**
  - `event_poster` - Event poster image (media ID or URL)
  - `event_date` - Event date (YYYYMMDD format)
  - `event_time` - Event time (24-hour format HH:MM or HH:MM:SS)
  - `event_location` - Event location
  - `event_rsvp_link` - RSVP URL
  - `event_description` - Event description
  - `event_name` - Event name (note: frontend uses page title for display consistency)
- **Storage:** ACF fields stored in WordPress database (wp_postmeta table)
- **Access:** Available via REST API in `acf` property of page/post objects

## REST API Architecture

### Base URL
- **Development:** `http://mhma-update.local/wp-json`
- **Production:** Will be Oracle Cloud public IP + `/wp-json`

### Key API Endpoints

#### Authentication
```
POST /wp-json/jwt-auth/v1/token
Body: { username, password }
Response: { token, user_email, user_nicename, user_display_name }
using test as username and 123 as password for authentication
```

#### Programs (Pages)
```
GET /wp-json/wp/v2/pages?per_page=100
Response: Array of page objects with ACF fields

GET /wp-json/wp/v2/pages?slug=arabic-academy
Response: Single page object with ACF fields

POST /wp-json/wp/v2/pages
Headers: Authorization: Bearer <jwt_token>
Body: { title, content, acf: { ... } }
Response: Created page object

PUT /wp-json/wp/v2/pages/<id>
Headers: Authorization: Bearer <jwt_token>
Body: { title, content, acf: { ... } }
Response: Updated page object

DELETE /wp-json/wp/v2/pages/<id>?force=true
Headers: Authorization: Bearer <jwt_token>
Response: Deleted confirmation
```

#### Events (Pages as children of homepage)
```
GET /wp-json/wp/v2/pages?parent=152&per_page=100
Response: Array of event pages (children of homepage ID 152)

POST /wp-json/wp/v2/pages
Headers: Authorization: Bearer <jwt_token>
Body: { title, content, parent: 152, acf: { ... } }
Response: Created event page object

POST /wp-json/wp/v2/pages/<id>
Headers: Authorization: Bearer <jwt_token>
Body: { title, content, acf: { ... } }
Response: Updated event page object
```

#### Media (Image Uploads)
```
POST /wp-json/wp/v2/media
Headers: Authorization: Bearer <jwt_token>, Content-Type: multipart/form-data
Body: FormData with image file
Response: Media object with source_url
```

## Frontend: Next.js Application

### Technology Stack
- **Framework:** Next.js 14.2.0
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Navigation:** Custom Navigation component
- **State Management:** React useState, useEffect

### Key Pages

#### Homepage (`/app/page.tsx`)
- **Purpose:** Main landing page with event carousel
- **Features:**
  - Event carousel with poster/info layout (poster right, info left)
  - Date formatting (YYYYMMDD to MM/DD/YYYY)
  - Time formatting (24-hour to 12-hour with am/pm)
  - RSVP link/button
  - Prayer times display
  - Activities/programs section
- **Data Flow:**
  1. Fetches events from WordPress (children of homepage ID 152)
  2. Resolves media IDs to URLs for event posters
  3. Formats dates and times for display
  4. Uses page title for event name (not event_name ACF field for consistency)

#### Programs Page (`/app/programs/page.tsx`)
- **Purpose:** Display all programs
- **Data Flow:**
  1. Fetches all pages from WordPress API
  2. Maps each hardcoded program to its WordPress counterpart by slug
  3. Checks `use_hardcoded_version` ACF field
  4. If `use_hardcoded_version` is true: displays hardcoded data
  5. If false or not set: displays WordPress data (title, image, stats)
  6. Images fetched from WordPress media API if stored as media ID
- **Debug Logging:** Console logs for Arabic Academy to diagnose data fetching

#### Individual Program Page (`/app/programs/[slug]/page.tsx`)
- **Purpose:** Display single program details
- **Data Flow:**
  1. Fetches page by slug from WordPress API
  2. Displays WordPress data (title, content, ACF fields)
  3. Shows edit button if user is logged in (JWT token exists)
  4. Redirects to dashboard edit page for logged-in users

#### Dashboard (`/app/dashboard/page.tsx`)
- **Purpose:** Admin interface for programs and events
- **Features:**
  - List all programs with edit/delete buttons
  - List all events with edit/delete buttons
  - Create new program/event buttons
  - Protected by JWT authentication
- **Data Flow:**
  1. Checks for JWT token in localStorage
  2. Fetches programs (children of programs parent ID 70) and events (children of homepage ID 152)
  3. Renders lists with action buttons
  4. Delete calls WordPress API with JWT token

#### Dashboard Event Create (`/app/dashboard/events/new/page.tsx`)
- **Purpose:** Create new events
- **Features:**
  - Image upload via WordPress media API
  - Date/time formatting for WordPress ACF
  - Parent set to homepage ID 152
- **Data Flow:**
  1. Uploads image to WordPress media API
  2. Gets media ID
  3. POST to WordPress pages API with parent=152 and ACF fields
  4. Formats date from YYYY-MM-DD to YYYYMMDD

#### Dashboard Event Edit (`/app/dashboard/events/edit/page.tsx`)
- **Purpose:** Edit existing events
- **Features:**
  - Fetches event data by ID
  - Image upload with preview
  - Updates page title and ACF fields
  - Cache-busting for fresh data
- **Data Flow:**
  1. Fetches event by ID from WordPress API
  2. Pre-fills form with WordPress data
  3. On submit: POST to WordPress API with JWT token
  4. Updates ACF fields, title, content
  5. Updates event_name to match title for consistency

#### Dashboard Program Edit (`/app/dashboard/programs/edit/page.tsx`)
- **Purpose:** Edit existing program
- **Data Flow:**
  1. Fetches program by ID from WordPress API
  2. Pre-fills form with WordPress data
  3. On submit: PUT request to WordPress API with JWT token
  4. Updates ACF fields, title, content
  5. Includes `use_hardcoded_version` checkbox

#### Journal (`/app/journal/page.tsx`)
- **Purpose:** Display meeting minutes (static for now)
- **Features:**
  - List of 14 journal entries
  - Pagination UI
  - Individual entry pages with full content
  - Meeting attendees display
- **Data Flow:**
  1. Static data (to be made dynamic later)
  2. Each entry has title, date, content, attendees
  3. Markdown-style formatting for content

#### Journal Entry (`/app/journal/[slug]/page.tsx`)
- **Purpose:** Display single journal entry
- **Features:**
  - Full meeting minutes content
  - Attendees section
  - Back to journal link

#### Login Page (`/app/login/page.tsx`)
- **Purpose:** Authenticate users
- **Data Flow:**
  1. User enters username/password
  2. POST to `/wp-json/jwt-auth/v1/token`
  3. Receive JWT token
  4. Store token in localStorage (`jwt_token`)
  5. Redirect to dashboard

## Data Flow Diagram

```
User (Browser)
    ↓
Next.js Frontend (localhost:3000)
    ↓
REST API Call (with JWT token if authenticated)
    ↓
WordPress Backend (mhma-update.local or Oracle Cloud)
    ↓
MySQL Database
    ↓
Return Data (JSON)
    ↓
Next.js Frontend (renders data)
    ↓
User (Browser)
```

## Authentication Flow

```
User enters credentials
    ↓
Next.js POST /jwt-auth/v1/token
    ↓
WordPress validates credentials
    ↓
WordPress generates JWT token
    ↓
Next.js stores token in localStorage
    ↓
Subsequent API calls include: Authorization: Bearer <token>
    ↓
WordPress validates token
    ↓
WordPress checks user permissions
    ↓
WordPress returns data or performs action
```

## Image Upload Flow

```
User selects image in Next.js form
    ↓
Next.js creates FormData with image file
    ↓
Next.js POST /wp/v2/media with JWT token
    ↓
WordPress saves image to media library
    ↓
WordPress returns media object with source_url
    ↓
Next.js saves source_url to ACF field via PUT /wp/v2/pages/<id>
    ↓
Image now accessible via WordPress media API
```

## Environment Configuration

### .env.local
```
NEXT_PUBLIC_WORDPRESS_API_URL=http://mhma-update.local/wp-json
```

This single environment variable controls all API calls from Next.js to WordPress. Changing this value switches the entire frontend to a different WordPress backend.

## Current Deployment Status

### Development Environment (CURRENT)
- **WordPress Local Path:** `/Users/hk/Local Sites/mhma-update`
- **WordPress URL:** http://mhma-update.local
- **WordPress Admin:** http://mhma-update.local/wp-admin
- **Next.js URL:** http://localhost:3000
- **Working Locally First:** Testing all features locally before production deployment
- **Image Upload Testing:** Easier to test image uploads locally with LocalWP before Oracle Cloud
- **Vercel Status:** Vercel account exists but not currently updating - waiting for local testing to complete

### Frontend (Next.js)
- **Development:** Running locally on localhost:3000
- **Production:** Can be deployed to Vercel (free), Netlify (free), or any Node.js host
- **Build:** `npm run build` creates optimized production build
- **Start:** `npm start` runs production server

### Backend (WordPress)
- **Development:** LocalWP at `/Users/hk/Local Sites/mhma-update`
- **URL:** http://mhma-update.local
- **Production Target:** Oracle Cloud Free Tier (Ubuntu VM)
- **Migration:** Export from LocalWP, import to Oracle Cloud WordPress

## Oracle Cloud Infrastructure (Production Target)

### Setup
- **Platform:** Oracle Cloud Free Tier
- **Instance:** Ubuntu VM (Always Free)
- **WordPress:** Manual installation on Ubuntu
- **Database:** MySQL on same VM
- **Plugins:** JWT Authentication, ACF (same as local)
- **Access:** Public IP with REST API accessible

### Key Points
- Free tier (permanent, no cost)
- Requires SSH access for setup
- WordPress installed via command line
- Same plugins as local environment
- Environment variable change only needed for Next.js to connect

 the user name of the wordpress is hkcode22 and passwrod is Khan2203, for oracle its language
signup.cloud.oracle.com
Username
hk84164@gmail.com
Password
@kGpnA3pV i