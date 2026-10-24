import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTourUndoShortcut } from './useTourUndoShortcut';

function setup(overrides: Partial<Parameters<typeof useTourUndoShortcut>[0]> = {}) {
  const undo = vi.fn();
  const redo = vi.fn();
  renderHook(() => useTourUndoShortcut({ enabled: true, canUndo: true, canRedo: true, undo, redo, ...overrides }));
  return { undo, redo };
}

describe('useTourUndoShortcut', () => {
  it('undoes on Ctrl+Z and Cmd+Z, redoes on Ctrl+Shift+Z and Ctrl+Y', () => {
    const { undo, redo } = setup();
    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'z', metaKey: true });
    expect(undo).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(document.body, { key: 'Z', ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(redo).toHaveBeenCalledTimes(2);
  });

  it('leaves a text field its own history', () => {
    const { undo } = setup();
    const input = document.createElement('input');
    document.body.append(input);
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
    input.remove();
    expect(undo).not.toHaveBeenCalled();
  });

  it('does nothing when closed, locked or without a step to take', () => {
    const closed = setup({ enabled: false });
    const empty = setup({ canUndo: false, canRedo: false });
    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(closed.undo).not.toHaveBeenCalled();
    expect(empty.undo).not.toHaveBeenCalled();
    expect(empty.redo).not.toHaveBeenCalled();
  });
});
