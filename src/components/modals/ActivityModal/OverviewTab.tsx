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
import { Button } from "@/components/common/Button";
import { Tag } from "@/components/common/Tag";
import styles from "./OverviewTab.module.css";

interface OverviewTabProps {
  venue: Venue;
  imageUrl?: string;
}

export function OverviewTab({ venue, imageUrl }: OverviewTabProps) {
  const heroStyle = imageUrl
    ? { backgroundImage: `url(${imageUrl})` }
    : undefined;

  const handleBookClick = () => {
    if (venue.affiliateLink) {
      window.open(venue.affiliateLink, "_blank", "noopener,noreferrer");
    } else {
      const query = encodeURIComponent(`${venue.name} London tickets`);
      window.open(
        `https://www.google.com/search?q=${query}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const openStatus = getOpenStatus(venue.openingHours);
  const transport = getTransportInfo(venue.description);
  const duration = getDuration(venue.type, venue.prerequisites);
  const booking = getBookingText(venue.type, venue.prerequisites, venue.price);
  const whatsIncluded = getWhatsIncluded(venue.type, venue.prerequisites);
  const goodToKnow = getGoodToKnow(venue);

  return (
    <div>
      <div
        className={styles.hero}
        style={heroStyle}
        role="img"
        aria-label={venue.name}
      />

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.description}>{venue.description}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">
              &#x1F687;
            </div>
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
            <div className={styles.infoIcon} aria-hidden="true">
              &#x23F0;
            </div>
            <div className={styles.infoContent}>
              <h4>Duration</h4>
              <p>{duration}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">
              &#x267F;
            </div>
            <div className={styles.infoContent}>
              <h4>Accessibility</h4>
              <p>
                {getAccessibilityText(venue.prerequisites, venue.wetness)}
              </p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">
              &#x1F3AB;
            </div>
            <div className={styles.infoContent}>
              <h4>Booking</h4>
              <p>{booking}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">
              &#x1F552;
            </div>
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
            <span className={styles.planningTipIcon} aria-hidden="true">
              &#x2139;&#xFE0F;
            </span>
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

      <div className={styles.ctaSection}>
        <Button
          variant="action"
          onClick={handleBookClick}
          className={styles.ctaButton}
        >
          <span aria-hidden="true" style={{ marginRight: "0.25rem" }}>
            &#x1F3AB;
          </span>
          {venue.affiliateLink ? "Book Tickets" : "Find Tickets"}
        </Button>

        <a
          href={getGoogleMapsUrl(venue.name, venue.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapLink}
        >
          <span aria-hidden="true">&#x1F4CD;</span>
          View on Google Maps
        </a>
      </div>

      <div className={styles.divider} />

      <div className={styles.needMoreInfo}>
        <h3 className={styles.needMoreTitle}>
          <span aria-hidden="true">&#x1F4DE;</span>
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
          <span aria-hidden="true">&#x1F50D;</span>
          Search "{venue.name}" Online
        </button>
      </div>
    </div>
  );
}
