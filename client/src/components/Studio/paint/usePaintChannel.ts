import type { BookDocument, BookPaint } from '@trek/shared';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useStudioStore } from '../../../store/studioStore';

/**
 * How the paint picker writes: a value set while a control is dragged is
 * `live`, and the one it is let go on is `commit`.
 *
 * A drag of a gradient stop or the angle dial passes through dozens of
 * values, and each would otherwise be an undo step. So the first live value
 * opens a gesture on the store, every live value after it moves the document
 * inside that gesture, and the commit closes it: one drag, one undo. A click
 * that is a commit with no live value before it is one ordinary step.
 */
export interface PaintChannel {
  live: (paint: BookPaint | null) => void;
  commit: (paint: BookPaint | null) => void;
}

export function usePaintChannel(write: (paint: BookPaint | null) => (doc: BookDocument) => BookDocument): PaintChannel {
  const begin = useStudioStore((s) => s.beginGesture);
  const end = useStudioStore((s) => s.endGesture);
  const apply = useStudioStore((s) => s.apply);
  const commit = useStudioStore((s) => s.commit);
  const open = useRef(false);
  // The writer is a fresh closure on every render; the channel reads the latest one.
  const writer = useRef(write);
  useLayoutEffect(() => {
    writer.current = write;
  });

  return useMemo(
    () => ({
      live: (paint) => {
        if (!open.current) {
          begin();
          open.current = true;
        }
        apply(writer.current(paint));
      },
      commit: (paint) => {
        if (!open.current) {
          commit(writer.current(paint));
          return;
        }
        apply(writer.current(paint));
        end();
        open.current = false;
      },
    }),
    [begin, end, apply, commit]
  );
}
