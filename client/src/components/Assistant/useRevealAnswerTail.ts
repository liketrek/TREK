import { type RefObject, useEffect, useRef } from 'react';

import { prefersReducedMotion } from '../../utils/reducedMotion';

/** Room left above the tail, so its first line does not sit flush on the edge. */
const TAIL_GAP = 12;
/** What reading the thread by hand looks like while the answer is written. */
const OWN_SCROLL = ['wheel', 'touchmove', 'keydown'] as const;

/**
 * Where to scroll so the end of the latest answer is in view: the start of its
 * closing text and proposed changes (the `data-assistant-tail` mark), or the
 * very bottom when that tail is shorter than the view. Null when it is in view
 * already, so the thread never moves up.
 */
export function tailScrollTop(viewport: HTMLElement): number | null {
  const marks = viewport.querySelectorAll('[data-assistant-tail]');
  const tail = marks[marks.length - 1];
  if (!tail) return null;
  const offset = tail.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
  const target = Math.min(offset - TAIL_GAP, viewport.scrollHeight - viewport.clientHeight);
  return target > viewport.scrollTop + 1 ? target : null;
}

/**
 * A new question moves to the top of the view, so its answer reads from the
 * first line. A long answer (steps, a strip of places found, cards) then ends
 * below the view, and its closing words and the changes to apply were never
 * seen. Once the answer is written, this brings that end into view, unless the
 * user scrolled the thread themselves while it was written.
 */
export function useRevealAnswerTail(viewport: RefObject<HTMLElement | null>, isRunning: boolean): void {
  const scrolledByHand = useRef(false);
  const wasRunning = useRef(isRunning);

  useEffect(() => {
    const el = viewport.current;
    if (!el || !isRunning) return;
    scrolledByHand.current = false;
    const mark = () => {
      scrolledByHand.current = true;
    };
    for (const type of OWN_SCROLL) el.addEventListener(type, mark, { passive: true });
    return () => {
      for (const type of OWN_SCROLL) el.removeEventListener(type, mark);
    };
  }, [viewport, isRunning]);

  useEffect(() => {
    const ended = wasRunning.current && !isRunning;
    wasRunning.current = isRunning;
    const el = viewport.current;
    if (!ended || !el || scrolledByHand.current) return;
    // A frame later, so the answer's last blocks have their height.
    const frame = requestAnimationFrame(() => {
      const top = tailScrollTop(el);
      if (top !== null) el.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [viewport, isRunning]);
}
