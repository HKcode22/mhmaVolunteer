# MHMA Volunteer Project Context

## Project Overview
- **Project Name**: MHMA Volunteer
- **Tech Stack**: Next.js 14.2 (app directory), React, TypeScript, Tailwind CSS
- **WordPress API (Local)**: Local WordPress site at `http://mhma-update.local/wp-json`
- **WordPress API (Production)**: Oracle Cloud at `https://my-wp-backend.duckdns.org/wp-json`
- **WordPress Hosting (Production)**: Oracle Cloud Free Tier (Ubuntu 22.04, 1 OCPU, 1GB RAM)
  - **Oracle IP**: 167.234.220.121
  - **Oracle Username**: ubuntu
  - **DuckDNS**: my-wp-backend.duckdns.org
  - **WordPress Username**: hkcode22
  - **Oracle Cloud Login**: hk84164@gmail.com
- **WordPress Hosting (Local)**: LocalWP (Local app) at `/Users/hk/Local Sites/mhma-update/`
- **Authentication**: JWT authentication with token stored in localStorage as `jwt_token`
- **Frontend (Vercel)**: https://mhma-update.vercel.app
- **GitHub Repo**: https://github.com/HKcode22/mhmaVolunteer

## Project Structure
```
/Users/hk/Downloads/mhmaV4/mhma-update/
├── app/
│   ├── dashboard/          # Admin dashboard for managing programs/events
│   ├── programs/           # Program listing and detail pages
│   ├── committees/         # Committee pages
│   └── components/         # Shared React components
└── public/                 # Static assets
```

## Key Files
- `/app/dashboard/page.tsx` - Main dashboard listing programs with edit/delete links
- `/app/dashboard/programs/new/page.tsx` - Create new programs
- `/app/dashboard/programs/edit/page.tsx` - Edit existing programs
- `/app/programs/[slug]/page.tsx` - Dynamic program detail page
- `/app/programs/page.tsx` - Program listing page
- `/components/Navigation.tsx` - Shared navigation component

## WordPress ACF Fields for Programs
The following ACF fields are used for programs:

### Program ACF Fields
- `program_title` - String: Title of the program
- `program_description` - String/WYSIWYG: Description of the program
- `program_image` - Image/Media ID: Main program image (front face)
- `program_image_poster` - Image/Media ID: Optional poster image (secondary image)
- `stat_1_label` - String: Label for first stat (e.g., "Students")
- `stat_1_value` - String: Value for first stat
- `stat_2_label` - String: Label for second stat (e.g., "Days/Week")
- `stat_2_value` - String: Value for second stat
- `stat_3_label` - String: Label for third stat
- `stat_3_value` - String: Value for third stat
- `stat_4_label` - String: Label for fourth stat
- `stat_4_value` - String: Value for fourth stat
- `additional_content` - String/WYSIWYG: Additional content for the program

## Important Notes
- **Delete Programs**: Use `?force=true` parameter in DELETE requests to permanently delete (otherwise goes to trash)
- **Image Handling**: ACF image fields store media IDs (integers), need to fetch media URL via `/wp/v2/media/{id}`
  - **Oracle Micro Instance (1GB RAM)**: Large image uploads can cause MySQL to crash due to low memory
  - Compress images before upload (recommend <500KB)
  - If backend returns "Error establishing database connection", SSH and run: `sudo systemctl restart mysql`
- **Authentication**: JWT token required for all dashboard operations, stored in localStorage
- **Production WordPress (Oracle Cloud)**:
  - **Instance**: mhma-wordpress (VM.Standard.E2.1.Micro)
  - **Region**: us-sanjose-1, AD-1, FD-3
  - **Access**: SSH as ubuntu@167.234.220.121
  - **Common Issue**: Database connection errors - run `sudo systemctl restart mysql` via SSH
  - **Check Status**: `curl -I https://my-wp-backend.duckdns.org/`
- **Local WordPress Site**: Located at `/Users/hk/Local Sites/mhma-update/` (hosted via LocalWP)
  - **CRITICAL**: This is the ONLY computer where the WordPress site is hosted
  - Access via terminal commands: `cd /Users/hk/Local\ Sites/mhma-update/`
  - Use Local app to start/stop the site
  - MySQL database is managed by LocalWP
  - If blank screen on `http://mhma-update.local/`, start the site in Local app (MySQL might not be running)
- **Terminal Access**: Always use terminal to access LocalWP site at `/Users/hk/Local Sites/mhma-update/`

## Completed Tasks
1. **Navigation Refactoring**: Replaced hardcoded navigation with shared `Navigation` component on all committee subpages and zakat page
2. **Program Delete Fix**: Added `?force=true` parameter to DELETE requests to permanently delete programs
3. **Program Image Poster**: Added `program_image_poster` ACF field to program creation/editing forms
4. **Program Display Update**: Updated dynamic program page to display poster image in the middle of content area
5. **Stats Display**: Updated dynamic program page to display all 4 stats (stat_1 through stat_4)

## Pending Tasks
1. **Arabic Academy Revert Option**: Add option to revert Arabic Academy page back to hardcoded version when edited via dashboard
2. **Programs Page Arabic Academy Sync**: Fix programs page to show Arabic Academy title/image changes (currently only showing on Arabic Academy specific page)
3. **Events Section**: Work on events section functionality (create, edit, delete events similar to programs)
4. **Database Connection**: Ensure MySQL is running when accessing `http://mhma-update.local/`

## Common Tasks
1. **Adding a new ACF field**: Add to FormData interface, form UI, and API submission
2. **Updating program display**: Modify `/app/programs/[slug]/page.tsx` to render new field
3. **Fixing delete issues**: Ensure DELETE requests include `?force=true`
4. **Debugging**: Check browser console and WordPress debug logs at `/Users/hk/Local Sites/mhma-update/app/public/wp-content/debug.log`

## Navigation Component
- Use `<Navigation currentPage="..." />` on all pages for consistent navigation
- Current page prop: "home", "programs", "mhma", "committees", etc.
- Handles login/logout state from localStorage
- Mobile menu and dropdowns built-in

## Hardcoded Programs
Some programs have hardcoded pages that cannot be edited via dashboard:
- Arabic Academy (`/programs/arabic-academy`)
- Maktab Program (`/programs/maktab-program`)
- These are in `/app/programs/[slug]/` directory as static pages

## JWT Authentication Configuration
- Secret key: `mhma-jwt-secret-key-2024-local-development`
- CORS enabled
- Token endpoint: `/wp-json/jwt-auth/v1/token`
