import type { BookElement, BookGroup, BookSpread } from './book.schema';

/**
 * Groups on a page, and the layer fields that come with them.
 *
 * ── What a group is ──────────────────────────────────────────────────────
 *
 * A flat set of elements of one spread that are picked, moved, aligned and
 * arranged as one. Membership lives on the elements (`group`, an id that is
 * only meaningful on its own spread); the spread's `groups` list holds what a
 * group is called. There is no nesting: grouping elements that are already in
 * groups makes one new group of all of them, which is what a page needs and
 * what a model can describe without a tree.
 *
 * Two rules keep every reader simple:
 * - a group has at least two members on the page (`tidyGroups` dissolves the
 *   rest, so a lone element never carries a group nobody can see);
 * - its members are next to each other in the paint order (`gatherGroups`),
 *   so the layers panel can show a group as one row without lying about what
 *   is in front of what.
 *
 * The Studio and the book engine (book-ops-groups.ts) both call these, so a
 * group made by hand and one made by the assistant are the same thing.
 */

/** Every member of a group, in paint order. */
export function groupMembers(spread: BookSpread, groupId: string): BookElement[] {
  return spread.elements.filter((e) => e.group === groupId);
}

/** What a group is called, or undefined when it has no name. */
export function bookGroupName(spread: BookSpread, groupId: string): string | undefined {
  return spread.groups?.find((g) => g.id === groupId)?.name;
}

/** The groups of a spread that have members on the page, in the paint order of their lowest member. */
export function spreadGroupIds(spread: BookSpread): string[] {
  const seen = new Set<string>();
  for (const el of spread.elements) if (el.group) seen.add(el.group);
  return [...seen];
}

/**
 * The ids named plus every other member of their groups, in paint order.
 *
 * What a click on a grouped element picks, and what a marquee that touches one
 * member of a group picks: the group is the thing on the page.
 */
export function expandToGroups(spread: BookSpread, ids: readonly string[]): string[] {
  const named = new Set(ids);
  const groups = new Set<string>();
  for (const el of spread.elements) if (named.has(el.id) && el.group) groups.add(el.group);
  return spread.elements
    .filter((e) => named.has(e.id) || (e.group !== undefined && groups.has(e.group)))
    .map((e) => e.id);
}

/** The one group every named element is in, or null when they are not all in the same one. */
export function commonGroup(spread: BookSpread, ids: readonly string[]): string | null {
  const els = spread.elements.filter((e) => ids.includes(e.id));
  const first = els[0]?.group;
  if (!first || !els.every((e) => e.group === first)) return null;
  return first;
}

/** Whether the named ids are exactly the members of one group, no more and no fewer. */
export function isWholeGroup(spread: BookSpread, ids: readonly string[]): boolean {
  const group = commonGroup(spread, ids);
  return group !== null && groupMembers(spread, group).length === new Set(ids).size;
}

/**
 * The elements moved so every group's members are next to each other, at the
 * place of the group's topmost member, keeping their order among themselves.
 * The same spread object when nothing had to move.
 */
export function gatherGroups(spread: BookSpread): BookSpread {
  const lastIndex = new Map<string, number>();
  spread.elements.forEach((e, i) => {
    if (e.group) lastIndex.set(e.group, i);
  });
  if (!lastIndex.size) return spread;
  const out: BookElement[] = [];
  spread.elements.forEach((e, i) => {
    if (!e.group) {
      out.push(e);
      return;
    }
    if (lastIndex.get(e.group) !== i) return;
    out.push(...groupMembers(spread, e.group));
  });
  return out.every((e, i) => e === spread.elements[i]) ? spread : { ...spread, elements: out };
}

/**
 * Groups with fewer than two members on the page dissolved, and names of
 * groups that are gone dropped. The same spread object when all was in order.
 */
export function tidyGroups(spread: BookSpread): BookSpread {
  const count = new Map<string, number>();
  for (const e of spread.elements) if (e.group) count.set(e.group, (count.get(e.group) ?? 0) + 1);
  const lonely = (e: BookElement) => e.group !== undefined && (count.get(e.group) ?? 0) < 2;
  const elements = spread.elements.some(lonely)
    ? spread.elements.map((e) => (lonely(e) ? withoutGroup(e) : e))
    : spread.elements;
  const live = new Set([...count].filter(([, n]) => n >= 2).map(([id]) => id));
  const groups = spread.groups?.filter((g) => live.has(g.id));
  const groupsChanged = spread.groups !== undefined && groups?.length !== spread.groups.length;
  if (elements === spread.elements && !groupsChanged) return spread;
  const next: BookSpread = { ...spread, elements };
  if (groupsChanged) {
    if (groups?.length) next.groups = groups;
    else delete next.groups;
  }
  return next;
}

/** An element without its group. */
export function withoutGroup<E extends BookElement>(el: E): E {
  const next = { ...el };
  delete next.group;
  return next;
}

function withName(groups: readonly BookGroup[] | undefined, id: string, name: string | undefined): BookGroup[] {
  const rest = (groups ?? []).filter((g) => g.id !== id);
  return name ? [...rest, { id, name }] : rest;
}

function setGroups(spread: BookSpread, groups: BookGroup[]): BookSpread {
  const next: BookSpread = { ...spread, groups };
  if (!groups.length) delete next.groups;
  return next;
}

/**
 * The named elements made one new group, gathered at the place of the topmost
 * of them. Elements that were in other groups leave them (and a group left with
 * one member dissolves). `name` is the group's name, none for an unnamed one.
 */
export function groupElements(spread: BookSpread, ids: readonly string[], groupId: string, name?: string): BookSpread {
  const chosen = new Set(ids);
  const elements = spread.elements.map((e) => (chosen.has(e.id) ? { ...e, group: groupId } : e));
  const trimmed = name?.trim();
  return tidyGroups(gatherGroups(setGroups({ ...spread, elements }, withName(spread.groups, groupId, trimmed))));
}

/** A group's members back on their own, where they are in the paint order. */
export function ungroupElements(spread: BookSpread, groupId: string): BookSpread {
  const elements = spread.elements.map((e) => (e.group === groupId ? withoutGroup(e) : e));
  return tidyGroups({ ...spread, elements });
}

/** A group named, or its name cleared with an empty one. */
export function renameGroup(spread: BookSpread, groupId: string, name: string): BookSpread {
  return setGroups(spread, withName(spread.groups, groupId, name.trim() || undefined));
}

/** An element named, or its name cleared with an empty one. */
export function renameElement(spread: BookSpread, id: string, name: string): BookSpread {
  const trimmed = name.trim();
  const elements = spread.elements.map((e) => {
    if (e.id !== id) return e;
    const next = { ...e };
    if (trimmed) next.name = trimmed;
    else delete next.name;
    return next;
  });
  return { ...spread, elements };
}

/** Elements shown or hidden. `hidden: false` drops the field, so a shown element stores what it stored before. */
export function setElementsHidden(spread: BookSpread, ids: readonly string[], hidden: boolean): BookSpread {
  const chosen = new Set(ids);
  const elements = spread.elements.map((e) => {
    if (!chosen.has(e.id)) return e;
    const next = { ...e };
    if (hidden) next.hidden = true;
    else delete next.hidden;
    return next;
  });
  return { ...spread, elements };
}

/** The spread as it prints: without its hidden elements. The same object when none is hidden. */
export function visibleSpread(spread: BookSpread): BookSpread {
  if (!spread.elements.some((e) => e.hidden)) return spread;
  return { ...spread, elements: spread.elements.filter((e) => !e.hidden) };
}

/**
 * Copies of elements given groups of their own.
 *
 * A copy that kept its source's group id would join the original group on a
 * duplicate, or another page's group of the same id on a paste. Each group
 * among the copies gets a fresh id; its name comes along from `source` (the
 * spread the copies came from), so a copied lockup is still called what it was.
 * A copy that is the only one of its group among the copies goes alone.
 */
export function regroupCopies(
  copies: readonly BookElement[],
  source: BookSpread | undefined,
  newId: (prefix: string) => string,
): { elements: BookElement[]; groups: BookGroup[] } {
  const count = new Map<string, number>();
  for (const e of copies) if (e.group) count.set(e.group, (count.get(e.group) ?? 0) + 1);
  const fresh = new Map<string, string>();
  const groups: BookGroup[] = [];
  for (const [old, n] of count) {
    if (n < 2) continue;
    const id = newId('g');
    fresh.set(old, id);
    const name = source ? bookGroupName(source, old) : undefined;
    groups.push(name ? { id, name } : { id });
  }
  const elements = copies.map((e) => {
    if (!e.group) return e;
    const id = fresh.get(e.group);
    return id ? { ...e, group: id } : withoutGroup(e);
  });
  return { elements, groups: groups.filter((g) => g.name !== undefined) };
}

/** Copies added on top of a spread with the names of their new groups. */
export function withCopies(
  spread: BookSpread,
  copied: { elements: readonly BookElement[]; groups: readonly BookGroup[] },
): BookSpread {
  const next = { ...spread, elements: [...spread.elements, ...copied.elements] };
  return copied.groups.length ? { ...next, groups: [...(spread.groups ?? []), ...copied.groups] } : next;
}
