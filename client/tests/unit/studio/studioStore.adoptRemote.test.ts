import type { BookDocument, BookElement, BookSpread } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useStudioStore } from '../../../src/store/studioStore';

/**
 * Taking a version saved elsewhere into the open book.
 *
 * `load` is for opening a book: cover, empty history. A save that arrives while
 * the book is open (another editor, or the assistant applying a page edit) has
 * to leave the user on their page with their undo history, and the document it
 * replaces has to be one Ctrl+Z away.
 */

const el = (id: string): BookElement =>
  ({
    id,
    kind: 'shape',
    frame: { x: 0, y: 0, w: 10, h: 10 },
    rotation: 0,
    opacity: 1,
    locked: false,
    shape: 'rect',
    fill: '#000000',
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    strokeStyle: 'solid',
    radius: 0,
  }) as BookElement;

const spread = (id: string, role: BookSpread['role'], elements: BookElement[] = []): BookSpread => ({
  id,
  role,
  background: null,
  elements,
  parked: [],
  entryId: null,
});

function book(...spreads: BookSpread[]): BookDocument {
  return {
    version: 1,
    title: 'T',
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads,
  } as BookDocument;
}

const store = () => useStudioStore.getState();

const opened = book(
  spread('cover', 'cover'),
  spread('a', 'inner', [el('a1'), el('a2')]),
  spread('b', 'inner', [el('b1')]),
  spread('back', 'back')
);

/** Two pages left, the cover and the back: what a remote save that deleted every inner page looks like. */
const bare = () => book(spread('cover', 'cover'), spread('back', 'back'));

beforeEach(() => {
  useStudioStore.setState({ doc: null, selection: [], activeSpread: 0, past: [], future: [], gestureBase: null });
  store().load(opened);
});

describe('adoptRemote', () => {
  it('FE-STUDIO-ADOPT-001: keeps the page the user is on, by its id, when pages moved in front of it', () => {
    store().setActiveSpread(2);
    const moved = book(
      spread('cover', 'cover'),
      spread('new', 'inner'),
      spread('a', 'inner', [el('a1'), el('a2')]),
      spread('b', 'inner', [el('b1')]),
      spread('back', 'back')
    );
    store().adoptRemote(moved);
    expect(store().activeSpread).toBe(3);
    expect(store().doc?.spreads[store().activeSpread].id).toBe('b');
  });

  it('FE-STUDIO-ADOPT-002: makes the replaced document an undo step, so Ctrl+Z takes the change back', () => {
    store().commit((d) => ({ ...d, title: 'local edit' }));
    const before = store().doc;
    const remote = book(spread('cover', 'cover'), spread('a', 'inner'), spread('back', 'back'));
    store().adoptRemote(remote);

    expect(store().doc).toBe(remote);
    expect(store().past).toHaveLength(2);
    store().undo();
    expect(store().doc).toBe(before);
    // The earlier local step is still there behind it.
    store().undo();
    expect(store().doc).toBe(opened);
  });

  it('FE-STUDIO-ADOPT-003: keeps the selected elements that are still on the page and drops the rest', () => {
    store().setActiveSpread(1);
    store().select(['a1', 'a2']);
    const trimmed = book(
      spread('cover', 'cover'),
      spread('a', 'inner', [el('a1')]),
      spread('b', 'inner', [el('b1')]),
      spread('back', 'back')
    );
    store().adoptRemote(trimmed);
    expect(store().selection).toEqual(['a1']);
  });

  it('FE-STUDIO-ADOPT-004: a page deleted elsewhere leaves the user nearby with nothing selected', () => {
    store().setActiveSpread(2);
    store().select(['b1']);
    store().adoptRemote(book(spread('cover', 'cover'), spread('a', 'inner'), spread('back', 'back')));
    expect(store().activeSpread).toBe(2);
    expect(store().doc?.spreads[2].id).toBe('back');
    expect(store().selection).toEqual([]);
  });

  it('FE-STUDIO-ADOPT-005: clears redo, which would otherwise write an older document over the new one', () => {
    store().commit((d) => ({ ...d, title: 'edit' }));
    store().undo();
    expect(store().canRedo()).toBe(true);
    store().adoptRemote(bare());
    expect(store().canRedo()).toBe(false);
  });

  it('FE-STUDIO-ADOPT-006: the same document again changes nothing and adds no undo step', () => {
    store().adoptRemote(opened);
    expect(store().past).toHaveLength(0);
  });

  it('FE-STUDIO-ADOPT-007: with no book open yet it opens the one that arrived', () => {
    useStudioStore.setState({ doc: null, activeSpread: 3, selection: ['x'] });
    const remote = bare();
    store().adoptRemote(remote);
    expect(store().doc).toBe(remote);
    expect(store().activeSpread).toBe(0);
    expect(store().selection).toEqual([]);
    expect(store().past).toHaveLength(0);
  });

  it('FE-STUDIO-ADOPT-008: an open gesture that has not moved does not record the old document a second time', () => {
    store().beginGesture();
    store().adoptRemote(bare());
    store().endGesture();
    expect(store().past).toEqual([opened]);
  });

  it('FE-STUDIO-ADOPT-009: a save by somebody else keeps the page and selection but clears the history', () => {
    store().commit((d) => ({ ...d, title: 'local edit' }));
    store().setActiveSpread(2);
    store().select(['b1']);
    const theirs = book(
      spread('cover', 'cover'),
      spread('new', 'inner'),
      spread('a', 'inner'),
      spread('b', 'inner', [el('b1')]),
      spread('back', 'back')
    );
    store().adoptRemote(theirs, { undoable: false });

    expect(store().doc).toBe(theirs);
    expect(store().doc?.spreads[store().activeSpread].id).toBe('b');
    expect(store().selection).toEqual(['b1']);
    expect(store().canUndo()).toBe(false);
    expect(store().canRedo()).toBe(false);
  });

  it('FE-STUDIO-ADOPT-010: a gesture that already moved records where it started, not its half-finished frame', () => {
    store().beginGesture();
    store().apply((d) => ({ ...d, title: 'mid-drag' }));
    const remote = bare();
    store().adoptRemote(remote);
    expect(store().past).toEqual([opened]);

    store().endGesture();
    expect(store().past).toEqual([opened]);
    store().undo();
    expect(store().doc).toBe(opened);
  });
});
