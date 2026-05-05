import { useEffect, useState } from 'react';

/**
 * Returns `value` after `delay` ms of no further changes. Useful for search
 * inputs that drive a server query — typing "andrei" shouldn't fire 6 requests.
 *
 * Equivalent to lodash.debounce on a value, without pulling in lodash.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}
