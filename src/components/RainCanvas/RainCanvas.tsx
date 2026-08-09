import { useEffect, useRef } from 'preact/hooks';
import { weatherMood } from '@/signals/weatherSignals';
import styles from './RainCanvas.module.css';

/**
 * Ambient rain behind the hero.
 *
 * Canvas rather than a few hundred DOM nodes, the original implementation was
 * flagged as heavy in the backlog. One element, one rAF loop, no layout work.
 * Density follows the real weather, the pointer nudges the wind, and it doesn't
 * run at all for anyone who prefers reduced motion.
 */

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  /** Parallax depth 0–1: nearer drops are longer, faster and more opaque. */
  depth: number;
}

const DENSITY: Record<string, number> = {
  storm: 1.6,
  rain: 1.2,
  snow: 0.35,
  fog: 0.3,
  freezing: 0.35,
  dull: 0.45,
  heat: 0.18,   // barely there, a wink rather than a downpour
  fine: 0.22,
};

export function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef<string>('dull');
  moodRef.current = weatherMood.value ?? 'dull';

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let drops: Drop[] = [];
    let raf = 0;

    // Pointer steers the wind; eases back to a gentle default when idle
    let targetWind = 0.35;
    let wind = 0.35;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = DENSITY[moodRef.current] ?? 0.5;
      const count = Math.round((width * height) / 9000 * density);

      drops = Array.from({ length: count }, () => spawn(true));
    }

    function spawn(anywhere: boolean): Drop {
      const depth = Math.random();
      return {
        x: Math.random() * (width + 200) - 100,
        y: anywhere ? Math.random() * height : -20,
        len: 6 + depth * 16,
        speed: 2.2 + depth * 5.5,
        depth,
      };
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const rel = (e.clientX - rect.left) / rect.width;     // 0 → 1
      targetWind = (rel - 0.5) * 3.2;                        // lean with the cursor
    }

    function onPointerLeave() {
      targetWind = 0.35;
    }

    function frame() {
      ctx!.clearRect(0, 0, width, height);
      wind += (targetWind - wind) * 0.03;                    // ease, never snap

      ctx!.lineCap = 'round';

      for (const d of drops) {
        const drift = wind * (0.4 + d.depth);
        d.x += drift;
        d.y += d.speed;

        if (d.y > height + 20 || d.x < -120 || d.x > width + 120) {
          Object.assign(d, spawn(false));
          continue;
        }

        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(31, 67, 255, ${0.05 + d.depth * 0.16})`;
        ctx!.lineWidth = 0.6 + d.depth * 1.1;
        ctx!.moveTo(d.x, d.y);
        ctx!.lineTo(d.x - drift * 2.2, d.y - d.len);
        ctx!.stroke();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);

    // Don't burn frames on a hidden tab
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
