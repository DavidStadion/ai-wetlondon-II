import styles from './RouteFallback.module.css';

/**
 * Shown while a route's chunk downloads. It reserves roughly a screen of
 * height so the footer does not jump up and then back down again.
 */
export function RouteFallback() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.label}>Loading</span>
    </div>
  );
}
