// FE-LOGIN-WORLD-001 to FE-LOGIN-WORLD-014
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '../../../tests/helpers/render';
import LoginWorld from './LoginWorld';

// jsdom has no 2D context, so both the visible canvas and the offscreen dot layer
// get a recording stand-in. Contexts land in `contexts` in creation order:
// [0] is the visible canvas, [1] the first baked map layer.
function makeCtx() {
  const strokeStyles: string[] = [];
  const ctx = {
    setTransform: vi.fn(),
    scale: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    lineWidth: 0,
    fillStyle: '' as unknown,
    strokeStyles,
  };
  Object.defineProperty(ctx, 'strokeStyle', {
    get: () => strokeStyles[strokeStyles.length - 1] ?? '',
    set: (value: string) => {
      strokeStyles.push(value);
    },
  });
  return ctx;
}

type FakeCtx = ReturnType<typeof makeCtx>;

const origGetContext = HTMLCanvasElement.prototype.getContext;
const origRect = HTMLCanvasElement.prototype.getBoundingClientRect;
const origRaf = window.requestAnimationFrame;
const origCancel = window.cancelAnimationFrame;
const origRandom = Math.random;
const origDpr = window.devicePixelRatio;

let contexts: FakeCtx[] = [];
let queue: FrameRequestCallback[] = [];
let now = 0;
let cancelSpy: ReturnType<typeof vi.fn>;
let rectWidth = 800;
let rectHeight = 600;
/** How many getContext calls hand back a context before returning null. */
let contextBudget = Infinity;

function installContexts() {
  contexts = [];
  HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    if (contexts.length >= contextBudget) return null;
    const ctx = makeCtx();
    contexts.push(ctx);
    return ctx;
  }) as unknown as HTMLCanvasElement['getContext'];
}

/** Deterministic stand-in for Math.random so arc endpoints and timings repeat. */
function seedRandom(seed = 1) {
  let state = seed;
  Math.random = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function runFrames(count: number, dt = 48): number {
  for (let i = 0; i < count; i++) {
    const cb = queue.shift();
    if (!cb) return i;
    now += dt;
    cb(now);
  }
  return count;
}

function alphasOf(ctx: FakeCtx): number[] {
  return ctx.strokeStyles.map((s) => Number(/,\s*([\d.]+)\)$/.exec(s)?.[1] ?? NaN));
}

beforeEach(() => {
  rectWidth = 800;
  rectHeight = 600;
  contextBudget = Infinity;
  queue = [];
  now = 0;
  seedRandom();
  installContexts();
  HTMLCanvasElement.prototype.getBoundingClientRect = () =>
    ({
      width: rectWidth,
      height: rectHeight,
      top: 0,
      left: 0,
      right: rectWidth,
      bottom: rectHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  }) as typeof window.requestAnimationFrame;
  cancelSpy = vi.fn();
  window.cancelAnimationFrame = cancelSpy as typeof window.cancelAnimationFrame;
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = origGetContext;
  HTMLCanvasElement.prototype.getBoundingClientRect = origRect;
  window.requestAnimationFrame = origRaf;
  window.cancelAnimationFrame = origCancel;
  Math.random = origRandom;
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: origDpr });
  vi.unstubAllGlobals();
});

describe('LoginWorld', () => {
  it('FE-LOGIN-WORLD-001: renders a decorative canvas that never takes pointer events', () => {
    const { container } = render(<LoginWorld />);
    const canvas = container.querySelector('canvas')!;

    expect(canvas).toHaveAttribute('aria-hidden');
    expect(canvas.style.pointerEvents).toBe('none');
    expect(canvas.style.position).toBe('absolute');
    expect(canvas.className).toBe('');
  });

  it('FE-LOGIN-WORLD-002: marks the takeoff variant so the page can animate it in', () => {
    const { container } = render(<LoginWorld variant="takeoff" />);
    expect(container.querySelector('canvas')).toHaveClass('login-world-takeoff');
  });

  it('FE-LOGIN-WORLD-003: bakes the coastlines into an offscreen layer and blits it per frame', () => {
    render(<LoginWorld />);

    const [visible, layer] = contexts;
    // The layer is drawn once at mount…
    expect(layer.arc.mock.calls.length).toBeGreaterThan(500);
    expect(visible.arc.mock.calls.length).toBe(0);

    const layerDotsAtMount = layer.arc.mock.calls.length;
    runFrames(5);

    // …and only blitted afterwards, never redrawn.
    expect(layer.arc.mock.calls.length).toBe(layerDotsAtMount);
    expect(visible.drawImage).toHaveBeenCalledTimes(5);
    expect(visible.drawImage).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 800, 600);
    expect(visible.clearRect).toHaveBeenLastCalledWith(0, 0, 800, 600);
  });

  it('FE-LOGIN-WORLD-004: culls dots that fall outside the panel', () => {
    render(<LoginWorld />);
    const drawn = contexts[1].arc.mock.calls.length;

    // The map is scaled to cover the panel, so its sides run off it.
    expect(drawn).toBeGreaterThan(0);
    expect(drawn).toBeLessThan(7131);
  });

  it('FE-LOGIN-WORLD-005: caps the backing store at 2x device pixels', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 3 });
    const { container } = render(<LoginWorld />);
    const canvas = container.querySelector('canvas')!;

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(contexts[0].setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(contexts[1].scale).toHaveBeenCalledWith(2, 2);
  });

  it('FE-LOGIN-WORLD-006: falls back to 1x when the browser reports no pixel ratio', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 0 });
    const { container } = render(<LoginWorld />);

    expect(container.querySelector('canvas')!.width).toBe(800);
    expect(contexts[0].setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
  });

  it('FE-LOGIN-WORLD-007: opens with routes already in flight and keeps spawning them', () => {
    render(<LoginWorld />);
    const visible = contexts[0];

    runFrames(1);
    // Three routes are seeded before the first frame, plus one from the spawn timer.
    expect(visible.stroke.mock.calls.length).toBeGreaterThanOrEqual(3);

    runFrames(200);
    const before = visible.stroke.mock.calls.length;
    runFrames(1);
    const drawnThisFrame = visible.stroke.mock.calls.length - before;

    expect(drawnThisFrame).toBeGreaterThan(0);
    expect(drawnThisFrame).toBeLessThanOrEqual(7);
  });

  it('FE-LOGIN-WORLD-008: retires ambient routes by fading them out', () => {
    render(<LoginWorld />);
    runFrames(300);

    const alphas = alphasOf(contexts[0]);
    expect(alphas.length).toBeGreaterThan(0);
    // Fresh routes draw at 0.5; a retiring one is dimmer.
    expect(Math.max(...alphas)).toBeCloseTo(0.5, 5);
    expect(Math.min(...alphas)).toBeLessThan(0.5);
  });

  it('FE-LOGIN-WORLD-009: fires the whole network on takeoff and never lets it fade', () => {
    render(<LoginWorld variant="takeoff" />);
    const visible = contexts[0];

    // The cascade is staggered, so the opening frame is still empty.
    runFrames(1);
    expect(visible.stroke).not.toHaveBeenCalled();

    runFrames(120);
    const before = visible.stroke.mock.calls.length;
    runFrames(1);
    expect(visible.stroke.mock.calls.length - before).toBe(11);

    expect(alphasOf(visible).every((a) => a === 0.5)).toBe(true);
  });

  it('FE-LOGIN-WORLD-010: draws a real route when the two random endpoints collide', () => {
    // Every random draw is 0, so `from` and `to` both land on the first city and
    // the collision fix-up has to move `to` along.
    Math.random = () => 0;
    render(<LoginWorld />);
    runFrames(400);

    const visible = contexts[0];
    const start = visible.moveTo.mock.calls[0] as [number, number];
    const end = visible.lineTo.mock.calls[visible.lineTo.mock.calls.length - 1] as [number, number];

    expect(Math.hypot(end[0] - start[0], end[1] - start[1])).toBeGreaterThan(10);
    // Arrival lights the destination city.
    expect(visible.createRadialGradient.mock.calls.length).toBeGreaterThan(visible.stroke.mock.calls.length);
  });

  it('FE-LOGIN-WORLD-011: holds a still frame when the user asked for reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    render(<LoginWorld />);

    expect(queue).toHaveLength(0);
    expect(contexts[0].drawImage).toHaveBeenCalledTimes(1);
    expect(contexts[0].stroke).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-WORLD-015: leaves the still frame blank when the layer could not be baked', () => {
    contextBudget = 1;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    render(<LoginWorld />);

    expect(queue).toHaveLength(0);
    expect(contexts[0].clearRect).toHaveBeenCalledTimes(1);
    expect(contexts[0].drawImage).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-WORLD-016: animates normally when the browser exposes no matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    render(<LoginWorld />);

    expect(queue).toHaveLength(1);
    runFrames(5);
    expect(contexts[0].stroke.mock.calls.length).toBeGreaterThan(0);
  });

  it('FE-LOGIN-WORLD-012: rebakes the map on resize and stops listening once unmounted', () => {
    const { unmount } = render(<LoginWorld />);
    expect(contexts).toHaveLength(2);

    rectWidth = 500;
    rectHeight = 400;
    window.dispatchEvent(new Event('resize'));

    expect(contexts).toHaveLength(3);
    expect(contexts[0].setTransform).toHaveBeenCalledTimes(2);

    unmount();
    expect(cancelSpy).toHaveBeenCalled();

    window.dispatchEvent(new Event('resize'));
    expect(contexts).toHaveLength(3);
  });

  it('FE-LOGIN-WORLD-013: does nothing when the canvas has no 2D context', () => {
    contextBudget = 0;
    expect(() => render(<LoginWorld />)).not.toThrow();

    expect(contexts).toHaveLength(0);
    expect(queue).toHaveLength(0);
  });

  it('FE-LOGIN-WORLD-014: keeps animating routes when the offscreen layer cannot be built', () => {
    contextBudget = 1;
    render(<LoginWorld />);
    runFrames(10);

    const visible = contexts[0];
    expect(visible.drawImage).not.toHaveBeenCalled();
    expect(visible.clearRect).toHaveBeenCalledTimes(10);
    expect(visible.stroke.mock.calls.length).toBeGreaterThan(0);
  });
});
