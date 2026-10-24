import { TOUR_REVISION_CONFLICT } from '@trek/shared';
import { isAxiosError } from 'axios';
import { useCallback, useRef, useState } from 'react';

/** The revision a refused save names, read off its 409; null for any other failure. */
export function revisionConflictOf(error: unknown): number | null {
  if (!isAxiosError(error) || error.response?.status !== 409) return null;
  const body = error.response.data as { code?: unknown; revision?: unknown } | undefined;
  return body?.code === TOUR_REVISION_CONFLICT && Number.isInteger(body.revision) ? Number(body.revision) : null;
}

/**
 * P2C-03 in the planner: the revision the open tour was loaded at, which a
 * save names so the server refuses it once someone else saved the tour, and
 * what is known about such a change.
 *
 * - `conflict`: a save was refused; the draft is kept until the planner
 *   chooses to load the newer tour, save the draft as a tour of its own, or
 *   save it over the newer one on purpose.
 * - `remote`: the trip's tours say someone saved this tour meanwhile, known
 *   before any save. A planner without changes simply loads it again.
 *
 * The base lives in a ref as well, so a save started in the same tick as the
 * choice to overwrite names the revision just taken over.
 */
export function useTourRevisionGuard(initial: number | null = null) {
  const [base, setBase] = useState<number | null>(initial);
  const baseRef = useRef<number | null>(initial);
  const [conflict, setConflict] = useState<{ revision: number } | null>(null);
  const [remote, setRemote] = useState<number | null>(null);

  /** The revision the planner now works from; null for a new tour. Clears what was known about others. */
  const adopt = useCallback((revision: number | null | undefined) => {
    baseRef.current = revision ?? null;
    setBase(revision ?? null);
    setConflict(null);
    setRemote(null);
  }, []);

  /** The trip's tours list this tour at `revision`: newer than the base means someone else saved it. */
  const notice = useCallback((revision: number | null | undefined) => {
    if (revision == null || baseRef.current == null || revision <= baseRef.current) return false;
    setRemote(revision);
    return true;
  }, []);

  /** A refused save; answers whether it was refused for the revision. */
  const refuse = useCallback((error: unknown) => {
    const revision = revisionConflictOf(error);
    if (revision === null) return false;
    setConflict({ revision });
    setRemote(null);
    return true;
  }, []);

  /** The choice to save over the newer tour: the next save names the revision it saw. */
  const takeOver = useCallback(() => {
    if (!conflict) return;
    baseRef.current = conflict.revision;
    setBase(conflict.revision);
    setConflict(null);
  }, [conflict]);

  const dismissConflict = useCallback(() => setConflict(null), []);
  const dismissRemote = useCallback(() => setRemote(null), []);

  return { base, baseRef, conflict, remote, adopt, notice, refuse, takeOver, dismissConflict, dismissRemote };
}
