import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMeasuredHeight, useReportedHeight } from './useReportedHeight';

function Card({ onHeight, open = true }: { onHeight?: (height: number) => void; open?: boolean }) {
  const ref = useReportedHeight(onHeight);
  return open ? <div ref={ref}>card</div> : null;
}

const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
afterEach(() => {
  if (original) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original);
  vi.unstubAllGlobals();
});

describe('useReportedHeight', () => {
  it('REPORTED-HEIGHT-001: reports the height on mount and 0 once the element is gone', () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 412 });
    const onHeight = vi.fn();
    const { rerender } = render(<Card onHeight={onHeight} />);
    expect(onHeight).toHaveBeenLastCalledWith(412);

    rerender(<Card onHeight={onHeight} open={false} />);
    expect(onHeight).toHaveBeenLastCalledWith(0);
  });

  it('REPORTED-HEIGHT-002: reports again whenever the element resizes', () => {
    let height = 300;
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => height });
    const observed: { resize?: () => void } = {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          observed.resize = cb;
        }
        observe() {}
        disconnect = disconnect;
      }
    );
    const onHeight = vi.fn();
    const { unmount } = render(<Card onHeight={onHeight} />);
    height = 820;
    expect(observed.resize).toBeTypeOf('function');
    observed.resize?.();
    expect(onHeight).toHaveBeenLastCalledWith(820);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('REPORTED-HEIGHT-003: does nothing without a listener', () => {
    expect(() => render(<Card />)).not.toThrow();
  });
});

describe('useMeasuredHeight', () => {
  it('REPORTED-HEIGHT-004: holds the measured height as state', () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 512 });
    function Probe() {
      const { height, measure } = useMeasuredHeight();
      return <div ref={measure} data-height={height} />;
    }
    const { container } = render(<Probe />);
    expect(container.firstElementChild?.getAttribute('data-height')).toBe('512');
  });
});
