import { Button } from '@/components/common/Button';
import { DropMark } from '@/components/DropMark';
import type { RouteProps } from '@/types';
import styles from './NotFoundPage.module.css';

export function NotFoundPage(_props: RouteProps) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* He looks down and away here, and stops glancing about. A cheerful
            hopping mascot on a dead end reads as not having noticed. */}
        <DropMark size={72} mood="lost" className={styles.drop} />
        <span className={styles.eyebrow}>Error 404</span>
        <h1 className={styles.title}>
          This one's washed <em>away.</em>
        </h1>
        <p className={styles.text}>
          We can't find that page. It may have moved, or the link might be out of date.
        </p>
        <div className={styles.actions}>
          <Button as="a" href="/" variant="accent">Back to Wet London</Button>
          <Button as="a" href="/all-activities" variant="secondary">Browse all activities</Button>
        </div>
      </div>
    </div>
  );
}
