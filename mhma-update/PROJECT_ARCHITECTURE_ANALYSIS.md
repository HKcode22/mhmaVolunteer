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

Skip to main content
Free Tier account
You are in a Free Trial. When your trial is over, your account is limited to Always Free resources. Upgrade at any time.
Learn more

Messages region has new messages. Press F6 to navigate.
Search resources, services, documentation, and Marketplace
Home
Home
Tenancy:hk84164
Normal performance
View service health
Customize

Resources

Resource Explorer
US West (San Jose)
View all Resources
Name
Type
Status
Viewed

mhma-wordpress
Instance
Running
3 hours ago
mhma-vcn
Vcn
Available
14 days ago
public subnet-mhma-vcn
Subnet
Available
14 days ago
ig-quick-action-NSG
NetworkSecurityGroup
Available
15 days ago
ig-quick-action-NSG
NetworkSecurityGroup
Available
15 days ago
default route table for mhma-vcn
RouteTable
Available
15 days ago
Default Security List for mhma-vcn
SecurityList
Available
15 days ago
7 results shown.
Build

Compute
Create a VM instance
2-6 mins
Autonomous AI Transaction Processing
Create an ATP database
3-5 mins
Autonomous AI Lakehouse
Create an LH database
3-5 mins
Networking
Set up a network with a wizard
2-3 mins
Show all
Services

Pinned
InstancesCompute
Virtual cloud networksNetworking
Recently visited
Block VolumesBlock Storage
Limits, quotas and usageTenancy Management
Service spotlight

Customize the recommendations by choosing a profile.Update
Account Management
Tenancy Details
View information about your tenancy and configure settings
Oracle AI Database
Autonomous AI Database
Simplify operation of all workloads with a fully Autonomous AI Database that performs all routine database maintenance tasks while the system is running, without human intervention
Object Storage & Archive Storage
Buckets
Securely store any type of data in its native format. Upload your data as objects that are stored in buckets
What's new
Release notes
Apr 14, 2026
Additional log support for OCI Logging Service
Apr 14, 2026
Provision an Autonomous Container Database with 19c or 26ai database software version in the same Autonomous Exadata VM Cluster
Apr 14, 2026
Availability of new Dynamic Performance Views on Oracle Autonomous AI Database on Dedicated Exadata Infrastructure
Stay ahead of unexpected cloud costs
Introducing OCI Cost Anomaly Detection, a no-cost service that proactively identifies unexpected spending trends to help you minimize impact and speed up investigations.
Start monitoring

Release notes
OCI blog
Getting started

Customize the recommendations by choosing a profile.Update
Documentation
Best Practices for Setting Up Your Tenancy
Hands-on Workshop
OCI Fast Track
Documentation
Welcome to Oracle Cloud Infrastructure
OCI documentation
Learn

Customize the recommendations by choosing a profile.Update
Hands-on Workshop
Get Started with Oracle Cloud Infrastructure Core Services
Tutorial
Use Oracle Cloud Infrastructure to Publish a Webserver Accessible from the Internet with IPv6
Training & Certification
OCI Foundations
OCI Training and certification
Quickstarts

Application Development
Deploy a WordPress website
10-12 mins
Architecture
Deploy the OCI Core Landing Zone
15-20 mins
Application Development
Deploy a low-code app on Autonomous AI Database using APEX
3-5 mins
Application Development
Deploy RStudio in a container
10-12 mins
Show all
View my deployments
Cost analysis

Alarms

Applied filters
Compartment
hk84164 (root)
There are no alarms in this compartment. Change compartment or create alarms to monitor your infrastructure and take action.
Create alarm
Announcements

Announcements
All unread
1
Scheduled maintenance
Upcoming actions
0
Actions
Required actions
0
Other
Informational
1
Announcements
User Management

Identity
Create user
Identity
Create group
Security
Configure multifactor authentication
Logging
Audit events
Identity
AI Accelerator Packs

Agentic AI
Enterprise Agentic AI Starter Kit
Full-stack agentic AI environment on OCI powered by NVIDIA AIQ. Deploys reasoning models, vector DB, observability, application layer, and more in minutes. Customize and extend to build your own agentic workflows.
Operations & Logistics
Vehicle Delivery Route Optimizer
GPU-accelerated fleet route optimization on OCI using NVIDIA cuOpt NIM—deploy in minutes and get a ready API endpoint to cut miles, time, and cost.
Media & Content
Video Search and Summarization
OCI accelerator pack for AI video moderation: ingest video, index scenes, then search/summarize to flag nudity, violence, weapons, drugs, alcohol—no more manual review.
Show all
View my deployments
Experience previews
New
Explore new Oracle Cloud Console experiences ahead of their general availability and provide early feedback.
Opt in to experience previews
Marketplace
Access the one-stop-shop for quickly and securely deploying any Oracle or 3rd party application, including Oracle E-Business Suite, Cisco, Palo Alto Networks, Sesame Software, and more.
Visit the Marketplace
Beta program
Sign up to participate in the Oracle Beta program and you'll get access to test product features before they are released and can help improve them for everyone.
Join Oracle Beta Program
Terms of Use and PrivacyCookie Preferences
Copyright © 2026, Oracle and/or its affiliates. All rights reserved.
Give us feedback
Compute

Compute
Overview
Instances
Instance Maintenance
Dedicated Virtual Machine Hosts
Instance Configurations
Instance Pools
Cluster Networks
Compute Clusters
Autoscaling Configurations
Capacity Reservations
Custom Images


Instances
mhma-wordpress
Running
Instance details

Actions
Start
General information
Availability domain
AD-1
Fault domain
FD-3
Region
us-sanjose-1
OCID
ocid1.instance.oc1.us-sanjose-1.anzwuljra23lb2qcfbslkbdir47ii6xeeyvcr33qzwjmrtw5gdqlvpam6daa
Copy
Launched
Apr 19, 2026, 09:57:02 UTC
Compartment
hk84164 (root)
Capacity type
On-demand
Instance access
You connect to a running Linux instance using a Secure Shell (SSH) connection. You'll need the private key from the SSH key pair that was used to create the instance.
Public IP address
167.234.220.121
Copy
Username
ubuntu
Instance details
Virtual cloud network
mhma-vcn
Maintenance reboot
Launch mode
PARAVIRTUALIZED
Instance metadata service
Version 2 only
The instance metadata service provides metadata about the instance. Applications can use this metadata to bootstrap or do other tasks.
Edit
Live migration
Use recommended default
Change
Image details
Operating system
Canonical Ubuntu
Version
22.04
Image
Canonical-Ubuntu-22.04-2026.02.28-0
Launch options
NIC attachment type
PARAVIRTUALIZED
Remote data volume
PARAVIRTUALIZED
Firmware
UEFI_64
Boot volume type
PARAVIRTUALIZED
In-transit encryption
Enabled
Secure Boot
Disabled
Measured Boot
Disabled
Trusted Platform Module
Disabled
Shape configuration
Shape
VM.Standard.E2.1.Micro
This shape does not support resizing. Learn more
OCPU count
1
Network bandwidth (Gbps)
0.5
Memory (GB)
1
Local disk
Block storage only
Disaster recovery
The list of Disaster Recovery Protection Groups that have this instance as a member. This list may be incomplete due to insufficient policy permissions access to a group or groups.
Full stack DR
Not enabled
Activate QuickDR
