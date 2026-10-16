import { useEffect } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

export const useKeyPress = (
  key: string | string[],
  handler: KeyHandler,
  active = true
) => {
  useEffect(() => {
    if (!active) return;

    const keys = Array.isArray(key) ? key : [key];

    const listener = (e: KeyboardEvent) => {
      if (keys.includes(e.key)) handler(e);
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, handler, active]);
};

export const useHotkey = (
  hotkey: string,
  handler: KeyHandler,
  active = true
) => {
  useEffect(() => {
    if (!active) return;

    const listener = (e: KeyboardEvent) => {
      const parts = hotkey.toLowerCase().split('+');
      const key = parts[parts.length - 1];
      const needsCmd = parts.includes('cmd') || parts.includes('meta');
      const needsCtrl = parts.includes('ctrl');
      const needsShift = parts.includes('shift');
      const needsAlt = parts.includes('alt');

      if (e.key.toLowerCase() !== key) return;
      if (needsCmd && !e.metaKey) return;
      if (needsCtrl && !e.ctrlKey) return;
      if (needsShift && !e.shiftKey) return;
      if (needsAlt && !e.altKey) return;

      handler(e);
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [hotkey, handler, active]);
};