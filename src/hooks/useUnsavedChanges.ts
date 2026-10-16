import { useEffect } from 'react';

export const useUnsavedChanges = (hasChanges: boolean) => {
  useEffect(() => {
    if (!hasChanges) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasChanges]);
};