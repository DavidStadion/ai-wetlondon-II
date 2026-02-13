import type { Partner } from '@/types/partner';
import { PARTNER_TYPE_LABELS, PARTNER_LOCATION_LABELS } from '@/types/partner';
import styles from './PartnerCard.module.css';

interface PartnerCardProps {
  partner: Partner;
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const imageUrl = partner.imageFilename
    ? `assets/smallandmighty/${partner.imageFilename}`
    : 'assets/smallandmighty/placeholder.svg';

  const linkUrl = partner.affiliateLink || partner.websiteUrl || '#';

  return (
    <article className={styles.partnerCard}>
      <div
        className={styles.partnerImage}
        style={{ backgroundImage: `url('${imageUrl}')` }}
      >
        <span className={styles.partnerBadge}>Pop-up</span>
      </div>

      <div className={styles.partnerContent}>
        <div className={styles.partnerType}>{PARTNER_TYPE_LABELS[partner.type]}</div>
        <h3 className={styles.partnerTitle}>{partner.name}</h3>
        <div className={styles.partnerLocation}>
          {PARTNER_LOCATION_LABELS[partner.location]} London
        </div>
        <p className={styles.partnerDescription}>{partner.description}</p>
      </div>

      <div className={styles.partnerFooter}>
        <span className={styles.partnerPrice}>
          {partner.priceDisplay}
        </span>
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={styles.partnerBtn}>
          Visit Website
        </a>
      </div>
    </article>
  );
}
