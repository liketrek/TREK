import { describe, expect, it } from 'vitest';
import { formatRunPace, parseRunPace, runPaceInvalid, runPaceUnitText } from './runPace';
import { runPaceText } from './runPaceText';

// FE-TOUR-RUN-PACE-001 to FE-TOUR-RUN-PACE-004

describe('run pace (RUN-01)', () => {
  it('FE-TOUR-RUN-PACE-001: reads min:s, whole minutes, minutes and a tenth, two digits after a point as seconds, and nothing as no pace', () => {
    expect(parseRunPace('6:00')).toBe(360);
    expect(parseRunPace(' 5:07 ')).toBe(307);
    expect(parseRunPace('6')).toBe(360);
    expect(parseRunPace('5,5')).toBe(330);
    expect(parseRunPace('5.5')).toBe(330);
    // "5.30" and "5,45" are 5:30 and 5:45 as written in much of Europe, not 5.3 or 5.45 minutes.
    expect(parseRunPace('5.30')).toBe(330);
    expect(parseRunPace('5,45')).toBe(345);
    expect(parseRunPace('5.05')).toBe(305);
    expect(parseRunPace('')).toBeNull();
    expect(parseRunPace('   ')).toBeNull();
  });

  it('FE-TOUR-RUN-PACE-002: anything else is no pace, seconds of 60 or more included', () => {
    for (const text of ['5:60', '5:7', '5.60', '5,75', '5.305', 'fast', '6 min', '-5', '5:30:00', '123']) {
      expect(parseRunPace(text)).toBeNaN();
    }
  });

  it('FE-TOUR-RUN-PACE-003: writes a pace as min:s and holds it to the bounds a run is saved with', () => {
    expect(formatRunPace(360)).toBe('6:00');
    expect(formatRunPace(307)).toBe('5:07');
    expect(formatRunPace(1200)).toBe('20:00');
    expect(runPaceInvalid(null)).toBe(false);
    expect(runPaceInvalid(360)).toBe(false);
    expect([Number.NaN, 0, 119, 1201].map(runPaceInvalid)).toEqual([true, true, true, true]);
  });

  it('FE-TOUR-RUN-PACE-004: with distances in miles a pace is read and written per mile and kept per km', () => {
    expect(parseRunPace('9:39', 'imperial')).toBe(360);
    expect(parseRunPace('8', 'imperial')).toBe(298);
    expect(parseRunPace('', 'imperial')).toBeNull();
    expect(parseRunPace('9:75', 'imperial')).toBeNaN();
    expect(formatRunPace(360, 'imperial')).toBe('9:39');
    expect(formatRunPace(parseRunPace('9:39', 'imperial') ?? 0, 'imperial')).toBe('9:39');
    expect(formatRunPace(360, 'metric')).toBe('6:00');
    const t = (key: string) => key;
    expect(runPaceUnitText('imperial', t)).toBe('tours.run.paceUnitMi');
    expect(runPaceUnitText('metric', t)).toBe('tours.run.paceUnit');
    const run = { tour_type: 'run' as const, run_pace_seconds_per_km: 360 };
    expect(runPaceText(run, t, 'imperial')).toBe('9:39 tours.run.paceUnitMi');
    expect(runPaceText(run, t)).toBe('6:00 tours.run.paceUnit');
  });
});
