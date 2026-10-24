import type { BookElement, BookSpread } from '@trek/shared';
import { bookGroupName, commonGroup, groupMembers, isWholeGroup } from '@trek/shared';

/**
 * The layers panel's rows, front to back: what the panel draws and where a
 * drag lands. Kept apart from the panel so the order and the drop rules can
 * be tested without drawing it.
 */

export type LayerRow =
  | { type: 'group'; key: string; groupId: string; name: string | undefined; members: BookElement[] }
  | { type: 'element'; key: string; el: BookElement; inGroup: boolean };

/**
 * Every element front to back, a group's members under its row. A collapsed
 * group shows its row alone. Groups are kept together in the paint order
 * (book-groups.ts), so the members found first, from the front, are the whole
 * group.
 */
export function layerRows(spread: BookSpread, collapsed: ReadonlySet<string>): LayerRow[] {
  const rows: LayerRow[] = [];
  const seen = new Set<string>();
  for (const el of spread.elements.slice().reverse()) {
    if (!el.group) {
      rows.push({ type: 'element', key: el.id, el, inGroup: false });
      continue;
    }
    if (seen.has(el.group)) continue;
    seen.add(el.group);
    const members = groupMembers(spread, el.group).reverse();
    rows.push({
      type: 'group',
      key: `g:${el.group}`,
      groupId: el.group,
      name: bookGroupName(spread, el.group),
      members,
    });
    if (collapsed.has(el.group)) continue;
    for (const m of members) rows.push({ type: 'element', key: m.id, el: m, inGroup: true });
  }
  return rows;
}

/** The elements a row stands for: a group's members, or the one element. */
export function rowIds(row: LayerRow): string[] {
  return row.type === 'group' ? row.members.map((m) => m.id) : [row.el.id];
}

/** Where a drop lands in the paint order, for the store's `restack`. */
export interface LayerDrop {
  anchorId: string;
  where: 'above' | 'below';
  join: boolean;
}

/**
 * What letting go over a row does. Over the upper half of a row the dragged
 * layers go in front of it, over the lower half behind it. A member of a
 * group takes them into its group; a group's own row puts them in front of or
 * behind the whole group.
 */
export function dropOn(row: LayerRow, upper: boolean): LayerDrop {
  if (row.type === 'group') {
    const front = row.members[0] as BookElement;
    const back = row.members[row.members.length - 1] as BookElement;
    return upper
      ? { anchorId: front.id, where: 'above', join: false }
      : { anchorId: back.id, where: 'below', join: false };
  }
  return { anchorId: row.el.id, where: upper ? 'above' : 'below', join: row.inGroup };
}

/** What the panel calls an element: its own name, a text's first words, or its kind. */
export function layerLabel(el: BookElement, kindLabel: string): string {
  if (el.name) return el.name;
  if (el.kind === 'text') {
    const first = el.text
      .split('\n')
      .find((l) => l.trim())
      ?.trim();
    if (first) return first.length > 40 ? `${first.slice(0, 39)}…` : first;
  }
  return kindLabel;
}

/** What the inspector's head calls the selection: a whole group by its name, otherwise "Several". */
export function selectionTitle(spread: BookSpread | undefined, selection: string[], t: (k: string) => string): string {
  if (spread && isWholeGroup(spread, selection)) {
    const group = commonGroup(spread, selection);
    return (group && bookGroupName(spread, group)) || t('journey.studio.layers.group');
  }
  return t('journey.studio.multiple');
}

/** What a key pressed on a row of the layers tree does. */
export type LayerKeyAction =
  | { type: 'focus'; index: number }
  | { type: 'expand'; groupId: string }
  | { type: 'collapse'; groupId: string }
  | { type: 'choose'; additive: boolean }
  | { type: 'rename' };

/** Up and Down along the rows, Home and End to the ends; the tree stops at either end. */
function alongTree(key: string, index: number, count: number): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown') return Math.min(index + 1, count - 1);
  if (key === 'ArrowUp') return Math.max(index - 1, 0);
  return null;
}

/** Into a group: a closed one opens, an open one hands the focus to its first member. */
function inward(row: LayerRow, index: number, collapsed: ReadonlySet<string>): LayerKeyAction | null {
  if (row.type !== 'group') return null;
  return collapsed.has(row.groupId) ? { type: 'expand', groupId: row.groupId } : { type: 'focus', index: index + 1 };
}

/** Out of a group: an open one closes, a member hands the focus to its group's row. */
function outward(rows: readonly LayerRow[], index: number, collapsed: ReadonlySet<string>): LayerKeyAction | null {
  const row = rows[index];
  if (row?.type === 'group') return collapsed.has(row.groupId) ? null : { type: 'collapse', groupId: row.groupId };
  if (!row?.inGroup) return null;
  // A member's group is the nearest group row above it: members are listed right under their group.
  for (let i = index - 1; i >= 0; i--) if (rows[i]?.type === 'group') return { type: 'focus', index: i };
  return null;
}

/**
 * The tree's keyboard, as a tree view has it: Up and Down move along the
 * rows, Home and End to the ends; Right opens a closed group and steps into
 * an open one, Left closes an open group and steps from a member up to its
 * group, the two mirrored in a language read right to left; Enter or Space
 * selects the row as a click does, `additive` (Shift, Ctrl or Cmd held)
 * adding it; F2 renames it. Null for a key the tree leaves to the page.
 */
export function layerKeyAction(
  key: string,
  index: number,
  rows: readonly LayerRow[],
  opts: { collapsed: ReadonlySet<string>; rtl: boolean; additive: boolean }
): LayerKeyAction | null {
  const row = rows[index];
  if (!row) return null;
  if (key === 'Enter' || key === ' ') return { type: 'choose', additive: opts.additive };
  if (key === 'F2') return { type: 'rename' };
  const along = alongTree(key, index, rows.length);
  if (along !== null) return { type: 'focus', index: along };
  if (key === (opts.rtl ? 'ArrowLeft' : 'ArrowRight')) return inward(row, index, opts.collapsed);
  if (key === (opts.rtl ? 'ArrowRight' : 'ArrowLeft')) return outward(rows, index, opts.collapsed);
  return null;
}
