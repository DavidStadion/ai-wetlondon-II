import { LegalPage } from '@/pages/LegalPage';
import styles from '@/pages/LegalPage/LegalPage.module.css';
import type { RouteProps } from '@/types';

export function AffiliatePage(_props: RouteProps) {
  return (
    <LegalPage
      title="Affiliate Disclosure"
      intro="How Wet London makes money, and what that does and doesn't change about what we recommend."
      updated="9 August 2026"
    >
      <div className={styles.callout}>
        <p>
          <strong>In short.</strong> Some “Book tickets” links earn us a small
          commission. It never costs you more, and we don't rank places higher because
          they pay.
        </p>
      </div>

      <h2>Affiliate links</h2>
      <p>
        Some links to venues, tickets and experiences are affiliate links. If you book
        through one, we may receive a small commission from that provider. The price
        you pay is exactly the same as going direct.
      </p>

      <h2>Advertising</h2>
      <p>
        We show adverts through Google AdSense. Adverts are clearly distinguishable
        from our editorial listings and are not endorsements.
      </p>

      <h2>Sponsored and featured listings</h2>
      <p>
        Some venues appear as <strong>Sponsored</strong>, <strong>Featured</strong> or{' '}
        <strong>Partner</strong> listings. Where a listing has been paid for, it is
        labelled as such on the card itself. Anything without a label is there because
        we think it's worth your time.
      </p>

      <h2>How this affects our recommendations</h2>
      <ul>
        <li>Wetness scores are applied on the same basis to every venue, paid or not.</li>
        <li>Whether a venue has an affiliate link doesn't change where it ranks in results.</li>
        <li>We include plenty of free places that earn us nothing at all.</li>
      </ul>

      <h2>Accuracy</h2>
      <p>
        Prices, opening hours and availability come from a mix of our own research and
        the Google Places API, and they change often. Always check the venue's own site
        before travelling. See our <a href="/terms">Terms &amp; Conditions</a>.
      </p>

      <h2>Questions</h2>
      <p>
        If you'd like to know whether a particular link is an affiliate link, just ask:{' '}
        <a href="mailto:wetlondonofficial@gmail.com">wetlondonofficial@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
