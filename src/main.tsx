import { render } from 'preact';
import Router from 'preact-router';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { EventsPage } from '@/pages/EventsPage';
import { PopupsPage } from '@/pages/PopupsPage';
import { SituationsPage } from '@/pages/SituationsPage';
import { SavedPage } from '@/pages/SavedPage';
import { CategoryPage } from '@/pages/CategoryPage';
import { AllActivitiesPage } from '@/pages/AllActivitiesPage';
import { VenuePage } from '@/pages/VenuePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { CookiesPage } from '@/pages/CookiesPage';
import { TermsPage } from '@/pages/TermsPage';
import { AffiliatePage } from '@/pages/AffiliatePage';
import { ContactPage } from '@/pages/ContactPage';
import { AdminPage } from '@/pages/AdminPage';
import { ToastContainer } from '@/components/common/Toast/ToastContainer';
import { ConfigurationError } from '@/components/ConfigurationError';
import { hasSupabaseCredentials } from '@/utils/supabase';
import { loadBookmarks, loadRecentlyViewed, isActivityModalOpen } from '@/signals/uiSignals';
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
        <Router
          onChange={(e) => {
            // A modal left open would otherwise persist across the route change
            isActivityModalOpen.value = false;
            trackPageView(e.url);
          }}
        >
          <HomePage path="/" />
          <AboutPage path="/about" />
          <EventsPage path="/events" />
          <PopupsPage path="/popups" />
          <SituationsPage path="/situations" />
          <SavedPage path="/saved" />
          <CategoryPage path="/category/:type" />
          <AllActivitiesPage path="/all-activities" />
          <VenuePage path="/venue/:slug" />
          <PrivacyPage path="/privacy" />
          <CookiesPage path="/cookies" />
          <TermsPage path="/terms" />
          <AffiliatePage path="/affiliate" />
          <ContactPage path="/contact" />
          <AdminPage path="/admin" />
          {/* Catch-all: without this, unknown routes render a blank page */}
          <NotFoundPage default />
        </Router>
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
  render(<App />, container);
}
