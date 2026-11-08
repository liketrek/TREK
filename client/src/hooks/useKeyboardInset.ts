import { Keyboard } from '@capacitor/keyboard';
import { useSyncExternalStore } from 'react';
import { isNativeApp } from '../native/platform';

/**
 * The keyboard's height as the app reports it (@capacitor/keyboard). The app
 * resizes the body for the keyboard (KeyboardResize.Body in capacitor.config),
 * which leaves the visual viewport as it was and does nothing for a screen built
 * of fixed layers, as the trip shell is, so there only the app can say how much
 * the keyboard covers.
 */
let nativeHeight = 0;
let followingNative = false;
const nativeListeners = new Set<() => void>();

function setNativeHeight(height: number): void {
  nativeHeight = Math.max(0, Math.round(height));
  for (const listener of nativeListeners) listener();
}

function followNativeKeyboard(): void {
  if (followingNative || !isNativeApp()) return;
  followingNative = true;
  void Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => setNativeHeight(keyboardHeight));
  void Keyboard.addListener('keyboardWillHide', () => setNativeHeight(0));
}

/** How far the on-screen keyboard reaches into the layout viewport, in px; 0 when none is up. */
function readInset(): number {
  const viewport = window.visualViewport;
  const fromViewport = viewport
    ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
    : 0;
  return Math.max(fromViewport, nativeHeight);
}

function subscribe(onChange: () => void): () => void {
  followNativeKeyboard();
  nativeListeners.add(onChange);
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', onChange);
  viewport?.addEventListener('scroll', onChange);
  return () => {
    nativeListeners.delete(onChange);
    viewport?.removeEventListener('resize', onChange);
    viewport?.removeEventListener('scroll', onChange);
  };
}

/**
 * The height the phone's keyboard covers at the bottom of the screen, read
 * off the visual viewport, and in the app off the keyboard itself. A
 * full-screen view pads its bottom by it, so a composer at the foot stays above
 * the keys instead of under them: iOS Safari lays the keyboard over the page
 * without resizing it, and the app resizes only the body.
 */
export function useKeyboardInset(): number {
  return useSyncExternalStore(subscribe, readInset, () => 0);
}

/** Test helper: forgets the keyboard the app reported and lets it be followed afresh. */
export function _resetNativeKeyboard(): void {
  nativeHeight = 0;
  followingNative = false;
}
