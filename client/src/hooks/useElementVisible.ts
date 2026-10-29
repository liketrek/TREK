import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether an element is on screen and its tab in front. Without
 * IntersectionObserver (an old browser, a test) the element counts as on
 * screen, so whatever depends on it still runs.
 */
export function useElementVisible(target: RefObject<Element | null>): boolean {
  const [onScreen, setOnScreen] = useState(true);
  const [tabShown, setTabShown] = useState(() => document.visibilityState !== 'hidden');

  useEffect(() => {
    const element = target.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry?.isIntersecting ?? false));
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const onChange = () => setTabShown(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return onScreen && tabShown;
}
