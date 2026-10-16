import { useCallback, useState } from 'react';
import { STORAGE_KEYS, LIMITS } from '../utils/constants';

const load = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.recentlyViewed);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
};

export const useRecentlyViewed = () => {
  const [ids, setIds] = useState<number[]>(load);

  const save = useCallback((next: number[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.recentlyViewed, JSON.stringify(next));
    } catch {}
  }, []);

  const add = useCallback(
    (id: number) => {
      setIds((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(
          0,
          LIMITS.maxRecentlyViewed
        );
        save(next);
        return next;
      });
    },
    [save]
  );

  const clear = useCallback(() => {
    setIds([]);
    save([]);
  }, [save]);

  const pruneMissing = useCallback(
    (existingIds: number[]) => {
      setIds((prev) => {
        const filtered = prev.filter((id) => existingIds.includes(id));
        if (filtered.length === prev.length) return prev;
        save(filtered);
        return filtered;
      });
    },
    [save]
  );

  return { ids, add, clear, pruneMissing };
};