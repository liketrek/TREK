// FE-COMP-PADDLENOTICE-001 to FE-COMP-PADDLENOTICE-011: the one line on what TREK knows about the water.
import type { PaddleCoverageRegion, RelatedObstacle } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { clearPaddleObstacles, publishPaddleObstacles } from '../../../store/paddleObstacleStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { PaddleObstacleNotice } from './PaddleObstacleNotice';

type Published = Parameters<typeof publishPaddleObstacles>[0];

const LOADING = 'Loading the obstacles along the route …';
const OFFLINE = 'Without a connection TREK loads no obstacle data. Check the water yourself.';
const FAILED = 'The obstacle data could not be loaded. Check the water yourself.';
const NO_DATA = 'No obstacle data for this area. Check weirs, locks and portages here yourself.';
const TRUNCATED = 'TREK shows only part of the objects here; the area holds more. Check the water yourself.';
const UNKNOWN_DATE = 'an unknown date';

const partialLine = (date: string): string =>
  `Obstacle data covers only part of the route (as of ${date}). Check the rest yourself.`;
const coveredLine = (count: number, date: string): string =>
  `${count} obstacles and access points along the route, from OpenStreetMap as of ${date}. The data can have gaps, so check the water yourself.`;
const coveredOneLine = (date: string): string =>
  `1 obstacle or access point along the route, from OpenStreetMap as of ${date}. The data can have gaps, so check the water yourself.`;
const coveredEmptyLine = (date: string): string =>
  `No known obstacles along the route (OpenStreetMap as of ${date}). Check the water yourself all the same.`;

/**
 * A region TREK holds data for. Its date is local noon, so it reads as the
 * same day in whatever time zone the suite runs.
 */
const region = (id: string, sourceTimestamp: string | null): PaddleCoverageRegion => ({
  id,
  name: `Region ${id}`,
  source_timestamp: sourceTimestamp,
  imported_at: '2026-10-01T08:00:00Z',
});

/** A weir the route runs over, `alongM` metres from its start. */
const weir = (ref: string, alongM: number): RelatedObstacle => ({
  feature: {
    ref,
    kind: 'weir',
    group_key: null,
    name: null,
    geometry: { type: 'Point', coordinates: [13.4, 52.5] },
    tags: { waterway: 'weir' },
    tag_hash: `hash-${ref}`,
    region_id: 'brandenburg',
  },
  relation: 'on_route',
  distanceM: 0,
  alongM,
});

/** Publishes a ready answer for a route one region covers wholly, with nothing on it; `overrides` change that. */
function publish(overrides: Partial<Published> = {}): void {
  publishPaddleObstacles({
    status: 'ready',
    features: [],
    related: [],
    routeLengthM: 8000,
    coverage: 'covered',
    regions: [region('brandenburg', '2026-06-15T12:00:00')],
    truncated: false,
    ...overrides,
  });
}

beforeEach(() => {
  resetAllStores();
  // The data date reads in the user's language.
  seedStore(useSettingsStore, { settings: { language: 'en' } });
});

describe('PaddleObstacleNotice', () => {
  it('FE-COMP-PADDLENOTICE-001: before anything is read it says the obstacles are loading, as a status with a spinner', () => {
    render(<PaddleObstacleNotice />);

    expect(screen.getByRole('status')).toHaveTextContent(LOADING);
    expect(screen.getByRole('status').querySelector('svg.animate-spin')).not.toBeNull();
  });

  it('FE-COMP-PADDLENOTICE-002: offline it says no data is loaded, even while the store still holds a covered answer', () => {
    publish({ status: 'offline', related: [weir('node/1', 500)] });
    render(<PaddleObstacleNotice />);

    expect(screen.getByText(OFFLINE)).toBeInTheDocument();
    // A warning, not a status line: there is nothing to rely on.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLENOTICE-003: a failed read says the data could not be loaded', () => {
    publish({ status: 'error' });
    render(<PaddleObstacleNotice />);

    expect(screen.getByText(FAILED)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLENOTICE-004: an area without data says to check the water there instead of reading as open water', () => {
    publish({ coverage: 'none', regions: [], truncated: true });
    render(<PaddleObstacleNotice />);

    expect(screen.getByText(NO_DATA)).toBeInTheDocument();
    expect(screen.queryByText(TRUNCATED)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLENOTICE-005: a partly covered route names the oldest date among its regions', () => {
    publish({
      coverage: 'partial',
      // Out of order and one without a date: the route is only as current as its oldest dated part.
      regions: [region('spree', '2026-06-20T12:00:00'), region('havel', '2026-05-10T12:00:00'), region('oder', null)],
      truncated: true,
    });
    render(<PaddleObstacleNotice />);

    expect(screen.getByText(partialLine('May 10, 2026'))).toBeInTheDocument();
    // That only part of the route is covered matters more than an answer cut at its limit.
    expect(screen.queryByText(TRUNCATED)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLENOTICE-006: without a dated region the date reads as unknown', () => {
    publish({ coverage: 'partial', regions: [region('spree', null), region('havel', '')] });
    render(<PaddleObstacleNotice />);

    expect(screen.getByText(partialLine(UNKNOWN_DATE))).toBeInTheDocument();
  });

  it('FE-COMP-PADDLENOTICE-007: an answer cut at its limit says the area holds more instead of counting', () => {
    publish({ truncated: true, related: [weir('node/1', 500), weir('node/2', 2500)] });
    render(<PaddleObstacleNotice />);

    expect(screen.getByText(TRUNCATED)).toBeInTheDocument();
    expect(screen.queryByText(/obstacles and access points/)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLENOTICE-008: a covered route counts what lies on or near it, with the date, as a status', () => {
    const related: RelatedObstacle[] = [
      weir('node/1', 500),
      weir('way/2', 2500),
      { ...weir('node/3', 6000), relation: 'near', distanceM: 90 },
    ];
    // A fourth object is read in the area but lies off the route, so it is not counted.
    publish({ features: [...related.map((item) => item.feature), weir('node/4', 0).feature], related });
    render(<PaddleObstacleNotice />);

    expect(screen.getByRole('status')).toHaveTextContent(coveredLine(3, 'Jun 15, 2026'));
  });

  it('FE-COMP-PADDLENOTICE-009: one object on the route reads in the singular', () => {
    publish({ related: [weir('node/1', 500)] });
    render(<PaddleObstacleNotice />);

    expect(screen.getByRole('status')).toHaveTextContent(coveredOneLine('Jun 15, 2026'));
  });

  it('FE-COMP-PADDLENOTICE-010: a covered route with nothing on it still says to check the water, dated or not', () => {
    publish();
    render(<PaddleObstacleNotice />);
    expect(screen.getByRole('status')).toHaveTextContent(coveredEmptyLine('Jun 15, 2026'));

    act(() => {
      publish({ regions: [region('brandenburg', null)] });
    });
    expect(screen.getByRole('status')).toHaveTextContent(coveredEmptyLine(UNKNOWN_DATE));
  });

  it('FE-COMP-PADDLENOTICE-011: follows the store from loading to the answer, and back when the tour closes', () => {
    publish({ status: 'loading' });
    render(<PaddleObstacleNotice />);
    expect(screen.getByRole('status')).toHaveTextContent(LOADING);

    act(() => {
      publish({ related: [weir('node/1', 500)] });
    });
    expect(screen.getByRole('status')).toHaveTextContent(coveredOneLine('Jun 15, 2026'));

    act(() => {
      clearPaddleObstacles();
    });
    expect(screen.getByRole('status')).toHaveTextContent(LOADING);
  });
});
