// FE-PADDLE-REGION-LOAD-ROW-001 to 004: what a leg waiting for its water data shows (PAD-11C).
import type { PaddleRegionLoadState } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { PaddleRegionLoadRow } from './PaddleRegionLoadRow';
import { isRegionLoadPending, regionLoadFailure } from './paddleRegionLoad';

const REF = { id: 'oberpfalz', name: 'Oberpfalz' };
const t = (key: string, params?: Record<string, unknown>) => `${key}${params ? JSON.stringify(params) : ''}`;

describe('PaddleRegionLoadRow', () => {
  it('FE-PADDLE-REGION-LOAD-ROW-001: says the data loads, how far, and that the leg follows on its own', () => {
    const onDrawStraight = vi.fn();
    render(
      <PaddleRegionLoadRow
        state={{ state: 'loading', region: REF, progress: { phase: 'download', fraction: 0.45 }, ahead: 0 }}
        disabled={false}
        onDrawStraight={onDrawStraight}
      />
    );
    const row = screen.getByTestId('tour-planner-region-load');
    expect(row).toHaveTextContent('Loading the water data for Oberpfalz');
    expect(row).toHaveTextContent('Downloading 45%');
    fireEvent.click(screen.getByRole('button', { name: /Draw straight/ }));
    expect(onDrawStraight).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-REGION-LOAD-ROW-002: says a region waits for an admin, and why', () => {
    render(
      <PaddleRegionLoadRow
        state={{ state: 'requested', region: REF, reason: 'too_large' }}
        disabled={false}
        onDrawStraight={vi.fn()}
      />
    );
    const row = screen.getByTestId('tour-planner-region-load');
    expect(row).toHaveTextContent('has been requested');
    expect(row).toHaveTextContent('larger than TREK loads by itself');
  });

  it('FE-PADDLE-REGION-LOAD-ROW-003: shows the queue before the read starts, and no button once the data is there', () => {
    const { unmount } = render(
      <PaddleRegionLoadRow
        state={{ state: 'loading', region: REF, progress: null, ahead: 2 }}
        disabled={false}
        onDrawStraight={vi.fn()}
      />
    );
    expect(screen.getByTestId('tour-planner-region-load')).toHaveTextContent('Waiting for other regions');
    unmount();
    render(<PaddleRegionLoadRow state={{ state: 'ready', region: REF }} disabled={false} onDrawStraight={vi.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('region load states', () => {
  it('FE-PADDLE-REGION-LOAD-ROW-004: waits on loading and requests, and names every way the data cannot come', () => {
    const pending: PaddleRegionLoadState[] = [
      { state: 'ready', region: REF },
      { state: 'requested', region: REF, reason: 'ask' },
    ];
    for (const state of pending) expect(isRegionLoadPending(state)).toBe(true);
    expect(isRegionLoadPending(undefined)).toBe(false);
    expect(regionLoadFailure({ state: 'declined', region: REF }, t)).toBe(
      'tours.paddle.load.declined{"region":"Oberpfalz"}'
    );
    expect(regionLoadFailure({ state: 'failed', region: REF }, t)).toContain('tours.paddle.load.failed');
    expect(regionLoadFailure({ state: 'no_water', region: REF }, t)).toContain('tours.paddle.load.noWater');
    expect(regionLoadFailure({ state: 'unavailable', region: null, reason: 'no_extract' }, t)).toBe(
      'tours.paddle.load.noExtract'
    );
    expect(regionLoadFailure({ state: 'unavailable', region: null, reason: 'catalog_unavailable' }, t)).toBe(
      'tours.paddle.load.catalogUnavailable'
    );
    expect(regionLoadFailure({ state: 'unavailable', region: REF, reason: 'off' }, t)).toBeNull();
    expect(regionLoadFailure(undefined, t)).toBeNull();
  });
});
