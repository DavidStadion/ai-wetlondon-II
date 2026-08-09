/**
 * Minimal per-page metadata for an SPA: keeps <title> and the description /
 * canonical tags in step with the route, so venue and category pages stop
 * inheriting the homepage's.
 */
const SITE = 'https://wetlondon.co.uk';
const DEFAULT_TITLE = 'Wet London - Best Indoor Activities in London When It Rains';
const DEFAULT_DESC =
  'Discover indoor activities in London for rainy days. Museums, galleries, cinemas, restaurants and more — all rated by how dry you will stay.';

function setTag(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export interface PageMeta {
  title?: string;
  description?: string;
  path?: string;
}

export function setPageMeta({ title, description, path }: PageMeta): void {
  document.title = title ?? DEFAULT_TITLE;

  const desc = description ?? DEFAULT_DESC;
  setTag('meta[name="description"]', 'content', desc);
  setTag('meta[property="og:description"]', 'content', desc);
  setTag('meta[name="twitter:description"]', 'content', desc);

  setTag('meta[property="og:title"]', 'content', title ?? DEFAULT_TITLE);
  setTag('meta[name="twitter:title"]', 'content', title ?? DEFAULT_TITLE);

  if (path) {
    const url = `${SITE}${path}`;
    setTag('link[rel="canonical"]', 'href', url);
    setTag('meta[property="og:url"]', 'content', url);
  }
}

export function resetPageMeta(): void {
  setPageMeta({ path: '/' });
}
