import type { BookDocument, BookElement, BookLineElement, BookSpread, BookTextElement } from '@trek/shared';
import {
  bookLineElementSchema,
  bookLinePoints,
  bookPageSetupSchema,
  bookShapeElementSchema,
  bookTextElementSchema,
} from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { useStudioStore } from './studioStore';

/**
 * Groups, layers and the editor's productivity actions in the Studio store
 * (studioLayers.ts): what a click selects, every action as one undo step,
 * locked elements left where they are.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });

const shape = (id: string, x: number, y: number, over: Partial<BookElement> = {}): BookElement =>
  bookShapeElementSchema.parse({
    id,
    kind: 'shape',
    frame: { x, y, w: 20, h: 20 },
    shape: 'rect',
    ...over,
  }) as BookElement;

const text = (id: string, over: Partial<BookElement> = {}): BookElement =>
  bookTextElementSchema.parse({
    id,
    kind: 'text',
    frame: { x: 10, y: 10, w: 60, h: 20 },
    text: 'Hi',
    ...over,
  }) as BookElement;

function load(elements: BookElement[], over: Partial<BookSpread> = {}, more: BookSpread[] = []) {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null, ...over }, ...more],
  } as BookDocument);
}

const store = () => useStudioStore.getState();

/** The value, or a failed test when it is missing. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}
const els = (i = 0) => must(must(store().doc).spreads[i]).elements;
const spread = (i = 0) => must(must(store().doc).spreads[i]);
const el = (id: string) => must(els().find((e) => e.id === id));
const order = () => els().map((e) => e.id);

const grouped = () => [
  shape('a', 10, 10),
  shape('g1', 50, 10, { group: 'g' }),
  shape('g2', 80, 30, { group: 'g' }),
  shape('b', 150, 10),
];

beforeEach(() => {
  load([]);
  // The style clipboard outlives a page on purpose; each test starts without one.
  useStudioStore.setState({ styleClip: null, enteredGroup: null });
});

describe('what a click selects', () => {
  it('picks a whole group, and one element alone', () => {
    load(grouped());
    store().pick(0, 'g2', false);
    expect(store().selection).toEqual(['g1', 'g2']);
    store().pick(0, 'a', false);
    expect(store().selection).toEqual(['a']);
  });

  it('adds with shift, and takes out what is all in already', () => {
    load(grouped());
    store().pick(0, 'a', false);
    store().pick(0, 'g1', true);
    expect(store().selection).toEqual(['a', 'g1', 'g2']);
    store().pick(0, 'g2', true);
    expect(store().selection).toEqual(['a']);
  });

  it('keeps a multi-selection when one of it is pressed, so it can be dragged', () => {
    load(grouped());
    store().select(['a', 'b']);
    store().pick(0, 'b', false);
    expect(store().selection).toEqual(['a', 'b']);
  });

  it('steps into a group and out again', () => {
    load(grouped());
    store().enterGroup(0, 'g2');
    expect([store().selection, store().enteredGroup]).toEqual([['g2'], 'g']);
    store().pick(0, 'g1', false);
    expect(store().selection).toEqual(['g1']);
    expect(store().leaveGroup(0)).toBe(true);
    expect([store().selection, store().enteredGroup]).toEqual([['g1', 'g2'], null]);
    expect(store().leaveGroup(0)).toBe(false);
    // An ungrouped element cannot be stepped into.
    store().enterGroup(0, 'a');
    expect(store().enteredGroup).toBeNull();
  });

  it('a click outside the group stepped into steps out, and clearing the selection does too', () => {
    load(grouped());
    store().enterGroup(0, 'g1');
    store().pick(0, 'a', false);
    expect(store().enteredGroup).toBeNull();
    store().enterGroup(0, 'g1');
    store().select([]);
    expect(store().enteredGroup).toBeNull();
  });

  it('selects a group from its row, and everything not hidden', () => {
    load([...grouped(), shape('h', 0, 0, { hidden: true })]);
    store().selectGroup(0, 'g', false);
    expect(store().selection).toEqual(['g1', 'g2']);
    store().select(['a']);
    store().selectGroup(0, 'g', true);
    expect(store().selection).toEqual(['a', 'g1', 'g2']);
    store().selectAll(0);
    expect(store().selection).toEqual(['a', 'g1', 'g2', 'b']);
  });
});

describe('group and ungroup', () => {
  it('groups the unlocked part of the selection as one undo step, and ungroups it again', () => {
    load([shape('a', 0, 0), shape('b', 30, 0), shape('c', 60, 0, { locked: true })]);
    store().select(['a', 'b', 'c']);
    store().group(0);
    expect(el('a').group).toBeDefined();
    expect(el('a').group).toBe(el('b').group);
    expect(el('c').group).toBeUndefined();
    expect(store().selection).toEqual(['a', 'b']);
    store().ungroup(0);
    expect(el('a').group).toBeUndefined();
    store().undo();
    expect(el('a').group).toBeDefined();
    store().undo();
    expect(el('a').group).toBeUndefined();
  });

  it('does nothing for one element, a whole group, or a selection without groups', () => {
    load(grouped());
    const before = store().doc;
    store().select(['a']);
    store().group(0);
    store().select(['g1', 'g2']);
    store().group(0);
    store().select(['a', 'b']);
    store().ungroup(0);
    expect(store().doc).toBe(before);
  });
});

describe('moving', () => {
  it('nudges what is selected and unlocked, one undo step for a held key', () => {
    load([shape('a', 10, 10), shape('l', 10, 10, { locked: true })]);
    store().select(['a', 'l']);
    store().beginGesture();
    store().nudge(0, 1, 0);
    store().nudge(0, 1, 0);
    store().nudge(0, 0, 10);
    store().endGesture();
    expect(el('a').frame).toMatchObject({ x: 12, y: 20 });
    expect(el('l').frame).toMatchObject({ x: 10, y: 10 });
    store().undo();
    expect(el('a').frame).toMatchObject({ x: 10, y: 10 });
  });

  it('aligns and distributes, moving a group as one box', () => {
    load(grouped());
    store().select(['a', 'g1', 'g2', 'b']);
    store().align(0, 'top', 'selection');
    expect([el('a').frame.y, el('g1').frame.y, el('g2').frame.y]).toEqual([10, 10, 30]);
    store().distribute(0, 'horizontal');
    // a 10..30, group 50..100, b 150..170: gaps of 35, so the group starts at 65.
    expect([el('g1').frame.x, el('g2').frame.x]).toEqual([65, 95]);
    store().undo();
    expect(el('g1').frame.x).toBe(50);
  });

  it('leaves alignment alone with nothing movable, and distribute with fewer than three', () => {
    load([shape('a', 10, 10, { locked: true }), shape('b', 40, 40)]);
    const before = store().doc;
    store().select(['a']);
    store().align(0, 'left', 'page');
    store().select(['a', 'b']);
    store().distribute(0, 'horizontal');
    expect(store().doc).toBe(before);
  });

  it('raises a group whole, and a member inside its group only', () => {
    load(grouped());
    store().raise(0, ['g1'], 'back');
    expect(order()).toEqual(['g1', 'g2', 'a', 'b']);
    store().enterGroup(0, 'g1');
    store().raise(0, ['g1'], 'up');
    expect(order()).toEqual(['g2', 'g1', 'a', 'b']);
    store().raise(0, 'b', 'down');
    expect(order()).toEqual(['g2', 'g1', 'b', 'a']);
  });
});

describe('the layers panel', () => {
  it('restacks a layer in front of or behind another, joining a group when dropped on a member', () => {
    load(grouped());
    store().restack(0, ['a'], 'b', 'above', false);
    expect(order()).toEqual(['g1', 'g2', 'b', 'a']);
    store().restack(0, ['a'], 'g1', 'below', true);
    expect(order()).toEqual(['a', 'g1', 'g2', 'b']);
    expect(el('a').group).toBe('g');
    // Dragged out beside an ungrouped element, it leaves the group.
    store().restack(0, ['a'], 'b', 'above', false);
    expect(el('a').group).toBeUndefined();
  });

  it('moves a whole group without breaking it, and refuses to drop a layer on itself', () => {
    load(grouped());
    store().restack(0, ['g1', 'g2'], 'b', 'above', false);
    expect(order()).toEqual(['a', 'b', 'g1', 'g2']);
    expect(el('g1').group).toBe('g');
    const before = store().doc;
    store().restack(0, ['a'], 'a', 'above', false);
    store().restack(0, ['a'], 'missing', 'above', false);
    expect(store().doc).toBe(before);
  });

  it('hides, locks and names, each as one undo step, and a hidden layer leaves the selection', () => {
    load(grouped());
    store().select(['a', 'b']);
    store().setHidden(0, ['a'], true);
    expect(el('a').hidden).toBe(true);
    expect(store().selection).toEqual(['b']);
    store().setLocked(0, ['g1', 'g2'], true);
    expect([el('g1').locked, el('g2').locked]).toEqual([true, true]);
    store().renameLayer(0, { elementId: 'b' }, 'Sun');
    store().renameLayer(0, { groupId: 'g' }, 'Lockup');
    expect(el('b').name).toBe('Sun');
    expect(spread().groups).toEqual([{ id: 'g', name: 'Lockup' }]);
    store().undo();
    expect(spread().groups).toBeUndefined();
    store().setHidden(0, ['a'], false);
    expect('hidden' in el('a')).toBe(false);
  });
});

describe('copies and the style clipboard', () => {
  it('duplicates a group as a new group beside it, selected', () => {
    load(grouped(), { groups: [{ id: 'g', name: 'Lockup' }] });
    store().duplicate(0, ['g1', 'g2']);
    const copies = els().slice(4);
    expect(copies.map((e) => e.frame.x)).toEqual([54, 84]);
    expect(must(copies[0]).group).toBe(must(copies[1]).group);
    expect(must(copies[0]).group).not.toBe('g');
    expect(store().selection).toEqual(copies.map((e) => e.id));
    expect(spread().groups?.map((g) => g.name)).toEqual(['Lockup', 'Lockup']);
  });

  it('pastes a copied group onto another page as a group of its own', () => {
    const other: BookSpread = { id: 'sp2', role: 'inner', background: null, elements: [], parked: [], entryId: null };
    load(grouped(), {}, [other]);
    store().copy(0, ['g1', 'g2']);
    store().paste(1);
    const pasted = els(1);
    expect(pasted).toHaveLength(2);
    expect(must(pasted[0]).group).toBe(must(pasted[1]).group);
    expect(must(pasted[0]).group).not.toBe('g');
  });

  it('a delete that leaves a group of one dissolves it', () => {
    load(grouped());
    store().removeElements(0, ['g1']);
    expect(el('g2').group).toBeUndefined();
  });

  it('copies the look of one element and pastes it onto others, unlocked only, as one step', () => {
    load([
      text('t1', { size: 30, color: '#ff0000' }),
      text('t2'),
      text('t3', { locked: true }),
      shape('s', 0, 0, { opacity: 1 }),
    ]);
    store().select(['t1']);
    store().copyStyle(0);
    expect(store().styleClip?.kind).toBe('text');
    store().select(['t2', 't3', 's']);
    store().pasteStyle(0);
    expect(el('t2')).toMatchObject({ size: 30, color: '#ff0000', text: 'Hi' });
    expect(el('t3')).not.toMatchObject({ size: 30 });
    store().undo();
    expect(el('t2')).not.toMatchObject({ size: 30 });
  });

  it('a pasted colour or face takes the element off the theme, as the style operation does', () => {
    load([
      text('mine', { color: '#c2410c', font: 'playfair' }),
      text('linked', { color: '#1a1a1a', token: 'ink', font: 'inter', fontRole: 'body' }),
    ]);
    store().select(['mine']);
    store().copyStyle(0);
    store().select(['linked']);
    store().pasteStyle(0);
    const linked = el('linked') as BookTextElement;
    expect(linked).toMatchObject({ color: '#c2410c', font: 'playfair' });
    expect(linked.token).toBeUndefined();
    expect(linked.fontRole).toBeUndefined();
  });

  it('a pasted plain fill replaces the paint of the shape it lands on', () => {
    const fade = {
      type: 'linear' as const,
      angle: 45,
      stops: [
        { at: 0, color: '#ff0000' },
        { at: 1, color: '#0000ff' },
      ],
    };
    load([shape('red', 0, 0, { fill: '#dc2626' }), shape('painted', 40, 0, { paint: fade, fill: '#800080' })]);
    store().select(['red']);
    store().copyStyle(0);
    store().select(['painted']);
    store().pasteStyle(0);
    expect(el('painted')).toMatchObject({ fill: '#dc2626' });
    expect('paint' in el('painted')).toBe(false);
  });

  it("a line takes another line's look and keeps its own course", () => {
    const route = bookLineElementSchema.parse({
      id: 'route',
      kind: 'line',
      frame: { x: 10, y: 10, w: 100, h: 60 },
      points: [
        { x: 0, y: 1 },
        { x: 0.5, y: 0 },
        { x: 1, y: 1 },
      ],
      stroke: '#c2410c',
      dash: 'dashed',
    }) as BookElement;
    const rule = bookLineElementSchema.parse({
      id: 'rule',
      kind: 'line',
      frame: { x: 20, y: 120, w: 100, h: 2 },
    }) as BookElement;
    load([route, rule]);
    const before = bookLinePoints(rule as BookLineElement);
    store().select(['route']);
    store().copyStyle(0);
    store().select(['rule']);
    store().pasteStyle(0);
    const pasted = el('rule') as BookLineElement;
    expect(pasted).toMatchObject({ stroke: '#c2410c', dash: 'dashed' });
    expect(pasted.points).toHaveLength(2);
    bookLinePoints(pasted).forEach(([x, y], i) => {
      expect(x).toBeCloseTo(must(before[i])[0], 1);
      expect(y).toBeCloseTo(must(before[i])[1], 1);
    });
  });

  it('pastes nothing without a copied style, or onto a kind that shares nothing with it', () => {
    load([shape('s', 0, 0), text('t')]);
    const before = store().doc;
    store().select(['s']);
    store().pasteStyle(0);
    useStudioStore.setState({ styleClip: { kind: 'icon', props: { lineWidth: 2 } } });
    store().pasteStyle(0);
    expect(store().doc).toBe(before);
  });
});
