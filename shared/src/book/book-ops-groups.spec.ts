import { spreadFindings } from './book-findings';
import { designFindings } from './book-findings-design';
import { applyBookOps } from './book-ops';
import { isGroupOp } from './book-ops-groups';
import { bookPageOpSchema, type BookPageOpInput } from './book-ops.schema';
import { blankBook } from './book-pages';
import {
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from './book.schema';
import { describeSpread } from './describe-spread';

import { describe, expect, it } from 'vitest';

/**
 * The layer operations the assistant sends, `group`, `ungroup`, `name` and
 * `hide`, run by the one engine, and what grouping changes about the other
 * operations, the findings and the words describe_book_page reads out.
 */

let seq = 0;
const newId = (p: string) => `${p}-n${++seq}`;

type Frame = { x: number; y: number; w: number; h: number };

const text = (id: string, words: string, frame: Frame = { x: 230, y: 120, w: 160, h: 40 }, over = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: words, size: 10, ...over }) as BookElement;
const shape = (id: string, x: number, y: number, over = {}) =>
  bookShapeElementSchema.parse({
    id,
    kind: 'shape',
    frame: { x, y, w: 20, h: 20 },
    shape: 'rect',
    ...over,
  }) as BookElement;
const photo = (id: string, frame: Frame, over = {}) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId: 1, ...over }) as BookElement;

function book(elements: BookElement[], over: Partial<BookSpread> = {}): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements, ...over };
  return { ...doc, spreads };
}

const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;
const run = (doc: BookDocument, ops: BookPageOpInput[]) => applyBookOps(doc, { spreadId: 'sp-in', ops }, { newId });

function ok(result: ReturnType<typeof applyBookOps>): BookDocument {
  if (!result.ok) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  expect(bookSpreadSchema.safeParse(inner(result.doc)).success).toBe(true);
  return result.doc;
}
const refusal = (result: ReturnType<typeof applyBookOps>) => (result.ok ? null : result.error.code);
const order = (doc: BookDocument) => inner(doc).elements.map((e) => `${e.id}${e.group ? ':g' : ''}`);

describe('the layer operations', () => {
  const page = () => book([shape('a', 230, 20), text('t', 'Title'), shape('b', 300, 20), shape('c', 330, 20)]);

  it('BKGOPS-001: groups elements under a new id and name, gathered together at the topmost', () => {
    const doc = ok(run(page(), [{ op: 'group', elementIds: ['a', 'b'], name: 'Sun and sea' }]));
    expect(order(doc)).toEqual(['t', 'a:g', 'b:g', 'c']);
    const groupId = inner(doc).elements[1]?.group;
    expect(groupId).toMatch(/^g-n\d+$/);
    expect(inner(doc).groups).toEqual([{ id: groupId, name: 'Sun and sea' }]);
  });

  it('BKGOPS-002: refuses a locked element, a missing one, and one element twice', () => {
    const locked = book([shape('a', 230, 20, { locked: true }), shape('b', 300, 20)]);
    expect(refusal(run(locked, [{ op: 'group', elementIds: ['a', 'b'] }]))).toBe('locked');
    expect(refusal(run(page(), [{ op: 'group', elementIds: ['a', 'zz'] }]))).toBe('element_not_found');
    expect(refusal(run(page(), [{ op: 'group', elementIds: ['a', 'a'] }]))).toBe('not_enough_elements');
  });

  it('BKGOPS-003: ungroups, names and hides, locked elements too, and says which group is missing', () => {
    const grouped = ok(run(page(), [{ op: 'group', elementIds: ['a', 'b'] }]));
    const groupId = inner(grouped).elements.find((e) => e.id === 'a')?.group as string;
    const named = ok(
      run(grouped, [
        { op: 'name', groupId, name: 'Pair' },
        { op: 'name', elementId: 't', name: 'Heading' },
      ]),
    );
    expect(inner(named).groups).toEqual([{ id: groupId, name: 'Pair' }]);
    expect(inner(named).elements.find((e) => e.id === 't')?.name).toBe('Heading');
    const apart = ok(run(named, [{ op: 'ungroup', groupId }]));
    expect(order(apart)).toEqual(['t', 'a', 'b', 'c']);
    expect(inner(apart).groups).toBeUndefined();
    expect(refusal(run(apart, [{ op: 'ungroup', groupId }]))).toBe('group_not_found');
    expect(refusal(run(apart, [{ op: 'name', groupId: 'g-none', name: 'x' }]))).toBe('group_not_found');
    expect(refusal(run(apart, [{ op: 'name', elementId: 'zz', name: 'x' }]))).toBe('element_not_found');

    const pinned = book([shape('a', 230, 20, { locked: true })]);
    const hidden = ok(run(pinned, [{ op: 'hide', elementIds: ['a'], hidden: true }]));
    expect(inner(hidden).elements[0]?.hidden).toBe(true);
    const shown = ok(run(hidden, [{ op: 'hide', elementIds: ['a'], hidden: false }]));
    expect('hidden' in (inner(shown).elements[0] as object)).toBe(false);
    expect(refusal(run(pinned, [{ op: 'hide', elementIds: ['zz'], hidden: true }]))).toBe('element_not_found');
  });

  it('BKGOPS-004: the contract wants an element or a group to name, and two elements to group', () => {
    expect(bookPageOpSchema.safeParse({ op: 'name', name: 'x' }).success).toBe(false);
    expect(bookPageOpSchema.safeParse({ op: 'name', name: 'x', elementId: 'a', groupId: 'g' }).success).toBe(false);
    expect(bookPageOpSchema.safeParse({ op: 'group', elementIds: ['a'] }).success).toBe(false);
    expect(bookPageOpSchema.safeParse({ op: 'name', name: 'x'.repeat(61), elementId: 'a' }).success).toBe(false);
    expect(isGroupOp({ op: 'group' })).toBe(true);
    expect(isGroupOp({ op: 'align' })).toBe(false);
  });
});

describe('the other operations, with groups', () => {
  const grouped = () =>
    book([shape('a', 230, 20, { group: 'g' }), shape('b', 260, 40, { group: 'g' }), shape('c', 330, 20)], {
      groups: [{ id: 'g', name: 'Lockup' }],
    });

  it('BKGOPS-005: a duplicate of a group is a new group of the same name, never part of the old one', () => {
    const doc = ok(run(grouped(), [{ op: 'duplicate', elementIds: ['a', 'b'] }]));
    const els = inner(doc).elements;
    const copies = els.slice(3);
    expect(copies[0]?.group).toBe(copies[1]?.group);
    expect(copies[0]?.group).not.toBe('g');
    expect(inner(doc).groups).toEqual([
      { id: 'g', name: 'Lockup' },
      { id: copies[0]?.group, name: 'Lockup' },
    ]);
  });

  it('BKGOPS-006: copy_from brings a group as a group of its own', () => {
    const doc = grouped();
    const withSource = {
      ...doc,
      spreads: doc.spreads.map((s, i) => (i === 3 ? { ...inner(doc), id: 'sp-last', role: 'last' as const } : s)),
    };
    const empty = {
      ...withSource,
      spreads: withSource.spreads.map((s, i) => (i === 2 ? { ...s, elements: [], groups: undefined } : s)),
    };
    const done = ok(
      applyBookOps(
        empty,
        { spreadId: 'sp-in', ops: [{ op: 'copy_from', spreadId: 'sp-last', elementIds: ['a', 'b'] }] },
        { newId },
      ),
    );
    const [a, b] = inner(done).elements;
    expect(a?.group).toBe(b?.group);
    expect(a?.group).not.toBe('g');
    expect(inner(done).groups?.[0]?.name).toBe('Lockup');
  });

  it('BKGOPS-007: removing a member leaves no group of one; aligning moves the group as one box', () => {
    const removed = ok(run(grouped(), [{ op: 'remove', elementIds: ['a'], park: false }]));
    expect(order(removed)).toEqual(['b', 'c']);
    expect(inner(removed).groups).toBeUndefined();
    const aligned = ok(run(grouped(), [{ op: 'align', elementIds: ['a', 'b', 'c'], edge: 'top' }]));
    const ys = inner(aligned).elements.map((e) => e.frame.y);
    // The group's box starts at 20 already, so it stays; c is at 20 too.
    expect(ys).toEqual([20, 40, 20]);
    const arranged = ok(run(grouped(), [{ op: 'arrange', elementIds: ['c'], to: 'back' }]));
    expect(order(arranged)).toEqual(['c', 'a:g', 'b:g']);
  });

  it('BKGOPS-008: distribute counts a group once', () => {
    const doc = book([
      shape('a', 0, 0),
      shape('g1', 50, 0, { group: 'g' }),
      shape('g2', 60, 0, { group: 'g' }),
      shape('c', 200, 0),
    ]);
    const spaced = ok(run(doc, [{ op: 'distribute', elementIds: ['a', 'g1', 'g2', 'c'], axis: 'horizontal' }]));
    const x = (id: string) => inner(spaced).elements.find((e) => e.id === id)?.frame.x;
    // Span 0..220, sizes 20 + 30 + 20, so gaps of 75; the group keeps its shape.
    expect([x('g1'), x('g2'), x('c')]).toEqual([95, 105, 200]);
    const two = book([shape('g1', 50, 0, { group: 'g' }), shape('g2', 60, 0, { group: 'g' }), shape('c', 200, 0)]);
    expect(refusal(run(two, [{ op: 'distribute', elementIds: ['g1', 'g2', 'c'], axis: 'horizontal' }]))).toBe(
      'not_enough_elements',
    );
  });

  it('BKGOPS-009: a picture filled to the page leaves its group', () => {
    const doc = book([
      photo('p', { x: 230, y: 20, w: 50, h: 40 }, { group: 'g' }),
      shape('s', 300, 20, { group: 'g' }),
    ]);
    const filled = ok(run(doc, [{ op: 'fill', elementId: 'p', scope: 'page' }]));
    expect(inner(filled).elements.every((e) => e.group === undefined)).toBe(true);
  });
});

describe('what a model reads of groups', () => {
  it('BKGOPS-010: describe_book_page names the groups, their members, the hidden and the named', () => {
    const doc = book(
      [
        text('t1', 'Iceland', undefined, { group: 'g-1', name: 'Title' }),
        text('t2', 'June 2026', { x: 230, y: 170, w: 160, h: 20 }, { group: 'g-1' }),
        shape('s', 300, 20, { hidden: true }),
      ],
      { groups: [{ id: 'g-1', name: 'Title lockup' }] },
    );
    const page = describeSpread(doc, 'sp-in');
    expect(page?.text).toContain(
      'Groups, each picked, moved, aligned and arranged as one: g-1 "Title lockup" (t1, t2)',
    );
    expect(page?.text).toContain('in group g-1');
    expect(page?.text).toContain('named "Title"');
    expect(page?.text).toContain('hidden (not on the page or in print)');
    expect(page?.elements[0]).toMatchObject({ group: 'g-1', name: 'Title' });
    expect(page?.elements[2]).toMatchObject({ hidden: true });
    expect(describeSpread(book([shape('s', 300, 20)]), 'sp-in')?.text).not.toContain('Groups,');
  });

  it('BKGOPS-011: two texts set over each other inside one group are a lockup, not an accident', () => {
    const over = [
      text('t1', 'Iceland', { x: 230, y: 120, w: 160, h: 40 }),
      text('t2', 'Island', { x: 235, y: 125, w: 160, h: 40 }),
    ];
    const loose = spreadFindings(inner(book(over)), book(over).page);
    expect(loose.some((f) => f.code === 'overlap')).toBe(true);
    const lockup = over.map((e) => ({ ...e, group: 'g' }) as BookElement);
    expect(spreadFindings(inner(book(lockup)), book(lockup).page).some((f) => f.code === 'overlap')).toBe(false);
  });

  it('BKGOPS-012: a hidden element is not on the page, so the checks leave it out', () => {
    const els = [
      photo('p1', { x: 230, y: 20, w: 80, h: 60 }),
      photo('p2', { x: 240, y: 30, w: 80, h: 60 }, { hidden: true }),
    ];
    const doc = book(els);
    expect(spreadFindings(inner(doc), doc.page).some((f) => f.elementIds?.includes('p2'))).toBe(false);
    expect(designFindings(inner(doc), doc.page).some((f) => f.elementIds?.includes('p2'))).toBe(false);
  });
});
