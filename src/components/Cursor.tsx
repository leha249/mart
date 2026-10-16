import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Cursor = () => {
  const isDesktop = useMediaQuery('(hover: hover) and (pointer: fine)');
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!isDesktop) return;
    document.body.classList.add('custom-cursor');

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setHidden(false);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
      }

      const target = e.target as HTMLElement;
      const isInteractive = !!target.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor-hover]'
      );
      setHovering(isInteractive);
    };

    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);

    const animate = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX - 20}px, ${ringY - 20}px, 0)`;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf);
      document.body.classList.remove('custom-cursor');
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--accent)',
          pointerEvents: 'none',
          zIndex: 10000,
          opacity: hidden ? 0 : 1,
          transition: 'opacity 0.2s, transform 0.1s',
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid var(--accent)',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: hidden ? 0 : hovering ? 0.9 : 0.5,
          transform: 'translate3d(-100px, -100px, 0)',
          transition: 'opacity 0.2s, width 0.3s, height 0.3s',
          willChange: 'transform',
          mixBlendMode: 'difference',
        }}
      />
    </>
  );
};

export default Cursor;