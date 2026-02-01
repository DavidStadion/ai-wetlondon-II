# Hosting Comparison: Vercel + Supabase vs Cloudflare + D1

## Current Supabase Usage

Your usage is minimal and straightforward:

| Table | Operations | Location |
|-------|-----------|----------|
| `venues` | Read all | Client-side (`js/supabase-client.js:19`) |
| `user_reviews` | Read/Write | Serverless API (`api/reviews.js`) |
| `small_mighty_partners` | Read all | Client-side (`js/app.js:3939`) |

No complex queries, no real-time subscriptions, no auth. Just simple table reads and one table with writes.

---

## Pricing Comparison

| Aspect | Vercel | Cloudflare |
|--------|--------|------------|
| **Bandwidth** | 100GB free, then $$$ | Unlimited free |
| **Serverless** | 100GB-hrs free | 100K requests/day free |
| **Database storage** | Supabase: 8GB free, $0.125/GB | D1: 5GB free, $0.75/GB |
| **Overage costs** | Can spike unexpectedly | More predictable |

**Winner: Cloudflare** for bandwidth-heavy apps. Vercel's overages can become significant.

---

## Performance Comparison

| Aspect | Vercel | Cloudflare |
|--------|--------|------------|
| **Edge latency** | Good (Edge Runtime) | Excellent (V8 isolates) |
| **Cold starts** | Higher for serverless | Near-zero for Workers |
| **Global distribution** | 200+ locations | 330+ locations |

**Winner: Cloudflare** for raw performance. Workers lead in latency and cold start metrics.

---

## Developer Experience

| Aspect | Vercel | Cloudflare |
|--------|--------|------------|
| **Framework support** | Excellent (Next.js native) | Good (adapters needed) |
| **Database UI** | Supabase has great browser editor | D1 has basic CLI/dashboard |
| **Deployment** | `git push` and done | `git push` and done |
| **Vite/Preact** | Works well | Works well |

**Winner: Vercel** for DX, especially with Next.js. For Preact/Vite, both are comparable.

---

## Database Comparison: Supabase vs D1

| Aspect | Supabase (Postgres) | Cloudflare D1 (SQLite) |
|--------|---------------------|------------------------|
| **Type** | Full Postgres | SQLite at edge |
| **Best for** | Complex queries, relations | Simple reads, edge-first |
| **UI** | Excellent table editor | Basic |
| **Auth/Storage** | Included | Separate products |
| **Your needs** | Overkill | Sufficient |

Supabase is more feature-rich but D1 is sufficient for simple read patterns.

---

## Recommendation for Wet London

### Cloudflare Pages + D1 would work well because:

1. **Your app is mostly static** - CDN delivery is the primary need
2. **Simple data patterns** - 3 tables, mostly reads, no complex queries
3. **Unlimited bandwidth** - No surprise bills if you get traffic spikes
4. **Lower latency** - Edge-first architecture benefits your users

### Consider staying with Vercel + Supabase if:

- You value Supabase's table editor for managing venue data
- You're comfortable with current costs
- Migration effort isn't worth it for a working setup

---

## Migration Effort (if moving to Cloudflare)

1. Export venues/partners data from Supabase
2. Create D1 database with equivalent schema
3. Rewrite `api/reviews.js` as a Cloudflare Worker
4. Update `supabase-client.js` to use D1 REST API or direct binding
5. Set up Cloudflare Pages deployment

**Estimated effort: 1-2 days**

---

## Strategic Options

### Option A: Migrate incrementally
1. Complete the Preact migration on Vercel first
2. Evaluate if Cloudflare migration is worth it afterward

### Option B: Migrate together
Migrate to Cloudflare as part of the Preact refactor since you're rewriting much of the frontend anyway.

---

## Sources

- [Cloudflare vs Vercel pricing comparison](https://medium.com/@pedro.diniz.rocha/why-cloudflare-is-the-best-alternative-to-vercel-in-2024-an-in-depth-pricing-comparison-7e1d713f8fde)
- [Edge performance comparison 2026](https://dev.to/dataformathub/cloudflare-vs-vercel-vs-netlify-the-truth-about-edge-performance-2026-50h0)
- [D1 vs Supabase comparison](https://bejamas.com/compare/cloudflare-d1-vs-supabase)
- [Gartner Peer Insights](https://www.gartner.com/reviews/market/cloud-application-platforms/compare/cloudflare-vs-vercel)
