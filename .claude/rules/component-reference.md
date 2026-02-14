# Component Reference

Quick reference for all reusable components, utilities, and design tokens.

## Common Components

All in `src/components/common/`. Import via barrel: `import { Button } from '@/components/common/Button'`.

### Button
```tsx
variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'action'
size?: 'sm' | 'md' | 'lg'
as?: 'button' | 'a'  // 'a' requires href
```

### Modal
```tsx
isOpen: boolean
onClose: () => void
title: string
size?: 'sm' | 'md' | 'lg'
children: ComponentChildren
```

### Tag
```tsx
// Interactive (filterable)
label: string; selected: boolean; onClick: () => void; variant?: 'default' | 'category'
// Display-only
label: string; variant: 'display'
```

### Stars
```tsx
rating: number        // 0-5
size?: 'sm' | 'lg'   // default: 'sm'
```

### LoadingSpinner
```tsx
text?: string  // default: 'Loading...'
```

### FilterChipBar
```tsx
// Generic: FilterChipBar<T extends string>
options: Array<{ value: T; label: string }>
selected: T
onSelect: (value: T) => void
```

### BackToTop
No props. Floating button, visible after 500px scroll.

### BookmarkIcon
```tsx
isBookmarked: boolean
onToggle: () => void
size?: number
className?: string
label?: string
```

### Toast
```tsx
id: string
message: string
type: 'success' | 'error' | 'info' | 'warning'
onDismiss: (id: string) => void
duration?: number  // default: 5000ms
```

### WetnessIndicator
```tsx
score: number          // 0-100
level: WetnessLevel    // 'dry' | 'slightly' | 'wet'
size?: 'sm' | 'md'
```

### SkeletonLoader
```tsx
variant: 'card' | 'text' | 'circle' | 'button'
width?: string
height?: string
count?: number
```

## Domain Components

### ActivityCard (`src/components/ActivityCard/`)
```tsx
venue: Venue
variant?: CardVariant  // 'default' | 'featured' | 'sponsored' | 'partner' | 'lucky' | 'spotlight' | 'spotlightHero'
onClick?: () => void
```
Displays venue image (via useImageLoader), type tags, wetness indicator, price, open/closed status, bookmark icon.

### EventCard (`src/components/EventCard/`)
```tsx
event: Event
badgeType: 'ends-soon' | 'live' | 'new'
```
Displays event with category, formatted date, venue, location, price, map link, and booking button.

### PartnerCard (`src/components/PartnerCard/`)
```tsx
partner: Partner
```
Displays partner pop-up with image, type, location, description, and visit link.

## Modals

### ActivityModal (`src/components/modals/ActivityModal/`)
```tsx
venue: Venue | null
isOpen: boolean
onClose: () => void
imageUrl?: string
```
Three tabs: **OverviewTab** (venue details, hours, transport, booking), **GalleryTab** (Google Places photos), **ReviewsTab** (Google + community reviews, review form).

### PartnerModal (`src/components/modals/PartnerModal/`)
```tsx
partner: Partner | null   // null = create mode
onClose: () => void
onSubmit: (data: Partial<Partner>) => void
```
Admin form for creating/editing partners. Used only in AdminPage.

### Other Modals
- **BookingModal** — booking confirmation flow
- **CustomizeModal** — homepage customization preferences
- **PrerequisitesModal** — venue amenity/accessibility details
- **ShareModal** — social sharing options

## Homepage Sections

These are page-specific components used only on HomePage:
- **Hero** — search bar, weather widget, tagline
- **WeatherWidget** — current weather display
- **WeatherRecommendations** — weather-based venue suggestions
- **PopularCategories** — category quick-filter grid
- **QuickFilters** — filter chip shortcuts
- **SearchBar** — keyword search input
- **FilterChips** — active filter display
- **BookmarksSection** — saved venues
- **RecentlyViewedSection** — recently viewed venues
- **TopPicksSection** — curated top picks
- **PopupsSection** — featured pop-ups
- **PersonalizedSection** — personalized recommendations

## Utility Functions

### venueInfo.ts — Venue display helpers
| Function | Input | Output |
|----------|-------|--------|
| `formatOpeningHours(hours)` | `Record<string, string> \| null` | Multi-line formatted hours string |
| `getOpenStatus(hours)` | `Record<string, string> \| null` | `"Open now"`, `"Closed"`, or `""` |
| `getGoogleMapsUrl(name, location)` | strings | Google Maps search URL |
| `getTransportInfo(description)` | string | `{ station, details }` |
| `getDuration(types, prerequisites?)` | arrays | Estimated visit duration string |
| `getAccessibilityText(prerequisites?, wetness?)` | arrays/string | Accessibility summary |
| `getBookingText(types, prerequisites?, price?)` | arrays/number | Booking guidance string |
| `getWhatsIncluded(types, prerequisites?)` | arrays | `string[]` of included features |
| `getGoodToKnow(venue)` | `Venue` | `string[]` of tips |

### dateFormatters.ts — Date display
| Function | Input | Output |
|----------|-------|--------|
| `formatEventDate(dateStr)` | ISO date string | `"14 Feb 2026"` |
| `getDaysLeft(endDate)` | ISO date string | Days remaining (number) |

### situationFilters.ts — Situation-based filtering
| Export | Description |
|--------|-------------|
| `Situation` | Type: `'solo' \| 'couple' \| 'kids' \| 'group' \| 'accessible' \| 'budget'` |
| `SITUATIONS` | Array of `{ id, label, icon }` |
| `SITUATION_MAPPINGS` | Config per situation (preferred types, max price, etc.) |
| `filterForSituation(situation, venues)` | Returns filtered + scored venue list |

### formatters.ts — General display
`formatPrice(n)`, `formatRating(n)`, `truncateText(s, max)`, `labelCategory(s)`

### openingHours.ts
`isVenueOpenNow(hours)` — returns `true` (open), `false` (closed), or `null` (unknown)

## CSS Design Tokens

All tokens in `src/styles/global.css` `:root`. Always use `var(--token)` instead of hardcoded values.

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0f172a` | Page background |
| `--color-bg-secondary` | `#1e293b` | Secondary backgrounds |
| `--color-surface` | `#1e293b` | Card/pill surfaces |
| `--color-text` | `#f8fafc` | Primary text |
| `--color-text-secondary` | `#94a3b8` | Secondary text |
| `--color-border` | `#334155` | Borders |
| `--color-primary` | `#2563eb` | Primary actions |
| `--color-success` | `#22c55e` | Success states |
| `--color-error` | `#ef4444` | Error states |
| `--color-warning` | `#f59e0b` | Warning states |
| `--color-accent` | `#dcdaf5` | Accent backgrounds |
| `--color-accent-text` | `#0f172a` | Text on accent backgrounds |
| `--color-status-open` | `#16a34a` | "Open now" badge |
| `--color-status-closed` | `#dc2626` | "Closed" badge |
| `--color-featured` | `#f59e0b` | Featured card border |
| `--color-sponsored` | `#ffd700` | Sponsored card border |
| `--color-partner` | `#6366f1` | Partner card border |
| `--color-lucky` | `#667eea` | Lucky card border |
| `--color-footer-accent` | `#6C63FF` | Footer links/buttons |
| `--color-cta-bg` | `#ffffff` | CTA button background |
| `--color-cta-text` | `#1a1a1a` | CTA button text |

### Radii
`--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px)

### Shadows
`--shadow-sm`, `--shadow-md`, `--shadow-lg`

### Typography Scale
`--text-xs` (0.75rem), `--text-sm` (0.875rem), `--text-base` (1rem), `--text-lg` (1.125rem), `--text-xl` (1.5rem), `--text-2xl` (2rem)

### Global Keyframes
- `spin` — 360deg rotation (spinners)
- `shimmer` — translateX sweep (skeleton loaders)

### Breakpoints
480px (small mobile), 640px (mobile), 768px (tablet), 1024px (desktop)
