import {
  bookGroupName,
  commonGroup,
  expandToGroups,
  gatherGroups,
  groupElements,
  groupMembers,
  isWholeGroup,
  regroupCopies,
  renameElement,
  renameGroup,
  setElementsHidden,
  spreadGroupIds,
  tidyGroups,
  ungroupElements,
  visibleSpread,
  withCopies,
  withoutGroup,
} from './book-groups';
import { bookShapeElementSchema, bookSpreadSchema, type BookElement, type BookSpread } from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * Groups on a page: membership on the elements, names on the spread, at least
 * two members each, kept next to each other in the paint order.
 */

const shape = (id: string, over: Partial<BookElement> = {}) =>
  bookShapeElementSchema.parse({
    id,
    kind: 'shape',
    frame: { x: 10, y: 10, w: 20, h: 20 },
    shape: 'rect',
    ...over,
  }) as BookElement;

const page = (elements: BookElement[], over: Partial<BookSpread> = {}): BookSpread =>
  bookSpreadSchema.parse({ id: 'sp', elements, ...over });

const order = (sp: BookSpread) => sp.elements.map((e) => `${e.id}${e.group ? `:${e.group}` : ''}`);

describe('reading groups', () => {
  const sp = page(
    [
      shape('a', { group: 'g1' }),
      shape('b'),
      shape('c', { group: 'g1' }),
      shape('d', { group: 'g2' }),
      shape('e', { group: 'g2' }),
    ],
    { groups: [{ id: 'g1', name: 'Lockup' }] },
  );

  it('BKGRP-001: lists members, names and the groups on the page in paint order', () => {
    expect(groupMembers(sp, 'g1').map((e) => e.id)).toEqual(['a', 'c']);
    expect(bookGroupName(sp, 'g1')).toBe('Lockup');
    expect(bookGroupName(sp, 'g2')).toBeUndefined();
    expect(spreadGroupIds(sp)).toEqual(['g1', 'g2']);
  });

  it('BKGRP-002: a click on one member picks the whole group, and an ungrouped element alone', () => {
    expect(expandToGroups(sp, ['c'])).toEqual(['a', 'c']);
    expect(expandToGroups(sp, ['b'])).toEqual(['b']);
    expect(expandToGroups(sp, ['b', 'e'])).toEqual(['b', 'd', 'e']);
  });

  it('BKGRP-003: knows the one group a selection is in, and whether it is the whole of it', () => {
    expect(commonGroup(sp, ['a', 'c'])).toBe('g1');
    expect(commonGroup(sp, ['a', 'd'])).toBeNull();
    expect(commonGroup(sp, ['b'])).toBeNull();
    expect(commonGroup(sp, [])).toBeNull();
    expect(isWholeGroup(sp, ['a', 'c'])).toBe(true);
    expect(isWholeGroup(sp, ['a'])).toBe(false);
  });
});

describe('making and undoing groups', () => {
  it('BKGRP-004: gathers a group at the place of its topmost member, keeping their order', () => {
    const sp = page([shape('a', { group: 'g' }), shape('b'), shape('c', { group: 'g' }), shape('d')]);
    expect(order(gatherGroups(sp))).toEqual(['b', 'a:g', 'c:g', 'd']);
    const tidy = page([shape('a', { group: 'g' }), shape('c', { group: 'g' }), shape('d')]);
    expect(gatherGroups(tidy)).toBe(tidy);
    const none = page([shape('a')]);
    expect(gatherGroups(none)).toBe(none);
  });

  it('BKGRP-005: groups elements under a new id and a trimmed name, gathered together', () => {
    const sp = groupElements(page([shape('a'), shape('b'), shape('c')]), ['a', 'c'], 'g-new', '  Title  ');
    expect(order(sp)).toEqual(['b', 'a:g-new', 'c:g-new']);
    expect(sp.groups).toEqual([{ id: 'g-new', name: 'Title' }]);
    const unnamed = groupElements(page([shape('a'), shape('b')]), ['a', 'b'], 'g2');
    expect(unnamed.groups).toBeUndefined();
  });

  it('BKGRP-006: an element taken into a new group leaves its old one, which dissolves when one is left', () => {
    const sp = page([shape('a', { group: 'old' }), shape('b', { group: 'old' }), shape('c')], {
      groups: [{ id: 'old', name: 'Old' }],
    });
    const next = groupElements(sp, ['b', 'c'], 'new');
    expect(order(next)).toEqual(['a', 'b:new', 'c:new']);
    expect(next.groups).toBeUndefined();
  });

  it('BKGRP-007: ungroups, leaving the members where they are and the name gone', () => {
    const sp = page([shape('a', { group: 'g' }), shape('b', { group: 'g' }), shape('c')], {
      groups: [{ id: 'g', name: 'X' }],
    });
    const next = ungroupElements(sp, 'g');
    expect(order(next)).toEqual(['a', 'b', 'c']);
    expect(next.groups).toBeUndefined();
    expect('group' in (next.elements[0] as object)).toBe(false);
  });

  it('BKGRP-008: tidies a lone member and a name without a group, and leaves an orderly page as it is', () => {
    const sp = page([shape('a', { group: 'g' }), shape('b')], {
      groups: [
        { id: 'g', name: 'Lone' },
        { id: 'gone', name: 'Gone' },
      ],
    });
    const next = tidyGroups(sp);
    expect(order(next)).toEqual(['a', 'b']);
    expect(next.groups).toBeUndefined();
    const fine = page([shape('a', { group: 'g' }), shape('b', { group: 'g' })], { groups: [{ id: 'g', name: 'Y' }] });
    expect(tidyGroups(fine)).toBe(fine);
    const keeps = tidyGroups(
      page([shape('a', { group: 'g' }), shape('b', { group: 'g' })], {
        groups: [
          { id: 'g', name: 'Y' },
          { id: 'x', name: 'Z' },
        ],
      }),
    );
    expect(keeps.groups).toEqual([{ id: 'g', name: 'Y' }]);
  });
});

describe('layer names and visibility', () => {
  it('BKGRP-009: names an element or a group, and an empty name clears it', () => {
    const sp = page([shape('a', { group: 'g' }), shape('b', { group: 'g' })]);
    const named = renameElement(sp, 'a', ' Sun ');
    expect(named.elements[0]?.name).toBe('Sun');
    expect('name' in (renameElement(named, 'a', '  ').elements[0] as object)).toBe(false);
    const group = renameGroup(sp, 'g', 'Sky');
    expect(group.groups).toEqual([{ id: 'g', name: 'Sky' }]);
    expect(renameGroup(renameGroup(group, 'g', 'Sea'), 'g', '').groups).toBeUndefined();
    expect(renameGroup(group, 'g', 'Sea').groups).toEqual([{ id: 'g', name: 'Sea' }]);
  });

  it('BKGRP-010: hides and shows, a shown element storing no flag, and the print leaves the hidden out', () => {
    const sp = page([shape('a'), shape('b')]);
    const hidden = setElementsHidden(sp, ['a'], true);
    expect(hidden.elements[0]?.hidden).toBe(true);
    expect(visibleSpread(hidden).elements.map((e) => e.id)).toEqual(['b']);
    expect(visibleSpread(sp)).toBe(sp);
    const shown = setElementsHidden(hidden, ['a'], false);
    expect('hidden' in (shown.elements[0] as object)).toBe(false);
  });

  it('BKGRP-011: a document from before groups reads with none of the new fields set', () => {
    const sp = page([shape('a')]);
    expect(sp.groups).toBeUndefined();
    expect(Object.keys(sp.elements[0] as object)).not.toEqual(expect.arrayContaining(['group']));
    // A broken name list is dropped, never the page.
    const odd = bookSpreadSchema.parse({ id: 'sp', elements: [], groups: 'nonsense' });
    expect(odd.groups).toBeUndefined();
  });
});

describe('copies', () => {
  let n = 0;
  const newId = (p: string) => `${p}-c${++n}`;

  it('BKGRP-012: copies of a group become a group of their own, its name carried along', () => {
    const source = page([shape('a', { group: 'g' }), shape('b', { group: 'g' }), shape('c', { group: 'h' })], {
      groups: [{ id: 'g', name: 'Lockup' }],
    });
    const copies = source.elements.map((e) => ({ ...e, id: `${e.id}2` }));
    const out = regroupCopies(copies, source, newId);
    const [a, b, c] = out.elements;
    expect(a?.group).toBe(b?.group);
    expect(a?.group).not.toBe('g');
    // c was the only copy of its group: it goes alone.
    expect(c && 'group' in c).toBe(false);
    expect(out.groups).toEqual([{ id: a?.group, name: 'Lockup' }]);
    const target = withCopies(page([shape('z')]), out);
    expect(target.elements.map((e) => e.id)).toEqual(['z', 'a2', 'b2', 'c2']);
    expect(target.groups).toEqual(out.groups);
  });

  it('BKGRP-013: copies without groups, or without a source to name them from, stay plain', () => {
    const plain = regroupCopies([shape('a')], undefined, newId);
    expect(plain.groups).toEqual([]);
    const unnamed = regroupCopies([shape('a', { group: 'g' }), shape('b', { group: 'g' })], undefined, newId);
    expect(unnamed.groups).toEqual([]);
    expect(unnamed.elements[0]?.group).toBe(unnamed.elements[1]?.group);
    expect(withCopies(page([]), plain).groups).toBeUndefined();
    expect(withoutGroup(shape('x', { group: 'g' })).group).toBeUndefined();
  });
});
