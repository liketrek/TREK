/**
 * FE-AI-REVEAL-001 to FE-AI-REVEAL-007
 *
 * Once an answer is written, its closing words and changes come into view,
 * unless the user scrolled the thread themselves while it was written; and
 * where that end begins in an answer's blocks.
 */
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render } from '../../../tests/helpers/render';
import { type MessageBlock, tailStart } from './assistantParts';
import { tailScrollTop, useRevealAnswerTail } from './useRevealAnswerTail';

/** A viewport of 400px holding 1200px, its tail mark 900px down, scrolled to `scrollTop`. */
function lay(viewport: HTMLElement, { tailAt = 900, scrollTop = 0, height = 1200 } = {}) {
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 400 });
  Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: height });
  viewport.scrollTop = scrollTop;
  viewport.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  const tail = viewport.querySelector('[data-assistant-tail]') as HTMLElement | null;
  if (tail) tail.getBoundingClientRect = () => ({ top: 100 + tailAt - scrollTop }) as DOMRect;
}

function Thread({ running }: { running: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useRevealAnswerTail(ref, running);
  return (
    <div ref={ref} data-testid="viewport" tabIndex={0}>
      <span data-assistant-tail />
    </div>
  );
}

const block = (kind: MessageBlock['kind']) => ({ kind, key: kind }) as MessageBlock;

describe('useRevealAnswerTail', () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('FE-AI-REVEAL-001: brings the end of the answer into view once it is written', () => {
    const view = render(<Thread running />);
    lay(view.getByTestId('viewport'), { height: 2000 });
    view.rerender(<Thread running={false} />);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 888 }));
  });

  it('FE-AI-REVEAL-002: leaves the thread where the user scrolled it while the answer was written', () => {
    const view = render(<Thread running />);
    const viewport = view.getByTestId('viewport');
    lay(viewport);
    fireEvent.wheel(viewport, { deltaY: 120 });
    view.rerender(<Thread running={false} />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('FE-AI-REVEAL-003: does nothing on the first render or while nothing runs', () => {
    const view = render(<Thread running={false} />);
    lay(view.getByTestId('viewport'));
    view.rerender(<Thread running={false} />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('FE-AI-REVEAL-004: a new answer reveals its end again after an earlier one was scrolled by hand', () => {
    const view = render(<Thread running />);
    const viewport = view.getByTestId('viewport');
    lay(viewport);
    fireEvent.wheel(viewport, { deltaY: 120 });
    view.rerender(<Thread running={false} />);
    view.rerender(<Thread running />);
    view.rerender(<Thread running={false} />);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});

describe('tailScrollTop', () => {
  it('FE-AI-REVEAL-005: stops at the bottom when the end is shorter than the view, and never scrolls up', () => {
    const viewport = document.createElement('div');
    viewport.innerHTML = '<span data-assistant-tail></span>';
    lay(viewport, { tailAt: 1100 });
    expect(tailScrollTop(viewport)).toBe(800);
    lay(viewport, { tailAt: 300, scrollTop: 500 });
    expect(tailScrollTop(viewport)).toBeNull();
  });

  it('FE-AI-REVEAL-006: without a mark there is nothing to reveal', () => {
    const viewport = document.createElement('div');
    lay(viewport);
    expect(tailScrollTop(viewport)).toBeNull();
  });
});

describe('tailStart', () => {
  it('FE-AI-REVEAL-007: the end begins after the last step, strip or card', () => {
    expect(tailStart([block('steps'), block('places'), block('text'), block('change')])).toBe(2);
    expect(tailStart([block('text'), block('places')])).toBe(2);
    expect(tailStart([block('text'), block('change')])).toBe(0);
    expect(tailStart([])).toBe(0);
  });
});
