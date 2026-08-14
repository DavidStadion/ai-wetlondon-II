import { totalActivities, freeEntryCount } from '@/signals/venueSignals';
import styles from './WelcomeBand.module.css';

/**
 * The "what this is" block on the homepage.
 *
 * The homepage had no prose on it at all: a visitor who did not already know
 * what a wetness score was got no explanation, and a crawler got a page of card
 * titles with nothing to say what the site is for.
 *
 * The counts come from the venue signals rather than being written into the
 * copy, so the numbers cannot drift from the database.
 */
export function WelcomeBand() {
  const total = totalActivities.value;
  const free = freeEntryCount.value;

  return (
    <section className={styles.band} aria-labelledby="welcome-heading">
      <div className={styles.inner}>
        <h2 id="welcome-heading" className={styles.lead}>
          Everything worth doing indoors in London, rated by how wet you will get
          on the way.
        </h2>

        <div className={styles.body}>
          <p>
            It rains here about one day in three, which is a statistic you only
            really feel while standing under a bus shelter working out whether
            the afternoon is still worth it. So everywhere on this site carries a{' '}
            <a href="/about">wetness score</a>: how much of the trip is under a
            roof, how far the door is from the tube, and whether you will walk in
            looking like you swam.
            {total > 0 && (
              <>
                {' '}
                There are {total} places on it so far, and{' '}
                <a href="/collection/completely-free">{free} of them are free</a>.
              </>
            )}
          </p>

          <p>
            It is for people who live here and have run out of ideas. For a
            parent with a small person and two hours to fill. For anyone whose
            friend is visiting on Saturday and has just seen the forecast quietly
            dismantle the plan.
          </p>

          <p>
            It exists because most guides to indoor London are the same twelve
            attractions in a different order, written by somebody who has never
            had to cross the city in a downpour. This one is free, there is
            nothing to log into, and where a booking link earns us a few percent
            that is written down on the{' '}
            <a href="/affiliate">affiliate page</a> rather than buried.
          </p>
        </div>
      </div>
    </section>
  );
}
