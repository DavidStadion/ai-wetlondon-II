import { Fragment } from 'preact';
import { useEffect } from 'preact/hooks';
import { venues, isLoading } from '@/signals/venueSignals';
import { selectedVenue, isActivityModalOpen } from '@/signals/uiSignals';
import { fetchVenues } from '@/utils/supabase';
import { setPageMeta, resetPageMeta } from '@/utils/meta';
import { buildFamilySections, isFamilyVenue } from '@/utils/family';
import { useImageLoader } from '@/hooks/useImageLoader';
import { ActivityCard } from '@/components/ActivityCard';
import { ClubBand } from '@/components/ClubBand';
import { ActivityModal } from '@/components/modals/ActivityModal';
import { BackToTop } from '@/components/common/BackToTop';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Venue, RouteProps } from '@/types';
import styles from './KidsPage.module.css';

export function KidsPage(_props: RouteProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    setPageMeta({
      title: 'Things to do with kids in London when it rains | Wet London',
      description:
        'Indoor London with children: free museums, hands-on places, step-free and buggy-friendly, and the short visits that suit a bad day. Rated by how dry you will stay.',
      path: '/kids',
    });

    async function load() {
      if (venues.value.length > 0) return;
      isLoading.value = true;
      try {
        venues.value = await fetchVenues();
      } catch {
        // empty state covers it
      } finally {
        isLoading.value = false;
      }
    }
    load();

    return resetPageMeta;
  }, []);

  const selected = selectedVenue.value;
  const { src: modalImageUrl } = useImageLoader(selected?.name ?? '', selected?.type ?? []);

  const all = venues.value;
  const sections = buildFamilySections(all);
  const familyCount = all.filter(isFamilyVenue).length;

  const open = (venue: Venue) => {
    selectedVenue.value = venue;
    isActivityModalOpen.value = true;
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          Rain, and a small person who <em>will not be reasoned with</em>
        </h1>
        <p className={styles.tagline}>
          {familyCount > 0 ? `${familyCount} indoor places in London` : 'Indoor London'} that
          work with children in tow. Sorted by the things you actually need to know
          before you leave the house.
        </p>
      </header>

      <section className={styles.container}>
        {isLoading.value && <LoadingSpinner text="Loading..." />}

        {!isLoading.value && sections.map(({ edit, venues: list, total }, i) => (
          <Fragment key={edit.slug}>
            <section className={styles.edit} id={edit.slug}>
              <div className={styles.editHead}>
                <h2 className={styles.editTitle}>
                  {edit.title} {edit.titleAccent && <em>{edit.titleAccent}</em>}
                </h2>
                <p className={styles.editBlurb}>{edit.blurb}</p>
                <span className={styles.editCount}>
                  {total} {total === 1 ? 'place' : 'places'}
                </span>
              </div>

              <div className={styles.grid}>
                {list.map((venue) => (
                  <ActivityCard
                    key={`${edit.slug}-${venue.name}`}
                    venue={venue}
                    onClick={() => open(venue)}
                  />
                ))}
              </div>
            </section>

            {i === 1 && (
              <ClubBand source="kids" />
            )}
          </Fragment>
        ))}

        {!isLoading.value && sections.length > 0 && (
          <aside className={styles.honesty}>
            <h2 className={styles.honestyTitle}>How we work this out</h2>
            <div className={styles.honestyText}>
            <p>
              We read this from what each venue publishes: step-free and lift access,
              whether there are toilets, whether there is a cafe, how long a visit
              takes, and whether the place calls itself family friendly.
            </p>
            <p>
              It is a good starting point, not an inspection. We have not pushed a
              buggy round all of them, and access details change. If you need to be
              certain about a lift, a changing table or a quiet hour, ring ahead. If
              we have something wrong,{' '}
              <a href="/contact">tell us</a> and we will fix it.
            </p>
            </div>
          </aside>
        )}
      </section>

      <BackToTop />

      <ActivityModal
        venue={selectedVenue.value}
        isOpen={isActivityModalOpen.value}
        onClose={() => { isActivityModalOpen.value = false; }}
        imageUrl={modalImageUrl}
      />
    </div>
  );
}
