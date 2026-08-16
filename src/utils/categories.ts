/**
 * The eighteen categories that own a page at /category/<slug>.
 *
 * One list, imported by everything that needs it: the footer, the prerenderer
 * that builds the pages, and the sitemap generator that declares them. Before
 * this there were two hand-maintained copies and the footer was about to become
 * a third, which is the same shape of problem as the `games` and `gaming` tags
 * that hid eighteen venues from their own category page.
 *
 * The blurb is the page's opening line and its meta description, so it is
 * written to be read rather than to hold keywords.
 *
 * Adding one here is not enough on its own: venues have to carry the matching
 * tag in the database, or the page builds empty.
 */
export interface Category {
  slug: string;
  label: string;
  blurb: string;
}

export const CATEGORIES: Category[] = [
  { slug: 'museums', label: 'Museums', blurb: 'Collections, curiosities and enough roof to see out any downpour.' },
  { slug: 'galleries', label: 'Galleries', blurb: 'Art worth standing still for, all of it comfortably indoors.' },
  { slug: 'theatre', label: 'Theatre', blurb: 'West End spectacle and tiny rooms above pubs. Both count.' },
  { slug: 'dining', label: 'Dining', blurb: 'Long lunches and somewhere warm to sit while it hammers down.' },
  { slug: 'entertainment', label: 'Entertainment', blurb: 'Immersive, interactive and reliably dry.' },
  { slug: 'shopping', label: 'Shopping', blurb: 'Department stores, arcades and markets with a roof.' },
  { slug: 'wellness', label: 'Wellness & Spa', blurb: 'Steam, sauna and doing very little on purpose.' },
  { slug: 'nightlife', label: 'Nightlife', blurb: 'Late ones that never need an umbrella.' },
  { slug: 'music', label: 'Music Venues', blurb: 'From jazz basements to arena-sized nights.' },
  { slug: 'comedy', label: 'Comedy Clubs', blurb: 'Cheap laughs and a low ceiling. Ideal.' },
  { slug: 'cinema', label: 'Cinemas', blurb: 'Two hours somewhere warm in a very big chair.' },
  { slug: 'gaming', label: 'Gaming', blurb: 'Arcades, VR, bowling and board games.' },
  { slug: 'workshops', label: 'Classes & Workshops', blurb: 'Make something with your hands while it pours outside.' },
  { slug: 'historic', label: 'Historic Sites', blurb: 'Centuries of London, mercifully under cover.' },
  { slug: 'markets', label: 'Markets', blurb: 'Covered markets. Browsing without the drenching.' },
  { slug: 'sports', label: 'Sports & Fitness', blurb: 'Climb, swim, skate and sweat indoors.' },
  { slug: 'exhibitions', label: 'Exhibitions', blurb: 'Shows worth catching before they close.' },
  { slug: 'libraries', label: 'Libraries', blurb: 'Quiet, free, and among the driest places in London.' },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
