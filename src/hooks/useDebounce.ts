import { useEffect, useRef, useState } from 'react';

export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/**
 * Throttle — выполняет callback не чаще чем раз в delay мс.
 * Для scroll, resize, mousemove.
 */
export const useThrottle = <T extends (...args: never[]) => void>(
  callback: T,
  delay: number = 100
): ((...args: Parameters<T>) => void) => {
  const lastCall = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLast = now - lastCall.current;

    if (timeSinceLast >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - timeSinceLast);
    }
  }) as T;
};