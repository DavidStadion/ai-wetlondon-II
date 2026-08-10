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

export function AdSlot({ slotId, format = 'auto', layout, className }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const real = isRealSlot(slotId);

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
