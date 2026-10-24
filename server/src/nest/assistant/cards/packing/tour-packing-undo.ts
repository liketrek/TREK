import type { ToolCards, UndoCall, UndoSnapshot } from '../card-types';
import { argId, readKey, recordOf, type Row } from '../card-values';
import { Rows } from '../preview-format';

/**
 * The way back from pointing a tour at its trip's packing list and from
 * letting go of it: both answers name the link before (previous_link). A
 * link where there was none goes back by letting go of it, a link let go of
 * by linking what it pointed at, while the tour points where the change left
 * it.
 */

/** The read an undo checks against, by the call's own arguments. */
function readOf(snapshot: UndoSnapshot, tool: string, args: Row): Row {
  return recordOf(snapshot.reads.get(readKey(tool, args)));
}

/** What a tour points at in its packing list as read: its category, null for the whole list, undefined for none. */
function linkedCategory(packing: Row): string | null | undefined {
  const link = packing.packing_link;
  if (!link || typeof link !== 'object') return undefined;
  const category = recordOf(link).category;
  return typeof category === 'string' ? category : null;
}

/** Only a link where there was none goes back by letting go of it: one that replaced another has no single way back. */
export const LINK_TOUR_PACKING_UNDO: NonNullable<ToolCards['undo']> = {
  tool: 'unlink_tour_packing',
  args: (args, result) => (recordOf(result).previous_link === null ? { placeId: args.placeId } : null),
  reads: (args) => [{ tool: 'get_tour_packing', args: { placeId: args.placeId } }],
  unchanged: (result, snapshot, call?: UndoCall) => {
    if (!call) return false;
    const now = linkedCategory(readOf(snapshot, 'get_tour_packing', { placeId: call.args.placeId }));
    return now !== undefined && now === linkedCategory(recordOf(result));
  },
};

export const UNLINK_TOUR_PACKING: ToolCards = {
  write: { verbKey: 'unlinkPacking', entity: 'tour' },
  describe: (ctx, args) => {
    const placeId = argId(args, 'placeId');
    return {
      subject: placeId === null ? '' : (ctx.card.places.get(placeId)?.name ?? ''),
      rows: new Rows(),
      dayId: null,
      placeIds: placeId !== null && ctx.card.places.has(placeId) ? [placeId] : [],
    };
  },
  undo: {
    tool: 'link_tour_packing',
    args: (args, result) => {
      const before = recordOf(result).previous_link;
      if (!before || typeof before !== 'object') return null;
      const category = recordOf(before).category;
      return { placeId: args.placeId, category: typeof category === 'string' ? category : null };
    },
    reads: (args) => [{ tool: 'get_tour_packing', args: { placeId: args.placeId } }],
    // Only a link there was can go back, and only while the tour points at nothing since.
    unchanged: (result, snapshot, call?: UndoCall) =>
      !!call &&
      linkedCategory({ packing_link: recordOf(result).previous_link }) !== undefined &&
      linkedCategory(readOf(snapshot, 'get_tour_packing', { placeId: call.args.placeId })) === undefined,
  },
};
