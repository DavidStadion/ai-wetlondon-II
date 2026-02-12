import type { Venue, VenueType } from "@/types";
import { isVenueOpenNow } from "@/utils/openingHours";
import { Button } from "@/components/common/Button";
import { Tag } from "@/components/common/Tag";
import styles from "./OverviewTab.module.css";

interface OverviewTabProps {
  venue: Venue;
  imageUrl?: string;
}

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function formatOpeningHours(
  hours: Record<string, string> | null | undefined,
): string {
  if (!hours) return "Hours not available";

  const lines = DAY_ORDER.filter((day) => hours[day]).map(
    (day) => `${DAY_LABELS[day]}: ${hours[day]}`,
  );

  return lines.length > 0 ? lines.join("\n") : "Hours not available";
}

function getOpenStatus(
  hours: Record<string, string> | null | undefined,
): string {
  const status = isVenueOpenNow(hours);
  if (status === true) return "Open now";
  if (status === false) return "Closed";
  return "";
}

function getAccessibilityInfo(prerequisites?: string[]): string {
  if (!Array.isArray(prerequisites) || !prerequisites.length)
    return "Contact venue for details";

  const accessibilityTags = [
    "Wheelchair accessible",
    "Step-free",
    "Lift access",
    "Seating available",
  ];
  const found = prerequisites.filter((p) => accessibilityTags.includes(p));
  return found.length > 0 ? found.join(", ") : "Contact venue for details";
}

function getGoogleMapsUrl(venueName: string, location: string): string {
  const query = encodeURIComponent(`${venueName}, ${location} London`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

const DURATION_MAP: Partial<Record<VenueType, string>> = {
  museums: "2-4 hours",
  galleries: "1-2 hours",
  theatre: "2-3 hours",
  cinema: "2-3 hours",
  dining: "1-2 hours",
  entertainment: "2-3 hours",
  shopping: "1-3 hours",
  wellness: "1-2 hours",
  sports: "1-2 hours",
  workshops: "2-3 hours",
  gaming: "1-3 hours",
  music: "2-4 hours",
  comedy: "1-2 hours",
  exhibitions: "1-2 hours",
  nightlife: "3-5 hours",
  escape: "1 hour",
  immersive: "1-2 hours",
  bowling: "1-2 hours",
  karaoke: "1-2 hours",
  spa: "2-3 hours",
};

const BOOKING_MAP: Partial<Record<VenueType, string>> = {
  theatre: "Advance booking recommended",
  cinema: "Book online for best seats",
  entertainment: "Book in advance",
  workshops: "Pre-booking required",
  escape: "Must book in advance",
  immersive: "Advance booking recommended",
  spa: "Booking recommended",
  comedy: "Book in advance",
  music: "Check listings for events",
  nightlife: "Guest list recommended for weekends",
};

const WHATS_INCLUDED: Partial<Record<VenueType, string[]>> = {
  museums: [
    "Permanent collection access",
    "Temporary exhibitions (some ticketed)",
    "Gift shop",
  ],
  galleries: ["Gallery access", "Exhibition guides"],
  theatre: ["Seated performance", "Programme"],
  cinema: ["Film screening", "Allocated seating"],
  dining: ["Table service", "Full menu access"],
  wellness: ["Facility access", "Towel and locker"],
  spa: ["Treatment access", "Relaxation area", "Towel and locker"],
  workshops: ["Materials provided", "Expert instruction"],
  escape: ["Private room", "Briefing and game master"],
};

const GOOD_TO_KNOW: Partial<Record<VenueType, string[]>> = {
  museums: [
    "Bag checks may be required",
    "Photography rules vary by exhibition",
  ],
  galleries: ["No flash photography", "Some exhibits are free"],
  theatre: [
    "Arrive 15 min early",
    "Latecomers may not be admitted until interval",
  ],
  cinema: ["Snacks available on-site", "Turn off your phone"],
  nightlife: ["Bring ID", "Dress code may apply"],
  dining: ["Check for dietary accommodations", "Tipping is customary"],
  wellness: ["Bring comfortable clothing", "Arrive early to settle in"],
  spa: ["Arrive 15 min early", "Avoid caffeine before treatments"],
  escape: ["Arrive 10 min early for briefing", "Groups of 2-6 recommended"],
  workshops: ["Wear suitable clothing", "All skill levels welcome"],
};

function getTypeBased<T>(
  types: VenueType[],
  map: Partial<Record<VenueType, T>>,
): T | undefined {
  for (const t of types) {
    if (map[t]) return map[t];
  }
  return undefined;
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
  const duration = getTypeBased(venue.type, DURATION_MAP);
  const booking = getTypeBased(venue.type, BOOKING_MAP);
  const whatsIncluded = getTypeBased(venue.type, WHATS_INCLUDED);
  const goodToKnow = getTypeBased(venue.type, GOOD_TO_KNOW);

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
              <h4>Location</h4>
              <p>
                {venue.location.charAt(0).toUpperCase() +
                  venue.location.slice(1)}{" "}
                London
              </p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">
              &#x1F3AB;
            </div>
            <div className={styles.infoContent}>
              <h4>Price</h4>
              <p>{venue.priceDisplay}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} aria-hidden="true">
              &#x267F;
            </div>
            <div className={styles.infoContent}>
              <h4>Accessibility</h4>
              <p>{getAccessibilityInfo(venue.prerequisites)}</p>
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
          {duration && (
            <div className={styles.infoItem}>
              <div className={styles.infoIcon} aria-hidden="true">
                &#x23F1;
              </div>
              <div className={styles.infoContent}>
                <h4>Typical Duration</h4>
                <p>{duration}</p>
              </div>
            </div>
          )}
          {booking && (
            <div className={styles.infoItem}>
              <div className={styles.infoIcon} aria-hidden="true">
                &#x1F4C5;
              </div>
              <div className={styles.infoContent}>
                <h4>Booking</h4>
                <p>{booking}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {whatsIncluded && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>What's Included</h3>
          <ul className={styles.bulletList}>
            {whatsIncluded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {goodToKnow && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Good to Know</h3>
          <ul className={styles.bulletList}>
            {goodToKnow.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

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
          onClick={handleBookClick}
          size="lg"
          className={styles.ctaButton}
        >
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
    </div>
  );
}
