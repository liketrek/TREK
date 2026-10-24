import type { BookDocument, BookElement } from '@trek/shared';
import { bookPageSetupSchema, bookShapeElementSchema, bookTextElementSchema } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render } from '../../../tests/helpers/render';
import { useStudioStore } from '../../store/studioStore';
import { AngleDial } from './paint/AngleDial';
import { GradientStopBar } from './paint/GradientStopBar';
import { StudioCanvas } from './StudioCanvas';

/**
 * The sheet with groups and multi-selections (journey-studio WP6): a click
 * picks a group, a double-click steps into it, a marquee picks what it
 * touches, one box resizes a multi-selection, and the keyboard nudges,
 * groups, duplicates and steps back out.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const PX = 96 / 25.4;

/** The value, or a failed test when it is missing. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

const shape = (id: string, x: number, y: number, over: Partial<BookElement> = {}): BookElement =>
  bookShapeElementSchema.parse({
    id,
    kind: 'shape',
    frame: { x, y, w: 20, h: 20 },
    shape: 'rect',
    ...over,
  }) as BookElement;

function load(elements: BookElement[]) {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null }],
  } as BookDocument);
}

function draw() {
  const spread = must(useStudioStore.getState().doc).spreads[0] ?? null;
  const view = render(
    <StudioCanvas spread={spread} spreadIndex={0} page={page} zoom={1} pxPerMm={PX} bookView={false} dropLabel="" />
  );
  const stage = view.container.querySelector('.st-stage') as HTMLElement;
  const sheet = view.container.querySelector('.st-sheet') as HTMLElement;
  // The hit targets are the last children of the sheet, one per element shown, in paint order.
  const targets = () => Array.from(sheet.children).slice(-elements().filter((e) => !e.hidden).length) as HTMLElement[];
  return { ...view, stage, sheet, targets };
}

const store = () => useStudioStore.getState();
const elements = () => must(must(store().doc).spreads[0]).elements;
const el = (id: string) => must(elements().find((e) => e.id === id));

const grouped = () => [shape('a', 10, 10), shape('g1', 60, 10, { group: 'g' }), shape('g2', 90, 40, { group: 'g' })];

beforeEach(() => {
  load([]);
  useStudioStore.setState({ enteredGroup: null, styleClip: null });
});

describe('groups on the sheet', () => {
  it('a click on a member picks the whole group, drawn as one dashed box with handles', () => {
    load(grouped());
    const { container, stage, targets } = draw();
    fireEvent.pointerDown(must(targets()[1]));
    fireEvent.pointerUp(stage);
    expect(store().selection).toEqual(['g1', 'g2']);
    const box = container.querySelector('.st-select-box') as HTMLElement;
    expect(box.className).toContain('is-group');
    expect(box.querySelectorAll('.st-handle')).toHaveLength(8);
    expect(container.querySelectorAll('.st-select.is-member')).toHaveLength(2);
  });

  it('a double-click steps into the group and picks the member alone', () => {
    load(grouped());
    const { container, stage, targets } = draw();
    fireEvent.pointerDown(must(targets()[2]));
    fireEvent.pointerUp(stage);
    fireEvent.doubleClick(must(targets()[2]));
    expect(store().selection).toEqual(['g2']);
    expect(store().enteredGroup).toBe('g');
    expect(container.querySelector('.st-select.is-inside')).not.toBeNull();
  });

  it('a second double-click on a text inside its group edits it', () => {
    const words = bookTextElementSchema.parse({
      id: 't',
      kind: 'text',
      frame: { x: 10, y: 10, w: 60, h: 20 },
      text: 'Hi',
      group: 'g',
    }) as BookElement;
    load([words, shape('s', 100, 100, { group: 'g' })]);
    const { container, targets } = draw();
    fireEvent.doubleClick(must(targets()[0]));
    expect(container.querySelector('.st-inline-edit')).toBeNull();
    fireEvent.doubleClick(must(targets()[0]));
    expect(container.querySelector('.st-inline-edit')).not.toBeNull();
  });

  it('draws no target for a hidden element', () => {
    load([shape('a', 10, 10), shape('h', 50, 50, { hidden: true })]);
    const { sheet } = draw();
    const hits = Array.from(sheet.children).filter((c) => (c as HTMLElement).style.cursor === 'move');
    expect(hits).toHaveLength(1);
  });
});

describe('pressing on a selection', () => {
  it('drags all of a multi-selection, and a click without a drag narrows it to the one pressed', () => {
    load([shape('a', 10, 10), shape('b', 60, 10)]);
    store().select(['a', 'b']);
    const { stage, targets } = draw();
    fireEvent.pointerDown(must(targets()[0]), { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(stage, { clientX: 10 * PX, clientY: 0 });
    fireEvent.pointerUp(stage);
    expect(store().selection).toEqual(['a', 'b']);
    expect(el('a').frame.x).toBeCloseTo(20);
    expect(el('b').frame.x).toBeCloseTo(70);

    fireEvent.pointerDown(must(targets()[1]), { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(stage);
    expect(store().selection).toEqual(['b']);
  });
});

describe('the marquee', () => {
  it('picks what it touches, with its group, and is drawn while it is dragged', () => {
    load(grouped());
    const { container, stage, sheet } = draw();
    fireEvent.pointerDown(sheet, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(stage, { clientX: 70 * PX, clientY: 25 * PX });
    expect(container.querySelector('.st-marquee')).not.toBeNull();
    expect(store().selection).toEqual(['a', 'g1', 'g2']);
    fireEvent.pointerUp(stage);
    expect(container.querySelector('.st-marquee')).toBeNull();
    expect(store().selection).toEqual(['a', 'g1', 'g2']);
  });

  it('adds to the selection with shift, and a click on bare paper clears it', () => {
    load([shape('a', 10, 10), shape('b', 100, 100)]);
    const { stage, sheet } = draw();
    store().select(['b']);
    fireEvent.pointerDown(sheet, { clientX: 0, clientY: 0, shiftKey: true });
    fireEvent.pointerMove(stage, { clientX: 40 * PX, clientY: 40 * PX, shiftKey: true });
    fireEvent.pointerUp(stage);
    expect(store().selection).toEqual(['b', 'a']);
    fireEvent.pointerDown(sheet, { clientX: 5, clientY: 5 });
    fireEvent.pointerUp(stage);
    expect(store().selection).toEqual([]);
  });

  it('starts from a locked element dragged, and leaves the locked one out', () => {
    load([shape('bg', 0, 0, { locked: true, frame: { x: 0, y: 0, w: 200, h: 200 } }), shape('a', 10, 10)]);
    const { stage, targets } = draw();
    fireEvent.pointerDown(must(targets()[0]), { clientX: 1, clientY: 1 });
    fireEvent.pointerMove(stage, { clientX: 40 * PX, clientY: 40 * PX });
    fireEvent.pointerUp(stage);
    expect(store().selection).toEqual(['a']);
    expect(el('bg').frame).toMatchObject({ x: 0, y: 0 });
  });
});

describe('resizing a multi-selection', () => {
  const grab = () => {
    load([shape('a', 10, 10), shape('b', 50, 30)]);
    store().select(['a', 'b']);
    const view = draw();
    const handles = Array.from(view.container.querySelectorAll('.st-select-box .st-handle')) as HTMLElement[];
    // The handles run nw, n, ne, e, se, s, sw, w.
    return { ...view, se: must(handles[4]) };
  };

  it('scales every frame inside one box', () => {
    const { stage, se } = grab();
    fireEvent.pointerDown(se, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(stage, { clientX: 60 * PX, clientY: 0 });
    fireEvent.pointerUp(stage);
    // The box 10..70 grows to 10..130 across, so everything doubles that way.
    expect(el('a').frame.w).toBeCloseTo(40);
    expect(el('b').frame.x).toBeCloseTo(90);
    expect(el('b').frame.h).toBeCloseTo(20);
    store().undo();
    expect(el('a').frame).toMatchObject({ w: 20, h: 20 });
  });

  it('keeps the proportions with shift, so every element keeps its own', () => {
    const { stage, se } = grab();
    fireEvent.pointerDown(se, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(stage, { clientX: 120 * PX, clientY: 0, shiftKey: true });
    fireEvent.pointerUp(stage);
    // 60 by 40 to 180 by 120: three times either way.
    expect(el('a').frame.w).toBeCloseTo(60);
    expect(el('a').frame.h).toBeCloseTo(60);
    expect(el('b').frame.y).toBeCloseTo(70);
  });

  it('leaves a locked member where it is', () => {
    load([shape('a', 10, 10), shape('l', 50, 30, { locked: true })]);
    store().select(['a', 'l']);
    const { container, stage } = draw();
    const se = Array.from(container.querySelectorAll('.st-select-box .st-handle'))[4] as HTMLElement;
    fireEvent.pointerDown(se, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(stage, { clientX: 20 * PX, clientY: 20 * PX });
    fireEvent.pointerUp(stage);
    expect(el('l').frame).toMatchObject({ x: 50, y: 30, w: 20, h: 20 });
    expect(el('a').frame.w).toBeCloseTo(40);
  });
});

describe('the keyboard', () => {
  it('nudges by a millimetre and ten with shift, one undo step while held', () => {
    load([shape('a', 10, 10)]);
    store().select(['a']);
    draw();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight', repeat: true });
    fireEvent.keyDown(document, { key: 'ArrowDown', shiftKey: true });
    fireEvent.keyUp(document, { key: 'ArrowDown' });
    expect(el('a').frame).toMatchObject({ x: 12, y: 20 });
    store().undo();
    expect(el('a').frame).toMatchObject({ x: 10, y: 10 });
  });

  it('groups, ungroups, duplicates and selects everything', () => {
    load([shape('a', 10, 10), shape('b', 40, 10)]);
    draw();
    fireEvent.keyDown(document, { key: 'a', ctrlKey: true });
    expect(store().selection).toEqual(['a', 'b']);
    fireEvent.keyDown(document, { key: 'g', ctrlKey: true });
    expect(el('a').group).toBeDefined();
    fireEvent.keyDown(document, { key: 'G', ctrlKey: true, shiftKey: true });
    expect(el('a').group).toBeUndefined();
    fireEvent.keyDown(document, { key: 'd', ctrlKey: true });
    expect(elements()).toHaveLength(4);
  });

  it('copies and pastes style, and arranges with the brackets', () => {
    load([shape('a', 10, 10, { fill: '#ff0000' }), shape('b', 40, 10)]);
    draw();
    store().select(['a']);
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true, altKey: true });
    store().select(['b']);
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true, altKey: true });
    expect(el('b')).toMatchObject({ fill: '#ff0000' });
    fireEvent.keyDown(document, { key: '[', ctrlKey: true });
    expect(elements().map((e) => e.id)).toEqual(['b', 'a']);
    fireEvent.keyDown(document, { key: '}', ctrlKey: true, shiftKey: true });
    expect(elements().map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('steps out of a group with Escape, telling the page not to clear the selection', () => {
    load(grouped());
    draw();
    store().enterGroup(0, 'g1');
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(store().selection).toEqual(['g1', 'g2']);
    const again = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(again);
    expect(again.defaultPrevented).toBe(false);
  });

  it('leaves a key to the control that takes it: a gradient stop, the angle dial', () => {
    load([shape('a', 10, 10)]);
    store().select(['a']);
    draw();
    const fade = (n: number) => ({
      type: 'linear' as const,
      angle: 90,
      stops: Array.from({ length: n }, (_, i) => ({ at: i / (n - 1), color: '#112233' })),
    });
    const onChange = vi.fn();
    const labels = { bar: 'bar', stop: (pos: number) => `stop ${pos}` };
    const three = render(
      <GradientStopBar paint={fade(3)} selected={1} onSelect={() => {}} onChange={onChange} labels={labels} />
    );
    fireEvent.keyDown(must(three.container.querySelectorAll('.st-stop')[1]), { key: 'Delete' });
    expect(onChange.mock.calls[0]?.[0].stops).toHaveLength(2);
    three.unmount();
    // The last two stops cannot go, and the key still does not reach the shape.
    const two = render(
      <GradientStopBar paint={fade(2)} selected={0} onSelect={() => {}} onChange={onChange} labels={labels} />
    );
    fireEvent.keyDown(must(two.container.querySelector('.st-stop')), { key: 'Backspace' });
    two.unmount();
    expect(elements().map((e) => e.id)).toEqual(['a']);

    const dial = render(<AngleDial value={90} onChange={() => {}} label="Angle" />);
    fireEvent.keyDown(must(dial.container.querySelector('.st-dial')), { key: 'ArrowRight', shiftKey: true });
    expect(el('a').frame).toMatchObject({ x: 10, y: 10 });
  });

  it("leaves the keys pressed in the assistant's window to it", () => {
    load([shape('a', 10, 10)]);
    store().select(['a']);
    store().copy(0, ['a']);
    draw();
    // As the Studio's assistant window does it: every key pressed in it stops there (StudioAssistantPanel.tsx).
    const chat = render(
      <aside className="st-assistant" onKeyDown={(e) => e.stopPropagation()}>
        <button type="button">Apply</button>
      </aside>
    );
    const button = must(chat.container.querySelector('button'));
    fireEvent.keyDown(button, { key: 'Delete' });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    fireEvent.keyDown(button, { key: 'v', ctrlKey: true });
    expect(elements().map((e) => e.id)).toEqual(['a']);
    expect(el('a').frame).toMatchObject({ x: 10, y: 10 });
  });

  it('leaves the keys to a field being typed in', () => {
    load([shape('a', 10, 10)]);
    store().select(['a']);
    draw();
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'a', ctrlKey: true });
    expect(el('a').frame.x).toBe(10);
    input.remove();
  });
});
