# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wet London is a web app helping Londoners discover indoor activities during rainy weather. Activities are rated by "wetness score" (0-100) indicating rain exposure. The frontend is vanilla HTML/CSS/JS, deployed on Vercel with serverless API functions.

## Approach

### Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Development

This is a static frontend with Vercel serverless functions. No build step required.

**Local development:** Open `index.html` directly in browser for basic testing, or use Vercel CLI for API functions:
```bash
npx vercel dev
```

**API functions require environment variables:**
- `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY` - For place photos and details
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` - For user reviews API

## Architecture

### Data Flow
1. **Primary source:** Supabase database via `js/supabase-client.js` (`venues` table)
2. **Fallback:** Static `js/data.js` array if Supabase fails
3. Data loads on page init, fires `venues:loaded` custom event when ready
4. Global `window.londonVenues` holds the active venue list

### Filter System
Single source of truth in `js/filter-state.js`:
- `filters` object contains all filter state (keywords, types, areas, wetness, openNow, constraints)
- `applyFilters()` is the only function that should trigger filtering
- Calls `filterVenues()` from app.js, then `setGeneratedResults()` to render

### Key Files
- **js/app.js** - Main application logic: rendering, modals, search, image loading (lazy-loaded via IntersectionObserver)
- **js/data.js** - Fallback venue data with full schema example
- **js/filter-state.js** - Centralized filter state management
- **js/supabase-client.js** - Database client, `convertVenue()` maps snake_case DB fields to camelCase

### Venue Data Model
```javascript
{
  name: string,
  type: string[],           // e.g., ["museums", "historic"]
  location: string,         // "central", "west", "east", etc.
  wetness: string,          // "dry", "slightly", "wet"
  wetnessScore: number,     // 0-100, lower is drier
  price: number,
  priceDisplay: string,     // e.g., "FREE", "£26"
  prerequisites: string[],  // accessibility/amenity tags
  openingHours: object,     // day: "HH:MM-HH:MM" format
  sponsored: boolean,
  highlighted: boolean,
  featured: boolean
}
```

### API Functions (Vercel Serverless)
Located in `api/`:
- **place-photo.js** - Google Places photos proxy (keeps API key server-side)
  - `GET /api/place-photo?q=venue+name` returns proxy URL
  - `GET /api/place-photo?photo=places/...` streams actual image
- **place-details.js** - Fetches reviews, ratings, hours from Google Places
- **reviews.js** - User review CRUD via Supabase `user_reviews` table

### Image Loading Strategy
1. Check localStorage cache (7-day TTL)
2. Try Google Places API via `/api/place-photo`
3. Fall back to Unsplash API
4. Generate gradient/SVG placeholder if all fail

### Pages
- `index.html` - Main activity browser
- `events.html` - Events/what's on
- `popups.html` - Pop-up venues
- `situations.html` - Curated lists by situation ("For who?")
- `about.html` - About page
- `admin.html` - Admin interface
