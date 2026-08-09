import { partners } from '@/signals/partnerSignals';
import { PartnerCard } from '@/components/PartnerCard';
import styles from './PopupsSection.module.css';

export function PopupsSection() {
  const topPartners = partners.value.slice(0, 3);

  if (topPartners.length === 0) return null;

  return (
    <section className={`${styles.section} popupsInverted`}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title}>Pop-ups</h2>
          <a
            href="/popups"
            className={styles.viewAll}
            onClick={() => { window.scrollTo(0, 0); }}
          >
            View all pop-ups
          </a>
        </div>
        <p className={styles.subtitle}>
          Discover pop-up workshops, classes, and creative experiences from local London businesses
        </p>
        <div className={styles.grid}>
          {topPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  );
}
