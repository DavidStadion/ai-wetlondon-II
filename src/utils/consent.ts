import { signal } from '@preact/signals';

/**
 * Cookie consent, using Google Consent Mode v2.
 *
 * Nothing that sets analytics or advertising cookies may run before the user
 * chooses. Consent Mode is initialised to "denied" as early as possible, and
 * gtag/AdSense are only loaded once consent is granted, so the banner really
 * gates them rather than just appearing to.
 */
const STORAGE_KEY = 'wl_cookie_consent';
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const ADSENSE_CLIENT = 'ca-pub-1382628707656079';

export type ConsentChoice = 'granted' | 'denied';

export interface ConsentState {
  analytics: ConsentChoice;
  ads: ConsentChoice;
  decidedAt: string;
}

export const consentState = signal<ConsentState | null>(null);
export const isConsentBannerOpen = signal(false);
export const isConsentSettingsOpen = signal(false);

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Must run before any Google tag loads. */
export function initConsentMode(): void {
  window.dataLayer = window.dataLayer || [];
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  });
}

function readStored(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.analytics && parsed.ads) return parsed;
    return null;
  } catch {
    return null;
  }
}

let analyticsLoaded = false;
let adsLoaded = false;

function loadAnalytics() {
  if (analyticsLoaded || !GA_ID) return;
  analyticsLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true });
}

function loadAds() {
  if (adsLoaded) return;
  adsLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
}

function apply(state: ConsentState) {
  gtag('consent', 'update', {
    ad_storage: state.ads,
    ad_user_data: state.ads,
    ad_personalization: state.ads,
    analytics_storage: state.analytics,
  });

  if (state.analytics === 'granted') loadAnalytics();
  if (state.ads === 'granted') loadAds();
}

export function saveConsent(analytics: ConsentChoice, ads: ConsentChoice): void {
  const state: ConsentState = { analytics, ads, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing, honour the choice for this session only
  }
  consentState.value = state;
  isConsentBannerOpen.value = false;
  isConsentSettingsOpen.value = false;
  apply(state);
}

export function withdrawConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  consentState.value = null;
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  // Already-loaded scripts can't be unloaded; a reload gives a clean slate.
  window.location.reload();
}

/** Call once on boot, after initConsentMode(). */
export function restoreConsent(): void {
  const stored = readStored();
  if (stored) {
    consentState.value = stored;
    apply(stored);
  } else {
    isConsentBannerOpen.value = true;
  }
}

/** Page views only count once analytics consent exists. */
export function trackPageView(url: string): void {
  if (consentState.value?.analytics !== 'granted') return;
  gtag('event', 'page_view', { page_path: url });
}


/**
 * Booking clicks are the commercial signal, without this there's no way to
 * know which venues actually earn. Only fires with analytics consent.
 */
export function trackBookingClick(details: {
  venue: string;
  isAffiliate: boolean;
  price: number;
}): void {
  if (consentState.value?.analytics !== 'granted') return;
  gtag('event', 'booking_click', {
    venue_name: details.venue,
    link_type: details.isAffiliate ? 'affiliate' : 'search_fallback',
    value: details.price,
    currency: 'GBP',
  });
}
