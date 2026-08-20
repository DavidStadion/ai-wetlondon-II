import { useEffect, useState } from 'preact/hooks';
import { currentPath, isActivityModalOpen } from '@/signals/uiSignals';
import { DRIP_FEED } from '@/utils/dripFeed';
import styles from './DripFeedPrompt.module.css';

/**
 * The site-wide nudge towards the Drip Feed.
 *
 * A bar along the bottom rather than a panel in the middle, and that is a
 * deliberate call rather than a design preference. Google treats interstitials
 * that cover the main content on mobile as a ranking signal against the page,
 * and it names banners using a reasonable amount of screen space as the
 * acceptable form. Given how much of this site's traffic is mobile search, a
 * centred overlay would be trading the rankings for the clicks. This gets the
 * close button and the try button asked for, in the shape that does not cost
 * anything.
 *
 * It also stays out of the way in the obvious ways: never on the feed itself,
 * never over an open modal, never again once dismissed, and never at all for
 * anyone who has already tried it.
 */

const DISMISSED_KEY = 'dripFeedPromptDismissed';
const TRIED_KEY = 'dripFeedTried';
const SNOOZE_DAYS = 14;

/** Far enough down that they are clearly browsing rather than just landing. */
const SCROLL_TRIGGER = 1200;

function suppressed(): boolean {
  try {
    if (localStorage.getItem(TRIED_KEY)) return true;
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    if (!at) return false;
    return Date.now() - at < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Private browsing can throw on access. Assume nothing and stay quiet.
    return true;
  }
}

export function DripFeedPrompt() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (suppressed()) return;

    let done = false;
    const onScroll = () => {
      if (done || window.scrollY < SCROLL_TRIGGER) return;
      done = true;
      setShow(true);
      window.removeEventListener('scroll', onScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Never on the feed itself, and never on top of something they opened.
  const onFeed = currentPath.value.startsWith(DRIP_FEED.path);
  if (!show || onFeed || isActivityModalOpen.value) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* not worth reporting */ }
    setLeaving(true);
    window.setTimeout(() => setShow(false), 220);
  };

  const tried = () => {
    try { localStorage.setItem(TRIED_KEY, '1'); } catch { /* not worth reporting */ }
  };

  return (
    <aside
      className={`${styles.bar} ${leaving ? styles.leaving : ''}`}
      aria-label={`Try the ${DRIP_FEED.name}`}
    >
      <div className={styles.copy}>
        <p className={styles.title}>{DRIP_FEED.promptTitle}</p>
        <p className={styles.body}>{DRIP_FEED.promptBody}</p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.dismiss} onClick={dismiss}>
          {DRIP_FEED.promptDismiss}
        </button>
        <a className={styles.try} href={DRIP_FEED.path} onClick={tried}>
          {DRIP_FEED.promptCta}
        </a>
      </div>
    </aside>
  );
}
