# Wet London

A web app helping Londoners discover indoor activities during rainy weather. Activities are rated by "wetness score" (0-100) indicating rain exposure.

## Tech Stack

- **Frontend:** Preact + TypeScript, Vite, CSS Modules
- **State:** @preact/signals
- **Backend:** Vercel serverless functions (vanilla JS)
- **Database:** Supabase (PostgreSQL)
- **APIs:** Google Places (photos, reviews, details)
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev        # Vite dev server (port 5173)
npm run dev:api    # Local API server (port 3000)
```

Run both in separate terminals for full local development. Vite proxies `/api` to `localhost:3000`.

### Environment Variables

```
VITE_SUPABASE_URL=...       # Supabase project URL
VITE_SUPABASE_ANON_KEY=...  # Supabase anonymous key
GOOGLE_MAPS_KEY=...         # Google Maps API key (server-only)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run dev:api` | Local API server |
| `npm run build` | TypeScript check + production build |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |

## Project Structure

```
src/
  components/         # Reusable components (co-located CSS Modules)
    common/           # Shared UI: Button, Modal, Tag, Stars, LoadingSpinner, FilterChipBar, etc.
    modals/           # ActivityModal, PartnerModal, BookingModal, ShareModal, etc.
    ActivityCard/     # Venue card
    EventCard/        # Event card
    PartnerCard/      # Partner/pop-up card
    ...               # Homepage sections: Hero, WeatherWidget, BookmarksSection, etc.
  pages/              # Route pages: Home, About, Events, Popups, Situations, Admin
  signals/            # Preact signals (venues, filters, UI, weather, events, partners, admin)
  types/              # TypeScript types (venue, event, partner, filters, router)
  utils/              # Pure functions (formatting, venue info, date helpers, situation filters)
  hooks/              # Custom hooks (useImageLoader, useLocalStorage)
  styles/             # Global CSS variables and keyframes
api/                  # Vercel serverless functions (place-photo, place-details, reviews)
server.js             # Local API server for development
```
