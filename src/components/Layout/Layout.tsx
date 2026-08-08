import { signal } from '@preact/signals';
import type { ComponentChildren, JSX } from 'preact';
import { Link as RouterLink, useRouter } from 'preact-router';
import styles from './Layout.module.css';

// Typed wrapper for preact-router Link to fix href type issue
function Link(props: JSX.HTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <RouterLink {...props} />;
}

interface LayoutProps {
  children: ComponentChildren;
}

export const isNavOpen = signal(false);

function toggleNav() {
  isNavOpen.value = !isNavOpen.value;
}

function closeNav() {
  isNavOpen.value = false;
}

interface NavLinkProps {
  href: string;
  children: ComponentChildren;
}

function NavLink({ href, children }: NavLinkProps) {
  const [router] = useRouter();
  const currentPath = router.path || '/';

  // Hash links are scroll anchors, not separate pages — never mark active
  const isHashLink = href.includes('#');
  const isActive = isHashLink ? false : currentPath === href;

  if (isHashLink) {
    // Hash links need regular anchor for scroll behavior
    return (
      <a
        href={href}
        aria-current={isActive ? 'page' : undefined}
        onClick={closeNav}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      onClick={closeNav}
    >
      {children}
    </Link>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        {/* Mascot / mark — far left */}
        <Link href="/" className={styles.mark} aria-label="Wet London home">
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path
              d="M25 13.5A8.5 8.5 0 0 0 9.2 10.4 6.5 6.5 0 0 0 10 23.3h14a5.2 5.2 0 0 0 1-10.3Z"
              fill="currentColor"
            />
            <path
              d="M12 25.5 10.5 29M17 25.5 15.5 29M22 25.5 20.5 29"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </Link>

        {/* Centred wordmark + nav row */}
        <div className={styles.headerCenter}>
          <Link href="/" className={styles.wordmark}>Wet London</Link>
          <nav
            className={`${styles.nav} ${isNavOpen.value ? styles.navOpen : ''}`}
            id="siteNav"
          >
            <NavLink href="/#activities">Featured</NavLink>
            <NavLink href="/#all-activities">All Activities</NavLink>
            <NavLink href="/events">What's On</NavLink>
            <NavLink href="/popups">Pop-Ups</NavLink>
            <NavLink href="/situations">Pick Your Vibe</NavLink>
            <NavLink href="/about">About</NavLink>
          </nav>
        </div>

        {/* Right actions */}
        <div className={styles.headerRight}>
          <a href="/#bookmarks" className={styles.iconBtn} aria-label="My bookmarks">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a href="/situations" className={styles.joinBtn}>Pick your vibe</a>
        </div>

        <button
          className={styles.navToggle}
          type="button"
          aria-label={isNavOpen.value ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isNavOpen.value}
          aria-controls="siteNav"
          onClick={toggleNav}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div
        className={`${styles.navScrim} ${isNavOpen.value ? styles.navScrimActive : ''}`}
        aria-hidden="true"
        onClick={closeNav}
      />

      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerHeading}>Information</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/situations">Pick Your Vibe</Link></li>
                <li><Link href="/events">What's On</Link></li>
                <li><Link href="/popups">Pop-Ups</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className={styles.footerColumn}>
              <h4 className={styles.footerHeading}>Legal</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms &amp; Conditions</Link></li>
                <li><Link href="/cookies">Cookie Policy</Link></li>
                <li><Link href="/affiliate">Affiliate Disclosure</Link></li>
              </ul>
            </div>

            <div className={styles.footerNewsletterCol}>
              <h4 className={styles.footerHeading}>Rainy day alerts</h4>
              <p className={styles.footerDescription}>
                We'll tell you when it's about to chuck it down — and where to hide.
              </p>
              <form className={styles.footerNewsletter} onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  className={styles.footerInput}
                  placeholder="your@email.com"
                  aria-label="Email address"
                />
                <button type="submit" className={styles.footerButton}>
                  Subscribe
                </button>
              </form>
            </div>

            <div className={styles.footerSocial}>
              <a href="https://twitter.com/wetlondon" target="_blank" rel="noopener" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://instagram.com/wetlondon" target="_blank" rel="noopener" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@wetlondon" target="_blank" rel="noopener" aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.copyright}>© 2026 Wet London. All rights reserved.</p>
            <p className={styles.footerTagline}>
              Wet London only lists places that still work when the weather doesn't.
            </p>
            <p className={styles.footerMadeWith}>Made by Dave ☔</p>
          </div>
        </div>

        {/* Oversized wordmark, bleeding off the bottom edge */}
        <div className={styles.footerMark} aria-hidden="true">Wet London</div>
      </footer>
    </div>
  );
}
