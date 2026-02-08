import { openNow, toggleType, toggleDateFilter } from "@/signals/filterSignals";
import type { VenueType } from "@/types";
import styles from "./QuickFilters.module.css";

interface QuickFilterDef {
  label: string;
  type: "venue" | "openNow" | "date";
  venueType?: VenueType;
}

const QUICK_FILTERS: QuickFilterDef[] = [
  { label: "Open Now", type: "openNow" },
  { label: "Museums", type: "venue", venueType: "museums" },
  { label: "Galleries", type: "venue", venueType: "galleries" },
  { label: "Theatre", type: "venue", venueType: "theatre" },
  { label: "Date ❤️", type: "date" },
  { label: "Cinema", type: "venue", venueType: "cinema" },
  { label: "Dining", type: "venue", venueType: "dining" },
];

function extraClass(filter: QuickFilterDef): string {
  if (filter.type === "openNow") return styles['open-now'];
  if (filter.type === "date") return styles['date-night'];
  return "";
}

function handleClick(filter: QuickFilterDef) {
  if (filter.type === "openNow") {
    openNow.value = !openNow.value;
  } else if (filter.type === "date") {
    toggleDateFilter();
  } else if (filter.venueType) {
    toggleType(filter.venueType);
  }
}

export function QuickFilters() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.pills}>
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={`${styles.pill} ${extraClass(filter)}`}
            onClick={() => handleClick(filter)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
