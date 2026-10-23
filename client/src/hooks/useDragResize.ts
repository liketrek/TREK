import {
  type KeyboardEventHandler,
  type MouseEventHandler,
  type PointerEvent,
  type PointerEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

/** `x` runs from the viewport's inline-start edge (left, right in Arabic), `y` from the top. */
export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeEdge = 'n' | 's' | 'start' | 'end' | 'n-start' | 'n-end' | 's-start' | 's-end';

interface Bounds {
  viewport: WindowSize;
  minSize: WindowSize;
  margin: number;
  /** What a fixed bar covers at the top (the navbar); the window keeps its margin below it. */
  topInset: number;
}

interface DragResizeOptions {
  /** Where the last place and size are kept between visits. */
  storageKey: string;
  minSize: WindowSize;
  /** The size on the first visit, in the bottom inline-end corner. */
  defaultSize: WindowSize;
  /** The large size a double click on the handle switches to. */
  expandedSize: (viewport: WindowSize) => WindowSize;
  /** The window never comes closer to the viewport's edge than this. */
  margin: number;
  /** The distance from the edges a corner keeps, and how near a corner a released window snaps into it. */
  gap: number;
  /** Space at the top the window never moves into, so its handle stays above a fixed bar there. */
  topInset?: number;
}

/** Arrow keys move or resize by this much. */
const KEY_STEP = 16;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** The size that fits: at least the minimum, at most the viewport less its margins, and the viewport wins. */
function fitSize(size: WindowSize, { viewport, minSize, margin, topInset }: Bounds): WindowSize {
  const maxWidth = Math.max(0, viewport.width - 2 * margin);
  const maxHeight = Math.max(0, viewport.height - topInset - 2 * margin);
  return {
    width: Math.min(Math.max(size.width, minSize.width), maxWidth),
    height: Math.min(Math.max(size.height, minSize.height), maxHeight),
  };
}

/** The rect moved and shrunk until it lies inside the viewport, its margins kept. */
export function clampRect(rect: WindowRect, bounds: Bounds): WindowRect {
  const { width, height } = fitSize(rect, bounds);
  const { viewport, margin, topInset } = bounds;
  return {
    x: clamp(rect.x, margin, viewport.width - margin - width),
    y: clamp(rect.y, topInset + margin, viewport.height - margin - height),
    width,
    height,
  };
}

/** A size placed in the bottom inline-end corner, `gap` from both edges. */
export function cornerRect(size: WindowSize, gap: number, bounds: Bounds): WindowRect {
  const fitted = fitSize(size, bounds);
  return clampRect(
    {
      x: bounds.viewport.width - fitted.width - gap,
      y: bounds.viewport.height - fitted.height - gap,
      ...fitted,
    },
    bounds
  );
}

/** A released window within `gap` of a corner settles into it; anywhere else it stays. */
export function snapRect(rect: WindowRect, gap: number, bounds: Bounds): WindowRect {
  const { width, height } = bounds.viewport;
  const top = bounds.topInset + gap;
  const toEnd = width - rect.x - rect.width;
  const toBottom = height - rect.y - rect.height;
  const nearX = rect.x <= gap ? 'start' : toEnd <= gap ? 'end' : null;
  const nearY = rect.y <= top ? 'top' : toBottom <= gap ? 'bottom' : null;
  if (!nearX || !nearY) return rect;
  return clampRect(
    {
      ...rect,
      x: nearX === 'start' ? gap : width - rect.width - gap,
      y: nearY === 'top' ? top : height - rect.height - gap,
    },
    bounds
  );
}

/**
 * The rect with one edge or corner pulled by (dx, dy), dx along the inline
 * axis. The opposite edge stays where it was, also when the minimum size or
 * the viewport stops the pull.
 */
export function resizeRect(start: WindowRect, edge: ResizeEdge, dx: number, dy: number, bounds: Bounds): WindowRect {
  const { viewport, minSize, margin, topInset } = bounds;
  let { x, y, width, height } = start;
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  if (edge.endsWith('end')) width = clamp(start.width + dx, minSize.width, viewport.width - margin - start.x);
  if (edge.endsWith('start')) {
    width = clamp(start.width - dx, minSize.width, right - margin);
    x = right - width;
  }
  if (edge.startsWith('s')) height = clamp(start.height + dy, minSize.height, viewport.height - margin - start.y);
  if (edge.startsWith('n')) {
    height = clamp(start.height - dy, minSize.height, bottom - topInset - margin);
    y = bottom - height;
  }
  return clampRect({ x, y, width, height }, bounds);
}

/** The large size: at the inline end, `gap` from it, centred from top to bottom below the top inset. */
export function expandedRect(size: WindowSize, gap: number, bounds: Bounds): WindowRect {
  const fitted = fitSize(size, bounds);
  const { width, height } = bounds.viewport;
  const y = bounds.topInset + Math.round((height - bounds.topInset - fitted.height) / 2);
  return clampRect({ x: width - fitted.width - gap, y, ...fitted }, bounds);
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

interface ArrowPress {
  key: string;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

/**
 * Where Alt+arrow moves the rect and Alt+Shift+arrow resizes it (from its
 * bottom end corner), the arrows read as they look on screen; null for any
 * other key.
 */
export function keyedRect(rect: WindowRect, press: ArrowPress, rtl: boolean, bounds: Bounds): WindowRect | null {
  const arrow = ARROWS[press.key];
  if (!arrow || !press.altKey || press.ctrlKey || press.metaKey) return null;
  const dx = arrow[0] * KEY_STEP * (rtl ? -1 : 1);
  const dy = arrow[1] * KEY_STEP;
  if (press.shiftKey) return resizeRect(rect, 's-end', dx, dy, bounds);
  return clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, bounds);
}

function readViewport(): WindowSize {
  return { width: window.innerWidth, height: window.innerHeight };
}

function isRtl(): boolean {
  return document.documentElement.dir === 'rtl';
}

/** Typing in a field keeps its own Alt+arrow meaning (word jumps and selection on macOS). */
function isEditable(target: EventTarget): boolean {
  return target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]') !== null;
}

function readStored(key: string): WindowRect | null {
  try {
    const raw = localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== 'object') return null;
    const { x, y, width, height } = value as Record<string, unknown>;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
      return null;
    }
    return [x, y, width, height].every(Number.isFinite) ? { x, y, width, height } : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, rect: WindowRect): void {
  try {
    localStorage.setItem(key, JSON.stringify(rect));
  } catch {
    // A private window or blocked storage: next time the window simply starts in its corner.
  }
}

/** Reports each position of a captured pointer until it is released; the returned function stops listening. */
function followPointer(target: HTMLElement, onMove: (x: number, y: number) => void, onEnd: () => void): () => void {
  const move = (e: globalThis.PointerEvent) => onMove(e.clientX, e.clientY);
  const stop = () => {
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', end);
    target.removeEventListener('pointercancel', end);
  };
  const end = () => {
    stop();
    onEnd();
  };
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', end);
  return stop;
}

type Gesture = (dx: number, dy: number, bounds: Bounds) => WindowRect;

/**
 * Moves and resizes a floating window with the pointer and the keyboard: the
 * pointer on the handle drags it, on an edge or corner resizes it; a double
 * click on the handle switches between its size and a large one; Alt+arrows
 * move it, Alt+Shift+arrows resize it. It always stays inside the viewport,
 * also when the browser window shrinks, and it remembers where it was left.
 *
 * Logical throughout: `x` runs from the inline start, so in a right-to-left
 * page a pointer moving left moves the window towards its end.
 */
export function useDragResize({
  storageKey,
  minSize,
  defaultSize,
  expandedSize,
  margin,
  gap,
  topInset = 0,
}: DragResizeOptions) {
  const boundsOf = useCallback(
    (): Bounds => ({ viewport: readViewport(), minSize, margin, topInset }),
    [minSize, margin, topInset]
  );
  const [rect, setRect] = useState<WindowRect>(() => {
    const stored = readStored(storageKey);
    return stored ? clampRect(stored, boundsOf()) : cornerRect(defaultSize, gap, boundsOf());
  });
  const [active, setActive] = useState(false);
  /** The rect as last placed, for handlers that run between renders. */
  const rectRef = useRef(rect);
  /** The compact rect to go back to while the large size is on. */
  const restoreRef = useRef<WindowRect | null>(null);
  /** Stops listening to a pointer still held when the window goes away. */
  const stopRef = useRef<(() => void) | null>(null);

  const place = useCallback((next: WindowRect) => {
    rectRef.current = next;
    setRect(next);
  }, []);
  const commit = useCallback(
    (next: WindowRect) => {
      place(next);
      writeStored(storageKey, next);
    },
    [place, storageKey]
  );

  useEffect(() => {
    const onResize = () => place(clampRect(rectRef.current, boundsOf()));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [place, boundsOf]);

  useEffect(() => () => stopRef.current?.(), []);

  const startGesture = useCallback(
    (e: PointerEvent<HTMLElement>, apply: Gesture, settle: (released: WindowRect, bounds: Bounds) => WindowRect) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const origin = { x: e.clientX, y: e.clientY };
      const flip = isRtl() ? -1 : 1;
      let latest = rectRef.current;
      let moved = false;
      e.currentTarget.setPointerCapture(e.pointerId);
      setActive(true);
      stopRef.current = followPointer(
        e.currentTarget,
        (x, y) => {
          // Only a real move or resize ends the large size; the presses of a double click do not.
          if (!moved) restoreRef.current = null;
          moved = true;
          latest = apply((x - origin.x) * flip, y - origin.y, boundsOf());
          place(latest);
        },
        () => {
          stopRef.current = null;
          setActive(false);
          if (moved) commit(settle(latest, boundsOf()));
        }
      );
    },
    [place, boundsOf, commit]
  );

  const onHandlePointerDown = useCallback<PointerEventHandler<HTMLElement>>(
    (e) => {
      const start = rectRef.current;
      startGesture(
        e,
        (dx, dy, bounds) => clampRect({ ...start, x: start.x + dx, y: start.y + dy }, bounds),
        (released, bounds) => snapRect(released, gap, bounds)
      );
    },
    [startGesture, gap]
  );

  const onHandleDoubleClick = useCallback<MouseEventHandler<HTMLElement>>(() => {
    const bounds = boundsOf();
    const compact = restoreRef.current;
    restoreRef.current = compact ? null : rectRef.current;
    commit(compact ? clampRect(compact, bounds) : expandedRect(expandedSize(bounds.viewport), gap, bounds));
  }, [boundsOf, commit, expandedSize, gap]);

  const edgeProps = useCallback(
    (edge: ResizeEdge): { onPointerDown: PointerEventHandler<HTMLElement> } => ({
      onPointerDown: (e) => {
        const start = rectRef.current;
        startGesture(
          e,
          (dx, dy, bounds) => resizeRect(start, edge, dx, dy, bounds),
          (released) => released
        );
      },
    }),
    [startGesture]
  );

  const onKeyDown = useCallback<KeyboardEventHandler<HTMLElement>>(
    (e) => {
      if (isEditable(e.target)) return;
      const next = keyedRect(rectRef.current, e, isRtl(), boundsOf());
      if (!next) return;
      e.preventDefault();
      restoreRef.current = null;
      commit(next);
    },
    [boundsOf, commit]
  );

  return {
    rect,
    /** A pointer is moving or resizing the window right now. */
    active,
    handleProps: { onPointerDown: onHandlePointerDown, onDoubleClick: onHandleDoubleClick },
    edgeProps,
    onKeyDown,
  };
}
