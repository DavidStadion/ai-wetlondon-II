import { LegalPage } from '@/pages/LegalPage';
import styles from '@/pages/LegalPage/LegalPage.module.css';
import type { RouteProps } from '@/types';

/**
 * Drafted from what the application actually does. Anything only the site owner
 * can supply is marked with a TODO span so it is impossible to publish by accident.
 */
export function PrivacyPage(_props: RouteProps) {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="How Wet London handles information when you use the site. We've tried to write this in plain English rather than legalese."
      updated="9 August 2026"
    >
      <div className={styles.callout}>
        <p>
          <strong>The short version.</strong> We don't ask you to create an account, we
          don't ask for your location, and your saved places never leave your own
          device. We do use Google Analytics and Google AdSense, which set cookies.
          If you post a review, whatever you type is stored and shown publicly.
        </p>
      </div>

      <h2>Who we are</h2>
      <p>
        Wet London (“we”, “us”) runs the website at wetlondon.co.uk, a free guide to
        indoor things to do in London. For data protection purposes the data
        controller is{' '}
        David Hampshire
        {', '}
        <span className={styles.todo}>TODO: your registered address</span>.
      </p>
      <p>
        If you have any question about this policy or about your information, email us
        at <a href="mailto:wetlondonofficial@gmail.com">wetlondonofficial@gmail.com</a>.
      </p>

      <h2>What we collect</h2>

      <h3>Information you choose to give us</h3>
      <p>
        The only place the site asks you to type anything about yourself is the venue
        review form. If you submit a review we store the <strong>display name you
        type</strong>, your <strong>star rating</strong>, your <strong>review
        text</strong>, and which venue it relates to. Please note that reviews are
        published on the site, so don't include anything you wouldn't want shown
        publicly. You can use a nickname, as we don't verify names.
      </p>

      <h3>Information stored only on your device</h3>
      <p>
        Your saved places and your recently viewed list are kept in your browser's
        local storage. They are never transmitted to us and we cannot see them. They
        stay on that browser on that device, so they won't follow you to your phone,
        and clearing your browser data removes them. The site also caches venue images
        locally to reduce loading time.
      </p>

      <h3>Information collected automatically</h3>
      <p>
        Like most websites, our hosting provider and analytics receive standard
        technical information such as your IP address, browser type, device type,
        referring page and the pages you view. We use Google Analytics to understand
        which parts of the site are useful. See <a href="/cookies">Cookies</a> for
        detail and how to opt out.
      </p>

      <h3>What we do <em>not</em> collect</h3>
      <ul>
        <li>We never ask for your location. Weather is shown for central London using fixed coordinates, not your position.</li>
        <li>There are no user accounts, so no passwords.</li>
        <li>We don't take payments, so we never see card details. Bookings happen on the venue's own site.</li>
      </ul>

      <h2>Why we use it, and our legal basis</h2>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th scope="col">What</th>
              <th scope="col">Why</th>
              <th scope="col">Legal basis (UK GDPR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Reviews you submit</td>
              <td>To show other visitors what a place is like</td>
              <td>Consent, you choose to submit it</td>
            </tr>
            <tr>
              <td>Analytics cookies</td>
              <td>To see which pages are used and improve them</td>
              <td>Consent, via the cookie banner</td>
            </tr>
            <tr>
              <td>Advertising cookies</td>
              <td>To fund the site through advertising</td>
              <td>Consent, via the cookie banner</td>
            </tr>
            <tr>
              <td>Server and security logs</td>
              <td>To keep the site running and prevent abuse</td>
              <td>Legitimate interests</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Who else is involved</h2>
      <p>
        We don't sell your information. We do rely on a small number of services to
        make the site work, and they process data on our behalf or as their own
        controller:
      </p>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">What it does here</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vercel</td>
              <td>Hosts the site and processes standard request logs</td>
            </tr>
            <tr>
              <td>Supabase</td>
              <td>Stores venue data and any reviews you submit</td>
            </tr>
            <tr>
              <td>Google Analytics</td>
              <td>Measures site usage</td>
            </tr>
            <tr>
              <td>Google AdSense</td>
              <td>Serves the adverts that fund the site</td>
            </tr>
            <tr>
              <td>Google Places</td>
              <td>Supplies venue photos, ratings, opening hours. We send venue names, never anything about you</td>
            </tr>
            <tr>
              <td>Open-Meteo</td>
              <td>Supplies London weather. Fixed coordinates, no personal data</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Some of these providers are based outside the UK, so information may be
        transferred internationally under the safeguards those providers operate.
      </p>

      <h2>Advertising</h2>
      <p>
        This site is funded partly by advertising through Google AdSense and partly by
        affiliate links. See our <a href="/affiliate">Affiliate Disclosure</a>. Google
        and its partners may use cookies to show adverts based on your prior visits to
        this and other sites. You can control this at{' '}
        <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer">
          Google My Ad Center
        </a>{' '}
        or opt out of personalised advertising at{' '}
        <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer">
          aboutads.info
        </a>.
      </p>

      <h2>How long we keep things</h2>
      <ul>
        <li><strong>Reviews</strong>: kept while they're useful and relevant, or until you ask us to remove them.</li>
        <li><strong>Saved places and recently viewed</strong>: on your device until you clear them; we hold no copy.</li>
        <li><strong>Analytics</strong>: retained according to the Google Analytics retention setting, currently <span className={styles.todo}>TODO: confirm your GA4 retention period</span>.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Under UK data protection law you can ask us to give you a copy of your
        information, correct it, delete it, restrict how we use it, or object to our
        using it. You can also withdraw cookie consent at any time. To exercise any of
        these, email{' '}
        <a href="mailto:wetlondonofficial@gmail.com">wetlondonofficial@gmail.com</a>. Please
        tell us the display name and roughly when you posted, so we can find the right
        review.
      </p>
      <p>
        If you're unhappy with how we've handled your information you can complain to
        the Information Commissioner's Office at{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
      </p>

      <h2>Children</h2>
      <p>
        Wet London is a general audience site about days out and isn't directed at
        children. We don't knowingly collect information from anyone under 13. If you
        believe a child has submitted a review, contact us and we'll remove it.
      </p>

      <h2>Changes</h2>
      <p>
        If we change how we handle information we'll update this page and the date
        above. Material changes will be flagged on the site.
      </p>
    </LegalPage>
  );
}
