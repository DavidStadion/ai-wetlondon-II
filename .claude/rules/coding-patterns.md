# Coding Patterns

## Loop Patterns

**Prefer functional array methods over traditional loops:**

| Pattern | Use Case |
|---------|----------|
| `.map()` | Transform arrays, render lists |
| `.filter()` | Select subset of items |
| `.reduce()` | Accumulate values, build objects |

```tsx
// Good - functional style
{venue.type.slice(0, 2).map((t) => (
  <span key={t} className={styles.tag}>{formatType(t)}</span>
))}

// Avoid - traditional loops, forEach
```

## Branching Patterns

**Ternary operators for simple conditionals in JSX:**
```tsx
{person?.status || (isActive ? 'Active' : 'None')}
```

**Optional chaining (`?.`) and nullish coalescing (`??`):**
```tsx
const count = items?.length ?? 0;
```

**Guard clauses for early returns:**
```tsx
export function parseValue(value?: string) {
  if (!value) return [];
  // main logic
}
```

**Logical AND for conditional rendering:**
```tsx
{badgeText && (
  <span className={styles.badge}>{badgeText}</span>
)}

{!venues.length && (
  <p>No venues found.</p>
)}
```

## Pure Functions

**Pure functions for data transformation:**
```tsx
function formatType(type: VenueType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
```

## Component Structure

**File co-location pattern - each component directory contains:**
```
ComponentName/
├── ComponentName.tsx        # Main component
├── ComponentName.module.css # Styles
└── index.ts                 # Barrel export
```

**Presentational components receive data via props:**
```tsx
export interface ActivityCardProps {
  venue: Venue;
  variant?: CardVariant;
  onClick?: () => void;
}

export function ActivityCard({ venue, variant = 'default', onClick }: ActivityCardProps) {
  // Pure JSX rendering
}
```

## State Management

**Preact signals for reactive state:**
```tsx
import { signal, computed } from '@preact/signals';

export const keywords = signal<string>('');
export const selectedTypes = signal<Set<VenueType>>(new Set());

export const hasActiveFilters = computed(() => {
  return keywords.value.trim() !== '' || selectedTypes.value.size > 0;
});
```

**Immutable updates for collections:**
```tsx
export function toggleType(type: VenueType): void {
  const current = new Set(selectedTypes.value);
  if (current.has(type)) {
    current.delete(type);
  } else {
    current.add(type);
  }
  selectedTypes.value = current;
}
```

## CSS Modules

**Import pattern:**
```tsx
import styles from './Component.module.css';
```

**Class composition:**
```tsx
<div className={[styles.card, variant && styles[`card--${variant}`]].filter(Boolean).join(' ')}>
```

**Naming conventions:**
- camelCase base classes: `.card`, `.content`, `.headerNav`
- BEM-style variants: `.card--featured`, `.button--primary`

**CSS variables — always use tokens from `src/styles/global.css`:**
```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

**No global styles or inline styles.**

## Signals Gotchas

- **Never mutate signals during render** — use `useEffect` for side effects
- **Immutable Set/Map updates** — always create a new Set/Map, never `.add()` or `.delete()` on the existing one

## TypeScript Patterns

**Union types for constrained values:**
```tsx
export type VenueType = 'museums' | 'galleries' | 'theatre' | 'dining';
export type AreaType = 'central' | 'west' | 'east' | 'north' | 'south';
```

**Record types for lookup maps:**
```tsx
const AREA_LABELS: Record<AreaType, string> = {
  central: 'Central',
  west: 'West',
  east: 'East',
  north: 'North',
  south: 'South',
};
```

**Partial for optional mappings:**
```tsx
const VARIANT_BADGES: Partial<Record<CardVariant, string>> = {
  featured: 'FEATURED',
  sponsored: 'SPONSORED',
};
```
