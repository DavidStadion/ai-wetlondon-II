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
import './styles/global.css';

function App() {
  return (
    <>
      <Layout>
        <Router>
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

const container = document.getElementById('preact-root');
if (container) {
  render(<App />, container);
}
