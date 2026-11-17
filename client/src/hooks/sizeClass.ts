import { useSyncExternalStore } from 'react';
import { isNativeApp } from '../native/platform';

/**
 * The touch shell's size classes, the web's answer to UIKit's compact and
 * regular widths and to Android's window size classes. They are read off the
 * window's CSS size, which is the same in the iOS and the Android app (a CSS
 * pixel is a point there and a dp here), so both apps lay out alike.
 *
 * compact  every phone, upright or on its side, and the narrow Split View and
 *          Stage Manager windows. The shell as it has always been: the dock at
 *          the bottom, sheets rising from below, one column.
 * wide     from 600pt across and taller than a phone on its side: an iPad in
 *          any orientation or window above a third of the screen, a foldable
 *          unfolded. A navigation rail on the leading edge takes the dock's
 *          place, sheets become centred form sheets, lists get columns.
 * split    from 840pt across, Android's expanded width: room for two panes, so
 *          the trip's plan sits next to its map and settings show their
 *          sections beside the page. An Android foldable unfolded on its side
 *          (about 841dp) has it, an 11" iPad upright (834pt) does not.
 *
 * The height bound keeps a phone on its side compact: no phone is taller than
 * 500pt in landscape, no tablet or unfolded foldable is shorter.
 *
 * Only the app lays out for a large screen. In a browser the touch shell is
 * the phone's, below 768px (mobile/useIsPhone.ts), and stays compact there: an
 * iPad mini upright in Safari or a narrowed desktop window keeps the dock it
 * always had.
 *
 * The class is one value in JavaScript, and the stylesheet follows it rather
 * than asking media queries of its own: MobileShell writes it to the shell's
 * root as data-size, and the `wide:` and `split:` variants (tailwind.config.js)
 * and the shell's variables (mobile.css) key on that attribute. So the hooks
 * and the CSS never disagree, and the guard against the soft keyboard below
 * holds for both.
 */
export type SizeClass = 'compact' | 'wide' | 'split';

const WIDE_MIN_WIDTH = 600;
const SPLIT_MIN_WIDTH = 840;
const MIN_HEIGHT = 501;

/** The class of a window of this size, in CSS pixels. */
export function sizeClassOf(width: number, height: number): SizeClass {
  if (width < WIDE_MIN_WIDTH || height < MIN_HEIGHT) return 'compact';
  return width >= SPLIT_MIN_WIDTH ? 'split' : 'wide';
}

/** Input types that bring up no soft keyboard. */
const NO_KEYBOARD = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** Whether the focused element is one the soft keyboard comes up for. */
function typing(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el.tagName === 'TEXTAREA') return true;
  return el instanceof HTMLInputElement && !NO_KEYBOARD.has(el.type);
}

let seen: { width: number; height: number } | null = null;
let pinned: SizeClass | null = null;
let listening = false;
const listeners = new Set<() => void>();

/**
 * Takes in the window's size, except a height lost to the soft keyboard.
 *
 * Android resizes the WebView when the keyboard comes up (adjustResize), so a
 * tablet on its side keeps about 400px of height while a field has focus. Read
 * as it is, that made the class compact for as long as one typed: the rail
 * turned into the dock, form sheets into bottom sheets, and a pane that
 * remounted on the way took the focused field with it, which closed the
 * keyboard, which brought the class back, in a loop. A window that only grew
 * shorter, at the same width, while a field has focus is the keyboard, not a
 * new window: the height seen before stays. The keyboard going down, a turn or
 * any other resize is taken as it comes.
 */
function measure(): boolean {
  const next = { width: window.innerWidth, height: window.innerHeight };
  const prev = seen;
  if (prev && next.width === prev.width && next.height < prev.height && typing()) return false;
  seen = next;
  return !prev || prev.width !== next.width || prev.height !== next.height;
}

function follow(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('resize', () => {
    if (measure()) for (const listener of listeners) listener();
  });
}

function read(): SizeClass {
  if (pinned) return pinned;
  if (typeof window === 'undefined' || !isNativeApp()) return 'compact';
  follow();
  if (!seen) measure();
  return seen ? sizeClassOf(seen.width, seen.height) : 'compact';
}

function subscribe(listener: () => void): () => void {
  follow();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverClass = (): SizeClass => 'compact';

/** Whether the touch shell is laid out for a wide window right now, outside React. */
export function isWideViewport(): boolean {
  return read() !== 'compact';
}

/** The size class. Follows rotation, folding and resizing, not the soft keyboard. */
export function useSizeClass(): SizeClass {
  return useSyncExternalStore(subscribe, read, serverClass);
}

/** True while the window is in the wide size class (split included). */
export function useIsWide(): boolean {
  return useSizeClass() !== 'compact';
}

/** True while the window has room for two panes side by side. */
export function useIsSplit(): boolean {
  return useSizeClass() === 'split';
}

/** Test helper: pins the size class, or with null hands it back to the window. */
export function _pinSizeClass(next: SizeClass | null): void {
  pinned = next;
  for (const listener of listeners) listener();
}

/** Test helper: forgets the window size seen so far. */
export function _resetSizeClass(): void {
  pinned = null;
  seen = null;
}
