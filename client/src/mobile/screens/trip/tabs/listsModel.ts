import { STATUS_COLOR } from './tabModel'

/**
 * The phone's priority tokens for the Listen tab's to-do list (spec 03 §4.7).
 * The grouping, filtering and counting behind both lists is shared with the
 * desktop panels: `components/Packing/packingListModel.ts` and
 * `components/Todo/todoListModel.ts`.
 */

/** P1/P2/P3 colours (spec 03 §4.7) reuse the shared status-dot tokens so priority and status stay one palette. */
export const PRIORITY_COLOR: Record<number, string> = {
  1: STATUS_COLOR.danger,
  2: STATUS_COLOR.pending,
  3: STATUS_COLOR.info,
}
export const PRIORITY_LABEL: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3' }
export const PRIORITY_LEVELS = [0, 1, 2, 3] as const
