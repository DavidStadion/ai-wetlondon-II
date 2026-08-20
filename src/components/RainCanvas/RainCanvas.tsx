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

export interface RainCanvasProps {
  /** Drop colour as an "r, g, b" triple. Defaults to the wet blue. */
  rgb?: string;
  /** Fixed density, overriding the weather. Use where the rain is decorative. */
  density?: number;
  /** Multiplies drop opacity. Pale rain on a dark ground needs more than 1. */
  alpha?: number;
  /**
   * Resting slant. The pointer still steers the wind while it is over the
   * canvas; this is the lean it holds otherwise, and what it eases back to.
   * Negative blows the other way.
   */
  wind?: number;
}

export function RainCanvas({ rgb = '31, 67, 255', density, alpha = 1, wind: restWind = 0.35 }: RainCanvasProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef<string>('dull');
  moodRef.current = weatherMood.value ?? 'dull';

  // Refs rather than effect deps, so changing these never restarts the loop.
  const rgbRef = useRef(rgb);
  const densityRef = useRef(density);
  const alphaRef = useRef(alpha);
  const windRef = useRef(restWind);
  rgbRef.current = rgb;
  densityRef.current = density;
  alphaRef.current = alpha;
  windRef.current = restWind;

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

    // Pointer steers the wind; eases back to the resting lean when idle
    let targetWind = windRef.current;
    let wind = windRef.current;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = densityRef.current ?? DENSITY[moodRef.current] ?? 0.5;
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
      // Clamped because there are several canvases now: a pointer far outside
      // one of them would otherwise compute a hurricane.
      const raw = (e.clientX - rect.left) / rect.width;
      const rel = Math.min(1, Math.max(0, raw));
      targetWind = (rel - 0.5) * 3.2;                        // lean with the cursor
    }

    function onPointerLeave() {
      targetWind = windRef.current;
    }

    function draw() {
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
        ctx!.strokeStyle = `rgba(${rgbRef.current}, ${(0.05 + d.depth * 0.16) * alphaRef.current})`;
        ctx!.lineWidth = 0.6 + d.depth * 1.1;
        ctx!.moveTo(d.x, d.y);
        ctx!.lineTo(d.x - drift * 2.2, d.y - d.len);
        ctx!.stroke();
      }
    }

    /*
     * There are several of these on a page now, and the footer's sits below the
     * fold on every route, so a loop that always ran would burn frames drawing
     * rain nobody is looking at. Animate only while on screen and only while the
     * tab is visible.
     */
    let onScreen = false;
    let running = false;

    function start() {
      if (running || !onScreen || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frameLoop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function frameLoop() {
      draw();
      if (running) raf = requestAnimationFrame(frameLoop);
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        if (onScreen) start();
        else stop();
      },
      { rootMargin: '120px' },
    );
    io.observe(canvas);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
