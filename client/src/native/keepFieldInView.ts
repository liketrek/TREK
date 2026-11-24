/**
 * The field being typed into stays above the keyboard, on every screen.
 *
 * The app is told to resize the page body for the keyboard, but on an iPad the
 * panes keep their full height (they are sized to the window, not the body),
 * so a field low in a scrolling pane (the settings, the tour editor's breaks,
 * a long form) ends up under the keyboard and the user types blind.
 *
 * Once the keyboard is up, the pane the field scrolls in gets room below its
 * content as tall as the keyboard, and is scrolled until the field sits above
 * the keyboard with a little air. The room goes again when the keyboard does.
 * A field already in view does not move, so screens that keep their composer
 * above the keyboard themselves (the chat, useKeyboardInset) are unaffected.
 */

const TYPING_TARGET = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';
/** What is left between the field and the keyboard's top edge. */
const AIR = 24;

interface KeyboardInfo {
  keyboardHeight: number;
}

interface KeyboardEvents {
  addListener(event: 'keyboardDidShow', listener: (info: KeyboardInfo) => void): Promise<unknown>;
  addListener(event: 'keyboardWillHide', listener: () => void): Promise<unknown>;
}

/** The pane given room for the keyboard, and what its bottom padding was before. */
let padded: { pane: HTMLElement; before: string } | null = null;

/**
 * The room at the end of a page that scrolls in no pane of its own, such as the
 * login: as tall as the screen, it has nothing to scroll by, and padding on the
 * body does not help while the keyboard plugin holds the body's height.
 */
let pageRoom: HTMLElement | null = null;

function scrollingPane(field: HTMLElement): HTMLElement | null {
  for (let node = field.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/** Gives the field's pane room for the keyboard and scrolls the field above it. */
export function revealFocusedField(keyboardHeight: number, doc: Document = document): void {
  const field = doc.activeElement;
  if (!(field instanceof HTMLElement) || !field.matches(TYPING_TARGET)) return;
  const view = doc.defaultView;
  const visibleBottom = (view?.innerHeight ?? 0) - keyboardHeight;
  const box = field.getBoundingClientRect();
  if (box.top >= 0 && box.bottom <= visibleBottom - AIR) return;

  const pane = scrollingPane(field);
  if (!pane) {
    if (!pageRoom) {
      releaseRoom();
      pageRoom = doc.createElement('div');
      pageRoom.setAttribute('aria-hidden', 'true');
      pageRoom.style.height = `${keyboardHeight}px`;
      doc.body.appendChild(pageRoom);
    }
    view?.scrollBy({ top: box.bottom - (visibleBottom - AIR), behavior: 'smooth' });
    return;
  }
  if (!padded || padded.pane !== pane) {
    releaseRoom();
    padded = { pane, before: pane.style.paddingBottom };
    pane.style.paddingBottom = `${keyboardHeight}px`;
  }
  pane.scrollBy({ top: box.bottom - (visibleBottom - AIR), behavior: 'smooth' });
}

/** Takes the room for the keyboard away again. */
export function releaseRoom(): void {
  pageRoom?.remove();
  pageRoom = null;
  if (!padded) return;
  padded.pane.style.paddingBottom = padded.before;
  padded = null;
}

/**
 * While the keyboard is up, a field can still move under it without a new
 * keyboard event: a list that keeps its entry field open after Enter grows the
 * new row above the field and pushes it down. Any change to the page while the
 * keyboard is up asks again, at most once a frame, and a field still in view
 * stays where it is.
 */
let watching: { observer: MutationObserver; view: Window; frame: number } | null = null;

function watchWhileTyping(keyboardHeight: number, doc: Document): void {
  stopWatching();
  const view = doc.defaultView;
  if (!view || typeof view.MutationObserver !== 'function') return;
  const observer = new view.MutationObserver(() => {
    if (!watching || watching.frame) return;
    watching.frame = view.requestAnimationFrame(() => {
      if (watching) watching.frame = 0;
      revealFocusedField(keyboardHeight, doc);
    });
  });
  watching = { observer, view, frame: 0 };
  observer.observe(doc.body, { childList: true, subtree: true });
}

function stopWatching(): void {
  if (!watching) return;
  watching.observer.disconnect();
  if (watching.frame) watching.view.cancelAnimationFrame(watching.frame);
  watching = null;
}

/** Wires it to the keyboard of the app. */
export function keepFieldInView(keyboard: KeyboardEvents, doc: Document = document): void {
  void keyboard.addListener('keyboardDidShow', ({ keyboardHeight }) => {
    revealFocusedField(keyboardHeight, doc);
    watchWhileTyping(keyboardHeight, doc);
  });
  void keyboard.addListener('keyboardWillHide', () => {
    stopWatching();
    releaseRoom();
  });
}
