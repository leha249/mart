import { useEffect } from 'react';

export const useHotkey = (
  combo: string,
  handler: (e: KeyboardEvent) => void,
  active: boolean = true
) => {
  useEffect(() => {
    if (!active) return;

    const listener = (e: KeyboardEvent) => {
      const parts = combo.toLowerCase().split('+');
      const key = parts[parts.length - 1];
      const needsCmd = parts.includes('cmd') || parts.includes('meta');
      const needsCtrl = parts.includes('ctrl');
      const needsShift = parts.includes('shift');
      const needsAlt = parts.includes('alt');
      const needsEsc = parts.includes('esc') || parts.includes('escape');

      const pressedKey = needsEsc ? 'escape' : e.key.toLowerCase();

      if (pressedKey !== key) return;
      if (needsCmd && !e.metaKey) return;
      if (needsCtrl && !e.ctrlKey) return;
      if (needsShift && !e.shiftKey) return;
      if (needsAlt && !e.altKey) return;

      // Если требуется cmd/ctrl — не мешаем другим
      if (!needsCmd && !needsCtrl && (e.metaKey || e.ctrlKey)) return;

      handler(e);
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [combo, handler, active]);
};

export const useEscape = (handler: () => void, active: boolean = true) => {
  useHotkey('escape', handler, active);
};

export const useCmdK = (handler: () => void) => {
  useHotkey('cmd+k', handler);
  useHotkey('ctrl+k', handler);
};

export const useCmdS = (handler: (e: KeyboardEvent) => void, active = true) => {
  useHotkey(
    'cmd+s',
    (e) => {
      e.preventDefault();
      handler(e);
    },
    active
  );
  useHotkey(
    'ctrl+s',
    (e) => {
      e.preventDefault();
      handler(e);
    },
    active
  );
};