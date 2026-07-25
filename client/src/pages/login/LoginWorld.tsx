import React from 'react';
import { WORLD_GRID_H, WORLD_GRID_W, WORLD_LAT_BOT, WORLD_LAT_TOP, worldDots } from './worldDots';

/**
 * The login backdrop: TREK's own coastlines as a dot map, with routes lighting up
 * between cities across it.
 *
 * The dots come from the Atlas admin-0 bundle, baked into worldDots.ts — the login
 * screen is unauthenticated, so it cannot fetch Atlas at runtime.
 *
 * Perf: the map itself is drawn once into an offscreen canvas and blitted each
 * frame; only the handful of live arcs and their city glows are drawn per frame.
 * No shadowBlur in the frame path.
 */

/** Landmark cities, the anchors every route runs between. */
const CITIES: [number, number][] = [
  [52.52, 13.4], [48.85, 2.35], [51.5, -0.12], [40.4, -3.7], [41.9, 12.5], [59.33, 18.07],
  [41.0, 28.98], [55.75, 37.62], [52.37, 4.9], [64.15, -21.9], [38.72, -9.14], [50.08, 14.44],
  [30.04, 31.24], [6.52, 3.38], [-1.29, 36.82], [-33.92, 18.42], [33.57, -7.59],
  [25.2, 55.27], [19.08, 72.88], [28.61, 77.21], [13.76, 100.5], [1.35, 103.82],
  [-6.21, 106.85], [35.68, 139.69], [37.57, 126.98], [39.9, 116.4], [31.23, 121.47],
  [22.32, 114.17], [-33.87, 151.21], [-36.85, 174.76], [-27.47, 153.03],
  [49.28, -123.12], [37.77, -122.42], [40.71, -74.01], [41.88, -87.63], [43.65, -79.38],
  [19.43, -99.13], [25.76, -80.19], [4.71, -74.07], [-12.05, -77.04], [-23.55, -46.63],
  [-34.6, -58.38], [-33.45, -70.67],
];

interface Arc {
  from: number;
  to: number;
  /** 0 → 1 progress of the light travelling the arc. */
  t: number;
  speed: number;
  /** Stays lit briefly after arrival, then fades. */
  hold: number;
  lift: number;
  /** Milliseconds still to wait before this one starts (takeoff cascade). */
  delay: number;
}

const MAX_ARCS = 7;
const DOT_COLOUR = 'rgba(148, 163, 214, 0.55)';

interface LoginWorldProps {
  /**
   * `ambient` is the login backdrop: a few routes at a time, forever.
   * `takeoff` is the sign-in moment: the whole network fires at once and stays lit.
   */
  variant?: 'ambient' | 'takeoff';
}

export default function LoginWorld({ variant = 'ambient' }: LoginWorldProps): React.ReactElement {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const takeoff = variant === 'takeoff';

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const dots = worldDots();

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let mapLayer: HTMLCanvasElement | null = null;
    /** Map placement in CSS pixels, shared by the layer and the city projection. */
    let originX = 0;
    let originY = 0;
    let cell = 1;

    const project = (lat: number, lon: number) => ({
      x: originX + ((lon + 180) / 360) * (WORLD_GRID_W - 1) * cell,
      y: originY + ((WORLD_LAT_TOP - lat) / (WORLD_LAT_TOP - WORLD_LAT_BOT)) * (WORLD_GRID_H - 1) * cell,
    });

    /** Redraw the static dot map. Called on mount and on resize only. */
    function buildMap() {
      // Cover the panel, biased up a little so the busier northern half sits behind
      // the copy rather than under it.
      cell = Math.max(width / (WORLD_GRID_W - 1), height / (WORLD_GRID_H - 1)) * 1.08;
      originX = (width - (WORLD_GRID_W - 1) * cell) / 2;
      originY = (height - (WORLD_GRID_H - 1) * cell) / 2;

      const layer = document.createElement('canvas');
      layer.width = Math.max(1, Math.floor(width * dpr));
      layer.height = Math.max(1, Math.floor(height * dpr));
      const lc = layer.getContext('2d');
      if (!lc) return;
      lc.scale(dpr, dpr);
      lc.fillStyle = DOT_COLOUR;
      const r = Math.max(0.6, cell * 0.19);
      for (const d of dots) {
        const x = originX + d.x * cell;
        const y = originY + d.y * cell;
        if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue;
        lc.beginPath();
        lc.arc(x, y, r, 0, Math.PI * 2);
        lc.fill();
      }
      mapLayer = layer;
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildMap();
    }

    const arcs: Arc[] = [];

    function spawnArc(opts?: { delay?: number; speed?: number }) {
      if (!takeoff && arcs.length >= MAX_ARCS) return;
      const from = Math.floor(Math.random() * CITIES.length);
      let to = Math.floor(Math.random() * CITIES.length);
      if (to === from) to = (to + 1 + Math.floor(Math.random() * 3)) % CITIES.length;
      arcs.push({
        from,
        to,
        t: 0,
        // Per millisecond, so 1/speed is the flight time: roughly 3–5s. Long enough
        // to read as a journey, short enough that the map keeps moving.
        speed: opts?.speed ?? 0.0002 + Math.random() * 0.00013,
        hold: 0,
        // Longer hops bow higher, the way a route reads on a map.
        lift: 0.16 + Math.random() * 0.16,
        delay: opts?.delay ?? 0,
      });
    }

    /**
     * Sign-in: the whole network lights up at once. Routes leave in a staggered
     * cascade so it reads as departures rather than one flash, and nothing fades —
     * the finished web is the last thing on screen before the app takes over.
     */
    function burst() {
      for (let i = 0; i < 11; i++) {
        spawnArc({ delay: i * 105 + Math.random() * 70, speed: 0.0013 + Math.random() * 0.0009 });
      }
    }

    /** Quadratic arc between two projected cities, bowed away from the straight line. */
    function arcPoints(a: Arc) {
      const p1 = project(CITIES[a.from][0], CITIES[a.from][1]);
      const p2 = project(CITIES[a.to][0], CITIES[a.to][1]);
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      // Perpendicular offset, always bowing "up" so arcs never dive off-screen.
      const cx = mx - (dy / len) * len * a.lift * Math.sign(dx || 1);
      const cy = my + (dx / len) * len * a.lift * Math.sign(dx || 1) - len * 0.08;
      return { p1, p2, cx, cy };
    }

    function pointOn(p1: { x: number; y: number }, cx: number, cy: number, p2: { x: number; y: number }, t: number) {
      const u = 1 - t;
      return {
        x: u * u * p1.x + 2 * u * t * cx + t * t * p2.x,
        y: u * u * p1.y + 2 * u * t * cy + t * t * p2.y,
      };
    }

    function cityGlow(x: number, y: number, alpha: number, radius: number) {
      const g = ctx!.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(199, 210, 254, ${alpha})`);
      g.addColorStop(0.35, `rgba(129, 140, 248, ${alpha * 0.5})`);
      g.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.arc(x, y, radius, 0, Math.PI * 2);
      ctx!.fill();
    }

    let last = 0;
    let spawnTimer = 0;

    function frame(now: number) {
      const dt = last ? Math.min(now - last, 48) : 16;
      last = now;

      ctx!.clearRect(0, 0, width, height);
      if (mapLayer) ctx!.drawImage(mapLayer, 0, 0, width, height);

      if (!takeoff) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnArc();
          spawnTimer = 1600 + Math.random() * 2200;
        }
      }

      for (let i = arcs.length - 1; i >= 0; i--) {
        const a = arcs[i];

        if (a.delay > 0) {
          a.delay -= dt;
          continue;
        }

        const { p1, p2, cx, cy } = arcPoints(a);

        if (a.t < 1) a.t = Math.min(1, a.t + a.speed * dt);
        else a.hold += dt;

        // Ambient routes retire to make room for the next; the takeoff web stays lit.
        const fade = takeoff ? 1 : a.hold > 2200 ? Math.max(0, 1 - (a.hold - 2200) / 2400) : 1;
        if (fade <= 0) {
          arcs.splice(i, 1);
          continue;
        }

        // The drawn portion, with the leading edge brightest.
        ctx!.strokeStyle = `rgba(129, 140, 248, ${0.5 * fade})`;
        ctx!.lineWidth = 1.4;
        ctx!.beginPath();
        const segs = Math.max(2, Math.round(34 * a.t));
        for (let s = 0; s <= segs; s++) {
          const pt = pointOn(p1, cx, cy, p2, (a.t * s) / segs);
          if (s === 0) ctx!.moveTo(pt.x, pt.y);
          else ctx!.lineTo(pt.x, pt.y);
        }
        ctx!.stroke();

        // Origin lights the moment the route leaves it, destination on arrival.
        cityGlow(p1.x, p1.y, 0.55 * fade, Math.max(9, cell * 2.6));
        if (a.t >= 1) cityGlow(p2.x, p2.y, 0.6 * fade, Math.max(11, cell * 3));

        // The travelling head.
        if (a.t < 1) {
          const head = pointOn(p1, cx, cy, p2, a.t);
          cityGlow(head.x, head.y, 0.75, Math.max(7, cell * 2));
          ctx!.fillStyle = 'rgba(224, 242, 254, 0.95)';
          ctx!.beginPath();
          ctx!.arc(head.x, head.y, 1.8, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      raf = window.requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduced) {
      // Still frame: the map, no routes firing.
      ctx.clearRect(0, 0, width, height);
      if (mapLayer) ctx.drawImage(mapLayer, 0, 0, width, height);
    } else if (takeoff) {
      burst();
      raf = window.requestAnimationFrame(frame);
    } else {
      // Open with a few routes already in flight instead of an empty map.
      for (let i = 0; i < 3; i++) {
        spawnArc();
        const a = arcs[arcs.length - 1];
        if (a) a.t = Math.random() * 0.6;
      }
      raf = window.requestAnimationFrame(frame);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [takeoff]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={takeoff ? 'login-world-takeoff' : undefined}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.85 }}
    />
  );
}
