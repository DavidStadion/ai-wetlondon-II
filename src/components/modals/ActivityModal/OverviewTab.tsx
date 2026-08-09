import type { Venue } from "@/types";
import {
  formatOpeningHours,
  getOpenStatus,
  getGoogleMapsUrl,
  getTransportInfo,
  getDuration,
  getAccessibilityText,
  getBookingText,
  getWhatsIncluded,
  getGoodToKnow,
} from "@/utils/venueInfo";
import { Tag } from "@/components/common/Tag";
import styles from "./OverviewTab.module.css";

interface OverviewTabProps {
  venue: Venue;
  /** Accepted for call-site compatibility; the modal header renders the image. */
  imageUrl?: string;
  /** The venue page shows the description as a standfirst, so skip it here. */
  hideAbout?: boolean;
}

export function OverviewTab({ venue, hideAbout = false }: OverviewTabProps) {
  const openStatus = getOpenStatus(venue.openingHours);
  const transport = getTransportInfo(venue.description);
  const duration = getDuration(venue.type, venue.prerequisites);
  const booking = getBookingText(venue.type, venue.prerequisites, venue.price);
  const whatsIncluded = getWhatsIncluded(venue.type, venue.prerequisites);
  const goodToKnow = getGoodToKnow(venue);

  return (
    <div>
      {/* The modal header already leads with the image — no need to repeat it here. */}
      {!hideAbout && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>About</h3>
          <p className={styles.description}>{venue.description}</p>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoContent}>
              <h4>Getting There</h4>
              <p>
                {transport.details}
                {"\n"}
                <strong>Nearest Station:</strong> {transport.station}
              </p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoContent}>
              <h4>Duration</h4>
              <p>{duration}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoContent}>
              <h4>Accessibility</h4>
              <p>
                {getAccessibilityText(venue.prerequisites, venue.wetness)}
              </p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoContent}>
              <h4>Booking</h4>
              <p>{booking}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoContent}>
              <h4>Opening Hours</h4>
              <p>
                {openStatus && (
                  <span
                    className={
                      openStatus === "Open now"
                        ? styles.openBadge
                        : styles.closedBadge
                    }
                  >
                    {openStatus}
                  </span>
                )}
                {formatOpeningHours(venue.openingHours)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>What's Included</h3>
        <ul className={styles.bulletList}>
          {whatsIncluded.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Good to Know</h3>
        <ul className={styles.bulletList}>
          {goodToKnow.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      {!venue.openingHours &&
        !(Array.isArray(venue.prerequisites) && venue.prerequisites.length) && (
          <div className={styles.planningTip}>
            <p>
              We recommend checking the venue's website for the latest opening
              hours and accessibility information before visiting.
            </p>
          </div>
        )}

      {Array.isArray(venue.prerequisites) && venue.prerequisites.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Amenities</h3>
          <div className={styles.tags}>
            {venue.prerequisites.map((tag) => (
              <Tag key={tag} label={tag} variant="display" />
            ))}
          </div>
        </section>
      )}

      {/* Booking lives in the sticky action bar above — this is just directions. */}
      <div className={styles.ctaSection}>
        <a
          href={getGoogleMapsUrl(venue.name, venue.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapLink}
        >
          View on Google Maps
        </a>
      </div>

      <div className={styles.divider} />

      <div className={styles.needMoreInfo}>
        <h3 className={styles.needMoreTitle}>
          Need More Information?
        </h3>
        <p className={styles.needMoreText}>
          For the most up-to-date information including specific opening times,
          current prices, special events, and booking details, we recommend
          checking the venue's official website or contacting them directly.
        </p>
        <button
          className={styles.searchVenueBtn}
          onClick={() => {
            const query = encodeURIComponent(`${venue.name} London`);
            window.open(
              `https://www.google.com/search?q=${query}`,
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          Search "{venue.name}" Online
        </button>
      </div>
    </div>
  );
}
