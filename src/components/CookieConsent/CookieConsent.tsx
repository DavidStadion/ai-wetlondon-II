import { useState } from 'preact/hooks';
import {
  isConsentBannerOpen,
  isConsentSettingsOpen,
  consentState,
  saveConsent,
} from '@/utils/consent';
import styles from './CookieConsent.module.css';

export function CookieConsent() {
  const showBanner = isConsentBannerOpen.value;
  const showSettings = isConsentSettingsOpen.value;

  const current = consentState.value;
  const [analytics, setAnalytics] = useState(current?.analytics === 'granted');
  const [ads, setAds] = useState(current?.ads === 'granted');

  if (!showBanner && !showSettings) return null;

  if (showSettings) {
    return (
      <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="Cookie settings">
        <div className={styles.panel}>
          <h2 className={styles.title}>Cookie settings</h2>
          <p className={styles.body}>
            Choose what you're happy for us to use. You can change this whenever you
            like from the footer.
          </p>

          <div className={styles.option}>
            <div>
              <strong>Strictly necessary</strong>
              <span>Needed for the site to work, and to remember this choice.</span>
            </div>
            <span className={styles.always}>Always on</span>
          </div>

          <label className={styles.option}>
            <div>
              <strong>Analytics</strong>
              <span>Google Analytics, so we can see which pages are useful.</span>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics((e.target as HTMLInputElement).checked)}
            />
          </label>

          <label className={styles.option}>
            <div>
              <strong>Advertising</strong>
              <span>Google AdSense, which pays for running the site.</span>
            </div>
            <input
              type="checkbox"
              checked={ads}
              onChange={(e) => setAds((e.target as HTMLInputElement).checked)}
            />
          </label>

          <div className={styles.panelActions}>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => { isConsentSettingsOpen.value = false; if (!consentState.value) isConsentBannerOpen.value = true; }}
            >
              Back
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => saveConsent(analytics ? 'granted' : 'denied', ads ? 'granted' : 'denied')}
            >
              Save choices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.banner} role="region" aria-label="Cookie notice">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <strong className={styles.heading}>A quick word about cookies</strong>
          <p className={styles.body}>
            We'd like to use analytics and advertising cookies. Analytics tells us which
            pages are worth keeping; advertising pays for the site. Neither runs unless
            you say yes. See our <a href="/cookies">Cookie Policy</a>.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => { isConsentBannerOpen.value = false; isConsentSettingsOpen.value = true; }}
          >
            Manage
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => saveConsent('denied', 'denied')}
          >
            Reject all
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => saveConsent('granted', 'granted')}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
