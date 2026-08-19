/**
 * What a wetness score actually means, in one place.
 *
 * These bands were written out separately in four files: dryness() in the
 * prerenderer, the legend on /about, the labels in FilterBar, and nowhere at all
 * on the card, which is the one place people look. A number between 0 and 100
 * tells you nothing on its own unless you already know what good looks like.
 *
 * Deliberately NOT merged with the wetness options in CustomizeModal. Those
 * describe what the visitor will put up with ("Happy to get wet"), which is a
 * different sentence from what a venue is ("Bring a brolly"). Same numbers,
 * opposite point of view, and collapsing them would make both worse.
 */
export interface WetnessBand {
  /** Inclusive upper bound. */
  max: number;
  /** What the venue is. Goes on the card and in the legend. */
  label: string;
  /** One line on what that means for the walk in. The tooltip text. */
  blurb: string;
  /** Sentence form, for prose in the prerendered venue pages. */
  prose: string;
}

export const WETNESS_BANDS: WetnessBand[] = [
  {
    max: 10,
    label: 'Bone dry',
    blurb: 'Door to door under cover',
    prose: 'you will stay bone dry',
  },
  {
    max: 40,
    label: 'Mostly dry',
    blurb: 'A few minutes in the open at most',
    prose: 'you will stay mostly dry',
  },
  {
    max: 100,
    label: 'Bring a brolly',
    blurb: 'A proper walk at one end of it',
    prose: 'expect to get a bit wet getting there',
  },
];

/** Clamped, so an out-of-range row in the database cannot fall off the end. */
export function wetnessBand(score: number): WetnessBand {
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  return WETNESS_BANDS.find((b) => s <= b.max) ?? WETNESS_BANDS[WETNESS_BANDS.length - 1];
}

/**
 * "0\u201310%", "10\u201340%", "40%+". En dash, matching the typography already on
 * /about, and the only place ranges are spelled out.
 */
export function bandRange(index: number): string {
  const from = index === 0 ? 0 : WETNESS_BANDS[index - 1].max;
  return index === WETNESS_BANDS.length - 1
    ? `${from}%+`
    : `${from}\u2013${WETNESS_BANDS[index].max}%`;
}
