import { useState } from 'preact/hooks';
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
 *
 * On a phone the three paragraphs are a screen and a half of reading sitting
 * between someone and the venues they came for, so only the first is shown until
 * asked. Collapsed rather than removed: the words stay in the markup, which is
 * what the crawler reads, and the prerendered homepage carries all three
 * regardless. Desktop lays them out in three columns and needs no toggle.
 */
export function WelcomeBand() {
  const total = totalActivities.value;
  const free = freeEntryCount.value;
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={styles.band} aria-labelledby="welcome-heading">
      <div className={styles.inner}>
        <h2 id="welcome-heading" className={styles.lead}>
          Everything worth doing indoors in London, rated by how wet you will get
          on the way.
        </h2>

        <div className={[styles.body, expanded && styles.expanded].filter(Boolean).join(' ')}>
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

          <p id="welcome-more-1">
            It is for people who live here and have run out of ideas. For a
            parent with a small person and two hours to fill. For anyone whose
            friend is visiting on Saturday and has just seen the forecast quietly
            dismantle the plan.
          </p>

          <p id="welcome-more-2">
            It exists because most guides to indoor London are the same twelve
            attractions in a different order, written by somebody who has never
            had to cross the city in a downpour. This one is free, there is
            nothing to log into, and where a booking link earns us a few percent
            that is written down on the{' '}
            <a href="/affiliate">affiliate page</a> rather than buried.
          </p>

          <button
            type="button"
            className={styles.toggle}
            aria-expanded={expanded}
            aria-controls="welcome-more-1 welcome-more-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Read the rest'}
          </button>
        </div>
      </div>
    </section>
  );
}
