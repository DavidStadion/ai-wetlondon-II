import { LegalPage } from '@/pages/LegalPage';
import styles from '@/pages/LegalPage/LegalPage.module.css';
import type { RouteProps } from '@/types';

export function CookiesPage(_props: RouteProps) {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="What gets stored in your browser when you use Wet London, and how to turn it off."
      updated="9 August 2026"
    >
      <h2>What cookies are</h2>
      <p>
        Cookies are small files a site stores in your browser. Some are needed for the
        site to work; others measure how it's used or help fund it through
        advertising. Alongside cookies we also use your browser's{' '}
        <strong>local storage</strong>, which works similarly but stays entirely on
        your device.
      </p>

      <h2>What we use</h2>

      <h3>Strictly necessary</h3>
      <p>
        Needed for the site to function and for remembering your cookie choice. These
        can't be switched off.
      </p>

      <h3>Local storage (never leaves your device)</h3>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Purpose</th>
              <th scope="col">Expires</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>bookmarks</td>
              <td>The places you've saved</td>
              <td>Until you clear it</td>
            </tr>
            <tr>
              <td>recentlyViewed</td>
              <td>Places you've looked at, so we can show them again</td>
              <td>Until you clear it</td>
            </tr>
            <tr>
              <td>wet_london_images_cache</td>
              <td>Caches venue photos so pages load faster</td>
              <td>7 days</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We can't read any of these — they're only used by the site running in your own
        browser.
      </p>

      <h3>Analytics — Google Analytics 4</h3>
      <p>
        Sets cookies such as <code>_ga</code> and <code>_ga_*</code> to count visits
        and understand which pages people find useful. These typically last up to two
        years. You can opt out across all sites with the{' '}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Analytics Opt-out Browser Add-on
        </a>.
      </p>

      <h3>Advertising — Google AdSense</h3>
      <p>
        Google and its partners set cookies to serve adverts and limit how often you
        see the same one. Depending on your choices these may be used to personalise
        adverts. Manage this at{' '}
        <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer">
          Google My Ad Center
        </a>.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can change or withdraw your consent at any time using the cookie settings
        link, and you can block or delete cookies in your browser settings. Blocking
        everything won't break the site — saved places will still work, because those
        live in local storage rather than cookies.
      </p>

      <div className={styles.callout}>
        <p>
          Analytics and advertising cookies are only set after you accept them. Until
          then Google Consent Mode holds them in a denied state and neither script is
          loaded at all. You can change your mind at any time via{' '}
          <strong>Cookie settings</strong> in the footer.
        </p>
      </div>

      <h2>More detail</h2>
      <p>
        For the fuller picture of how we handle information, see our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalPage>
  );
}
