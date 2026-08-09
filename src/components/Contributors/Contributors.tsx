import styles from './Contributors.module.css';

export interface Contributor {
  name: string;
  handle?: string;
  role: string;
  /** Path under /assets, or omit for the lettered fallback. */
  image?: string;
  /** Short line about what they actually do here. */
  note?: string;
  placesAdded?: number;
}

/**
 * The people behind the listings. Deliberately small and honest for now ,
 * the layout takes more without changing.
 */
export const CONTRIBUTORS: Contributor[] = [
  {
    name: 'Dave',
    role: 'Founder & editor',
    note: 'Started Wet London after one too many soakings. Writes most of the listings.',
  },
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export interface ContributorsProps {
  people?: Contributor[];
  eyebrow?: string;
  title?: string;
  titleAccent?: string;
}

export function Contributors({
  people = CONTRIBUTORS,
  eyebrow = 'Wet London',
  title = 'The people behind',
  titleAccent = 'the listings',
}: ContributorsProps) {
  if (people.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Contributors">
      <div className={styles.inner}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.title}>
          {title} <em>{titleAccent}</em>
        </h2>

        <ul className={styles.grid}>
          {people.map((p) => (
            <li key={p.name} className={styles.person}>
              <span
                className={styles.avatar}
                style={p.image ? { backgroundImage: `url(${p.image})` } : undefined}
                aria-hidden="true"
              >
                {!p.image && initials(p.name)}
              </span>

              <span className={styles.name}>{p.name}</span>
              <span className={styles.role}>{p.role}</span>
              {p.note && <span className={styles.note}>{p.note}</span>}
              {typeof p.placesAdded === 'number' && (
                <span className={styles.stat}>
                  <strong>{p.placesAdded}</strong> places added
                </span>
              )}
            </li>
          ))}
        </ul>

        <p className={styles.joinLine}>
          Know London well and fancy adding to it?{' '}
          <a href="mailto:wetlondonofficial@gmail.com?subject=Contributing%20to%20Wet%20London">
            Get in touch
          </a>
          .
        </p>
      </div>
    </section>
  );
}
