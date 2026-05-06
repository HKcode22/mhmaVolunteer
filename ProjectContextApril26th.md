# MHMA Project Context
**Date:** April 26, 2026

## Project Overview
Modernizing Mountain House Muslim Association website using Next.js frontend with WordPress backend.

## Directory Structure
- `/mhma-update/` - Next.js frontend (React/TypeScript)
- `/mhma.us/` - Original WordPress site (separate, for reference)
- Both folders are independent; no direct file sharing

## Architecture
**Backend:** WordPress (localhost: http://mhma-update.local)
- REST API for data fetching
- ACF (Advanced Custom Fields) for custom data
- JWT authentication for dashboard access
- Pages as parent-child relationships (events are children of homepage ID 152)

**Frontend:** Next.js 14
- App Router
- Server components for data fetching
- Client components for interactivity
- TailwindCSS for styling
- Lucide icons

## Key Integrations
**WordPress REST API:**
- `lib/wordpress.ts` - Fetch functions (fetchEvents, fetchMHMAManagement, etc.)
- POST for creating/updating pages
- Media upload for images
- ACF fields: event_poster, event_date, event_time, event_location, event_rsvp_link, event_description, event_name

**Oracle Cloud Infrastructure:**
- Hosting environment 

## Completed Features
1. **Homepage** - Event carousel with poster/info layout, date/time formatting
2. **Dashboard** - Board member authentication, program/event management
3. **Event Management** - Create/edit events with image upload, ACF field updates
4. **Journal** - Static meeting minutes pages (14 entries with full content)
5. **Navigation** - Responsive menu with dropdowns

## Current Theme
- Primary color: #c9a227 (gold/amber)
- Secondary: #1a1a1a (dark)
- Background: gray-50
- Modern, clean design

## Important Notes
- Event edits now use page title (not event_name) for display consistency
- Cache-busting implemented in fetchEvents
- Dashboard uses JWT tokens stored in localStorage
- Images uploaded via WordPress media API, resolved from media IDs to URLs

## Terminal Access
WordPress backend accessible via terminal commands for administrative tasks.

## Next Steps (Future)
- Make Journal dynamic (board members can add meeting minutes)
- Oracle Cloud deployment
