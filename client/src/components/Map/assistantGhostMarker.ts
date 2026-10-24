import './assistantGhost.css';
import { categoryIconSvg } from './categoryIconSvg';
import type { AssistantGhost } from './mapViewContract';

/**
 * The assistant's suggested places on the map, built once for both renderers.
 *
 * A ghost is a plain element: the Leaflet map hands it to a divIcon, the GL
 * map positions it like its other hand-placed pins. Nothing from the ghost's
 * data goes in as markup. The name is an attribute and the renderer's own
 * label shows it as text, the category colour is a CSS variable set through
 * the style API, and the icon is looked up in the app's fixed icon table.
 */

/** The ghost's box in CSS pixels, for the anchor of a Leaflet divIcon. */
export const GHOST_SIZE = 30;
/** On a ghost whose suggestion is under the pointer, here or in the chat. */
export const GHOST_HOT_CLASS = 'is-hot';
/** On a real pin that just arrived from an applied suggestion. */
export const PLACE_POP_CLASS = 'trek-place-pop';
/** On a real pin the hovered suggestion is about. */
export const PLACE_PULSE_CLASS = 'trek-place-pulse';

const iconMarkup = new Map<string, string>();

/** The category's icon in the ghost's colour, rendered once per icon name. */
function ghostIcon(name: string | undefined): string {
  const key = name ?? '';
  let markup = iconMarkup.get(key);
  if (markup === undefined) {
    markup = categoryIconSvg(name, 14, 'currentColor');
    iconMarkup.set(key, markup);
  }
  return markup;
}

/**
 * A ghost's element: a dashed pin with its category's icon, or for a spot a
 * card marks (`point`) a small dashed dot without one.
 */
export function buildGhostElement(ghost: AssistantGhost): HTMLDivElement {
  const el = document.createElement('div');
  el.className = ghost.variant === 'point' ? 'trek-ghost trek-ghost--point' : 'trek-ghost';
  el.dataset.ghostId = ghost.id;
  el.dataset.ghostRef = ghost.ref ?? ghost.id;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', ghost.name);
  if (ghost.color) el.style.setProperty('--ghost-color', ghost.color);
  const face = document.createElement('div');
  face.className = 'trek-ghost-face';
  // A fixed glyph from the icon table, never anything the ghost carries.
  if (ghost.variant !== 'point') face.innerHTML = ghostIcon(ghost.icon);
  el.appendChild(face);
  return el;
}

export interface GhostHandlers {
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
}

/** What a renderer gives back for a ghost it put on its map. */
interface GhostPin {
  remove: () => void;
}

interface MountedGhosts {
  elements: Map<string, HTMLElement>;
  dispose: () => void;
}

/**
 * Puts every ghost on the map through `place` and wires the pointer: entering
 * and leaving report the hover, a click (or Enter) reports the ghost without
 * reaching the map underneath. The handlers are read through a ref, so a
 * parent passing fresh callbacks does not rebuild the pins.
 */
export function mountGhosts(
  ghosts: readonly AssistantGhost[],
  place: (el: HTMLElement, ghost: AssistantGhost) => GhostPin,
  handlers: { readonly current: GhostHandlers }
): MountedGhosts {
  const elements = new Map<string, HTMLElement>();
  const cleanups: (() => void)[] = [];
  for (const ghost of ghosts) {
    const el = buildGhostElement(ghost);
    const ref = ghost.ref ?? ghost.id;
    const enter = () => handlers.current.onHover?.(ref);
    const leave = () => handlers.current.onHover?.(null);
    const click = (event: Event) => {
      event.stopPropagation();
      handlers.current.onClick?.(ref);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Enter') click(event);
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('click', click);
    el.addEventListener('keydown', key);
    const pin = place(el, ghost);
    elements.set(ghost.id, el);
    cleanups.push(() => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('click', click);
      el.removeEventListener('keydown', key);
      pin.remove();
    });
  }
  return {
    elements,
    dispose: () => {
      cleanups.forEach((cleanup) => cleanup());
      elements.clear();
    },
  };
}

/** Marks the hovered ghosts (every one of a change lit by its call), and only them, without rebuilding any pin. */
export function setGhostHot(elements: ReadonlyMap<string, HTMLElement>, hoveredId: string | null | undefined): void {
  elements.forEach((el, id) => el.classList.toggle(GHOST_HOT_CLASS, (el.dataset.ghostRef ?? id) === hoveredId));
}
