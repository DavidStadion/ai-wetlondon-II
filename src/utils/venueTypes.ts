/**
 * Canonical venue types.
 *
 * The database grew two tags for the same thing: 22 venues typed `games` and 21
 * typed `gaming`. Only `gaming` has a category page, so F1 Arcade, Fairgame,
 * Boom Battle Bar, Flight Club, Immersive Gamebox, Monopoly Lifesized, Sixes
 * Cricket, Clays, Swingers City and nine others were invisible on
 * /category/gaming, which is exactly the page someone would go looking for them
 * on. The page showed 21 venues where it should have shown 39.
 *
 * Normalised on read rather than with an UPDATE, because it keeps the fix in
 * code where it is reviewable and needs no hand-run SQL against 341 rows.
 *
 * Only add a pair here when the two tags genuinely mean the same thing.
 * `art` and `galleries`, `books` and `libraries`, `bar` and `nightlife`,
 * `history` and `historic`, `food` and `dining` are all arguably distinct
 * editorial choices, so they are deliberately left alone. There are also 53
 * venues tagged `tours` with no category page at all, which is a decision about
 * whether tours belong on the site rather than a tagging bug.
 */
export const TYPE_ALIASES: Record<string, string> = {
  games: 'gaming',
};

/** Lowercases and folds known synonyms onto the tag that owns a category page. */
export function canonicalType(type: string): string {
  const t = String(type).trim().toLowerCase();
  return TYPE_ALIASES[t] ?? t;
}
