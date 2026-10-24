import { commonGroup, gatherGroups } from './book-groups';
import type { BookElement, BookFrame, BookPageSetup, BookSpread } from './book.schema';

/**
 * Paint order, alignment and spacing of the elements of a page.
 *
 * The `arrange`, `align` and `distribute` operations of the book engine run
 * these (book-ops-elements.ts), and the Studio's layer buttons, align bar and
 * layers panel run the same engine, so a press and an assistant's operation
 * move a page the same way.
 *
 * Groups move as one: aligning two groups lines up their boxes, not every
 * member on the same edge, and distributing spaces the boxes. When every named
 * element is in the one group, the members line up among themselves, which is
 * how the inside of a lockup is set.
 */

export type BookArrangeTo = 'front' | 'forward' | 'backward' | 'back';
export type BookAlignEdge = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type BookAlignTo = 'selection' | 'page' | 'safe';
export type BookDistributeAxis = 'horizontal' | 'vertical';

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * The page in paint order as the things that move as one: a group's members
 * together (they are next to each other, see `gatherGroups`), every other
 * element alone.
 */
function paintUnits(spread: BookSpread): BookElement[][] {
  const units: BookElement[][] = [];
  for (const el of gatherGroups(spread).elements) {
    const last = units[units.length - 1];
    if (el.group && last?.[0]?.group === el.group) last.push(el);
    else units.push([el]);
  }
  return units;
}

/**
 * The named elements moved in the paint order, keeping their order among
 * themselves. A group moves whole, and a step forward or backward goes past a
 * whole group at once, never into it.
 */
export function arrangeElements(spread: BookSpread, ids: readonly string[], to: BookArrangeTo): BookSpread {
  const chosen = new Set(ids);
  const units = paintUnits(spread);
  const isChosen = (u: BookElement[]) => u.some((e) => chosen.has(e.id));
  let next: BookElement[][];
  if (to === 'front') next = [...units.filter((u) => !isChosen(u)), ...units.filter(isChosen)];
  else if (to === 'back') next = [...units.filter(isChosen), ...units.filter((u) => !isChosen(u))];
  else {
    next = units.slice();
    const step = to === 'forward' ? 1 : -1;
    const order = next.map((_, i) => i);
    if (step === 1) order.reverse();
    for (const i of order) {
      const here = next[i];
      const there = next[i + step];
      if (!here || !there || !isChosen(here) || isChosen(there)) continue;
      next[i] = there;
      next[i + step] = here;
    }
  }
  const elements = next.flat();
  return elements.every((e, i) => e === spread.elements[i]) ? spread : { ...spread, elements };
}

/**
 * Members of one group moved in the paint order among the group's own members
 * only, the group staying where it is on the page: what "to front" does to an
 * element picked inside a group.
 */
export function arrangeWithinGroup(
  spread: BookSpread,
  groupId: string,
  ids: readonly string[],
  to: BookArrangeTo,
): BookSpread {
  const slots: number[] = [];
  spread.elements.forEach((e, i) => {
    if (e.group === groupId) slots.push(i);
  });
  const members = slots.map((i) => spread.elements[i] as BookElement);
  const reordered = arrangeElements({ ...spread, elements: members.map(withoutGroupId) }, ids, to).elements;
  const byId = new Map(members.map((m) => [m.id, m]));
  const elements = spread.elements.slice();
  slots.forEach((slot, k) => {
    const moved = reordered[k];
    if (moved) elements[slot] = byId.get(moved.id) as BookElement;
  });
  return elements.every((e, i) => e === spread.elements[i]) ? spread : { ...spread, elements };
}

/** A member taken out of its group for reordering among the members alone, so gathering leaves them be. */
function withoutGroupId(el: BookElement): BookElement {
  const next = { ...el };
  delete next.group;
  return next;
}

/** The box around frames. */
export function boundsOfFrames(frames: readonly BookFrame[]): BookFrame {
  const x = Math.min(...frames.map((f) => f.x));
  const y = Math.min(...frames.map((f) => f.y));
  const right = Math.max(...frames.map((f) => f.x + f.w));
  const bottom = Math.max(...frames.map((f) => f.y + f.h));
  return { x, y, w: right - x, h: bottom - y };
}

/** The page a box's centre is on, or its safe area. */
function pageBox(spread: BookSpread, page: BookPageSetup, f: BookFrame, safe: boolean): BookFrame {
  const onRight = spread.role === 'inner' && f.x + f.w / 2 >= page.pageWidth;
  const x = onRight ? page.pageWidth : 0;
  const inset = safe ? page.safe : 0;
  return { x: x + inset, y: inset, w: page.pageWidth - inset * 2, h: page.pageHeight - inset * 2 };
}

/** Where a box goes to line up on an edge of another. */
function alignedAt(f: BookFrame, box: BookFrame, edge: BookAlignEdge): { x: number; y: number } {
  switch (edge) {
    case 'left':
      return { x: box.x, y: f.y };
    case 'center':
      return { x: box.x + (box.w - f.w) / 2, y: f.y };
    case 'right':
      return { x: box.x + box.w - f.w, y: f.y };
    case 'top':
      return { x: f.x, y: box.y };
    case 'middle':
      return { x: f.x, y: box.y + (box.h - f.h) / 2 };
    case 'bottom':
      return { x: f.x, y: box.y + box.h - f.h };
  }
}

/** What moves as one: a group's named members together, every other element alone. */
interface Unit {
  members: BookElement[];
  box: BookFrame;
}

function unitsOf(spread: BookSpread, els: readonly BookElement[]): Unit[] {
  const ids = els.map((e) => e.id);
  // All in one group: the members are the units, so the inside of a group can be set.
  const inside = commonGroup(spread, ids) !== null;
  const byKey = new Map<string, BookElement[]>();
  for (const el of els) {
    const key = !inside && el.group ? `g:${el.group}` : `e:${el.id}`;
    byKey.set(key, [...(byKey.get(key) ?? []), el]);
  }
  return [...byKey.values()].map((members) => ({ members, box: boundsOfFrames(members.map((m) => m.frame)) }));
}

/** Every member of a unit moved by the same offset, rounded as the document stores it. */
function shifted(unit: Unit, dx: number, dy: number): BookElement[] {
  // An axis that does not move is left exactly as it was, unrounded or not.
  return unit.members.map((e) => {
    const x = dx === 0 ? e.frame.x : round2(e.frame.x + dx);
    const y = dy === 0 ? e.frame.y : round2(e.frame.y + dy);
    return { ...e, frame: { ...e.frame, x, y } } as BookElement;
  });
}

function replaceAll(spread: BookSpread, next: readonly BookElement[]): BookSpread {
  const byId = new Map(next.map((e) => [e.id, e]));
  return { ...spread, elements: spread.elements.map((e) => byId.get(e.id) ?? e) };
}

/** The named elements lined up on an edge or a centre line of their box, their page, or its safe area. */
export function alignElements(
  spread: BookSpread,
  page: BookPageSetup,
  els: readonly BookElement[],
  edge: BookAlignEdge,
  to: BookAlignTo,
): BookSpread {
  const units = unitsOf(spread, els);
  const selection = boundsOfFrames(units.map((u) => u.box));
  const next = units.flatMap((u) => {
    const box = to === 'selection' ? selection : pageBox(spread, page, u.box, to === 'safe');
    const at = alignedAt(u.box, box, edge);
    return shifted(u, at.x - u.box.x, at.y - u.box.y);
  });
  return replaceAll(spread, next);
}

/** How many units a distribute has: it needs three. */
export function distributableCount(spread: BookSpread, els: readonly BookElement[]): number {
  return unitsOf(spread, els).length;
}

/** Three or more units spaced evenly between the outer two, or by a fixed gap in millimetres. */
export function distributeElements(
  spread: BookSpread,
  els: readonly BookElement[],
  axis: BookDistributeAxis,
  gap?: number,
): BookSpread {
  const units = unitsOf(spread, els);
  if (units.length < 3) return spread;
  const across = axis === 'horizontal';
  const start = (f: BookFrame) => (across ? f.x : f.y);
  const size = (f: BookFrame) => (across ? f.w : f.h);
  const sorted = units.slice().sort((a, b) => start(a.box) - start(b.box));
  const first = sorted[0] as Unit;
  const last = sorted[sorted.length - 1] as Unit;
  const total = sorted.reduce((sum, u) => sum + size(u.box), 0);
  const span = start(last.box) + size(last.box) - start(first.box);
  const space = gap ?? (span - total) / (sorted.length - 1);
  let cursor = start(first.box);
  const next = sorted.flatMap((u) => {
    const delta = round2(cursor) - start(u.box);
    cursor += size(u.box) + space;
    return across ? shifted(u, delta, 0) : shifted(u, 0, delta);
  });
  return replaceAll(spread, next);
}
