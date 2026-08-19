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
 *
 * On the thresholds. The scale is nominally 0-100 but the data only occupies
 * 0-60: the wettest things on the site are Egg London and the Royal Albert Hall
 * at 60%, and the median venue is 5%. Three bands split at 10/40 put 72% of
 * venues in "Bone dry" and 5 venues in the top band, so in practice a visitor
 * scrolling the homepage saw two labels and mostly one. These four split where
 * the venues actually are, which is the only thing that makes a label useful:
 *
 *   Bone dry       198 venues   58%
 *   Mostly dry      87          26%
 *   A bit damp      46          13%
 *   Bring a brolly  10           3%
 *
 * There is no "Drenched" tier because nothing would be in it. Add one the day
 * something scores above 65 and it is one entry in this array.
 */
export interface WetnessBand {
  /** Inclusive upper bound. */
  max: number;
  /** What the venue is. Goes on the card and in the legend. */
  label: string;
  /** One line on what that means for the walk in. The card tooltip. */
  blurb: string;
  /** Sentence form, for prose in the prerendered venue pages. */
  prose: string;
  /** The longer explanation, for the legend on /about. */
  detail: string;
}

export const WETNESS_BANDS: WetnessBand[] = [
  {
    max: 5,
    label: 'Bone dry',
    blurb: 'Door to door under cover',
    prose: 'you will stay bone dry',
    detail:
      'Straight off the tube or a few steps from it, and everything you came for is inside.',
  },
  {
    max: 20,
    label: 'Mostly dry',
    blurb: 'A minute or two in the open',
    prose: 'you will stay mostly dry',
    detail:
      'A short dash from a station, or a courtyard between buildings. A coat will do it.',
  },
  {
    max: 35,
    label: 'A bit damp',
    blurb: 'Five or ten minutes exposed',
    prose: 'expect to get a bit damp getting there',
    detail:
      'A real walk at one end, or a bit of the visit is genuinely outside. Hood up.',
  },
  {
    max: 100,
    label: 'Bring a brolly',
    blurb: 'A proper walk at one end of it',
    prose: 'expect to get properly wet getting there',
    detail:
      'A proper walk at either end, or much of the visit is outside. Worth it, but know before you go.',
  },
];

/** Clamped, so an out-of-range row in the database cannot fall off the end. */
export function wetnessBand(score: number): WetnessBand {
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  return WETNESS_BANDS.find((b) => s <= b.max) ?? WETNESS_BANDS[WETNESS_BANDS.length - 1];
}

/**
 * "0–5%", "5–20%", "20–35%", "35%+". En dash, matching the typography
 * already on /about, and the only place ranges are spelled out.
 */
export function bandRange(index: number): string {
  const from = index === 0 ? 0 : WETNESS_BANDS[index - 1].max;
  return index === WETNESS_BANDS.length - 1
    ? `${from}%+`
    : `${from}–${WETNESS_BANDS[index].max}%`;
}
