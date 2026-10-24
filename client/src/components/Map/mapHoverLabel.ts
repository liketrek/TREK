/**
 * A name and a short detail floating over a GL map (the via ferrata under the
 * pointer and its grade, a tour waypoint and its role), the twin of the
 * Leaflet `map-tooltip`: the look of the shared Tooltip (card surface, faint
 * edge, caption tier), just above the point it is shown for.
 *
 * Built from the DOM rather than React, because it follows every mouse move:
 * a React state per move would render the whole map view each time. The words
 * go in as text, never as markup. It lives in the map's own container, so it
 * scrolls, hides and goes away with the map.
 */

/** How far above the pointer the label floats, in CSS pixels. */
const POINTER_GAP = 12;

/** The detail beside the name (a role, a grade) as a badge, as the shared pills draw one. */
export const MAP_LABEL_BADGE_CLASS =
  'ms-1.5 inline-flex h-[18px] items-center rounded-full bg-surface-secondary px-1.5 font-semibold text-content-secondary ring-1 ring-inset ring-edge-faint';

const LABEL_CLASS =
  'pointer-events-none absolute z-20 flex items-center whitespace-nowrap rounded-lg border border-edge-faint bg-surface-card px-2.5 py-1 text-caption font-medium text-content shadow-lg';

/** Just the call the label needs, so the Mapbox and the MapLibre map both fit, and a stand-in without it gets none. */
interface LabelHost {
  getContainer?(): HTMLElement;
}

export interface MapHoverLabel {
  /** `owner` is what the label is shown for, so a stale hide from another pin leaves it alone. */
  show(text: { name: string; detail: string | null }, point: { x: number; y: number }, owner?: object): void;
  /** Whether the label is up for this owner. */
  shownFor(owner: object): boolean;
  hide(): void;
  remove(): void;
}

const NO_LABEL: MapHoverLabel = {
  show: () => undefined,
  shownFor: () => false,
  hide: () => undefined,
  remove: () => undefined,
};

export function mapHoverLabel(map: LabelHost, testId = 'map-hover-label'): MapHoverLabel {
  if (typeof map.getContainer !== 'function' || typeof document === 'undefined') return NO_LABEL;
  const container = map.getContainer();
  let element: HTMLDivElement | null = null;
  let shownOwner: object | null = null;

  const ensure = () => {
    if (element) return element;
    element = document.createElement('div');
    element.className = LABEL_CLASS;
    element.setAttribute('role', 'tooltip');
    element.dataset.testid = testId;
    // The pointer's pixel on the map, not a side of the text: placed from the corner either way.
    element.style.inset = '0px auto auto 0px';
    // The map's own stylesheet sets Helvetica/Arial on its container; the label speaks in the app's face.
    element.style.fontFamily = 'var(--font-system)';
    container.appendChild(element);
    return element;
  };

  return {
    show({ name, detail }, { x, y }, owner) {
      const label = ensure();
      shownOwner = owner ?? null;
      label.replaceChildren(document.createTextNode(name));
      if (detail) {
        const badge = document.createElement('span');
        badge.className = MAP_LABEL_BADGE_CLASS;
        badge.textContent = detail;
        label.appendChild(badge);
      }
      label.style.transform = `translate(${x}px, ${y - POINTER_GAP}px) translate(-50%, -100%)`;
      // Not the hidden attribute: the label's `flex` class would win over it and keep it on screen.
      label.style.display = '';
    },
    shownFor(owner) {
      return !!element && element.style.display !== 'none' && shownOwner === owner;
    },
    hide() {
      shownOwner = null;
      if (element) element.style.display = 'none';
    },
    remove() {
      element?.remove();
      element = null;
    },
  };
}

/** What a map pin names on hover: its place and, beside it, its role. */
export interface PinHoverText {
  name: string;
  detail: string | null;
}

/**
 * Shows the label above a pin while the pointer rests on it, and hides it the
 * moment the pin is pressed, so it never trails a drag. A map that moves its
 * markers every frame (the 3D terrain) can leave a pin without a leave event,
 * so a move anywhere else on the map, or off it, hides the label too, as long
 * as it is still this pin's. Returns the unwiring.
 */
export function bindPinHoverLabel(
  pin: HTMLElement,
  label: MapHoverLabel,
  container: HTMLElement,
  text: PinHoverText
): () => void {
  const show = () => {
    const box = pin.getBoundingClientRect();
    const frame = container.getBoundingClientRect();
    label.show(text, { x: box.left + box.width / 2 - frame.left, y: box.top - frame.top }, pin);
  };
  const hide = () => label.hide();
  const away = (event: Event) => {
    if (!label.shownFor(pin)) return;
    if (event.type === 'pointerleave' || !(event.target instanceof Node && pin.contains(event.target))) label.hide();
  };
  pin.addEventListener('pointerenter', show);
  pin.addEventListener('pointerleave', hide);
  pin.addEventListener('pointerdown', hide);
  container.addEventListener('pointermove', away);
  container.addEventListener('pointerleave', away);
  return () => {
    pin.removeEventListener('pointerenter', show);
    pin.removeEventListener('pointerleave', hide);
    pin.removeEventListener('pointerdown', hide);
    container.removeEventListener('pointermove', away);
    container.removeEventListener('pointerleave', away);
  };
}
