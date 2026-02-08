# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wet London is a web app helping Londoners discover indoor activities during rainy weather. Activities are rated by "wetness score" (0-100) indicating rain exposure. The frontend is a Preact + TypeScript SPA built with Vite, deployed on Vercel with serverless API functions.

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

### Implementing Plans

**When given a markdown plan file to implement, use the `/program-manager` skill.**

The program-manager skill orchestrates implementation using a Doer/Verifier agent loop that:
- Spawns a developer agent to implement the plan
- Spawns a verification agent to review the implementation
- Iterates until approved or max cycles reached

This ensures quality through automated review cycles rather than manual back-and-forth.

## Development

Preact + Vite SPA with serverless API functions.

**Scripts:**
- `npm run dev` — Vite dev server with HMR
- `npm run dev:api` — Local API server (`node server.js`) for `/api` routes
- `npm run build` — TypeScript check + Vite build
- `npm run typecheck` — TypeScript only
- `npm run lint` — ESLint

**Notes:**
- Vite proxies `/api` to `localhost:3000` in dev
- Run `npm run dev` and `npm run dev:api` in separate terminals for full local development

**Environment variables:**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Client-side (Supabase)
- `GOOGLE_MAPS_KEY` — Server-only (API functions)

## Architecture

### Data Flow
1. Supabase database via `src/utils/supabase.ts` — `fetchVenues()` loads the `venues` table
2. `convertVenue()` maps snake_case DB fields to camelCase
3. Data stored in `venues` signal (`src/signals/venueSignals.ts`)
4. No fallback data file — Supabase is the sole source

### State Management
`@preact/signals` — all reactive state lives in `src/signals/`:
- **venueSignals.ts** — venues list, filtered/sorted views, stats
- **filterSignals.ts** — all filter state (keywords, types, areas, wetness, openNow, constraints)
- **uiSignals.ts** — modals, bookmarks, toasts, recently viewed
- **weatherSignals.ts** — weather data
- **eventSignals.ts** — events data
- **partnerSignals.ts** — partner venues
- **adminSignals.ts** — admin state

### Routing
`preact-router` in `src/main.tsx`:

| Route | Page Component |
|-------|---------------|
| `/` | `HomePage` |
| `/about` | `AboutPage` |
| `/events` | `EventsPage` |
| `/popups` | `PopupsPage` |
| `/situations` | `SituationsPage` |
| `/admin` | `AdminPage` |

### Component Structure
Co-located in `src/components/` — each directory contains:
- `Component.tsx` — main component
- `Component.module.css` — styles
- `index.ts` — barrel export

Pages live in `src/pages/`.

### Key Utilities
- `src/utils/openingHours.ts` — `isVenueOpenNow()` returns true/false/null
- `src/utils/formatters.ts` — display formatting helpers
- `src/hooks/useImageLoader.ts` — signal-based image loading with localStorage cache

### Venue Data Model
```typescript
type VenueType = 'museums' | 'galleries' | 'theatre' | 'dining' | 'entertainment' | ... ;
type AreaType = 'central' | 'west' | 'east' | 'north' | 'south';
type WetnessLevel = 'dry' | 'slightly' | 'wet';
type CardVariant = 'default' | 'featured' | 'sponsored' | 'partner' | 'lucky' | 'spotlight' | 'spotlightHero';

interface Venue {
  id?: number;
  name: string;
  type: VenueType[];
  location: AreaType;
  wetness: WetnessLevel;
  wetnessScore: number;       // 0-100, lower is drier
  price: number;
  priceDisplay: string;       // e.g., "FREE", "£26"
  description: string;
  rating: number;
  sponsored?: boolean;
  highlighted?: boolean;
  featured?: boolean;
  affiliateLink?: string | null;
  prerequisites?: string[];   // accessibility/amenity tags
  openingHours?: Record<string, string> | null;  // day: "HH:MM-HH:MM"
}
```

Types defined in `src/types/venue.ts`.

### API Functions (Vercel Serverless)
Located in `api/` (vanilla JS, served by `server.js` locally):
- **place-photo.js** — Google Places photos proxy (keeps API key server-side)
  - `GET /api/place-photo?q=venue+name` returns proxy URL
  - `GET /api/place-photo?photo=places/...` streams actual image
- **place-details.js** — Fetches reviews, ratings, hours from Google Places
- **reviews.js** — User review CRUD via Supabase `user_reviews` table

### Image Loading Strategy
1. Check localStorage cache (7-day TTL)
2. Try Google Places API via `/api/place-photo`
3. Generate SVG gradient placeholder if API fails
