# Wet London: Preact + TypeScript Migration Plan

## Overview

Migrate vanilla HTML/CSS/JS app to Preact with TypeScript, Vite build tooling, Preact Signals for state management, CSS Modules, and ESLint.

**Current State:**
- `app.js`: 4000 lines, 70+ functions, 108 `window.*` globals
- `styles.css`: 6850 lines with heavy duplication (3 footer copies, 6 card variants)
- 71+ inline `onclick` handlers
- No build step, no types, no linting

---

## Phase 1: Build Tooling & TypeScript Setup

### 1.1 Install Dependencies

```bash
npm init -y
npm install preact @preact/signals @supabase/supabase-js
npm install -D vite @preact/preset-vite typescript @types/node
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-plugin-react-hooks eslint-config-preact
```

### 1.2 Create Configuration Files

**vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: { '@': '/src' }
  }
});
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "noEmit": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

**eslint.config.js** (flat config)
```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './tsconfig.json' }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
];
```

**package.json scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  }
}
```

### 1.3 File Structure

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component
├── components/
│   ├── ActivityCard/
│   │   ├── ActivityCard.tsx
│   │   ├── ActivityCard.module.css
│   │   └── index.ts
│   ├── WeatherWidget/
│   ├── SearchBar/
│   ├── FilterChips/
│   ├── modals/
│   │   ├── ActivityModal/
│   │   ├── CustomizeModal/
│   │   ├── PrerequisitesModal/
│   │   ├── ShareModal/
│   │   └── BookingModal/
│   ├── BookmarksSection/
│   ├── RecentlyViewedSection/
│   └── common/
│       ├── Button/
│       ├── Tag/
│       ├── Modal/
│       └── Toast/
├── signals/
│   ├── filterSignals.ts
│   ├── venueSignals.ts
│   └── uiSignals.ts
├── types/
│   ├── venue.ts
│   └── filters.ts
├── hooks/
│   ├── useLocalStorage.ts
│   └── useImageLoader.ts
├── utils/
│   ├── supabase.ts
│   └── formatters.ts
└── styles/
    └── global.css
```

### 1.4 Verification
- [ ] `npm run dev` starts server
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` runs without config errors

---

## Phase 2: Type Definitions

### 2.1 Core Types (`src/types/venue.ts`)

```typescript
export type VenueType =
  | 'museums' | 'galleries' | 'theatre' | 'dining'
  | 'entertainment' | 'shopping' | 'nightlife'
  | 'wellness' | 'cinema' | 'historic' | 'sports'
  | 'workshops' | 'gaming' | 'music' | 'comedy' | 'markets';

export type AreaType = 'central' | 'west' | 'east' | 'north' | 'south';
export type WetnessLevel = 'dry' | 'slightly' | 'wet';
export type CardVariant = 'default' | 'featured' | 'sponsored' | 'partner' | 'lucky' | 'spotlight';

export interface Venue {
  name: string;
  type: VenueType[];
  location: AreaType;
  wetness: WetnessLevel;
  wetnessScore: number;
  price: number;
  priceDisplay: string;
  description: string;
  rating: number;
  sponsored?: boolean;
  highlighted?: boolean;
  featured?: boolean;
  affiliateLink?: string | null;
  prerequisites?: string[];
  openingHours?: Record<string, string> | null;
}
```

### 2.2 Filter Types (`src/types/filters.ts`)

```typescript
export interface FilterState {
  keywords: string;
  types: Set<VenueType>;
  areas: Set<AreaType>;
  wetness: WetnessLevel | null;
  maxWetnessScore: number;
  openNow: boolean;
  constraints: Set<string>;
}
```

---

## Phase 3: State Management (Preact Signals)

### 3.1 Filter Signals (`src/signals/filterSignals.ts`)

Mirror existing `filter-state.js` pattern with typed signals:

```typescript
import { signal, computed } from '@preact/signals';

export const keywords = signal<string>('');
export const selectedTypes = signal<Set<VenueType>>(new Set());
export const selectedAreas = signal<Set<AreaType>>(new Set());
export const wetnessLevel = signal<WetnessLevel | null>(null);
export const maxWetnessScore = signal<number>(100);
export const openNow = signal<boolean>(false);
export const constraints = signal<Set<string>>(new Set());

export const filterCounts = computed(() => ({
  types: selectedTypes.value.size,
  areas: selectedAreas.value.size,
  // ... etc
}));
```

### 3.2 Venue Signals (`src/signals/venueSignals.ts`)

```typescript
export const venues = signal<Venue[]>([]);
export const isLoading = signal<boolean>(true);
export const filteredVenues = computed(() => /* filter logic */);
```

### 3.3 Bridge for Legacy Coexistence

During migration, sync signals with `window.filters` so vanilla JS continues working.

---

## Phase 4: Component Extraction Order

Extract in dependency order (leaf components first):

### Wave 1: Leaf Components (Days 1-2)
1. `Tag` - Simple toggle tag
2. `Button` - With variants
3. `WetnessIndicator` - Bar display
4. `BookmarkIcon` - SVG toggle (consolidate 4 CSS duplicates)

### Wave 2: Self-Contained Widgets (Days 3-4)
5. `WeatherWidget` - Own API calls, self-contained
6. `Toast` - Notification component
7. `SkeletonLoader` - Loading states

### Wave 3: Filter Components (Days 5-7)
8. `FilterChips` / `CategoryChips`
9. `SearchBar` - With suggestions
10. `PrerequisitesModal` - Already has good CSS structure

### Wave 4: Core Components (Days 8-12)
11. `ActivityCard` - Consolidate 6 variants into props-based component
12. `ActivityModal` - With OverviewTab, GalleryTab, ReviewsTab sub-components

### Wave 5: Section Components (Days 13-15)
13. `BookmarksSection`
14. `RecentlyViewedSection`
15. `CustomizeModal`, `ShareModal`, `BookingModal`

---

## Phase 5: CSS Cleanup & Modules

### 5.1 Immediate Cleanup
- Delete duplicate footer sections (lines 3935-4284) - saves 350+ lines
- Consolidate 4 bookmark icon versions into one module
- Consolidate 6 activity card variants into single module with variant classes

### 5.2 CSS Module Pattern

```css
/* ActivityCard.module.css */
.card { /* base styles */ }
.card[data-variant="featured"] { /* featured overrides */ }
.card[data-variant="sponsored"] { /* sponsored overrides */ }
```

### 5.3 Global Variables (`src/styles/global.css`)

Move CSS custom properties to top, use for both light and dark modes.

---

## Phase 6: Critical Files to Modify

| File | Action |
|------|--------|
| `js/app.js` | Extract functions into components, eventually delete |
| `js/filter-state.js` | Replace with `src/signals/filterSignals.ts` |
| `js/supabase-client.js` | Wrap in `src/utils/supabase.ts` with types |
| `css/styles.css` | Extract into CSS modules, delete duplicates |
| `index.html` | Add Vite entry point, keep structure during migration |

---

## Phase 7: Documentation

Create `docs/COMPONENT_GUIDE.md` covering:
- Component file structure
- CSS module naming conventions
- Using Preact Signals
- TypeScript patterns
- Adding new components checklist

---

## Verification Checklist

### Build & Tooling
- [ ] `npm run dev` works
- [ ] `npm run build` produces dist/
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes

### Functionality
- [ ] Filter modal works (types, areas, wetness, open now)
- [ ] Search with suggestions works
- [ ] Activity cards render (all 6 variants)
- [ ] Activity modal opens with 3 tabs
- [ ] Bookmarks save to localStorage
- [ ] Recently viewed tracks history
- [ ] Weather widget loads data
- [ ] AdSense continues working
- [ ] Mobile responsive design preserved

### Per-Component
For each extracted component:
- [ ] Visual match with original
- [ ] TypeScript types complete (no `any`)
- [ ] ESLint passes
- [ ] Interactive states work
- [ ] Mobile responsive

---

## Timeline

| Phase | Duration |
|-------|----------|
| 1. Build setup + TypeScript + ESLint | 1-2 days |
| 2. Type definitions | 1 day |
| 3. State management (Signals) | 2 days |
| 4. Component extraction (5 waves) | 10-12 days |
| 5. CSS cleanup & modules | 2-3 days |
| 6. Integration testing | 2-3 days |
| 7. Documentation | 1 day |

**Total: ~3-4 weeks**
