# Content backup, 10 August 2026

A point-in-time copy of everything in Supabase, taken with `npm run snapshot`
at commit 1c12690 (tag `v1.0-instrument-serif`).

The code lives in git, but `public/data/` is gitignored because the build
regenerates it, so the venue content itself was not in any commit. This is that
gap closed.

| File | Rows |
|---|---|
| venues.json | 303 |
| events.json | 6 |
| small_mighty_partners.json | 8 |

These are the same shape the app reads as its offline fallback, so restoring is
a matter of importing them back into the matching Supabase tables. Field names
are snake_case, exactly as Postgres returns them, including `type` and
`prerequisites` as brace-wrapped strings like `{museums,education}`.

Note: the 27 duplicate venues identified earlier are still present in this
snapshot, since the dedupe SQL has not been run yet.
