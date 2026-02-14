import { useEffect, useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import {
  isAuthenticated,
  adminVenues,
  adminPartners,
  adminTab,
  adminMessage,
  showAdminMessage,
} from '@/signals/adminSignals';
import {
  supabase,
  fetchAllVenuesAdmin,
  fetchAllPartnersAdmin,
  updateVenue,
  deleteVenue as deleteVenueApi,
  createPartner,
  updatePartner,
  deletePartner as deletePartnerApi,
  countFeaturedPartners,
} from '@/utils/supabase';
import type { RouteProps } from '@/types';
import type { Partner } from '@/types/partner';
import { PARTNER_TYPE_LABELS, PARTNER_LOCATION_LABELS } from '@/types/partner';
import { PartnerModal } from '@/components/modals/PartnerModal';
import styles from './AdminPage.module.css';

const isPartnerModalOpen = signal(false);
const editingPartner = signal<Partner | null>(null);

export function AdminPage(_props: RouteProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      isAuthenticated.value = true;
      loadVenues();
    }
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    setLoginError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoginError(error.message);
    } else {
      isAuthenticated.value = true;
      loadVenues();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    isAuthenticated.value = false;
    adminVenues.value = [];
    adminPartners.value = [];
  }

  async function loadVenues() {
    try {
      const data = await fetchAllVenuesAdmin();
      adminVenues.value = data;
    } catch (err) {
      showAdminMessage('Failed to load venues', 'error');
    }
  }

  async function loadPartners() {
    try {
      const data = await fetchAllPartnersAdmin();
      adminPartners.value = data;
    } catch (err) {
      showAdminMessage('Failed to load partners', 'error');
    }
  }

  function switchTab(tab: 'venues' | 'partners') {
    adminTab.value = tab;
    if (tab === 'partners') {
      loadPartners();
    }
  }

  async function toggleVenueFlag(id: number, flag: string, value: boolean) {
    try {
      await updateVenue(id, { [flag]: value });
      showAdminMessage(`${flag} status updated!`, 'success');
      loadVenues();
    } catch (err) {
      showAdminMessage(`Error updating ${flag}`, 'error');
    }
  }

  async function deleteVenue(id: number, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteVenueApi(id);
      showAdminMessage(`Deleted "${name}"`, 'success');
      loadVenues();
    } catch (err) {
      showAdminMessage('Error deleting venue', 'error');
    }
  }

  async function togglePartnerFlag(id: number, flag: 'featured' | 'active', value: boolean) {
    if (flag === 'featured' && value) {
      const count = await countFeaturedPartners();
      if (count >= 3) {
        showAdminMessage('Maximum 3 featured partners allowed', 'error');
        loadPartners();
        return;
      }
    }

    try {
      await updatePartner(id, { [flag]: value });
      showAdminMessage(`${flag} status updated!`, 'success');
      loadPartners();
    } catch (err) {
      showAdminMessage(`Error updating ${flag}`, 'error');
    }
  }

  async function deletePartner(id: number, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deletePartnerApi(id);
      showAdminMessage(`Deleted "${name}"`, 'success');
      loadPartners();
    } catch (err) {
      showAdminMessage('Error deleting partner', 'error');
    }
  }

  function openPartnerModal(partner?: Partner) {
    editingPartner.value = partner || null;
    isPartnerModalOpen.value = true;
  }

  function closePartnerModal() {
    isPartnerModalOpen.value = false;
    editingPartner.value = null;
  }

  async function handlePartnerSubmit(data: Partial<Partner>) {
    const featured = data.featured || false;

    if (featured) {
      const count = await countFeaturedPartners();
      const existingId = editingPartner.value?.id;
      if (count >= 3 && (!existingId || !adminPartners.value.find(p => p.id === existingId)?.featured)) {
        showAdminMessage('Maximum 3 featured partners allowed', 'error');
        return;
      }
    }

    try {
      const dbData = {
        name: data.name,
        type: data.type,
        location: data.location,
        description: data.description,
        price: data.price,
        price_display: data.priceDisplay,
        website_url: data.websiteUrl,
        affiliate_link: data.affiliateLink,
        image_filename: data.imageFilename,
        featured: data.featured,
        active: data.active,
      };

      if (editingPartner.value) {
        await updatePartner(editingPartner.value.id, dbData);
        showAdminMessage('Partner updated!', 'success');
      } else {
        await createPartner(dbData);
        showAdminMessage('Partner created!', 'success');
      }

      closePartnerModal();
      loadPartners();
    } catch (err) {
      showAdminMessage('Error saving partner', 'error');
    }
  }

  const authenticated = isAuthenticated.value;
  const venueList = adminVenues.value;
  const partnerList = adminPartners.value;
  const currentTab = adminTab.value;
  const message = adminMessage.value;

  // Stats
  const totalVenues = venueList.length;
  const sponsoredCount = venueList.filter(v => v.sponsored).length;
  const highlightedCount = venueList.filter(v => v.highlighted).length;
  const featuredCount = venueList.filter(v => v.featured).length;
  const freeCount = venueList.filter(v => v.price === 0).length;
  const avgRating = totalVenues > 0
    ? (venueList.reduce((sum, v) => sum + v.rating, 0) / totalVenues).toFixed(1)
    : '0';

  const totalPartners = partnerList.length;
  const featuredPartners = partnerList.filter(p => p.featured).length;
  const activePartners = partnerList.filter(p => p.active).length;

  if (!authenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.authSection}>
          <h2 className={styles.authTitle}>Admin Login</h2>
          {loginError && <div className={styles.error}>{loginError}</div>}
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                required
              />
            </div>
            <button type="submit" className={styles.btnPrimary}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Wet London Admin</h1>
            <p className={styles.subtitle}>Manage your venues and content</p>
          </div>
          <button type="button" className={styles.btnSecondary} onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total Venues</h3>
            <div className={styles.statNumber}>{totalVenues}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Sponsored</h3>
            <div className={styles.statNumber}>{sponsoredCount}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Highlighted</h3>
            <div className={styles.statNumber}>{highlightedCount}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Featured</h3>
            <div className={styles.statNumber}>{featuredCount}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Free</h3>
            <div className={styles.statNumber}>{freeCount}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Avg Rating</h3>
            <div className={styles.statNumber}>{avgRating}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${currentTab === 'venues' ? styles.active : ''}`}
            onClick={() => switchTab('venues')}
          >
            Venues
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${currentTab === 'partners' ? styles.active : ''}`}
            onClick={() => switchTab('partners')}
          >
            Pop-ups
          </button>
        </div>

        {/* Venues Section */}
        {currentTab === 'venues' && (
          <section>
            <h2 className={styles.sectionTitle}>All Venues</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Sponsored</th>
                  <th>Highlighted</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {venueList.map((venue) => (
                  <tr key={venue.name}>
                    <td><strong>{venue.name}</strong></td>
                    <td>{venue.location}</td>
                    <td>{venue.priceDisplay}</td>
                    <td>{venue.rating}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={venue.sponsored}
                        onChange={(e) => venue.id && toggleVenueFlag(venue.id, 'sponsored', (e.target as HTMLInputElement).checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={venue.highlighted}
                        onChange={(e) => venue.id && toggleVenueFlag(venue.id, 'highlighted', (e.target as HTMLInputElement).checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={venue.featured}
                        onChange={(e) => venue.id && toggleVenueFlag(venue.id, 'featured', (e.target as HTMLInputElement).checked)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => venue.id && deleteVenue(venue.id, venue.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Partners Section */}
        {currentTab === 'partners' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pop-ups</h2>
              <button
                type="button"
                className={styles.btnSuccess}
                onClick={() => openPartnerModal()}
              >
                + Add Partner
              </button>
            </div>

            <div className={styles.statsSmall}>
              <div className={styles.statCardSmall}>
                <h3>Total Partners</h3>
                <div className={styles.statNumber}>{totalPartners}</div>
              </div>
              <div className={styles.statCardSmall}>
                <h3>Featured</h3>
                <div className={styles.statNumber}>{featuredPartners}</div>
              </div>
              <div className={styles.statCardSmall}>
                <h3>Active</h3>
                <div className={styles.statNumber}>{activePartners}</div>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Featured</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partnerList.map((partner) => (
                  <tr key={partner.id}>
                    <td><strong>{partner.name}</strong></td>
                    <td>{PARTNER_TYPE_LABELS[partner.type]}</td>
                    <td>{PARTNER_LOCATION_LABELS[partner.location]}</td>
                    <td>{partner.priceDisplay}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={partner.featured}
                        onChange={(e) => togglePartnerFlag(partner.id, 'featured', (e.target as HTMLInputElement).checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={partner.active}
                        onChange={(e) => togglePartnerFlag(partner.id, 'active', (e.target as HTMLInputElement).checked)}
                      />
                    </td>
                    <td className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => openPartnerModal(partner)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => deletePartner(partner.id, partner.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {/* Partner Modal */}
      {isPartnerModalOpen.value && (
        <PartnerModal
          partner={editingPartner.value}
          onClose={closePartnerModal}
          onSubmit={handlePartnerSubmit}
        />
      )}
    </div>
  );
}

