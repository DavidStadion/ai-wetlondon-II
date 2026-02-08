import { useEffect } from 'preact/hooks';
import {
  partners,
  locationFilter,
  typeFilter,
  isPartnersLoading,
  partnersError,
  filteredPartners,
  resetPartnerFilters,
} from '@/signals/partnerSignals';
import { fetchPartners } from '@/utils/supabase';
import type { Partner, PartnerType, PartnerLocation, RouteProps } from '@/types';
import { PARTNER_TYPE_LABELS, PARTNER_LOCATION_LABELS } from '@/types/partner';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import styles from './PopupsPage.module.css';

const LOCATION_FILTERS: Array<{ value: PartnerLocation | 'all'; label: string }> = [
  { value: 'all', label: 'All London' },
  { value: 'central', label: 'Central' },
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
];

const TYPE_FILTERS: Array<{ value: PartnerType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'workshops', label: 'Workshops' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'pottery', label: 'Pottery' },
  { value: 'crafts', label: 'Crafts' },
  { value: 'art', label: 'Art' },
  { value: 'wellbeing', label: 'Wellbeing' },
];

interface PartnerCardProps {
  partner: Partner;
}

function PartnerCard({ partner }: PartnerCardProps) {
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
        <span className={`${styles.partnerPrice} ${partner.price === 0 ? styles.free : ''}`}>
          {partner.priceDisplay}
        </span>
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={styles.partnerBtn}>
          Visit Website
        </a>
      </div>
    </article>
  );
}

export function PopupsPage(_props: RouteProps) {
  useEffect(() => {
    async function loadPartners() {
      isPartnersLoading.value = true;
      partnersError.value = null;

      try {
        const data = await fetchPartners();
        partners.value = data;
      } catch (err) {
        partnersError.value = err instanceof Error ? err.message : 'Failed to load partners';
      } finally {
        isPartnersLoading.value = false;
      }
    }

    loadPartners();
  }, []);

  const loading = isPartnersLoading.value;
  const errorMsg = partnersError.value;
  const partnerList = filteredPartners.value;
  const currentLocation = locationFilter.value;
  const currentType = typeFilter.value;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.title}>Pop-Ups</h1>
        <p className={styles.tagline}>
          Discover pop-up workshops, classes, and creative experiences from London's best independent businesses. Perfect for rainy days.
        </p>

        {/* Location Filter */}
        <div className={styles.filterBar}>
          {LOCATION_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterChip} ${currentLocation === value ? styles.active : ''}`}
              onClick={() => { locationFilter.value = value; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className={styles.filterBar}>
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterChip} ${styles.typeFilter} ${currentType === value ? styles.active : ''}`}
              onClick={() => { typeFilter.value = value; }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Partners Container */}
      <section className={styles.container}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading partners...</p>
          </div>
        )}

        {!loading && errorMsg && (
          <div className={styles.noPartners}>
            <h3>Coming Soon</h3>
            <p>We're building our network of local London businesses. Check back soon!</p>
            <p>
              <a href="mailto:partners@wetlondon.co.uk" className={styles.link}>
                Interested in being featured?
              </a>
            </p>
          </div>
        )}

        {!loading && !errorMsg && partnerList.length === 0 && (
          <div className={styles.noPartners}>
            <p>No partners found matching your filters.</p>
            <button type="button" onClick={resetPartnerFilters} className={styles.link}>
              View all partners
            </button>
          </div>
        )}

        {!loading && !errorMsg && partnerList.length > 0 && (
          <div className={styles.partnersGrid}>
            {partnerList.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}

        {/* Become a Partner CTA */}
        <div className={styles.submitCta}>
          <h3 className={styles.ctaTitle}>Are you a local London business?</h3>
          <p className={styles.ctaText}>Join our Pop-ups directory and reach thousands of Londoners looking for indoor activities.</p>
          <Button
            as="a"
            href="mailto:partners@wetlondon.co.uk?subject=Pop-ups%20Partnership"
          >
            Become a Partner
          </Button>
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
