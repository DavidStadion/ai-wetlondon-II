# Complete Preact Migration Plan

## Summary

Replace the 1,838-line vanilla `index.html` with a ~50-line shell that mounts the existing Preact app from `src/`. The Preact components are complete and ready to use.

## SEO Answer

**Should you worry?** Not really.

1. **Meta tags stay** - All SEO meta tags (title, description, Open Graph, Twitter cards) remain in `<head>` and are immediately available to crawlers
2. **Google renders JS** - Googlebot executes JavaScript and indexes client-rendered content
3. **Site type** - This is an interactive activity finder, not a content blog. Users search, filter, explore - inherently dynamic
4. **Optional prerendering** - Can be added later with a simple Vite config change if needed

For a site like Wet London, the current SEO setup (meta tags + canonical URLs) is sufficient. Prerendering is a nice optimization, not a requirement.

---

## Changes Required

### 1. Replace `index.html` (critical)

Strip down to a minimal shell:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Keep all existing meta tags (SEO, OG, Twitter, favicon) -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wet London - Best Indoor Activities in London When It Rains</title>
    <meta name="description" content="Discover 100+ indoor activities...">
    <!-- ... all other meta tags ... -->
    <meta name="google-adsense-account" content="ca-pub-1382628707656079">
</head>
<body>
    <div id="preact-root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <!-- Deferred AdSense script (keep existing) -->
</body>
</html>
```

**What gets removed:**
- All hardcoded HTML sections (header, hero, modals, footer, etc.)
- References to `js/app.js`, `js/filter-state.js`, `js/data.js`, `js/supabase-client.js`
- Reference to `css/styles.css`
- Inline onclick handlers

### 2. Update `src/styles/global.css`

Change scope from `#preact-root` to `:root`:

```css
/* Before */
#preact-root { --color-primary: #2563eb; ... }

/* After */
:root { --color-primary: #2563eb; ... }
```

Also update the reset and dark mode selectors.

### 3. Add Vercel SPA routing

Create/update `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/" }
  ]
}
```

This ensures `/about`, `/events`, etc. work on direct navigation (not just client-side routing).

### 4. Clean up old files (after verification)

Delete vanilla JS files no longer needed:
- `js/app.js`
- `js/filter-state.js`
- `js/data.js`
- `js/supabase-client.js`
- `css/styles.css`
- `refactor.py`

---

## Files to Modify

| File | Action |
|------|--------|
| `index.html` | Replace with minimal shell (~50 lines) |
| `src/styles/global.css` | Change `#preact-root` to `:root` |
| `vercel.json` | Create/update with SPA rewrites |

## Files to Delete (after verification)

| File | Reason |
|------|--------|
| `js/app.js` | Replaced by Preact components |
| `js/filter-state.js` | Replaced by `src/signals/filterSignals.ts` |
| `js/data.js` | Replaced by `src/signals/venueSignals.ts` |
| `js/supabase-client.js` | Replaced by `src/utils/supabase.ts` |
| `css/styles.css` | Replaced by CSS modules in `src/` |
| `refactor.py` | One-time migration script, no longer needed |

---

## Verification

1. **Run dev server**: `npm run dev`
2. **Test all pages**: `/`, `/about`, `/events`, `/popups`, `/situations`, `/admin`
3. **Test features**: Search, filters, bookmarks, venue modals, weather widget
4. **Test direct URL navigation**: Refresh on `/about` should work
5. **Build and preview**: `npm run build && npm run preview`
6. **Check SEO**: View source - meta tags should be in `<head>`

---

## Optional: Add Prerendering Later

If you decide to add prerendering for improved initial load:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    preact({
      prerender: {
        enabled: true,
        renderTarget: '#preact-root',
        additionalPrerenderRoutes: ['/', '/about', '/events', '/popups', '/situations']
      }
    })
  ]
});
```

This generates static HTML at build time, then hydrates on client.
