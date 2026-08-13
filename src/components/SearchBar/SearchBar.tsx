import { useRef, useCallback, useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { keywords } from "@/signals/filterSignals";
import { filteredVenues } from "@/signals/venueSignals";
import { slugify } from "@/utils/slug";
import styles from "./SearchBar.module.css";

const DEBOUNCE_MS = 300;

/** Enough to be useful, few enough to fit above the fold on a phone. */
const SUGGESTION_LIMIT = 6;

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);

  /*
   * The results grid sits below an empty AdSense slot and the stats bar, so
   * even after the page was made to collapse on search you could not see
   * anything happen while typing. This dropdown puts the matches directly
   * under the box, which is also the only shape that works on a phone.
   */
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const term = keywords.value.trim();
  const suggestions = term.length >= 2
    ? filteredVenues.value.slice(0, SUGGESTION_LIMIT)
    : [];

  const handleInput = useCallback((e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setIsOpen(true);
    setActive(-1);

    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      keywords.value = value;
      timeoutRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  const handleClear = useCallback(() => {
    keywords.value = "";
    setIsOpen(false);
    setActive(-1);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  }, []);

  const hasValue = keywords.value.length > 0;

  /** Everything, on /all-activities. Used by Enter and the Search button. */
  const goToResults = useCallback(() => {
    const value = inputRef.current?.value ?? '';
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    keywords.value = value;
    setIsOpen(false);
    if (window.location.pathname !== '/all-activities') {
      route('/all-activities');
    }
  }, []);

  const openVenue = useCallback((name: string) => {
    setIsOpen(false);
    route(`/venue/${slugify(name)}`);
  }, []);

  /*
   * Keyboard support is the point of the combobox pattern, not decoration: a
   * dropdown you can only reach with a mouse is worse than no dropdown for
   * anyone using a keyboard or a screen reader.
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setIsOpen(false); setActive(-1); return; }
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      openVenue(suggestions[active].name);
    }
  }, [suggestions, active, openVenue]);

  const showList = isOpen && suggestions.length > 0;

  return (
    <form
      className={styles.container}
      onSubmit={(e) => { e.preventDefault(); goToResults(); }}
      role="search"
    >
      <span className={styles.icon} aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Search places, areas or categories"
        defaultValue={keywords.value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        // A blur that fires before the click would close the list first.
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        aria-label="Search activities"
        role="combobox"
        aria-expanded={showList}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `search-option-${active}` : undefined}
      />

      {hasValue && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      <button type="submit" className={styles.submit}>Search</button>

      {showList && (
        <ul className={styles.suggestions} id="search-suggestions" role="listbox">
          {suggestions.map((v, i) => (
            <li
              key={v.name}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === active}
              className={`${styles.suggestion} ${i === active ? styles.suggestionActive : ''}`}
              // mousedown, not click: click lands after blur has closed the list.
              onMouseDown={(e) => { e.preventDefault(); openVenue(v.name); }}
              onMouseEnter={() => setActive(i)}
            >
              <span className={styles.suggestionName}>{v.name}</span>
              <span className={styles.suggestionMeta}>
                {v.location} · {v.priceDisplay}
              </span>
            </li>
          ))}
          <li
            className={styles.suggestionAll}
            role="option"
            aria-selected={false}
            onMouseDown={(e) => { e.preventDefault(); goToResults(); }}
          >
            See all {filteredVenues.value.length} matches
          </li>
        </ul>
      )}
    </form>
  );
}
