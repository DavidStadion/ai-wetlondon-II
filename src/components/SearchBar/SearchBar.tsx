import { useRef, useCallback, useEffect } from "preact/hooks";
import { keywords } from "@/signals/filterSignals";
import styles from "./SearchBar.module.css";

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleInput = useCallback((e: Event) => {
    const value = (e.target as HTMLInputElement).value;

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      keywords.value = value;
      timeoutRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  const handleClear = useCallback(() => {
    keywords.value = "";
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasValue = keywords.value.length > 0;

  // Results live on /all-activities now, so searching has to take you there.
  const goToResults = useCallback(() => {
    const value = inputRef.current?.value ?? '';
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    keywords.value = value;
    if (window.location.pathname !== '/all-activities') {
      window.location.href = '/all-activities';
    }
  }, []);

  return (
    <form
      className={styles.container}
      onSubmit={(e) => { e.preventDefault(); goToResults(); }}
      role="search"
    >
      <span className={styles.icon} aria-hidden="true">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Search activities, venues, or categories..."
        defaultValue={keywords.value}
        onInput={handleInput}
        aria-label="Search activities"
      />
      {hasValue && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      <button type="submit" className={styles.submit}>Search</button>
    </form>
  );
}
