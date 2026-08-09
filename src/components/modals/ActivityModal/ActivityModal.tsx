import { useState, useEffect, useRef } from "preact/hooks";
import type { Venue } from "@/types";
import { Modal } from "@/components/common/Modal";
import {
  bookmarkedVenues,
  toggleBookmark,
  addToRecentlyViewed,
  luckyDeck,
  luckyIndex,
  stepLucky,
} from "@/signals/uiSignals";
import { OverviewTab } from "./OverviewTab";
import { GalleryTab } from "./GalleryTab";
import { ReviewsTab } from "./ReviewsTab";
import { RelatedVenues } from "./RelatedVenues";
import { venueUrl } from "@/utils/slug";
import styles from "./ActivityModal.module.css";

export interface ActivityModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
}

type TabId = "overview" | "gallery" | "reviews";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "gallery", label: "Gallery" },
  { id: "reviews", label: "Reviews" },
];

export function ActivityModal({
  venue,
  isOpen,
  onClose,
  imageUrl,
}: ActivityModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Track when modal opens
  useEffect(() => {
    if (isOpen && venue) {
      addToRecentlyViewed(venue.name);
    }
  }, [isOpen, venue]);

  // Reset tab when venue changes
  useEffect(() => {
    setActiveTab("overview");
  }, [venue]);

  if (!venue) return null;

  const isBookmarked = bookmarkedVenues.value.has(venue.name);

  const handleToggleBookmark = () => {
    toggleBookmark(venue.name);
  };

  const handleShare = async () => {
    // Share the venue's own page, not whichever list the user happens to be on
    const shareData = {
      title: venue.name,
      text: `Check out ${venue.name} on Wet London`,
      url: `${window.location.origin}${venueUrl(venue)}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

    e.preventDefault();
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
    setActiveTab(TABS[nextIndex].id);

    const buttons = tabsRef.current?.querySelectorAll("button");
    (buttons?.[nextIndex] as HTMLButtonElement)?.focus();
  };

  const wet = Math.max(0, Math.min(100, Math.round(venue.wetnessScore ?? 0)));
  const hasValidRating =
    typeof venue.rating === "number" && venue.rating > 0 && venue.rating <= 5;
  const isFree = venue.price === 0;

  // The booking CTA is the commercial surface — always give it somewhere to go.
  const bookingUrl =
    venue.affiliateLink ||
    `https://www.google.com/search?q=${encodeURIComponent(`${venue.name} London tickets`)}`;
  const bookingLabel = isFree ? "Plan your visit" : "Book tickets";

  const isLucky = luckyDeck.value.length > 1;

  const wetnessWord =
    venue.wetness === "dry"
      ? "Stays dry"
      : venue.wetness === "slightly"
        ? "Mostly dry"
        : "Some exposure";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={venue.name} size="xl" hideHeader flush>
      {/* Image-led header */}
      <div className={styles.hero}>
        {isLucky && (
          <>
            <button
              type="button"
              className={`${styles.luckyArrow} ${styles.luckyPrev}`}
              onClick={() => stepLucky(-1)}
              aria-label="Previous suggestion"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.luckyArrow} ${styles.luckyNext}`}
              onClick={() => stepLucky(1)}
              aria-label="Next suggestion"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className={styles.luckyCount}>
              {luckyIndex.value + 1} of {luckyDeck.value.length} lucky picks
            </span>
          </>
        )}
        <div
          className={styles.heroImage}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
          aria-hidden="true"
        />
        <span className={styles.heroWet}>
          <span className={styles.heroWetMeter}>
            <i style={{ width: `${Math.max(5, wet)}%` }} />
          </span>
          {wet}% WET
        </span>
        <div className={styles.heroText}>
          <div className={styles.heroKicker}>
            <span>
              {venue.location.charAt(0).toUpperCase() + venue.location.slice(1)}
            </span>
            {venue.type[0] && (
              <>
                <span className={styles.dot} aria-hidden="true" />
                <span>{venue.type[0]}</span>
              </>
            )}
          </div>
          <h2 className={styles.heroTitle}>{venue.name}</h2>
        </div>
      </div>

      {/* Sticky action bar — booking is the primary action */}
      <div className={styles.actionBar}>
        <div className={styles.facts}>
          <span className={styles.price}>{venue.priceDisplay}</span>
          {hasValidRating && (
            <>
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.fact}>{"★"} {venue.rating.toFixed(1)}</span>
            </>
          )}
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.fact}>{wetnessWord}</span>
        </div>

        <div className={styles.actions}>
          <a
            className={styles.bookBtn}
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {bookingLabel}
            <span aria-hidden="true" className={styles.bookArrow}>
              {"→"}
            </span>
          </a>

          <button
            type="button"
            className={`${styles.iconBtn} ${isBookmarked ? styles.iconBtnOn : ""}`}
            onClick={handleToggleBookmark}
            aria-pressed={isBookmarked}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
                fill={isBookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
            {isBookmarked ? "Saved" : "Save"}
          </button>

          <a className={styles.iconBtn} href={venueUrl(venue)}>Full page</a>

          <button type="button" className={styles.iconBtn} onClick={handleShare}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M12 16V4M8 8l4-4 4 4" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrap}>
        <div
          ref={tabsRef}
          className={styles.tabs}
          role="tablist"
          aria-label="Activity details"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`${styles.tab} ${activeTab === tab.id ? styles["tab--active"] : ""}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={handleKeyDown}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        className={styles.tabContent}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "overview" && (
          <OverviewTab venue={venue} imageUrl={imageUrl} />
        )}
        {activeTab === "gallery" && (
          <GalleryTab venueName={venue.name} imageUrl={imageUrl} />
        )}
        {activeTab === "reviews" && <ReviewsTab venue={venue} />}
      </div>

      {/* Related activities */}
      <RelatedVenues venue={venue} />
    </Modal>
  );
}
