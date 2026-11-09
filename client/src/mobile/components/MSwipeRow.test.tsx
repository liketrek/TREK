import { Check, Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import MSwipeRow from './MSwipeRow';

vi.mock('../../native/haptics', () => ({ tickHaptic: vi.fn() }));

/** jsdom has no Touch to build a TouchEvent from: an Event with the touches set on it, as MEdgeBack's test does. */
function touch(el: Element, type: 'touchstart' | 'touchmove' | 'touchend', x = 0, y = 100) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }] });
  act(() => {
    el.dispatchEvent(e);
  });
}

function setup() {
  const onDelete = vi.fn();
  const onDone = vi.fn();
  const onRowClick = vi.fn();
  render(
    <MSwipeRow
      leading={{ label: 'Done', icon: Check, tone: 'accent', onAction: onDone }}
      trailing={[{ label: 'Delete', icon: Trash2, tone: 'danger', onAction: onDelete }]}
    >
      <button type="button" onClick={onRowClick}>
        Sunscreen
      </button>
    </MSwipeRow>
  );
  const row = screen.getByText('Sunscreen').closest('div')?.parentElement as HTMLElement;
  return { row, onDelete, onDone, onRowClick };
}

describe('MSwipeRow', () => {
  it('FE-MOB-SWIPE-001: shows no action buttons until the row is swiped', () => {
    setup();
    expect(screen.queryByText('Delete')).toBeNull();
    expect(screen.queryByText('Done')).toBeNull();
  });

  it('FE-MOB-SWIPE-002: a swipe towards the start opens the trailing action, a tap on it runs it', () => {
    const { row, onDelete } = setup();
    touch(row, 'touchstart', 200);
    touch(row, 'touchmove', 160);
    touch(row, 'touchmove', 120);
    touch(row, 'touchend');
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('FE-MOB-SWIPE-003: a mostly vertical drag is a scroll and opens nothing', () => {
    const { row } = setup();
    touch(row, 'touchstart', 200, 100);
    touch(row, 'touchmove', 190, 160);
    touch(row, 'touchend');
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('FE-MOB-SWIPE-004: a tap on an open row closes it instead of opening the row', () => {
    const { row, onRowClick } = setup();
    touch(row, 'touchstart', 200);
    touch(row, 'touchmove', 160);
    touch(row, 'touchmove', 120);
    touch(row, 'touchend');
    fireEvent.click(screen.getByText('Sunscreen'));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('FE-MOB-SWIPE-005: a swipe that starts at the screen edge is left to the back gesture', () => {
    const { row } = setup();
    touch(row, 'touchstart', 10);
    touch(row, 'touchmove', 120);
    touch(row, 'touchend');
    expect(screen.queryByText('Done')).toBeNull();
  });

  it('FE-MOB-SWIPE-006: swiped through past most of the row, the first action runs at once', () => {
    const { row, onDelete } = setup();
    row.getBoundingClientRect = () => ({
      width: 360,
      height: 48,
      top: 0,
      left: 0,
      right: 360,
      bottom: 48,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    touch(row, 'touchstart', 330);
    touch(row, 'touchmove', 300);
    touch(row, 'touchmove', 60);
    touch(row, 'touchend');
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
