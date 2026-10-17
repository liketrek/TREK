import { create } from 'zustand';

export type TourMapMode = '2d' | '3d';

/** In 2D a click is how a tour is drawn; in 3D every look around is a drag, so placing starts off. */
const DEFAULT_PLACING: Record<TourMapMode, boolean> = { '2d': true, '3d': false };
const STORAGE_KEY = 'trek.tours.placePoints.';

function readPlacing(mode: TourMapMode): boolean {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY + mode);
    if (stored === '1' || stored === '0') return stored === '1';
  } catch {
    // Storage blocked: the choice then lasts as long as the page.
  }
  return DEFAULT_PLACING[mode];
}

function writePlacing(mode: TourMapMode, on: boolean): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY + mode, on ? '1' : '0');
  } catch {
    // Storage blocked: the store still holds it while the page is up.
  }
}

interface TourPlaceToolState {
  /** Whether a click on the map sets a point, per mode, remembered for the session. */
  placing: Record<TourMapMode, boolean>;
  /** The mode the tour map shows now, so a control outside the map switches the tool for it. */
  mode: TourMapMode;
}

export function initialTourPlaceToolState(): TourPlaceToolState {
  return { placing: { '2d': readPlacing('2d'), '3d': readPlacing('3d') }, mode: '2d' };
}

/**
 * The tour map's "set points" tool, shared by its switch in the layer pill and
 * the "add point" row under the waypoints in the editor.
 */
export const useTourPlaceToolStore = create<TourPlaceToolState>(() => initialTourPlaceToolState());

export function setTourPlaceToolMode(mode: TourMapMode): void {
  if (useTourPlaceToolStore.getState().mode !== mode) useTourPlaceToolStore.setState({ mode });
}

function setTourPlacing(mode: TourMapMode, on: boolean): void {
  writePlacing(mode, on);
  useTourPlaceToolStore.setState((state) => ({ placing: { ...state.placing, [mode]: on } }));
}

/** Switches the tool for the mode the map shows now. */
export function toggleTourPlacing(): void {
  const { mode, placing } = useTourPlaceToolStore.getState();
  setTourPlacing(mode, !placing[mode]);
}
