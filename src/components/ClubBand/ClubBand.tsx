import { PromoBand } from '@/components/common/PromoBand';
import { JoinClub } from '@/components/JoinClub';

interface ClubBandProps {
  /**
   * Where on the site this band sits. Stored against the signup, so it is
   * possible to see which placement actually earns subscribers rather than
   * guessing.
   */
  source: string;
}

/**
 * The rain alert signup, inline and mid-page.
 *
 * Deliberately the form itself rather than a button pointing at the footer: the
 * old promo asked people to travel to convert, which is the surest way to lose
 * them. Always the bold tone, so it gets the white rain.
 */
export function ClubBand({ source }: ClubBandProps) {
  return (
    <PromoBand
      title="Never get caught out"
      titleAccent="again."
      body="One email on the mornings rain is coming, with somewhere dry worth going. Nothing else, ever."
      tone="bold"
      mascot
    >
      <JoinClub source={source} compact />
    </PromoBand>
  );
}
