import { useRef, useState, useCallback, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import styles from './Carousel.module.css';

export interface CarouselProps {
  children: ComponentChildren;
  /** Cards visible at desktop width. Controls track item sizing. */
  perView?: 3 | 4;
  ariaLabel?: string;
}

/**
 * Horizontal scroll rail with circular arrow controls.
 * Cards deliberately peek past the right edge to signal scrollability.
 */
export function Carousel({ children, perView = 4, ariaLabel }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges, children]);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  }, []);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowPrev}`}
        onClick={() => scrollBy(-1)}
        disabled={atStart}
        aria-label="Scroll left"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        ref={trackRef}
        className={`${styles.track} ${perView === 3 ? styles.track3 : styles.track4}`}
        onScroll={updateEdges}
        aria-label={ariaLabel}
      >
        {children}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowNext}`}
        onClick={() => scrollBy(1)}
        disabled={atEnd}
        aria-label="Scroll right"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
