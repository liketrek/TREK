import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import type { FacetRow } from './hikeFacets';
import { HikeWaysCard } from './HikeWaysCard';
import type { HikeWays } from './useHikeWays';

const hook = vi.hoisted(() => ({ ways: null as unknown, input: null as unknown }));
vi.mock('./useHikeWays', () => ({
  useHikeWays: (input: unknown) => {
    hook.input = input;
    return hook.ways;
  },
}));

// FE-HIKE-WAYSCARD-001 to FE-HIKE-WAYSCARD-013

const LINE: [number, number][] = [
  [47.0, 11.0],
  [47.01, 11.0],
];
const SAC_ROWS: FacetRow[] = [
  { key: 't2', lengthM: 1200, share: 0.4, tags: ['mountain_hiking'] },
  { key: 't4', lengthM: 600, share: 0.2, tags: ['alpine_hiking'] },
  { key: 'untagged', lengthM: 700, share: 0.2, tags: [] },
  { key: 'unclear', lengthM: 300, share: 0.1, tags: ['T3', 'hiking;mountain_hiking'] },
  { key: 'unmatched', lengthM: 100, share: 0.05, tags: [] },
  { key: 'unasked', lengthM: 100, share: 0.05, tags: [] },
];
const SURFACE_ROWS: FacetRow[] = [
  { key: 'gravel', lengthM: 1500, share: 0.5, tags: ['gravel', 'pebblestone'] },
  { key: 'rock', lengthM: 600, share: 0.2, tags: ['rock'] },
  { key: 'untagged', lengthM: 600, share: 0.2, tags: [] },
  { key: 'unclear', lengthM: 300, share: 0.1, tags: ['gravel;ground'] },
];
const WAY_ROWS: FacetRow[] = [
  { key: 'path', lengthM: 2000, share: 0.7, tags: ['path'] },
  { key: 'track', lengthM: 900, share: 0.3, tags: ['track'] },
];

function ways(overrides: Partial<HikeWays> = {}): HikeWays {
  return {
    available: true,
    shown: true,
    toggle: vi.fn(),
    facet: 'sac',
    chooseFacet: vi.fn(),
    status: 'ready',
    rows: SAC_ROWS,
    knownShare: 0.6,
    mostly: SAC_ROWS[0],
    highest: 4,
    focus: null,
    focusOn: vi.fn(),
    retry: vi.fn(),
    routeWays: null,
    ...overrides,
  };
}

function show(state: HikeWays, routingLimit: number | null = 3) {
  hook.ways = state;
  return render(<HikeWaysCard tripId={4} route={LINE} routingLimit={routingLimit} />);
}

async function tooltipOf(testId: string, text: string | RegExp) {
  fireEvent.mouseEnter(screen.getByTestId(testId));
  expect(await screen.findByText(text)).toBeInTheDocument();
  fireEvent.mouseLeave(screen.getByTestId(testId));
}

beforeEach(() => localStorage.clear());

describe('HikeWaysCard (MAP-03, MAP-04)', () => {
  it('FE-HIKE-WAYSCARD-001: without a line to describe there is no card', () => {
    show(ways({ available: false, shown: false, status: 'off', rows: [] }));
    expect(screen.queryByTestId('hike-ways-card')).toBeNull();
    expect(hook.input).toEqual({ tripId: 4, route: LINE, current: true, matching: 'foot' });
  });

  it('FE-HIKE-WAYSCARD-002: switched off it only offers the switch, and the switch turns it on', () => {
    const state = ways({ shown: false, status: 'off', rows: [] });
    show(state);
    const toggle = screen.getByRole('button', { name: 'Show along the route' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('group', { name: 'What to show' })).toBeNull();
    expect(screen.queryByTestId('sac-row-t2')).toBeNull();
    fireEvent.click(toggle);
    expect(state.toggle).toHaveBeenCalledTimes(1);
  });

  it('FE-HIKE-WAYSCARD-003: switched on it offers the SAC grade, the surface and the kind of way apart', () => {
    const state = ways();
    show(state);
    const facets = screen.getByRole('group', { name: 'What to show' });
    expect(within(facets).getByRole('button', { name: 'SAC' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(facets).getByRole('button', { name: 'Surface' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(within(facets).getByRole('button', { name: 'Way type' }));
    expect(state.chooseFacet).toHaveBeenCalledWith('way');
  });

  it('FE-HIKE-WAYSCARD-004: lists the known steps with their share, the unknown apart, and the routing limit as a setting', () => {
    show(ways());
    expect(within(screen.getByTestId('sac-row-t2')).getByText('T2')).toBeInTheDocument();
    expect(screen.getByTestId('sac-row-t2')).toHaveTextContent('Mountain hiking');
    expect(screen.getByTestId('sac-row-t2')).toHaveTextContent('40 %');
    expect(within(screen.getByTestId('sac-row-untagged')).getByText('?')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByTestId('sac-known')).toHaveTextContent('60 %');
    expect(screen.getByTestId('sac-highest')).toHaveTextContent('T4');
    expect(screen.queryByTestId('sac-mostly')).toBeNull();
    expect(screen.getByTestId('sac-routing-limit')).toHaveTextContent('Routing limit');
    expect(screen.getByTestId('sac-routing-limit')).toHaveTextContent('T3');
    // Only a known step above the limit says so; the unknown never does.
    expect(within(screen.getByTestId('sac-row-t4')).getByText('Above the limit')).toBeInTheDocument();
    expect(within(screen.getByTestId('sac-row-t2')).queryByText('Above the limit')).toBeNull();
    expect(within(screen.getByTestId('sac-row-untagged')).queryByText('Above the limit')).toBeNull();
  });

  it('FE-HIKE-WAYSCARD-005: an import, planned without a routing limit, shows none and nothing above it', () => {
    show(ways({ highest: null, rows: SAC_ROWS.slice(2), knownShare: 0, mostly: null }), null);
    expect(screen.queryByTestId('sac-routing-limit')).toBeNull();
    expect(screen.queryByTestId('sac-highest')).toBeNull();
    expect(screen.queryByText('Above the limit')).toBeNull();
    expect(screen.getByTestId('sac-known')).toHaveTextContent('0 %');
  });

  it('FE-HIKE-WAYSCARD-006: a row draws its class alone on the map, and shows that it does', () => {
    const state = ways({ focus: 't4' });
    show(state);
    expect(screen.getByTestId('sac-row-t4')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('sac-row-t2')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByTestId('sac-row-t2'));
    expect(state.focusOn).toHaveBeenCalledWith('t2');
  });

  it('FE-HIKE-WAYSCARD-007: says when it is asking, offline, or failed with a way to ask again', () => {
    const loading = show(ways({ status: 'loading', rows: [] }));
    expect(screen.getByRole('status')).toHaveTextContent('Reading the ways along the hike');
    loading.unmount();
    const offline = show(ways({ status: 'offline', rows: [] }));
    expect(screen.getByText('The trail details need a connection.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
    offline.unmount();
    const state = ways({ status: 'failed', rows: [] });
    show(state);
    expect(screen.getByText(/The tour is unchanged/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(state.retry).toHaveBeenCalledTimes(1);
  });

  it('FE-HIKE-WAYSCARD-008: an SAC row names its scale and its source, an unclear one what OpenStreetMap wrote', async () => {
    show(ways());
    await tooltipOf('sac-row-t2', 'SAC hiking scale T2, from OpenStreetMap: sac_scale=mountain_hiking');
    await tooltipOf('sac-row-unclear', /T3, hiking;mountain_hiking/);
    await tooltipOf('sac-row-untagged', /Unknown does not mean easy/);
    await tooltipOf('sac-row-unmatched', /no way lies clearly under the line/i);
    expect(screen.getByTestId('sac-row-unasked')).toHaveTextContent('Could not be asked this time');
    await tooltipOf('sac-row-unasked', /could not be asked about these ways this time/);
  });

  it('FE-HIKE-WAYSCARD-009: the surfaces list their groups, the most common one, and no grade or routing limit', () => {
    show(ways({ facet: 'surface', rows: SURFACE_ROWS, knownShare: 0.7, mostly: SURFACE_ROWS[0], highest: null }));
    expect(screen.getByTestId('surface-row-gravel')).toHaveTextContent('Gravel');
    expect(screen.getByTestId('surface-row-gravel')).toHaveTextContent('50 %');
    // A known group carries its colour only; the question mark is the unknown's.
    expect(within(screen.getByTestId('surface-row-gravel')).queryByText('?')).toBeNull();
    expect(within(screen.getByTestId('surface-row-untagged')).getByText('?')).toBeInTheDocument();
    expect(screen.getByTestId('surface-row-untagged')).toHaveTextContent('No surface in OpenStreetMap');
    expect(screen.getByTestId('surface-known')).toHaveTextContent('70 %');
    expect(screen.getByTestId('surface-mostly')).toHaveTextContent('Gravel');
    expect(screen.queryByTestId('sac-routing-limit')).toBeNull();
    expect(screen.queryByTestId('sac-highest')).toBeNull();
    expect(screen.queryByText('Above the limit')).toBeNull();
    expect(screen.getByText(/router's own reading is not used/)).toBeInTheDocument();
  });

  it('FE-HIKE-WAYSCARD-010: a surface row names the values OpenStreetMap recorded, the untagged one that nothing was', async () => {
    show(ways({ facet: 'surface', rows: SURFACE_ROWS, knownShare: 0.7, mostly: SURFACE_ROWS[0], highest: null }));
    await tooltipOf('surface-row-gravel', 'Recorded in OpenStreetMap as surface=gravel, surface=pebblestone');
    await tooltipOf('surface-row-unclear', /surface=gravel;ground/);
    await tooltipOf('surface-row-untagged', /A router may assume one/);
  });

  it('FE-HIKE-WAYSCARD-011: the kinds of way read under their own names and source', async () => {
    const state = ways({ facet: 'way', rows: WAY_ROWS, knownShare: 1, mostly: WAY_ROWS[0], highest: null });
    show(state);
    expect(screen.getByTestId('way-row-track')).toHaveTextContent('Farm or forest track');
    expect(screen.getByTestId('way-mostly')).toHaveTextContent('Path');
    expect(screen.queryByText('Unknown')).toBeNull();
    await tooltipOf('way-row-path', 'Recorded in OpenStreetMap as highway=path');
    fireEvent.click(screen.getByTestId('way-row-track'));
    expect(state.focusOn).toHaveBeenCalledWith('track');
  });

  it('FE-HIKE-WAYSCARD-012: ways that could not be asked this time may be asked again from the list, and only then', () => {
    const state = ways();
    const partial = show(state);
    const unknown = screen.getByText('Unknown').parentElement as HTMLElement;
    fireEvent.click(within(unknown).getByRole('button', { name: /try again/i }));
    expect(state.retry).toHaveBeenCalledTimes(1);
    partial.unmount();
    show(ways({ rows: SAC_ROWS.filter((row) => row.key !== 'unasked') }));
    expect(screen.getByTestId('sac-row-unmatched')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
  });

  it('FE-HIKE-WAYSCARD-013: a run asks for its ways matched as a run and puts its own badges in the head (RUN-02)', () => {
    hook.ways = ways();
    render(
      <HikeWaysCard
        tripId={4}
        route={LINE}
        routingLimit={null}
        matching="run"
        aside={(state) => <span data-testid="run-aside">{state.facet}</span>}
      />
    );
    expect(hook.input).toMatchObject({ tripId: 4, route: LINE, matching: 'run' });
    expect(screen.getByTestId('run-aside')).toHaveTextContent('sac');
    expect(screen.queryByTestId('sac-routing-limit')).toBeNull();
  });
});
