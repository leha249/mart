import { useEffect } from 'react';

export const useLenis = () => {
  useEffect(() => {
    // Проверяем доступность Lenis
    let lenis: any = null;
    let rafId: number = 0;

    const init = async () => {
      try {
        const Lenis = (await import('lenis')).default;
        lenis = new Lenis({
          duration: 1.1,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.5,
        });

        const raf = (time: number) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      } catch (e) {
        // Lenis не установлен — fallback на нативный scroll
        console.warn('[useLenis] Lenis not installed, using native scroll');
      }
    };

    init();

    return () => {
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);
};