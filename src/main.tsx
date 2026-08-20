import { render } from 'preact';
import { lazy, Suspense } from 'preact/compat';
import Router from 'preact-router';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { RouteFallback } from '@/components/common/RouteFallback';

/**
 * Only the homepage ships in the main bundle. Every other route is its own
 * chunk, fetched on navigation, so a first visit does not pay for the admin
 * page and the legal pages it will never open.
 */
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => m.AboutPage));
const EventsPage = lazy(() => import('@/pages/EventsPage').then((m) => m.EventsPage));
const PopupsPage = lazy(() => import('@/pages/PopupsPage').then((m) => m.PopupsPage));
const SituationsPage = lazy(() => import('@/pages/SituationsPage').then((m) => m.SituationsPage));
const SavedPage = lazy(() => import('@/pages/SavedPage').then((m) => m.SavedPage));
const KidsPage = lazy(() => import('@/pages/KidsPage').then((m) => m.KidsPage));
const CategoryPage = lazy(() => import('@/pages/CategoryPage').then((m) => m.CategoryPage));
const AllActivitiesPage = lazy(() => import('@/pages/AllActivitiesPage').then((m) => m.AllActivitiesPage));
const SwipePage = lazy(() => import('@/pages/SwipePage').then((m) => m.SwipePage));
const VenuePage = lazy(() => import('@/pages/VenuePage').then((m) => m.VenuePage));
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then((m) => m.CollectionsPage));
const CollectionPage = lazy(() => import('@/pages/CollectionsPage').then((m) => m.CollectionPage));
const ArticlesPage = lazy(() => import('@/pages/ArticlesPage').then((m) => m.ArticlesPage));
const ArticlePage = lazy(() => import('@/pages/ArticlesPage').then((m) => m.ArticlePage));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => m.NotFoundPage));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then((m) => m.PrivacyPage));
const CookiesPage = lazy(() => import('@/pages/CookiesPage').then((m) => m.CookiesPage));
const TermsPage = lazy(() => import('@/pages/TermsPage').then((m) => m.TermsPage));
const AffiliatePage = lazy(() => import('@/pages/AffiliatePage').then((m) => m.AffiliatePage));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => m.ContactPage));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => m.AdminPage));
import { ToastContainer } from '@/components/common/Toast/ToastContainer';
import { ConfigurationError } from '@/components/ConfigurationError';
import { hasSupabaseCredentials } from '@/utils/supabase';
import { loadBookmarks, loadRecentlyViewed, isActivityModalOpen, currentPath } from '@/signals/uiSignals';
import { CookieConsent } from '@/components/CookieConsent';
import { initConsentMode, restoreConsent, trackPageView } from '@/utils/consent';
import './styles/global.css';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}


function App() {
  // Check for required environment variables
  if (!hasSupabaseCredentials()) {
    return (
      <ConfigurationError
        title="Configuration Required"
        message="The application is missing required database credentials and cannot start."
        details={[
          'VITE_SUPABASE_URL',
          'VITE_SUPABASE_ANON_KEY'
        ]}
      />
    );
  }

  return (
    <>
      <Layout>
        <Suspense fallback={<RouteFallback />}>
        <Router
          onChange={(e) => {
            // A modal left open would otherwise persist across the route change
            isActivityModalOpen.value = false;
            currentPath.value = window.location.pathname;
            trackPageView(e.url);
          }}
        >
          <HomePage path="/" />
          <AboutPage path="/about" />
          <EventsPage path="/events" />
          <PopupsPage path="/popups" />
          <SituationsPage path="/situations" />
          <SavedPage path="/saved" />
          <KidsPage path="/kids" />
          <CategoryPage path="/category/:type" />
          <AllActivitiesPage path="/all-activities" />
          <SwipePage path="/swipe" />
          <VenuePage path="/venue/:slug" />
          <CollectionsPage path="/collections" />
          <CollectionPage path="/collection/:slug" />
          <ArticlesPage path="/blog" />
          <ArticlePage path="/blog/:slug" />
          <PrivacyPage path="/privacy" />
          <CookiesPage path="/cookies" />
          <TermsPage path="/terms" />
          <AffiliatePage path="/affiliate" />
          <ContactPage path="/contact" />
          <AdminPage path="/admin" />
          {/* Catch-all: without this, unknown routes render a blank page */}
          <NotFoundPage default />
        </Router>
        </Suspense>
      </Layout>
      <ToastContainer />
      <CookieConsent />
    </>
  );
}


// Consent mode must be set before any Google tag can load.
initConsentMode();
restoreConsent();

// Saved places drive the header count on every page, not just the homepage.
loadBookmarks();
loadRecentlyViewed();

const container = document.getElementById('preact-root');
if (container) {
  // Prerendered markup exists purely so crawlers and social scrapers see real
  // content. Clear it rather than letting Preact diff against it.
  if (container.querySelector('[data-prerender]')) container.innerHTML = '';
  render(<App />, container);
}
