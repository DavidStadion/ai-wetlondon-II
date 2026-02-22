import { render } from 'preact';
import Router from 'preact-router';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { EventsPage } from '@/pages/EventsPage';
import { PopupsPage } from '@/pages/PopupsPage';
import { SituationsPage } from '@/pages/SituationsPage';
import { AdminPage } from '@/pages/AdminPage';
import { ToastContainer } from '@/components/common/Toast/ToastContainer';
import { ConfigurationError } from '@/components/ConfigurationError';
import { hasSupabaseCredentials } from '@/utils/supabase';
import './styles/global.css';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

function initGA() {
  if (!GA_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

function trackPageView(url: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: url });
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
        <Router onChange={(e) => trackPageView(e.url)}>
          <HomePage path="/" />
          <AboutPage path="/about" />
          <EventsPage path="/events" />
          <PopupsPage path="/popups" />
          <SituationsPage path="/situations" />
          <AdminPage path="/admin" />
        </Router>
      </Layout>
      <ToastContainer />
    </>
  );
}

initGA();

const container = document.getElementById('preact-root');
if (container) {
  render(<App />, container);
}
