/**
 * The field being typed into stays above the keyboard, on every screen.
 *
 * The app resizes the page body for the keyboard, but a field low in a
 * scrolling pane (the settings, a long form) is not moved by that: it ends up
 * under the keyboard and the user types blind. Once the keyboard is up, the
 * focused field is scrolled to the middle of what is left of the window.
 * Screens that keep their composer above the keyboard themselves (the chat,
 * useKeyboardInset) are unaffected: a field already in view does not move.
 */

const TYPING_TARGET = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

interface KeyboardEvents {
  addListener(event: 'keyboardDidShow', listener: () => void): Promise<unknown>;
}

/** Scrolls the focused field into view when it is one the user types into and it sits outside the window. */
export function revealFocusedField(doc: Document = document): void {
  const field = doc.activeElement;
  if (!(field instanceof HTMLElement) || !field.matches(TYPING_TARGET)) return;
  const box = field.getBoundingClientRect();
  const view = doc.defaultView;
  const height = view?.visualViewport?.height ?? view?.innerHeight ?? 0;
  if (box.top >= 0 && box.bottom <= height) return;
  field.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/** Wires it to the keyboard of the app. */
export function keepFieldInView(keyboard: KeyboardEvents): void {
  void keyboard.addListener('keyboardDidShow', () => revealFocusedField());
}
