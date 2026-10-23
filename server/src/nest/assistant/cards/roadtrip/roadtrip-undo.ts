import type { ToolCards, UndoSnapshot } from '../card-types';
import { argId, idIn, recordOf } from '../card-values';

/**
 * The way back from a via sent into a day's drive: remove it again, as long
 * as it still stands where it was put. A via someone dragged since, or
 * pinned to another stop, is theirs now and stays.
 */

const LIST_VIAS = 'list_route_vias';

/** The via an add answered with, as the day's list holds it now; undefined when it is gone. */
function viaNow(viaId: unknown, snapshot: UndoSnapshot): Record<string, unknown> | undefined {
  for (const [key, value] of snapshot.reads) {
    if (!key.startsWith(`${LIST_VIAS} `)) continue;
    const list = recordOf(value).vias;
    const found = (Array.isArray(list) ? list : []).map(recordOf).find((via) => via.id === viaId);
    if (found) return found;
  }
  return undefined;
}

/** add_route_via, taken back by removing the via it made while that via is unchanged. */
export const REMOVE_ADDED_VIA: NonNullable<ToolCards['undo']> = {
  tool: 'remove_route_via',
  args: (args, result) => {
    const viaId = idIn(result, 'via');
    const dayId = argId(args, 'dayId');
    return viaId && dayId ? { dayId, viaId } : null;
  },
  reads: (args) => {
    const dayId = argId(args, 'dayId');
    return [{ tool: LIST_VIAS, args: dayId ? { dayId } : {} }];
  },
  unchanged: (result, snapshot) => {
    const made = recordOf(recordOf(result).via);
    const now = viaNow(made.id, snapshot);
    return (
      now !== undefined &&
      now.lat === made.lat &&
      now.lng === made.lng &&
      now.after_order_index === made.after_order_index
    );
  },
};
