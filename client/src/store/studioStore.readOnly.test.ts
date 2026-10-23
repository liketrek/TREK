/**
 * FE-STUDIO-READONLY-001 to FE-STUDIO-READONLY-002
 *
 * A book held as it is (one a newer Studio saved): every edit, undo and redo
 * is refused while it holds, and a version from elsewhere is still taken, so
 * the page on screen stays current.
 */
import { blankBook, type BookDocument } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useStudioStore } from './studioStore';

const STUDIO = useStudioStore.getState();

function book(title = 'Lisbon'): BookDocument {
  let seq = 0;
  return blankBook({ title, newId: (prefix) => `${prefix}-${++seq}` });
}

beforeEach(() => {
  useStudioStore.setState({ ...STUDIO, doc: null, past: [], future: [], readOnly: false });
});

afterEach(() => {
  useStudioStore.getState().setReadOnly(false);
});

describe('a book held as it is', () => {
  it('FE-STUDIO-READONLY-001: refuses edits, undo and redo while held, and takes them again once let go', () => {
    const store = useStudioStore.getState();
    store.load(book());
    store.commit((d) => ({ ...d, title: 'one' }));
    const edited = useStudioStore.getState().doc;

    store.setReadOnly(true);
    store.commit((d) => ({ ...d, title: 'two' }));
    store.apply((d) => ({ ...d, title: 'three' }));
    store.undo();
    expect(useStudioStore.getState().doc).toBe(edited);
    expect(useStudioStore.getState().canUndo()).toBe(false);

    store.setReadOnly(false);
    expect(useStudioStore.getState().canUndo()).toBe(true);
    store.undo();
    expect(useStudioStore.getState().doc?.title).toBe('Lisbon');
    expect(useStudioStore.getState().canRedo()).toBe(true);
  });

  it('FE-STUDIO-READONLY-002: still takes a version saved elsewhere, so the page shown stays current', () => {
    const store = useStudioStore.getState();
    store.load(book());
    store.setReadOnly(true);
    const theirs = book('Porto');
    store.adoptRemote(theirs, { undoable: false });
    expect(useStudioStore.getState().doc).toBe(theirs);
    store.load(book('Faro'));
    expect(useStudioStore.getState().doc?.title).toBe('Faro');
  });
});
