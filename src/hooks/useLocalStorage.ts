import { useState, useCallback } from 'preact/hooks';

/**
 * Hook for localStorage state syncing.
 * Reads initial value from localStorage and syncs updates back.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => getStoredValue(key, initialValue));

  const setValue = useCallback((value: T): void => {
    setStoredValue(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors (quota exceeded, etc.)
    }
  }, [key]);

  return [storedValue, setValue];
}

function getStoredValue<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}
