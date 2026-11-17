/**
 * Whether a finger or a pointer drives the app right now, for the styles that
 * only make sense with one of them.
 *
 * After a tap, iOS and Android send the mouse events a mouse would have sent:
 * mouseover first, which React reads as onMouseEnter, and WebKit sets :hover on
 * the tapped element. Neither is ever taken back by a mouseout, so the tint a
 * hover gives stays on the button until the next tap lands elsewhere, and on a
 * phone that reads as a web page. While a finger is in use <html> carries
 * data-touch-input: the build guards every :hover rule with it
 * (postcss/touchHover.js), and the made-up mouseover and mouseout stop here
 * before any handler sees them. A real pointer (an iPad trackpad or mouse)
 * clears the mark on its first move, and hover works as on a computer.
 *
 * Only the app calls this. In a browser a tablet keeps tap-to-hover, which is
 * how its users reach controls that show on hover.
 */

export const TOUCH_INPUT_ATTR = 'data-touch-input';

export function trackTouchInput(root: HTMLElement = document.documentElement, win: Window = window): () => void {
  const setTouch = (on: boolean) => {
    if (on === root.hasAttribute(TOUCH_INPUT_ATTR)) return;
    if (on) root.setAttribute(TOUCH_INPUT_ATTR, '');
    else root.removeAttribute(TOUCH_INPUT_ATTR);
  };
  // A phone starts with a finger; a trackpad says otherwise as soon as it moves.
  setTouch(true);

  const onPointerDown = (e: PointerEvent) => setTouch(e.pointerType !== 'mouse');
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') setTouch(false);
  };
  // Captured on the window, ahead of React's listener on the root and of every element's.
  const swallow = (e: Event) => {
    if (root.hasAttribute(TOUCH_INPUT_ATTR)) e.stopImmediatePropagation();
  };
  // WebKit applies :active on a phone only where a touchstart listener exists.
  const noop = () => {};

  const opts = { capture: true, passive: true } as const;
  win.addEventListener('pointerdown', onPointerDown, opts);
  win.addEventListener('pointerover', onPointerMove, opts);
  win.addEventListener('pointermove', onPointerMove, opts);
  win.addEventListener('mouseover', swallow, true);
  win.addEventListener('mouseout', swallow, true);
  win.document.addEventListener('touchstart', noop, { passive: true });

  return () => {
    win.removeEventListener('pointerdown', onPointerDown, opts);
    win.removeEventListener('pointerover', onPointerMove, opts);
    win.removeEventListener('pointermove', onPointerMove, opts);
    win.removeEventListener('mouseover', swallow, true);
    win.removeEventListener('mouseout', swallow, true);
    win.document.removeEventListener('touchstart', noop);
    root.removeAttribute(TOUCH_INPUT_ATTR);
  };
}
