# Cascade AI Agent Prompt Template

Copy and paste this prompt to Cascade in a new tab with context:

---

I'm working on the MHMA Volunteer project. Here's the context:

## Project Overview
- **Project**: MHMA Volunteer (Next.js 14.2 + WordPress API)
- **Local WordPress Site**: http://mhma-update.local/ (hosted via LocalWP)
- **WordPress Hosting**: LocalWP at `/Users/hk/Local Sites/mhma-update/`
- **WordPress API**: http://mhma-update.local/wp-json
- **Project Path**: /Users/hk/Downloads/mhmaV4/mhma-update/

## Tech Stack
- Next.js 14.2 (app directory)
- React with TypeScript
- Tailwind CSS
- JWT Authentication (WordPress)
- WordPress REST API

## Important Files
- `/app/dashboard/page.tsx` - Main dashboard
- `/app/dashboard/programs/new/page.tsx` - Create programs
- `/app/dashboard/programs/edit/page.tsx` - Edit programs
- `/app/programs/[slug]/page.tsx` - Dynamic program detail page
- `/app/programs/page.tsx` - Program listing
- `/components/Navigation.tsx` - Shared navigation

## ACF Fields for Programs (Exact Names)
See `/Users/hk/Downloads/mhmaV4/mhma-update/ACF_FIELDS.md` for exact field names:
- program_title
- program_description
- program_image (media ID)
- program_image_poster (media ID, optional)
- stat_1_label, stat_1_value
- stat_2_label, stat_2_value
- stat_3_label, stat_3_value
- stat_4_label, stat_4_value
- additional_content

## Important Notes
- **Delete Programs**: Use `?force=true` parameter in DELETE requests
- **Image Fields**: Store media IDs (integers), fetch URL via `/wp/v2/media/{id}`
- **Authentication**: JWT token in localStorage as `jwt_token`
- **Navigation**: Use `<Navigation currentPage="..." />` component
- **LocalWP Hosting**: WordPress site is hosted using LocalWP at `/Users/hk/Local Sites/mhma-update/`
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

## Current Task
[Describe your task here]

---

## Additional Context Files
- `/Users/hk/Downloads/mhmaV4/mhma-update/PROJECT_CONTEXT.md` - Full project context
- `/Users/hk/Downloads/mhmaV4/mhma-update/ACF_FIELDS.md` - Exact ACF field names

Please read these files for complete context before starting.
