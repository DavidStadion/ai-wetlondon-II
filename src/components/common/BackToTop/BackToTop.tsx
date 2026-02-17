import { useEffect, useCallback } from 'preact/hooks';
import { signal } from '@preact/signals';
import styles from './BackToTop.module.css';

const showButton = signal(false);

export function BackToTop() {
  useEffect(() => {
    function handleScroll() {
      showButton.value = window.scrollY > 500;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      type="button"
      className={`${styles.backToTop} ${showButton.value ? styles.show : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5l-7 7 1.4 1.4L11 8.8V20h2V8.8l4.6 4.6L19 12z" fill="currentColor"/>
      </svg>
    </button>
  );
}
