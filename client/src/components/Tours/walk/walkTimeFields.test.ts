// FE-WALK-TIME-FIELDS-001 to FE-WALK-TIME-FIELDS-005: a city walk's walking time, stays and total in one
// wording for the planner and the tour detail (CW-02).
import { describe, expect, it } from 'vitest';
import { walkStaysText, walkTimeFields } from './walkTimeFields';

const t = (key: string, params?: Record<string, unknown>) =>
  ({
    'tours.planner.walkingTimeUnknown': 'Not calculated',
    'tours.planner.plannedShort': 'Planned',
    'tours.planner.plannedTotalManual': 'Manual override',
    'tours.walk.stays': 'Stays',
    'tours.walk.station.stayUnknown': 'Not known yet',
    'tours.walk.totalComputed': 'Computed',
  })[key] ?? (key === 'tours.walk.totalAtLeast' ? `at least ${String(params?.time)}` : key);

const walking = { label: 'Walking' };
const fieldsOf = (
  walkingMinutes: number | null,
  stays: { stayMinutes: number; unknownStays: number; stations: number },
  manualMinutes: number | null = null
) => walkTimeFields({ walking, walkingMinutes, stays, manualMinutes, t }).map((field) => [field.label, field.value]);

describe('walkTimeFields', () => {
  it('FE-WALK-TIME-FIELDS-001: 45 min of walking, a museum of 90 min and a cafe of 30 min make 2 h 45 min', () => {
    expect(fieldsOf(45, { stayMinutes: 120, unknownStays: 0, stations: 3 })).toEqual([
      ['Walking', '45 min'],
      ['Stays', '2 h'],
      ['Planned', '2 h 45 min'],
    ]);
  });

  it('FE-WALK-TIME-FIELDS-002: a stay not entered makes the stays and the total at least what is known', () => {
    expect(fieldsOf(45, { stayMinutes: 90, unknownStays: 1, stations: 3 })).toEqual([
      ['Walking', '45 min'],
      ['Stays', 'at least 1 h 30 min'],
      ['Planned', 'at least 2 h 15 min'],
    ]);
    // No stay entered at all plans the walking time alone, with no stays field to call them unknown.
    expect(fieldsOf(45, { stayMinutes: 0, unknownStays: 3, stations: 3 })).toEqual([
      ['Walking', '45 min'],
      ['Planned', '45 min'],
    ]);
  });

  it('FE-WALK-TIME-FIELDS-003: stays all entered as 0 are 0 min, passed through on purpose', () => {
    expect(fieldsOf(45, { stayMinutes: 0, unknownStays: 0, stations: 2 })).toEqual([
      ['Walking', '45 min'],
      ['Stays', '0 min'],
      ['Planned', '45 min'],
    ]);
  });

  it('FE-WALK-TIME-FIELDS-004: without a walking time the stays entered are a part of the total, and nothing known none', () => {
    expect(fieldsOf(null, { stayMinutes: 120, unknownStays: 0, stations: 3 })).toEqual([
      ['Walking', 'Not calculated'],
      ['Stays', '2 h'],
      ['Planned', 'at least 2 h'],
    ]);
    expect(fieldsOf(null, { stayMinutes: 0, unknownStays: 2, stations: 2 })).toEqual([
      ['Walking', 'Not calculated'],
      ['Planned', 'Not calculated'],
    ]);
  });

  it('FE-WALK-TIME-FIELDS-005: a total entered by hand keeps its label, and the computed one shows beside it', () => {
    expect(fieldsOf(45, { stayMinutes: 90, unknownStays: 1, stations: 3 }, 240)).toEqual([
      ['Walking', '45 min'],
      ['Stays', 'at least 1 h 30 min'],
      ['Planned (Manual override)', '4 h'],
      ['Computed', 'at least 2 h 15 min'],
    ]);
    expect(fieldsOf(null, { stayMinutes: 0, unknownStays: 1, stations: 1 }, 60)[2]).toEqual([
      'Computed',
      'Not calculated',
    ]);
    // A column too narrow for the full label names the manual total by what sets it apart.
    const manual = walkTimeFields({
      walking,
      walkingMinutes: 45,
      stays: { stayMinutes: 0, unknownStays: 0, stations: 2 },
      manualMinutes: 240,
      t,
    })[2];
    expect(manual).toMatchObject({ label: 'Planned (Manual override)', shortLabel: 'Manual override' });
  });

  it('keeps the walking label and its explanation as the planner hands them in', () => {
    const [first] = walkTimeFields({
      walking: { label: 'Est. walking time', shortLabel: 'Walking', info: { label: 'How', description: 'Router' } },
      walkingMinutes: 30,
      stays: { stayMinutes: 0, unknownStays: 0, stations: 2 },
      manualMinutes: null,
      t,
    });
    expect(first).toEqual({
      label: 'Est. walking time',
      shortLabel: 'Walking',
      info: { label: 'How', description: 'Router' },
      value: '30 min',
    });
  });
});

describe('walkStaysText', () => {
  it('says nothing of the stays of a walk without stations, or with none entered', () => {
    expect(walkStaysText({ stayMinutes: 0, unknownStays: 0, stations: 0 }, t)).toBeNull();
    expect(walkStaysText({ stayMinutes: 0, unknownStays: 2, stations: 2 }, t)).toBeNull();
    expect(walkStaysText({ stayMinutes: 30, unknownStays: 1, stations: 2 }, t)).toBe('at least 30 min');
  });
});
