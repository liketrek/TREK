import type { PaddleLock, TrackMarks } from '@trek/shared';
import { create } from 'zustand';
import {
  NO_TRACK_MARKS,
  withLock,
  withLockTimes,
  withoutPortage,
  withPortage,
  withPortageExtra,
} from '../utils/paddleTrackMarks';

/** What a click on the recorded track does next: nothing, mark a lock, or one end of a portage. */
export type TrackPick = 'lock' | 'portage' | null;

export interface TrackSpeeds {
  paddle: number | null;
  portage: number | null;
}

interface TrackMarkToolState {
  /** The tour the marks below belong to; null while no recorded paddle track is open. */
  placeId: number | null;
  /** The marks as they are being laid, not yet saved. */
  marks: TrackMarks;
  speeds: TrackSpeeds;
  /** Whether anything changed since they were loaded or saved. */
  dirty: boolean;
  pick: TrackPick;
  /** Where the portage being marked starts, once its first end is set. */
  pendingFromM: number | null;
  /** The last click was on a portage already there, or off the line: the hint says so. */
  refused: 'overlap' | 'off_line' | null;
}

function initial(): TrackMarkToolState {
  return {
    placeId: null,
    marks: NO_TRACK_MARKS,
    speeds: { paddle: null, portage: null },
    dirty: false,
    pick: null,
    pendingFromM: null,
    refused: null,
  };
}

/**
 * PAD-03 for a recorded paddle track: the marks being laid onto it, shared by
 * the rail that lists them and the map that is clicked to place them. A click
 * on the line gives a distance along it; a lock takes one, a portage two.
 */
export const useTrackMarkToolStore = create<TrackMarkToolState>(() => initial());

const set = useTrackMarkToolStore.setState;

export function loadTrackMarks(
  placeId: number | null,
  marks: TrackMarks | null | undefined,
  speeds: TrackSpeeds
): void {
  set({ ...initial(), placeId, marks: marks ?? NO_TRACK_MARKS, speeds });
}

export function startTrackPick(pick: TrackPick): void {
  set({ pick, pendingFromM: null, refused: null });
}

/** A click on the line at this distance along it, for the tool that is on. */
export function pickOnTrack(atM: number): void {
  const { pick, pendingFromM, marks } = useTrackMarkToolStore.getState();
  if (pick === 'lock') {
    set({ marks: withLock(marks, atM), dirty: true, pick: null, refused: null });
    return;
  }
  if (pick !== 'portage') return;
  if (pendingFromM === null) {
    set({ pendingFromM: atM, refused: null });
    return;
  }
  const next = withPortage(marks, pendingFromM, atM);
  if (next === marks) {
    set({ refused: 'overlap', pendingFromM: null });
    return;
  }
  set({ marks: next, dirty: true, pick: null, pendingFromM: null, refused: null });
}

export function refuseTrackPick(): void {
  set({ refused: 'off_line' });
}

function edit(marks: TrackMarks): void {
  set({ marks, dirty: true });
}

export const trackMarkEdits = {
  removePortage: (index: number) => edit(withoutPortage(useTrackMarkToolStore.getState().marks, index)),
  setPortageExtra: (index: number, minutes: number | null) =>
    edit(withPortageExtra(useTrackMarkToolStore.getState().marks, index, minutes)),
  setLock: (index: number, lock: PaddleLock | null) =>
    edit(withLockTimes(useTrackMarkToolStore.getState().marks, index, lock)),
  setSpeeds: (speeds: Partial<TrackSpeeds>) =>
    set((state) => ({ speeds: { ...state.speeds, ...speeds }, dirty: true })),
};

export function markTrackMarksSaved(marks: TrackMarks | null | undefined, speeds: TrackSpeeds): void {
  set({ marks: marks ?? NO_TRACK_MARKS, speeds, dirty: false, pick: null, pendingFromM: null, refused: null });
}
