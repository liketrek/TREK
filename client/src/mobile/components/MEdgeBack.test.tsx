import { render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tickHaptic } from '../../native/haptics';
import { closeTopOverlay, hasOpenOverlay } from '../overlayStack';
import MEdgeBack from './MEdgeBack';

vi.mock('../overlayStack', () => ({ closeTopOverlay: vi.fn(), hasOpenOverlay: vi.fn(() => false) }));
vi.mock('../../native/haptics', () => ({ tickHaptic: vi.fn() }));

function Host({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={ref} data-testid="page" />
      <MEdgeBack target={ref} enabled={enabled} />
    </>
  );
}

function touch(type: string, x: number, y = 300, t = 0) {
  const e = new Event(type, { bubbles: true, cancelable: true }) as Event & Record<string, unknown>;
  Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }] });
  Object.defineProperty(e, 'changedTouches', { value: [{ clientX: x, clientY: y }] });
  Object.defineProperty(e, 'timeStamp', { value: t });
  document.dispatchEvent(e);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(hasOpenOverlay).mockReturnValue(false);
  window.history.replaceState({ idx: 2 }, '');
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('MEdgeBack', () => {
  it('drags the page with a finger from the left edge, and goes back past a third', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { getByTestId } = render(<Host />);
    touch('touchstart', 5, 300, 0);
    touch('touchmove', 40, 302, 50);
    touch('touchmove', 200, 304, 400);
    expect(getByTestId('page').style.transform).toBe('translateX(195px)');
    touch('touchend', 200, 304, 900);
    vi.advanceTimersByTime(250);
    expect(back).toHaveBeenCalledTimes(1);
    expect(tickHaptic).toHaveBeenCalled();
  });

  it('springs back on a short, slow drag', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { getByTestId } = render(<Host />);
    touch('touchstart', 5, 300, 0);
    touch('touchmove', 30, 300, 200);
    touch('touchmove', 60, 300, 800);
    touch('touchend', 60, 300, 1600);
    vi.advanceTimersByTime(300);
    expect(back).not.toHaveBeenCalled();
    expect(getByTestId('page').style.transform).toBe('');
  });

  it('closes an open sheet first and leaves the page where it is', () => {
    vi.mocked(hasOpenOverlay).mockReturnValue(true);
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { getByTestId } = render(<Host />);
    touch('touchstart', 5, 300, 0);
    touch('touchmove', 200, 300, 100);
    expect(getByTestId('page').style.transform).toBe('');
    touch('touchend', 200, 300, 200);
    expect(closeTopOverlay).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
  });

  it('ignores a touch away from the edge, a vertical scroll, the first page and a binary without the feature', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { unmount } = render(<Host />);
    touch('touchstart', 120);
    touch('touchmove', 300);
    touch('touchend', 300, 300, 100);
    touch('touchstart', 5, 300);
    touch('touchmove', 8, 400);
    touch('touchend', 8, 400, 100);
    window.history.replaceState({ idx: 0 }, '');
    touch('touchstart', 5);
    touch('touchmove', 300);
    touch('touchend', 300, 300, 100);
    unmount();
    window.history.replaceState({ idx: 2 }, '');
    render(<Host enabled={false} />);
    touch('touchstart', 5);
    touch('touchmove', 300);
    touch('touchend', 300, 300, 100);
    vi.advanceTimersByTime(300);
    expect(back).not.toHaveBeenCalled();
  });
});
