import { useEffect, useRef } from 'preact/hooks';
import styles from './AdSlot.module.css';

export interface AdSlotProps {
  slotId: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  layout?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * AdSense slot IDs are numeric. Anything else (notably the "PLACEHOLDER" the
 * site shipped with) is not a slot, and rendering it meant visitors saw an
 * "Advertisement" label over an empty box while AdSense was handed an invalid
 * unit. Render nothing until a real ID exists.
 */
const isRealSlot = (id: string) => /^\d{6,}$/.test(id.trim());

/**
 * AdSense rejected the site for "low value content", so there is nothing
 * approved to serve. Until that changes the slot rendered an "Advertisement"
 * label above an empty 90px box with 4rem of margin: roughly 150px of reserved
 * nothing on the homepage and on /all-activities, on every visit.
 *
 * A code constant rather than an env var deliberately. It is not a secret, it
 * lives next to the explanation, and it cannot be forgotten in a dashboard where
 * changing it would need a redeploy to take effect anyway.
 *
 * Flip to true after AdSense approves the site.
 */
const ADSENSE_APPROVED = false;

/**
 * The AdSense script is loaded by consent.ts only once ads consent is granted,
 * not from index.html. So for anyone who declines ads the <ins> can never fill,
 * and rendering the slot would hold open the same empty box for them even after
 * the account is approved. Both conditions have to hold.
 */
const adsenseLoaded = () =>
  typeof document !== 'undefined'
  && document.querySelector('script[src*="googlesyndication.com"]') !== null;

export function AdSlot({ slotId, format = 'auto', layout, className }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const real = ADSENSE_APPROVED && isRealSlot(slotId) && adsenseLoaded();

  useEffect(() => {
    if (!real || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded, fail silently
    }
  }, [real]);

  if (!real) return null;

  const containerClass = [styles.adSlot, className].filter(Boolean).join(' ');

  return (
    <aside className={containerClass} aria-label="Advertisement">
      <span className={styles.label}>Advertisement</span>
      <ins
        className="adsbygoogle"
        ref={adRef}
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1382628707656079"
        data-ad-slot={slotId}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
