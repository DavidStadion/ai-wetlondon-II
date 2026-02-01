import { useState, useEffect, useRef } from 'preact/hooks';
import type { Venue } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { BookmarkIcon } from '@/components/common/BookmarkIcon';
import { bookmarkedVenues, toggleBookmark, addToRecentlyViewed } from '@/signals/uiSignals';
import { OverviewTab } from './OverviewTab';
import { GalleryTab } from './GalleryTab';
import { ReviewsTab } from './ReviewsTab';
import styles from './ActivityModal.module.css';

export interface ActivityModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
}

type TabId = 'overview' | 'gallery' | 'reviews';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'reviews', label: 'Reviews' },
];

export function ActivityModal({ venue, isOpen, onClose, imageUrl }: ActivityModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const tabsRef = useRef<HTMLDivElement>(null);

  // Track when modal opens
  useEffect(() => {
    if (isOpen && venue) {
      addToRecentlyViewed(venue.name);
    }
  }, [isOpen, venue]);

  // Reset tab when venue changes
  useEffect(() => {
    setActiveTab('overview');
  }, [venue]);

  if (!venue) return null;

  const isBookmarked = bookmarkedVenues.value.has(venue.name);

  const handleToggleBookmark = () => {
    toggleBookmark(venue.name);
  };

  const handleShare = async () => {
    const shareData = {
      title: venue.name,
      text: `Check out ${venue.name} on Wet London`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

    e.preventDefault();
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
    setActiveTab(TABS[nextIndex].id);

    // Focus the new tab button
    const buttons = tabsRef.current?.querySelectorAll('button');
    (buttons?.[nextIndex] as HTMLButtonElement)?.focus();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={venue.name} size="lg">
      {/* Meta info */}
      <div className={styles.meta}>
        <span className={styles.rating}>
          <span className={styles.ratingStars}>{'*'.repeat(Math.round(venue.rating))}</span>
          <span>{venue.rating.toFixed(1)}</span>
        </span>
        <span className={styles.metaTag}>{venue.priceDisplay}</span>
        <span className={styles.metaTag}>
          {venue.location.charAt(0).toUpperCase() + venue.location.slice(1)}
        </span>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          onClick={() => {
            if (venue.affiliateLink) {
              window.open(venue.affiliateLink, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          Book Now
        </Button>
        <div className={styles.actionsRow}>
          <BookmarkIcon
            isBookmarked={isBookmarked}
            onToggle={handleToggleBookmark}
            size={16}
            label={isBookmarked ? 'Saved' : 'Save'}
          />
          <Button variant="secondary" onClick={handleShare}>
            Share
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} className={styles.tabs} role="tablist" aria-label="Activity details">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`${styles.tab} ${activeTab === tab.id ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className={styles.tabContent}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'overview' && <OverviewTab venue={venue} imageUrl={imageUrl} />}
        {activeTab === 'gallery' && <GalleryTab venueName={venue.name} imageUrl={imageUrl} />}
        {activeTab === 'reviews' && <ReviewsTab venue={venue} />}
      </div>
    </Modal>
  );
}
