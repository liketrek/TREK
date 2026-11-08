import { createContext, use } from 'react';
import { NEUTRAL_TINT } from '../../shared/DialogShell';

/** The head band of a tours rail: ruled off from the rail under it, as the desktop planner shows it. */
export const RAIL_HEAD = 'flex flex-none items-start gap-2 border-b border-edge-faint px-3 py-2.5';

/** The head as a rounded band of its own, inset and shaped like the cards under it. */
const FLOATING_RAIL_HEAD =
  'mx-3 mt-3 flex flex-none items-start gap-2 rounded-2xl border border-edge-faint bg-surface-secondary px-3 py-2';

/**
 * Set by the touch shell's tours tab: there each rail's head (the trip's tours,
 * a new or saved tour, a GPX track, the wanderer trails) is a rounded band like
 * the cards below it rather than a ruled strip across the pane.
 */
export const FloatingRailHeads = createContext(false);

/** The class and style of a rail's head band, as the surrounding tab wants it. */
export function useRailHeadProps(): { className: string; style?: { background: string } } {
  return use(FloatingRailHeads)
    ? { className: FLOATING_RAIL_HEAD }
    : { className: RAIL_HEAD, style: { background: NEUTRAL_TINT } };
}
