import { venues } from '@/signals/venueSignals';
import { COLLECTIONS, venuesFor } from '@/utils/collections';
import { useImageLoader } from '@/hooks/useImageLoader';
import type { Venue } from '@/types';
import styles from './CollectionsRail.module.css';

function Tile({ slug, title, titleAccent, count, lead }: {
  slug: string; title: string; titleAccent?: string; count: number; lead: Venue | undefined;
}) {
  const { src } = useImageLoader(lead?.name ?? '', lead?.type ?? []);

  return (
    <a className={styles.tile} href={`/collection/${slug}`}>
      <span className={styles.image} style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      <span className={styles.body}>
        <span className={styles.count}>{count} places</span>
        <span className={styles.title}>
          {title} {titleAccent && <em>{titleAccent}</em>}
        </span>
      </span>
    </a>
  );
}

/** Four collections on the homepage; the rest live on /collections. */
export function CollectionsRail() {
  const all = venues.value;
  if (all.length === 0) return null;

  const picks = COLLECTIONS.slice(0, 4).map((c) => ({
    c,
    list: venuesFor(c, all),
  }));

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.heading}>Collections</h2>
        <a className={styles.link} href="/collections">All collections</a>
      </div>

      <div className={styles.grid}>
        {picks.map(({ c, list }) => (
          <Tile
            key={c.slug}
            slug={c.slug}
            title={c.title}
            titleAccent={c.titleAccent}
            count={list.length}
            lead={list[0]}
          />
        ))}
      </div>
    </section>
  );
}
