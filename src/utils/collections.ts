import type { Venue } from '@/types';

/**
 * Editorial collections, curated angles on the same venue list.
 *
 * Each is a predicate rather than a stored list, so they stay correct as venues
 * are added or edited, and they need no database change to ship.
 */
export interface Collection {
  slug: string;
  title: string;
  /** Trailing words set in italic on the page. */
  titleAccent?: string;
  blurb: string;
  /** One line for the card. */
  teaser: string;
  match: (v: Venue) => boolean;
  /** Higher first. Defaults to rating. */
  score?: (v: Venue) => number;
}

const has = (v: Venue, ...types: string[]) =>
  v.type.some((t) => types.includes(t.toLowerCase()));

const rating = (v: Venue) =>
  typeof v.rating === 'number' && v.rating > 0 && v.rating <= 5 ? v.rating : 0;

const text = (v: Venue) => `${v.name} ${v.description}`.toLowerCase();

export const COLLECTIONS: Collection[] = [
  {
    slug: 'chucking-it-down',
    title: 'Brilliant when it’s',
    titleAccent: 'chucking it down',
    teaser: 'Door to door without a drop on you',
    blurb:
      'The places that work hardest on the worst days. Straight off the tube, fully covered, and good enough to make you glad it rained.',
    match: (v) => v.wetnessScore <= 5,
    score: (v) => rating(v) + (v.wetnessScore === 0 ? 0.5 : 0),
  },
  {
    /*
     * The trade press calls this "competitive socialising" and the listings sites
     * call it "activity bars". Nobody has ever said either out loud. What it
     * actually is: somewhere that keeps score.
     *
     * The blurb is doing the search-engine work rather than the title, because
     * people look for "darts", "bowling" and "crazy golf" by name and nobody
     * searches for a scoreboard. Worth watching: if this collection earns
     * traffic it deserves promoting to a real category, which needs the venues
     * retagged in SQL.
     */
    slug: 'with-a-scoreboard',
    title: 'Somewhere with a',
    titleAccent: 'scoreboard',
    teaser: 'Something to aim at, and a bar',
    blurb:
      'Darts, bowling, shuffleboard, crazy golf, ping pong, axe throwing and simulated Formula One. Most of it has a bar attached, none of it asks you to be any good, and all of it is indoors. London has quietly filled its basements and railway arches with ways to lose at something.',
    match: (v) =>
      v.wetnessScore <= 30 &&
      (has(v, 'gaming') ||
        /darts|shuffleboard|shuffle|crazy golf|mini golf|ping pong|bowling|axe throw|arcade|karaoke|racing sim|simulator|batting cage/.test(
          text(v),
        )),
    score: rating,
  },
  {
    slug: 'under-a-tenner',
    title: 'Brilliant London for',
    titleAccent: 'under a tenner',
    teaser: 'A proper day out, barely any money',
    blurb:
      'London gets an expensive reputation it only half deserves. Everything here costs a tenner or less, and plenty of it costs nothing at all.',
    match: (v) => v.price <= 10,
    score: (v) => rating(v) + (v.price === 0 ? 0.4 : 0),
  },
  {
    slug: 'completely-free',
    title: 'Costs absolutely',
    titleAccent: 'nothing',
    teaser: 'Free, and not in a disappointing way',
    blurb:
      'World-class museums, strange little collections and some of the best buildings in the city. None of it will cost you a penny.',
    match: (v) => v.price === 0,
    score: rating,
  },
  {
    slug: 'somewhere-weird',
    title: 'Somewhere genuinely',
    titleAccent: 'weird',
    teaser: 'The ones you leave with a story',
    blurb:
      'Neon warehouses, surgical theatres, houses frozen in another century. London is much stranger than it lets on.',
    match: (v) =>
      has(v, 'historic', 'immersive', 'entertainment') ||
      /neon|junkyard|illusion|dungeon|catacomb|crypt|secret|hidden|curiosit|oddit|taxiderm|surgic|mithra|vault|tunnel/.test(
        text(v),
      ),
    score: rating,
  },
  {
    slug: 'date-night',
    title: 'Date night that isn’t',
    titleAccent: 'just the pub',
    teaser: 'Somewhere you’ll both remember',
    blurb:
      'Low lighting, something to talk about, and a walk home that doesn’t involve a downpour. No pressure.',
    match: (v) =>
      v.wetnessScore <= 30 &&
      has(v, 'cinema', 'theatre', 'dining', 'wellness', 'galleries', 'music', 'immersive'),
    score: rating,
  },
  {
    slug: 'with-little-ones',
    title: 'Somewhere to take',
    titleAccent: 'the kids',
    teaser: 'Indoors, and they’ll actually enjoy it',
    blurb:
      'Places that can absorb a small person for a couple of hours without anyone melting down, including you.',
    match: (v) =>
      v.wetnessScore <= 30 &&
      (has(v, 'family', 'kids', 'museums', 'science', 'aquariums', 'gaming') ||
        /children|famil|kids|interactive|dinosaur|aquarium/.test(text(v))),
    score: (v) => rating(v) + (v.price === 0 ? 0.3 : 0),
  },
  {
    slug: 'quiet-please',
    title: 'Quiet, calm and',
    titleAccent: 'nearly empty',
    teaser: 'For when London is too much',
    blurb:
      'Reading rooms, small collections and places most people walk past. Low noise, low crowds, no one hurrying you along.',
    match: (v) =>
      has(v, 'libraries', 'galleries', 'historic', 'museums') &&
      v.wetnessScore <= 20 &&
      !/arcade|bowling|karaoke|club|party/.test(text(v)),
    score: rating,
  },
  {
    slug: 'escape-the-heat',
    title: 'Cool, dark and',
    titleAccent: 'out of the sun',
    teaser: 'For when London is boiling',
    blurb:
      'It isn’t always the rain. When the city hits thirty degrees these are the coolest rooms in London: shaded, indoors and usually air-conditioned.',
    match: (v) =>
      v.wetnessScore <= 15 &&
      has(v, 'museums', 'galleries', 'cinema', 'libraries', 'shopping', 'wellness'),
    score: rating,
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function venuesFor(collection: Collection, venues: Venue[]): Venue[] {
  const scorer = collection.score ?? rating;
  return venues.filter(collection.match).sort((a, b) => scorer(b) - scorer(a));
}

/**
 * One cover venue per collection, guaranteed distinct.
 *
 * Picking each collection's top-scored venue independently put the National
 * Gallery on three covers at once: the collections overlap heavily and most of
 * them rank on rating. Assigning greedily in display order and skipping a venue
 * already used as a cover is enough to fix it, and it keeps each collection's
 * own ranking, so the cover is still that collection's best available place.
 *
 * An extra penalty for venues that qualify for many collections was tried and
 * removed: it changed nothing about uniqueness and made the covers worse, at
 * one point offering Windsor Castle as the face of "somewhere genuinely weird".
 */
export function collectionLeads(venues: Venue[]): Map<string, Venue> {
  const leads = new Map<string, Venue>();
  const used = new Set<string>();

  for (const c of COLLECTIONS) {
    const candidate = venuesFor(c, venues).find((v) => !used.has(v.name));
    if (candidate) {
      leads.set(c.slug, candidate);
      used.add(candidate.name);
    }
  }

  return leads;
}
