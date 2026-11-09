import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import { pressHaptic } from '../../native/haptics';
import { useLongPress } from './useLongPress';

vi.mock('../../native/haptics', () => ({ pressHaptic: vi.fn() }));

function Card({ onLongPress, onClick }: { onLongPress: () => void; onClick: () => void }) {
  const press = useLongPress(onLongPress);
  return (
    <div {...press} role="button" tabIndex={0} onClick={onClick}>
      Lisbon
    </div>
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** jsdom has no Touch to build a TouchEvent from: an Event with the touches set on it, as MEdgeBack's test does. */
function touch(el: Element, type: 'touchstart' | 'touchmove' | 'touchend', x = 50, y = 50) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }] });
  act(() => {
    el.dispatchEvent(e);
  });
}

function setup() {
  const onLongPress = vi.fn();
  const onClick = vi.fn();
  render(<Card onLongPress={onLongPress} onClick={onClick} />);
  return { card: screen.getByRole('button'), onLongPress, onClick };
}

describe('useLongPress', () => {
  it('FE-MOB-LONGPRESS-001: a held finger lifts the card, bumps and opens the menu, and the tap that ends it opens nothing', () => {
    const { card, onLongPress, onClick } = setup();
    touch(card, 'touchstart');
    act(() => vi.advanceTimersByTime(200));
    expect(card.hasAttribute('data-pressing')).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    expect(onLongPress).toHaveBeenCalledOnce();
    expect(pressHaptic).toHaveBeenCalled();
    expect(card.hasAttribute('data-pressing')).toBe(false);
    touch(card, 'touchend');
    fireEvent.click(card);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('FE-MOB-LONGPRESS-002: a finger that moves is scrolling and cancels it', () => {
    const { card, onLongPress } = setup();
    touch(card, 'touchstart');
    touch(card, 'touchmove', 50, 80);
    act(() => vi.advanceTimersByTime(600));
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('FE-MOB-LONGPRESS-003: a short tap is a tap', () => {
    const { card, onLongPress, onClick } = setup();
    touch(card, 'touchstart');
    act(() => vi.advanceTimersByTime(100));
    touch(card, 'touchend');
    fireEvent.click(card);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("FE-MOB-LONGPRESS-004: Android's contextmenu counts as the long press", () => {
    const { card, onLongPress } = setup();
    fireEvent.contextMenu(card);
    expect(onLongPress).toHaveBeenCalledOnce();
  });
});
