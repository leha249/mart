import { useEffect, useRef } from 'react';

/**
 * Фон из точек: еле заметная сетка, которая «зумится» под курсором.
 * Канвас, без зависимостей. На тач-устройствах курсора нет — сетка
 * просто медленно дышит.
 */
const DotGrid = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      // Курсор вне области сетки — не подсвечиваем ничего.
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
        pointer.active = false;
        return;
      }

      pointer.tx = nx;
      pointer.ty = ny;
      pointer.active = true;
    };

    const onLeave = () => {
      pointer.active = false;
      pointer.tx = 0.5;
      pointer.ty = 0.5;
    };

    const GAP = 26;
    const RADIUS = 1.1;
    const INFLUENCE = 240;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    const draw = () => {
      pointer.x += (pointer.tx - pointer.x) * 0.07;
      pointer.y += (pointer.ty - pointer.y) * 0.07;

      const cx = pointer.x * width;
      const cy = pointer.y * height;

      ctx.clearRect(0, 0, width, height);

      for (let x = GAP / 2; x < width; x += GAP) {
        for (let y = GAP / 2; y < height; y += GAP) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.hypot(dx, dy);
          const influence = pointer.active
            ? Math.max(0, 1 - dist / INFLUENCE)
            : 0;

          // «Зум»: точка отъезжает от курсора и чуть растёт
          const scale = 1 + influence * 0.35;
          const px = cx + dx * scale;
          const py = cy + dy * scale;

          const alpha = 0.055 + influence * influence * 0.35;
          const radius = RADIUS + influence * 1.5;

          ctx.fillStyle = `rgba(232, 255, 90, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    // При «уменьшении движения» рисуем один статичный кадр.
    if (reduceMotion) cancelAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default DotGrid;
