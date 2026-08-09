import { LegalPage } from '@/pages/LegalPage';
import styles from '@/pages/LegalPage/LegalPage.module.css';
import type { RouteProps } from '@/types';

export function ContactPage(_props: RouteProps) {
  return (
    <LegalPage
      title="Get in touch"
      intro="Wet London is a small, independent project. We read everything, though replies can take a few days."
      updated="9 August 2026"
    >
      <h2>Suggest a place</h2>
      <p>
        Know somewhere brilliant that stays dry? Send it over with a link and a line on
        why it's worth the trip.{' '}
        <a href="mailto:wetlondonofficial@gmail.com?subject=Place%20suggestion">
          wetlondonofficial@gmail.com
        </a>
      </p>

      <h2>Something wrong with a listing?</h2>
      <p>
        Opening hours changed, price out of date, or a place closed for good? Tell us
        which venue and what's wrong and we'll fix it.{' '}
        <a href="mailto:wetlondonofficial@gmail.com?subject=Listing%20correction">
          wetlondonofficial@gmail.com
        </a>
      </p>

      <h2>Partnerships and pop-ups</h2>
      <p>
        Running a workshop, class or pop-up you'd like listed? See{' '}
        <a href="/popups">Pop-Ups</a> or email{' '}
        <a href="mailto:wetlondonofficial@gmail.com?subject=Partnership">
          wetlondonofficial@gmail.com
        </a>
        .
      </p>

      <h2>Privacy and your information</h2>
      <p>
        To request a copy of your information, or ask us to remove a review you posted,
        see the <a href="/privacy">Privacy Policy</a> and email{' '}
        <a href="mailto:wetlondonofficial@gmail.com">wetlondonofficial@gmail.com</a>.
      </p>


    </LegalPage>
  );
}
