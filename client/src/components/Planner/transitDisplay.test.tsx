// FE-PLANNER-TRANSITDISPLAY-001 to FE-PLANNER-TRANSITDISPLAY-003
import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import type { TransitLegDisplay } from './transitDisplay';
import { TransitItineraryInline, TransitWalkDivider } from './transitDisplay';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

const ride: TransitLegDisplay = {
  mode: 'RAIL',
  line: 'XC',
  duration: 1260,
  from: { name: 'Basingstoke', time: '12:48' },
  to: { name: 'Reading', time: '13:09' },
};
const walk: TransitLegDisplay = { mode: 'WALK', duration: 240, to: { name: 'Reading station, Station Approach' } };

/** Whether a rendered element clips its text to one line. */
function clipsToOneLine(el: HTMLElement): boolean {
  return el.style.whiteSpace === 'nowrap' || el.style.textOverflow === 'ellipsis';
}

describe('TransitItineraryInline (#3139)', () => {
  it('FE-PLANNER-TRANSITDISPLAY-001: a ride shows both stop names in full', () => {
    render(<TransitItineraryInline legs={[ride]} t={t} />);
    for (const name of ['Basingstoke', 'Reading']) {
      const el = screen.getByText(name);
      expect(clipsToOneLine(el)).toBe(false);
      expect(el.style.overflowWrap).toBe('anywhere');
    }
  });

  it('FE-PLANNER-TRANSITDISPLAY-002: a ride shows its arrival time under its departure', () => {
    render(<TransitItineraryInline legs={[ride, { ...ride, to: { name: 'Oxford' } }]} t={t} />);
    expect(screen.getByText('13:09')).toBeInTheDocument();
    expect(screen.getAllByText('12:48')).toHaveLength(2);
  });
});

describe('TransitWalkDivider (#3139)', () => {
  it('FE-PLANNER-TRANSITDISPLAY-003: the walk target wraps instead of being cut off', () => {
    render(<TransitWalkDivider leg={walk} t={t} size="sm" />);
    const text = screen.getByText(/transit\.walkTo:Reading station, Station Approach/);
    expect(clipsToOneLine(text)).toBe(false);
  });
});
