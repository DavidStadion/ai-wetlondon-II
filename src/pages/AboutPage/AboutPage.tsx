import { useEffect, useRef } from 'preact/hooks';
import { Button } from '@/components/common/Button';
import { BackToTop } from '@/components/common/BackToTop';
import { Contributors } from '@/components/Contributors';
import type { RouteProps } from '@/types';
import styles from './AboutPage.module.css';

interface StatCardProps {
  target: number;
  label: string;
}

function StatCard({ target, label }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStat(el, target);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div className={styles.statCard}>
      <div className={styles.statNumber} ref={ref}>0</div>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

function animateStat(el: HTMLElement, target: number) {
  const duration = 650;
  const start = performance.now();

  function tick(now: number) {
    const p = Math.min(1, (now - start) / duration);
    const value = Math.round(target * p);
    el.textContent = String(value);
    if (p < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <details className={styles.faqItem}>
      <summary className={styles.faqQuestion}>{question}</summary>
      <p className={styles.faqAnswer}>{answer}</p>
    </details>
  );
}

export function AboutPage(_props: RouteProps) {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.title}>About</h1>
        <p className={styles.intro}>
          Wet London was started by Kate and Dave, two Londoners who love exploring come rain or shine (mostly rain, let's be honest). We've lost count of the times we've been caught out by the weather. Umbrellas turning inside out, trainers that squelch for days, that classic "it'll clear up" optimism that never pays off. So we built this to help fellow Londoners keep adventuring, whatever the sky throws at us.
        </p>
        <p className={styles.intro}>
          From pop-ups to landmarks to museums that will genuinely blow your mind (or at least keep you dry while you pretend to read the plaques). Got a recommendation? Send it our way. Want to partner up or get featured? Drop us a message and let's chat.
        </p>
      </section>

      {/* Stats */}
      <section className={styles.section} aria-label="Stats">
        <div className={styles.grid}>
          <StatCard target={228} label="venues (and growing)" />
          <StatCard target={3} label="ways to explore: search, filters, lucky" />
          <StatCard target={0} label="judgement for cancelling outdoor plans" />
        </div>
      </section>

      {/* What this is */}
      <section className={styles.section} aria-label="What this is">
        <h2 className={styles.sectionTitle}>What this is</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Curated indoor ideas</h3>
            <p className={styles.cardText}>Not everything is a museum, and not everything costs a fortune. Wet London is built to surface options that match your mood and your tolerance for drizzle.</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Filters that actually help</h3>
            <p className={styles.cardText}>Pick activity types, London areas, and how wet you are prepared to get. The list adapts so you do less scrolling and more doing.</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Bookmarked for later</h3>
            <p className={styles.cardText}>Save places you like, build a personal shortlist, and pretend it was the plan all along.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section} aria-label="How it works">
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.gridWide}>
          <div className={styles.card}>
            <span className={styles.pill}>Step 1</span>
            <h3 className={styles.cardTitle}>Tell us what you fancy</h3>
            <p className={styles.cardText}>Use search if you know what you want, or open Customize Your Experience for quick filters without the commitment.</p>
          </div>
          <div className={styles.card}>
            <span className={styles.pill}>Step 2</span>
            <h3 className={styles.cardTitle}>Pick your level of wet</h3>
            <p className={styles.cardText}>From fully indoor to a bit of a dash between buildings. You set the rules, not the forecast.</p>
          </div>
          <div className={styles.card}>
            <span className={styles.pill}>Step 3</span>
            <h3 className={styles.cardTitle}>Save, share, go</h3>
            <p className={styles.cardText}>Bookmark your favourites, open the venue card for details, and get moving before London changes its mind again.</p>
          </div>
          <div className={styles.card}>
            <span className={styles.pill}>Bonus</span>
            <h3 className={styles.cardTitle}>Feeling Lucky</h3>
            <p className={styles.cardText}>Press the dice button and let Wet London throw three ideas at you. Useful for indecision and mild existential dread.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section} aria-label="How the wetness score works">
        <h2 className={styles.sectionTitle}>What the wetness score means</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>0–10% · Bone dry</h3>
            <p className={styles.cardText}>
              Door to door under cover. Straight off the tube or a few steps from it,
              and everything you came for is inside.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>10–40% · Mostly dry</h3>
            <p className={styles.cardText}>
              A short dash. Five or ten minutes from a station, or a courtyard between
              buildings. A coat will do it.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>40%+ · Bring a brolly</h3>
            <p className={styles.cardText}>
              A proper walk at either end, or part of the visit is genuinely outside.
              Worth it, but know before you go.
            </p>
          </div>
        </div>
        <p className={styles.intro} style={{ marginTop: '1.5rem' }}>
          It's our judgement, not a measurement. We weigh up how far you'll walk from
          transport, how much of the visit is under cover, and how exposed the way in
          is. If we've got one wrong, tell us and we'll change it.
        </p>
      </section>


      <section className={styles.section} aria-label="FAQ">
        <h2 className={styles.sectionTitle}>FAQ</h2>
        <div className={styles.faqGrid}>
          <FAQItem
            question="Is Wet London only for tourists?"
            answer="No. It is for anyone who has ever looked out the window and immediately reconsidered their life choices."
          />
          <FAQItem
            question="Do you include free options?"
            answer="Yes. We like a bargain, and your bank account deserves a quiet day too."
          />
          <FAQItem
            question="Why do some venues say timed sessions for opening hours?"
            answer="Because some places run ticketed slots, timed entry, or sessions. We try to hint at that so you do not turn up and get politely rejected."
          />
          <FAQItem
            question="Can I suggest a venue?"
            answer="Please do. If it keeps people dry and it is not secretly a two hour queue, we want to know about it."
          />
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section} aria-label="Send a recommendation">
        <div className={styles.ctaCard}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Send us a recommendation</h2>
            <p className={styles.ctaText}>Know a place that belongs on Wet London? Email it over with a link and a quick note on why it is worth the trip.</p>
          </div>
          <Button
            as="a"
            href="mailto:hello@wetlondon.com?subject=Wet%20London%20Recommendation&body=Venue%20name%3A%0ALink%3A%0AWhy%20it%27s%20great%3A%0A"
          >
            Email us
          </Button>
        </div>
      </section>

      <Contributors />

      


      <BackToTop />
    </div>
  );
}
