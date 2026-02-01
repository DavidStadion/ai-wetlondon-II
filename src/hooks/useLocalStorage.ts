import { signal, effect } from '@preact/signals';

/**
 * Hook for localStorage state syncing.
 * Reads initial value from localStorage and syncs updates back.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const storedValue = signal<T>(getStoredValue(key, initialValue));

  // Sync to localStorage when value changes
  effect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue.value));
    } catch {
      // Ignore write errors (quota exceeded, etc.)
    }
  });

  const setValue = (value: T): void => {
    storedValue.value = value;
  };

  return [storedValue.value, setValue];
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
