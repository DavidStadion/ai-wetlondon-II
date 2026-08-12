import { signal, computed } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { Link as RouterLink } from 'preact-router';
import { createPortal } from 'preact/compat';
import { bookmarkedVenues, currentPath } from '@/signals/uiSignals';
import { isConsentSettingsOpen } from '@/utils/consent';
import { WeatherStrip } from '@/components/WeatherStrip';
import { JoinClub } from '@/components/JoinClub';
import { RainCanvas } from '@/components/RainCanvas';
import styles from './Layout.module.css';

const savedCount = computed(() => bookmarkedVenues.value.size);

// Typed wrapper for preact-router Link to fix href type issue
function Link(props: JSX.HTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <RouterLink {...props} />;
}

interface LayoutProps {
  children: ComponentChildren;
}

export const isNavOpen = signal(false);

/** Header retracts as you read down and returns the moment you scroll back up. */
const isHeaderHidden = signal(false);

function useHeaderHeight(ref: { current: HTMLElement | null }) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      document.documentElement.style.setProperty(
        '--wl-header-h',
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
}

function useHeaderAutoHide() {
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;

        // Ignore rubber-banding and tiny jitters; never hide near the top or
        // while the mobile drawer is open.
        if (y < 120 || isNavOpen.value) {
          isHeaderHidden.value = false;
        } else if (Math.abs(delta) > 6) {
          isHeaderHidden.value = delta > 0;
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

function toggleNav() {
  isNavOpen.value = !isNavOpen.value;
}

function closeNav() {
  isNavOpen.value = false;
}

/** Send the user to the hero search field wherever they are on the page. */
function focusSearch() {
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Search activities"]');
  if (!input) {
    window.location.href = '/';
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  input.focus({ preventScroll: true });
}

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: '/all-activities', label: 'All Activities' },
  { href: '/collections', label: 'Collections' },
  { href: '/kids', label: 'With Kids' },
  { href: '/events', label: "What's On" },
  { href: '/popups', label: 'Pop-Ups' },
  { href: '/situations', label: 'Pick Your Vibe' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

interface NavLinkProps {
  href: string;
  children: ComponentChildren;
}

function NavLink({ href, children }: NavLinkProps) {
  const path = currentPath.value;

  // Hash links are scroll anchors, not separate pages, never mark active
  const isHashLink = href.includes('#');
  const isActive = isHashLink ? false : path === href;

  if (isHashLink) {
    const targetId = href.slice(href.indexOf('#') + 1);

    // On the homepage the browser won't re-jump to a hash it's already on, and a
    // native jump is abrupt. Scroll it ourselves; otherwise let the link navigate.
    const handleHashClick = (e: MouseEvent) => {
      closeNav();
      if (path !== '/') return;

      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      history.replaceState(null, '', `/#${targetId}`);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
      <a href={href} onClick={handleHashClick}>
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

/**
 * Rendered through a portal: the header carries a transform for the auto-hide,
 * and a transformed ancestor makes position:fixed resolve against it rather
 * than the viewport, which broke the drawer entirely.
 */
function MobileDrawer() {
  const open = isNavOpen.value;

  // Stop the page scrolling behind the open drawer
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  // Escape closes it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeNav(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return createPortal(
    <>
      <div
        className={`${styles.navScrim} ${open ? styles.navScrimActive : ''}`}
        aria-hidden="true"
        onClick={closeNav}
      />
      <nav
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        id="mobileNav"
        aria-label="Main navigation"
        aria-hidden={!open}
      >
        <button type="button" className={styles.drawerClose} onClick={closeNav} aria-label="Close navigation">
          &times;
        </button>
        {NAV_LINKS.map((l) => (
          <NavLink key={l.href} href={l.href}>{l.label}</NavLink>
        ))}
        <a className={styles.drawerCta} href="/#join" onClick={closeNav}>Join The Club</a>
      </nav>
    </>,
    document.body,
  );
}

export function Layout({ children }: LayoutProps) {
  const headerRef = useRef<HTMLElement>(null);
  useHeaderAutoHide();
  useHeaderHeight(headerRef);

  // The conditions strip belongs to the landing page, not every route
  const isHome = currentPath.value === '/';

  return (
    <div className={styles.layout}>
      <a className="wl-skip-link" href="#main">Skip to content</a>

      <header ref={headerRef} className={`${styles.header} ${isHeaderHidden.value ? styles.headerHidden : ''}`}>
        <div className={styles.headerBar}>
        {/* Mascot: a raindrop that hops, squashes on landing, and blinks. */}
        <Link href="/" className={styles.mark} aria-label="Wet London home">
          <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <g className={styles.dropHop}>
              <path
                d="M32 4c0 0 18 22.5 18 34.5a18 18 0 0 1-36 0C14 26.5 32 4 32 4Z"
                fill="currentColor"
              />
              {/* Knocked out of the body, so they read as eyes on any ground. */}
              <g className={styles.dropEyes} fill="var(--color-bg)">
                <ellipse cx="25.4" cy="39" rx="4.3" ry="5.2" />
                <ellipse cx="38.6" cy="39" rx="4.3" ry="5.2" />
              </g>
            </g>
          </svg>
        </Link>

        {/* Centred wordmark + nav row */}
        <div className={styles.headerCenter}>
          {/* Hidden while the wordmark is being tried in the hero instead. */}
          <Link href="/" className={styles.wordmarkHidden}>Wet London</Link>
          <nav className={styles.nav} id="siteNav">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} href={l.href}>{l.label}</NavLink>
            ))}
          </nav>
        </div>

        {/* Right actions */}
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Search activities"
            onClick={focusSearch}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.9" />
              <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>

          <Link
            href="/saved"
            className={`${styles.iconBtn} ${styles.savedBtn}`}
            aria-label={
              savedCount.value > 0
                ? `Saved places (${savedCount.value})`
                : 'Saved places'
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"
                fill={savedCount.value > 0 ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {savedCount.value > 0 && (
              <span className={styles.badgeCount}>{savedCount.value}</span>
            )}
          </Link>

          <Link href="/situations" className={styles.iconBtn} aria-label="Your preferences">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M4.8 20a7.2 7.2 0 0 1 14.4 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          <a href="/#join" className={styles.joinBtn}>Join The Club</a>
        </div>

        <button
          className={styles.navToggle}
          type="button"
          aria-label={isNavOpen.value ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isNavOpen.value}
          aria-controls="mobileNav"
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
        </div>

        {isHome && <WeatherStrip />}
      </header>

      <MobileDrawer />

      <main className={styles.main} id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerHeading}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/situations">Pick Your Vibe</Link></li>
                <li><Link href="/events">What's On</Link></li>
                <li><Link href="/popups">Pop-Ups</Link></li>
                <li><Link href="/collections">Collections</Link></li>
                <li><Link href="/saved">Saved places</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className={styles.footerColumn}>
              <h4 className={styles.footerHeading}>Important Bits</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms &amp; Conditions</Link></li>
                <li><Link href="/cookies">Cookie Policy</Link></li>
                <li>
                  <a
                    href="#cookie-settings"
                    onClick={(e) => { e.preventDefault(); isConsentSettingsOpen.value = true; }}
                  >
                    Cookie settings
                  </a>
                </li>
                <li><Link href="/affiliate">Affiliate Disclosure</Link></li>
              </ul>
            </div>

            <div className={styles.footerNewsletterCol} id="join">
              <JoinClub source="footer" />
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

        {/* A wall of rain rather than a wordmark. Heavier and paler than the
            hero's, because it is the last thing on the page and can be. */}
        <div className={styles.footerRain} aria-hidden="true">
          <RainCanvas rgb="255, 255, 255" density={2.4} alpha={2.5} />
        </div>
      </footer>
    </div>
  );
}
