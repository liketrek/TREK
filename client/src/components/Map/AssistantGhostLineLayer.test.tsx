/**
 * FE-MAP-ROUTE-001 to FE-MAP-ROUTE-004
 *
 * The chat's routes on the Leaflet map: a rim under each line and nothing
 * but an invisible fat line taking the pointer; dashes for a way not chosen,
 * faint for the way a change replaces; the hard grades over the line, a disc
 * at the start and a ring at the end; the named stops only while lit; and
 * the pointer onto, along and off a line reported by its key; a line that
 * lights up brought to the front. What Leaflet makes of the options is
 * Leaflet's: the paths come back as data here.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode, Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { AssistantRouteLine } from '../../types/assistantMap';
import { AssistantGhostLineLayer } from './AssistantGhostLineLayer';

type Handlers = Record<string, ((event?: unknown) => void) | undefined>;

const bringToFront = vi.hoisted(() => vi.fn());

vi.mock('react-leaflet', async () => {
  const { useImperativeHandle } = await vi.importActual<typeof import('react')>('react');
  return {
    FeatureGroup: ({ children, ref }: { children?: ReactNode; ref?: Ref<{ bringToFront: () => void }> }) => {
      useImperativeHandle(ref, () => ({ bringToFront }));
      return <div data-testid="group">{children}</div>;
    },
    Polyline: ({
      positions,
      pathOptions,
      interactive,
      eventHandlers,
    }: {
      positions: unknown;
      pathOptions?: Record<string, unknown>;
      interactive?: boolean;
      eventHandlers?: Handlers;
    }) => (
      <div
        data-testid="polyline"
        data-points={JSON.stringify(positions)}
        data-color={String(pathOptions?.color ?? '')}
        data-weight={String(pathOptions?.weight ?? '')}
        data-opacity={String(pathOptions?.opacity ?? '')}
        data-dash={String(pathOptions?.dashArray ?? '')}
        data-dash-named={String(pathOptions ? 'dashArray' in pathOptions : false)}
        data-interactive={String(interactive)}
        onMouseEnter={() => eventHandlers?.mouseover?.()}
        onMouseLeave={() => eventHandlers?.mouseout?.()}
        onMouseMove={() => eventHandlers?.mousemove?.({ latlng: { lat: 47.78, lng: 12.6 } })}
        onClick={() => eventHandlers?.click?.({ latlng: { lat: 47.79, lng: 12.61 } })}
      />
    ),
    CircleMarker: ({
      center,
      pathOptions,
      children,
    }: {
      center: [number, number];
      pathOptions?: Record<string, unknown>;
      children?: ReactNode;
    }) => (
      <div data-testid="disc" data-center={JSON.stringify(center)} data-fill={String(pathOptions?.fillColor ?? '')}>
        {children}
      </div>
    ),
    Tooltip: ({ children }: { children?: ReactNode }) => <span data-testid="stop-name">{children}</span>,
  };
});

const LINE: AssistantRouteLine = {
  id: 'c1:look:route',
  ref: 'c1',
  lines: [
    [
      [47.77, 12.59],
      [47.78, 12.6],
      [47.79, 12.62],
    ],
  ],
  color: '#0a84ff',
  casing: '#ffffff',
  ends: { start: [47.77, 12.59], end: [47.79, 12.62] },
  stops: [{ lat: 47.78, lng: 12.6, label: 'Strausshütte' }],
  tints: [
    {
      line: [
        [47.78, 12.6],
        [47.79, 12.62],
      ],
      color: '#7c3aed',
    },
  ],
};

const paths = () => screen.queryAllByTestId('polyline');
/** What a path was asked for, as plain data. */
const asked = (el: HTMLElement | undefined) => ({ ...el?.dataset });

describe('AssistantGhostLineLayer', () => {
  it('FE-MAP-ROUTE-001: a rim, the line, its hard grade and its ends; only the invisible line takes the pointer', () => {
    render(<AssistantGhostLineLayer lines={[LINE]} />);
    const [rim, core, grade, hit] = paths();
    expect(asked(rim)).toMatchObject({ color: '#ffffff', weight: '7', interactive: 'false' });
    expect(asked(core)).toMatchObject({ color: '#0a84ff', weight: '4', dash: '', interactive: 'false' });
    expect(asked(grade)).toMatchObject({ color: '#7c3aed', interactive: 'false' });
    expect(asked(hit)).toMatchObject({ weight: '16', opacity: '0', interactive: 'undefined' });
    const discs = screen.getAllByTestId('disc');
    expect(discs.map((disc) => disc.dataset.fill)).toEqual(['#0a84ff', '#ffffff']);
    // The stops show only while the line is lit.
    expect(screen.queryByTestId('stop-name')).not.toBeInTheDocument();
  });

  it('FE-MAP-ROUTE-002: dashed, faint, a loop with one disc, and the lit line with its named stops', () => {
    const loop: AssistantRouteLine = { ...LINE, dashed: true, dim: true, ends: { start: [47.77, 12.59], end: null } };
    const { rerender } = render(<AssistantGhostLineLayer lines={[loop]} />);
    expect(asked(paths()[1])).toMatchObject({ dash: '6 7', opacity: '0.45' });
    expect(screen.getAllByTestId('disc')).toHaveLength(1);

    rerender(<AssistantGhostLineLayer lines={[{ ...LINE, hot: true }]} />);
    expect(screen.getByTestId('stop-name')).toHaveTextContent('Strausshütte');

    rerender(<AssistantGhostLineLayer lines={[]} />);
    expect(paths()).toHaveLength(0);
  });

  it('FE-MAP-ROUTE-003: the pointer onto, along and off a line, and a tap on it, report its key and where', () => {
    const onHover = vi.fn();
    const onPoint = vi.fn();
    render(<AssistantGhostLineLayer lines={[LINE]} onHover={onHover} onPoint={onPoint} />);
    const hit = paths()[3] as HTMLElement;
    fireEvent.mouseEnter(hit);
    fireEvent.mouseMove(hit);
    fireEvent.click(hit);
    fireEvent.mouseLeave(hit);
    expect(onHover.mock.calls).toEqual([['c1'], [null]]);
    expect(onPoint.mock.calls).toEqual([
      ['c1', 47.78, 12.6],
      ['c1', 47.79, 12.61],
    ]);
  });

  it('FE-MAP-ROUTE-004: a dashed way that lights up loses its dashes and comes to the front; a calm one stays put', () => {
    bringToFront.mockClear();
    const way: AssistantRouteLine = { ...LINE, dashed: true };
    const other: AssistantRouteLine = { ...LINE, id: 'c2:look:route', ref: 'c2' };
    const { rerender } = render(<AssistantGhostLineLayer lines={[way, other]} />);
    expect(asked(paths()[1])).toMatchObject({ dash: '6 7' });
    expect(bringToFront).not.toHaveBeenCalled();

    // The same line, now lit, which the route model draws solid: its dash is asked away by name,
    // so Leaflet's merged style drops it.
    rerender(<AssistantGhostLineLayer lines={[other, { ...way, dashed: false, hot: true }]} />);
    const lit = screen.getAllByTestId('group')[1];
    const core = lit?.querySelectorAll<HTMLElement>('[data-testid="polyline"]')[1];
    expect(asked(core)).toMatchObject({ dash: '', dashNamed: 'true' });
    expect(bringToFront).toHaveBeenCalledTimes(1);
  });
});
