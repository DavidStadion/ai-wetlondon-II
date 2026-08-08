import type { ComponentChildren } from 'preact';
import styles from './PromoBand.module.css';

export interface PromoBandProps {
  /** Plain part of the headline. */
  title: string;
  /** Trailing words set in italic serif, e.g. "an Insider?" */
  titleAccent?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  /** 'bold' = saturated colour block; 'soft' = warm neutral block. */
  tone?: 'bold' | 'soft';
  /** 'center' for a statement band, 'split' for headline left / content right. */
  layout?: 'center' | 'split';
  children?: ComponentChildren;
}

export function PromoBand({
  title,
  titleAccent,
  body,
  ctaLabel,
  ctaHref,
  onCta,
  tone = 'bold',
  layout = 'center',
  children,
}: PromoBandProps) {
  const cta = ctaLabel && (
    ctaHref ? (
      <a className={styles.cta} href={ctaHref}>{ctaLabel}</a>
    ) : (
      <button type="button" className={styles.cta} onClick={onCta}>{ctaLabel}</button>
    )
  );

  return (
    <section
      className={[
        styles.band,
        tone === 'soft' ? styles.soft : styles.bold,
        layout === 'split' ? styles.split : styles.center,
      ].join(' ')}
    >
      <div className={styles.inner}>
        <h2 className={styles.title}>
          {title}
          {titleAccent && <> <em>{titleAccent}</em></>}
        </h2>
        {body && <p className={styles.body}>{body}</p>}
        {children}
        {cta}
      </div>
    </section>
  );
}
