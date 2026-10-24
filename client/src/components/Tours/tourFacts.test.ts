import { describe, expect, it } from 'vitest';
import { heightsUnknown, movingTimeLabel, tourMetricFacts, withoutHeights } from './tourFacts';

const t = (key: string) => key;

describe('heights of a paddle tour', () => {
  it('leaves the heights of a drawn paddle tour unknown, and keeps those a paddle file recorded', () => {
    expect(heightsUnknown({ tour_type: 'kayak', has_waypoints: true })).toBe(true);
    expect(heightsUnknown({ tour_type: 'kayak' })).toBe(true);
    expect(heightsUnknown({ tour_type: 'kayak', has_waypoints: false })).toBe(false);
    expect(heightsUnknown({ tour_type: 'hike', has_waypoints: true })).toBe(false);
  });

  it('shows the distance alone once the heights are taken out', () => {
    const analysis = {
      distanceKm: 4.8,
      minEle: 970,
      maxEle: 1133,
      gain: 195,
      loss: 195,
      distanceIndexedProfileSamples: [],
    };
    const facts = tourMetricFacts(withoutHeights(analysis), 'metric', t);
    expect(facts.map((fact) => fact.label)).toEqual(['tours.detail.distance']);
  });
});

describe('movingTimeLabel', () => {
  it('calls the time on the move paddling for a paddle tour and keeps the hike wording otherwise', () => {
    expect(movingTimeLabel({ tour_type: 'kayak' }, 'walking', t)).toBe('tours.paddle.timeEstimatedShort');
    expect(movingTimeLabel({ tour_type: 'hike' }, 'walking', t)).toBe('walking');
    expect(movingTimeLabel(undefined, 'walking', t)).toBe('walking');
    expect(movingTimeLabel({ tour_type: 'walk' }, 'walking', t)).toBe('tours.walk.timeEstimatedShort');
  });
});
