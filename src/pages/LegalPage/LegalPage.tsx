import type { ComponentChildren } from 'preact';
import { BackToTop } from '@/components/common/BackToTop';
import styles from './LegalPage.module.css';

export interface LegalPageProps {
  title: string;
  intro?: string;
  updated: string;
  children: ComponentChildren;
}

/** Shared shell for the policy pages so they stay visually consistent. */
export function LegalPage({ title, intro, updated, children }: LegalPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{title}</h1>
        {intro && <p className={styles.intro}>{intro}</p>}
        <p className={styles.updated}>Last updated: {updated}</p>
      </header>

      <div className={styles.body}>{children}</div>

      <BackToTop />
    </div>
  );
}
