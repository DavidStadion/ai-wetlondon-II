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
import type { PartnerType, PartnerLocation, RouteProps } from '@/types';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FilterChipBar } from '@/components/common/FilterChipBar';
import { PartnerCard } from '@/components/PartnerCard';
import { PromoBand } from '@/components/common/PromoBand';
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
        <FilterChipBar
          options={LOCATION_FILTERS}
          selected={currentLocation}
          onSelect={(value) => { locationFilter.value = value; }}
        />

        {/* Type Filter */}
        <FilterChipBar
          options={TYPE_FILTERS}
          selected={currentType}
          onSelect={(value) => { typeFilter.value = value; }}
        />
      </section>

      {/* Partners Container */}
      <section className={styles.container}>
        {loading && <LoadingSpinner text="Loading partners..." />}

        {!loading && errorMsg && (
          <div className={styles.noPartners}>
            <h3>Coming Soon</h3>
            <p>We're building our network of local London businesses. Check back soon!</p>
            <p>
              <a href="mailto:wetlondonofficial@gmail.com" className={styles.link}>
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
      </section>

      <PromoBand
        title="Are you a local London"
        titleAccent="business?"
        body="Join the Pop-ups directory and reach thousands of Londoners hunting for something to do indoors."
        ctaLabel="Become a partner"
        ctaHref="mailto:wetlondonofficial@gmail.com?subject=Pop-ups%20Partnership"
        tone="bold"
      />

      <BackToTop />
    </div>
  );
}
