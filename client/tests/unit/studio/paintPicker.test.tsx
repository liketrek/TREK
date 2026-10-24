import { BOOK_PATTERNS, type BookPaint } from '@trek/shared';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StudioPaintPicker } from '../../../src/components/Studio/StudioPaintPicker';
import { AngleDial } from '../../../src/components/Studio/paint/AngleDial';
import { GradientStopBar } from '../../../src/components/Studio/paint/GradientStopBar';
import { RadialPad } from '../../../src/components/Studio/paint/RadialPad';
import type { PaintChannel } from '../../../src/components/Studio/paint/usePaintChannel';
import { fireEvent, render } from '../../helpers/render';

/** The value, or a failed test saying it was missing. */
function need<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value');
  return value;
}

/**
 * The paint picker, driven the way a person drives it: tabs, swatches, the
 * stop bar, the dial. What is asserted is the paint it writes and whether a
 * write is a live step inside a drag or the one that ends it.
 */

const t = (k: string, p?: Record<string, string | number>) => (p ? `${k}:${JSON.stringify(p)}` : k);

/** The picker over its own state, as the inspector holds it through the store. */
function Harness({ start, channel }: { start: BookPaint | null; channel: PaintChannel }) {
  const [value, setValue] = useState<BookPaint | null>(start);
  const write: PaintChannel = {
    live: (p) => {
      channel.live(p);
      setValue(p);
    },
    commit: (p) => {
      channel.commit(p);
      setValue(p);
    },
  };
  return <StudioPaintPicker value={value} channel={write} t={t} noneLabel="none" />;
}

const spy = () => ({ live: vi.fn(), commit: vi.fn() });
const last = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls[fn.mock.calls.length - 1]?.[0] as BookPaint | null;

/** A rect for the bar, the dial or the pad: jsdom lays nothing out. */
function sized(el: Element, box = { left: 0, top: 0, width: 200, height: 24 }) {
  el.getBoundingClientRect = () =>
    ({
      ...box,
      right: box.left + box.width,
      bottom: box.top + box.height,
      x: box.left,
      y: box.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

const tab = (c: HTMLElement, label: string) =>
  fireEvent.click(need([...c.querySelectorAll('.st-paint-tab')].find((b) => b.textContent === label)));

describe('the kind tabs', () => {
  it('marks the kind the paint is, and offers no fill under its own name', () => {
    const { container } = render(<Harness start={null} channel={spy()} />);
    const tabs = [...container.querySelectorAll('.st-paint-tab')];
    expect(tabs.map((b) => b.textContent)).toEqual([
      'none',
      'journey.studio.paint.solid',
      'journey.studio.paint.gradient',
      'journey.studio.paint.pattern',
    ]);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('keeps the colour across kinds, and brings a visited kind back as it was left', () => {
    const channel = spy();
    const { container } = render(<Harness start={{ type: 'solid', color: '#1e3a8a' }} channel={channel} />);

    tab(container, 'journey.studio.paint.pattern');
    expect(last(channel.commit)).toMatchObject({ type: 'pattern', fg: '#1e3a8a' });
    fireEvent.click(need(container.querySelector('[aria-label="journey.studio.pattern.polka"]')));
    expect(last(channel.commit)).toMatchObject({ type: 'pattern', pattern: 'polka' });

    tab(container, 'journey.studio.paint.gradient');
    expect(last(channel.commit)).toMatchObject({ type: 'linear', stops: [{ color: '#1e3a8a' }, {}] });

    tab(container, 'journey.studio.paint.pattern');
    expect(last(channel.commit)).toMatchObject({ type: 'pattern', pattern: 'polka' });

    tab(container, 'none');
    expect(last(channel.commit)).toBeNull();
    expect(channel.live).not.toHaveBeenCalled();
  });
});

describe('one colour', () => {
  it('writes the swatch picked, and its opacity live while dragged and once when let go', () => {
    const channel = spy();
    const { container } = render(<Harness start={{ type: 'solid', color: '#111111' }} channel={channel} />);
    fireEvent.click(need(container.querySelector('[aria-label="#c2410c"]')));
    expect(last(channel.commit)).toEqual({ type: 'solid', color: '#c2410c' });

    const range = container.querySelector('.st-alpha input') as HTMLInputElement;
    fireEvent.change(range, { target: { value: '40' } });
    expect(last(channel.live)).toEqual({ type: 'solid', color: '#c2410c', alpha: 0.4 });
    fireEvent.pointerUp(range);
    expect(last(channel.commit)).toEqual({ type: 'solid', color: '#c2410c', alpha: 0.4 });

    fireEvent.change(range, { target: { value: '100' } });
    fireEvent.pointerUp(range);
    expect(last(channel.commit)).toEqual({ type: 'solid', color: '#c2410c' });
  });
});

describe('a gradient', () => {
  const start: BookPaint = {
    type: 'linear',
    angle: 90,
    stops: [
      { at: 0, color: '#000000' },
      { at: 1, color: '#ffffff' },
    ],
  };

  it('adds a stop where the bar is clicked, recolours the chosen stop and takes it away', () => {
    const channel = spy();
    const { container } = render(<Harness start={start} channel={channel} />);
    const bar = need(container.querySelector('.st-stopbar'));
    sized(bar);
    fireEvent.pointerDown(bar, { button: 0, clientX: 50 });
    const added = last(channel.commit);
    expect(added?.type === 'linear' && added.stops).toHaveLength(3);
    expect(added?.type === 'linear' && added.stops[2]).toEqual({ at: 0.25, color: '#404040' });
    expect(container.querySelectorAll('.st-stop')[2].getAttribute('aria-pressed')).toBe('true');

    const stopPanel = need(container.querySelector('.st-paint-stop'));
    fireEvent.click(need(stopPanel.querySelector('[aria-label="#0f766e"]')));
    expect(last(channel.commit)).toMatchObject({ stops: [{}, {}, { at: 0.25, color: '#0f766e' }] });

    fireEvent.click(need(stopPanel.querySelector('[aria-label="journey.studio.paint.removeStop"]')));
    const removed = last(channel.commit);
    expect(removed?.type === 'linear' && removed.stops).toHaveLength(2);
    // Two stops left: the bin is off.
    expect(
      (container.querySelector('.st-paint-stop [aria-label="journey.studio.paint.removeStop"]') as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('reverses, turns radial and back, and sets the angle from the number field', () => {
    const channel = spy();
    const { container } = render(<Harness start={start} channel={channel} />);
    fireEvent.click(need(container.querySelector('[aria-label="journey.studio.paint.reverse"]')));
    expect(last(channel.commit)).toMatchObject({ stops: [{ at: 1 }, { at: 0 }] });

    const radio = (label: string) =>
      need([...container.querySelectorAll('.st-seg-item')].find((b) => b.textContent === label));
    fireEvent.click(radio('journey.studio.paint.radial'));
    expect(last(channel.commit)).toMatchObject({ type: 'radial', cx: 0.5, cy: 0.5, r: 1 });
    expect(container.querySelector('.st-radial-pad')).not.toBeNull();
    fireEvent.click(radio('journey.studio.paint.linear'));
    expect(last(channel.commit)).toMatchObject({ type: 'linear', angle: 180 });

    const field = container.querySelector('.st-num input') as HTMLInputElement;
    fireEvent.change(field, { target: { value: '400' } });
    fireEvent.blur(field);
    expect(last(channel.commit)).toMatchObject({ angle: 359 });
  });
});

describe('a pattern', () => {
  const start: BookPaint = { type: 'pattern', pattern: 'dots', fg: '#111111', bg: '#ffffff', scale: 1, angle: 0 };

  it('draws a tile for each repeat, turns stripes to the diagonal, and lets the ground go', () => {
    const channel = spy();
    const { container } = render(<Harness start={start} channel={channel} />);
    expect(container.querySelectorAll('.st-pattern-tile')).toHaveLength(BOOK_PATTERNS.length);
    expect(need(container.querySelector('.st-pattern-tile[aria-checked="true"]')).getAttribute('aria-label')).toBe(
      'journey.studio.pattern.dots'
    );

    fireEvent.click(need(container.querySelector('[aria-label="journey.studio.pattern.stripes"]')));
    expect(last(channel.commit)).toMatchObject({ pattern: 'stripes', angle: 45 });

    fireEvent.click(need(container.querySelector('[role="switch"]')));
    expect(last(channel.commit)).toMatchObject({ bg: null });
    expect(container.querySelectorAll('.st-pattern-tile.is-clear')).toHaveLength(BOOK_PATTERNS.length);
    fireEvent.click(need(container.querySelector('[role="switch"]')));
    expect(last(channel.commit)).toMatchObject({ bg: '#ffffff' });
  });

  it('sizes the repeat on an even ratio scale, live and then once', () => {
    const channel = spy();
    const { container } = render(<Harness start={start} channel={channel} />);
    const range = container.querySelector('.st-paint-slider input') as HTMLInputElement;
    // Scale 1 sits a little under halfway along 0.25 to 4.
    expect(Number(range.value)).toBe(50);
    fireEvent.change(range, { target: { value: '100' } });
    expect(last(channel.live)).toMatchObject({ scale: 4 });
    fireEvent.pointerUp(range);
    expect(last(channel.commit)).toMatchObject({ scale: 4 });
    expect(need(container.querySelector('.st-paint-value')).textContent).toBe('400%');
  });
});

describe('the dial', () => {
  it('turns with the pointer, snapping to the compass, and is one commit when let go', () => {
    const onChange = vi.fn();
    const { container } = render(<AngleDial value={0} onChange={onChange} label="Angle" />);
    const dial = need(container.querySelector('.st-dial'));
    sized(dial, { left: 0, top: 0, width: 40, height: 40 });
    fireEvent.pointerDown(dial, { button: 0, clientX: 40, clientY: 20 });
    expect(onChange).toHaveBeenLastCalledWith(90, false);
    fireEvent.pointerMove(dial, { clientX: 20, clientY: 40 });
    expect(onChange).toHaveBeenLastCalledWith(180, false);
    fireEvent.pointerUp(dial);
    expect(onChange).toHaveBeenLastCalledWith(180, true);
    fireEvent.pointerMove(dial, { clientX: 0, clientY: 20 });
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('takes the arrow keys, Shift for fifteen at a time', () => {
    const onChange = vi.fn();
    const { container } = render(<AngleDial value={350} onChange={onChange} label="Angle" />);
    const dial = need(container.querySelector('.st-dial'));
    expect(dial.getAttribute('aria-valuenow')).toBe('350');
    fireEvent.keyDown(dial, { key: 'ArrowRight', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(5, false);
    fireEvent.keyUp(dial, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(5, true);
    fireEvent.keyDown(dial, { key: 'a' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('the stop bar', () => {
  const paint: BookPaint & { type: 'linear' } = {
    type: 'linear',
    angle: 0,
    stops: [
      { at: 0, color: '#000000' },
      { at: 0.5, color: '#888888' },
      { at: 1, color: '#ffffff' },
    ],
  };
  const labels = { bar: 'bar', stop: (pos: number) => `stop ${pos}` };

  it('drags a stop along the bar live, and pulls it off to remove it', () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(
      <GradientStopBar paint={paint} selected={0} onSelect={onSelect} onChange={onChange} labels={labels} />
    );
    sized(need(container.querySelector('.st-stopbar')));
    const stop = container.querySelectorAll('.st-stop')[1];
    fireEvent.pointerDown(stop, { button: 0, clientX: 100 });
    expect(onSelect).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(stop, { clientX: 150, clientY: 10 });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ stops: [paint.stops[0], { at: 0.75, color: '#888888' }, paint.stops[2]] }),
      false
    );
    fireEvent.pointerMove(stop, { clientX: 150, clientY: 90 });
    expect(stop.className).toContain('is-leaving');
    fireEvent.pointerUp(stop);
    const removed = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(removed[1]).toBe(true);
    expect(removed[0].stops).toHaveLength(2);
  });

  it('moves the stop with the arrow keys and removes it with Delete', () => {
    const onChange = vi.fn();
    const { container } = render(
      <GradientStopBar paint={paint} selected={1} onSelect={() => {}} onChange={onChange} labels={labels} />
    );
    const stop = container.querySelectorAll('.st-stop')[1];
    expect(stop.getAttribute('aria-label')).toBe('stop 50');
    fireEvent.keyDown(stop, { key: 'ArrowLeft', shiftKey: true });
    expect(onChange.mock.calls[0][0].stops[1].at).toBe(0.4);
    fireEvent.keyDown(stop, { key: 'Delete' });
    expect(onChange.mock.calls[1][0].stops).toHaveLength(2);
    fireEvent.keyDown(stop, { key: 'x' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not add a stop past six, or when the click lands on a stop', () => {
    const onChange = vi.fn();
    const six = { ...paint, stops: [0, 0.2, 0.4, 0.6, 0.8, 1].map((at) => ({ at, color: '#000000' })) };
    const { container } = render(
      <GradientStopBar paint={six} selected={0} onSelect={() => {}} onChange={onChange} labels={labels} />
    );
    const bar = need(container.querySelector('.st-stopbar'));
    sized(bar);
    fireEvent.pointerDown(bar, { button: 0, clientX: 30 });
    fireEvent.pointerDown(need(container.querySelector('.st-stop')), { button: 0, clientX: 0 });
    fireEvent.pointerUp(need(container.querySelector('.st-stop')));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('the radial centre', () => {
  it('moves the centre with the pointer and the keys', () => {
    const onChange = vi.fn();
    const radial = {
      type: 'radial' as const,
      cx: 0.5,
      cy: 0.5,
      r: 1,
      stops: [
        { at: 0, color: '#ffffff' },
        { at: 1, color: '#000000' },
      ],
    };
    const { container } = render(<RadialPad paint={radial} onChange={onChange} label="Centre" />);
    const pad = need(container.querySelector('.st-radial-pad'));
    sized(pad, { left: 0, top: 0, width: 100, height: 50 });
    fireEvent.pointerDown(pad, { button: 0, clientX: 25, clientY: 10 });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ cx: 0.25, cy: 0.2 }), false);
    fireEvent.pointerMove(pad, { clientX: 200, clientY: -5 });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ cx: 1, cy: 0 }), false);
    fireEvent.pointerUp(pad);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ cx: 1, cy: 0 }), true);
    fireEvent.keyDown(pad, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ cx: 0.5, cy: 0.52 }), true);
  });
});
