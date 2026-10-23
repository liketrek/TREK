import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../../utils/reducedMotion';

/** Milliseconds per typed and per erased character, and the pauses around a full phrase. */
const TYPE_MS = 45;
const ERASE_MS = 22;
const HOLD_MS = 2200;
const GAP_MS = 400;

/**
 * A placeholder that writes questions the user could ask, one after another:
 * it types a phrase, holds it, erases it and moves on to the next. It runs
 * only while `active` (the field is empty) and stands still on `fallback`
 * under reduced motion or without phrases, so it never moves under someone's
 * typing or against their settings.
 */
export function useTypewriterPlaceholder(phrases: readonly string[], fallback: string, active: boolean): string {
  const [text, setText] = useState('');
  const key = phrases.join('\n');
  const still = !active || phrases.length === 0 || prefersReducedMotion();

  useEffect(() => {
    if (still) return;
    const list = key.split('\n');
    let phrase = 0;
    let length = 0;
    let erasing = false;
    let timer = 0;
    const step = () => {
      const current = list[phrase] ?? '';
      if (!erasing) {
        length += 1;
        setText(current.slice(0, length));
        if (length >= current.length) {
          erasing = true;
          timer = window.setTimeout(step, HOLD_MS);
          return;
        }
        timer = window.setTimeout(step, TYPE_MS);
        return;
      }
      length -= 1;
      setText(current.slice(0, Math.max(0, length)));
      if (length <= 0) {
        erasing = false;
        phrase = (phrase + 1) % list.length;
        timer = window.setTimeout(step, GAP_MS);
        return;
      }
      timer = window.setTimeout(step, ERASE_MS);
    };
    timer = window.setTimeout(step, GAP_MS);
    return () => window.clearTimeout(timer);
  }, [key, still]);

  return still ? fallback : text || '​';
}
