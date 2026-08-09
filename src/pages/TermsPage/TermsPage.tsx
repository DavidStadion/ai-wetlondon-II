import { LegalPage } from '@/pages/LegalPage';
import styles from '@/pages/LegalPage/LegalPage.module.css';
import type { RouteProps } from '@/types';

export function TermsPage(_props: RouteProps) {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="The terms you agree to by using Wet London. Nothing surprising — mostly that we're a free guide, not a booking agent."
      updated="9 August 2026"
    >
      <div className={styles.callout}>
        <p>
          <span className={styles.todo}>
            TODO: have a solicitor review before publishing
          </span>{' '}
          — this is a plain-English draft based on how the site works, not legal advice.
        </p>
      </div>

      <h2>Who we are</h2>
      <p>
        Wet London is operated by{' '}
        David Hampshire.
        By using the site you accept these terms. If you don't agree with them, please
        don't use the site.
      </p>

      <h2>What Wet London is</h2>
      <p>
        Wet London is a free guide to indoor things to do in London. We list places,
        describe them, and rate how exposed to the rain they are. We are{' '}
        <strong>not</strong> the venue, the organiser, or a booking agent. When you
        book, your contract is with the venue or ticket provider, not with us.
      </p>

      <h2>Accuracy of listings</h2>
      <p>
        We try to keep listings correct, but details change constantly and some
        information comes from third parties including the Google Places API. Opening
        hours, prices, accessibility details and availability may be out of date or
        wrong.
      </p>
      <p>
        <strong>Always check the venue's own website before you travel</strong>,
        particularly if you're relying on accessibility information, opening times, or
        a specific price.
      </p>

      <h2>Wetness scores</h2>
      <p>
        The wetness score is our own editorial judgement of how exposed to the weather
        a visit is likely to be. It's a guide, not a guarantee — treat it as an opinion
        rather than a measurement.
      </p>

      <h2>Reviews you submit</h2>
      <p>By submitting a review you confirm that:</p>
      <ul>
        <li>It reflects your genuine experience.</li>
        <li>It isn't unlawful, defamatory, offensive, or someone else's work.</li>
        <li>It contains no personal information about other people.</li>
      </ul>
      <p>
        You keep ownership of what you write, but grant us a non-exclusive, royalty-free
        licence to display it on the site. We may edit or remove reviews at our
        discretion — for example if they're spam or abusive.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Please don't scrape the site, attempt to disrupt it, or copy substantial parts
        of our listings for a competing service. Personal, non-commercial use is very
        welcome.
      </p>

      <h2>Links and third parties</h2>
      <p>
        The site links to venues, ticket providers and advertisers. We don't control
        those sites and aren't responsible for their content, prices or policies. Some
        links earn us a commission — see our{' '}
        <a href="/affiliate">Affiliate Disclosure</a>.
      </p>

      <h2>Liability</h2>
      <p>
        The site is provided free, “as is”. To the extent permitted by law we're not
        liable for loss arising from relying on the information here — for example a
        wasted journey because a venue's hours had changed. Nothing here limits
        liability for death or personal injury caused by negligence, for fraud, or for
        anything else that can't lawfully be excluded.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Wet London name, design, written descriptions and wetness scoring are ours.
        Venue photographs are supplied via the Google Places API and remain the property
        of their respective owners.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top shows when they last changed, and
        continuing to use the site means you accept the current version.
      </p>

      <h2>Law</h2>
      <p>
        These terms are governed by the laws of{' '}
        England and Wales,
        and its courts have exclusive jurisdiction.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href="/contact">get in touch</a>.
      </p>
    </LegalPage>
  );
}
