// FE-PLANNER-BKTRANSIT-001 to FE-PLANNER-BKTRANSIT-008
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../../tests/helpers/render';
import type { TransitLegDisplay } from '../transitDisplay';
import { TransitLegs, transitSummary } from './transitParts';

const ride: TransitLegDisplay = {
  mode: 'SUBWAY',
  line: 'U2',
  line_color: '#dc2626',
  line_text_color: '#ffffff',
  duration: 600,
  headsign: 'Pankow',
  agency: 'BVG',
  stops: 5,
  from: { name: 'Alexanderplatz', time: '10:02', track: '1' },
  to: { name: 'Eberswalder Str.', time: '10:12' },
};
const walk: TransitLegDisplay = { mode: 'WALK', duration: 240, to: { name: 'Mauerpark' } };

describe('transitSummary', () => {
  it('FE-PLANNER-BKTRANSIT-001: anything that is not a transit journey has no summary', () => {
    expect(transitSummary({})).toBeNull();
    expect(transitSummary({ transit: { legs: 'none' } })).toBeNull();
  });

  it('FE-PLANNER-BKTRANSIT-002: reads the stored totals', () => {
    const s = transitSummary({ transit: { legs: [ride, walk], duration: 1500, transfers: 2, walk_seconds: 300 } });
    expect(s).toEqual({ legs: [ride, walk], duration: 1500, transfers: 2, walk: 300 });
  });

  it('FE-PLANNER-BKTRANSIT-003: an older entry counts transfers and walking from its legs', () => {
    const s = transitSummary({ transit: { legs: [walk, ride, { ...ride, line: 'U8' }, { mode: 'WALK' }] } });
    expect(s).toMatchObject({ duration: null, transfers: 1, walk: 240 });
  });

  it('FE-PLANNER-BKTRANSIT-004: a zero duration or a walk-only journey', () => {
    expect(transitSummary({ transit: { legs: [walk], duration: 0 } })).toMatchObject({ duration: null, transfers: 0, walk: 240 });
  });
});

describe('TransitLegs', () => {
  it('FE-PLANNER-BKTRANSIT-005: a ride shows its line, stops and facts', () => {
    render(<TransitLegs legs={[ride]} />);
    const line = screen.getByText('U2');
    expect(line).toHaveStyle({ background: '#dc2626', color: '#ffffff' });
    expect(screen.getByText('Alexanderplatz')).toBeInTheDocument();
    expect(screen.getByText('Eberswalder Str.')).toBeInTheDocument();
    expect(screen.getByText('10:02 → 10:12')).toBeInTheDocument();
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('5 stops')).toBeInTheDocument();
    expect(screen.getByText('Platform 1')).toBeInTheDocument();
    expect(screen.getByText('Pankow')).toBeInTheDocument();
    expect(screen.getByText('BVG')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKTRANSIT-006: a walk reads as one and leaves out the ride facts', () => {
    render(<TransitLegs legs={[walk]} compact />);
    expect(screen.getByText('Walk to Mauerpark')).toBeInTheDocument();
    expect(screen.getByText('4 min')).toBeInTheDocument();
    expect(screen.queryByText(/stops/)).toBeNull();
  });

  it('FE-PLANNER-BKTRANSIT-007: a line without its own colour and a leg without times or name', () => {
    render(<TransitLegs legs={[{ mode: 'BUS', from: { name: 'A' }, to: { name: 'B' } }, { mode: 'WALK' }]} compact />);
    expect(screen.getByText('BUS')).toHaveStyle({ background: 'var(--bg-tertiary)' });
    expect(screen.getByText('Walk to')).toBeInTheDocument();
    expect(screen.queryByText(/min$/)).toBeNull();
  });

  it('FE-PLANNER-BKTRANSIT-008: a coloured line without a text colour is written in white', () => {
    render(<TransitLegs legs={[{ mode: 'TRAM', line: 'M10', line_color: '#16a34a', from: { name: 'A', time: '09:00' }, to: { name: 'B' } }]} />);
    expect(screen.getByText('M10')).toHaveStyle({ color: '#fff' });
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });
});
