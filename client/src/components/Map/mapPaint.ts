import { useEffect, useState } from 'react';

/**
 * Colours for map paint, read off the theme. Map paint cannot take a
 * `var(--token)`: Leaflet writes the colour into an SVG attribute and GL
 * paint wants a resolved colour string. So the map layers name the tokens
 * they draw with, and the colours are read off the document when they draw,
 * which keeps light and dark mode apart without a colour literal in a layer.
 */

/** The attributes `applyAppearance()` writes on `<html>` that change what the tokens resolve to. */
const THEME_ATTRIBUTES = ['class', 'style', 'data-scheme'];

/** What each token resolves to on the root, `currentColor` where nothing defines it (a test DOM). */
export function readMapPaint<K extends string>(tokens: Readonly<Record<K, string>>): Record<K, string> {
  const style = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
  const keys = Object.keys(tokens) as K[];
  return Object.fromEntries(
    keys.map((key) => [key, style?.getPropertyValue(tokens[key]).trim() || 'currentColor'])
  ) as Record<K, string>;
}

export function sameMapPaint<K extends string>(
  a: Readonly<Record<K, string>>,
  b: Readonly<Record<K, string>>
): boolean {
  return (Object.keys(a) as K[]).every((key) => a[key] === b[key]);
}

/**
 * The colours, read again whenever the light or dark class, the colour scheme
 * or a custom accent on `<html>` changes; without this a theme toggle would
 * leave a layer in the old scheme's colours. The answer only changes identity
 * when a colour does, so a memo keyed on it does not churn. `tokens` is a
 * constant of the caller's module.
 */
export function useMapPaint<K extends string>(tokens: Readonly<Record<K, string>>): Record<K, string> {
  const [paint, setPaint] = useState(() => readMapPaint(tokens));
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      const next = readMapPaint(tokens);
      setPaint((current) => (sameMapPaint(current, next) ? current : next));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
    return () => observer.disconnect();
  }, [tokens]);
  return paint;
}
