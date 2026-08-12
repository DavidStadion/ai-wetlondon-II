/**
 * Shape of an entry in public/data/articles.json, written at build time by
 * scripts/build-articles.mjs from the markdown in content/articles/.
 */
export interface Article {
  slug: string;
  title: string;
  dek: string;
  /** ISO date, e.g. 2026-08-12 */
  date: string;
  /** Venue name, used to pull a cover image */
  lead: string;
  readingMinutes: number;
  wordCount: number;
  /** Already converted from markdown, so the browser carries no parser */
  html: string;
}
