import { useEffect, type RefObject } from 'react';

export const useClickOutside = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  active = true
) => {
  useEffect(() => {
    if (!active || !ref.current) return;

    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('touchstart', onTouchStart);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('touchstart', onTouchStart);
    };
  }, [ref, handler, active]);
};