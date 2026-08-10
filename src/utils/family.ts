import type { Venue } from '@/types';

/**
 * Family signals, derived from the tags the venues already carry.
 *
 * A parent needs different things from a general visitor: can I get a buggy in,
 * is there a loo, can we bail out after forty minutes, is there anywhere to
 * feed anyone. None of that is a single field in the database, so this reads it
 * out of `prerequisites`, `type`, price and the description.
 *
 * The tags are inconsistent by hand ("toilets" and "toilets available", "cafe"
 * and "cafe on-site", "family-friendly" and "child-friendly"), so each signal
 * accepts every spelling rather than trusting one.
 *
 * These are inferences, not inspections. `confidence` says how much the venue
 * actually told us, and the page is careful not to promise more than that.
 */

const norm = (v: Venue) =>
  (Array.isArray(v.prerequisites) ? v.prerequisites : []).map((p) =>
    String(p).toLowerCase().trim(),
  );

const any = (tags: string[], ...needles: string[]) =>
  tags.some((t) => needles.some((n) => t.includes(n)));

const text = (v: Venue) => `${v.name} ${v.description}`.toLowerCase();

const hasType = (v: Venue, ...types: string[]) =>
  v.type.some((t) => types.includes(String(t).toLowerCase()));

export interface FamilyProfile {
  /** Step-free or lift access, so a buggy is not a fight. */
  buggyFriendly: boolean;
  /** Somewhere to change or take a child mid-visit. */
  toilets: boolean;
  /** Somewhere to feed people without leaving. */
  food: boolean;
  /** Things to touch and do, not just look at. */
  handsOn: boolean;
  /** The venue itself says it is for families. */
  saysFamily: boolean;
  /** Doable inside two hours, which is about the honest limit. */
  shortVisit: boolean;
  /** Calm rather than loud and strobing. */
  calm: boolean;
  free: boolean;
  /** Loud, late or otherwise clearly not for children. */
  adultsOnly: boolean;
  /** 0-100. Higher is a better bet with children in tow. */
  score: number;
  /** How many family signals the data actually gave us, 0-1. */
  confidence: number;
}

/** Places we should never put in front of a parent looking for a day out. */
function isAdultsOnly(v: Venue): boolean {
  if (hasType(v, 'nightlife', 'club', 'bars', 'cocktails', 'karaoke', 'spa', 'wellness')) return true;
  return /\bbar\b|cocktail|nightclub|speakeasy|burlesque|casino|adults only|18\+|over-18|wine tasting|gin tasting|brewery tour/.test(
    text(v),
  );
}

export function familyProfile(v: Venue): FamilyProfile {
  const tags = norm(v);

  const buggyFriendly = any(tags, 'step-free', 'lift access', 'pram', 'buggy', 'wheelchair accessible');
  const toilets = any(tags, 'toilet', 'baby chang', 'changing facilit');
  const food = any(tags, 'cafe', 'restaurant', 'food', 'picnic');
  const handsOn =
    any(tags, 'interactive', 'educational', 'hands-on', 'workshop') ||
    hasType(v, 'science', 'gaming', 'games', 'workshops', 'immersive', 'aquariums') ||
    /interactive|hands-on|touch|build|make your own|dress up|dinosaur/.test(text(v));
  const saysFamily =
    any(tags, 'family', 'child', 'kid') ||
    hasType(v, 'kids', 'family') ||
    /children|kids|family|toddler|under-5|under 5/.test(text(v));
  const shortVisit = any(tags, 'under 1 hour', 'under 2 hours');
  const calm = any(tags, 'quiet environment', 'quiet') || hasType(v, 'libraries');
  const free = v.price === 0;
  const adultsOnly = isAdultsOnly(v);

  // Weighted so the things a parent asks first count most.
  let score = 0;
  if (saysFamily) score += 30;
  if (handsOn) score += 20;
  if (buggyFriendly) score += 15;
  if (toilets) score += 10;
  if (food) score += 10;
  if (free) score += 8;
  if (shortVisit) score += 7;
  if (v.wetnessScore <= 20) score += 5;
  if (adultsOnly) score = 0;

  // Six signals we could plausibly have learned about.
  const known = [saysFamily, handsOn, buggyFriendly, toilets, food, shortVisit].filter(Boolean).length;

  return {
    buggyFriendly, toilets, food, handsOn, saysFamily, shortVisit, calm, free, adultsOnly,
    score: Math.min(100, score),
    confidence: known / 6,
  };
}

/** Anything a parent could reasonably be sent to. */
export function isFamilyVenue(v: Venue): boolean {
  const p = familyProfile(v);
  return !p.adultsOnly && p.score >= 30;
}

export interface FamilyEdit {
  slug: string;
  title: string;
  titleAccent?: string;
  /** Answers the query in the reader's own words. */
  blurb: string;
  match: (v: Venue, p: FamilyProfile) => boolean;
  score?: (v: Venue, p: FamilyProfile) => number;
}

/**
 * Sections of the pillar page. Each one is a question parents actually type,
 * rather than a category we happen to have.
 */
export const FAMILY_EDITS: FamilyEdit[] = [
  {
    slug: 'rainy-day',
    title: 'Rainy day, kids climbing',
    titleAccent: 'the walls',
    blurb:
      'Fully indoors, straight off the tube, and enough going on to hold a small person for the afternoon.',
    match: (v, p) => !p.adultsOnly && p.saysFamily && v.wetnessScore <= 20,
    score: (_v, p) => p.score,
  },
  {
    slug: 'free',
    title: 'Brilliant with kids and',
    titleAccent: 'completely free',
    blurb:
      'A wet afternoon does not have to cost anything. All of these are free to walk into.',
    match: (v, p) => !p.adultsOnly && p.free && p.score >= 30,
    score: (_v, p) => p.score,
  },
  {
    slug: 'hands-on',
    title: 'Things they can actually',
    titleAccent: 'touch',
    blurb:
      'Buttons, levers, dressing up, building things. Places where "do not touch" is not the main rule.',
    match: (v, p) => !p.adultsOnly && p.handsOn && p.score >= 30,
    score: (_v, p) => p.score + (p.saysFamily ? 10 : 0),
  },
  {
    slug: 'quick-win',
    title: 'In and out in',
    titleAccent: 'under two hours',
    blurb:
      'For the days when that is all anyone has in them. Yours included.',
    match: (v, p) => !p.adultsOnly && p.shortVisit && p.score >= 30 && v.wetnessScore <= 30,
    score: (_v, p) => p.score,
  },
  {
    slug: 'buggy',
    title: 'Step-free, lift access,',
    titleAccent: 'buggy welcome',
    blurb:
      'No stairs to wrestle, no cloakroom argument. Worth knowing before you set off.',
    match: (v, p) => !p.adultsOnly && p.buggyFriendly && p.score >= 30,
    score: (_v, p) => p.score + (p.toilets ? 8 : 0),
  },
  {
    slug: 'loo-and-a-cafe',
    title: 'There is a loo and',
    titleAccent: 'somewhere to eat',
    blurb:
      'The two things that decide whether an outing survives to the end. Both on site.',
    match: (v, p) => !p.adultsOnly && p.toilets && p.food && p.score >= 30,
    score: (_v, p) => p.score,
  },
];

export function venuesForEdit(edit: FamilyEdit, venues: Venue[]): Venue[] {
  const scored = venues
    .map((v) => ({ v, p: familyProfile(v) }))
    .filter(({ v, p }) => edit.match(v, p));

  const rank = edit.score ?? ((_v: Venue, p: FamilyProfile) => p.score);
  return scored
    .sort((a, b) => rank(b.v, b.p) - rank(a.v, a.p) || b.v.rating - a.v.rating)
    .map(({ v }) => v);
}

export function getFamilyEdit(slug: string): FamilyEdit | undefined {
  return FAMILY_EDITS.find((e) => e.slug === slug);
}

/**
 * Sections for the pillar page, with a venue held back once it has led two
 * sections.
 *
 * Without this the page reads badly: score dominates every ranking, so the
 * Natural History Museum and two others topped five sections out of six and the
 * page looked like it only knew three places. A venue can still appear twice,
 * because pretending the best places are not the best places would be worse.
 */
export function buildFamilySections(
  venues: Venue[],
  perSection = 8,
): Array<{ edit: FamilyEdit; venues: Venue[]; total: number }> {
  const appearances = new Map<string, number>();

  return FAMILY_EDITS.map((edit) => {
    const all = venuesForEdit(edit, venues);

    const fresh: Venue[] = [];
    const repeats: Venue[] = [];
    for (const v of all) {
      ((appearances.get(v.name) ?? 0) < 2 ? fresh : repeats).push(v);
    }

    // Fall back to repeats only if the section would otherwise look empty.
    const picked = [...fresh, ...repeats].slice(0, perSection);
    picked.forEach((v) => appearances.set(v.name, (appearances.get(v.name) ?? 0) + 1));

    return { edit, venues: picked, total: all.length };
  }).filter((s) => s.venues.length >= 3);
}
